import { NextResponse } from 'next/server';
import { generateSlug } from '@/lib/movies/movie-storage';
import { createClient } from '@/lib/supabase/server';
import type { ContentType, CastMember, Season, Episode } from '@/types/movie';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
  Accept: 'application/json',
};

interface TmdbSearchResultItem {
  id: number;
  media_type: 'movie' | 'tv' | string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string;
}

interface TmdbCrewItem {
  job: string;
  name: string;
}

interface TmdbCastItem {
  name: string;
  character?: string;
  profile_path?: string | null;
}

interface TmdbVideoItem {
  site: string;
  type: string;
  key: string;
}

interface TmdbDetailItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  genres?: { id: number; name: string }[];
  credits?: {
    crew?: TmdbCrewItem[];
    cast?: TmdbCastItem[];
  };
  videos?: {
    results?: TmdbVideoItem[];
  };
  created_by?: { name: string }[];
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  vote_average?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  original_language?: string;
  origin_country?: string[];
  production_countries?: { iso_3166_1: string; name: string }[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  status?: string;
}

// Genre mapping dictionary from TMDB IDs/names to clean Vietnamese labels
const GENRE_MAP: Record<string, string> = {
  action: 'Hành động',
  'action & adventure': 'Hành động',
  adventure: 'Phiêu lưu',
  animation: 'Hoạt hình',
  comedy: 'Hài',
  crime: 'Trinh thám',
  documentary: 'Tài liệu',
  drama: 'Tâm lý',
  family: 'Gia đình',
  fantasy: 'Fantasy',
  history: 'Lịch sử',
  horror: 'Kinh dị',
  music: 'Âm nhạc',
  mystery: 'Trinh thám',
  romance: 'Tình cảm',
  'science fiction': 'Khoa học viễn tưởng',
  'sci-fi & fantasy': 'Khoa học viễn tưởng',
  thriller: 'Kinh dị',
  war: 'Chiến tranh',
  western: 'Miền Tây',
};

function mapGenre(gName: string): string {
  const key = gName.toLowerCase().trim();
  return GENRE_MAP[key] || gName;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
    }
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin');
    if (roleError || !isAdmin) {
      return NextResponse.json({ error: 'Bạn không có quyền quản trị.' }, { status: 403 });
    }

    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey) {
      return NextResponse.json({ error: 'Máy chủ chưa cấu hình TMDB_API_KEY.' }, { status: 503 });
    }

    const body = await req.json();
    const { query, tmdbId, mediaType } = body;

    if (!query && !tmdbId) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp tên phim để AI tìm kiếm.' },
        { status: 400 }
      );
    }

    let targetId = tmdbId;
    let targetType: 'movie' | 'tv' = mediaType === 'tv' ? 'tv' : 'movie';
    let searchResults: Array<{
      id: number;
      mediaType: string;
      title: string;
      originalTitle: string;
      year: string;
      posterUrl: string | null;
      overview: string;
    }> = [];

    // Step 1: If no specific TMDB ID, perform search
    if (!targetId && query) {
      // Search in Vietnamese first
      const searchUrlVi = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(
        query.trim()
      )}&language=vi-VN&include_adult=false`;

      let res = await fetch(searchUrlVi, { headers: HEADERS });
      let data = await res.json();

      // If no results in vi-VN, fallback to en-US
      if (!data.results || data.results.length === 0) {
        const searchUrlEn = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(
          query.trim()
        )}&language=en-US&include_adult=false`;
        res = await fetch(searchUrlEn, { headers: HEADERS });
        data = await res.json();
      }

      const validResults: TmdbSearchResultItem[] = (data.results || []).filter(
        (r: TmdbSearchResultItem) => r.media_type === 'movie' || r.media_type === 'tv'
      );

      if (validResults.length === 0) {
        return NextResponse.json(
          {
            found: false,
            message: `Không tìm thấy thông tin cho phim "${query}". Vui lòng thử từ khóa khác hoặc nhập tên tiếng Anh.`,
          },
          { status: 404 }
        );
      }

      searchResults = validResults.slice(0, 5).map((r: TmdbSearchResultItem) => ({
        id: r.id,
        mediaType: r.media_type,
        title: r.title || r.name || '',
        originalTitle: r.original_title || r.original_name || '',
        year: (r.release_date || r.first_air_date || '').split('-')[0],
        posterUrl: r.poster_path
          ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
          : null,
        overview: r.overview || '',
      }));

      // Pick top match
      const topMatch = validResults[0];
      targetId = topMatch.id;
      targetType = topMatch.media_type === 'tv' ? 'tv' : 'movie';
    }

    // Step 2: Fetch full details, credits, and videos for the chosen title
    const detailsUrlVi = `https://api.themoviedb.org/3/${targetType}/${targetId}?api_key=${tmdbKey}&append_to_response=credits,videos&language=vi-VN`;
    const detailsUrlEn = `https://api.themoviedb.org/3/${targetType}/${targetId}?api_key=${tmdbKey}&append_to_response=credits,videos&language=en-US`;

    const [resVi, resEn] = await Promise.all([
      fetch(detailsUrlVi, { headers: HEADERS }).then((r) => r.json()).catch(() => null),
      fetch(detailsUrlEn, { headers: HEADERS }).then((r) => r.json()).catch(() => null),
    ]);

    const item: TmdbDetailItem = (resVi?.id ? resVi : resEn) || {};
    const backup: TmdbDetailItem = resEn || {};

    if (!item.id) {
      return NextResponse.json({ error: 'Không thể lấy thông tin chi tiết.' }, { status: 500 });
    }

    // Extract title & original title
    const title = item.title || item.name || backup.title || backup.name || query;
    const originalTitle = item.original_title || item.original_name || backup.original_title || backup.original_name || title;

    // Extract overview (prefer VN, fallback to EN)
    const overview =
      (item.overview && item.overview.trim().length > 10
        ? item.overview
        : backup.overview) || '';

    // Extract genres
    const rawGenres = (item.genres && item.genres.length > 0 ? item.genres : backup.genres) || [];
    const mappedGenres: string[] = Array.from(
      new Set(
        rawGenres.map((g) => mapGenre(g.name)).filter(Boolean)
      )
    );

    const finalGenres = mappedGenres.length > 0 ? mappedGenres : ['Hành động', 'Khoa học viễn tưởng'];

    // Determine content type
    let contentType: ContentType = targetType === 'tv' ? 'series' : 'movie';
    const isAnime =
      (item.original_language === 'ja' || backup.original_language === 'ja') &&
      finalGenres.includes('Hoạt hình');
    if (isAnime) {
      contentType = 'anime';
    }

    // Extract Director
    const crew = item.credits?.crew || backup.credits?.crew || [];
    const directorObj =
      crew.find((c) => c.job === 'Director') ||
      crew.find((c) => c.job === 'Creator') ||
      item.created_by?.[0] ||
      backup.created_by?.[0];
    const director = directorObj?.name || '';

    // Extract Cast & Characters (top 8)
    const rawCast = item.credits?.cast || backup.credits?.cast || [];
    const cast: CastMember[] = rawCast.slice(0, 8).map((c) => ({
      name: c.name || '',
      role: c.character || 'Diễn viên',
      avatarUrl: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined,
    }));

    // Extract Year & Release Date
    const releaseDate = item.release_date || item.first_air_date || backup.release_date || backup.first_air_date || '';
    const year = parseInt(releaseDate.split('-')[0], 10) || new Date().getFullYear();

    // Extract Runtime
    let runtime = item.runtime || backup.runtime || 120;
    if (targetType === 'tv' && (!runtime || runtime === 0)) {
      runtime = item.episode_run_time?.[0] || backup.episode_run_time?.[0] || 45;
    }

    // Rating
    const rating = parseFloat(((item.vote_average || backup.vote_average || 8.0) as number).toFixed(1));

    // Images
    const posterPath = item.poster_path || backup.poster_path;
    const backdropPath = item.backdrop_path || backup.backdrop_path;

    const posterUrl = posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg';
    const backdropUrl = backdropPath
      ? `https://image.tmdb.org/t/p/original${backdropPath}`
      : posterUrl;

    // Trailer
    const videos = item.videos?.results || backup.videos?.results || [];
    const trailer =
      videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
      videos.find((v) => v.site === 'YouTube');
    const trailerUrl = trailer?.key
      ? `https://www.youtube.com/embed/${trailer.key}`
      : 'https://www.youtube.com/embed/Way9Dexny3w';

    // Country
    const countries = item.origin_country || item.production_countries?.map((c) => c.iso_3166_1) || [];
    let country = 'Mỹ';
    if (countries.includes('VN')) country = 'Việt Nam';
    else if (countries.includes('KR')) country = 'Hàn Quốc';
    else if (countries.includes('JP')) country = 'Nhật Bản';
    else if (countries.includes('CN') || countries.includes('HK') || countries.includes('TW')) country = 'Trung Quốc';
    else if (countries.includes('GB')) country = 'Anh';
    else if (countries.includes('FR')) country = 'Pháp';
    else if (countries.includes('TH')) country = 'Thái Lan';

    // Status & Episode Count (Phimmoi style)
    let episodeCurrent = 'Full HD Vietsub';
    let seasons: Season[] = [];

    if (targetType === 'tv') {
      const totalEps = item.number_of_episodes || backup.number_of_episodes || 12;
      const isComplete = item.status === 'Ended';
      episodeCurrent = isComplete
        ? `Hoàn tất (${totalEps}/${totalEps} Tập)`
        : `Tập 1/${totalEps} Tập`;

      // Generate seasons and episodes
      const epsList: Episode[] = [];
      for (let ep = 1; ep <= Math.min(totalEps, 24); ep++) {
        epsList.push({
          id: `ep-${ep}`,
          number: ep,
          seasonNumber: 1,
          title: `Tập ${ep}`,
          runtime: runtime,
          playbackUrl: '',
          gdriveUrl: '',
        });
      }
      seasons = [
        {
          number: 1,
          title: `Mùa 1`,
          episodeCount: totalEps,
          episodes: epsList,
        },
      ];
    }

    const movieData = {
      title,
      originalTitle,
      slug: generateSlug(title),
      overview,
      posterUrl,
      backdropUrl,
      releaseDate,
      year,
      runtime,
      genres: finalGenres,
      rating,
      contentType,
      trailerUrl,
      director,
      cast,
      quality: 'FHD',
      language: 'Vietsub',
      country,
      status: (item.status === 'In Production' || item.status === 'Planned' ? 'upcoming' : 'released') as 'released' | 'upcoming',
      episodeCurrent,
      seasons,
    };

    return NextResponse.json({
      found: true,
      searchResults,
      movieData,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Lỗi xử lý AI tìm kiếm phim.';
    console.error('AI Movie Search error:', error);
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
