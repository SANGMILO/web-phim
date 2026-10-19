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
  size = 36,
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
      aria-label="CINEVERSE Cosmic 3D Logo"
    >
      {/* 1. Flowing Cosmic Gradient Aura (Gradient Animation) */}
      {animated && (
        <span
          className="brand-cosmic-aura"
          style={{
            position: 'absolute',
            inset: -Math.max(3, Math.round(size * 0.12)),
            borderRadius: `${borderRadius + 6}px`,
            pointerEvents: 'none',
            zIndex: 0,
            opacity: isHovered ? 1 : 0.8,
            transform: isHovered ? 'scale(1.2)' : 'scale(1)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: 'blur(5px)',
          }}
        />
      )}

      {/* 2. Main 3D Emblem Container with 3D Parallax Tilt */}
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
            ? '0 8px 26px rgba(139, 92, 246, 0.5), 0 0 20px rgba(236, 72, 153, 0.4), 0 2px 8px rgba(0, 0, 0, 0.9)'
            : '0 4px 16px rgba(139, 92, 246, 0.3), 0 2px 6px rgba(0, 0, 0, 0.7)',
          transform: isHovered
            ? 'rotateY(-8deg) rotateX(6deg) scale(1.08)'
            : 'rotateY(0deg) rotateX(0deg) scale(1)',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          background: '#07070b',
        }}
      >
        {/* Photorealistic 3D Crescent & Filmstrip Orbit Image */}
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

        {/* 3. Live Animated Gradient Wave Overlay (Gradient Animation) */}
        {animated && (
          <span
            className="brand-gradient-flow-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              mixBlendMode: 'color-dodge',
              opacity: isHovered ? 0.9 : 0.65,
              transition: 'opacity 0.3s',
            }}
          />
        )}

        {/* 4. Cinematic Anamorphic Shimmer Beam */}
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
              background: 'linear-gradient(135deg, transparent 35%, rgba(255, 255, 255, 0.8) 50%, transparent 65%)',
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>
    </div>
  );
}
