'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Plus, ExternalLink } from 'lucide-react';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  title: string;
  subtitle?: string;
}

export function AdminHeader({ onToggleSidebar, title, subtitle }: AdminHeaderProps) {
  return (
    <header
      style={{
        height: '70px',
        background: 'rgba(13, 14, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          className="admin-menu-toggle"
          style={{
            display: 'none',
            color: 'var(--text-primary)',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.06)',
          }}
          aria-label="Mở menu quản trị"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1
            className="font-display"
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Quick Add Movie Button */}
        <Link
          href="/admin/database"
          className="btn btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} />
          <span>Thêm phim qua Drive</span>
        </Link>

        {/* Live Website Link */}
        <Link
          href="/"
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          <span>Xem web</span>
          <ExternalLink size={14} />
        </Link>
      </div>
    </header>
  );
}
