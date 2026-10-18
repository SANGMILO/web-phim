'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Plus,
  Trash2,
  Play,
  Check,
  Bot,
  Loader2,
  HardDrive,
  HelpCircle,
  Tv,
  X,
} from 'lucide-react';
import type { Movie, ContentType, CastMember, Season, Episode } from '@/types/movie';
import { useMovieAdmin } from '@/lib/movies/useMovieAdmin';
import { generateSlug } from '@/lib/movies/movie-storage';
import { toGoogleDriveEmbedUrl, isGoogleDriveUrl } from '@/lib/utils/google-drive';
import { useToast } from '@/components/admin/AdminToast';
import { MovieImage } from '@/components/common/MovieImage';

interface AiSearchResultCandidate {
  id: number;
  mediaType: string;
  title: string;
  originalTitle: string;
  year: string;
  posterUrl: string | null;
  overview: string;
}

interface MovieFormProps {
  initialMovie?: Movie | null;
  isEdit?: boolean;
}

const AVAILABLE_GENRES = [
  'Hành động',
  'Phiêu lưu',
  'Khoa học viễn tưởng',
  'Kinh dị',
  'Tình cảm',
  'Hài',
  'Tâm lý',
  'Hoạt hình',
  'Fantasy',
  'Trinh thám',
  'Võ thuật',
  'Gia đình',
];

const QUICK_EPISODE_STATUSES = [
  'Full HD Vietsub',
  'Full HD Thuyết Minh',
  'Bản Chiếu Rạp (CAM)',
  'Hoàn tất (Trọn bộ)',
  'Tập 12/24 Vietsub',
  'Đang cập nhật',
];

export function MovieForm({ initialMovie, isEdit = false }: MovieFormProps) {
  const router = useRouter();
  const { saveMovie } = useMovieAdmin();
  const { showToast } = useToast();

  // ─── AI Search State ──────────────────────────────────────────────
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCandidates, setAiCandidates] = useState<AiSearchResultCandidate[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  // ─── Google Drive Test Modal State ────────────────────────────────
  const [showDriveTestModal, setShowDriveTestModal] = useState(false);
  const [driveTestUrl, setDriveTestUrl] = useState('');

  // ─── Core Movie Form State ────────────────────────────────────────
  const [title, setTitle] = useState(initialMovie?.title || '');
  const [originalTitle, setOriginalTitle] = useState(initialMovie?.originalTitle || '');
  const [slug, setSlug] = useState(initialMovie?.slug || '');
  const [overview, setOverview] = useState(initialMovie?.overview || '');
  const [posterUrl, setPosterUrl] = useState(initialMovie?.posterUrl || '');
  const [backdropUrl, setBackdropUrl] = useState(initialMovie?.backdropUrl || '');
  const [releaseDate, setReleaseDate] = useState(
    initialMovie?.releaseDate || new Date().toISOString().split('T')[0]
  );
  const [year, setYear] = useState<number>(initialMovie?.year || new Date().getFullYear());
  const [runtime, setRuntime] = useState<number>(initialMovie?.runtime || 120);
  const [genres, setGenres] = useState<string[]>(
    initialMovie?.genres || ['Hành động', 'Khoa học viễn tưởng']
  );
  const [rating, setRating] = useState<number>(initialMovie?.rating || 8.0);
  const [contentType, setContentType] = useState<ContentType>(
    initialMovie?.contentType || 'movie'
  );
  const [trailerUrl, setTrailerUrl] = useState(
    initialMovie?.trailerUrl || 'https://www.youtube.com/embed/Way9Dexny3w'
  );
  const [director, setDirector] = useState(initialMovie?.director || '');
  const [quality, setQuality] = useState(initialMovie?.quality || 'FHD');
  const [language, setLanguage] = useState(initialMovie?.language || 'Vietsub');
  const [country, setCountry] = useState(initialMovie?.country || 'Mỹ');
  const [status, setStatus] = useState<'released' | 'upcoming' | 'ongoing'>(
    initialMovie?.status || 'released'
  );
  const [featured, setFeatured] = useState<boolean>(initialMovie?.featured || false);
  const [trending, setTrending] = useState<boolean>(initialMovie?.trending || false);
  const [inTheaters, setInTheaters] = useState<boolean>(initialMovie?.inTheaters || false);

  // ─── Google Drive & Phim Mới style fields ─────────────────────────
  const [gdriveUrl, setGdriveUrl] = useState(
    initialMovie?.gdriveUrl ||
      (isGoogleDriveUrl(initialMovie?.playbackUrl) ? initialMovie?.playbackUrl : '') ||
      ''
  );
  const [episodeCurrent, setEpisodeCurrent] = useState(
    initialMovie?.episodeCurrent || 'Full HD Vietsub'
  );

  // Dynamic Cast members (Name + Character Role)
  const [cast, setCast] = useState<CastMember[]>(
    initialMovie?.cast || [
      { name: 'Diễn viên chính', role: 'Nhân vật chính' },
    ]
  );

  // Dynamic Series Episodes (each episode can have its own Google Drive link)
  const [episodes, setEpisodes] = useState<Episode[]>(() => {
    if (initialMovie?.seasons && initialMovie.seasons[0]?.episodes) {
      return initialMovie.seasons[0].episodes;
    }
    if (initialMovie?.episodes) {
      return initialMovie.episodes;
    }
    return [
      { id: 'ep-1', number: 1, title: 'Tập 1', gdriveUrl: '', runtime: 45 },
    ];
  });

  // Auto-generate slug when title changes (if not in edit mode)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEdit && (!slug || slug === generateSlug(title))) {
      setSlug(generateSlug(val));
    }
  };

  const handleToggleGenre = (g: string) => {
    if (genres.includes(g)) {
      if (genres.length > 1) {
        setGenres(genres.filter((item) => item !== g));
      }
    } else {
      setGenres([...genres, g]);
    }
  };

  // ─── AI Fetch Handler ─────────────────────────────────────────────
  const handleAiFetch = async (queryOverride?: string, tmdbId?: number, mediaType?: 'movie' | 'tv') => {
    const q = (queryOverride || aiQuery || title).trim();
    if (!q && !tmdbId) {
      showToast('Vui lòng nhập tên phim để AI tìm kiếm.', 'error');
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/admin/ai-movie-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, tmdbId, mediaType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Không tìm thấy phim');
      }

      // If user searched a general query and there are candidates, show picker modal
      if (!tmdbId && data.searchResults && data.searchResults.length > 1) {
        setAiCandidates(data.searchResults);
        setShowAiModal(true);
      }

      // Automatically populate with top result
      if (data.movieData) {
        applyAiData(data.movieData);
        showToast(`✨ AI đã điền thông tin phim "${data.movieData.title}"!`, 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi gọi AI tìm kiếm phim.';
      showToast(msg, 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiData = (d: Partial<Movie>) => {
    if (d.title) setTitle(d.title);
    if (d.originalTitle) setOriginalTitle(d.originalTitle);
    if (d.slug) setSlug(d.slug);
    if (d.overview) setOverview(d.overview);
    if (d.posterUrl) setPosterUrl(d.posterUrl);
    if (d.backdropUrl) setBackdropUrl(d.backdropUrl);
    if (d.releaseDate) setReleaseDate(d.releaseDate);
    if (d.year) setYear(d.year);
    if (d.runtime) setRuntime(d.runtime);
    if (d.genres && d.genres.length > 0) setGenres(d.genres);
    if (d.rating) setRating(d.rating);
    if (d.contentType) setContentType(d.contentType);
    if (d.trailerUrl) setTrailerUrl(d.trailerUrl);
    if (d.director) setDirector(d.director);
    if (d.cast && d.cast.length > 0) setCast(d.cast);
    if (d.country) setCountry(d.country);
    if (d.status) setStatus(d.status);
    if (d.episodeCurrent) setEpisodeCurrent(d.episodeCurrent);

    if (d.seasons && d.seasons[0]?.episodes) {
      setEpisodes(d.seasons[0].episodes);
    }

    setShowAiModal(false);
  };

  // ─── Google Drive Test Preview ────────────────────────────────────
  const handleOpenDriveTest = (urlToTest: string) => {
    const embed = toGoogleDriveEmbedUrl(urlToTest);
    if (!embed) {
      showToast('Đường dẫn Google Drive không hợp lệ.', 'error');
      return;
    }
    setDriveTestUrl(embed);
    setShowDriveTestModal(true);
  };

  // ─── Cast & Episodes Handlers ─────────────────────────────────────
  const handleAddCast = () => {
    setCast([...cast, { name: '', role: '' }]);
  };

  const handleUpdateCast = (index: number, field: 'name' | 'role', value: string) => {
    const next = [...cast];
    next[index][field] = value;
    setCast(next);
  };

  const handleRemoveCast = (index: number) => {
    setCast(cast.filter((_, i) => i !== index));
  };

  const handleAddEpisode = () => {
    const nextNum = episodes.length + 1;
    setEpisodes([
      ...episodes,
      { id: `ep-${nextNum}`, number: nextNum, title: `Tập ${nextNum}`, gdriveUrl: '', runtime: 45 },
    ]);
  };

  const handleAddBatchEpisodes = (count: number) => {
    const newEps: Episode[] = [];
    for (let i = 1; i <= count; i++) {
      newEps.push({
        id: `ep-${i}`,
        number: i,
        title: `Tập ${i}`,
        gdriveUrl: '',
        runtime: runtime || 45,
      });
    }
    setEpisodes(newEps);
    setEpisodeCurrent(`Tập 1/${count} Vietsub`);
    showToast(`Đã tạo sẵn ${count} tập phim!`, 'info');
  };

  const handleUpdateEpisode = (index: number, field: keyof Episode, value: string | number) => {
    const next = [...episodes];
    next[index] = { ...next[index], [field]: value };
    setEpisodes(next);
  };

  const handleRemoveEpisode = (index: number) => {
    setEpisodes(episodes.filter((_, i) => i !== index));
  };

  // ─── Form Submit ──────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Vui lòng nhập tên phim.', 'error');
      return;
    }

    const cleanSlug = slug.trim() || generateSlug(title);
    const convertedGdrive = toGoogleDriveEmbedUrl(gdriveUrl);
    if (gdriveUrl.trim() && !convertedGdrive) {
      showToast('Link phim phải là URL HTTPS hợp lệ từ drive.google.com.', 'error');
      return;
    }
    const invalidEpisode = episodes.find((episode) => episode.gdriveUrl?.trim() && !toGoogleDriveEmbedUrl(episode.gdriveUrl));
    if (invalidEpisode) {
      showToast(`Link Google Drive của "${invalidEpisode.title}" không hợp lệ.`, 'error');
      return;
    }

    // Build structured seasons if series/anime
    const isSeriesType = contentType === 'series' || contentType === 'anime';
    const primaryGdrive = convertedGdrive || toGoogleDriveEmbedUrl(episodes[0]?.gdriveUrl) || '';

    const structuredSeasons: Season[] = isSeriesType
      ? [
          {
            number: 1,
            title: 'Mùa 1',
            episodeCount: episodes.length,
            episodes: episodes.map((ep, i) => {
              const driveEmbed = toGoogleDriveEmbedUrl(ep.gdriveUrl);
              const validDrive = driveEmbed || ep.gdriveUrl?.trim() || '';
              const finalEpisodeDrive = (i === 0 && !validDrive && convertedGdrive)
                ? convertedGdrive
                : validDrive;
              return {
                ...ep,
                id: ep.id || `ep-${i + 1}`,
                number: i + 1,
                title: ep.title || `Tập ${i + 1}`,
                gdriveUrl: finalEpisodeDrive,
                playbackUrl: finalEpisodeDrive || ep.playbackUrl || '',
              };
            }),
          },
        ]
      : [];

    const movieData: Partial<Movie> & { title: string; contentType: ContentType } = {
      ...(initialMovie?.id ? { id: initialMovie.id } : {}),
      title: title.trim(),
      originalTitle: originalTitle.trim() || title.trim(),
      slug: cleanSlug,
      overview: overview.trim(),
      posterUrl:
        posterUrl.trim() ||
        'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
      backdropUrl:
        backdropUrl.trim() ||
        posterUrl.trim() ||
        'https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
      releaseDate,
      year: Number(year) || new Date().getFullYear(),
      runtime: Number(runtime) || 120,
      genres,
      rating: Number(rating) || 8.0,
      contentType,
      trailerUrl: trailerUrl.trim() || 'https://www.youtube.com/embed/Way9Dexny3w',
      // If user supplied Google Drive, store in gdriveUrl and playbackUrl
      gdriveUrl: primaryGdrive,
      playbackUrl: primaryGdrive,
      episodeCurrent: episodeCurrent.trim() || 'Full HD Vietsub',
      cast: cast.filter((c) => c.name.trim() !== ''),
      director: director.trim(),
      quality,
      language,
      country: country.trim() || 'Mỹ',
      status,
      featured,
      trending,
      inTheaters,
      seasons: structuredSeasons,
      episodes: isSeriesType ? structuredSeasons[0]?.episodes : [],
    };

    const res = saveMovie(movieData);

    if (res.success) {
      showToast(
        isEdit
          ? `Đã cập nhật tác phẩm "${title}" thành công!`
          : `Đã xuất bản tác phẩm "${title}" thành công!`,
        'success'
      );
      router.push('/admin/movies');
    } else {
      showToast('Có lỗi xảy ra khi lưu phim.', 'error');
    }
  };

  const detectedGdriveEmbed = toGoogleDriveEmbedUrl(gdriveUrl);

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'clamp(14px, 3vw, 28px)', maxWidth: '1400px', width: '100%' }}>
      {/* ─── Top Action Header ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/admin/movies"
            className="btn-icon"
            style={{ width: '38px', height: '38px' }}
            aria-label="Quay lại danh sách"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1
              className="font-display"
              style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}
            >
              {isEdit ? `Chỉnh sửa: ${initialMovie?.title}` : 'Đăng tác phẩm mới (Google Drive & AI)'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {isEdit
                ? 'Cập nhật link Google Drive, thông tin kịch bản và tập phim'
                : 'Tra cứu metadata phim và nhúng link Google Drive do bạn quản lý'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(229, 57, 79, 0.4)',
            }}
          >
            <Save size={16} />
            <span>{isEdit ? 'Lưu thay đổi' : 'Xuất bản phim ngay'}</span>
          </button>
        </div>
      </div>

      {/* ─── AI Movie Auto-Fill Assistant Banner (SIÊU TÍNH NĂNG AI) ────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(130, 120, 255, 0.15) 0%, rgba(229, 57, 79, 0.12) 100%)',
          border: '1px solid rgba(130, 120, 255, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-crimson) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              🤖 AI Trợ Lý Tự Động Điền Thông Tin Phim
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Chỉ cần nhập tên phim (VD: <em>Dune 2, Mai, Lật Mặt 7, Oppenheimer, Conan, Squid Game...</em>), AI sẽ tự động tìm ảnh bìa HD, tóm tắt tiếng Việt, đạo diễn và toàn bộ diễn viên kèm vai diễn!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 340px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Nhập tên phim muốn đăng (tiếng Việt hoặc tiếng Anh)..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAiFetch();
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: '#101116',
                border: '1px solid rgba(130, 120, 255, 0.3)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => handleAiFetch()}
            disabled={isAiLoading}
            className="btn btn-primary"
            style={{
              padding: '12px 24px',
              fontSize: '13px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-crimson) 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: isAiLoading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {isAiLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>AI đang tìm kiếm & dịch...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Tìm & Tự động điền bằng AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ──────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ─── LEFT COLUMN: Video Stream & Basic Information ───────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card: Nguồn Phát Video Google Drive (Trọng tâm yêu cầu người dùng) */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(46, 213, 115, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: 'rgba(46, 213, 115, 0.15)',
                color: '#2ed573',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 12px',
                borderBottomLeftRadius: '8px',
                borderLeft: '1px solid rgba(46, 213, 115, 0.3)',
                borderBottom: '1px solid rgba(46, 213, 115, 0.3)',
              }}
            >
              SERVER GOOGLE DRIVE VIP
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(46, 213, 115, 0.15)',
                  color: '#2ed573',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HardDrive size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800 }}>
                  Nguồn phát Google Drive (Nhúng Iframe)
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Dùng file trong Google Drive cá nhân; hệ thống chuyển link chia sẻ thành iframe preview
                </p>
              </div>
            </div>

            {/* Input Link Google Drive */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Đường dẫn Google Drive của Phim
              </label>
              <input
                type="text"
                placeholder="Dán link Drive vào đây: https://drive.google.com/file/d/1BxiMVs.../view?usp=sharing"
                value={gdriveUrl}
                onChange={(e) => setGdriveUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: detectedGdriveEmbed
                    ? '1px solid #2ed573'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Embed status & Test button */}
            {detectedGdriveEmbed && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(46, 213, 115, 0.08)',
                  border: '1px solid rgba(46, 213, 115, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#2ed573', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Link Iframe Google Drive hợp lệ
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {detectedGdriveEmbed}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDriveTest(gdriveUrl)}
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#2ed573',
                    borderColor: 'rgba(46, 213, 115, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Play size={13} fill="#2ed573" />
                  <span>Thử phát video</span>
                </button>
              </div>
            )}

            {/* Quick guide how to share */}
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                <HelpCircle size={14} /> Cách lấy link Drive để ai cũng xem được:
              </div>
              <ol style={{ paddingLeft: '18px', margin: 0, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                <li>Vào Google Drive → Chuột phải vào file video → Chọn <strong>Chia sẻ (Share)</strong>.</li>
                <li>Mục Quyền truy cập chung → Chọn <strong>&ldquo;Bất kỳ ai có đường liên kết&rdquo;</strong> (Anyone with the link).</li>
                <li>Bấm <strong>Sao chép đường liên kết</strong> rồi dán vào ô trên!</li>
              </ol>
            </div>
          </div>

          {/* Card: Thông tin kiểu Phim Mới & Cơ bản */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Thông tin kịch bản & Phân loại
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tên phim */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Tên phim tiếng Việt <span style={{ color: 'var(--accent-crimson)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xứ Cát: Phần Hai"
                  value={title}
                  onChange={handleTitleChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Tên gốc & Slug */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Tên gốc (English)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Dune: Part Two"
                    value={originalTitle}
                    onChange={(e) => setOriginalTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Đường dẫn tĩnh (Slug)
                  </label>
                  <input
                    type="text"
                    placeholder="dune-2"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--accent-cyan)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Tình trạng tập phim (Kiểu Phim Mới) */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Tình trạng tập phim (Kiểu Phim Mới)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Full HD Vietsub, Tập 12/24, Hoàn tất..."
                  value={episodeCurrent}
                  onChange={(e) => setEpisodeCurrent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--accent-crimson)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    marginBottom: '8px',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {QUICK_EPISODE_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEpisodeCurrent(st)}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      + {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tóm tắt nội dung */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Tóm tắt nội dung (Overview)
                </label>
                <textarea
                  rows={4}
                  placeholder="Nhập tóm tắt kịch bản hoặc bấm nút AI phía trên để tự điền..."
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Đạo diễn & Quốc gia */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Đạo diễn
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Denis Villeneuve, Trấn Thành..."
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Quốc gia sản xuất
                  </label>
                  <input
                    type="text"
                    placeholder="Mỹ, Hàn Quốc, Việt Nam..."
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Năm, Thời lượng & Ngày phát hành */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Năm phát hành
                  </label>
                  <input
                    type="number"
                    min="1950"
                    max="2035"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Thời lượng (phút)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={runtime}
                    onChange={(e) => setRuntime(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Ngày công chiếu
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Quản lý tập phim nếu là Phim bộ hoặc Anime */}
          {(contentType === 'series' || contentType === 'anime') && (
            <div
              style={{
                background: '#101116',
                border: '1px solid rgba(117, 221, 243, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tv size={18} color="var(--accent-cyan)" />
                    Danh sách tập phim & Link Drive từng tập ({episodes.length} tập)
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Mỗi tập phim có thể gắn một link Google Drive riêng để người xem chuyển tập
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleAddBatchEpisodes(12)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    + 12 Tập
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBatchEpisodes(24)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                  >
                    + 24 Tập
                  </button>
                  <button
                    type="button"
                    onClick={handleAddEpisode}
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> Thêm 1 tập
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                {episodes.map((ep, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700, width: '48px', color: 'var(--accent-cyan)' }}>
                      Tập {idx + 1}
                    </span>

                    <input
                      type="text"
                      placeholder="Tên tập (VD: Tập 1)"
                      value={ep.title}
                      onChange={(e) => handleUpdateEpisode(idx, 'title', e.target.value)}
                      style={{
                        width: '100px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />

                    <input
                      type="text"
                      placeholder="Dán link Drive của tập này..."
                      value={ep.gdriveUrl || ''}
                      onChange={(e) => handleUpdateEpisode(idx, 'gdriveUrl', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                      }}
                    />

                    {ep.gdriveUrl && (
                      <button
                        type="button"
                        onClick={() => handleOpenDriveTest(ep.gdriveUrl || '')}
                        title="Thử phát video tập này"
                        style={{ padding: '6px', color: '#2ed573' }}
                      >
                        <Play size={14} fill="#2ed573" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveEpisode(idx)}
                      title="Xóa tập này"
                      style={{ padding: '6px', color: 'var(--accent-crimson)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: Danh sách diễn viên & Vai diễn (AI tự điền) */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Diễn viên chính & Vai diễn</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Được AI điền sẵn theo nhân vật trong phim
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCast}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Thêm diễn viên
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cast.map((member, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Tên diễn viên (VD: Timothée Chalamet)"
                    value={member.name}
                    onChange={(e) => handleUpdateCast(index, 'name', e.target.value)}
                    style={{
                      flex: '1 1 180px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Vai diễn (VD: Paul Atreides)"
                    value={member.role}
                    onChange={(e) => handleUpdateCast(index, 'role', e.target.value)}
                    style={{
                      flex: '1 1 180px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCast(index)}
                    style={{
                      color: 'var(--accent-crimson)',
                      padding: '6px',
                      cursor: 'pointer',
                    }}
                    title="Xóa diễn viên"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Media, Posters, Live Previews & Settings ───── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card: Thể loại phim */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Thể loại phim</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Đã chọn: {genres.join(', ')}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {AVAILABLE_GENRES.map((g) => {
                const isSelected = genres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleToggleGenre(g)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected
                        ? 'rgba(229, 57, 79, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? 'var(--accent-crimson)' : 'var(--text-secondary)',
                      border: isSelected
                        ? '1px solid var(--accent-crimson)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSelected ? `✓ ${g}` : g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Phân loại định dạng & Đánh giá */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Phân loại & Định dạng
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Loại nội dung */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Loại nội dung
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'movie', label: 'Phim lẻ' },
                    { id: 'series', label: 'Phim bộ' },
                    { id: 'anime', label: 'Anime' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setContentType(t.id as ContentType)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        fontWeight: 600,
                        background:
                          contentType === t.id
                            ? 'var(--accent-crimson)'
                            : 'rgba(255, 255, 255, 0.05)',
                        color: contentType === t.id ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chất lượng & Ngôn ngữ */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Chất lượng video
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="4K">4K Ultra HD</option>
                    <option value="FHD">FHD 1080p</option>
                    <option value="HD">HD 720p</option>
                    <option value="CAM">Bản CAM rạp</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Ngôn ngữ
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="Vietsub">Vietsub (Phụ đề)</option>
                    <option value="Thuyết minh">Thuyết minh</option>
                    <option value="Lồng tiếng">Lồng tiếng</option>
                    <option value="Nguyên bản">Nguyên bản (Tiếng Anh)</option>
                  </select>
                </div>
              </div>

              {/* Trạng thái & Đánh giá */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Trạng thái phát hành
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'released' | 'upcoming' | 'ongoing')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="released">Đã phát hành</option>
                    <option value="upcoming">Sắp chiếu</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Điểm đánh giá (0-10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFC107',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Ghim Tiêu điểm & Thịnh hành */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-crimson)' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Ghim mục Tiêu điểm (Hero Banner đầu trang)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={trending}
                    onChange={(e) => setTrending(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-violet)' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Ghim mục Phim thịnh hành (Trending)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={inTheaters}
                    onChange={(e) => setInTheaters(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Phim đang chiếu rạp (Theaters)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card: Hình ảnh & Trailer với Live Preview */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Hình ảnh & Trailer (Xem trước trực tiếp)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Poster URL */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Poster URL (Hình dọc 2:3 - Tự điền bởi AI)
                </label>
                <input
                  type="url"
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Backdrop URL */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Backdrop URL (Banner ngang 16:9 - Tự điền bởi AI)
                </label>
                <input
                  type="url"
                  placeholder="https://image.tmdb.org/t/p/original/..."
                  value={backdropUrl}
                  onChange={(e) => setBackdropUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Trailer Embed URL */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  YouTube Trailer Embed URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/embed/..."
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Live Image Previews */}
              <div style={{ marginTop: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Xem trước hình ảnh:
                </span>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Poster Thumbnail */}
                  <div
                    style={{
                      width: '100px',
                      height: '150px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#14161f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      flexShrink: 0,
                    }}
                  >
                    <MovieImage
                      src={posterUrl}
                      alt={title || 'Poster preview'}
                      fallbackTitle={title || 'Chưa có ảnh'}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>

                  {/* Backdrop Thumbnail */}
                  <div
                    style={{
                      flex: 1,
                      height: '150px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#14161f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <MovieImage
                      src={backdropUrl || posterUrl}
                      alt={title || 'Backdrop preview'}
                      fallbackTitle={title || 'Banner xem trước'}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'white',
                      }}
                    >
                      Banner 16:9
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI Candidate Selection Modal ────────────────────────────── */}
      {showAiModal && aiCandidates.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              background: '#14161f',
              border: '1px solid rgba(130, 120, 255, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-violet)" />
                <h3 style={{ fontSize: '17px', fontWeight: 700 }}>
                  Tìm thấy {aiCandidates.length} kết quả phù hợp
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Vui lòng chọn chính xác bộ phim bạn muốn đăng để AI nạp dữ liệu:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
              {aiCandidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleAiFetch(c.title, c.id, c.mediaType === 'tv' ? 'tv' : 'movie')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(130, 120, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'var(--accent-violet)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '60px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#08090C',
                      flexShrink: 0,
                    }}
                  >
                    <MovieImage src={c.posterUrl} alt={c.title} fallbackTitle={c.title} fill style={{ objectFit: 'cover' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {c.title} {c.year ? `(${c.year})` : ''}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.originalTitle} • {c.mediaType === 'tv' ? 'Phim bộ (TV Series)' : 'Phim lẻ (Movie)'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Chọn phim này
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Google Drive Video Test Preview Modal ─────────────────────── */}
      {showDriveTestModal && driveTestUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '850px',
              background: '#101116',
              border: '1px solid rgba(46, 213, 115, 0.4)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.9)',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2ed573' }}>
                <HardDrive size={18} />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>
                  Kiểm tra phát video Google Drive (Iframe Preview)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDriveTestModal(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%', background: '#000' }}>
              <iframe
                src={driveTestUrl}
                title="Google Drive Video Preview"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>✓ Nếu video chạy được, quyền chia sẻ hiện tại phù hợp. Drive vẫn có thể giới hạn lượt xem hoặc băng thông.</span>
              <button
                type="button"
                onClick={() => setShowDriveTestModal(false)}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Đóng xem thử
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
