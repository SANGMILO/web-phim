'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Star,
  Clock,
  Calendar,
  Globe,
  Bookmark,
  BookmarkCheck,
  Users,
  Film,
  Tv,
} from 'lucide-react';
import type { Movie } from '@/types/movie';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { TrailerModal } from '@/components/movie/TrailerModal';
import { MovieRail } from '@/components/movie/MovieRail';
import { MovieImage } from '@/components/common/MovieImage';

interface MovieDetailClientProps {
  movie: Movie;
  related: Movie[];
}

export function MovieDetailClient({ movie, related }: MovieDetailClientProps) {
  const { has, toggle } = useWatchlist();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const isInWatchlist = has(movie.id);

  const seasons = movie.seasons || [];
  const currentSeason = seasons[selectedSeasonIndex] || null;
  const episodes = currentSeason ? currentSeason.episodes : (movie.episodes || []);

  const isSeries = movie.contentType === 'series' || movie.contentType === 'anime' || seasons.length > 0;
  const watchUrl = isSeries && episodes.length > 0
    ? `/watch/${movie.slug}?ep=${episodes[0].number}`
    : `/watch/${movie.slug}`;
  const hasPlayback = Boolean(movie.playbackUrl || episodes.some((episode) => episode.playbackUrl));

  return (
    <>
      {/* Backdrop Hero */}
      <section style={{ position: 'relative', minHeight: '70vh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <MovieImage
            src={movie.backdropUrl}
            alt={movie.title}
            fallbackTitle={movie.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, var(--bg-main) 0%, rgba(8,9,12,0.85) 50%, rgba(8,9,12,0.5) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to right, var(--bg-main) 0%, transparent 60%)',
            }}
          />
        </div>

        <div
          className="container-main"
          style={{
            position: 'relative',
            zIndex: 2,
            paddingTop: '120px',
            paddingBottom: '60px',
            display: 'flex',
            gap: 'clamp(24px, 4vw, 48px)',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {/* Poster */}
          <div
            style={{
              width: 'clamp(180px, 20vw, 280px)',
              aspectRatio: '2/3',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            <MovieImage
              src={movie.posterUrl}
              alt={movie.title}
              fallbackTitle={movie.title}
              fill
              sizes="280px"
              style={{ objectFit: 'cover' }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {movie.quality && movie.quality !== 'N/A' && (
                <span className="badge badge-quality">{movie.quality}</span>
              )}
              {movie.episodeCurrent && (
                <span className="badge" style={{ background: 'rgba(229,57,79,0.2)', color: 'var(--accent-crimson)', border: '1px solid rgba(229,57,79,0.4)', fontWeight: 700 }}>
                  {movie.episodeCurrent}
                </span>
              )}
              {(movie.gdriveUrl || (movie.playbackUrl && movie.playbackUrl.includes('drive.google.com'))) && (
                <span className="badge" style={{ background: 'rgba(46,213,115,0.15)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.3)' }}>
                  Google Drive VIP
                </span>
              )}
              {movie.rating && (
                <span className="badge badge-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={10} fill="#FFC107" /> {movie.rating}
                </span>
              )}
              {isSeries && (
                <span className="badge" style={{ background: 'rgba(130,120,255,0.2)', color: 'var(--accent-violet)', border: '1px solid rgba(130,120,255,0.4)' }}>
                  <Tv size={11} style={{ marginRight: '4px' }} /> Phim bộ
                </span>
              )}
              {movie.status === 'upcoming' && (
                <span className="badge" style={{ background: 'rgba(117,221,243,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(117,221,243,0.3)' }}>
                  Sắp chiếu
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(24px, 4vw, 44px)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: '8px',
              }}
            >
              {movie.title}
            </h1>

            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p style={{ fontSize: '16px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '16px' }}>
                {movie.originalTitle}
              </p>
            )}

            {/* Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {movie.year}
              </span>
              {movie.runtime && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {movie.runtime} phút
                </span>
              )}
              {isSeries && seasons.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tv size={14} /> {seasons.length} Phần
                </span>
              )}
              {movie.country && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={14} /> {movie.country}
                </span>
              )}
              {movie.language && <span>{movie.language}</span>}
            </div>

            {/* Genres */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {movie.genres.map((g) => (
                <Link
                  key={g}
                  href={`/movies?genre=${encodeURIComponent(g)}`}
                  className="chip"
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Synopsis */}
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                marginBottom: '28px',
                maxWidth: '640px',
              }}
            >
              {movie.overview}
            </p>

            {/* Director & Cast */}
            {movie.director && (
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  <Film size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
                  Đạo diễn:
                </span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>{movie.director}</span>
              </div>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <div style={{ marginBottom: '24px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  <Users size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
                  Diễn viên:
                </span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>
                  {movie.cast.map((c) => c.name).join(', ')}
                </span>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {hasPlayback && <Link
                href={watchUrl}
                className="btn btn-primary"
              >
                <Play size={18} fill="white" /> {isSeries ? 'Xem phim ngay' : 'Xem phim'}
              </Link>}
              {movie.trailerUrl && (
                <button className="btn btn-secondary" onClick={() => setTrailerOpen(true)}>
                  <Play size={18} /> Trailer
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => toggle(movie.id)}
                style={
                  isInWatchlist
                    ? {
                        background: 'rgba(229,57,79,0.12)',
                        borderColor: 'rgba(229,57,79,0.4)',
                        color: 'var(--accent-crimson)',
                      }
                    : undefined
                }
              >
                {isInWatchlist ? (
                  <><BookmarkCheck size={18} /> Đã lưu</>
                ) : (
                  <><Bookmark size={18} /> Lưu vào danh sách</>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Series Episodes & Seasons Section */}
      {isSeries && episodes.length > 0 && (
        <section className="section-spacing" style={{ paddingTop: '40px', paddingBottom: '20px' }}>
          <div className="container-main">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 className="section-title">
                Danh sách tập phim
              </h2>

              {/* Season selector */}
              {seasons.length > 1 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {seasons.map((s, idx) => (
                    <button
                      key={s.number}
                      onClick={() => setSelectedSeasonIndex(idx)}
                      className={`btn ${idx === selectedSeasonIndex ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      {s.title || `Phần ${s.number}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/watch/${movie.slug}?ep=${ep.number}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-crimson)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(229,57,79,0.12)',
                      color: 'var(--accent-crimson)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    {ep.number}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ep.title}
                    </div>
                    {ep.runtime && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {ep.runtime} phút
                      </div>
                    )}
                  </div>
                  <Play size={16} color="var(--accent-crimson)" style={{ flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cast Section */}
      {movie.cast && movie.cast.length > 0 && (
        <section className="section-spacing" style={{ paddingTop: '40px' }}>
          <div className="container-main">
            <h2 className="section-title" style={{ marginBottom: '24px' }}>
              Diễn viên
            </h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {movie.cast.map((person) => (
                <div
                  key={person.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '16px',
                      fontWeight: 600,
                    }}
                  >
                    {person.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>{person.name}</p>
                    {person.role && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{person.role}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Movies */}
      {related.length > 0 && (
        <MovieRail title="Phim liên quan" movies={related} showGenre />
      )}

      {/* Trailer Modal */}
      {trailerOpen && movie.trailerUrl && (
        <TrailerModal
          url={movie.trailerUrl}
          title={movie.title}
          onClose={() => setTrailerOpen(false)}
        />
      )}
    </>
  );
}
