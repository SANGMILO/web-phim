'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useMovieAdmin } from '@/lib/movies/useMovieAdmin';
import { MovieImage } from '@/components/common/MovieImage';
import { useToast } from '@/components/admin/AdminToast';
import type { Movie } from '@/types/movie';

export default function AdminMoviesListPage() {
  const { movies, deleteMovie, toggleFeatured, toggleTrending } = useMovieAdmin();
  const { showToast } = useToast();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'title'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Deletion Modal state
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);

  // Filtered & Sorted movies
  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.originalTitle?.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'theaters') {
        result = result.filter((m) => m.inTheaters);
      } else {
        result = result.filter((m) => m.contentType === selectedCategory);
      }
    }

    if (selectedStatus !== 'all') {
      result = result.filter((m) => m.status === selectedStatus);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => b.year - a.year);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }

    return result;
  }, [movies, search, selectedCategory, selectedStatus, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / itemsPerPage));
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteConfirm = () => {
    if (!movieToDelete) return;
    const success = deleteMovie(movieToDelete.id);
    if (success) {
      showToast(`Đã xóa phim "${movieToDelete.title}" thành công.`, 'success');
    } else {
      showToast('Có lỗi xảy ra khi xóa phim.', 'error');
    }
    setMovieToDelete(null);
  };

  const handleToggleFeatured = (movie: Movie) => {
    toggleFeatured(movie.id);
    showToast(
      `${movie.featured ? 'Đã bỏ' : 'Đã ghim'} Tiêu điểm: "${movie.title}"`,
      'info'
    );
  };

  const handleToggleTrending = (movie: Movie) => {
    toggleTrending(movie.id);
    showToast(
      `${movie.trending ? 'Đã bỏ' : 'Đã ghim'} Thịnh hành: "${movie.title}"`,
      'info'
    );
  };

  return (
    <>
      <AdminHeader
        onToggleSidebar={() => {
          const sidebar = document.querySelector('.admin-sidebar');
          if (sidebar) sidebar.classList.toggle('open');
        }}
        title="Quản lý phim & series"
        subtitle={`Quản lý toàn bộ danh mục ${movies.length} phim trong hệ thống`}
      />

      <div style={{ padding: '28px', maxWidth: '1400px', width: '100%' }}>
        {/* Action and Filter Bar */}
        <div
          style={{
            background: '#101116',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                flex: '1 1 320px',
                maxWidth: '460px',
              }}
            >
              <Search
                size={16}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                type="text"
                placeholder="Tìm phim theo tên, tên gốc, đạo diễn..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filter Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">Mọi trạng thái</option>
                <option value="released">Đã phát hành</option>
                <option value="upcoming">Sắp chiếu</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'rating' | 'title')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="newest">Năm mới nhất</option>
                <option value="rating">Điểm cao nhất</option>
                <option value="title">Tên phim A-Z</option>
              </select>

              <Link
                href="/admin/movies/new"
                className="btn btn-primary"
                style={{
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={16} /> Thêm phim mới
              </Link>
            </div>
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '14px',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'all', label: `Tất cả (${movies.length})` },
              { id: 'movie', label: `Phim lẻ (${movies.filter((m) => m.contentType === 'movie').length})` },
              { id: 'series', label: `Phim bộ (${movies.filter((m) => m.contentType === 'series').length})` },
              { id: 'anime', label: `Anime (${movies.filter((m) => m.contentType === 'anime').length})` },
              { id: 'theaters', label: `Chiếu rạp (${movies.filter((m) => m.inTheaters).length})` },
            ].map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? 'var(--accent-crimson)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Movies Data Table */}
        <div
          style={{
            background: '#101116',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '16px 20px' }}>Tác phẩm</th>
                  <th style={{ padding: '16px 16px' }}>Loại & Năm</th>
                  <th style={{ padding: '16px 16px' }}>Chất lượng</th>
                  <th style={{ padding: '16px 16px' }}>Đánh giá</th>
                  <th style={{ padding: '16px 16px', textAlign: 'center' }}>Tiêu điểm</th>
                  <th style={{ padding: '16px 16px', textAlign: 'center' }}>Thịnh hành</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {paginatedMovies.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Không tìm thấy tác phẩm nào phù hợp với bộ lọc.
                      </p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory('all');
                          setSelectedStatus('all');
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '13px', padding: '6px 14px' }}
                      >
                        Xóa toàn bộ bộ lọc
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedMovies.map((movie) => {
                    const isSeriesOrAnime =
                      movie.contentType === 'series' || movie.contentType === 'anime';

                    return (
                      <tr
                        key={movie.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Artwork & Title */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '46px',
                                height: '64px',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                position: 'relative',
                                flexShrink: 0,
                                background: '#171920',
                              }}
                            >
                              <MovieImage
                                src={movie.posterUrl}
                                alt={movie.title}
                                fallbackTitle={movie.title}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>

                            <div style={{ minWidth: 0, maxWidth: '300px' }}>
                              <p
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                  lineHeight: 1.3,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {movie.title}
                              </p>
                              <p
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--text-muted)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {movie.originalTitle || movie.slug}
                              </p>
                              <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {movie.genres.slice(0, 2).map((g) => (
                                  <span
                                    key={g}
                                    style={{
                                      fontSize: '10px',
                                      padding: '1px 6px',
                                      borderRadius: '3px',
                                      background: 'rgba(255,255,255,0.06)',
                                      color: 'var(--text-secondary)',
                                    }}
                                  >
                                    {g}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Year */}
                        <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 'fit-content',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background:
                                  movie.contentType === 'movie'
                                    ? 'rgba(229, 57, 79, 0.15)'
                                    : movie.contentType === 'anime'
                                    ? 'rgba(130, 120, 255, 0.15)'
                                    : 'rgba(117, 221, 243, 0.15)',
                                color:
                                  movie.contentType === 'movie'
                                    ? 'var(--accent-crimson)'
                                    : movie.contentType === 'anime'
                                    ? 'var(--accent-violet)'
                                    : 'var(--accent-cyan)',
                              }}
                            >
                              {movie.contentType === 'movie'
                                ? 'Phim lẻ'
                                : movie.contentType === 'series'
                                ? 'Phim bộ'
                                : 'Anime'}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                              {movie.year} • {movie.country || 'Mỹ'}
                            </span>
                          </div>
                        </td>

                        {/* Quality & Sub */}
                        <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                          <span
                            className="badge badge-quality"
                            style={{ display: 'inline-block', fontSize: '11px' }}
                          >
                            {movie.quality || 'FHD'}
                          </span>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {movie.language || 'Vietsub'}
                          </p>
                        </td>

                        {/* Rating */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={13} fill="#FFC107" color="#FFC107" />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFC107' }}>
                              {movie.rating ?? '8.0'}
                            </span>
                          </div>
                        </td>

                        {/* Featured Toggle */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleFeatured(movie)}
                            title={movie.featured ? 'Bỏ Tiêu điểm' : 'Đặt làm Tiêu điểm'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: movie.featured
                                ? 'rgba(229, 57, 79, 0.2)'
                                : 'rgba(255, 255, 255, 0.05)',
                              color: movie.featured ? 'var(--accent-crimson)' : 'var(--text-muted)',
                              border: movie.featured
                                ? '1px solid rgba(229, 57, 79, 0.4)'
                                : '1px solid transparent',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Flame size={12} />
                            {movie.featured ? 'Bật' : 'Tắt'}
                          </button>
                        </td>

                        {/* Trending Toggle */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleTrending(movie)}
                            title={movie.trending ? 'Bỏ Thịnh hành' : 'Đặt làm Thịnh hành'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: movie.trending
                                ? 'rgba(130, 120, 255, 0.2)'
                                : 'rgba(255, 255, 255, 0.05)',
                              color: movie.trending ? 'var(--accent-violet)' : 'var(--text-muted)',
                              border: movie.trending
                                ? '1px solid rgba(130, 120, 255, 0.4)'
                                : '1px solid transparent',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Sparkles size={12} />
                            {movie.trending ? 'Bật' : 'Tắt'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Link
                              href={isSeriesOrAnime ? `/series/${movie.slug}` : `/movie/${movie.slug}`}
                              target="_blank"
                              title="Xem trực tiếp trên web"
                              style={{
                                padding: '8px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s',
                              }}
                            >
                              <Eye size={15} />
                            </Link>

                            <Link
                              href={`/admin/movies/${movie.id}/edit`}
                              title="Chỉnh sửa phim"
                              style={{
                                padding: '8px',
                                borderRadius: '6px',
                                background: 'rgba(130, 120, 255, 0.12)',
                                color: 'var(--accent-violet)',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s',
                              }}
                            >
                              <Edit size={15} />
                            </Link>

                            <button
                              onClick={() => setMovieToDelete(movie)}
                              title="Xóa phim"
                              style={{
                                padding: '8px',
                                borderRadius: '6px',
                                background: 'rgba(229, 57, 79, 0.12)',
                                color: 'var(--accent-crimson)',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Hiển thị {paginatedMovies.length} trên tổng số {filteredMovies.length} tác phẩm
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ChevronLeft size={14} /> Trước
              </button>

              <span style={{ padding: '0 8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Trang {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {movieToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#14161f',
              border: '1px solid rgba(229, 57, 79, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(229, 57, 79, 0.15)',
                  color: 'var(--accent-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Xác nhận xóa tác phẩm
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              Bạn có chắc chắn muốn xóa bộ phim{' '}
              <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{movieToDelete.title}&rdquo;</strong> khỏi
              hệ thống kho dữ liệu CINEVERSE không?
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setMovieToDelete(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  background: 'var(--accent-crimson)',
                }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
