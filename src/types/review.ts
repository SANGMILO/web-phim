export type ReviewStatus = 'approved' | 'hidden';

export interface Review {
  id: string;
  movieId: string;
  movieTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 10
  content: string;
  hasSpoiler?: boolean;
  likes: number;
  likedBy?: string[];
  createdAt: string; // ISO date
  status: ReviewStatus;
}

export interface MovieRatingStats {
  avgRating: number;
  totalCount: number;
  distribution: Record<number, number>;
}
