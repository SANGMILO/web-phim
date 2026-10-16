import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { requireAdmin } from '@/lib/supabase/auth';
import { deleteEpisode, saveEpisode, saveMovie } from '../actions';
import { DeleteMovieButton } from '../DeleteMovieButton';
import { DriveSourceField } from '@/components/admin/DriveSourceField';
import { ImageUrlField } from '@/components/admin/ImageUrlField';

interface Props {
  searchParams: Promise<{ edit?: string; episode?: string; saved?: string; episode_saved?: string }>;
}

export default async function SupabaseAdminPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) {
    return (
      <div style={{ padding: 32 }}>
        <h1 className="font-display" style={{ fontSize: 28 }}>Đăng phim qua Google Drive</h1>
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
  const [{ data: sources, error: sourcesError }, { data: episodes, error: episodesError }] = editing
    ? await Promise.all([
        supabase.from('movie_sources').select('id,movie_id,provider,external_file_id,status,display_order').eq('movie_id', editing.id).order('display_order'),
        supabase.from('movie_episodes').select('id,movie_id,season_number,episode_number,title,description,thumbnail_url,runtime,source_id,status').eq('movie_id', editing.id).order('season_number').order('episode_number'),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (sourcesError) throw new Error(sourcesError.message);
  if (episodesError) throw new Error(episodesError.message);
  const mainSource = sources?.find((source) => source.display_order === 0);
  const editingEpisode = episodes?.find((episode) => episode.id === params.episode);
  const episodeSource = editingEpisode?.source_id
    ? sources?.find((source) => source.id === editingEpisode.source_id)
    : undefined;

  return (
    <div style={{ padding: 32, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28 }}>Đăng phim qua Google Drive</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Metadata lưu trong Supabase; video được phát từ file Google Drive mà bạn sở hữu.</p>
        </div>
        {editing && <Link className="btn btn-secondary" href="/admin/database">Tạo phim mới</Link>}
      </div>

      {params.saved && <p style={{ color: '#4ade80', marginBottom: 18 }}>Đã lưu phim thành công.</p>}
      {params.episode_saved && <p style={{ color: '#4ade80', marginBottom: 18 }}>Đã lưu tập phim thành công.</p>}

      <div style={{ padding: 16, border: '1px solid rgba(117, 221, 243, 0.25)', borderRadius: 'var(--radius-md)', background: 'rgba(117, 221, 243, 0.07)', marginBottom: 18 }}>
        <strong style={{ color: 'var(--accent-cyan)' }}>Cách đăng phim:</strong>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
          Tải video lên Google Drive, đặt quyền “Bất kỳ ai có đường liên kết – Người xem”, rồi dán link vào mục <strong>Nguồn phim Google Drive</strong> bên dưới. Website không tải file trực tiếp lên Vercel.
        </p>
      </div>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <ImageUrlField name="poster_url" label="Poster" defaultValue={editing?.poster_url} aspectRatio="2/3" />
          <ImageUrlField name="backdrop_url" label="Backdrop" defaultValue={editing?.backdrop_url} aspectRatio="16/9" />
        </div>
        <DriveSourceField
          defaultValue={mainSource?.external_file_id ? `https://drive.google.com/file/d/${mainSource.external_file_id}/view` : ''}
          defaultStatus={mainSource?.status ?? 'active'}
          label="Nguồn phim Google Drive (để trống nếu đây là phim bộ dùng nguồn theo tập)"
        />
        <button className="btn btn-primary" type="submit" style={{ justifySelf: 'start' }}>{editing ? 'Lưu thay đổi' : 'Tạo phim'}</button>
      </form>

      {editing && ['series', 'anime'].includes(editing.content_type) && (
        <section style={{ padding: 20, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20 }}>Tập phim</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Mỗi tập dùng một file Drive riêng. Lưu phim trước, sau đó thêm từng tập.</p>
            </div>
            {editingEpisode && <Link className="btn btn-secondary" href={`/admin/database?edit=${editing.id}`}>Thêm tập mới</Link>}
          </div>

          <form action={saveEpisode} style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
            <input type="hidden" name="movie_id" value={editing.id} />
            <input type="hidden" name="episode_id" value={editingEpisode?.id ?? ''} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <input className="input" name="season_number" type="number" min="1" required defaultValue={editingEpisode?.season_number ?? 1} placeholder="Mùa" />
              <input className="input" name="episode_number" type="number" min="1" required defaultValue={editingEpisode?.episode_number ?? ((episodes?.length ?? 0) + 1)} placeholder="Số tập" />
              <input className="input" name="episode_title" required defaultValue={editingEpisode?.title ?? ''} placeholder="Tên tập" />
              <input className="input" name="episode_runtime" type="number" min="1" defaultValue={editingEpisode?.runtime ?? ''} placeholder="Thời lượng (phút)" />
              <select className="select" name="episode_status" defaultValue={editingEpisode?.status ?? 'draft'}>
                <option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option>
              </select>
            </div>
            <textarea className="input" name="episode_description" rows={2} defaultValue={editingEpisode?.description ?? ''} placeholder="Mô tả tập" />
            <input className="input" name="episode_thumbnail_url" type="url" defaultValue={editingEpisode?.thumbnail_url ?? ''} placeholder="Thumbnail URL" />
            <DriveSourceField
              required
              label="Link Google Drive của tập"
              defaultValue={episodeSource?.external_file_id ? `https://drive.google.com/file/d/${episodeSource.external_file_id}/view` : ''}
              defaultStatus={episodeSource?.status ?? 'active'}
            />
            <button className="btn btn-primary" type="submit" style={{ justifySelf: 'start' }}>{editingEpisode ? 'Cập nhật tập' : 'Thêm tập'}</button>
          </form>

          <div style={{ display: 'grid', gap: 8 }}>
            {episodes?.map((episode) => (
              <div key={episode.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span><strong>Mùa {episode.season_number} · Tập {episode.episode_number}: {episode.title}</strong><small style={{ display: 'block', color: 'var(--text-muted)' }}>{episode.status}</small></span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <Link className="btn btn-ghost" href={`/admin/database?edit=${editing.id}&episode=${episode.id}`}>Sửa</Link>
                  <form action={deleteEpisode}>
                    <input type="hidden" name="movie_id" value={editing.id} />
                    <input type="hidden" name="episode_id" value={episode.id} />
                    <button className="btn btn-ghost" type="submit" style={{ color: '#fb7185' }}>Xóa</button>
                  </form>
                </span>
              </div>
            ))}
            {!episodes?.length && <p style={{ color: 'var(--text-muted)' }}>Chưa có tập phim.</p>}
          </div>
        </section>
      )}

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

