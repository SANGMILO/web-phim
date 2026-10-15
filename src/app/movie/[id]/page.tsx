import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { MovieDetailClient } from './MovieDetailClient';
import { notFound } from 'next/navigation';

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
  if (!movie) return { title: 'Không tìm thấy' };
  return {
    title: movie.title,
    description: movie.overview,
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const movie = await movieService.getById(id);
  if (!movie) notFound();

  const related = await movieService.getRelated(id);

  return <MovieDetailClient movie={movie} related={related} />;
}
