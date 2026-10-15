'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export function RegisterClient() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên hoặc biệt danh');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu từ 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với điều khoản sử dụng để tiếp tục');
      return;
    }

    setIsLoading(true);
    const res = await register(name, email, password);
    setIsLoading(false);
    if (res.success) {
      setSuccess(true);
      if (res.needsEmailConfirmation) {
        setSuccessMessage('Đăng ký thành công! Hãy kiểm tra email để xác nhận tài khoản.');
      } else {
        setSuccessMessage('Đăng ký thành công! Đang chuyển hướng về trang chủ...');
        router.push('/');
        router.refresh();
      }
    } else {
      setError(res.error || 'Đăng ký không thành công');
    }
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
          src="https://image.tmdb.org/t/p/original/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg"
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

      {/* Register Card */}
      <div
        className="glass"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '460px',
          padding: 'clamp(28px, 5vw, 44px)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            Tạo Tài Khoản
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Gia nhập cộng đồng người yêu phim CINEVERSE hoàn toàn miễn phí
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Display Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Tên hiển thị
            </label>
            <div style={{ position: 'relative' }}>
              <UserIcon
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
                type="text"
                placeholder="Ví dụ: Hoàng Long"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                placeholder="vidu@gmail.com"
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
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

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Xác nhận mật khẩu
            </label>
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
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Terms checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ accentColor: 'var(--accent-crimson)', cursor: 'pointer' }}
            />
            <label htmlFor="terms" style={{ cursor: 'pointer' }}>
              Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '15px',
              marginTop: '8px',
              cursor: isLoading || success ? 'not-allowed' : 'pointer',
              opacity: isLoading || success ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Switch */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            style={{ color: 'var(--accent-crimson)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
