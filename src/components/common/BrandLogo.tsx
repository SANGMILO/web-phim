import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function BrandLogo({ size = 32, className, style }: BrandLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        borderRadius: Math.round(size * 0.24),
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(229, 9, 20, 0.25)',
        ...style,
      }}
      aria-label="CINEVERSE Logo"
    >
      <defs>
        <linearGradient id="c_bg_logo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14151B" />
          <stop offset="100%" stopColor="#070709" />
        </linearGradient>
        <linearGradient id="c_accent_logo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF334B" />
          <stop offset="50%" stopColor="#E50914" />
          <stop offset="100%" stopColor="#A8000A" />
        </linearGradient>
        <linearGradient id="c_silver_logo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#B0B5C0" />
        </linearGradient>
        <radialGradient id="c_subtle_logo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF2B36" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF2B36" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Frame Base */}
      <rect x="28" y="28" width="456" height="456" rx="114" fill="url(#c_bg_logo)" stroke="#262835" strokeWidth="3" />
      <circle cx="256" cy="256" r="180" fill="url(#c_subtle_logo)" />

      {/* Minimalist Dual Arc Cinema C */}
      <path
        d="M 340 160 C 300 120 240 108 185 130 C 120 156 80 220 84 290 C 88 360 144 416 215 416 C 265 416 312 390 340 352 C 348 342 340 330 328 330 L 285 330 C 275 330 268 335 260 342 C 240 360 212 368 188 358 C 150 342 136 300 144 260 C 152 220 188 188 230 184 C 255 182 280 192 296 210 L 332 174 C 340 166 340 156 340 160 Z"
        fill="url(#c_accent_logo)"
      />

      {/* Double Forward Chevron (Fast-forward / Cinema Stream) */}
      <path
        d="M 230 216 L 270 256 L 230 296 C 224 302 214 298 214 288 L 214 224 C 214 214 224 210 230 216 Z"
        fill="url(#c_silver_logo)"
      />
      <path
        d="M 276 216 L 316 256 L 276 296 C 270 302 260 298 260 288 L 260 224 C 260 214 270 210 276 216 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
