import { DemoMovieProvider } from './demo-movie-provider';
import { SupabaseMovieProvider } from './supabase-movie-provider';
import type { MovieProvider } from './movie-provider';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Singleton movie service.
 * Swap DemoMovieProvider with an API-backed provider when ready.
 */
let provider: MovieProvider | null = null;

function getProvider(): MovieProvider {
  if (!provider) {
    provider = isSupabaseConfigured()
      ? new SupabaseMovieProvider()
      : new DemoMovieProvider();
  }
  return provider;
}

export const movieService = {
  getFeatured: () => getProvider().getFeatured(),
  getTrending: () => getProvider().getTrending(),
  getByCategory: (...args: Parameters<MovieProvider['getByCategory']>) =>
    getProvider().getByCategory(...args),
  getByGenre: (...args: Parameters<MovieProvider['getByGenre']>) =>
    getProvider().getByGenre(...args),
  getTheaterReleases: () => getProvider().getTheaterReleases(),
  getUpcoming: () => getProvider().getUpcoming(),
  getById: (...args: Parameters<MovieProvider['getById']>) =>
    getProvider().getById(...args),
  search: (...args: Parameters<MovieProvider['search']>) =>
    getProvider().search(...args),
  getRelated: (...args: Parameters<MovieProvider['getRelated']>) =>
    getProvider().getRelated(...args),
  getAll: () => getProvider().getAll(),
};
