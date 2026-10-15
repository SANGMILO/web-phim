'use client';

import React, { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Play, X, Clock } from 'lucide-react';
import type { Movie, WatchProgress } from '@/types/movie';
import { watchHistoryService } from '@/lib/watch-history';
import { MovieImage } from '@/components/common/MovieImage';

interface ContinueWatchingProps {
  allMovies: Movie[];
}

interface ItemWithMovie {
  progress: WatchProgress;
  movie: Movie;
}

export function ContinueWatching({ allMovies }: ContinueWatchingProps) {
  const history = useSyncExternalStore(
    watchHistoryService.subscribe,
    watchHistoryService.getSnapshot,
    watchHistoryService.getServerSnapshot
  );

  const items = useMemo(() => {
    const movieMap = new Map<string, Movie>();
    allMovies.forEach((m) => {
      movieMap.set(m.id, m);
      movieMap.set(m.slug, m);
    });

    const combined: ItemWithMovie[] = [];
    for (const h of history) {
      const movie = movieMap.get(h.movieId);
      if (movie) {
        combined.push({ progress: h, movie });
      }
    }
    return combined;
  }, [allMovies, history]);

  const handleRemove = (e: React.MouseEvent, movieId: string) => {
    e.preventDefault();
    e.stopPropagation();
    watchHistoryService.remove(movieId);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="section-spacing" style={{ paddingTop: '20px', paddingBottom: '30px' }}>
      <div className="container-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '4px',
                height: '20px',
                backgroundColor: 'var(--accent-crimson)',
                borderRadius: '2px',
                display: 'inline-block',
              }}
            />
            <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700 }}>
              Tiếp tục xem
            </h2>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {items.map(({ progress, movie }) => {
            const watchUrl = progress.episodeId
              ? `/watch/${movie.slug}?ep=${progress.episodeId}`
              : `/watch/${movie.slug}`;

            return (
              <div
                key={movie.id}
                style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
                className="hover-card"
              >
                <Link href={watchUrl} style={{ display: 'block' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%' }}>
                    <MovieImage
                      src={movie.backdropUrl || movie.posterUrl}
                      alt={movie.title}
                      fallbackTitle={movie.title}
                      fill
                      sizes="300px"
                      style={{ objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(8,9,12,0.9) 0%, transparent 60%)',
                      }}
                    />
                    {/* Play icon overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'rgba(229, 57, 79, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        }}
                      >
                        <Play size={18} fill="white" color="white" style={{ marginLeft: '2px' }} />
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemove(e, movie.id)}
                      title="Xóa khỏi lịch sử"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 4,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(229, 57, 79, 0.9)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
                    >
                      <X size={14} />
                    </button>

                    {/* Progress bar */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(5, progress.progress))}%`,
                          background: 'var(--accent-crimson)',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px' }}>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '4px',
                      }}
                    >
                      {movie.title}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>
                        {progress.episodeId ? `Tập ${progress.episodeId.replace(/^\D+/g, '') || progress.episodeId}` : 'Phim lẻ'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {progress.progress}%
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
