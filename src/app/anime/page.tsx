import { Suspense } from 'react';
import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { CatalogView } from '@/components/catalog/CatalogView';

export const metadata: Metadata = {
  title: 'Anime',
  description: 'Thế giới anime đa dạng với hàng nghìn bộ phim hoạt hình Nhật Bản.',
};

export default async function AnimePage() {
  const anime = await movieService.getByCategory('anime');
  return (
    <Suspense>
      <CatalogView
        title="Anime"
        description="Thế giới anime đa dạng với hàng nghìn bộ phim hoạt hình Nhật Bản từ hành động, phiêu lưu đến lãng mạn."
        movies={anime}
        contentType="anime"
      />
    </Suspense>
  );
}
