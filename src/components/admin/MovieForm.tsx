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
} from 'lucide-react';
import type { Movie, ContentType, CastMember } from '@/types/movie';
import { useMovieAdmin } from '@/lib/movies/useMovieAdmin';
import { generateSlug } from '@/lib/movies/movie-storage';
import { useToast } from '@/components/admin/AdminToast';
import { MovieImage } from '@/components/common/MovieImage';

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

export function MovieForm({ initialMovie, isEdit = false }: MovieFormProps) {
  const router = useRouter();
  const { saveMovie } = useMovieAdmin();
  const { showToast } = useToast();

  // Form State
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

  // Dynamic Cast members
  const [cast, setCast] = useState<CastMember[]>(
    initialMovie?.cast || [
      { name: 'Diễn viên 1', role: 'Nhân vật chính' },
      { name: 'Diễn viên 2', role: 'Nhân vật phụ' },
    ]
  );

  // Auto-generate slug when title changes (only if creating new)
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

  // Quick fill sample data for fast testing
  const handleQuickFillSample = () => {
    const sampleTitles = [
      {
        title: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô',
        orig: 'Detective Conan: The Million-dollar Pentagram',
        poster: 'https://image.tmdb.org/t/p/w500/5WJqI3kS4p02wQk5h97lU6l8s.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg',
        type: 'anime' as ContentType,
        genres: ['Hoạt hình', 'Trinh thám', 'Hành động'],
        director: 'Chika Nagaoka',
        runtime: 110,
        quality: '4K',
        rating: 8.5,
        overview:
          'Một bức thư từ siêu trộm Kaito Kid nhắm đến thanh kiếm Nhật Bản có liên quan đến Toshizo Hijikata ở Hakodate, Hokkaido. Conan và Heiji Hattori cùng nhau tham gia vụ án đối đầu đầy gay cấn.',
      },
      {
        title: 'Deadpool & Wolverine: Cuộc Chiến Đa Vũ Trụ',
        orig: 'Deadpool & Wolverine',
        poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1jv8AmC.jpg',
        type: 'movie' as ContentType,
        genres: ['Hành động', 'Hài', 'Khoa học viễn tưởng'],
        director: 'Shawn Levy',
        runtime: 128,
        quality: 'FHD',
        rating: 7.9,
        overview:
          'Wade Wilson giải nghệ và sống cuộc đời bình thường, nhưng khi Cơ quan Quản lý Phương sai Thời gian (TVA) lôi anh vào một nhiệm vụ bảo vệ dòng thời gian, anh phải thuyết phục Wolverine hợp tác.',
      },
    ];

    const pick = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
    setTitle(pick.title);
    setOriginalTitle(pick.orig);
    setSlug(generateSlug(pick.title));
    setPosterUrl(pick.poster);
    setBackdropUrl(pick.backdrop);
    setContentType(pick.type);
    setGenres(pick.genres);
    setDirector(pick.director);
    setRuntime(pick.runtime);
    setQuality(pick.quality);
    setRating(pick.rating);
    setOverview(pick.overview);
    setTrending(true);
    setFeatured(true);
    showToast('Đã điền dữ liệu mẫu thành công!', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Vui lòng nhập tên phim.', 'error');
      return;
    }

    const cleanSlug = slug.trim() || generateSlug(title);

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
      cast: cast.filter((c) => c.name.trim() !== ''),
      director: director.trim(),
      quality,
      language,
      country: country.trim() || 'Mỹ',
      status,
      featured,
      trending,
      inTheaters,
    };

    const res = saveMovie(movieData);

    if (res.success) {
      showToast(
        isEdit
          ? `Đã cập nhật tác phẩm "${title}" thành công!`
          : `Đã thêm mới tác phẩm "${title}" vào hệ thống!`,
        'success'
      );
      router.push('/admin/movies');
    } else {
      showToast('Có lỗi xảy ra khi lưu phim.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '28px', maxWidth: '1400px', width: '100%' }}>
      {/* Top action header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
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
              {isEdit ? `Chỉnh sửa: ${initialMovie?.title}` : 'Thêm tác phẩm điện ảnh mới'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {isEdit
                ? 'Cập nhật thông tin chi tiết, hình ảnh và danh sách tập phim'
                : 'Điền thông tin tác phẩm vào kho dữ liệu CINEVERSE'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isEdit && (
            <button
              type="button"
              onClick={handleQuickFillSample}
              className="btn btn-secondary"
              style={{
                padding: '9px 16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} color="var(--accent-violet)" />
              <span>Điền mẫu nhanh</span>
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={16} />
            <span>{isEdit ? 'Lưu thay đổi' : 'Tạo tác phẩm'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Core Info & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card: Thông tin cơ bản */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Thông tin cơ bản
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

              {/* Tóm tắt nội dung */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Tóm tắt nội dung (Overview)
                </label>
                <textarea
                  rows={4}
                  placeholder="Nhập phần tóm lược kịch bản bộ phim..."
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Đạo diễn
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Denis Villeneuve"
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
                    placeholder="Mỹ, Hàn Quốc, Nhật Bản..."
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '14px' }}>
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

          {/* Card: Danh sách diễn viên */}
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
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Diễn viên chính</h2>
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
                  }}
                >
                  <input
                    type="text"
                    placeholder="Tên diễn viên"
                    value={member.name}
                    onChange={(e) => handleUpdateCast(index, 'name', e.target.value)}
                    style={{
                      flex: 1,
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
                    placeholder="Vai diễn"
                    value={member.role}
                    onChange={(e) => handleUpdateCast(index, 'role', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-primary)',
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

        {/* Right Column: Media, Configuration & Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card: Phân loại & Hiển thị */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Phân loại & Hiển thị
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                    <option value="ongoing">Đang phát hành</option>
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

              {/* Checkboxes: Featured / Trending / Theaters */}
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
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Ghim mục Tiêu điểm (Featured Hero)</span>
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

          {/* Card: Hình ảnh & Video Preview */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
              Hình ảnh & Trailer (Xem trước)
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Poster URL */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Poster URL (Hình dọc tỷ lệ 2:3)
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
                  Backdrop URL (Banner ngang tỷ lệ 16:9)
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

              {/* Live Previews Container */}
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
                  Xem trước hình ảnh trực tiếp:
                </span>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
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
    </form>
  );
}
