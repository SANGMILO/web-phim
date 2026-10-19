'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND } from '@/config/brand';
import { GENRES } from '@/data/demo-movies';
import { BrandLogo } from '@/components/common/BrandLogo';

const BROWSE_LINKS = [
  { href: '/movies', label: 'Phim lẻ' },
  { href: '/series', label: 'Phim bộ' },
  { href: '/anime', label: 'Anime' },
  { href: '/theaters', label: 'Chiếu rạp' },
  { href: '/upcoming', label: 'Sắp chiếu' },
  { href: '/admin', label: 'Quản trị Admin' },
];

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        marginTop: '80px',
      }}
    >
      <div
        className="container-main"
        style={{ paddingTop: '60px', paddingBottom: '40px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: 'clamp(24px, 4vw, 48px)',
            marginBottom: '48px',
          }}
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                textDecoration: 'none',
              }}
            >
              <BrandLogo size={32} />
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-crimson)', textShadow: '0 0 20px rgba(229, 9, 20, 0.4)' }}>CINE</span>
                <span>VERSE</span>
              </span>
            </Link>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
                maxWidth: '280px',
              }}
            >
              {BRAND.description}. Khám phá hàng nghìn bộ phim, phim bộ và anime
              với chất lượng cao nhất.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '16px',
              }}
            >
              Duyệt tìm
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {BROWSE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '16px',
              }}
            >
              Thể loại
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {GENRES.slice(0, 6).map((genre) => (
                <li key={genre}>
                  <Link
                    href={`/movies?genre=${encodeURIComponent(genre)}`}
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {genre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '16px',
              }}
            >
              Thông tin
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Về chúng tôi
                </span>
              </li>
              <li>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Liên hệ
                </span>
              </li>
              <li>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Điều khoản sử dụng
                </span>
              </li>
              <li>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Chính sách bảo mật
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            © 2026 {BRAND.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
