import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { movieService } from '@/lib/movies/movie-service';
import { WatchPlayerClient } from './WatchPlayerClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const movies = await movieService.getAll();
  return movies.map((m) => ({ id: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await movieService.getById(id);
  if (!movie) return { title: 'Xem phim' };
  return {
    title: `Nguồn phát và trailer ${movie.title}`,
    description: `Kiểm tra trailer và nguồn phát đã cấu hình cho ${movie.title}.`,
  };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const movie = await movieService.getById(id);
  if (!movie) notFound();

  const related = await movieService.getRelated(id);

  return (
    <Suspense fallback={<div className="container-main" style={{ paddingTop: '100px' }}>Đang tải trình phát...</div>}>
      <WatchPlayerClient movie={movie} related={related} />
    </Suspense>
  );
}
