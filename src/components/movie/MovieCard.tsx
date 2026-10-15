'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Movie } from '@/types/movie';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { MovieImage } from '@/components/common/MovieImage';

interface MovieCardProps {
  movie: Movie;
  rank?: number;
  showYear?: boolean;
  showRating?: boolean;
  showGenre?: boolean;
  width?: number | string;
}

export function MovieCard({
  movie,
  rank,
  showYear = true,
  showRating = true,
  showGenre = false,
  width,
}: MovieCardProps) {
  const { has, toggle } = useWatchlist();
  const detailHref =
    movie.contentType === 'series' || movie.contentType === 'anime'
      ? `/series/${movie.slug}`
      : `/movie/${movie.slug}`;

  const isInWatchlist = has(movie.id);
  const widthStyle = width ? (typeof width === 'number' ? `${width}px` : width) : '100%';

  return (
    <div
      className="poster-card"
      style={{
        width: widthStyle,
        flexShrink: width ? 0 : undefined,
        aspectRatio: '2/3',
        position: 'relative',
      }}
    >
      <Link href={detailHref} style={{ display: 'block', width: '100%', height: '100%' }}>
        <MovieImage
          src={movie.posterUrl}
          alt={movie.title}
          fallbackTitle={movie.title}
          fill
          sizes={typeof width === 'number' ? `${width}px` : '280px'}
          style={{ objectFit: 'cover', transition: 'transform 0.6s var(--easing-cinematic)' }}
          className="poster-img"
        />
      </Link>

      {/* Quality Badge */}
      {movie.quality && movie.quality !== 'N/A' && (
        <span
          className="badge badge-quality"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            zIndex: 3,
          }}
        >
          {movie.quality}
        </span>
      )}

      {/* Rank */}
      {rank !== undefined && (
        <span
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 3,
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 900,
            color: 'var(--accent-crimson)',
            lineHeight: 1,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {rank}
        </span>
      )}

      {/* Hover Info */}
      <div className="poster-card-info">
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '4px',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {movie.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {showYear && <span>{movie.year}</span>}
          {showRating && movie.rating && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Star size={11} fill="#FFC107" color="#FFC107" />
              {movie.rating}
            </span>
          )}
          {showGenre && movie.genres[0] && (
            <span style={{ color: 'var(--text-muted)' }}>{movie.genres[0]}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          <Link
            href={detailHref}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '6px' }}
          >
            <Play size={12} fill="white" /> Chi tiết
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(movie.id);
            }}
            className="btn-icon"
            style={{
              width: '30px',
              height: '30px',
              background: isInWatchlist ? 'rgba(229,57,79,0.2)' : 'rgba(255,255,255,0.1)',
            }}
            aria-label={isInWatchlist ? 'Xóa khỏi danh sách' : 'Thêm vào danh sách'}
          >
            {isInWatchlist ? (
              <BookmarkCheck size={13} color="var(--accent-crimson)" />
            ) : (
              <Bookmark size={13} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
