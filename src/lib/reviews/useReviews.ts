'use client';

import { useSyncExternalStore } from 'react';
import { reviewService } from './review-service';
import type { Review } from '@/types/review';

const EMPTY_REVIEWS: Review[] = [];

function subscribe(callback: () => void) {
  return reviewService.subscribe(callback);
}

function getSnapshot(): Review[] {
  return reviewService.getAllReviews();
}

function getServerSnapshot(): Review[] {
  return EMPTY_REVIEWS;
}

export function useReviews(movieId?: string) {
  const allReviews = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const movieReviews = movieId
    ? allReviews.filter(
        (r) =>
          (r.movieId === movieId || r.movieId.toLowerCase() === movieId.toLowerCase()) &&
          r.status === 'approved'
      )
    : allReviews;

  const stats = movieId
    ? reviewService.getMovieRatingStats(movieId)
    : reviewService.getStats();

  return {
    allReviews,
    movieReviews,
    stats,
    addReview: reviewService.addReview.bind(reviewService),
    toggleLike: reviewService.toggleLike.bind(reviewService),
    updateStatus: reviewService.updateStatus.bind(reviewService),
    deleteReview: reviewService.deleteReview.bind(reviewService),
  };
}
