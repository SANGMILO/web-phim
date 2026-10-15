import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { requireAdmin } from '@/lib/supabase/auth';
import { saveMovie } from '../actions';
import { DeleteMovieButton } from '../DeleteMovieButton';

interface Props {
  searchParams: Promise<{ edit?: string; saved?: string }>;
}

export default async function SupabaseAdminPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) {
    return (
      <div style={{ padding: 32 }}>
        <h1 className="font-display" style={{ fontSize: 28 }}>Nội dung Supabase</h1>
        <p style={{ marginTop: 14, color: 'var(--text-secondary)' }}>
          Chưa cấu hình Supabase. Hãy tạo <code>.env.local</code> từ <code>.env.example</code> và áp dụng migration trước.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id,title,slug,description,poster_url,backdrop_url,release_year,content_type,genres,status,updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  const editing = movies?.find((movie) => movie.id === params.edit);

  return (
    <div style={{ padding: 32, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28 }}>Nội dung Supabase</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Mọi thao tác được xác minh admin phía server và kiểm tra lại bằng RLS.</p>
        </div>
        {editing && <Link className="btn btn-secondary" href="/admin/database">Tạo phim mới</Link>}
      </div>

      {params.saved && <p style={{ color: '#4ade80', marginBottom: 18 }}>Đã lưu phim thành công.</p>}

      <form action={saveMovie} style={{ display: 'grid', gap: 12, padding: 20, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', marginBottom: 28 }}>
        <input type="hidden" name="id" value={editing?.id ?? ''} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
          <input className="input" name="title" required placeholder="Tên phim" defaultValue={editing?.title} />
          <input className="input" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="slug-phim" defaultValue={editing?.slug} />
          <input className="input" name="release_year" required type="number" min="1888" max="2200" defaultValue={editing?.release_year ?? new Date().getFullYear()} />
          <select className="select" name="content_type" defaultValue={editing?.content_type ?? 'movie'}>
            <option value="movie">Phim lẻ</option><option value="series">Phim bộ</option><option value="anime">Anime</option><option value="theatrical">Phim chiếu rạp</option>
          </select>
          <select className="select" name="status" defaultValue={editing?.status ?? 'draft'}>
            <option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option>
          </select>
          <input className="input" name="genres" placeholder="Hành động, Phiêu lưu" defaultValue={editing?.genres?.join(', ')} />
        </div>
        <textarea className="input" name="description" rows={4} placeholder="Mô tả" defaultValue={editing?.description} />
        <input className="input" name="poster_url" type="url" placeholder="Poster URL" defaultValue={editing?.poster_url} />
        <input className="input" name="backdrop_url" type="url" placeholder="Backdrop URL" defaultValue={editing?.backdrop_url} />
        <button className="btn btn-primary" type="submit" style={{ justifySelf: 'start' }}>{editing ? 'Lưu thay đổi' : 'Tạo phim'}</button>
      </form>

      <div style={{ display: 'grid', gap: 10 }}>
        {movies?.map((movie) => (
          <div key={movie.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: 15, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div><strong>{movie.title}</strong><p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{movie.content_type} · {movie.release_year} · {movie.status}</p></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link className="btn btn-ghost" href={`/admin/database?edit=${movie.id}`}>Sửa</Link>
              <DeleteMovieButton id={movie.id} title={movie.title} />
            </div>
          </div>
        ))}
        {!movies?.length && <p style={{ color: 'var(--text-muted)' }}>Chưa có phim trong database.</p>}
      </div>
    </div>
  );
}

