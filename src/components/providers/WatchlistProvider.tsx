'use client';

import React, { createContext, useContext, useSyncExternalStore, useCallback } from 'react';
import { watchlistService } from '@/lib/watchlist-service';

interface WatchlistContextType {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
}

const WatchlistContext = createContext<WatchlistContextType>({
  ids: [],
  has: () => false,
  toggle: () => {},
  count: 0,
});

export function useWatchlist() {
  return useContext(WatchlistContext);
}

const listeners = new Set<() => void>();

function notifyChange() {
  listeners.forEach((cb) => cb());
}

function subscribe(callback: () => void) {
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
}

const EMPTY_IDS: string[] = [];
let cachedIds: string[] = EMPTY_IDS;
let cachedRaw: string | null = null;

function getSnapshot(): string[] {
  if (typeof window === 'undefined') return EMPTY_IDS;
  const raw = localStorage.getItem('cineverse-watchlist');
  if (raw === null) {
    cachedRaw = null;
    cachedIds = EMPTY_IDS;
    return EMPTY_IDS;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = JSON.parse(raw);
      cachedIds = Array.isArray(parsed) ? parsed : EMPTY_IDS;
    } catch {
      cachedIds = EMPTY_IDS;
    }
  }
  return cachedIds;
}

function getServerSnapshot(): string[] {
  return EMPTY_IDS;
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    watchlistService.toggle(id);
    notifyChange();
  }, []);

  return (
    <WatchlistContext.Provider value={{ ids, has, toggle, count: ids.length }}>
      {children}
    </WatchlistContext.Provider>
  );
}
