import { Suspense } from 'react';
import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { CatalogView } from '@/components/catalog/CatalogView';

export const metadata: Metadata = {
  title: 'Phim bộ',
  description: 'Xem phim bộ hay nhất với nhiều mùa phim hấp dẫn.',
};

export default async function SeriesPage() {
  const series = await movieService.getByCategory('series');
  return (
    <Suspense>
      <CatalogView
        title="Phim bộ"
        description="Xem phim bộ hay nhất với nhiều mùa phim hấp dẫn. Cập nhật liên tục các tập mới nhất."
        movies={series}
        contentType="series"
      />
    </Suspense>
  );
}
