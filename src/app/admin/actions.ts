'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/auth';
import { parseGoogleDriveUrl } from '@/lib/google-drive';
import type { Movie } from '@/types/movie';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function positiveInteger(formData: FormData, key: string, fallback?: number) {
  const raw = text(formData, key);
  if (!raw && fallback !== undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${key} không hợp lệ.`);
  return value;
}

function driveFileId(formData: FormData, required = false) {
  const driveUrl = text(formData, 'drive_url');
  if (!driveUrl && !required) return null;
  const fileId = parseGoogleDriveUrl(driveUrl);
  if (!fileId) throw new Error('Link Google Drive không hợp lệ. Chỉ chấp nhận link file từ drive.google.com.');
  return fileId;
}

async function saveDriveSource(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  movieId: string,
  fileId: string,
  sourceId?: string,
  displayOrder = 0,
  scope: 'movie' | 'episode' = 'movie',
  status: 'active' | 'inactive' = 'active',
) {
  const payload = {
    movie_id: movieId,
    provider: 'google_drive',
    external_file_id: fileId,
    playback_mode: 'preview',
    label: 'Google Drive',
    scope,
    status,
    display_order: displayOrder,
  };
  const result = sourceId
    ? await supabase.from('movie_sources').update(payload).eq('id', sourceId).eq('movie_id', movieId).eq('scope', scope).select('id').single()
    : await supabase.from('movie_sources').insert(payload).select('id').single();
  if (result.error) throw new Error(result.error.message);
  return result.data.id as string;
}

function moviePayload(formData: FormData) {
  const title = text(formData, 'title');
  const slug = text(formData, 'slug').toLowerCase();
  const releaseYear = Number(text(formData, 'release_year'));
  const contentType = text(formData, 'content_type');
  const status = text(formData, 'status');

  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Tiêu đề hoặc slug không hợp lệ.');
  }
  if (!Number.isInteger(releaseYear) || releaseYear < 1888 || releaseYear > 2200) {
    throw new Error('Năm phát hành không hợp lệ.');
  }
  if (!['movie', 'series', 'anime', 'theatrical'].includes(contentType)) {
    throw new Error('Loại phim không hợp lệ.');
  }
  if (!['draft', 'published'].includes(status)) {
    throw new Error('Trạng thái không hợp lệ.');
  }

  return {
    title,
    slug,
    description: text(formData, 'description'),
    poster_url: text(formData, 'poster_url'),
    backdrop_url: text(formData, 'backdrop_url'),
    release_year: releaseYear,
    content_type: contentType,
    genres: text(formData, 'genres').split(',').map((genre) => genre.trim()).filter(Boolean),
    status,
  };
}

export async function saveMovie(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, 'id');
  const fileId = driveFileId(formData);
  const sourceStatus = text(formData, 'source_status') || 'active';
  if (!['active', 'inactive'].includes(sourceStatus)) throw new Error('Trạng thái nguồn phát không hợp lệ.');
  const payload = moviePayload(formData);
  const result = id
    ? await supabase.from('movies').update(payload).eq('id', id).select('id').single()
    : await supabase.from('movies').insert(payload).select('id').single();

  if (result.error) throw new Error(result.error.message);
  const movieId = result.data.id as string;
  const { data: existingSource, error: existingSourceError } = await supabase
    .from('movie_sources')
    .select('id')
    .eq('movie_id', movieId)
    .eq('scope', 'movie')
    .eq('display_order', 0)
    .maybeSingle();
  if (existingSourceError) throw new Error(existingSourceError.message);
  if (fileId) {
    await saveDriveSource(supabase, movieId, fileId, existingSource?.id, 0, 'movie', sourceStatus as 'active' | 'inactive');
  } else if (existingSource?.id) {
    const { error } = await supabase.from('movie_sources').delete().eq('id', existingSource.id).eq('movie_id', movieId).eq('scope', 'movie');
    if (error) throw new Error(error.message);
  }
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/database');
  revalidatePath(`/movie/${payload.slug}`);
  revalidatePath(`/watch/${payload.slug}`);
  redirect(`/admin/database?edit=${movieId}&saved=1`);
}

/**
 * Publishes a movie edited in the legacy/local admin UI to Supabase so the
 * same movie and playback source are available to every visitor.
 */
export async function publishMovieFromAdmin(movie: Movie) {
  const { supabase } = await requireAdmin();
  const slug = movie.slug.trim().toLowerCase();

  if (!movie.title.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Tiêu đề hoặc slug không hợp lệ.');
  }
  if (!Number.isInteger(movie.year) || movie.year < 1888 || movie.year > 2200) {
    throw new Error('Năm phát hành không hợp lệ.');
  }
  if (!['movie', 'series', 'anime'].includes(movie.contentType)) {
    throw new Error('Loại phim không hợp lệ.');
  }

  const payload = {
    title: movie.title.trim(),
    slug,
    description: movie.overview?.trim() ?? '',
    poster_url: movie.posterUrl?.trim() ?? '',
    backdrop_url: movie.backdropUrl?.trim() ?? '',
    release_year: movie.year,
    release_date: movie.releaseDate || null,
    content_type: movie.inTheaters ? 'theatrical' : movie.contentType,
    genres: movie.genres ?? [],
    status: 'published',
    original_title: movie.originalTitle?.trim() || null,
    runtime: movie.runtime ?? null,
    rating: movie.rating ?? null,
    trailer_url: movie.trailerUrl?.trim() || null,
    quality: movie.quality?.trim() || null,
    language: movie.language?.trim() || null,
    country: movie.country?.trim() || null,
    featured: movie.featured ?? false,
    trending: movie.trending ?? false,
  };

  const { data: savedMovie, error: movieError } = await supabase
    .from('movies')
    .upsert(payload, { onConflict: 'slug' })
    .select('id,slug')
    .single();
  if (movieError || !savedMovie) {
    throw new Error(movieError?.message || 'Không thể lưu phim lên Supabase.');
  }

  const { data: existingSource, error: sourceLookupError } = await supabase
    .from('movie_sources')
    .select('id')
    .eq('movie_id', savedMovie.id)
    .eq('scope', 'movie')
    .eq('display_order', 0)
    .maybeSingle();
  if (sourceLookupError) throw new Error(sourceLookupError.message);

  const driveFileId = parseGoogleDriveUrl(movie.gdriveUrl || movie.playbackUrl || '');
  if (driveFileId) {
    await saveDriveSource(
      supabase,
      savedMovie.id,
      driveFileId,
      existingSource?.id,
      0,
      'movie',
      'active',
    );
  } else if (existingSource?.id) {
    const { error: deleteSourceError } = await supabase
      .from('movie_sources')
      .delete()
      .eq('id', existingSource.id)
      .eq('movie_id', savedMovie.id)
      .eq('scope', 'movie');
    if (deleteSourceError) throw new Error(deleteSourceError.message);
  }

  revalidatePath('/');
  revalidatePath('/movies');
  revalidatePath('/admin');
  revalidatePath('/admin/movies');
  revalidatePath(`/movie/${slug}`);
  revalidatePath(`/watch/${slug}`);

  return { success: true, id: savedMovie.id, slug };
}

export async function saveEpisode(formData: FormData) {
  const { supabase } = await requireAdmin();
  const movieId = text(formData, 'movie_id');
  const episodeId = text(formData, 'episode_id');
  const fileId = driveFileId(formData, true);
  const seasonNumber = positiveInteger(formData, 'season_number', 1);
  const episodeNumber = positiveInteger(formData, 'episode_number');
  const title = text(formData, 'episode_title');
  const status = text(formData, 'episode_status');
  const sourceStatus = text(formData, 'source_status') || 'active';
  if (!movieId || !title || !['draft', 'published'].includes(status) || !['active', 'inactive'].includes(sourceStatus) || !fileId) {
    throw new Error('Thông tin tập phim không hợp lệ.');
  }

  const { data: movie, error: movieError } = await supabase
    .from('movies')
    .select('id,slug,content_type')
    .eq('id', movieId)
    .single();
  if (movieError || !movie || !['series', 'anime'].includes(movie.content_type)) {
    throw new Error('Phim bộ không tồn tại hoặc không hợp lệ.');
  }

  let existingSourceId: string | undefined;
  if (episodeId) {
    const { data: existingEpisode, error: existingEpisodeError } = await supabase
      .from('movie_episodes')
      .select('source_id')
      .eq('id', episodeId)
      .eq('movie_id', movieId)
      .single();
    if (existingEpisodeError) throw new Error(existingEpisodeError.message);
    existingSourceId = existingEpisode.source_id ?? undefined;
  }
  const sourceId = await saveDriveSource(supabase, movieId, fileId, existingSourceId, episodeNumber, 'episode', sourceStatus as 'active' | 'inactive');
  const runtimeText = text(formData, 'episode_runtime');
  const payload = {
    movie_id: movieId,
    season_number: seasonNumber,
    episode_number: episodeNumber,
    title,
    description: text(formData, 'episode_description'),
    thumbnail_url: text(formData, 'episode_thumbnail_url'),
    runtime: runtimeText ? positiveInteger(formData, 'episode_runtime') : null,
    source_id: sourceId,
    status,
  };
  const result = episodeId
    ? await supabase.from('movie_episodes').update(payload).eq('id', episodeId).eq('movie_id', movieId)
    : await supabase.from('movie_episodes').insert(payload);
  if (result.error) throw new Error(result.error.message);

  revalidatePath('/admin/database');
  revalidatePath(`/movie/${movie.slug}`);
  revalidatePath(`/watch/${movie.slug}`);
  redirect(`/admin/database?edit=${movieId}&episode_saved=1`);
}

export async function deleteEpisode(formData: FormData) {
  const { supabase } = await requireAdmin();
  const movieId = text(formData, 'movie_id');
  const episodeId = text(formData, 'episode_id');
  if (!movieId || !episodeId) throw new Error('Thiếu mã tập phim.');
  const { data: deletedEpisode, error } = await supabase
    .from('movie_episodes')
    .delete()
    .eq('id', episodeId)
    .eq('movie_id', movieId)
    .select('source_id')
    .single();
  if (error) throw new Error(error.message);
  if (deletedEpisode.source_id) {
    await supabase.from('movie_sources').delete().eq('id', deletedEpisode.source_id).eq('movie_id', movieId).eq('scope', 'episode');
  }
  revalidatePath('/admin/database');
}

export async function deleteMovie(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, 'id');
  if (!id) throw new Error('Thiếu mã phim.');
  const { error } = await supabase.from('movies').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/database');
}

