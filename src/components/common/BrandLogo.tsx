'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
}

export function BrandLogo({
  size = 32,
  className = '',
  style,
  animated = true,
}: BrandLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const borderRadius = Math.round(size * 0.24);

  return (
    <div
      className={`brand-logo-3d-wrap ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        verticalAlign: 'middle',
        perspective: '600px',
        ...style,
      }}
      aria-label="CINEVERSE 3D Logo"
    >
      {/* 1. Pulsing Ambient Ruby Aura */}
      {animated && (
        <span
          className="brand-logo-aura"
          style={{
            position: 'absolute',
            inset: -Math.max(2, Math.round(size * 0.1)),
            borderRadius: `${borderRadius + 4}px`,
            background: 'radial-gradient(circle, rgba(255, 30, 50, 0.55) 0%, rgba(229, 9, 20, 0.2) 50%, transparent 75%)',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: isHovered ? 1 : 0.75,
            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: 'blur(4px)',
          }}
        />
      )}

      {/* 2. Main 3D Emblem Container with 3D Tilt */}
      <div
        className="brand-logo-inner"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          zIndex: 1,
          boxShadow: isHovered
            ? '0 8px 24px rgba(229, 9, 20, 0.5), 0 2px 8px rgba(0, 0, 0, 0.8)'
            : '0 4px 14px rgba(229, 9, 20, 0.3), 0 2px 6px rgba(0, 0, 0, 0.6)',
          transform: isHovered
            ? 'rotateY(-6deg) rotateX(6deg) scale(1.08)'
            : 'rotateY(0deg) rotateX(0deg) scale(1)',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(255, 80, 95, 0.35)',
          background: '#0c0d13',
        }}
      >
        {/* Photorealistic 3D Emblem */}
        <Image
          src="/logo-3d.png"
          alt="CINEVERSE"
          width={size}
          height={size}
          priority
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* 3. Cinematic Shimmer / Light Sweep Beam (Logo Động) */}
        {animated && (
          <span
            className="brand-shimmer-sweep"
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              pointerEvents: 'none',
              background: 'linear-gradient(135deg, transparent 35%, rgba(255, 255, 255, 0.75) 50%, transparent 65%)',
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>
    </div>
  );
}
