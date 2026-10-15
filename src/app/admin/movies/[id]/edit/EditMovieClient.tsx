'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';
import { MovieForm } from '@/components/admin/MovieForm';
import { useMovieAdmin } from '@/lib/movies/useMovieAdmin';

export function EditMovieClient({ id }: { id: string }) {
  const { getMovieById } = useMovieAdmin();
  const movie = getMovieById(id);

  if (!movie) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(229, 57, 79, 0.15)',
            color: 'var(--accent-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Film size={28} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
          Không tìm thấy tác phẩm
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Tác phẩm với mã định danh &quot;{id}&quot; không tồn tại hoặc đã bị xóa khỏi kho dữ liệu.
        </p>
        <Link href="/admin/movies" className="btn btn-primary" style={{ padding: '8px 18px' }}>
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  return <MovieForm initialMovie={movie} isEdit={true} />;
}
