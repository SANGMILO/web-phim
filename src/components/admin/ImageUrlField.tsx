'use client';

import { useState } from 'react';
import { MovieImage } from '@/components/common/MovieImage';

interface ImageUrlFieldProps {
  name: string;
  label: string;
  defaultValue?: string;
  aspectRatio: string;
}

export function ImageUrlField({ name, label, defaultValue = '', aspectRatio }: ImageUrlFieldProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <label style={{ display: 'grid', gap: 8, fontSize: 13, fontWeight: 600 }}>
      {label}
      <input className="input" name={name} type="url" value={value} onChange={(event) => setValue(event.target.value)} placeholder={`${label} URL`} />
      {value && (
        <span style={{ position: 'relative', width: '100%', maxWidth: 420, aspectRatio, overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <MovieImage src={value} alt={`Xem trước ${label}`} fill sizes="420px" style={{ objectFit: 'cover' }} />
        </span>
      )}
    </label>
  );
}
