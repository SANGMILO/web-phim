'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get('redirect');
  const redirectUrl = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/';
  const { login, loginDemo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    if (res.success) {
      router.push(redirectUrl);
      router.refresh();
    } else {
      setError(res.error || 'Đăng nhập không thành công');
    }
  };

  const handleDemoLogin = async () => {
    await loginDemo();
    router.push(redirectUrl);
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 20px 60px',
        overflow: 'hidden',
      }}
    >
      {/* Background artwork */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="https://image.tmdb.org/t/p/original/aEG2r3hFCddGlMFWZQBEVnMpOnv.jpg"
          alt="Backdrop"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', filter: 'brightness(0.3) blur(4px)' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(8,9,12,0.8) 0%, rgba(8,9,12,0.95) 100%)',
          }}
        />
      </div>

      {/* Login Card */}
      <div
        className="glass"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '440px',
          padding: 'clamp(28px, 5vw, 44px)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            <span style={{ color: 'var(--accent-crimson)' }}>CINE</span>
            <span>VERSE</span>
          </Link>
          <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
            Đăng Nhập
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Truy cập tài khoản để đồng bộ danh sách phim và lịch sử xem
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(229,57,79,0.15)',
              border: '1px solid rgba(229,57,79,0.3)',
              color: '#ff6b81',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Login Button */}
        {!isSupabaseConfigured() && <button
          type="button"
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(130, 120, 255, 0.12)',
            border: '1px solid rgba(130, 120, 255, 0.3)',
            color: 'var(--accent-violet)',
            fontWeight: 600,
            fontSize: '13px',
            marginBottom: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(130, 120, 255, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(130, 120, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(130, 120, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(130, 120, 255, 0.3)';
          }}
        >
          <Zap size={16} fill="var(--accent-violet)" /> Đăng nhập nhanh (Tài khoản thử nghiệm)
        </button>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Địa chỉ Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="email"
                placeholder="vidu@cineverse.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  fontSize: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => alert('Chức năng khôi phục mật khẩu sẽ được hỗ trợ trong phiên bản kết nối backend.')}
                style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Quên mật khẩu?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  fontSize: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '15px',
              marginTop: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Switch */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            style={{ color: 'var(--accent-crimson)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
