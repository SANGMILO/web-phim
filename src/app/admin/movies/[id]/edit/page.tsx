import { demoMovies } from '@/data/demo-movies';
import { EditMovieClient } from './EditMovieClient';

export function generateStaticParams() {
  return demoMovies.map((movie) => ({
    id: movie.id,
  }));
}

export default async function EditMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditMovieClient id={id} />;
}
