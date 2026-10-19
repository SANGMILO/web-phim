import { describe, it, expect, beforeEach } from 'vitest';
import { watchlistService } from './watchlist-service';
import { movieStore } from './movies/movie-storage';

describe('watchlistService and movie resolution tests', () => {
  const storageMap = new Map<string, string>();

  beforeEach(() => {
    storageMap.clear();
    globalThis.localStorage = {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => { storageMap.set(k, v); },
      removeItem: (k: string) => { storageMap.delete(k); },
      clear: () => { storageMap.clear(); },
      length: 0,
      key: () => null,
    };
    globalThis.dispatchEvent = () => true;
    (globalThis as unknown as { window?: unknown }).window = globalThis;
    globalThis.CustomEvent = class CustomEvent {
      type: string;
      detail: unknown;
      constructor(type: string, params?: { detail?: unknown }) {
        this.type = type;
        this.detail = params?.detail;
      }
    } as unknown as typeof CustomEvent;

    movieStore.resetToDefault();
  });

  it('correctly adds, checks and removes movies by id', () => {
    expect(watchlistService.has('avatar-3')).toBe(false);
    expect(watchlistService.getAll()).toEqual([]);

    watchlistService.add('avatar-3');
    expect(watchlistService.has('avatar-3')).toBe(true);
    expect(watchlistService.getAll()).toEqual(['avatar-3']);

    watchlistService.remove('avatar-3');
    expect(watchlistService.has('avatar-3')).toBe(false);
    expect(watchlistService.getAll()).toEqual([]);
  });

  it('correctly resolves and deduplicates movies by slug and canonical id', () => {
    // Add Dune 1 via slug
    watchlistService.add('dune-1');
    expect(watchlistService.has('dune-1')).toBe(true);
    // Checking by alias or id should also return true
    expect(watchlistService.has('hanh-tinh-cat-dune-1')).toBe(true);

    // Adding avatar-3 then dune-1 shouldn't duplicate
    watchlistService.add('avatar-3');
    expect(watchlistService.getAll().length).toBe(2);

    // Attempting to add dune-1 under slug shouldn't create a duplicate
    watchlistService.add('hanh-tinh-cat-dune-1');
    expect(watchlistService.getAll().length).toBe(2);
  });

  it('handles toggle correctly', () => {
    expect(watchlistService.toggle('avatar-3')).toBe(true);
    expect(watchlistService.has('avatar-3')).toBe(true);

    expect(watchlistService.toggle('avatar-3')).toBe(false);
    expect(watchlistService.has('avatar-3')).toBe(false);
  });
});
