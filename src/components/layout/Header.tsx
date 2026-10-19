'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWatchlist } from '@/components/providers/WatchlistProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { GENRES } from '@/data/demo-movies';
import { BrandLogo } from '@/components/common/BrandLogo';
import {
  Search,
  Bookmark,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/movies', label: 'Phim lẻ' },
  { href: '/series', label: 'Phim bộ' },
  { href: '/anime', label: 'Anime' },
  { href: '/theaters', label: 'Chiếu rạp' },
  { href: '/upcoming', label: 'Sắp chiếu' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { count } = useWatchlist();
  const { user, isAuthenticated, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [genreDropdown, setGenreDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close menus when pathname changes
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setUserDropdown(false);
  }

  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchOpen(false);
      }
    },
    [router, searchQuery],
  );

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const headerBg = scrolled || !isHome
    ? 'rgba(8, 9, 12, 0.95)'
    : 'transparent';

  return (
    <>
      <header
        id="main-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: headerBg,
          backdropFilter: scrolled || !isHome ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
          transition: 'all 0.4s var(--easing-cinematic)',
        }}
      >
        <div
          className="container-main"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="brand-logo-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              flexShrink: 0,
              textDecoration: 'none',
            }}
          >
            <BrandLogo size={40} />
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span>CINE</span>
              <span className="brand-gradient-v">V</span>
              <span>ERSE</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            className="desktop-nav"
          >
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '8px 14px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: pathname === href ? 'var(--accent-crimson)' : 'var(--text-secondary)',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== href) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (pathname !== href) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {label}
              </Link>
            ))}

            {/* Genre Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setGenreDropdown((v) => !v)}
                style={{
                  padding: '8px 14px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => {
                  if (!genreDropdown) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Thể loại <ChevronDown size={14} />
              </button>
              {genreDropdown && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setGenreDropdown(false)}
                  />
                  <div
                    className="glass"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      minWidth: '200px',
                      padding: '8px',
                      borderRadius: 'var(--radius-lg)',
                      zIndex: 50,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2px',
                    }}
                  >
                    {GENRES.map((genre) => (
                      <Link
                        key={genre}
                        href={`/movies?genre=${encodeURIComponent(genre)}`}
                        onClick={() => setGenreDropdown(false)}
                        style={{
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        {genre}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Search toggle */}
            <button
              className="btn-icon"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Tìm kiếm"
              style={{ width: '40px', height: '40px' }}
            >
              <Search size={18} />
            </button>

            {/* Watchlist */}
            <Link
              href="/watchlist"
              className="btn-icon desktop-only"
              aria-label="Danh sách xem"
              style={{
                width: '40px',
                height: '40px',
                position: 'relative',
              }}
            >
              <Bookmark size={18} />
              {count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: 'var(--accent-crimson)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </Link>

            {/* User Profile / Sign In */}
            {isAuthenticated && user ? (
              <div style={{ position: 'relative' }} className="desktop-only">
                <button
                  onClick={() => setUserDropdown((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'var(--accent-crimson)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      maxWidth: '110px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.name}
                  </span>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </button>

                {userDropdown && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      onClick={() => setUserDropdown(false)}
                    />
                    <div
                      className="glass"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: '220px',
                        padding: '12px',
                        borderRadius: 'var(--radius-lg)',
                        zIndex: 50,
                        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div style={{ paddingBottom: '10px', marginBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                      </div>

                      <Link
                        href="/watchlist"
                        onClick={() => setUserDropdown(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Bookmark size={15} /> Danh sách xem ({count})
                      </Link>

                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdown(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            fontSize: '13px',
                            color: 'var(--accent-crimson)',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(229, 57, 79, 0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Shield size={15} /> Trang Quản Trị (Admin)
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setUserDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          fontSize: '13px',
                          color: 'var(--accent-crimson)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          marginTop: '4px',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '10px',
                        }}
                      >
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-ghost desktop-only"
                style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <User size={16} /> Đăng nhập
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="btn-icon mobile-only"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menu"
              style={{ width: '40px', height: '40px' }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '12px 0',
            }}
          >
            <form
              className="container-main"
              onSubmit={handleSearch}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                className="input"
                type="search"
                placeholder="Tìm phim, diễn viên, thể loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px' }}>
                <Search size={16} /> Tìm
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-only"
          style={{
            position: 'fixed',
            inset: 0,
            top: '72px',
            background: 'rgba(8, 9, 12, 0.98)',
            backdropFilter: 'blur(20px)',
            zIndex: 45,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* User status in mobile */}
            {isAuthenticated && user ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '12px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--accent-crimson)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>{user.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  style={{ color: 'var(--accent-crimson)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                >
                  <LogOut size={16} /> Thoát
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <Link
                  href="/login"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', textAlign: 'center', fontSize: '14px' }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px', textAlign: 'center', fontSize: '14px' }}
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: pathname === href ? 'var(--accent-crimson)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  background: pathname === href ? 'rgba(229,57,79,0.08)' : 'transparent',
                }}
              >
                {label}
              </Link>
            ))}
            <div style={{ padding: '16px 16px 8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Thể loại
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 16px 16px' }}>
              {GENRES.map((genre) => (
                <Link
                  key={genre}
                  href={`/movies?genre=${encodeURIComponent(genre)}`}
                  className="chip"
                >
                  {genre}
                </Link>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '8px', paddingTop: '16px' }}>
              <Link
                href="/watchlist"
                style={{
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Bookmark size={18} /> Danh sách xem
                {count > 0 && (
                  <span className="badge badge-quality" style={{ marginLeft: 'auto' }}>{count}</span>
                )}
              </Link>
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  style={{
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--accent-crimson)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Shield size={18} /> Trang Quản Trị
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Responsive styles for nav */}
      <style jsx global>{`
        .desktop-nav {
          display: none;
        }
        .desktop-only {
          display: none !important;
        }
        .mobile-only {
          display: flex !important;
        }
        @media (min-width: 1024px) {
          .desktop-nav {
            display: flex;
          }
          .desktop-only {
            display: inline-flex !important;
          }
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
