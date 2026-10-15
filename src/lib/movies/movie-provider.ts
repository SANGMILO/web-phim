import type { Movie, MovieFilter, ContentType } from '@/types/movie';

/** Provider interface — swap this with an API provider in the future */
export interface MovieProvider {
  getFeatured(): Promise<Movie[]>;
  getTrending(): Promise<Movie[]>;
  getByCategory(type: ContentType): Promise<Movie[]>;
  getByGenre(genre: string): Promise<Movie[]>;
  getTheaterReleases(): Promise<Movie[]>;
  getUpcoming(): Promise<Movie[]>;
  getById(id: string): Promise<Movie | null>;
  search(filter: MovieFilter): Promise<Movie[]>;
  getRelated(movieId: string): Promise<Movie[]>;
  getAll(): Promise<Movie[]>;
}
