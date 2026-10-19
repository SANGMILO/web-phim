'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Bookmark,
  BookmarkCheck,
  Share2,
  Tv,
  ArrowLeft,
  Server,
  Sparkles,
  Film,
} from 'lucide-react';
import type { Movie, Episode } from '@/types/movie';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { watchHistoryService } from '@/lib/watch-history';
import { MovieRail } from '@/components/movie/MovieRail';
import { MovieImage } from '@/components/common/MovieImage';
import { toGoogleDriveEmbedUrl, isGoogleDriveUrl } from '@/lib/utils/google-drive';
import { MovieReviews } from '@/components/movie/MovieReviews';
import { movieStore } from '@/lib/movies/movie-storage';
import { toYouTubeEmbedUrl } from '@/lib/utils/youtube';

interface WatchPlayerClientProps {
  movie: Movie | null;
  slugOrId?: string;
  related: Movie[];
}

export function WatchPlayerClient({ movie: initialMovie, slugOrId, related }: WatchPlayerClientProps) {
  const searchParams = useSearchParams();
  const epParam = searchParams.get('ep');
  const { has, toggle } = useWatchlist();

  const targetId = slugOrId || initialMovie?.slug || initialMovie?.id || '';

  const storeMovie = useSyncExternalStore(
    movieStore.subscribe.bind(movieStore),
    () => (targetId ? movieStore.getMovieById(targetId) : null),
    () => null
  );

  const movie = storeMovie || initialMovie;

  const isSeries = Boolean(
    movie?.contentType === 'series' ||
    movie?.contentType === 'anime' ||
    (!movie?.contentType && movie?.seasons && movie.seasons.length > 0)
  );
  
  // Resolve episodes list
  const allEpisodes: Episode[] = React.useMemo(() => {
    if (!movie) return [];
    if (movie.seasons && movie.seasons.length > 0) {
      return movie.seasons.flatMap((s) => s.episodes);
    }
    return movie.episodes || [];
  }, [movie]);

  const currentEpNumber = epParam ? (parseInt(epParam, 10) || 1) : 1;
  const currentEpisode = allEpisodes.find((e) => e.number === currentEpNumber) || allEpisodes[0] || null;

  // Resolve Google Drive stream URL:
  // - If this specific episode has a Drive link, use it.
  // - For single movies or Episode 1, fallback to movie-level drive link if provided
  const episodeDrive =
    currentEpisode?.gdriveUrl ||
    (isGoogleDriveUrl(currentEpisode?.playbackUrl) ? currentEpisode?.playbackUrl : null);

  const movieDrive =
    movie?.gdriveUrl ||
    (movie?.playbackSources?.find((s) => s.provider === 'google_drive')?.externalFileId) ||
    (isGoogleDriveUrl(movie?.playbackUrl) ? movie?.playbackUrl : null);

  const isEp1 = !epParam || currentEpNumber === 1 || allEpisodes.length <= 1;

  const rawGdrive =
    episodeDrive ||
    (!isSeries || isEp1 ? movieDrive : null);

  const gdriveSource = toGoogleDriveEmbedUrl(rawGdrive);
  const hasGdrive = Boolean(gdriveSource);
  const trailerEmbedUrl = toYouTubeEmbedUrl(movie?.trailerUrl, {
    autoplay: true,
    enableJsApi: true,
  });

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCopied, setIsCopied] = useState(false);

  // User manual server override
  const [userServer, setUserServer] = useState<'gdrive' | 'official' | 'stream' | null>(null);

  // Reset user server override when switching episodes or movies
  useEffect(() => {
    // This local override intentionally resets when the playback identity changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserServer(null);
  }, [currentEpNumber, movie?.id]);

  // Resolve direct video source (non-Drive MP4/HLS) if any
  const episodeVideoSource = currentEpisode?.playbackUrl && !isGoogleDriveUrl(currentEpisode.playbackUrl)
    ? currentEpisode.playbackUrl
    : null;
  const movieVideoSource = movie?.playbackUrl && !isGoogleDriveUrl(movie.playbackUrl)
    ? movie.playbackUrl
    : null;
  const directVideoSource = (isSeries && allEpisodes.length > 1)
    ? episodeVideoSource
    : (episodeVideoSource || movieVideoSource);

  // Effective default server logic:
  // 1. If Google Drive link exists for this episode/movie -> 'gdrive'
  // 2. Else if direct video source exists -> 'stream'
  // 3. Else fallback to Official Trailer HD if trailer exists -> 'official'
  // 4. Default to 'stream'
  const defaultServer: 'gdrive' | 'official' | 'stream' = hasGdrive
    ? 'gdrive'
    : directVideoSource
    ? 'stream'
    : trailerEmbedUrl
    ? 'official'
    : 'stream';

  // Priority: If Google Drive is available, always default to 'gdrive' unless user explicitly switched to another source during this playback
  const selectedServer = (userServer && (userServer !== 'official' || !hasGdrive))
    ? userServer
    : defaultServer;
  const setSelectedServer = (srv: 'gdrive' | 'official' | 'stream') => setUserServer(srv);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoSource = directVideoSource || undefined;

  // Track & persist watch progress
  useEffect(() => {
    if (!currentTime || !duration || !movie) return;
    const progressPercent = Math.round((currentTime / duration) * 100);
    if (progressPercent > 0) {
      watchHistoryService.save({
        movieId: movie.slug,
        episodeId: isSeries && currentEpisode ? `t${currentEpisode.number}` : undefined,
        progress: progressPercent,
        lastWatched: new Date().toISOString(),
      });
    }
  }, [currentTime, duration, movie, isSeries, currentEpisode]);

  // Video event handlers
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      Math.max(0, videoRef.current.currentTime + seconds),
      duration || 0
    );
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const isInWatchlist = movie ? has(movie.id) : false;

  if (!movie) {
    return (
      <div
        className="container-main"
        style={{
          paddingTop: '140px',
          paddingBottom: '80px',
          textAlign: 'center',
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Film size={54} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          Đang chuẩn bị trình phát video...
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '480px', marginBottom: '24px' }}>
          Hệ thống đang tải dữ liệu phim từ kho lưu trữ.
        </p>
        <Link href="/" className="btn btn-primary">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="container-main" style={{ paddingBottom: '60px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 16px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <Link href={`/movie/${movie.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            <ArrowLeft size={16} /> Thông tin phim
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', maxWidth: 'min(280px, 50vw)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.title}</span>
          {isSeries && currentEpisode && (
            <>
              <span>/</span>
              <span style={{ color: 'var(--accent-crimson)', whiteSpace: 'nowrap' }}>Tập {currentEpisode.number}</span>
            </>
          )}
        </div>

        {/* Server Selector Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginRight: '6px' }}>
            <Server size={14} /> Nguồn phát:
          </div>

          {hasGdrive ? (
            <button
              onClick={() => setSelectedServer('gdrive')}
              className={`chip ${selectedServer === 'gdrive' ? 'chip-active' : ''}`}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                fontWeight: 700,
                background: selectedServer === 'gdrive' ? '#2ed573' : undefined,
                color: selectedServer === 'gdrive' ? '#08090C' : undefined,
                border: selectedServer === 'gdrive' ? '1px solid #2ed573' : undefined,
              }}
            >
              <Tv size={13} style={{ display: 'inline', marginRight: '5px' }} />
              Server VIP (Full HD)
            </button>
          ) : (
            <span
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Tv size={13} />
              Server VIP: Đang cập nhật
            </span>
          )}

          {trailerEmbedUrl && (
            <button
              onClick={() => setSelectedServer('official')}
              className={`chip ${selectedServer === 'official' ? 'chip-active' : ''}`}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                fontWeight: selectedServer === 'official' ? 700 : 500,
                background: selectedServer === 'official' ? 'var(--accent-crimson)' : undefined,
                color: selectedServer === 'official' ? '#fff' : undefined,
              }}
            >
              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {hasGdrive ? 'Trailer HD' : 'Trailer HD (Đang phát)'}
            </button>
          )}

          {directVideoSource && (
            <button
              onClick={() => setSelectedServer('stream')}
              className={`chip ${selectedServer === 'stream' ? 'chip-active' : ''}`}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Nguồn dự phòng
            </button>
          )}

          {!hasGdrive && !trailerEmbedUrl && !directVideoSource && (
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chưa có nguồn video cho phim này.</span>
          )}
        </div>

        {/* Unlinked Episode / Movie Notice: Auto fallback to Trailer */}
        {!hasGdrive && trailerEmbedUrl && (
          <div
            style={{
              marginBottom: '18px',
              padding: '12px 18px',
              background: 'rgba(235, 94, 40, 0.1)',
              border: '1px solid rgba(235, 94, 40, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#ff922b',
            }}
          >
            <Sparkles size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>
                {isSeries && currentEpisode
                  ? `${currentEpisode.title} đang chờ cập nhật bản phim:`
                  : 'Phim đang chờ cập nhật bản phát sóng:'}
              </strong>
              <span style={{ color: 'rgba(255,255,255,0.8)', marginLeft: '6px' }}>
                Hệ thống đang tự động phát <strong>Trailer HD</strong> giới thiệu để bạn xem trước nội dung. Khi có bản Full HD, phim sẽ tự động phát bản đẹp nhất.
              </span>
            </span>
          </div>
        )}

        {/* Video Player & Episodes Container */}
        <div
          className={`watch-layout ${isSeries && allEpisodes.length > 0 ? 'watch-layout-series' : ''}`}
        >
          {/* Main Video Viewport */}
          <div>
            <div
              ref={playerContainerRef}
              onMouseMove={handleMouseMove}
              style={{
                position: 'relative',
                aspectRatio: '16/9',
                background: '#000',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              }}
            >
              {selectedServer === 'gdrive' && gdriveSource ? (
                <iframe
                  key={`gdrive-${movie.id}-${currentEpNumber}-${gdriveSource}`}
                  src={gdriveSource}
                  title={`${movie.title} - Full HD`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : selectedServer === 'official' && trailerEmbedUrl ? (
                <iframe
                  key={`trailer-${movie.id}-${currentEpNumber}-${trailerEmbedUrl}`}
                  src={trailerEmbedUrl}
                  title={movie.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={videoSource}
                    poster={movie.backdropUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onError={() => {
                      // Handled gracefully without overriding manual server selection
                    }}
                    onClick={togglePlay}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />

                  {/* Big Play Overlay when paused */}
                  {!videoSource ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: 'rgba(0,0,0,0.65)', zIndex: 10 }}>
                      <p style={{ color: 'var(--text-secondary)' }}>Chưa có nguồn video thật. Nội dung hiện tại chỉ dùng để minh họa giao diện.</p>
                    </div>
                  ) : !isPlaying && (
                    <div
                      onClick={togglePlay}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.4)',
                        cursor: 'pointer',
                        zIndex: 10,
                      }}
                    >
                      <div
                        style={{
                          width: '68px',
                          height: '68px',
                          borderRadius: '50%',
                          background: 'var(--accent-crimson)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 32px rgba(229,57,79,0.5)',
                        }}
                      >
                        <Play size={32} fill="white" color="white" style={{ marginLeft: '4px' }} />
                      </div>
                    </div>
                  )}

                  {/* Player Custom Controls */}
                  {videoSource && <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '24px 20px 16px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)',
                      zIndex: 20,
                      opacity: showControls ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: showControls ? 'auto' : 'none',
                    }}
                  >
                    {/* Progress Slider */}
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      style={{
                        width: '100%',
                        cursor: 'pointer',
                        accentColor: 'var(--accent-crimson)',
                        height: '5px',
                        marginBottom: '12px',
                      }}
                    />

                    {/* Bottom controls bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={togglePlay} style={{ color: 'white' }}>
                          {isPlaying ? <Pause size={20} /> : <Play size={20} fill="white" />}
                        </button>

                        <button onClick={() => handleSkip(-10)} style={{ color: 'var(--text-secondary)' }} title="Lùi 10s">
                          <RotateCcw size={18} />
                        </button>
                        <button onClick={() => handleSkip(10)} style={{ color: 'var(--text-secondary)' }} title="Tiến 10s">
                          <RotateCw size={18} />
                        </button>

                        {/* Volume */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={toggleMute} style={{ color: 'white' }}>
                            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            style={{ width: '60px', accentColor: 'white', height: '4px' }}
                          />
                        </div>

                        {/* Time display */}
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Playback speed */}
                        <select
                          value={playbackRate}
                          onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            fontSize: '12px',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value={0.75} style={{ background: '#111' }}>0.75x</option>
                          <option value={1} style={{ background: '#111' }}>1.0x</option>
                          <option value={1.25} style={{ background: '#111' }}>1.25x</option>
                          <option value={1.5} style={{ background: '#111' }}>1.5x</option>
                        </select>

                        {/* Subtitle tag */}
                        <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', color: 'white' }}>
                          Vietsub
                        </span>

                        <button onClick={toggleFullscreen} style={{ color: 'white' }}>
                          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>}
                </>
              )}
            </div>

            {/* Video Meta Info */}
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <h1 className="font-display" style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800 }}>
                    {movie.title}
                    {isSeries && currentEpisode && (
                      <span style={{ color: 'var(--accent-crimson)', marginLeft: '10px', fontSize: '20px' }}>
                        - Tập {currentEpisode.number}: {currentEpisode.title}
                      </span>
                    )}
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                    {movie.originalTitle} • {movie.year} • {movie.genres.join(', ')}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => toggle(movie.id)}
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      color: isInWatchlist ? 'var(--accent-crimson)' : undefined,
                    }}
                  >
                    {isInWatchlist ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    {isInWatchlist ? 'Đã lưu' : 'Lưu phim'}
                  </button>

                  <button
                    onClick={handleShare}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Share2 size={16} /> {isCopied ? 'Đã sao chép link!' : 'Chia sẻ'}
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '800px' }}>
                {isSeries && currentEpisode?.overview ? currentEpisode.overview : movie.overview}
              </p>
            </div>
          </div>

          {/* Episode Sidebar for series */}
          {isSeries && allEpisodes.length > 0 && (
            <div
              className="watch-sidebar"
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <Tv size={16} color="var(--accent-crimson)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                  Danh sách tập ({allEpisodes.length})
                </h3>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  overflowY: 'auto',
                  flex: 1,
                  paddingRight: '4px',
                }}
              >
                {allEpisodes.map((ep) => {
                  const isActive = ep.number === currentEpNumber;
                  const isEp1 = ep.number === 1;
                  const epHasDrive = Boolean(
                    ep.gdriveUrl ||
                    (ep.playbackUrl && isGoogleDriveUrl(ep.playbackUrl)) ||
                    (isEp1 && movieDrive)
                  );
                  return (
                    <Link
                      key={ep.id}
                      href={`/watch/${movie.slug}?ep=${ep.number}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'rgba(229,57,79,0.15)' : 'var(--bg-elevated)',
                        border: `1px solid ${isActive ? 'rgba(229,57,79,0.4)' : 'transparent'}`,
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Episode thumbnail */}
                      <div
                        style={{
                          position: 'relative',
                          width: '56px',
                          aspectRatio: '16/9',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <MovieImage
                          src={ep.thumbnailUrl || movie.backdropUrl || movie.posterUrl}
                          alt={ep.title}
                          fill
                          sizes="56px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{ep.title}</span>
                          {epHasDrive ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: 'rgba(46, 213, 115, 0.15)',
                                color: '#2ed573',
                                border: '1px solid rgba(46, 213, 115, 0.3)',
                                flexShrink: 0,
                              }}
                            >
                              Full HD
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 500,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--text-muted)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                flexShrink: 0,
                              }}
                            >
                              Trailer
                            </span>
                          )}
                        </div>
                        {ep.runtime && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {ep.runtime} phút
                          </div>
                        )}
                      </div>

                      {isActive && <Play size={12} fill="var(--accent-crimson)" color="var(--accent-crimson)" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Movie Reviews & Community Discussion */}
        <MovieReviews movieId={movie.id} movieTitle={movie.title} />

        {/* Related titles */}
        {related.length > 0 && (
          <div style={{ marginTop: '60px' }}>
            <MovieRail title="Phim cùng thể loại nên xem" movies={related} showGenre />
          </div>
        )}
      </div>
    </div>
  );
}
