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
      // Heal any obsolete dummy Google Drive links in existing browser storage
      let updated = false;
      const verified = parsed.map((m: Movie) => {
        if (
          m.gdriveUrl?.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs') ||
          m.playbackUrl?.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs') ||
          ((m.slug === 'kingdom-of-the-planet-of-the-apes' || m.slug === 'hanh-tinh-khi-vuong-quoc-moi') && !m.gdriveUrl) ||
          ((m.slug === 'dune-1' || m.slug === 'hanh-tinh-cat-dune-1' || m.id === 'dune-1') && !m.gdriveUrl)
        ) {
          updated = true;
          return {
            ...m,
            gdriveUrl: 'https://drive.google.com/file/d/1ykPSKpbGcE8Fu2zpk4QfaN_8kSr3iRUe/preview',
            playbackUrl: 'https://drive.google.com/file/d/1ykPSKpbGcE8Fu2zpk4QfaN_8kSr3iRUe/preview',
          };
        }
        return m;
      });

      // Merge any newly added official demo movies into user storage without overwriting custom edits
      const existingSlugs = new Set(verified.map((m: Movie) => m.slug || m.id));
      const missingDemo = demoMovies.filter(
        (dm) => !existingSlugs.has(dm.slug) && !existingSlugs.has(dm.id)
      );
      if (missingDemo.length > 0) {
        verified.push(...missingDemo);
        updated = true;
      }

      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(verified));
      }
      cachedMovies = verified;
      return verified;
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
    if (!idOrSlug) return null;
    const clean = decodeURIComponent(idOrSlug).trim().toLowerCase();
    const cleanSlug = generateSlug(clean);
    const movies = this.getMovies();

    // Route identity must always win. Prioritizing a playable movie here can
    // return the wrong sequel when similarly named titles share an alias.
    const exact = movies.find((m) => {
      const mId = m.id?.toLowerCase() || '';
      const mSlug = m.slug?.toLowerCase() || '';
      return mId === clean || mSlug === clean;
    });

    if (exact) return exact;

    // Specific well-known aliases / mappings without sequel ambiguity
    if (clean === 'hanh-tinh-cat-dune-1' || clean === 'dune-1' || clean === 'hanh-tinh-cat-1') {
      const dune1 = movies.find(m => m.id === 'dune-1' || m.slug === 'dune-1' || m.slug === 'hanh-tinh-cat-dune-1');
      if (dune1) return dune1;
    }
    if (clean === 'hanh-tinh-cat-dune-2' || clean === 'dune-2' || clean === 'xu-cat-phan-hai' || clean === 'xu-cat-2') {
      const dune2 = movies.find(m => m.id === 'dune-2' || m.slug === 'dune-2' || m.slug === 'hanh-tinh-cat-dune-2');
      if (dune2) return dune2;
    }
    if (clean === 'avatar-3' || clean === 'avatar-fire-and-ash' || clean === 'avatar-lua-va-tro') {
      const av3 = movies.find(m => m.id === 'avatar-3' || m.slug === 'avatar-3');
      if (av3) return av3;
    }
    if (clean === 'hanh-tinh-khi-vuong-quoc-moi' || clean === 'kingdom-of-the-planet-of-the-apes') {
      const apes = movies.find(m => m.slug === 'kingdom-of-the-planet-of-the-apes' || m.slug === 'hanh-tinh-khi-vuong-quoc-moi' || m.id === 'kingdom-of-the-planet-of-the-apes');
      if (apes) return apes;
    }

    // Fall back to exact normalized title match
    return (
      movies.find((m) => {
        const mTitleSlug = generateSlug(m.title || '');
        const mOrigSlug = generateSlug(m.originalTitle || '');

        return mTitleSlug === cleanSlug || mOrigSlug === cleanSlug;
      }) ?? null
    );
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
        episodes: movieData.episodes || (movieData.seasons?.[0]?.episodes || []),
        gdriveUrl: movieData.gdriveUrl || '',
        playbackUrl: movieData.playbackUrl || movieData.gdriveUrl || '',
        episodeCurrent: movieData.episodeCurrent || '',
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
