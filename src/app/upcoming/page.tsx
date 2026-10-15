import { Suspense } from 'react';
import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { CatalogView } from '@/components/catalog/CatalogView';

export const metadata: Metadata = {
  title: 'Sắp chiếu',
  description: 'Những bộ phim sắp ra mắt trong thời gian tới.',
};

export default async function UpcomingPage() {
  const movies = await movieService.getUpcoming();
  return (
    <Suspense>
      <CatalogView
        title="Sắp ra mắt"
        description="Những bộ phim được mong đợi nhất sắp ra mắt trong thời gian tới."
        movies={movies}
      />
    </Suspense>
  );
}
