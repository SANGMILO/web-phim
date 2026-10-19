import type {
  ContentType,
  Episode,
  Movie,
  MovieFilter,
  PlaybackProvider,
  PlaybackSource,
} from '@/types/movie';
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

interface SourceRow {
  id: string;
  movie_id: string;
  provider: PlaybackProvider;
  external_file_id: string;
  playback_mode: 'preview' | 'direct';
  label: string;
  status: 'active' | 'inactive';
  display_order: number;
}

interface EpisodeRow {
  id: string;
  movie_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  description: string;
  thumbnail_url: string;
  runtime: number | null;
  source_id: string | null;
}

function toSource(row: SourceRow): PlaybackSource {
  return {
    id: row.id,
    provider: row.provider,
    externalFileId: row.external_file_id,
    playbackMode: row.playback_mode,
    label: row.label,
    status: row.status,
    displayOrder: row.display_order,
  };
}

function toMovie(
  row: MovieRow,
  sources: SourceRow[] = [],
  episodes: EpisodeRow[] = [],
): Movie {
  const movieSources = sources
    .filter((source) => source.movie_id === row.id && source.status === 'active')
    .sort((a, b) => a.display_order - b.display_order);
  const sourceById = new Map(movieSources.map((source) => [source.id, toSource(source)]));
  const movieEpisodes: Episode[] = episodes
    .filter((episode) => episode.movie_id === row.id)
    .sort((a, b) => a.season_number - b.season_number || a.episode_number - b.episode_number)
    .map((episode) => ({
      id: episode.id,
      number: episode.episode_number,
      seasonNumber: episode.season_number,
      title: episode.title,
      overview: episode.description || undefined,
      thumbnailUrl: episode.thumbnail_url || undefined,
      runtime: episode.runtime ?? undefined,
      source: episode.source_id ? sourceById.get(episode.source_id) : undefined,
    }));

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
    playbackSources: movieSources.map(toSource),
    episodes: movieEpisodes,
  };
}

export function mergePublishedMoviesWithDemo(publishedMovies: Movie[]): Movie[] {
  const publishedBySlug = new Map(
    publishedMovies.map((movie) => [movie.slug.toLowerCase(), movie]),
  );

  const mergedDemo = demoMovies.map((demoMovie) => {
    const published = publishedBySlug.get(demoMovie.slug.toLowerCase());
    if (!published) return { ...demoMovie, isDemo: true };

    publishedBySlug.delete(demoMovie.slug.toLowerCase());
    return {
      ...demoMovie,
      ...published,
      isDemo: false,
    };
  });

  const publishedOnly = [...publishedBySlug.values()].map((movie) => ({
    ...movie,
    isDemo: false,
  }));

  return [...publishedOnly, ...mergedDemo];
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
    if (!data?.length) return mergePublishedMoviesWithDemo([]);
    const movieRows = data as MovieRow[];
    const movieIds = movieRows.map((movie) => movie.id);
    const [{ data: sourceData, error: sourceError }, { data: episodeData, error: episodeError }] =
      await Promise.all([
        supabase
          .from('movie_sources')
          .select('id,movie_id,provider,external_file_id,playback_mode,label,status,display_order')
          .in('movie_id', movieIds)
          .eq('status', 'active')
          .order('display_order'),
        supabase
          .from('movie_episodes')
          .select('id,movie_id,season_number,episode_number,title,description,thumbnail_url,runtime,source_id')
          .in('movie_id', movieIds)
          .eq('status', 'published')
          .order('season_number')
          .order('episode_number'),
      ]);

    if (sourceError) console.error(`Không thể đọc nguồn phát: ${sourceError.message}`);
    if (episodeError) console.error(`Không thể đọc tập phim: ${episodeError.message}`);

    const publishedMovies = movieRows.map((row) =>
      toMovie(row, (sourceData as SourceRow[] | null) ?? [], (episodeData as EpisodeRow[] | null) ?? []),
    );
    return mergePublishedMoviesWithDemo(publishedMovies);
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

