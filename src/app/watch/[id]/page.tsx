import { Suspense } from 'react';
import type { Metadata } from 'next';
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
  if (!movie) return { title: 'Xem phim | CineVerse' };
  return {
    title: `Xem phim ${movie.title} | CineVerse`,
    description: `Xem phim ${movie.title} chất lượng cao, Google Drive VIP và Vietsub.`,
  };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const movie = await movieService.getById(id);
  const related = movie ? await movieService.getRelated(id) : [];

  return (
    <Suspense fallback={<div className="container-main" style={{ paddingTop: '100px' }}>Đang tải trình phát...</div>}>
      <WatchPlayerClient movie={movie} slugOrId={id} related={related} />
    </Suspense>
  );
}
