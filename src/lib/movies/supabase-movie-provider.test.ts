import { describe, expect, it } from 'vitest';
import { demoMovies } from '@/data/demo-movies';
import type { Movie } from '@/types/movie';
import { mergePublishedMoviesWithDemo } from './supabase-movie-provider';

describe('mergePublishedMoviesWithDemo', () => {
  it('keeps the demo catalog while preferring a published playback source', () => {
    const demoDuneTwo = demoMovies.find((movie) => movie.slug === 'dune-2');
    expect(demoDuneTwo).toBeDefined();

    const publishedDuneTwo: Movie = {
      ...demoDuneTwo!,
      id: '00000000-0000-0000-0000-000000000002',
      playbackSources: [{
        id: 'source-2',
        provider: 'google_drive',
        externalFileId: '123456789012345',
        playbackMode: 'preview',
        label: 'Google Drive',
        status: 'active',
        displayOrder: 0,
      }],
    };

    const result = mergePublishedMoviesWithDemo([publishedDuneTwo]);
    const duneTwo = result.find((movie) => movie.slug === 'dune-2');

    expect(result).toHaveLength(demoMovies.length);
    expect(duneTwo?.id).toBe(publishedDuneTwo.id);
    expect(duneTwo?.isDemo).toBe(false);
    expect(duneTwo?.playbackSources?.[0]?.provider).toBe('google_drive');
  });

  it('adds newly published movies without dropping bundled movies', () => {
    const newMovie: Movie = {
      id: '00000000-0000-0000-0000-000000000003',
      slug: 'new-published-movie',
      title: 'New Published Movie',
      overview: '',
      posterUrl: '',
      backdropUrl: '',
      year: 2026,
      genres: [],
      contentType: 'movie',
    };

    const result = mergePublishedMoviesWithDemo([newMovie]);

    expect(result).toHaveLength(demoMovies.length + 1);
    expect(result[0]).toMatchObject({ slug: newMovie.slug, isDemo: false });
  });
});
