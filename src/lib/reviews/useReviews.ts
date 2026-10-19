'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseReviewService } from './supabase-review-service';
import type { MovieRatingStats, Review, ReviewStatus } from '@/types/review';

function getMovieStats(reviews: Review[]): MovieRatingStats {
  const distribution: Record<number, number> = {
    10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
  };
  reviews.forEach((review) => {
    const score = Math.max(1, Math.min(10, Math.round(review.rating)));
    distribution[score] += 1;
  });
  const avgRating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : 8.5;
  return { avgRating, totalCount: reviews.length, distribution };
}

export function useReviews(movieId?: string) {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const reviews = await supabaseReviewService.getAllReviews(movieId);
      setError(null);
      setAllReviews(reviews);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tải đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const run = useCallback(async (operation: () => Promise<void>) => {
    try {
      await operation();
      await refresh();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Thao tác thất bại.');
      return false;
    }
  }, [refresh]);

  const movieReviews = movieId ? allReviews.filter((review) => review.status === 'approved') : allReviews;

  const stats = useMemo(() => {
    if (movieId) return getMovieStats(movieReviews);
    const hiddenCount = allReviews.filter((review) => review.status === 'hidden').length;
    const avgRating = allReviews.length
      ? Number((allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length).toFixed(1))
      : 8.5;
    return { totalReviews: allReviews.length, avgRating, hiddenCount };
  }, [allReviews, movieId, movieReviews]);

  return {
    allReviews,
    movieReviews,
    stats,
    loading,
    error,
    refresh,
    addReview: (data: Parameters<typeof supabaseReviewService.addReview>[0]) =>
      run(() => supabaseReviewService.addReview(data)),
    toggleLike: (reviewId: string) => run(() => supabaseReviewService.toggleLike(reviewId)),
    addReply: (reviewId: string, data: { content: string }) =>
      run(() => supabaseReviewService.addReply(reviewId, data)),
    toggleReplyLike: (reviewId: string, replyId: string) =>
      run(() => supabaseReviewService.toggleReplyLike(reviewId, replyId)),
    updateStatus: (reviewId: string, status: ReviewStatus) =>
      run(() => supabaseReviewService.updateStatus(reviewId, status)),
    deleteReview: (reviewId: string) => run(() => supabaseReviewService.deleteReview(reviewId)),
  };
}
