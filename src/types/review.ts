export type ReviewStatus = 'approved' | 'hidden';

export interface ReviewReply {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string; // ISO date
  likes?: number;
  likedBy?: string[];
}

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
  replies?: ReviewReply[];
}

export interface MovieRatingStats {
  avgRating: number;
  totalCount: number;
  distribution: Record<number, number>;
}
