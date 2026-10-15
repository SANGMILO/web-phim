import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { WatchlistClient } from './WatchlistClient';

export const metadata: Metadata = {
  title: 'Danh sách xem của bạn',
  description: 'Quản lý các bộ phim, series và anime bạn đã lưu lại để thưởng thức.',
};

export default async function WatchlistPage() {
  const allMovies = await movieService.getAll();
  return <WatchlistClient allMovies={allMovies} />;
}
