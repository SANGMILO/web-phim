'use client';

import React, { useState, useMemo } from 'react';
import {
  Star,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
  Sparkles,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';
import { useReviews } from '@/lib/reviews/useReviews';
import { useAuth } from '@/components/providers/AuthProvider';

interface MovieReviewsProps {
  movieId: string;
  movieTitle: string;
}

const RATING_LABELS: Record<number, string> = {
  10: 'Tuyệt đỉnh điện ảnh!',
  9: 'Rất hay, xuất sắc',
  8: 'Hay, đáng xem',
  7: 'Khá ổn, giải trí tốt',
  6: 'Xem được, vừa phải',
  5: 'Trung bình, bình thường',
  4: 'Dưới kỳ vọng',
  3: 'Kém, cốt truyện rời rạc',
  2: 'Rất tệ',
  1: 'Thảm họa điện ảnh',
};

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  } catch {
    return 'Gần đây';
  }
}

export function MovieReviews({ movieId, movieTitle }: MovieReviewsProps) {
  const { movieReviews, stats, addReview, toggleLike } = useReviews(movieId);
  const { user, isAuthenticated, loginDemo } = useAuth();

  // Review Form State
  const [rating, setRating] = useState<number>(10);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [content, setContent] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [hasSpoiler, setHasSpoiler] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'likes'>('newest');
  const [unmaskedSpoilers, setUnmaskedSpoilers] = useState<Record<string, boolean>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sorting
  const sortedReviews = useMemo(() => {
    const list = [...movieReviews];
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (sortBy === 'highest') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === 'likes') {
      return list.sort((a, b) => b.likes - a.likes);
    }
    return list;
  }, [movieReviews, sortBy]);

  const ratingStats = 'distribution' in stats ? stats : {
    avgRating: 8.5,
    totalCount: movieReviews.length,
    distribution: { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  };

  const currentScore = hoverRating ?? rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 5) {
      alert('Vui lòng nhập nội dung đánh giá ít nhất 5 ký tự.');
      return;
    }

    const reviewerName = isAuthenticated && user ? user.name : (guestName.trim() || 'Khán giả CineVerse');
    const reviewerId = isAuthenticated && user ? user.id : 'guest-' + Date.now();
    const reviewerAvatar = user?.avatarUrl;

    addReview({
      movieId,
      movieTitle,
      userId: reviewerId,
      userName: reviewerName,
      userAvatar: reviewerAvatar,
      rating,
      content,
      hasSpoiler,
    });

    setContent('');
    setHasSpoiler(false);
    setSuccessToast('Đánh giá của bạn đã được đăng thành công!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const toggleSpoilerReveal = (id: string) => {
    setUnmaskedSpoilers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section
      style={{
        marginTop: '48px',
        marginBottom: '64px',
        padding: 'clamp(18px, 3vw, 32px) clamp(14px, 3vw, 24px)',
        background: 'var(--bg-secondary, #101116)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.2), rgba(245, 158, 11, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <MessageSquare size={20} color="#F59E0B" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary, #fff)' }}>
              Đánh Giá & Bình Luận ({ratingStats.totalCount})
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted, #8E8F99)', margin: '4px 0 0 0' }}>
              Ý kiến chân thực từ cộng đồng khán giả về {movieTitle}
            </p>
          </div>
        </div>

        {/* Sort Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setSortBy('newest')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: sortBy === 'newest' ? 'var(--accent-crimson, #E50914)' : 'transparent',
              color: sortBy === 'newest' ? '#fff' : '#8E8F99',
              transition: 'all 0.2s',
            }}
          >
            Mới nhất
          </button>
          <button
            onClick={() => setSortBy('highest')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: sortBy === 'highest' ? 'var(--accent-crimson, #E50914)' : 'transparent',
              color: sortBy === 'highest' ? '#fff' : '#8E8F99',
              transition: 'all 0.2s',
            }}
          >
            Điểm cao nhất
          </button>
          <button
            onClick={() => setSortBy('likes')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: sortBy === 'likes' ? 'var(--accent-crimson, #E50914)' : 'transparent',
              color: sortBy === 'likes' ? '#fff' : '#8E8F99',
              transition: 'all 0.2s',
            }}
          >
            Nhiều lượt thích
          </button>
        </div>
      </div>

      {/* Rating Overview Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
          gap: '24px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Big Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(229, 9, 20, 0.15))',
              borderRadius: '14px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              minWidth: '110px',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>
              {ratingStats.avgRating}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
              trên 10
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  fill={s <= Math.round(ratingStats.avgRating / 2) ? '#F59E0B' : 'transparent'}
                  color="#F59E0B"
                />
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              Điểm Đánh Giá Khán Giả
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#8E8F99' }}>
              Tổng cộng <strong>{ratingStats.totalCount}</strong> lượt bình luận đã được xác thực từ cộng đồng mê phim.
            </p>
          </div>
        </div>

        {/* Breakdown bars for 10, 8, 6, 4 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
          {[10, 9, 8, 7, 6].map((score) => {
            const count = ratingStats.distribution[score] || 0;
            const pct = ratingStats.totalCount > 0 ? Math.round((count / ratingStats.totalCount) * 100) : 0;
            return (
              <div key={score} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ width: '42px', color: '#8E8F99', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {score} <Star size={10} fill="#F59E0B" color="#F59E0B" />
                </span>
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #F59E0B, #E50914)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <span style={{ width: '32px', textAlign: 'right', color: '#8E8F99', fontSize: '11px' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Submission Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'rgba(23, 25, 32, 0.95)',
          borderRadius: '14px',
          padding: 'clamp(16px, 3vw, 24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#E50914" />
            Viết cảm nhận của bạn
          </h3>

          {!isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8E8F99' }}>
              <span>Chưa đăng nhập?</span>
              <button
                type="button"
                onClick={() => loginDemo()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#F59E0B',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                  fontSize: '12px',
                }}
              >
                Đăng nhập demo nhanh
              </button>
            </div>
          )}
        </div>

        {/* 10 Star Rating Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
            Bạn đánh giá bộ phim này bao nhiêu sao? (Thang điểm 1 - 10)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starValue) => {
              const isFilled = starValue <= currentScore;
              return (
                <button
                  key={starValue}
                  type="button"
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(starValue)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: isFilled ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                    background: isFilled ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    padding: 0,
                  }}
                  title={`${starValue}/10 sao`}
                >
                  <Star
                    size={16}
                    fill={isFilled ? '#F59E0B' : 'transparent'}
                    color={isFilled ? '#F59E0B' : 'rgba(255,255,255,0.3)'}
                  />
                </button>
              );
            })}
            <div
              style={{
                margin: '4px 0',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#F59E0B',
                fontSize: '13px',
                fontWeight: 700,
                maxWidth: '100%',
              }}
            >
              {currentScore}/10 - {RATING_LABELS[currentScore]}
            </div>
          </div>
        </div>

        {/* User name input if guest */}
        {!isAuthenticated && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '6px' }}>
              Tên hiển thị của bạn
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="VD: Tuấn Hoàng, Hương Ly..."
              style={{
                width: '100%',
                maxWidth: '360px',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Text Area */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '6px' }}>
            Nội dung nhận xét & bình luận
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Hãy chia sẻ góc nhìn của bạn về diễn xuất, âm thanh, kỹ xảo hay thông điệp của phim..."
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#8E8F99' }}>
              {content.length} ký tự
            </span>
          </div>
        </div>

        {/* Footer controls: Spoiler checkbox & Submit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color: hasSpoiler ? '#F59E0B' : '#8E8F99',
            }}
          >
            <input
              type="checkbox"
              checked={hasSpoiler}
              onChange={(e) => setHasSpoiler(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#F59E0B', width: '16px', height: '16px' }}
            />
            <AlertTriangle size={15} />
            <span>Nội dung có tiết lộ cốt truyện (Spoiler)</span>
          </label>

          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              background: 'linear-gradient(135deg, #E50914, #B81D24)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Send size={15} />
            Gửi đánh giá
          </button>
        </div>

        {successToast && (
          <div
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'rgba(46, 213, 115, 0.15)',
              border: '1px solid #2ed573',
              color: '#2ed573',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ✓ {successToast}
          </div>
        )}
      </form>

      {/* Review List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sortedReviews.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#8E8F99',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}
          >
            <MessageSquare size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
              Chưa có bình luận nào cho bộ phim này
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px' }}>
              Hãy là người đầu tiên chia sẻ cảm nhận của bạn!
            </p>
          </div>
        ) : (
          sortedReviews.map((rev) => {
            const isSpoiler = Boolean(rev.hasSpoiler);
            const isUnmasked = unmaskedSpoilers[rev.id];

            return (
              <div
                key={rev.id}
                style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'background 0.2s',
                }}
              >
                {/* Author Info & Rating */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* User Avatar */}
                    {rev.userAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #E50914, #7928CA)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '15px',
                          color: '#fff',
                        }}
                      >
                        {rev.userName ? rev.userName[0].toUpperCase() : <UserIcon size={18} />}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                          {rev.userName}
                        </span>
                        {rev.rating >= 9 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#F59E0B',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            VIP MEMBER
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8E8F99', marginTop: '2px' }}>
                        {formatRelativeTime(rev.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#F59E0B',
                      fontWeight: 800,
                      fontSize: '13px',
                    }}
                  >
                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                    <span>{rev.rating}/10</span>
                  </div>
                </div>

                {/* Spoiler Mask or Content */}
                {isSpoiler && !isUnmasked ? (
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      margin: '8px 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontSize: '13px', fontWeight: 600 }}>
                      <ShieldAlert size={16} />
                      <span>Đánh giá này có chứa nội dung tiết lộ tình tiết phim.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSpoilerReveal(rev.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#F59E0B',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={13} />
                      Bấm để xem
                    </button>
                  </div>
                ) : (
                  <div>
                    {isSpoiler && isUnmasked && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Cảnh báo spoiler đang hiển thị
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSpoilerReveal(rev.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#8E8F99',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <EyeOff size={12} /> Ẩn lại
                        </button>
                      </div>
                    )}
                    <p
                      style={{
                        margin: '10px 0 14px 0',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        color: 'rgba(255, 255, 255, 0.9)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {rev.content}
                    </p>
                  </div>
                )}

                {/* Bottom actions: Like Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => toggleLike(rev.id, user ? user.id : 'user-client')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: rev.likes > 0 ? '#E50914' : '#8E8F99',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ThumbsUp size={13} fill={rev.likes > 0 ? '#E50914' : 'transparent'} />
                    <span>Hữu ích ({rev.likes})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
