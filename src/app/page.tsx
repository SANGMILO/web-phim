import { movieService } from '@/lib/movies/movie-service';
import { HomeClient } from './HomeClient';

export default async function HomePage() {
  const allMovies = await movieService.getAll();
  const featured = allMovies.filter((movie) => movie.featured);
  const trending = allMovies.filter((movie) => movie.trending);
  const movies = allMovies.filter((movie) => movie.contentType === 'movie');
  const series = allMovies.filter((movie) => movie.contentType === 'series');
  const anime = allMovies.filter((movie) => movie.contentType === 'anime');
  const theaters = allMovies.filter((movie) => movie.inTheaters);
  const upcoming = allMovies.filter((movie) => movie.status === 'upcoming');

  return (
    <HomeClient
      featured={featured}
      trending={trending}
      movies={movies}
      series={series}
      anime={anime}
      theaters={theaters}
      upcoming={upcoming}
    />
  );
}
