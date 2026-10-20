'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  CreditCard,
  Wallet,
  Crown,
  Sparkles,
  Clock,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  QrCode,
  Zap,
  Award,
  Smartphone,
  History,
  Film,
  Bookmark,
  ChevronRight,
  ArrowRight,
  X,
  Copy,
  Camera,
  Upload,
  Clapperboard,
  Ticket,
  Popcorn,
  Disc,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { profileService, type UserProfileData, type WalletTransaction } from '@/lib/profile/profile-service';
import { supabaseProfileService } from '@/lib/profile/supabase-profile-service';
import { paymentService } from '@/lib/payments/payment-service';
import type { PaymentSettings } from '@/types/payment';
import { useWatchlist } from '@/components/providers/WatchlistProvider';

// Authentic Cinema Avatar Presets (Zero AI feel, Studio Monograms & Cinema Tools)
interface AvatarPreset {
  id: string;
  label: string;
  type: 'monogram' | 'icon';
  bg: string;
  icon?: LucideIcon;
}

const AVATAR_PRESETS: AvatarPreset[] = [
  // Monograms on luxury cinema velvet/metallic backgrounds
  { id: 'mono-ruby', label: 'Chữ cái Ruby', type: 'monogram', bg: 'linear-gradient(135deg, #E50914 0%, #831010 100%)' },
  { id: 'mono-gold', label: 'Chữ cái Hoàng gia', type: 'monogram', bg: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' },
  { id: 'mono-dark', label: 'Chữ cái Titan', type: 'monogram', bg: 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)' },
  { id: 'mono-emerald', label: 'Chữ cái Emerald', type: 'monogram', bg: 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)' },

  // Studio Minimalist Vector Icons
  { id: 'icon-clapper', label: 'Đạo diễn', type: 'icon', bg: 'linear-gradient(135deg, #991B1B 0%, #450A0A 100%)', icon: Clapperboard },
  { id: 'icon-film', label: 'Cuộn phim', type: 'icon', bg: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', icon: Film },
  { id: 'icon-camera', label: 'Máy quay', type: 'icon', bg: 'linear-gradient(135deg, #374151 0%, #111827 100%)', icon: Camera },
  { id: 'icon-ticket', label: 'Vé VIP', type: 'icon', bg: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)', icon: Ticket },
  { id: 'icon-popcorn', label: 'Bỏng ngô rạp', type: 'icon', bg: 'linear-gradient(135deg, #C2410C 0%, #7C2D12 100%)', icon: Popcorn },
  { id: 'icon-disc', label: 'Đĩa 4K', type: 'icon', bg: 'linear-gradient(135deg, #047857 0%, #022C22 100%)', icon: Disc },
];

const GENRE_OPTIONS = [
  'Hành động',
  'Khoa học viễn tưởng',
  'Phiêu lưu',
  'Kinh dị',
  'Hài hước',
  'Tâm lý',
  'Anime',
  'Hoạt hình',
  'Tài liệu',
  'Chiến tranh',
];

const TOP_UP_AMOUNTS = [
  { amount: 50000, label: '50.000 ₫', bonus: '' },
  { amount: 100000, label: '100.000 ₫', bonus: 'Phổ biến' },
  { amount: 200000, label: '200.000 ₫', bonus: '+10% Bonus' },
  { amount: 500000, label: '500.000 ₫', bonus: '+20% VIP Bonus' },
  { amount: 1000000, label: '1.000.000 ₫', bonus: '+25% King' },
];

// Robust Avatar Renderer
function renderAvatarBadge(
  avatarUrl: string | undefined,
  name: string,
  size = 84,
  fontSize = 32
) {
  // If user uploaded a personal photo or passed an image URL
  if (avatarUrl && (avatarUrl.startsWith('data:image/') || avatarUrl.startsWith('http'))) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    );
  }

  const preset = AVATAR_PRESETS.find((p) => p.id === avatarUrl) || AVATAR_PRESETS[0];

  if (preset.type === 'icon' && preset.icon) {
    const IconComponent = preset.icon;
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: preset.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <IconComponent size={Math.round(size * 0.44)} />
      </div>
    );
  }

  // Monogram Initial
  const initial = (name || 'U').charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: preset.bg || 'linear-gradient(135deg, #E50914, #831010)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 800,
        fontSize: `${fontSize}px`,
        textTransform: 'uppercase',
        letterSpacing: '-0.5px',
      }}
    >
      {initial}
    </div>
  );
}

export function ProfileClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated, updateUser, updatePassword, loginDemo } = useAuth();
  const { count: watchlistCount } = useWatchlist();

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'wallet' | 'vip' | 'history'>('info');

  // Profile data state
  const currentUserId = user?.id || 'user-demo-1';
  const [profile, setProfile] = useState<UserProfileData>(() =>
    profileService.getProfile(currentUserId, user?.name, user?.email)
  );

  // Form states - Info
  const [displayName, setDisplayName] = useState(user?.name || profile.displayName || 'user 1');
  const [phone, setPhone] = useState(profile.phone || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarUrl || 'mono-ruby');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(profile.favoriteGenres || ['Hành động']);
  const [infoToast, setInfoToast] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form states - Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passToast, setPassToast] = useState<string | null>(null);

  // Form states - Top up
  const [paymentConfig, setPaymentConfig] = useState<PaymentSettings>(paymentService.getSettings());
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'vietqr' | 'momo' | 'zalopay' | 'card'>('vietqr');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrCountdown, setQrCountdown] = useState<number>(900); // 15 mins in sec
  const [walletToast, setWalletToast] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Keep profile & payment config in sync safely
  useEffect(() => {
    const unsubscribeProfile = profileService.subscribe(() => {
      const refreshed = profileService.getProfile(currentUserId, user?.name, user?.email);
      setProfile(refreshed);
    });

    const unsubscribePayment = paymentService.subscribe(() => {
      setPaymentConfig(paymentService.getSettings());
    });

    let cancelled = false;
    const authenticatedUserId = user?.id;
    if (authenticatedUserId) {
      void supabaseProfileService
        .getMyProfile(authenticatedUserId)
        .then((remoteProfile) => {
          if (cancelled || !remoteProfile) return;

          const synced = profileService.updateProfile(authenticatedUserId, {
            displayName: remoteProfile.displayName,
            avatarUrl: remoteProfile.avatarUrl,
            phone: remoteProfile.phone,
            bio: remoteProfile.bio,
            favoriteGenres: remoteProfile.favoriteGenres,
            isVip: remoteProfile.role === 'vip' || remoteProfile.role === 'admin',
          });
          setProfile(synced);
          setDisplayName(remoteProfile.displayName);
          setPhone(remoteProfile.phone || '');
          setBio(remoteProfile.bio || '');
          setSelectedAvatar(remoteProfile.avatarUrl || 'mono-ruby');
          setSelectedGenres(remoteProfile.favoriteGenres || []);
          updateUser({
            name: remoteProfile.displayName,
            avatarUrl: remoteProfile.avatarUrl,
            isAdmin: remoteProfile.role === 'admin' && remoteProfile.status === 'active',
          });
          setInfoError(null);
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setInfoError(
              error instanceof Error ? error.message : 'Không thể đồng bộ hồ sơ từ Supabase.',
            );
          }
        });
    }

    return () => {
      cancelled = true;
      unsubscribeProfile();
      unsubscribePayment();
    };
  }, [currentUserId, user?.id, user?.name, user?.email, updateUser]);

  // QR Countdown timer
  useEffect(() => {
    if (!showQrModal) return;
    const interval = setInterval(() => {
      setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showQrModal]);

  // Handle Photo Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Dung lượng ảnh tối đa là 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setSelectedAvatar(dataUrl);
          profileService.updateProfile(currentUserId, { avatarUrl: dataUrl });
          updateUser({ avatarUrl: dataUrl });
          setInfoToast('Đã chọn ảnh đại diện. Hãy bấm Lưu thay đổi hồ sơ để đồng bộ.');
          setTimeout(() => setInfoToast(null), 3500);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAvatar = () => {
    setSelectedAvatar('mono-ruby');
    profileService.updateProfile(currentUserId, { avatarUrl: 'mono-ruby' });
    updateUser({ avatarUrl: 'mono-ruby' });
    setInfoToast('Đã chọn Avatar hệ thống. Hãy bấm Lưu thay đổi hồ sơ để đồng bộ.');
    setTimeout(() => setInfoToast(null), 3000);
  };

  // Handle Save Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError(null);
    if (!displayName.trim()) {
      alert('Tên hiển thị không được để trống.');
      return;
    }

    const updates = {
      displayName: displayName.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      avatarUrl: selectedAvatar,
      favoriteGenres: selectedGenres,
    };

    setIsSavingProfile(true);
    try {
      await supabaseProfileService.updateMyProfile(currentUserId, updates);
    } catch (error) {
      setInfoError(error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.');
      setIsSavingProfile(false);
      return;
    }

    const updated = profileService.updateProfile(currentUserId, updates);
    setProfile(updated);

    updateUser({ name: displayName.trim(), avatarUrl: selectedAvatar });
    setIsSavingProfile(false);

    setInfoToast('Thông tin hồ sơ đã được cập nhật thành công!');
    setTimeout(() => setInfoToast(null), 3500);
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    const res = await updatePassword(newPassword);
    if (!res.success) {
      setPassError(res.error || 'Đổi mật khẩu thất bại.');
      return;
    }

    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassToast('Đổi mật khẩu thành công! Tài khoản đã được bảo vệ.');
    setTimeout(() => setPassToast(null), 4000);
  };

  // Copy helper
  const handleCopyText = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopyFeedback(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Handle Top-up Modal
  const finalTopUpAmount = customAmount ? parseInt(customAmount, 10) || selectedAmount : selectedAmount;

  const handleOpenPayment = () => {
    if (finalTopUpAmount < 10000) {
      alert('Số tiền nạp tối thiểu là 10.000 ₫');
      return;
    }
    setQrCountdown(900);
    setShowQrModal(true);
  };

  const handleConfirmTopUp = () => {
    const methodNames: Record<string, string> = {
      vietqr: 'VietQR (Ngân hàng)',
      momo: 'Ví MoMo',
      zalopay: 'Ví ZaloPay',
      card: 'Thẻ Quốc tế / Napas',
    };
    profileService.topUp(currentUserId, finalTopUpAmount, methodNames[selectedPaymentMethod]);
    setShowQrModal(false);
    setWalletToast(`Nạp thành công ${finalTopUpAmount.toLocaleString('vi-VN')} ₫ vào Ví CineVerse!`);
    setTimeout(() => setWalletToast(null), 4000);
  };

  // Handle VIP Upgrade
  const handleUpgradeVip = (plan: 'vip_month' | 'vip_year') => {
    const res = profileService.upgradeVip(currentUserId, plan);
    if (!res.success) {
      alert(res.error);
      setActiveTab('wallet');
      return;
    }
    setWalletToast(
      plan === 'vip_month'
        ? 'Chúc mừng bạn đã gia hạn thành công CINEVERSE VIP 1 Tháng!'
        : 'Chúc mừng bạn đã sở hữu gói CINEVERSE VIP 1 Năm (Tiết kiệm 30%)!'
    );
    setTimeout(() => setWalletToast(null), 4500);
  };

  // Calculate password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Chưa nhập', color: '#6B7280' };
    if (pass.length < 6) return { score: 1, text: 'Yếu', color: '#EF4444' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (pass.length >= 8 && hasNum && hasSpecial) {
      return { score: 3, text: 'Rất mạnh (Tối ưu)', color: '#10B981' };
    }
    if (pass.length >= 6 && (hasNum || hasSpecial)) {
      return { score: 2, text: 'Trung bình', color: '#F59E0B' };
    }
    return { score: 1, text: 'Yếu', color: '#EF4444' };
  };
  const passStrength = getPasswordStrength(newPassword);

  const isCustomPhoto = selectedAvatar && (selectedAvatar.startsWith('data:image/') || selectedAvatar.startsWith('http'));

  // If user is not logged in:
  if (!isAuthenticated && !user) {
    return (
      <div
        style={{
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 60px 24px',
          background: 'var(--bg-primary, #08090C)',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            background: 'var(--bg-secondary, #12141A)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '16px',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(229, 9, 20, 0.1)',
              border: '1px solid rgba(229, 9, 20, 0.3)',
              color: 'var(--accent-crimson, #E50914)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}
          >
            <UserIcon size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
            Hồ sơ cá nhân & Ví CINEVERSE
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #8E8F99)', marginBottom: '28px', lineHeight: 1.6 }}>
            Vui lòng đăng nhập để quản lý tài khoản cá nhân, bảo mật mật khẩu, nạp tiền vào ví và kích hoạt gói VIP xem phim 4K.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/login?redirect=/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #E50914, #B81D24)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Đăng nhập ngay <ArrowRight size={16} />
            </Link>

            <button
              onClick={() => loginDemo()}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Trải nghiệm tài khoản Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #08090C)',
        color: 'var(--text-primary, #fff)',
        paddingBottom: '80px',
      }}
    >
      {/* Hidden file upload input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Hero Banner Header - Fixed top spacing so it sits below fixed header */}
      <section
        style={{
          position: 'relative',
          paddingTop: 'clamp(96px, 10vw, 120px)',
          paddingBottom: '36px',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
          background: 'linear-gradient(180deg, rgba(229, 9, 20, 0.14) 0%, rgba(8, 9, 12, 1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          {/* User Info Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div
              style={{
                position: 'relative',
                width: '86px',
                height: '86px',
                borderRadius: '50%',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(229, 9, 20, 0.25)',
                border: '3px solid rgba(255, 255, 255, 0.15)',
                flexShrink: 0,
              }}
            >
              {renderAvatarBadge(selectedAvatar || profile?.avatarUrl, profile?.displayName || user?.name || 'U', 86, 32)}

              {/* Upload image button overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '-2px',
                  background: '#1F2937',
                  border: '2px solid #08090C',
                  color: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  transition: 'background 0.2s',
                }}
                title="Tải ảnh đại diện từ thiết bị"
              >
                <Camera size={14} />
              </button>

              {profile?.isVip && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    background: '#F59E0B',
                    color: '#000',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #08090C',
                  }}
                  title="Thành viên VIP"
                >
                  <Crown size={14} />
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, margin: 0 }}>
                  {profile?.displayName || user?.name}
                </h1>
                {profile?.isVip ? (
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#08090C',
                      fontWeight: 800,
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    <Crown size={12} /> CINEVERSE VIP
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary, #8E8F99)',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                    }}
                  >
                    THÀNH VIÊN THƯỜNG
                  </span>
                )}
              </div>

              <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary, #8E8F99)', fontSize: '13px' }}>
                {user?.email || profile?.email} • Thành viên từ{' '}
                {user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'}
              </p>

              {profile?.isVip && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#FBBF24' }}>
                  <Sparkles size={13} />
                  <span>Quyền lợi: Xem 4K Ultra HD, Âm thanh vòm Dolby Atmos, Không quảng cáo</span>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Balance Card Right */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(23, 25, 32, 0.9), rgba(15, 16, 20, 0.95))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '16px',
              padding: '16px 22px',
              minWidth: '260px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #8E8F99)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={14} color="#F59E0B" /> Số dư Ví CineVerse
              </span>
              <span style={{ fontSize: '10px', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                SẴN SÀNG
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              {(profile?.balance ?? 150000).toLocaleString('vi-VN')} <span style={{ fontSize: '16px', color: '#F59E0B' }}>₫</span>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('wallet')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#08090C',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <Zap size={13} /> Nạp tiền ngay
              </button>
              <button
                onClick={() => setActiveTab('vip')}
                style={{
                  padding: '7px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Gói VIP
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '32px auto 0 auto', padding: '0 clamp(16px, 4vw, 48px)' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px',
            marginBottom: '32px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {[
            { key: 'info', label: 'Thông tin cá nhân', icon: UserIcon },
            { key: 'security', label: 'Đổi mật khẩu & Bảo mật', icon: Lock },
            { key: 'wallet', label: 'Nạp tiền vào ví', icon: Wallet },
            { key: 'vip', label: 'Gói VIP Hội viên', icon: Crown },
            { key: 'history', label: 'Lịch sử giao dịch', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(229, 9, 20, 0.4)' : '1px solid transparent',
                  background: isActive ? 'rgba(229, 9, 20, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#FF4D58' : 'var(--text-secondary, #8E8F99)',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Toasts */}
        {infoToast && (
          <div
            style={{
              marginBottom: '24px',
              padding: '12px 18px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{infoToast}</span>
          </div>
        )}

        {infoError && (
          <div
            role="alert"
            style={{
              marginBottom: '24px',
              padding: '12px 18px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
            }}
          >
            <AlertCircle size={18} />
            <span>{infoError}</span>
          </div>
        )}

        {passToast && (
          <div
            style={{
              marginBottom: '24px',
              padding: '12px 18px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{passToast}</span>
          </div>
        )}

        {walletToast && (
          <div
            style={{
              marginBottom: '24px',
              padding: '12px 18px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '10px',
              color: '#FBBF24',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
            }}
          >
            <Sparkles size={18} />
            <span>{walletToast}</span>
          </div>
        )}

        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {/* Left: Info Form */}
            <form
              onSubmit={handleSaveInfo}
              style={{
                background: 'rgba(23, 25, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: '#fff' }}>
                Chỉnh sửa thông tin cơ bản
              </h3>

              {/* Display Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
                  Tên hiển thị trên CineVerse
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} color="#8E8F99" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    placeholder="VD: Tuấn Hoàng, Hương Ly..."
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
                  <span>Địa chỉ Email</span>
                  <span style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Đã kích hoạt
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#8E8F99" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="email"
                    value={user?.email || profile?.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '14px',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
                  Số điện thoại liên hệ
                </label>
                <div style={{ position: 'relative' }}>
                  <Smartphone size={16} color="#8E8F99" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0988 xxx xxx"
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 38px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Bio */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
                  Giới thiệu bản thân (Bio)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Chia sẻ gu xem phim của bạn..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #E50914, #B81D24)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: isSavingProfile ? 'wait' : 'pointer',
                  opacity: isSavingProfile ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
                }}
              >
                {isSavingProfile ? 'Đang đồng bộ...' : 'Lưu thay đổi hồ sơ'}
              </button>
            </form>

            {/* Right: Avatar System (Photo Upload + Cinema Presets) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Custom Photo Upload Card */}
              <div
                style={{
                  background: 'rgba(23, 25, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={18} color="#E50914" /> Ảnh đại diện cá nhân
                  </h4>
                  {isCustomPhoto && (
                    <span style={{ fontSize: '11px', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      Đang dùng ảnh tự chọn
                    </span>
                  )}
                </div>

                {isCustomPhoto ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <img
                      src={selectedAvatar}
                      alt="Avatar Preview"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #E50914',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                        Ảnh cá nhân của bạn
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Đổi ảnh khác
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveCustomAvatar}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '6px',
                            color: '#EF4444',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={13} /> Xóa ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '24px 16px',
                      borderRadius: '12px',
                      border: '2px dashed rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(229, 9, 20, 0.5)';
                      e.currentTarget.style.background = 'rgba(229, 9, 20, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(229, 9, 20, 0.15)',
                        color: '#E50914',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px auto',
                      }}
                    >
                      <Upload size={20} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                      Tải ảnh từ máy tính hoặc điện thoại
                    </div>
                    <div style={{ fontSize: '12px', color: '#8E8F99' }}>
                      Hỗ trợ JPG, PNG, WEBP (Tự động căn chỉnh & tối ưu tỷ lệ tròn)
                    </div>
                  </div>
                )}
              </div>

              {/* Authentic Cinema Presets (Zero AI feel) */}
              <div
                style={{
                  background: 'rgba(23, 25, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff' }}>
                    Hoặc chọn Avatar Điện Ảnh chuẩn
                  </h4>
                  <span style={{ fontSize: '11px', color: '#8E8F99' }}>
                    Biểu tượng & Chữ cái cao cấp
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {AVATAR_PRESETS.map((item) => {
                    const isSelected = selectedAvatar === item.id;
                    const initial = (displayName || user?.name || 'U').charAt(0).toUpperCase();
                    const IconComp = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(item.id);
                          profileService.updateProfile(currentUserId, { avatarUrl: item.id });
                          updateUser({ avatarUrl: item.id });
                        }}
                        style={{
                          background: item.bg,
                          border: isSelected ? '3px solid #F59E0B' : '1.5px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          aspectRatio: '1',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.5)' : 'none',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                          padding: '4px',
                          position: 'relative',
                        }}
                        title={item.label}
                      >
                        {item.type === 'monogram' ? (
                          <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                            {initial}
                          </span>
                        ) : IconComp ? (
                          <IconComp size={20} color="#fff" />
                        ) : null}
                        <span
                          style={{
                            fontSize: '9px',
                            color: 'rgba(255, 255, 255, 0.85)',
                            fontWeight: 600,
                            marginTop: '3px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            width: '100%',
                          }}
                        >
                          {item.label}
                        </span>
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '3px',
                              right: '3px',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: '#F59E0B',
                              color: '#08090C',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorite Genres */}
              <div
                style={{
                  background: 'rgba(23, 25, 32, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                }}
              >
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#fff' }}>
                  Thể loại phim yêu thích
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {GENRE_OPTIONS.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGenres(selectedGenres.filter((g) => g !== genre));
                          } else {
                            setSelectedGenres([...selectedGenres, genre]);
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid #E50914' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: isSelected ? '#FF4D58' : '#8E8F99',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {genre} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ĐỔI MẬT KHẨU & BẢO MẬT */}
        {activeTab === 'security' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <form
              onSubmit={handleChangePassword}
              style={{
                background: 'rgba(23, 25, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Shield size={22} color="#E50914" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Thay đổi mật khẩu đăng nhập
                </h3>
              </div>

              {passError && (
                <div
                  style={{
                    marginBottom: '18px',
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    color: '#EF4444',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{passError}</span>
                </div>
              )}

              {/* Current Password */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
                  Mật khẩu hiện tại
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#8E8F99" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 38px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#8E8F99',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
                  Mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#8E8F99" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 38px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#8E8F99',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '4px' }}>
                      <div style={{ flex: 1, borderRadius: '2px', background: passStrength.score >= 1 ? passStrength.color : 'rgba(255, 255, 255, 0.1)' }} />
                      <div style={{ flex: 1, borderRadius: '2px', background: passStrength.score >= 2 ? passStrength.color : 'rgba(255, 255, 255, 0.1)' }} />
                      <div style={{ flex: 1, borderRadius: '2px', background: passStrength.score >= 3 ? passStrength.color : 'rgba(255, 255, 255, 0.1)' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: passStrength.color }}>
                      Độ mạnh: {passStrength.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
                  Xác nhận lại mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#8E8F99" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 38px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#8E8F99',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #E50914, #B81D24)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
                }}
              >
                Cập nhật mật khẩu mới
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: NẠP TIỀN VÀO VÍ */}
        {activeTab === 'wallet' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            {/* Left: Top up options */}
            <div
              style={{
                background: 'rgba(23, 25, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '28px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px 0', color: '#fff' }}>
                Chọn mệnh giá nạp
              </h3>

              {/* Amount buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {paymentConfig.presetPackages.map((item) => {
                  const isSelected = selectedAmount === item.amount && !customAmount;
                  return (
                    <button
                      key={item.id || item.amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(item.amount);
                        setCustomAmount('');
                      }}
                      style={{
                        padding: '14px 10px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '2px solid #F59E0B' : item.isPopular ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        position: 'relative',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 700, color: isSelected ? '#FBBF24' : '#fff' }}>
                        {item.amount.toLocaleString('vi-VN')} ₫
                      </div>
                      {item.badge && (
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: item.badge.includes('Bonus') || item.badge.includes('+') ? '#10B981' : '#F59E0B',
                            marginTop: '4px',
                          }}
                        >
                          {item.badge}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#8E8F99', marginBottom: '8px' }}>
                  Hoặc nhập số tiền khác (VNĐ)
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="VD: 150000"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px 0', color: '#fff' }}>
                Phương thức thanh toán
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {[
                  {
                    key: 'vietqr',
                    title: 'Chuyển khoản VietQR',
                    desc: paymentConfig.bank.note || 'Quét mã QR tự động nhận tiền trong 30s qua App Ngân hàng (MB, VCB, Techcombank...)',
                    badge: 'Khuyên dùng',
                    enabled: paymentConfig.methods.vietqr,
                  },
                  {
                    key: 'momo',
                    title: 'Ví điện tử MoMo',
                    desc: paymentConfig.momo.note || 'Thanh toán trực tiếp bằng ứng dụng MoMo',
                    badge: 'Tiện lợi',
                    enabled: paymentConfig.methods.momo,
                  },
                  {
                    key: 'zalopay',
                    title: 'Ví điện tử ZaloPay',
                    desc: paymentConfig.zalopay.note || 'Quét mã qua Zalo hoặc ZaloPay',
                    badge: '',
                    enabled: paymentConfig.methods.zalopay,
                  },
                  {
                    key: 'card',
                    title: paymentConfig.card.gatewayName || 'Thẻ ATM / Visa / Mastercard',
                    desc: paymentConfig.card.note || 'Cổng thanh toán bảo mật Napas / OnePay',
                    badge: '',
                    enabled: paymentConfig.methods.card,
                  },
                ]
                  .filter((m) => m.enabled)
                  .map((m) => {
                    const isChecked = selectedPaymentMethod === m.key;
                    return (
                      <div
                        key={m.key}
                        onClick={() => setSelectedPaymentMethod(m.key as typeof selectedPaymentMethod)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: isChecked ? 'rgba(229, 9, 20, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          border: isChecked ? '1px solid #E50914' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: isChecked ? '#fff' : '#D1D5DB' }}>
                              {m.title}
                            </span>
                            {m.badge && (
                              <span style={{ fontSize: '10px', background: '#E50914', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#8E8F99' }}>{m.desc}</p>
                        </div>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isChecked ? '5px solid #E50914' : '2px solid rgba(255, 255, 255, 0.2)',
                            background: isChecked ? '#fff' : 'transparent',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={handleOpenPayment}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#08090C',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                }}
              >
                <Zap size={18} />
                Tiến hành nạp {finalTopUpAmount.toLocaleString('vi-VN')} ₫
              </button>
            </div>

            {/* Right: Digital Member Card Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '1.586',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #181920 0%, #0D0E12 100%)',
                  padding: '24px',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                }}
              >
                {/* Background holographic glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #E50914, #B81D24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Film size={16} color="#fff" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.08em', color: '#fff' }}>
                      CINEVERSE VIP
                    </span>
                  </div>
                  <Crown size={22} color="#F59E0B" />
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '2px', marginBottom: '4px' }}>
                    SỐ DƯ HIỆN TẠI
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#FBBF24', letterSpacing: '0.5px' }}>
                    {(profile?.balance ?? 150000).toLocaleString('vi-VN')} ₫
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '1px' }}>CHỦ TÀI KHOẢN</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                      {(profile?.displayName || user?.name || 'USER').toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '1px' }}>HẠNG THÀNH VIÊN</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>VIP UNLIMITED</div>
                  </div>
                </div>
              </div>

              {/* Safety notice */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '12px',
                  color: '#8E8F99',
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>
                  <Shield size={14} color="#10B981" /> Thanh toán an toàn 100%
                </div>
                Mọi giao dịch nạp tiền đều được bảo mật qua mã QR động tiêu chuẩn VietQR của Napas. Tiền sẽ được cộng tức thì vào tài khoản của bạn để xem phim không giới hạn.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GÓI VIP HỘI VIÊN */}
        {activeTab === 'vip' && (
          <div>
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 36px auto' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  color: '#F59E0B',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '12px',
                }}
              >
                <Crown size={14} /> ĐẶC QUYỀN ĐIỆN ẢNH KHÔNG GIỚI HẠN
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '0 0 10px 0' }}>
                Nâng Tầm Trải Nghiệm Xem Phim
              </h2>
              <p style={{ fontSize: '14px', color: '#8E8F99', margin: 0 }}>
                Thưởng thức trọn vẹn kho phim chiếu rạp đỉnh cao, độ phân giải 4K Ultra HD cùng âm thanh chuẩn rạp.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '840px', margin: '0 auto' }}>
              {/* Plan 1: VIP Tháng */}
              <div
                style={{
                  background: 'rgba(23, 25, 32, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#8E8F99', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    GÓI TIÊU CHUẨN
                  </span>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 12px 0', color: '#fff' }}>
                    VIP 1 Tháng
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>59.000</span>
                    <span style={{ fontSize: '15px', color: '#F59E0B', fontWeight: 700 }}>₫ / tháng</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#D1D5DB' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="#10B981" /> Mở khóa toàn bộ phim VIP & Chiếu rạp
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="#10B981" /> Độ phân giải 4K Ultra HD & HDR10
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="#10B981" /> Không quảng cáo làm phiền
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="#10B981" /> Âm thanh vòm Dolby Atmos
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradeVip('vip_month')}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Đăng ký / Gia hạn (59.000 ₫)
                </button>
              </div>

              {/* Plan 2: VIP Năm (Best Value) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 25, 20, 0.95), rgba(18, 16, 22, 0.95))',
                  border: '2px solid #F59E0B',
                  borderRadius: '18px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 40px rgba(245, 158, 11, 0.2)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '24px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#08090C',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  TIẾT KIỆM 30%
                </div>

                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    GÓI KHUYÊN DÙNG
                  </span>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 12px 0', color: '#fff' }}>
                    VIP 1 Năm (12 Tháng)
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#FBBF24' }}>590.000</span>
                    <span style={{ fontSize: '15px', color: '#8E8F99', fontWeight: 600 }}>₫ / năm</span>
                    <span style={{ fontSize: '12px', color: '#6B7280', textDecoration: 'line-through', marginLeft: '6px' }}>708.000 ₫</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#D1D5DB' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="#F59E0B" /> Toàn bộ đặc quyền gói Tháng trọn 365 ngày
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="#F59E0B" /> Tiết kiệm 2 tháng xem phim miễn phí
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="#F59E0B" /> Xem trước các tập phim bom tấn mới nhất
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Check size={16} color="#F59E0B" /> Huy hiệu VIP vàng sáng danh giá bên cạnh tên
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgradeVip('vip_year')}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#08090C',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  Nâng cấp VIP 1 Năm (590.000 ₫)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LỊCH SỬ GIAO DỊCH */}
        {activeTab === 'history' && (
          <div
            style={{
              background: 'rgba(23, 25, 32, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 18px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="#E50914" /> Lịch sử biến động số dư & Giao dịch
            </h3>

            {(!profile?.transactions || profile.transactions.length === 0) ? (
              <p style={{ color: '#8E8F99', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                Chưa có giao dịch nào được ghi nhận.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(profile.transactions || []).map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      style={{
                        padding: '14px 18px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(229, 9, 20, 0.15)',
                            color: isPositive ? '#10B981' : '#E50914',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isPositive ? <Zap size={18} /> : <Crown size={18} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                            {tx.description}
                          </div>
                          <div style={{ fontSize: '12px', color: '#8E8F99', marginTop: '2px' }}>
                            {new Date(tx.createdAt).toLocaleString('vi-VN')} {tx.method && `• ${tx.method}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: 800,
                            color: isPositive ? '#10B981' : '#E50914',
                          }}
                        >
                          {isPositive ? '+' : ''}
                          {tx.amount.toLocaleString('vi-VN')} ₫
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#10B981',
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          Hoàn tất
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* VietQR Payment Modal */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#12141A',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            {/* Dynamic Modal Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background:
                  selectedPaymentMethod === 'momo'
                    ? 'rgba(236, 72, 153, 0.15)'
                    : selectedPaymentMethod === 'zalopay'
                    ? 'rgba(59, 130, 246, 0.15)'
                    : selectedPaymentMethod === 'card'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                color:
                  selectedPaymentMethod === 'momo'
                    ? '#EC4899'
                    : selectedPaymentMethod === 'zalopay'
                    ? '#3B82F6'
                    : selectedPaymentMethod === 'card'
                    ? '#10B981'
                    : '#F59E0B',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '10px',
              }}
            >
              {selectedPaymentMethod === 'momo' ? (
                <>
                  <Smartphone size={13} /> VÍ ĐIỆN TỬ MOMO
                </>
              ) : selectedPaymentMethod === 'zalopay' ? (
                <>
                  <Wallet size={13} /> VÍ ĐIỆN TỬ ZALOPAY
                </>
              ) : selectedPaymentMethod === 'card' ? (
                <>
                  <CreditCard size={13} /> {paymentConfig.card.gatewayName.toUpperCase()}
                </>
              ) : (
                <>
                  <QrCode size={13} /> VIETQR CHUYỂN KHOẢN TỰ ĐỘNG
                </>
              )}
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              {selectedPaymentMethod === 'card' ? 'Xác Nhận Nạp Tiền Qua Thẻ' : 'Quét Mã Để Nạp Tiền'}
            </h3>
            <p style={{ fontSize: '13px', color: '#8E8F99', margin: '0 0 16px 0' }}>
              {selectedPaymentMethod === 'momo'
                ? 'Mở ứng dụng MoMo quét mã hoặc chuyển đến số ví bên dưới'
                : selectedPaymentMethod === 'zalopay'
                ? 'Mở ứng dụng Zalo / ZaloPay quét mã hoặc chuyển đến số ví'
                : selectedPaymentMethod === 'card'
                ? 'Thanh toán bảo mật chuẩn 3D-Secure qua cổng thẻ nội địa & quốc tế'
                : 'Mở ứng dụng Ngân hàng (MB, VCB, Techcombank...) quét mã QR'}
            </p>

            {copyFeedback && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10B981',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '12px',
                }}
              >
                ✓ {copyFeedback}
              </div>
            )}

            {/* QR Code Container (for QR methods) */}
            {selectedPaymentMethod !== 'card' && (
              <div
                style={{
                  background: '#fff',
                  padding: '12px',
                  borderRadius: '16px',
                  width: '210px',
                  height: '210px',
                  margin: '0 auto 16px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                  overflow: 'hidden',
                }}
              >
                {selectedPaymentMethod === 'momo' && paymentConfig.momo.customQrUrl ? (
                  <img
                    src={paymentConfig.momo.customQrUrl}
                    alt="MoMo QR"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : selectedPaymentMethod === 'zalopay' && paymentConfig.zalopay.customQrUrl ? (
                  <img
                    src={paymentConfig.zalopay.customQrUrl}
                    alt="ZaloPay QR"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={
                      paymentConfig.bank.customQrUrl ||
                      paymentService.getVietQrUrl({
                        bankId: paymentConfig.bank.bankId,
                        accountNumber: paymentConfig.bank.accountNumber,
                        amount: finalTopUpAmount,
                        memo: `${paymentConfig.bank.memoPrefix} ${currentUserId.toUpperCase()}`,
                        accountHolder: paymentConfig.bank.accountHolder,
                      })
                    }
                    alt="Payment QR"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </div>
            )}

            {/* Transfer details based on method */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '10px',
                padding: '12px 14px',
                textAlign: 'left',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#8E8F99' }}>Số tiền nạp:</span>
                <span style={{ fontWeight: 800, color: '#FBBF24', fontSize: '15px' }}>
                  {finalTopUpAmount.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              {selectedPaymentMethod === 'vietqr' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Ngân hàng:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{paymentConfig.bank.bankName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Số tài khoản:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
                        {paymentConfig.bank.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(paymentConfig.bank.accountNumber.replace(/\s+/g, ''), 'Số tài khoản')}
                        style={{ background: 'transparent', border: 'none', color: '#F59E0B', cursor: 'pointer', padding: '2px' }}
                        title="Sao chép STK"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Chủ tài khoản:</span>
                    <span style={{ fontWeight: 700, color: '#F59E0B' }}>{paymentConfig.bank.accountHolder}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Nội dung CK:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>
                        {paymentConfig.bank.memoPrefix} {currentUserId.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`${paymentConfig.bank.memoPrefix} ${currentUserId.toUpperCase()}`, 'Nội dung chuyển khoản')}
                        style={{ background: 'transparent', border: 'none', color: '#10B981', cursor: 'pointer', padding: '2px' }}
                        title="Sao chép nội dung"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedPaymentMethod === 'momo' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Ví nhận tiền:</span>
                    <span style={{ fontWeight: 600, color: '#EC4899' }}>MoMo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Số điện thoại ví:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{paymentConfig.momo.phone}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(paymentConfig.momo.phone.replace(/\s+/g, ''), 'Số điện thoại MoMo')}
                        style={{ background: 'transparent', border: 'none', color: '#EC4899', cursor: 'pointer', padding: '2px' }}
                        title="Sao chép số MoMo"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Tên người nhận:</span>
                    <span style={{ fontWeight: 700, color: '#F59E0B' }}>{paymentConfig.momo.accountHolder}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Lời nhắn MoMo:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>
                        {paymentConfig.bank.memoPrefix} {currentUserId.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`${paymentConfig.bank.memoPrefix} ${currentUserId.toUpperCase()}`, 'Lời nhắn')}
                        style={{ background: 'transparent', border: 'none', color: '#10B981', cursor: 'pointer', padding: '2px' }}
                        title="Sao chép lời nhắn"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedPaymentMethod === 'zalopay' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Ví nhận tiền:</span>
                    <span style={{ fontWeight: 600, color: '#3B82F6' }}>ZaloPay</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Số điện thoại ví:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{paymentConfig.zalopay.phone}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(paymentConfig.zalopay.phone.replace(/\s+/g, ''), 'Số điện thoại ZaloPay')}
                        style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: '2px' }}
                        title="Sao chép số ZaloPay"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Tên người nhận:</span>
                    <span style={{ fontWeight: 700, color: '#F59E0B' }}>{paymentConfig.zalopay.accountHolder}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8E8F99' }}>Lời nhắn:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>
                        {paymentConfig.bank.memoPrefix} {currentUserId.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(`${paymentConfig.bank.memoPrefix} ${currentUserId.toUpperCase()}`, 'Lời nhắn')}
                        style={{ background: 'transparent', border: 'none', color: '#10B981', cursor: 'pointer', padding: '2px' }}
                        title="Sao chép lời nhắn"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {selectedPaymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8E8F99' }}>Cổng thanh toán:</span>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>{paymentConfig.card.gatewayName}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', lineHeight: 1.5 }}>
                    {paymentConfig.card.instructions}
                  </p>
                </div>
              )}
            </div>

            <div style={{ fontSize: '11px', color: '#8E8F99', marginBottom: '14px' }}>
              Mã giao dịch tự động hết hạn sau: <strong style={{ color: '#F59E0B' }}>{Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')}</strong>
            </div>

            <button
              onClick={handleConfirmTopUp}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={16} /> Tôi đã chuyển tiền thành công (Xác nhận)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
