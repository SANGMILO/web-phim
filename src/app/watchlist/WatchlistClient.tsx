'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Bookmark, Film, Tv, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import type { Movie, ContentType } from '@/types/movie';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { MovieCard } from '@/components/movie/MovieCard';
import { watchlistService } from '@/lib/watchlist-service';

interface WatchlistClientProps {
  allMovies: Movie[];
}

export function WatchlistClient({ allMovies }: WatchlistClientProps) {
  const { ids, count } = useWatchlist();
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');

  const movieMap = useMemo(() => {
    const map = new Map<string, Movie>();
    allMovies.forEach((m) => {
      map.set(m.id, m);
      map.set(m.slug, m);
    });
    return map;
  }, [allMovies]);

  const savedMovies = useMemo(() => {
    const list: Movie[] = [];
    ids.forEach((id) => {
      const m = movieMap.get(id);
      if (m && !list.some((item) => item.id === m.id)) {
        list.push(m);
      }
    });

    if (selectedType === 'all') return list;
    return list.filter((m) => m.contentType === selectedType);
  }, [ids, movieMap, selectedType]);

  const handleClearAll = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách đã lưu?')) {
      ids.forEach((id) => watchlistService.remove(id));
      window.location.reload();
    }
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '80vh', paddingBottom: '80px' }}>
      <div className="container-main">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-crimson)', marginBottom: '8px' }}>
              <Bookmark size={18} fill="var(--accent-crimson)" />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Bộ sưu tập của bạn
              </span>
            </div>
            <h1 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800 }}>
              Danh Sách Xem ({count})
            </h1>
          </div>

          {count > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-secondary"
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={15} /> Xóa tất cả
            </button>
          )}
        </div>

        {/* Content Type Filter */}
        {count > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedType('all')}
              className={`chip ${selectedType === 'all' ? 'chip-active' : ''}`}
            >
              Tất cả ({count})
            </button>
            <button
              onClick={() => setSelectedType('movie')}
              className={`chip ${selectedType === 'movie' ? 'chip-active' : ''}`}
            >
              <Film size={12} style={{ display: 'inline', marginRight: '4px' }} /> Phim lẻ
            </button>
            <button
              onClick={() => setSelectedType('series')}
              className={`chip ${selectedType === 'series' ? 'chip-active' : ''}`}
            >
              <Tv size={12} style={{ display: 'inline', marginRight: '4px' }} /> Phim bộ
            </button>
            <button
              onClick={() => setSelectedType('anime')}
              className={`chip ${selectedType === 'anime' ? 'chip-active' : ''}`}
            >
              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} /> Anime
            </button>
          </div>
        )}

        {/* Grid or Empty State */}
        {savedMovies.length > 0 ? (
          <div className="movie-grid">
            {savedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} showGenre />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              maxWidth: '560px',
              margin: '40px auto 0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(229,57,79,0.1)',
                color: 'var(--accent-crimson)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Bookmark size={28} />
            </div>
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
              Danh sách xem đang trống
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Bạn chưa lưu bộ phim nào. Nhấn vào biểu tượng đánh dấu trên bất kỳ bộ phim nào để lưu lại và theo dõi dễ dàng tại đây.
            </p>
            <Link href="/movies" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Khám phá phim ngay <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
