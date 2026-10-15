'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import type { Movie, Episode } from '@/types/movie';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { watchHistoryService } from '@/lib/watch-history';
import { MovieRail } from '@/components/movie/MovieRail';
import { MovieImage } from '@/components/common/MovieImage';

interface WatchPlayerClientProps {
  movie: Movie;
  related: Movie[];
}

export function WatchPlayerClient({ movie, related }: WatchPlayerClientProps) {
  const searchParams = useSearchParams();
  const epParam = searchParams.get('ep');
  const { has, toggle } = useWatchlist();

  const isSeries = movie.contentType === 'series' || movie.contentType === 'anime' || (movie.seasons && movie.seasons.length > 0);
  
  // Resolve episodes list
  const allEpisodes: Episode[] = React.useMemo(() => {
    if (movie.seasons && movie.seasons.length > 0) {
      return movie.seasons.flatMap((s) => s.episodes);
    }
    return movie.episodes || [];
  }, [movie]);

  const currentEpNumber = epParam ? parseInt(epParam, 10) : 1;
  const currentEpisode = allEpisodes.find((e) => e.number === currentEpNumber) || allEpisodes[0] || null;

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

  // Trailers are explicitly labeled; playback is shown only when a real source exists.
  const [selectedServer, setSelectedServer] = useState<'official' | 'stream'>(
    movie.trailerUrl ? 'official' : 'stream'
  );

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoSource = movie.playbackUrl || currentEpisode?.playbackUrl;

  // Track & persist watch progress
  useEffect(() => {
    if (!currentTime || !duration) return;
    const progressPercent = Math.round((currentTime / duration) * 100);
    if (progressPercent > 0) {
      watchHistoryService.save({
        movieId: movie.slug,
        episodeId: isSeries && currentEpisode ? `t${currentEpisode.number}` : undefined,
        progress: progressPercent,
        lastWatched: new Date().toISOString(),
      });
    }
  }, [currentTime, duration, movie.slug, isSeries, currentEpisode]);

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

  const isInWatchlist = has(movie.id);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="container-main" style={{ paddingBottom: '60px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 16px', fontSize: '14px', color: 'var(--text-muted)' }}>
          <Link href={`/movie/${movie.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Quay lại thông tin phim
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>{movie.title}</span>
          {isSeries && currentEpisode && (
            <>
              <span>/</span>
              <span style={{ color: 'var(--accent-crimson)' }}>Tập {currentEpisode.number}</span>
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
          {movie.trailerUrl && (
            <button
              onClick={() => setSelectedServer('official')}
              className={`chip ${selectedServer === 'official' ? 'chip-active' : ''}`}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} /> Trailer chính thức
            </button>
          )}
          {videoSource && <button
            onClick={() => setSelectedServer('stream')}
            className={`chip ${selectedServer === 'stream' ? 'chip-active' : ''}`}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Nguồn video đã cấu hình
          </button>}
          {!movie.trailerUrl && !videoSource && (
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chưa có nguồn video cho phim này.</span>
          )}
        </div>

        {/* Video Player & Episodes Container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isSeries && allEpisodes.length > 0 ? 'minmax(0, 1fr) 340px' : '1fr',
            gap: '24px',
            alignItems: 'start',
          }}
          className="watch-layout"
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
              {selectedServer === 'official' && movie.trailerUrl ? (
                <iframe
                  src={`${movie.trailerUrl}?autoplay=1&rel=0&enablejsapi=1`}
                  title={movie.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
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
                      // Gracefully fallback to official YouTube embed if video fails to load
                      if (movie.trailerUrl) {
                        setSelectedServer('official');
                      }
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
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '16px',
                maxHeight: '640px',
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
                        <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ep.title}
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
