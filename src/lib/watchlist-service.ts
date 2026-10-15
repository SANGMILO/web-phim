'use client';

/**
 * Watchlist persistence — uses localStorage for the demo.
 * Swap with an API-backed service for authenticated users.
 */

const STORAGE_KEY = 'cineverse-watchlist';

function getIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(ids: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export const watchlistService = {
  getAll(): string[] {
    return getIds();
  },

  has(movieId: string): boolean {
    return getIds().includes(movieId);
  },

  add(movieId: string): void {
    const ids = getIds();
    if (!ids.includes(movieId)) {
      ids.unshift(movieId);
      persist(ids);
    }
  },

  remove(movieId: string): void {
    persist(getIds().filter((id) => id !== movieId));
  },

  toggle(movieId: string): boolean {
    if (watchlistService.has(movieId)) {
      watchlistService.remove(movieId);
      return false;
    } else {
      watchlistService.add(movieId);
      return true;
    }
  },
};
