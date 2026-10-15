'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Star, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Movie } from '@/types/movie';
import { MovieImage } from '@/components/common/MovieImage';
import { isReducedMotion } from '@/lib/animations/useAnimations';

interface EditorialShowcaseProps {
  movies: Movie[];
}

export function EditorialShowcase({ movies }: EditorialShowcaseProps) {
  // Take top curated movies (up to 8) and double for seamless infinite conveyor belt
  const baseMovies = movies.slice(0, 8);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const isInteractingRef = useRef(false);
  const interactTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Conveyor belt smooth auto-scroll animation
  useEffect(() => {
    const track = trackRef.current;
    if (!track || baseMovies.length === 0 || isReducedMotion()) return;

    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(now - lastTime, 50); // cap delta for tab switching
      lastTime = now;

      if (!isPausedRef.current && !isInteractingRef.current && track) {
        // ~45 pixels per second for elegant cinematic glide
        const step = (delta * 0.045);
        track.scrollLeft += step;

        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0 && track.scrollLeft >= halfWidth) {
          track.scrollLeft -= halfWidth;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current);
    };
  }, [baseMovies.length]);

  const handleManualScroll = useCallback((direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    isInteractingRef.current = true;
    if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current);

    const track = trackRef.current;
    const scrollAmount = Math.min(window.innerWidth * 0.7, 560);
    const halfWidth = track.scrollWidth / 2;

    const targetLeft = direction === 'left' ? track.scrollLeft - scrollAmount : track.scrollLeft + scrollAmount;
    track.scrollTo({
      left: targetLeft,
      behavior: 'smooth',
    });

    // Reset interaction lock after smooth scroll settles
    interactTimeoutRef.current = setTimeout(() => {
      if (track) {
        if (track.scrollLeft >= halfWidth) {
          track.scrollLeft -= halfWidth;
        } else if (track.scrollLeft < 0 && halfWidth > 0) {
          track.scrollLeft += halfWidth;
        }
      }
      isInteractingRef.current = false;
    }, 1200);
  }, []);

  const handleTouchStart = () => {
    isInteractingRef.current = true;
    if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current);
  };

  const handleTouchEnd = () => {
    interactTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 1500);
  };

  if (baseMovies.length === 0) return null;

  // Double list for infinite seamless loop
  const displayMovies = [...baseMovies, ...baseMovies];

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--bg-main) 0%, #0d0e14 50%, var(--bg-main) 100%)',
        padding: '60px 0',
      }}
    >
      <div
        className="container-main"
        style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-violet)', marginBottom: '8px' }}>
            <Sparkles size={16} />
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Biên tập viên tuyển chọn
            </span>
          </div>
          <h2 className="font-display" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800 }}>
            Tuyệt Tác Điện Ảnh Khuyên Xem
          </h2>
        </div>

        {/* Status indicator & Carousel buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.04)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isPaused ? 'var(--accent-crimson)' : 'var(--accent-cyan)',
                boxShadow: isPaused ? '0 0 6px var(--accent-crimson)' : '0 0 8px var(--accent-cyan)',
                display: 'inline-block',
                transition: 'all 0.3s ease',
              }}
            />
            {isPaused ? 'Tạm dừng' : 'Băng chuyền tự động'}
          </span>

          <button
            onClick={() => handleManualScroll('left')}
            className="btn-icon"
            style={{ width: '40px', height: '40px' }}
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => handleManualScroll('right')}
            className="btn-icon"
            style={{ width: '40px', height: '40px' }}
            aria-label="Cuộn sang phải"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Infinite Conveyor Belt Track */}
      <div
        ref={trackRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex',
          gap: '24px',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          cursor: isPaused ? 'default' : 'grab',
        }}
        className="no-scrollbar"
      >
        {displayMovies.map((movie, index) => {
          const detailUrl =
            movie.contentType === 'series' || movie.contentType === 'anime'
              ? `/series/${movie.slug}`
              : `/movie/${movie.slug}`;

          const originalIndex = (index % baseMovies.length) + 1;

          return (
            <div
              key={`${movie.id}-${index}`}
              style={{
                width: 'clamp(320px, 50vw, 580px)',
                flexShrink: 0,
                position: 'relative',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {/* Backdrop image */}
              <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                <MovieImage
                  src={movie.backdropUrl || movie.posterUrl}
                  alt={movie.title}
                  fallbackTitle={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 580px"
                  style={{ objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, var(--bg-secondary) 5%, rgba(16,17,22,0.4) 60%, transparent 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(8,9,12,0.75)',
                      backdropFilter: 'blur(10px)',
                      color: 'var(--text-primary)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    #{originalIndex} TIÊU ĐIỂM
                  </span>
                  {movie.rating && (
                    <span
                      style={{
                        background: 'rgba(255,193,7,0.2)',
                        backdropFilter: 'blur(10px)',
                        color: '#FFC107',
                        border: '1px solid rgba(255,193,7,0.3)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Star size={12} fill="#FFC107" /> {movie.rating}
                    </span>
                  )}
                </div>
              </div>

              {/* Content body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {movie.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {g}
                    </span>
                  ))}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {movie.year} {movie.runtime ? `• ${movie.runtime}m` : ''}
                  </span>
                </div>

                <h3 className="font-display" style={{ fontSize: '19px', fontWeight: 700, lineHeight: 1.25 }}>
                  {movie.title}
                </h3>

                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {movie.overview}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    marginTop: '4px',
                  }}
                >
                  <Link
                    href={`/watch/${movie.slug}`}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                  >
                    <Play size={14} fill="white" /> Xem ngay
                  </Link>

                  <Link
                    href={detailUrl}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      transition: 'color 0.2s',
                    }}
                  >
                    Chi tiết <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
