'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Bookmark, BookmarkCheck, Play, Share2, Sparkles, Tv } from 'lucide-react';
import type { Episode, Movie, PlaybackSource } from '@/types/movie';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { MovieRail } from '@/components/movie/MovieRail';
import { MovieImage } from '@/components/common/MovieImage';
import { PlaybackPlayer } from '@/components/movie/PlaybackPlayer';

interface Props {
  movie: Movie;
  related: Movie[];
}

type Selection = { kind: 'trailer' } | { kind: 'source'; source: PlaybackSource };

export function DriveWatchClient({ movie, related }: Props) {
  const searchParams = useSearchParams();
  const { has, toggle } = useWatchlist();
  const [copied, setCopied] = useState(false);
  const episodes = useMemo<Episode[]>(() => {
    if (movie.seasons?.length) return movie.seasons.flatMap((season) => season.episodes);
    return movie.episodes ?? [];
  }, [movie]);
  const requestedEpisode = Number(searchParams.get('ep') ?? 1);
  const currentEpisode = episodes.find((episode) => episode.number === requestedEpisode) ?? episodes[0] ?? null;
  const availableSources = currentEpisode?.source
    ? [currentEpisode.source]
    : (movie.playbackSources ?? []);
  const initialSelection: Selection | null = availableSources[0]
    ? { kind: 'source', source: availableSources[0] }
    : movie.trailerUrl
      ? { kind: 'trailer' }
      : null;
  const [manualSelection, setManualSelection] = useState<Selection | null>(null);
  const selection = manualSelection?.kind === 'source' && !availableSources.some((source) => source.id === manualSelection.source.id)
    ? initialSelection
    : manualSelection ?? initialSelection;
  const isSeries = movie.contentType === 'series' || movie.contentType === 'anime' || episodes.length > 0;

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="container-main" style={{ paddingBottom: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0', fontSize: 14, color: 'var(--text-muted)' }}>
          <Link href={`/movie/${movie.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={16} /> Thông tin phim</Link>
          <span>/</span><span style={{ color: 'var(--text-primary)' }}>{movie.title}</span>
          {currentEpisode && <><span>/</span><span style={{ color: 'var(--accent-crimson)' }}>Tập {currentEpisode.number}</span></>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nguồn phát:</span>
          {availableSources.map((source) => (
            <button key={source.id} onClick={() => setManualSelection({ kind: 'source', source })} className={`chip ${selection?.kind === 'source' && selection.source.id === source.id ? 'chip-active' : ''}`}>
              <Play size={12} /> {source.label}
            </button>
          ))}
          {movie.trailerUrl && <button onClick={() => setManualSelection({ kind: 'trailer' })} className={`chip ${selection?.kind === 'trailer' ? 'chip-active' : ''}`}><Sparkles size={12} /> Trailer</button>}
          {!selection && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chưa có nguồn video.</span>}
        </div>

        <div className="watch-layout" style={{ display: 'grid', gridTemplateColumns: isSeries && episodes.length ? 'minmax(0, 1fr) 340px' : '1fr', gap: 24, alignItems: 'start' }}>
          <div>
            {selection?.kind === 'trailer' && movie.trailerUrl ? (
              <div className="player-container"><iframe src={movie.trailerUrl} title={`Trailer ${movie.title}`} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen style={{ width: '100%', height: '100%', border: 0 }} /></div>
            ) : (
              <PlaybackPlayer source={selection?.kind === 'source' ? selection.source : null} directUrl={currentEpisode?.playbackUrl ?? movie.playbackUrl} posterUrl={movie.backdropUrl} title={currentEpisode ? `${movie.title} - ${currentEpisode.title}` : movie.title} />
            )}

            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div><h1 className="font-display" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>{movie.title}{currentEpisode ? ` — Tập ${currentEpisode.number}: ${currentEpisode.title}` : ''}</h1><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{movie.year} · {movie.genres.join(', ')}</p></div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => toggle(movie.id)} className="btn btn-secondary">{has(movie.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{has(movie.id) ? 'Đã lưu' : 'Lưu phim'}</button>
                  <button onClick={copyLink} className="btn btn-secondary"><Share2 size={16} />{copied ? 'Đã sao chép' : 'Chia sẻ'}</button>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 14, maxWidth: 800 }}>{currentEpisode?.overview ?? movie.overview}</p>
            </div>
          </div>

          {isSeries && episodes.length > 0 && (
            <aside style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', padding: 16, maxHeight: 640, overflowY: 'auto' }}>
              <h2 style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 15, marginBottom: 14 }}><Tv size={16} color="var(--accent-crimson)" /> Danh sách tập ({episodes.length})</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {episodes.map((episode) => (
                  <Link key={episode.id} href={`/watch/${movie.slug}?ep=${episode.number}`} onClick={() => setManualSelection(null)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 'var(--radius-sm)', background: episode.id === currentEpisode?.id ? 'rgba(229,57,79,0.15)' : 'var(--bg-elevated)', border: `1px solid ${episode.id === currentEpisode?.id ? 'rgba(229,57,79,0.4)' : 'transparent'}` }}>
                    <div style={{ position: 'relative', width: 64, aspectRatio: '16/9', overflow: 'hidden', borderRadius: 4, flexShrink: 0 }}><MovieImage src={episode.thumbnailUrl || movie.backdropUrl || movie.posterUrl} alt={episode.title} fill sizes="64px" style={{ objectFit: 'cover' }} /></div>
                    <span><strong style={{ fontSize: 13 }}>{episode.title}</strong><small style={{ display: 'block', color: 'var(--text-muted)' }}>Mùa {episode.seasonNumber ?? 1} · Tập {episode.number}</small></span>
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </div>

        {related.length > 0 && <div style={{ marginTop: 60 }}><MovieRail title="Phim cùng thể loại nên xem" movies={related} showGenre /></div>}
      </div>
    </div>
  );
}
