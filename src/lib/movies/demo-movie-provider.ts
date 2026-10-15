import type { Movie, MovieFilter, ContentType } from '@/types/movie';
import type { MovieProvider } from './movie-provider';
import { demoMovies } from '@/data/demo-movies';

export class DemoMovieProvider implements MovieProvider {
  private movies: Movie[] = demoMovies.map((movie) => ({ ...movie, isDemo: true }));

  async getFeatured(): Promise<Movie[]> {
    return this.movies.filter((m) => m.featured);
  }

  async getTrending(): Promise<Movie[]> {
    return this.movies.filter((m) => m.trending);
  }

  async getByCategory(type: ContentType): Promise<Movie[]> {
    return this.movies.filter((m) => m.contentType === type);
  }

  async getByGenre(genre: string): Promise<Movie[]> {
    return this.movies.filter((m) =>
      m.genres.some((g) => g.toLowerCase() === genre.toLowerCase()),
    );
  }

  async getTheaterReleases(): Promise<Movie[]> {
    return this.movies.filter((m) => m.inTheaters);
  }

  async getUpcoming(): Promise<Movie[]> {
    return this.movies.filter((m) => m.status === 'upcoming');
  }

  async getById(id: string): Promise<Movie | null> {
    return this.movies.find((m) => m.id === id || m.slug === id) ?? null;
  }

  async search(filter: MovieFilter): Promise<Movie[]> {
    let results = [...this.movies];

    if (filter.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.originalTitle?.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)),
      );
    }

    if (filter.genre) {
      results = results.filter((m) =>
        m.genres.some((g) => g.toLowerCase() === filter.genre!.toLowerCase()),
      );
    }

    if (filter.year) {
      results = results.filter((m) => m.year === filter.year);
    }

    if (filter.contentType) {
      results = results.filter((m) => m.contentType === filter.contentType);
    }

    if (filter.sort) {
      switch (filter.sort) {
        case 'newest':
          results.sort((a, b) => b.year - a.year);
          break;
        case 'oldest':
          results.sort((a, b) => a.year - b.year);
          break;
        case 'rating':
          results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
          break;
        case 'title':
          results.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
          break;
      }
    }

    return results;
  }

  async getRelated(movieId: string): Promise<Movie[]> {
    const movie = await this.getById(movieId);
    if (!movie) return [];
    return this.movies
      .filter(
        (m) =>
          m.id !== movieId &&
          m.genres.some((g) => movie.genres.includes(g)),
      )
      .slice(0, 8);
  }

  async getAll(): Promise<Movie[]> {
    return this.movies;
  }
}
