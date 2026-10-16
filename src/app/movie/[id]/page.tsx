import type { Metadata } from 'next';
import { movieService } from '@/lib/movies/movie-service';
import { MovieDetailClient } from './MovieDetailClient';

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
  const related = movie ? await movieService.getRelated(id) : [];

  return <MovieDetailClient movie={movie} slugOrId={id} related={related} />;
}
