import type { ContentType, Movie, MovieFilter } from '@/types/movie';
import type { MovieProvider } from './movie-provider';
import { createPublicClient } from '@/lib/supabase/public';
import { demoMovies } from '@/data/demo-movies';

interface MovieRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  release_year: number;
  release_date: string | null;
  content_type: ContentType | 'theatrical';
  genres: string[];
  original_title: string | null;
  runtime: number | null;
  rating: number | null;
  trailer_url: string | null;
  quality: string | null;
  language: string | null;
  country: string | null;
  featured: boolean;
  trending: boolean;
  status: 'draft' | 'published';
}

function toMovie(row: MovieRow): Movie {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.original_title ?? undefined,
    overview: row.description,
    posterUrl: row.poster_url,
    backdropUrl: row.backdrop_url,
    releaseDate: row.release_date ?? undefined,
    year: row.release_year,
    runtime: row.runtime ?? undefined,
    genres: row.genres,
    rating: row.rating ?? undefined,
    contentType: row.content_type === 'theatrical' ? 'movie' : row.content_type,
    trailerUrl: row.trailer_url ?? undefined,
    quality: row.quality ?? undefined,
    language: row.language ?? undefined,
    country: row.country ?? undefined,
    status: 'released',
    featured: row.featured,
    trending: row.trending,
    inTheaters: row.content_type === 'theatrical',
  };
}

export class SupabaseMovieProvider implements MovieProvider {
  private async rows(): Promise<Movie[]> {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Không thể đọc phim từ Supabase: ${error.message}`);
      return demoMovies.map((movie) => ({ ...movie, isDemo: true }));
    }
    if (!data?.length) {
      return demoMovies.map((movie) => ({ ...movie, isDemo: true }));
    }
    return (data as MovieRow[]).map(toMovie);
  }

  async getFeatured() { return (await this.rows()).filter((m) => m.featured); }
  async getTrending() { return (await this.rows()).filter((m) => m.trending); }
  async getByCategory(type: ContentType) { return (await this.rows()).filter((m) => m.contentType === type); }
  async getByGenre(genre: string) { return (await this.rows()).filter((m) => m.genres.some((g) => g.toLowerCase() === genre.toLowerCase())); }
  async getTheaterReleases() { return (await this.rows()).filter((m) => m.inTheaters); }
  async getUpcoming() { return []; }
  async getById(id: string) { return (await this.rows()).find((m) => m.id === id || m.slug === id) ?? null; }
  async getRelated(movieId: string) {
    const movies = await this.rows();
    const movie = movies.find((m) => m.id === movieId || m.slug === movieId);
    if (!movie) return [];
    return movies.filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g))).slice(0, 8);
  }
  async getAll() { return this.rows(); }
  async search(filter: MovieFilter) {
    let movies = await this.rows();
    if (filter.query) {
      const query = filter.query.toLowerCase();
      movies = movies.filter((m) => m.title.toLowerCase().includes(query) || m.genres.some((g) => g.toLowerCase().includes(query)));
    }
    if (filter.genre) movies = movies.filter((m) => m.genres.includes(filter.genre!));
    if (filter.year) movies = movies.filter((m) => m.year === filter.year);
    if (filter.contentType) movies = movies.filter((m) => m.contentType === filter.contentType);
    return movies;
  }
}

