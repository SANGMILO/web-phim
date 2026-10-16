'use client';

import React from 'react';
import Link from 'next/link';
import {
  Film,
  Tv,
  Sparkles,
  Clapperboard,
  Plus,
  ArrowUpRight,
  Star,
  Eye,
  Edit,
  Download,
  Flame,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useMovieAdmin } from '@/lib/movies/useMovieAdmin';
import { MovieImage } from '@/components/common/MovieImage';
import { useToast } from '@/components/admin/AdminToast';

export default function AdminDashboardPage() {
  const { movies, toggleFeatured, exportJson } = useMovieAdmin();
  const { showToast } = useToast();

  // Computed metrics
  const totalMovies = movies.filter((m) => m.contentType === 'movie').length;
  const totalSeries = movies.filter((m) => m.contentType === 'series').length;
  const totalAnime = movies.filter((m) => m.contentType === 'anime').length;
  const totalTheaters = movies.filter((m) => m.inTheaters).length;
  const totalFeatured = movies.filter((m) => m.featured).length;

  const avgRating =
    movies.length > 0
      ? (
          movies.reduce((sum, m) => sum + (m.rating || 0), 0) / movies.length
        ).toFixed(1)
      : '0.0';

  // Genre breakdown
  const genreCount: Record<string, number> = {};
  movies.forEach((m) => {
    m.genres.forEach((g) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });
  const sortedGenres = Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const handleExportBackup = () => {
    const jsonStr = exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cineverse-movies-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file sao lưu JSON thành công!', 'success');
  };

  const handleQuickFeatured = (id: string, title: string) => {
    toggleFeatured(id);
    showToast(`Đã thay đổi trạng thái Tiêu điểm cho "${title}"`, 'info');
  };

  return (
    <>
      <AdminHeader
        onToggleSidebar={() => {
          const sidebar = document.querySelector('.admin-sidebar');
          if (sidebar) sidebar.classList.toggle('open');
        }}
        title="Tổng quan Dashboard"
        subtitle={`Hệ thống hiện có ${movies.length} tác phẩm điện ảnh trong kho`}
      />

      <div style={{ padding: '28px', maxWidth: '1400px', width: '100%' }}>
        {/* Metric Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                TỔNG SỐ TÁC PHẨM
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(229, 57, 79, 0.12)',
                  color: 'var(--accent-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Film size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {movies.length}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>tác phẩm</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Bao gồm phim lẻ, phim bộ và anime
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                PHIM LẺ & CHIẾU RẠP
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(130, 120, 255, 0.12)',
                  color: 'var(--accent-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clapperboard size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {totalMovies}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--accent-cyan)' }}>
                ({totalTheaters} rạp)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Chất lượng từ CAM đến 4K Ultra HD
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                SERIES & ANIME
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(117, 221, 243, 0.12)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Tv size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {totalSeries + totalAnime}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                ({totalSeries} bộ / {totalAnime} anime)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Đầy đủ danh sách tập phim & Vietsub
            </p>
          </div>

          {/* Card 4 */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                ĐIỂM ĐÁNH GIÁ TRUNG BÌNH
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 193, 7, 0.12)',
                  color: '#FFC107',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Star size={18} fill="#FFC107" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {avgRating}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 10</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {totalFeatured} phim nằm trong mục Tiêu điểm
            </p>
          </div>
        </div>

        {/* Quick Action Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(229,57,79,0.15) 0%, rgba(130,120,255,0.1) 100%)',
            border: '1px solid rgba(229, 57, 79, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--accent-crimson)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Bắt đầu thêm hoặc cập nhật tác phẩm mới
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Dễ dàng chỉnh sửa thông tin, tập phim, poster và đường dẫn phát video trực tiếp.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportBackup}
              className="btn btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={14} /> Sao lưu JSON
            </button>
            <Link
              href="/admin/movies/new"
              className="btn btn-primary"
              style={{
                padding: '8px 18px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} /> Thêm phim ngay
            </Link>
          </div>
        </div>

        {/* Two Column Layout: Recent Movies & Genre Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Recent Movies */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Phim mới thêm & cập nhật</h2>
              <Link
                href="/admin/movies"
                style={{
                  fontSize: '13px',
                  color: 'var(--accent-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                Xem tất cả ({movies.length}) <ArrowUpRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {movies.slice(0, 6).map((movie) => (
                <div
                  key={movie.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '62px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0,
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

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
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
                      {movie.year} • {movie.genres.slice(0, 2).join(', ')} • {movie.quality}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleQuickFeatured(movie.id, movie.title)}
                      title={movie.featured ? 'Đang là Tiêu điểm' : 'Bấm để đặt làm Tiêu điểm'}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        background: movie.featured
                          ? 'rgba(229, 57, 79, 0.2)'
                          : 'rgba(255, 255, 255, 0.04)',
                        color: movie.featured ? 'var(--accent-crimson)' : 'var(--text-muted)',
                      }}
                    >
                      <Flame size={14} />
                    </button>

                    <Link
                      href={`/admin/movies/${movie.id}/edit`}
                      title="Sửa phim"
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Edit size={14} />
                    </Link>

                    <Link
                      href={`/movie/${movie.slug}`}
                      target="_blank"
                      title="Xem trực tiếp trên web"
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Eye size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Genre Distribution */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Phân bổ thể loại phim</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {Object.keys(genreCount).length} thể loại
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sortedGenres.map(([genre, count]) => {
                const percentage = Math.round((count / movies.length) * 100);

                return (
                  <div key={genre}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {genre}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {count} phim ({percentage}%)
                      </span>
                    </div>

                    <div
                      style={{
                        height: '6px',
                        width: '100%',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          borderRadius: '3px',
                          background: 'linear-gradient(90deg, var(--accent-crimson), var(--accent-violet))',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
