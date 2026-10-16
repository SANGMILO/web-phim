'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Film,
  PlusCircle,
  Upload,
  Globe,
  ChevronRight,
  Database,
} from 'lucide-react';
import { useMovieAdmin } from '@/lib/movies/useMovieAdmin';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { movies } = useMovieAdmin();

  const links = [
    {
      href: '/admin',
      label: 'Tổng quan Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: '/admin/movies',
      label: 'Quản lý phim & series',
      icon: Film,
      badge: movies.length,
    },
    {
      href: '/admin/movies/new',
      label: 'Thêm phim mới',
      icon: PlusCircle,
      badge: '+ Mới',
      isAccent: true,
    },
    {
      href: '/admin/database',
      label: 'Đăng phim qua Google Drive',
      icon: Upload,
      badge: 'Drive',
      isAccent: true,
    },
    {
      href: '/admin/settings',
      label: 'Dữ liệu demo cục bộ',
      icon: Database,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
          className="admin-sidebar-overlay"
        />
      )}

      <aside
        style={{
          width: '260px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          background: '#0d0e14',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 95,
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="font-display"
              style={{
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              <span style={{ color: 'var(--accent-crimson)' }}>CINE</span>
              <span style={{ color: 'var(--text-primary)' }}>VERSE</span>
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(229, 57, 79, 0.15)',
                color: 'var(--accent-crimson)',
                border: '1px solid rgba(229, 57, 79, 0.3)',
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.05em',
              }}
            >
              ADMIN
            </span>
          </Link>
        </div>

        {/* Navigation items */}
        <div style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '8px', padding: '0 8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Hệ thống quản trị
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : link.href === '/admin/movies'
                    ? pathname === '/admin/movies' || /^\/admin\/movies\/[^/]+\/edit$/.test(pathname)
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(229, 57, 79, 0.12)' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(229, 57, 79, 0.3)'
                      : '1px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon
                    size={18}
                    color={
                      isActive
                        ? 'var(--accent-crimson)'
                        : link.isAccent
                        ? 'var(--accent-violet)'
                        : 'var(--text-muted)'
                    }
                  />
                  <span style={{ flex: 1 }}>{link.label}</span>
                  {link.badge !== null && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: link.isAccent
                          ? 'rgba(130, 120, 255, 0.2)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: link.isAccent ? 'var(--accent-violet)' : 'var(--text-muted)',
                      }}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick links to main site */}
          <div style={{ marginTop: '28px', marginBottom: '8px', padding: '0 8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Liên kết ngoài
            </span>
          </div>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--accent-cyan)',
              background: 'rgba(117, 221, 243, 0.06)',
              border: '1px solid rgba(117, 221, 243, 0.15)',
              transition: 'all 0.2s',
            }}
          >
            <Globe size={18} />
            <span style={{ flex: 1 }}>Về trang xem phim</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* User Card in Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-crimson) 0%, var(--accent-violet) 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            A
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Admin Quản Trị
            </p>
            <p style={{ fontSize: '11px', color: 'var(--accent-crimson)', fontWeight: 600 }}>
              Super Administrator
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
