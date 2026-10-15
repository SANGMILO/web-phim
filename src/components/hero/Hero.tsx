'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Play, Info, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Star, Clock, Calendar } from 'lucide-react';
import type { Movie } from '@/types/movie';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { TrailerModal } from '@/components/movie/TrailerModal';
import { MovieImage } from '@/components/common/MovieImage';
import gsap from 'gsap';

interface HeroProps {
  movies: Movie[];
}

export function Hero({ movies }: HeroProps) {
  const [current, setCurrent] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { has, toggle } = useWatchlist();

  const movie = movies[current] || null;

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index === current || movies.length === 0) return;
      const next = ((index % movies.length) + movies.length) % movies.length;

      // Animate out
      if (contentRef.current) {
        const tl = gsap.timeline();
        tl.to(contentRef.current.children, {
          opacity: 0,
          y: 20,
          duration: 0.3,
          stagger: 0.03,
          ease: 'power2.in',
          onComplete: () => {
            if (isMountedRef.current) {
              setCurrent(next);
            }
          },
        });
      } else {
        if (isMountedRef.current) {
          setCurrent(next);
        }
      }
    },
    [current, movies.length],
  );

  // Animate in on mount / change
  useEffect(() => {
    if (!contentRef.current) return;
    const ctx = gsap.context(() => {
      const children = contentRef.current!.children;
      gsap.fromTo(
        children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
          delay: 0.15,
        },
      );
    }, heroRef);
    return () => ctx.revert();
  }, [current]);

  if (!movie) return null;

  const detailHref =
    movie.contentType === 'series' || movie.contentType === 'anime'
      ? `/series/${movie.slug}`
      : `/movie/${movie.slug}`;

  const isInWatchlist = has(movie.id);

  return (
    <>
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          height: 'clamp(500px, 85svh, 900px)',
          overflow: 'hidden',
        }}
      >
        {/* Backdrop */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <MovieImage
            src={movie.backdropUrl}
            alt={movie.title}
            fallbackTitle={movie.title}
            fill
            priority
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center 20%',
              transition: 'opacity 0.8s ease',
            }}
          />
          {/* Gradient overlays */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, var(--bg-main) 0%, rgba(8,9,12,0.7) 50%, rgba(8,9,12,0.3) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to right, var(--bg-main) 0%, rgba(8,9,12,0.4) 60%, transparent 100%)',
            }}
          />
        </div>

        {/* Content */}
        <div
          className="container-main"
          style={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            paddingBottom: 'clamp(48px, 8vh, 100px)',
          }}
        >
          <div ref={contentRef} style={{ maxWidth: '680px' }}>
            {/* Metadata badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {movie.quality && movie.quality !== 'N/A' && (
                <span className="badge badge-quality">{movie.quality}</span>
              )}
              {movie.rating && (
                <span className="badge badge-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={10} fill="#FFC107" /> {movie.rating}
                </span>
              )}
              {movie.genres.slice(0, 3).map((g) => (
                <span key={g} className="badge badge-genre">{g}</span>
              ))}
            </div>

            {/* Title */}
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(28px, 5vw, 56px)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginBottom: '12px',
              }}
            >
              {movie.title}
            </h1>

            {/* Subtitle */}
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p
                style={{
                  fontSize: 'clamp(14px, 1.5vw, 18px)',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: '12px',
                }}
              >
                {movie.originalTitle}
              </p>
            )}

            {/* Info */}
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
              {movie.country && <span>{movie.country}</span>}
              {movie.language && <span>{movie.language}</span>}
            </div>

            {/* Synopsis */}
            <p
              style={{
                fontSize: 'clamp(14px, 1.2vw, 16px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: '28px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxWidth: '560px',
              }}
            >
              {movie.overview}
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {movie.trailerUrl && (
                <button
                  className="btn btn-primary"
                  onClick={() => setTrailerOpen(true)}
                  style={{ fontSize: '15px', padding: '14px 32px' }}
                >
                  <Play size={18} fill="white" /> Xem trailer
                </button>
              )}
              <Link
                href={detailHref}
                className="btn btn-secondary"
                style={{ fontSize: '15px', padding: '14px 32px' }}
              >
                <Info size={18} /> Chi tiết phim
              </Link>
              <button
                className="btn-icon"
                onClick={() => toggle(movie.id)}
                aria-label={isInWatchlist ? 'Xóa khỏi danh sách' : 'Thêm vào danh sách'}
                style={{
                  background: isInWatchlist ? 'rgba(229,57,79,0.2)' : 'rgba(255,255,255,0.08)',
                  borderColor: isInWatchlist ? 'rgba(229,57,79,0.4)' : 'var(--border-subtle)',
                }}
              >
                {isInWatchlist ? (
                  <BookmarkCheck size={20} color="var(--accent-crimson)" />
                ) : (
                  <Bookmark size={20} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        {movies.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 'clamp(20px, 4vh, 40px)',
              right: 'clamp(16px, 4vw, 48px)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <button
              className="btn-icon"
              onClick={() => goTo(current - 1)}
              aria-label="Phim trước"
              style={{ width: '40px', height: '40px' }}
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {movies.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Phim ${i + 1}`}
                  style={{
                    width: i === current ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === current ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.4s var(--easing-cinematic)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                />
              ))}
            </div>
            <button
              className="btn-icon"
              onClick={() => goTo(current + 1)}
              aria-label="Phim tiếp"
              style={{ width: '40px', height: '40px' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </section>

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
