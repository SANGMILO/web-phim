'use client';

import { useSyncExternalStore } from 'react';
import { movieStore } from './movie-storage';
import type { Movie } from '@/types/movie';

// Empty snapshot for SSR stability in React 19
const SERVER_EMPTY_MOVIES: Movie[] = [];

function subscribe(callback: () => void) {
  return movieStore.subscribe(callback);
}

function getSnapshot(): Movie[] {
  return movieStore.getMovies();
}

function getServerSnapshot(): Movie[] {
  return SERVER_EMPTY_MOVIES;
}

export function useMovieAdmin() {
  const movies = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    movies,
    getMovieById: (id: string) => movieStore.getMovieById(id),
    saveMovie: movieStore.saveMovie.bind(movieStore),
    deleteMovie: movieStore.deleteMovie.bind(movieStore),
    toggleFeatured: movieStore.toggleFeatured.bind(movieStore),
    toggleTrending: movieStore.toggleTrending.bind(movieStore),
    resetToDefault: movieStore.resetToDefault.bind(movieStore),
    exportJson: movieStore.exportJson.bind(movieStore),
    importJson: movieStore.importJson.bind(movieStore),
  };
}
