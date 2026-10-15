import { Suspense } from 'react';
import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { CatalogView } from '@/components/catalog/CatalogView';

export const metadata: Metadata = {
  title: 'Phim lẻ',
  description: 'Khám phá bộ sưu tập phim lẻ đa dạng với nhiều thể loại hấp dẫn.',
};

export default async function MoviesPage() {
  const movies = await movieService.getByCategory('movie');
  return (
    <Suspense>
      <CatalogView
        title="Phim lẻ"
        description="Khám phá bộ sưu tập phim lẻ đa dạng với nhiều thể loại hấp dẫn từ hành động, kinh dị đến tâm lý, tình cảm."
        movies={movies}
        contentType="movie"
      />
    </Suspense>
  );
}
