'use client';

import { movieStore } from './movies/movie-storage';

const STORAGE_KEY = 'cineverse-watchlist';

function getIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? Array.from(new Set(parsed)) : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]): void {
  if (typeof window === 'undefined') return;
  const unique = Array.from(new Set(ids));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  window.dispatchEvent(new CustomEvent('cineverse-watchlist-updated'));
}

export const watchlistService = {
  getAll(): string[] {
    return getIds();
  },

  has(movieIdOrSlug: string): boolean {
    if (!movieIdOrSlug) return false;
    const ids = getIds();
    const clean = String(movieIdOrSlug).trim().toLowerCase();
    if (ids.some((i) => String(i).trim().toLowerCase() === clean)) {
      return true;
    }
    // Check canonical ID or slug if available in movieStore
    if (typeof window !== 'undefined') {
      const movie = movieStore.getMovieById(movieIdOrSlug);
      if (movie) {
        const mId = movie.id?.toLowerCase();
        const mSlug = movie.slug?.toLowerCase();
        return ids.some((i) => {
          const ci = String(i).trim().toLowerCase();
          return ci === mId || ci === mSlug;
        });
      }
    }
    return false;
  },

  add(movieIdOrSlug: string): void {
    if (!movieIdOrSlug) return;
    const clean = String(movieIdOrSlug).trim();
    let canonicalId = clean;
    let movieSlug = '';

    if (typeof window !== 'undefined') {
      const movie = movieStore.getMovieById(movieIdOrSlug);
      if (movie?.id) {
        canonicalId = movie.id;
        movieSlug = movie.slug || '';
      }
    }

    const ids = getIds();
    // Prune existing duplicates or alias instances of this movie
    const filtered = ids.filter((i) => {
      const ci = String(i).trim().toLowerCase();
      if (ci === canonicalId.toLowerCase()) return false;
      if (movieSlug && ci === movieSlug.toLowerCase()) return false;
      return true;
    });

    filtered.unshift(canonicalId);
    persist(filtered);
  },

  remove(movieIdOrSlug: string): void {
    if (!movieIdOrSlug) return;
    const clean = String(movieIdOrSlug).trim().toLowerCase();
    let movieSlug = '';
    let movieId = clean;

    if (typeof window !== 'undefined') {
      const movie = movieStore.getMovieById(movieIdOrSlug);
      if (movie) {
        movieId = movie.id?.toLowerCase() || clean;
        movieSlug = movie.slug?.toLowerCase() || '';
      }
    }

    const ids = getIds().filter((i) => {
      const ci = String(i).trim().toLowerCase();
      if (ci === clean) return false;
      if (ci === movieId) return false;
      if (movieSlug && ci === movieSlug) return false;
      return true;
    });

    persist(ids);
  },

  toggle(movieIdOrSlug: string): boolean {
    if (this.has(movieIdOrSlug)) {
      this.remove(movieIdOrSlug);
      return false;
    } else {
      this.add(movieIdOrSlug);
      return true;
    }
  },
};
