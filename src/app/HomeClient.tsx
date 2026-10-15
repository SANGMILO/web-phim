'use client';

import React from 'react';
import type { Movie } from '@/types/movie';
import { Hero } from '@/components/hero/Hero';
import { MovieRail } from '@/components/movie/MovieRail';
import { GenreGrid } from '@/components/movie/GenreGrid';
import { ContinueWatching } from '@/components/home/ContinueWatching';
import { EditorialShowcase } from '@/components/home/EditorialShowcase';

interface HomeClientProps {
  featured: Movie[];
  trending: Movie[];
  movies: Movie[];
  series: Movie[];
  anime: Movie[];
  theaters: Movie[];
  upcoming: Movie[];
}

export function HomeClient({
  featured,
  trending,
  movies,
  series,
  anime,
  theaters,
  upcoming,
}: HomeClientProps) {
  const allMovies = [...featured, ...trending, ...movies, ...series, ...anime, ...theaters, ...upcoming];

  // Recent movies sorted by year
  const recentMovies = [...movies].sort((a, b) => b.year - a.year).slice(0, 15);
  // Curated recommendations: mix of high-rated across types
  const curated = [...movies, ...series, ...anime]
    .filter((m) => m.rating && m.rating >= 7.5)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 12);

  return (
    <>
      {/* Section 1 — Featured Hero */}
      <Hero movies={featured} />

      {/* Section 2 — Continue Watching (only renders if user has watch history) */}
      <ContinueWatching allMovies={allMovies} />

      {/* Section 3 — Trending */}
      <MovieRail
        title="Phim thịnh hành"
        movies={trending}
        linkHref="/movies"
        showRank
        showGenre
      />

      {/* Section 4 — Now in Theaters */}
      {theaters.length > 0 && (
        <MovieRail
          title="Đang chiếu rạp"
          movies={theaters}
          linkHref="/theaters"
          accentColor="var(--accent-crimson)"
        />
      )}

      {/* Section 5 — New Movies */}
      <MovieRail
        title="Phim mới cập nhật"
        movies={recentMovies}
        linkHref="/movies"
      />

      {/* Section 6 — Popular Series */}
      <MovieRail
        title="Phim bộ nổi bật"
        movies={series}
        linkHref="/series"
        showGenre
      />

      {/* Special Cinematic Editorial Horizontal Showcase */}
      <EditorialShowcase movies={curated} />

      {/* Section 7 — Anime */}
      <MovieRail
        title="Anime Universe"
        movies={anime}
        linkHref="/anime"
        accentColor="var(--accent-violet)"
        showGenre
      />

      {/* Section 8 — Upcoming */}
      {upcoming.length > 0 && (
        <MovieRail
          title="Sắp ra mắt"
          movies={upcoming}
          linkHref="/upcoming"
          accentColor="var(--accent-cyan)"
        />
      )}

      {/* Section 9 — Genre Grid */}
      <GenreGrid />

      {/* Section 10 — Curated Recommendations */}
      <MovieRail
        title="Biên tập viên đề xuất"
        movies={curated}
        showRank
        showGenre
      />
    </>
  );
}
