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
        <linearGradient id="brandBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#220D15" />
          <stop offset="45%" stopColor="#0E0F16" />
          <stop offset="100%" stopColor="#050608" />
        </linearGradient>
        <linearGradient id="brandRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF2B36" />
          <stop offset="50%" stopColor="#E50914" />
          <stop offset="100%" stopColor="#B20710" />
        </linearGradient>
        <linearGradient id="brandPlayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FFB3B8" />
        </linearGradient>
        <radialGradient id="brandCenterGlow" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#E50914" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E50914" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Squircle Base */}
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="120"
        fill="url(#brandBgGrad)"
        stroke="#FF2B36"
        strokeWidth="6"
        strokeOpacity="0.4"
      />
      <rect x="24" y="24" width="464" height="464" rx="120" fill="url(#brandCenterGlow)" />

      {/* Film Edge Perforations */}
      <g fill="#FFFFFF" fillOpacity="0.15">
        <rect x="52" y="70" width="16" height="26" rx="5" />
        <rect x="52" y="112" width="16" height="26" rx="5" />
        <rect x="52" y="374" width="16" height="26" rx="5" />
        <rect x="52" y="416" width="16" height="26" rx="5" />
        <rect x="444" y="70" width="16" height="26" rx="5" />
        <rect x="444" y="112" width="16" height="26" rx="5" />
        <rect x="444" y="374" width="16" height="26" rx="5" />
        <rect x="444" y="416" width="16" height="26" rx="5" />
      </g>

      {/* Cinema 'C' Shape */}
      <path
        d="M 345 155 C 315 125 272 110 220 115 C 145 122 92 182 92 256 C 92 330 145 390 220 397 C 272 402 315 387 345 357 C 353 349 349 335 338 335 L 292 335 C 285 335 279 339 273 344 C 255 358 234 362 214 358 C 168 350 144 310 144 256 C 144 202 168 162 214 154 C 234 150 255 154 273 168 C 279 173 285 177 292 177 L 338 177 C 349 177 353 163 345 155 Z"
        fill="url(#brandRedGrad)"
      />

      {/* Play Button */}
      <path
        d="M 235 195 C 224 188 210 196 210 209 L 210 303 C 210 316 224 324 235 317 L 305 270 C 315 264 315 248 305 242 Z"
        fill="url(#brandPlayGrad)"
      />
    </svg>
  );
}
