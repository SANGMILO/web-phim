'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Star,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  ThumbsUp,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useReviews } from '@/lib/reviews/useReviews';
import { useToast } from '@/components/admin/AdminToast';
import type { ReviewStatus } from '@/types/review';

export default function AdminReviewsPage() {
  const { allReviews, updateStatus, deleteReview } = useReviews();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | '10' | '9' | '8' | 'low'>('all');
  const [spoilerFilter, setSpoilerFilter] = useState<'all' | 'spoiler'>('all');

  // Computed metrics
  const totalCount = allReviews.length;
  const hiddenCount = allReviews.filter((r) => r.status === 'hidden').length;
  const approvedCount = totalCount - hiddenCount;
  const avgRating =
    totalCount > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
      : '0.0';
  const highRatingsCount = allReviews.filter((r) => r.rating >= 8).length;
  const positivePercentage = totalCount > 0 ? Math.round((highRatingsCount / totalCount) * 100) : 0;

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return allReviews.filter((rev) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rev.movieTitle.toLowerCase().includes(q);
        const matchUser = rev.userName.toLowerCase().includes(q);
        const matchContent = rev.content.toLowerCase().includes(q);
        if (!matchTitle && !matchUser && !matchContent) return false;
      }

      // Status
      if (statusFilter !== 'all' && rev.status !== statusFilter) return false;

      // Rating
      if (ratingFilter === '10' && rev.rating !== 10) return false;
      if (ratingFilter === '9' && rev.rating !== 9) return false;
      if (ratingFilter === '8' && rev.rating !== 8) return false;
      if (ratingFilter === 'low' && rev.rating >= 6) return false;

      // Spoiler
      if (spoilerFilter === 'spoiler' && !rev.hasSpoiler) return false;

      return true;
    });
  }, [allReviews, searchQuery, statusFilter, ratingFilter, spoilerFilter]);

  const handleToggleStatus = (id: string, currentStatus: ReviewStatus, userName: string) => {
    const newStatus: ReviewStatus = currentStatus === 'approved' ? 'hidden' : 'approved';
    const success = updateStatus(id, newStatus);
    if (success) {
      showToast(
        newStatus === 'hidden'
          ? `Đã ẩn bình luận của "${userName}"`
          : `Đã duyệt hiển thị bình luận của "${userName}"`,
        newStatus === 'hidden' ? 'warning' : 'success'
      );
    }
  };

  const handleDelete = (id: string, userName: string) => {
    if (confirm(`Bạn có chắc muốn xóa vĩnh viễn đánh giá của "${userName}"?`)) {
      const success = deleteReview(id);
      if (success) {
        showToast(`Đã xóa đánh giá của "${userName}"`, 'info');
      }
    }
  };

  return (
    <>
      <AdminHeader
        onToggleSidebar={() => {
          const sidebar = document.querySelector('.admin-sidebar');
          if (sidebar) sidebar.classList.toggle('open');
        }}
        title="Quản lý Đánh Giá & Bình Luận"
        subtitle={`Kiểm duyệt và thống kê ${totalCount} ý kiến khán giả trên toàn hệ thống`}
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
          {/* Metric 1 */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                TỔNG ĐÁNH GIÁ
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(229, 9, 20, 0.12)',
                  color: 'var(--accent-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {totalCount}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>bình luận</span>
            </div>
            <p style={{ fontSize: '12px', color: '#2ed573', marginTop: '8px' }}>
              🟢 {approvedCount} đang hiển thị công khai
            </p>
          </div>

          {/* Metric 2 */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                ĐIỂM TRUNG BÌNH
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Star size={18} fill="#F59E0B" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {avgRating}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 10 sao</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Thang điểm trung bình các tác phẩm
            </p>
          </div>

          {/* Metric 3 */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                ĐÁNH GIÁ TÍCH CỰC
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(46, 213, 115, 0.12)',
                  color: '#2ed573',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {positivePercentage}%
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>đạt 8-10 sao</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {highRatingsCount} lượt đánh giá xuất sắc
            </p>
          </div>

          {/* Metric 4 */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                ĐÃ ẨN / CẦN DUYỆT
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 71, 87, 0.12)',
                  color: '#ff4757',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EyeOff size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="font-display" style={{ fontSize: '32px', fontWeight: 800 }}>
                {hiddenCount}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>bình luận</span>
            </div>
            <p style={{ fontSize: '12px', color: hiddenCount > 0 ? '#ff4757' : 'var(--text-secondary)', marginTop: '8px' }}>
              {hiddenCount > 0 ? 'Có bình luận đang bị ẩn khỏi web' : 'Không có vi phạm'}
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            background: '#101116',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 280px',
              maxWidth: '400px',
            }}
          >
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
              type="text"
              placeholder="Tìm theo tên phim, người đăng, nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Filter size={14} /> Lọc:
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ReviewStatus)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="approved">🟢 Đang hiển thị</option>
              <option value="hidden">🔴 Đã ẩn</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as 'all' | '10' | '9' | '8' | 'low')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả điểm số</option>
              <option value="10">⭐ 10 sao (Tuyệt đỉnh)</option>
              <option value="9">⭐ 9 sao (Xuất sắc)</option>
              <option value="8">⭐ 8 sao (Hay)</option>
              <option value="low">⭐ Dưới 6 sao (Kém/TB)</option>
            </select>

            {/* Spoiler Filter */}
            <select
              value={spoilerFilter}
              onChange={(e) => setSpoilerFilter(e.target.value as 'all' | 'spoiler')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Spoiler: Tất cả</option>
              <option value="spoiler">⚠️ Chỉ bài có Spoiler</option>
            </select>
          </div>
        </div>

        {/* Reviews Table */}
        <div
          style={{
            background: '#101116',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg, 12px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '16px 20px' }}>Tác phẩm</th>
                  <th style={{ padding: '16px 20px' }}>Khán giả</th>
                  <th style={{ padding: '16px 20px' }}>Điểm</th>
                  <th style={{ padding: '16px 20px', minWidth: '300px' }}>Nội dung nhận xét</th>
                  <th style={{ padding: '16px 20px' }}>Thích</th>
                  <th style={{ padding: '16px 20px' }}>Trạng thái</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <MessageSquare size={32} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        Không tìm thấy bình luận nào phù hợp
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                        Thử thay đổi từ khóa tìm kiếm hoặc bỏ các bộ lọc
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((rev) => (
                    <tr
                      key={rev.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Movie Title */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <Link
                          href={`/movie/${rev.movieId}`}
                          target="_blank"
                          style={{
                            fontWeight: 700,
                            color: 'var(--accent-cyan)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          {rev.movieTitle}
                          <ArrowUpRight size={13} />
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          ID: {rev.movieId}
                        </div>
                      </td>

                      {/* User */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {rev.userAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={rev.userAvatar}
                              alt={rev.userName}
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-crimson), var(--accent-violet))',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '13px',
                              }}
                            >
                              {rev.userName[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{rev.userName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#F59E0B',
                            fontWeight: 800,
                            fontSize: '12px',
                          }}
                        >
                          <Star size={13} fill="#F59E0B" />
                          {rev.rating}/10
                        </div>
                      </td>

                      {/* Content */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        {rev.hasSpoiler && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              fontSize: '11px',
                              fontWeight: 700,
                              marginBottom: '6px',
                            }}
                          >
                            <ShieldAlert size={12} />
                            Spoiler Alert
                          </div>
                        )}
                        <p
                          style={{
                            margin: 0,
                            color: 'rgba(255, 255, 255, 0.85)',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}
                        >
                          {rev.content}
                        </p>
                      </td>

                      {/* Likes */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <ThumbsUp size={13} />
                          <span>{rev.likes}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        {rev.status === 'approved' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(46, 213, 115, 0.12)',
                              color: '#2ed573',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            🟢 Hiển thị
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(255, 71, 87, 0.12)',
                              color: '#ff4757',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            🔴 Đã ẩn
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rev.id, rev.status, rev.userName)}
                            title={rev.status === 'approved' ? 'Ẩn bình luận này' : 'Duyệt hiển thị bình luận'}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background:
                                rev.status === 'approved'
                                  ? 'rgba(255, 255, 255, 0.05)'
                                  : 'rgba(46, 213, 115, 0.2)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: rev.status === 'approved' ? 'var(--text-secondary)' : '#2ed573',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {rev.status === 'approved' ? <EyeOff size={13} /> : <Eye size={13} />}
                            {rev.status === 'approved' ? 'Ẩn' : 'Hiện'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(rev.id, rev.userName)}
                            title="Xóa vĩnh viễn"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 71, 87, 0.1)',
                              border: '1px solid rgba(255, 71, 87, 0.2)',
                              color: '#ff4757',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
