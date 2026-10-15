'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Film } from 'lucide-react';

interface MovieImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src?: string | null;
  alt: string;
  fallbackTitle?: string;
  className?: string;
}

export function MovieImage({
  src,
  alt,
  fallbackTitle,
  style,
  className,
  fill,
  sizes,
  priority,
  ...rest
}: MovieImageProps) {
  const [hasError, setHasError] = useState(false);

  // If no source or error, show sophisticated cinematic placeholder
  if (!src || hasError) {
    return (
      <div
        className={className}
        style={{
          width: fill ? '100%' : rest.width,
          height: fill ? '100%' : rest.height,
          position: fill ? 'absolute' : 'relative',
          inset: fill ? 0 : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #181a22 0%, #0d0e14 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          overflow: 'hidden',
          ...style,
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(229, 57, 79, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            color: 'var(--accent-crimson)',
            flexShrink: 0,
          }}
        >
          <Film size={22} />
        </div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {fallbackTitle || alt}
        </p>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          CINEVERSE
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      onError={() => setHasError(true)}
      style={style}
      className={className}
      unoptimized
      {...rest}
    />
  );
}
