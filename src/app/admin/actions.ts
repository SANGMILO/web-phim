'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/auth';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
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
  const payload = moviePayload(formData);
  const result = id
    ? await supabase.from('movies').update(payload).eq('id', id)
    : await supabase.from('movies').insert(payload);

  if (result.error) throw new Error(result.error.message);
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/database');
  redirect('/admin/database?saved=1');
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

