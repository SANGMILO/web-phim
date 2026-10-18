'use client';

import React, { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Movie, ContentType, MovieFilter } from '@/types/movie';
import { MovieCard } from '@/components/movie/MovieCard';
import { GENRES } from '@/data/demo-movies';
import { Search, SlidersHorizontal } from 'lucide-react';
import { movieStore } from '@/lib/movies/movie-storage';

interface CatalogViewProps {
  title: string;
  description?: string;
  movies: Movie[];
  contentType?: ContentType;
  showTypeFilter?: boolean;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'title', label: 'Tên A-Z' },
] as const;

const ITEMS_PER_PAGE = 20;

export function CatalogView({
  title,
  description,
  movies,
  contentType,
  showTypeFilter = false,
}: CatalogViewProps) {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || '';

  const storeMovies = useSyncExternalStore(
    movieStore.subscribe.bind(movieStore),
    () => movieStore.getMovies(),
    () => null
  );

  const effectiveMovies = useMemo(() => {
    if (!storeMovies || storeMovies.length === 0) return movies;
    if (contentType) {
      return storeMovies.filter((m) => m.contentType === contentType);
    }
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('rạp') || lowerTitle.includes('theater')) {
      return storeMovies.filter((m) => m.inTheaters);
    }
    if (lowerTitle.includes('sắp') || lowerTitle.includes('upcoming')) {
      return storeMovies.filter((m) => m.status === 'upcoming');
    }
    return storeMovies;
  }, [storeMovies, movies, contentType, title]);

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedYear, setSelectedYear] = useState('');
  const [sort, setSort] = useState<MovieFilter['sort']>('newest');
  const [selectedType, setSelectedType] = useState<ContentType | ''>(contentType || '');
  const [page, setPage] = useState(1);

  const years = useMemo(() => {
    const yearSet = new Set(effectiveMovies.map((m) => m.year));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [effectiveMovies]);

  const filtered = useMemo(() => {
    let result = [...effectiveMovies];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.originalTitle?.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)),
      );
    }

    if (selectedGenre) {
      result = result.filter((m) =>
        m.genres.some((g) => g === selectedGenre),
      );
    }

    if (selectedYear) {
      result = result.filter((m) => m.year === Number(selectedYear));
    }

    if (selectedType) {
      result = result.filter((m) => m.contentType === selectedType);
    }

    switch (sort) {
      case 'newest':
        result.sort((a, b) => b.year - a.year);
        break;
      case 'oldest':
        result.sort((a, b) => a.year - b.year);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
        break;
    }

    return result;
  }, [movies, query, selectedGenre, selectedYear, selectedType, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(0, page * ITEMS_PER_PAGE);

  const clearFilters = useCallback(() => {
    setQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setSelectedType('');
    setSort('newest');
    setPage(1);
  }, []);

  return (
    <div style={{ paddingTop: '100px' }}>
      <div className="container-main">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            {title}
          </h1>
          {description && (
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
              {description}
            </p>
          )}
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '28px',
            padding: '20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              className="input"
              type="search"
              placeholder="Tìm kiếm..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Genre */}
          <select
            className="select"
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả thể loại</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Year */}
          <select
            className="select"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả năm</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Content Type */}
          {showTypeFilter && (
            <select
              className="select"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as ContentType | '');
                setPage(1);
              }}
            >
              <option value="">Tất cả loại</option>
              <option value="movie">Phim lẻ</option>
              <option value="series">Phim bộ</option>
              <option value="anime">Anime</option>
            </select>
          )}

          {/* Sort */}
          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value as MovieFilter['sort'])}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Clear */}
          {(query || selectedGenre || selectedYear || selectedType) && (
            <button className="btn btn-ghost" onClick={clearFilters}>
              <SlidersHorizontal size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Results count */}
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {filtered.length} kết quả
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <>
            <div className="poster-grid">
              {paged.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  showGenre
                  width={undefined as unknown as number}
                />
              ))}
            </div>

            {/* Load More */}
            {page < totalPages && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Tải thêm ({filtered.length - paged.length} phim còn lại)
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--text-muted)',
            }}
          >
            <p style={{ fontSize: '18px', marginBottom: '12px' }}>
              Không tìm thấy kết quả nào
            </p>
            <p style={{ fontSize: '14px' }}>
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
