import { describe, expect, it, beforeEach } from 'vitest';
import { movieStore } from './movie-storage';

describe('movieStore storage and retrieval tests', () => {
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

  it('updates existing movie when edited in admin', () => {
    const driveUrl = 'https://drive.google.com/file/d/1ykPSKpbGcE8Fu2zpk4QfaN_8kSr3iRUe/preview';
    
    // Admin edits dune-1
    const res = movieStore.saveMovie({
      id: 'dune-1',
      title: 'Hành Tinh Cát (Dune: Phần 1)',
      slug: 'dune-1',
      contentType: 'movie',
      gdriveUrl: driveUrl,
      playbackUrl: driveUrl,
    });

    expect(res.success).toBe(true);
    expect(res.isNew).toBe(false);

    // Retrieve by dune-1
    const movie = movieStore.getMovieById('dune-1');
    expect(movie).not.toBeNull();
    expect(movie?.gdriveUrl).toBe(driveUrl);
  });

  it('retrieves newly created movie by generated slug', () => {
    const driveUrl = 'https://drive.google.com/file/d/1ykPSKpbGcE8Fu2zpk4QfaN_8kSr3iRUe/preview';
    
    // Admin adds new movie
    const res = movieStore.saveMovie({
      title: 'Hành Tinh Cát (Dune 1)',
      contentType: 'movie',
      gdriveUrl: driveUrl,
      playbackUrl: driveUrl,
    });

    expect(res.success).toBe(true);
    expect(res.isNew).toBe(true);

    // Slug should match
    const movieBySlug = movieStore.getMovieById('hanh-tinh-cat-dune-1');
    expect(movieBySlug).not.toBeNull();
    expect(movieBySlug?.gdriveUrl).toBe(driveUrl);

    // Alias dune-1 should also match if searched
    const movieByAlias = movieStore.getMovieById('dune-1');
    expect(movieByAlias).not.toBeNull();
    expect(movieByAlias?.gdriveUrl).toBe(driveUrl);
  });

  it('does not confuse similarly named sequels when one has a Drive source', () => {
    const duneOne = movieStore.getMovieById('dune-1');
    const duneTwo = movieStore.getMovieById('dune-2');

    expect(duneOne?.id).toBe('dune-1');
    expect(duneTwo?.id).toBe('dune-2');
    expect(duneTwo?.title).toBe('Xứ Cát: Phần Hai');
  });
});
