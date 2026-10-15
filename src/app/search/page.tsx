import { Suspense } from 'react';
import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { SearchClient } from './SearchClient';

export const metadata: Metadata = {
  title: 'Tìm kiếm phim',
  description: 'Tìm kiếm hàng nghìn bộ phim, series và anime theo tên, diễn viên hoặc thể loại.',
};

export default async function SearchPage() {
  const allMovies = await movieService.getAll();

  return (
    <Suspense fallback={<div className="container-main" style={{ paddingTop: '120px' }}>Đang tải...</div>}>
      <SearchClient allMovies={allMovies} />
    </Suspense>
  );
}
