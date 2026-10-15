import { Suspense } from 'react';
import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { CatalogView } from '@/components/catalog/CatalogView';

export const metadata: Metadata = {
  title: 'Chiếu rạp',
  description: 'Các bộ phim đang được chiếu tại rạp.',
};

export default async function TheatersPage() {
  const movies = await movieService.getTheaterReleases();
  return (
    <Suspense>
      <CatalogView
        title="Đang chiếu rạp"
        description="Các bộ phim đang được chiếu tại rạp. Cập nhật liên tục những bộ phim mới nhất."
        movies={movies}
      />
    </Suspense>
  );
}
