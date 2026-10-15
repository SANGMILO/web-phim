'use client';

import type { WatchProgress } from '@/types/movie';

const STORAGE_KEY = 'cineverse-watch-history';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

const EMPTY_HISTORY: WatchProgress[] = [];
let cachedHistory: WatchProgress[] = EMPTY_HISTORY;
let cachedRaw: string | null = null;

export const watchHistoryService = {
  subscribe(callback: () => void) {
    listeners.add(callback);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', callback);
    }
    return () => {
      listeners.delete(callback);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', callback);
      }
    };
  },

  getSnapshot(): WatchProgress[] {
    if (typeof window === 'undefined') return EMPTY_HISTORY;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      cachedRaw = null;
      cachedHistory = EMPTY_HISTORY;
      return EMPTY_HISTORY;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        const parsed = JSON.parse(raw);
        cachedHistory = Array.isArray(parsed) ? parsed : EMPTY_HISTORY;
      } catch {
        cachedHistory = EMPTY_HISTORY;
      }
    }
    return cachedHistory;
  },

  getServerSnapshot(): WatchProgress[] {
    return EMPTY_HISTORY;
  },

  getAll(): WatchProgress[] {
    return this.getSnapshot();
  },

  get(movieId: string): WatchProgress | null {
    const list = this.getAll();
    return list.find((item) => item.movieId === movieId) ?? null;
  },

  save(progress: WatchProgress): void {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getAll().filter((item) => item.movieId !== progress.movieId);
      list.unshift(progress);
      const trimmed = list.slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      notify();
    } catch {
      // Ignore storage errors
    }
  },

  remove(movieId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getAll().filter((item) => item.movieId !== movieId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      notify();
    } catch {
      // Ignore
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    notify();
  },
};
