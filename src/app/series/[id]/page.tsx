import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { MovieDetailClient } from '@/app/movie/[id]/MovieDetailClient';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const series = await movieService.getByCategory('series');
  const anime = await movieService.getByCategory('anime');
  return [...series, ...anime].map((s) => ({ id: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await movieService.getById(id);
  if (!movie) return { title: 'Không tìm thấy' };
  return {
    title: `${movie.title} - Phim bộ`,
    description: movie.overview,
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { id } = await params;
  const movie = await movieService.getById(id);
  const related = movie ? await movieService.getRelated(id) : [];

  return <MovieDetailClient movie={movie} slugOrId={id} related={related} />;
}
