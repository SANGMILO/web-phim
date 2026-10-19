'use client';

import React, { useState, useMemo, useSyncExternalStore, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Film, Tv, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import type { Movie, ContentType } from '@/types/movie';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { MovieCard } from '@/components/movie/MovieCard';
import { watchlistService } from '@/lib/watchlist-service';
import { movieStore } from '@/lib/movies/movie-storage';

interface WatchlistClientProps {
  allMovies: Movie[];
}

function generateSlug(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function WatchlistClient({ allMovies }: WatchlistClientProps) {
  const { ids } = useWatchlist();
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');

  // 1. Subscribe to latest client storage movies (including movies added/edited in Admin)
  const clientMovies = useSyncExternalStore(
    movieStore.subscribe.bind(movieStore),
    () => movieStore.getMovies(),
    () => []
  );

  // 2. Comprehensive pool of all available movies (client overrides + server fallbacks)
  const poolMovies = useMemo(() => {
    const list: Movie[] = [];
    const seen = new Set<string>();

    (clientMovies.length > 0 ? clientMovies : []).forEach((m) => {
      if (m?.id && !seen.has(m.id)) {
        seen.add(m.id);
        list.push(m);
      }
    });

    allMovies.forEach((m) => {
      if (m?.id && !seen.has(m.id)) {
        seen.add(m.id);
        list.push(m);
      }
    });

    return list;
  }, [allMovies, clientMovies]);

  // 3. Multi-tier resilient movie resolver
  const resolveMovie = useMemo(() => {
    return (idOrSlug: string): Movie | null => {
      if (!idOrSlug) return null;
      const clean = decodeURIComponent(String(idOrSlug)).trim().toLowerCase();
      const cleanSlug = generateSlug(clean);

      // Tier 1: Try movieStore.getMovieById
      const fromStore = movieStore.getMovieById(clean);
      if (fromStore) return fromStore;

      // Tier 2: Exact ID or Slug match in combined pool
      const exact = poolMovies.find((m) => {
        const mId = m.id?.toLowerCase() || '';
        const mSlug = m.slug?.toLowerCase() || '';
        return mId === clean || mSlug === clean;
      });
      if (exact) return exact;

      // Tier 3: Title or original title slug match
      const titleMatch = poolMovies.find((m) => {
        const mTitleSlug = generateSlug(m.title || '');
        const mOrigSlug = generateSlug(m.originalTitle || '');
        return (
          mTitleSlug === clean ||
          mTitleSlug === cleanSlug ||
          mOrigSlug === clean ||
          mOrigSlug === cleanSlug
        );
      });
      if (titleMatch) return titleMatch;

      // Tier 4: Keyword alias heuristic (Dune, Avatar, Planet of the Apes, etc.)
      return poolMovies.find((m) => {
        const mSlug = m.slug?.toLowerCase() || '';
        const mTitleSlug = generateSlug(m.title || '');
        return (
          (clean.includes('dune') && (mSlug.includes('dune') || mTitleSlug.includes('cat'))) ||
          (clean.includes('avatar') && (mSlug.includes('avatar') || mTitleSlug.includes('avatar'))) ||
          ((clean.includes('khi') || clean.includes('apes')) && (mSlug.includes('apes') || mTitleSlug.includes('khi')))
        );
      }) ?? null;
    };
  }, [poolMovies]);

  // 4. Resolve all saved movies and auto-heal orphaned or duplicate IDs
  const allSavedMovies = useMemo(() => {
    const list: Movie[] = [];
    const seenIds = new Set<string>();
    const orphanedIds: string[] = [];

    ids.forEach((id) => {
      const movie = resolveMovie(id);
      if (movie) {
        if (!seenIds.has(movie.id)) {
          seenIds.add(movie.id);
          list.push(movie);
        }
      } else {
        orphanedIds.push(id);
      }
    });

    // Auto-heal: If an ID in watchlist cannot be found in any database, clean it up
    if (orphanedIds.length > 0 && typeof window !== 'undefined') {
      setTimeout(() => {
        orphanedIds.forEach((badId) => watchlistService.remove(badId));
      }, 100);
    }

    return list;
  }, [ids, resolveMovie]);

  // 5. Categorized counts
  const totalCount = allSavedMovies.length;
  const movieCount = useMemo(() => allSavedMovies.filter((m) => m.contentType === 'movie').length, [allSavedMovies]);
  const seriesCount = useMemo(() => allSavedMovies.filter((m) => m.contentType === 'series').length, [allSavedMovies]);
  const animeCount = useMemo(() => allSavedMovies.filter((m) => m.contentType === 'anime').length, [allSavedMovies]);

  // 6. Filtered movies by category tab
  const displayedMovies = useMemo(() => {
    if (selectedType === 'all') return allSavedMovies;
    return allSavedMovies.filter((m) => m.contentType === selectedType);
  }, [allSavedMovies, selectedType]);

  const handleClearAll = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách đã lưu?')) {
      ids.forEach((id) => watchlistService.remove(id));
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
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
              Danh Sách Xem ({totalCount})
            </h1>
          </div>

          {totalCount > 0 && (
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
        {totalCount > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedType('all')}
              className={`chip ${selectedType === 'all' ? 'chip-active' : ''}`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              onClick={() => setSelectedType('movie')}
              className={`chip ${selectedType === 'movie' ? 'chip-active' : ''}`}
            >
              <Film size={12} style={{ display: 'inline', marginRight: '4px' }} /> Phim lẻ ({movieCount})
            </button>
            <button
              onClick={() => setSelectedType('series')}
              className={`chip ${selectedType === 'series' ? 'chip-active' : ''}`}
            >
              <Tv size={12} style={{ display: 'inline', marginRight: '4px' }} /> Phim bộ ({seriesCount})
            </button>
            <button
              onClick={() => setSelectedType('anime')}
              className={`chip ${selectedType === 'anime' ? 'chip-active' : ''}`}
            >
              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} /> Anime ({animeCount})
            </button>
          </div>
        )}

        {/* Grid or Empty State */}
        {displayedMovies.length > 0 ? (
          <div className="movie-grid">
            {displayedMovies.map((movie) => (
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
              {totalCount > 0 ? 'Không có phim phù hợp bộ lọc' : 'Danh sách xem đang trống'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              {totalCount > 0
                ? 'Không tìm thấy bộ phim nào trong danh mục đã chọn. Hãy chọn "Tất cả" để xem lại toàn bộ phim đã lưu.'
                : 'Bạn chưa lưu bộ phim nào. Nhấn vào biểu tượng đánh dấu trên bất kỳ bộ phim nào để lưu lại và theo dõi dễ dàng tại đây.'}
            </p>
            {totalCount > 0 ? (
              <button onClick={() => setSelectedType('all')} className="btn btn-secondary">
                Xem tất cả ({totalCount})
              </button>
            ) : (
              <Link href="/movies" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Khám phá phim ngay <ArrowRight size={16} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
