'use client';

import React, { useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';

interface MovieRailProps {
  title: string;
  movies: Movie[];
  linkHref?: string;
  linkLabel?: string;
  showRank?: boolean;
  showGenre?: boolean;
  cardWidth?: number;
  accentColor?: string;
}

export function MovieRail({
  title,
  movies,
  linkHref,
  linkLabel = 'Xem tất cả',
  showRank = false,
  showGenre = false,
  cardWidth = 185,
  accentColor,
}: MovieRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback(
    (dir: 'left' | 'right') => {
      if (!railRef.current) return;
      const amount = cardWidth * 3 + 48;
      railRef.current.scrollBy({
        left: dir === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    },
    [cardWidth],
  );

  if (movies.length === 0) return null;

  return (
    <section className="section-spacing" style={{ paddingBottom: '20px' }}>
      <div className="container-main">
        {/* Header */}
        <div className="section-header">
          <h2
            className="section-title"
            style={accentColor ? { borderLeft: `3px solid ${accentColor}`, paddingLeft: '12px' } : undefined}
          >
            {title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => scroll('left')}
              className="btn-icon"
              style={{ width: '36px', height: '36px' }}
              aria-label="Cuộn trái"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="btn-icon"
              style={{ width: '36px', height: '36px' }}
              aria-label="Cuộn phải"
            >
              <ChevronRight size={18} />
            </button>
            {linkHref && (
              <Link href={linkHref} className="section-link" style={{ marginLeft: '8px' }}>
                {linkLabel} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* Rail */}
        <div
          ref={railRef}
          className="rail"
          style={{ paddingLeft: '2px', paddingRight: '2px' }}
        >
          {movies.map((movie, i) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              rank={showRank ? i + 1 : undefined}
              showGenre={showGenre}
              width={cardWidth}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
