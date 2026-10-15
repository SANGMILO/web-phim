export type ContentType = 'movie' | 'series' | 'anime';

export interface Episode {
  id: string;
  number: number;
  title: string;
  overview?: string;
  runtime?: number;
  thumbnailUrl?: string;
  playbackUrl?: string;
}

export interface Season {
  number: number;
  title: string;
  episodeCount: number;
  episodes: Episode[];
}

export interface CastMember {
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface Movie {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseDate?: string;
  year: number;
  runtime?: number;
  genres: string[];
  rating?: number;
  contentType: ContentType;
  trailerUrl?: string;
  playbackUrl?: string;
  cast?: CastMember[];
  director?: string;
  seasons?: Season[];
  episodes?: Episode[];
  quality?: string;
  language?: string;
  country?: string;
  status?: 'released' | 'upcoming' | 'ongoing';
  featured?: boolean;
  trending?: boolean;
  inTheaters?: boolean;
  /** True only for the bundled catalog shown while Supabase has no published movies. */
  isDemo?: boolean;
}

export interface MovieFilter {
  genre?: string;
  year?: number;
  contentType?: ContentType;
  query?: string;
  sort?: 'newest' | 'oldest' | 'rating' | 'title';
}

export interface WatchProgress {
  movieId: string;
  episodeId?: string;
  progress: number; // 0-100
  lastWatched: string;
}
