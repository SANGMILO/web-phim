'use client';

import React from 'react';
import Link from 'next/link';
import { GENRES } from '@/data/demo-movies';
import {
  Sword,
  Mountain,
  Atom,
  Ghost,
  Heart,
  Laugh,
  Brain,
  Palette,
  Sparkles,
  Search,
} from 'lucide-react';

const GENRE_ICONS: Record<string, React.ReactNode> = {
  'Hành động': <Sword size={24} />,
  'Phiêu lưu': <Mountain size={24} />,
  'Khoa học viễn tưởng': <Atom size={24} />,
  'Kinh dị': <Ghost size={24} />,
  'Tình cảm': <Heart size={24} />,
  'Hài': <Laugh size={24} />,
  'Tâm lý': <Brain size={24} />,
  'Hoạt hình': <Palette size={24} />,
  'Fantasy': <Sparkles size={24} />,
  'Trinh thám': <Search size={24} />,
};

const GENRE_COLORS: Record<string, string> = {
  'Hành động': '#E5394F',
  'Phiêu lưu': '#F59E0B',
  'Khoa học viễn tưởng': '#75DDF3',
  'Kinh dị': '#8B5CF6',
  'Tình cảm': '#EC4899',
  'Hài': '#10B981',
  'Tâm lý': '#6366F1',
  'Hoạt hình': '#F97316',
  'Fantasy': '#8278FF',
  'Trinh thám': '#06B6D4',
};

export function GenreGrid() {
  return (
    <section className="section-spacing">
      <div className="container-main">
        <div className="section-header">
          <h2 className="section-title">Khám phá theo thể loại</h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          {GENRES.map((genre) => {
            const color = GENRE_COLORS[genre] || '#E5394F';
            return (
              <Link
                key={genre}
                href={`/movies?genre=${encodeURIComponent(genre)}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '24px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
                  border: `1px solid ${color}20`,
                  transition: 'all 0.4s var(--easing-cinematic)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${color}25 0%, ${color}12 100%)`;
                  e.currentTarget.style.borderColor = `${color}40`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 32px ${color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`;
                  e.currentTarget.style.borderColor = `${color}20`;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ color }}>{GENRE_ICONS[genre]}</span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {genre}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
