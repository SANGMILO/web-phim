import { demoMovies } from '@/data/demo-movies';
import type { Movie, ContentType } from '@/types/movie';

const STORAGE_KEY = 'cineverse_movies_db';
const CHANGE_EVENT = 'cineverse_movies_changed';

// Cache for snapshot stability in React 19
let cachedMovies: Movie[] | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadFromStorage(): Movie[] {
  if (!isBrowser()) return demoMovies;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First time initialization: populate with verified demoMovies
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoMovies));
      cachedMovies = demoMovies;
      return demoMovies;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedMovies = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Error loading movies from localStorage:', err);
  }
  cachedMovies = demoMovies;
  return demoMovies;
}

function saveToStorage(movies: Movie[]): void {
  cachedMovies = movies;
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: movies }));
  } catch (err) {
    console.error('Error saving movies to localStorage:', err);
  }
}

export const movieStore = {
  getMovies(): Movie[] {
    if (cachedMovies) return cachedMovies;
    return loadFromStorage();
  },

  getMovieById(idOrSlug: string): Movie | null {
    const movies = this.getMovies();
    return movies.find((m) => m.id === idOrSlug || m.slug === idOrSlug) ?? null;
  },

  saveMovie(movieData: Partial<Movie> & { title: string; contentType: ContentType }): {
    success: boolean;
    movie: Movie;
    isNew: boolean;
  } {
    const movies = [...this.getMovies()];
    const slug = movieData.slug || generateSlug(movieData.title);
    const existingIndex = movies.findIndex((m) => m.id === movieData.id || m.slug === slug);

    let finalMovie: Movie;
    let isNew = false;

    if (existingIndex >= 0) {
      // Update existing
      finalMovie = {
        ...movies[existingIndex],
        ...movieData,
        slug,
        id: movies[existingIndex].id || slug,
      } as Movie;
      movies[existingIndex] = finalMovie;
    } else {
      // Create new
      isNew = true;
      const id = movieData.id || slug || `movie-${Date.now()}`;
      finalMovie = {
        id,
        slug,
        title: movieData.title,
        originalTitle: movieData.originalTitle || movieData.title,
        overview: movieData.overview || '',
        posterUrl: movieData.posterUrl || '',
        backdropUrl: movieData.backdropUrl || movieData.posterUrl || '',
        releaseDate: movieData.releaseDate || new Date().toISOString().split('T')[0],
        year: movieData.year || new Date().getFullYear(),
        runtime: movieData.runtime || 120,
        genres: movieData.genres && movieData.genres.length > 0 ? movieData.genres : ['Hành động'],
        rating: movieData.rating ?? 8.0,
        contentType: movieData.contentType,
        trailerUrl: movieData.trailerUrl || '',
        cast: movieData.cast || [],
        director: movieData.director || '',
        quality: movieData.quality || 'FHD',
        language: movieData.language || 'Vietsub',
        country: movieData.country || 'Mỹ',
        status: movieData.status || 'released',
        featured: movieData.featured ?? false,
        trending: movieData.trending ?? false,
        inTheaters: movieData.inTheaters ?? false,
        seasons: movieData.seasons || [],
      };
      // Prepend to top so newly added movies show first
      movies.unshift(finalMovie);
    }

    saveToStorage(movies);
    return { success: true, movie: finalMovie, isNew };
  },

  deleteMovie(idOrSlug: string): boolean {
    const movies = this.getMovies();
    const filtered = movies.filter((m) => m.id !== idOrSlug && m.slug !== idOrSlug);
    if (filtered.length === movies.length) return false;
    saveToStorage(filtered);
    return true;
  },

  toggleFeatured(idOrSlug: string): boolean {
    const movies = [...this.getMovies()];
    const index = movies.findIndex((m) => m.id === idOrSlug || m.slug === idOrSlug);
    if (index === -1) return false;
    movies[index] = { ...movies[index], featured: !movies[index].featured };
    saveToStorage(movies);
    return true;
  },

  toggleTrending(idOrSlug: string): boolean {
    const movies = [...this.getMovies()];
    const index = movies.findIndex((m) => m.id === idOrSlug || m.slug === idOrSlug);
    if (index === -1) return false;
    movies[index] = { ...movies[index], trending: !movies[index].trending };
    saveToStorage(movies);
    return true;
  },

  resetToDefault(): void {
    if (isBrowser()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoMovies));
    }
    cachedMovies = [...demoMovies];
    if (isBrowser()) {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: cachedMovies }));
    }
  },

  exportJson(): string {
    return JSON.stringify(this.getMovies(), null, 2);
  },

  importJson(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { success: false, count: 0, error: 'Dữ liệu JSON không hợp lệ hoặc rỗng.' };
      }
      saveToStorage(parsed);
      return { success: true, count: parsed.length };
    } catch (e: unknown) {
      return {
        success: false,
        count: 0,
        error: e instanceof Error ? e.message : 'Lỗi phân tích JSON.',
      };
    }
  },

  subscribe(callback: () => void): () => void {
    if (!isBrowser()) return () => {};
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cachedMovies = null;
        callback();
      }
    };
    const handleCustom = () => {
      callback();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CHANGE_EVENT, handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CHANGE_EVENT, handleCustom);
    };
  },
};

/**
 * Generate a URL-friendly slug from Vietnamese text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
