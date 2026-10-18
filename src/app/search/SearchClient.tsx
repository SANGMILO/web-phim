'use client';

import React, { useState, useMemo, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Film, Tv, Sparkles, Filter } from 'lucide-react';
import type { Movie, ContentType } from '@/types/movie';
import { MovieCard } from '@/components/movie/MovieCard';
import { GENRES } from '@/data/demo-movies';
import { movieStore } from '@/lib/movies/movie-storage';

interface SearchClientProps {
  allMovies: Movie[];
}

export function SearchClient({ allMovies }: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const urlGenre = searchParams.get('genre') || '';

  const storeMovies = useSyncExternalStore(
    movieStore.subscribe.bind(movieStore),
    () => movieStore.getMovies(),
    () => null
  );

  const effectiveAllMovies = storeMovies && storeMovies.length > 0 ? storeMovies : allMovies;

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>(urlGenre);
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'year'>('relevance');

  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  const [prevUrlGenre, setPrevUrlGenre] = useState(urlGenre);
  if (prevUrlGenre !== urlGenre) {
    setPrevUrlGenre(urlGenre);
    setSelectedGenre(urlGenre);
  }

  // Debounced URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedGenre) params.set('genre', selectedGenre);

      const qs = params.toString();
      const newUrl = qs ? `/search?${qs}` : '/search';
      window.history.replaceState(null, '', newUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre]);

  // Filtered results
  const results = useMemo(() => {
    let list = [...effectiveAllMovies];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter((m) => {
        const titleMatch = m.title.toLowerCase().includes(q);
        const originalMatch = m.originalTitle?.toLowerCase().includes(q);
        const genreMatch = m.genres.some((g) => g.toLowerCase().includes(q));
        const directorMatch = m.director?.toLowerCase().includes(q);
        const castMatch = m.cast?.some((c) => c.name.toLowerCase().includes(q));

        return titleMatch || originalMatch || genreMatch || directorMatch || castMatch;
      });
    }

    if (selectedType !== 'all') {
      list = list.filter((m) => m.contentType === selectedType);
    }

    if (selectedGenre) {
      list = list.filter((m) => m.genres.includes(selectedGenre));
    }

    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'year') {
      list.sort((a, b) => b.year - a.year);
    }

    return list;
  }, [effectiveAllMovies, searchQuery, selectedType, selectedGenre, sortBy]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedType('all');
    router.replace('/search');
  }, [router]);

  return (
    <div style={{ paddingTop: '100px', minHeight: '80vh', paddingBottom: '60px' }}>
      <div className="container-main">
        {/* Header */}
        <div style={{ maxWidth: '720px', margin: '0 auto 36px', textAlign: 'center' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, marginBottom: '12px' }}>
            Tìm Kiếm Phim
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Khám phá hàng trăm bộ phim chiếu rạp, phim bộ và anime được cập nhật liên tục.
          </p>

          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '18px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              placeholder="Nhập tên phim, diễn viên, đạo diễn hoặc thể loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="input"
              style={{
                width: '100%',
                padding: '16px 50px 16px 50px',
                fontSize: '16px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                style={{
                  position: 'absolute',
                  right: '18px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filters bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '32px',
            padding: '16px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Content Type Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedType('all')}
              className={`chip ${selectedType === 'all' ? 'chip-active' : ''}`}
            >
              Tất cả
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

          {/* Genre selector & Sort */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <option value="">Tất cả thể loại</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevance' | 'rating' | 'year')}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <option value="relevance">Sắp xếp: Mặc định</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="year">Năm phát hành mới nhất</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {searchQuery.trim() ? (
              <>
                Kết quả tìm kiếm cho &ldquo;<span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{searchQuery}</span>&rdquo;:
                {' '}<span style={{ color: 'var(--accent-crimson)', fontWeight: 700 }}>{results.length}</span> phim
              </>
            ) : (
              <>
                Tổng cộng: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{results.length}</span> phim
              </>
            )}
          </p>

          {(searchQuery || selectedGenre || selectedType !== 'all') && (
            <button
              onClick={handleClear}
              style={{ fontSize: '13px', color: 'var(--accent-crimson)', textDecoration: 'underline' }}
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="poster-grid">
            {results.map((m) => (
              <MovieCard key={m.id} movie={m} showGenre width={undefined as unknown as number} />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Không tìm thấy phim phù hợp
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh mục.
            </p>
            <button onClick={handleClear} className="btn btn-primary">
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
