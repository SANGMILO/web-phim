'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  QrCode,
  Building2,
  Smartphone,
  Wallet,
  CheckCircle2,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  Plus,
  Coins,
  DollarSign,
  Clock,
  Eye,
  Check,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useToast } from '@/components/admin/AdminToast';
import {
  paymentService,
  SUPPORTED_BANKS,
  DEFAULT_PAYMENT_SETTINGS,
} from '@/lib/payments/payment-service';
import { profileService } from '@/lib/profile/profile-service';
import type {
  PaymentSettings,
  BankConfig,
  EWalletConfig,
  CardGatewayConfig,
  PresetPackage,
  AdminTransactionItem,
} from '@/types/payment';

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'vietqr' | 'ewallets' | 'methods' | 'presets' | 'transactions'>('vietqr');
  const [transactions, setTransactions] = useState<AdminTransactionItem[]>([]);
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'topup' | 'vip'>('all');

  // Manual adjustment modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('100000');
  const [creditMemo, setCreditMemo] = useState('Admin cộng tiền thưởng');

  // File input refs for uploading custom QR codes
  const bankQrInputRef = useRef<HTMLInputElement>(null);
  const momoQrInputRef = useRef<HTMLInputElement>(null);
  const zaloQrInputRef = useRef<HTMLInputElement>(null);

  // Load settings & transactions
  useEffect(() => {
    const unsub = paymentService.subscribe(() => {
      setSettings(paymentService.getSettings());
      setTransactions(paymentService.getAllTransactions());
    });
    const timer = window.setTimeout(() => {
      setSettings(paymentService.getSettings());
      setTransactions(paymentService.getAllTransactions());
    }, 0);
    return () => {
      window.clearTimeout(timer);
      unsub();
    };
  }, []);

  // Save changes
  const handleSaveSettings = () => {
    paymentService.updateSettings(settings);
    showToast('Đã lưu cấu hình thanh toán thành công!', 'success');
  };

  // Reset to default
  const handleResetSettings = () => {
    if (confirm('Bạn có chắc muốn khôi phục toàn bộ cài đặt thanh toán về mặc định?')) {
      const reset = paymentService.resetSettings();
      setSettings(reset);
      showToast('Đã khôi phục cài đặt thanh toán mặc định', 'info');
    }
  };

  // QR image upload helper (auto scales via canvas)
  const processQrImageUpload = (
    file: File,
    onSuccess: (dataUrl: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        // Draw centered
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        onSuccess(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Bank QR Upload
  const handleBankQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processQrImageUpload(file, (dataUrl) => {
      setSettings((prev) => ({
        ...prev,
        bank: { ...prev.bank, customQrUrl: dataUrl },
      }));
      showToast('Đã tải lên mã QR ngân hàng riêng thành công!', 'success');
    });
  };

  // MoMo QR Upload
  const handleMomoQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processQrImageUpload(file, (dataUrl) => {
      setSettings((prev) => ({
        ...prev,
        momo: { ...prev.momo, customQrUrl: dataUrl },
      }));
      showToast('Đã tải lên mã QR MoMo riêng thành công!', 'success');
    });
  };

  // ZaloPay QR Upload
  const handleZaloQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processQrImageUpload(file, (dataUrl) => {
      setSettings((prev) => ({
        ...prev,
        zalopay: { ...prev.zalopay, customQrUrl: dataUrl },
      }));
      showToast('Đã tải lên mã QR ZaloPay riêng thành công!', 'success');
    });
  };

  // Manual balance credit
  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(creditAmount.replace(/\D/g, ''), 10);
    if (!creditUserId.trim()) {
      showToast('Vui lòng nhập User ID cần cộng tiền', 'warning');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Số tiền cộng phải lớn hơn 0 ₫', 'warning');
      return;
    }

    profileService.topUp(creditUserId.trim(), amountNum, creditMemo || 'Admin cấp số dư');
    setTransactions(paymentService.getAllTransactions());
    setShowCreditModal(false);
    showToast(`Đã cộng ${amountNum.toLocaleString('vi-VN')} ₫ cho tài khoản "${creditUserId}"`, 'success');
  };

  // Total calculated statistics
  const totalDepositAmount = transactions
    .filter((t) => t.type === 'topup' && t.status === 'success')
    .reduce((acc, cur) => acc + (cur.amount || 0), 0);

  const activeMethodsCount = Object.values(settings.methods).filter(Boolean).length;

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'topup' && tx.type !== 'topup') return false;
    if (txFilter === 'vip' && !tx.type.startsWith('vip')) return false;
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      const matchName = tx.userName.toLowerCase().includes(q);
      const matchEmail = tx.userEmail.toLowerCase().includes(q);
      const matchId = tx.id.toLowerCase().includes(q);
      const matchUid = tx.userId.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId && !matchUid) return false;
    }
    return true;
  });

  // Dynamic preview VietQR URL
  const previewVietQrUrl = settings.bank.customQrUrl || paymentService.getVietQrUrl({
    bankId: settings.bank.bankId,
    accountNumber: settings.bank.accountNumber,
    amount: 100000,
    memo: `${settings.bank.memoPrefix} USER1`,
    accountHolder: settings.bank.accountHolder,
  });

  return (
    <>
      <AdminHeader
        onToggleSidebar={() => {}}
        title="Cấu hình Thanh toán & Quản lý Nạp tiền"
        subtitle="Quản lý mã QR VietQR, MoMo, ZaloPay, các cổng thanh toán và lịch sử giao dịch nạp tiền"
      />

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Top Action Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(229, 9, 20, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#fff' }}>
                Cổng Thanh Toán & QR Code
              </h2>
              <p style={{ fontSize: '13px', color: '#8E8F99', margin: 0 }}>
                Cập nhật tức thời đồng bộ sang trang Profile của toàn bộ người dùng
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/profile"
              target="_blank"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#D1D5DB',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={15} /> Xem trang nạp Profile
            </Link>

            <button
              onClick={handleResetSettings}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9CA3AF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} /> Khôi phục mặc định
            </button>

            <button
              onClick={handleSaveSettings}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #E50914, #B81D24)',
                border: 'none',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(229, 9, 20, 0.4)',
              }}
            >
              <Save size={16} /> Lưu cấu hình
            </button>
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'rgba(23, 25, 32, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8E8F99', fontWeight: 600 }}>TỔNG TIỀN NẠP HỆ THỐNG</span>
              <Coins size={18} color="#10B981" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>
              {totalDepositAmount.toLocaleString('vi-VN')} ₫
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
              Từ {transactions.filter((t) => t.type === 'topup').length} lượt giao dịch nạp
            </div>
          </div>

          <div
            style={{
              background: 'rgba(23, 25, 32, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8E8F99', fontWeight: 600 }}>NGÂN HÀNG ĐANG NHẬN</span>
              <Building2 size={18} color="#F59E0B" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {settings.bank.bankName}
            </div>
            <div style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px', fontWeight: 600 }}>
              STK: {settings.bank.accountNumber}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(23, 25, 32, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#8E8F99', fontWeight: 600 }}>CỔNG THANH TOÁN BẬT</span>
              <CreditCard size={18} color="#3B82F6" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3B82F6' }}>
              {activeMethodsCount} / 4 Cổng
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
              {settings.methods.vietqr ? 'VietQR • ' : ''}
              {settings.methods.momo ? 'MoMo • ' : ''}
              {settings.methods.zalopay ? 'ZaloPay • ' : ''}
              {settings.methods.card ? 'Thẻ ATM' : ''}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(23, 25, 32, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#8E8F99', fontWeight: 600 }}>CỘNG TIỀN THỦ CÔNG</span>
                <DollarSign size={18} color="#EC4899" />
              </div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                Cấp số dư thưởng hoặc duyệt nạp nhanh
              </div>
            </div>
            <button
              onClick={() => setShowCreditModal(true)}
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#EC4899',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} /> Nạp số dư cho User
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '24px',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'vietqr', label: '1. Chuyển khoản & VietQR', icon: QrCode },
            { id: 'ewallets', label: '2. Ví MoMo & ZaloPay', icon: Smartphone },
            { id: 'methods', label: '3. Bật/Tắt Cổng & Thẻ ATM', icon: ShieldCheck },
            { id: 'presets', label: '4. Mệnh giá nạp (Gói VIP)', icon: Coins },
            { id: 'transactions', label: `5. Lịch sử giao dịch (${transactions.length})`, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#fff' : '#8E8F99',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  borderBottom: isActive ? '2px solid #E50914' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} color={isActive ? '#E50914' : '#8E8F99'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Ngân hàng & VietQR */}
        {activeTab === 'vietqr' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* Form edit bank */}
            <div
              style={{
                background: 'rgba(23, 25, 32, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 16px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="#F59E0B" /> Cài đặt Ngân hàng thụ hưởng & VietQR
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Chọn Ngân Hàng (Tự động liên kết chuẩn Napas / VietQR)
                  </label>
                  <select
                    value={settings.bank.bankId}
                    onChange={(e) => {
                      const selected = SUPPORTED_BANKS.find((b) => b.id === e.target.value);
                      setSettings((prev) => ({
                        ...prev,
                        bank: {
                          ...prev.bank,
                          bankId: e.target.value,
                          bankName: selected ? selected.name : prev.bank.bankName,
                        },
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    {SUPPORTED_BANKS.map((b) => (
                      <option key={b.id} value={b.id} style={{ background: '#12141A', color: '#fff' }}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Tên hiển thị ngân hàng
                  </label>
                  <input
                    type="text"
                    value={settings.bank.bankName}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, bankName: e.target.value },
                      }))
                    }
                    placeholder="VD: MB BANK (Quân Đội)"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Số Tài Khoản Ngân Hàng
                  </label>
                  <input
                    type="text"
                    value={settings.bank.accountNumber}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, accountNumber: e.target.value },
                      }))
                    }
                    placeholder="VD: 9988 2233 6688"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '1px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Tên Chủ Tài Khoản (Viết hoa không dấu)
                  </label>
                  <input
                    type="text"
                    value={settings.bank.accountHolder}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, accountHolder: e.target.value.toUpperCase() },
                      }))
                    }
                    placeholder="VD: CINEVERSE MEDIA"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Tiền tố nội dung chuyển khoản
                  </label>
                  <input
                    type="text"
                    value={settings.bank.memoPrefix}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bank: { ...prev.bank, memoPrefix: e.target.value },
                      }))
                    }
                    placeholder="VD: CV NAP"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                  <p style={{ fontSize: '11px', color: '#8E8F99', marginTop: '4px' }}>
                    Khi User nạp, nội dung CK sẽ là: <strong style={{ color: '#10B981' }}>{settings.bank.memoPrefix} [USER_ID]</strong>
                  </p>
                </div>

                {/* Custom QR image upload button */}
                <div style={{ paddingTop: '8px' }}>
                  <input
                    type="file"
                    ref={bankQrInputRef}
                    accept="image/*"
                    onChange={handleBankQrUpload}
                    style={{ display: 'none' }}
                  />
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '8px' }}>
                    Tùy chọn tải lên Ảnh Mã QR riêng (Thay thế mã QR tự động)
                  </label>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => bankQrInputRef.current?.click()}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px dashed #F59E0B',
                        borderRadius: '8px',
                        color: '#F59E0B',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Upload size={16} /> Tải ảnh QR Ngân Hàng (.png/.jpg)
                    </button>

                    {settings.bank.customQrUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setSettings((prev) => ({
                            ...prev,
                            bank: { ...prev.bank, customQrUrl: undefined },
                          }));
                          showToast('Đã chuyển về mã VietQR động chuẩn hệ thống', 'info');
                        }}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: '#EF4444',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title="Xóa ảnh riêng, dùng VietQR động"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    border: 'none',
                    borderRadius: '8px',
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
                  <Check size={16} /> Lưu cấu hình Ngân hàng & VietQR
                </button>
              </div>
            </div>

            {/* Live Preview Card */}
            <div
              style={{
                background: 'rgba(23, 25, 32, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                <Eye size={15} /> XEM TRƯỚC GIAO DIỆN MÃ QR MÀ USER SẼ THẤY
              </div>

              <div
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  background: '#12141A',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '16px',
                  padding: '22px',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>
                  <QrCode size={12} /> VIETQR CHUYỂN KHOẢN TỰ ĐỘNG
                </div>

                <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  Quét Mã Để Nạp Tiền
                </div>
                <div style={{ fontSize: '12px', color: '#8E8F99', marginBottom: '14px' }}>
                  Hỗ trợ app Mobile Banking của hơn 40 ngân hàng
                </div>

                {/* QR Code Container */}
                <div
                  style={{
                    background: '#fff',
                    padding: '12px',
                    borderRadius: '12px',
                    width: '210px',
                    height: '210px',
                    margin: '0 auto 16px auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={previewVietQrUrl}
                    alt="VietQR Code"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      // Fallback SVG if offline or image loading error
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Account details preview */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8E8F99' }}>Ngân hàng:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{settings.bank.bankName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8E8F99' }}>Số tài khoản:</span>
                    <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>{settings.bank.accountNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8E8F99' }}>Chủ tài khoản:</span>
                    <span style={{ fontWeight: 700, color: '#F59E0B' }}>{settings.bank.accountHolder}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8E8F99' }}>Nội dung CK:</span>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>{settings.bank.memoPrefix} USER1</span>
                  </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '11px', color: '#6B7280' }}>
                  {settings.bank.customQrUrl ? '✓ Đang hiển thị Mã QR riêng đã tải lên' : '✓ Đang tạo Mã VietQR động chuẩn Napas'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Ví MoMo & ZaloPay */}
        {activeTab === 'ewallets' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* MoMo Config */}
            <div
              style={{
                background: 'rgba(23, 25, 32, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#EC4899', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={20} /> Cấu hình Ví MoMo
                </h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#D1D5DB', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.methods.momo}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        methods: { ...prev.methods, momo: e.target.checked },
                      }))
                    }
                  />
                  Bật cổng MoMo
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Số điện thoại MoMo
                  </label>
                  <input
                    type="text"
                    value={settings.momo.phone}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        momo: { ...prev.momo, phone: e.target.value },
                      }))
                    }
                    placeholder="VD: 0988 123 456"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Tên chủ ví MoMo
                  </label>
                  <input
                    type="text"
                    value={settings.momo.accountHolder}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        momo: { ...prev.momo, accountHolder: e.target.value.toUpperCase() },
                      }))
                    }
                    placeholder="VD: CINEVERSE VIETNAM"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* MoMo QR file */}
                <input
                  type="file"
                  ref={momoQrInputRef}
                  accept="image/*"
                  onChange={handleMomoQrUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => momoQrInputRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(236, 72, 153, 0.1)',
                      border: '1px dashed #EC4899',
                      borderRadius: '8px',
                      color: '#EC4899',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Upload size={16} /> Tải mã QR Ví MoMo
                  </button>

                  {settings.momo.customQrUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          momo: { ...prev.momo, customQrUrl: undefined },
                        }))
                      }
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#EF4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {settings.momo.customQrUrl && (
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <img
                      src={settings.momo.customQrUrl}
                      alt="MoMo QR"
                      style={{ width: '120px', height: '120px', borderRadius: '8px', border: '2px solid #EC4899' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ZaloPay Config */}
            <div
              style={{
                background: 'rgba(23, 25, 32, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wallet size={20} /> Cấu hình Ví ZaloPay
                </h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#D1D5DB', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.methods.zalopay}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        methods: { ...prev.methods, zalopay: e.target.checked },
                      }))
                    }
                  />
                  Bật cổng ZaloPay
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Số điện thoại ZaloPay
                  </label>
                  <input
                    type="text"
                    value={settings.zalopay.phone}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        zalopay: { ...prev.zalopay, phone: e.target.value },
                      }))
                    }
                    placeholder="VD: 0988 123 456"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Tên chủ ví ZaloPay
                  </label>
                  <input
                    type="text"
                    value={settings.zalopay.accountHolder}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        zalopay: { ...prev.zalopay, accountHolder: e.target.value.toUpperCase() },
                      }))
                    }
                    placeholder="VD: CINEVERSE VIETNAM"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* ZaloPay QR file */}
                <input
                  type="file"
                  ref={zaloQrInputRef}
                  accept="image/*"
                  onChange={handleZaloQrUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => zaloQrInputRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px dashed #3B82F6',
                      borderRadius: '8px',
                      color: '#3B82F6',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Upload size={16} /> Tải mã QR Ví ZaloPay
                  </button>

                  {settings.zalopay.customQrUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          zalopay: { ...prev.zalopay, customQrUrl: undefined },
                        }))
                      }
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#EF4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {settings.zalopay.customQrUrl && (
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <img
                      src={settings.zalopay.customQrUrl}
                      alt="ZaloPay QR"
                      style={{ width: '120px', height: '120px', borderRadius: '8px', border: '2px solid #3B82F6' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Bật / Tắt Phương thức & Thẻ ATM */}
        {activeTab === 'methods' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: 'rgba(23, 25, 32, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 16px 0', color: '#fff' }}>
                Quản lý Bật / Tắt hiển thị các phương thức thanh toán
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {[
                  { key: 'vietqr', title: 'Chuyển khoản VietQR', desc: 'Quét QR tự động nhận tiền qua App Ngân hàng', color: '#10B981' },
                  { key: 'momo', title: 'Ví điện tử MoMo', desc: 'Thanh toán quét mã hoặc ứng dụng MoMo', color: '#EC4899' },
                  { key: 'zalopay', title: 'Ví điện tử ZaloPay', desc: 'Quét mã qua Zalo hoặc ZaloPay', color: '#3B82F6' },
                  { key: 'card', title: 'Thẻ ATM / Visa / Napas', desc: 'Cổng thanh toán thẻ nội địa và quốc tế', color: '#F59E0B' },
                ].map((item) => {
                  const isEnabled = settings.methods[item.key as keyof typeof settings.methods];
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          methods: {
                            ...prev.methods,
                            [item.key]: !isEnabled,
                          },
                        }))
                      }
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: isEnabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.3)',
                        border: isEnabled ? `1px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: isEnabled ? '#fff' : '#6B7280' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8E8F99', marginTop: '2px' }}>{item.desc}</div>
                      </div>
                      <div
                        style={{
                          width: '42px',
                          height: '24px',
                          borderRadius: '12px',
                          background: isEnabled ? item.color : '#374151',
                          position: 'relative',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: '3px',
                            left: isEnabled ? '21px' : '3px',
                            transition: 'all 0.2s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card Gateway Config */}
            <div
              style={{
                background: 'rgba(23, 25, 32, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 16px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#F59E0B" /> Cổng thanh toán Thẻ ATM / Visa / Napas
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Tên cổng thanh toán
                  </label>
                  <input
                    type="text"
                    value={settings.card.gatewayName}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        card: { ...prev.card, gatewayName: e.target.value },
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Ghi chú ngắn hiển thị cho User
                  </label>
                  <input
                    type="text"
                    value={settings.card.note}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        card: { ...prev.card, note: e.target.value },
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Hướng dẫn thanh toán chi tiết
                  </label>
                  <textarea
                    rows={2}
                    value={settings.card.instructions}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        card: { ...prev.card, instructions: e.target.value },
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Mệnh giá nạp (Presets) */}
        {activeTab === 'presets' && (
          <div
            style={{
              background: 'rgba(23, 25, 32, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Các Mệnh Giá Nạp Tiền Nhanh
                </h3>
                <p style={{ fontSize: '13px', color: '#8E8F99', margin: '4px 0 0 0' }}>
                  Các nút bấm chọn sẵn mệnh giá ở màn hình nạp tiền của người dùng
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newPkg: PresetPackage = {
                    id: `p-${Date.now()}`,
                    amount: 300000,
                    badge: '+15% Khuyến mãi',
                  };
                  setSettings((prev) => ({
                    ...prev,
                    presetPackages: [...prev.presetPackages, newPkg],
                  }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  color: '#F59E0B',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={15} /> Thêm mệnh giá
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {settings.presetPackages.map((pkg, idx) => (
                <div
                  key={pkg.id || idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: pkg.isPopular ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>
                      Gói #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          presetPackages: prev.presetPackages.filter((_, i) => i !== idx),
                        }));
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Xóa gói"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#8E8F99' }}>Số tiền (VNĐ)</label>
                    <input
                      type="number"
                      step="10000"
                      value={pkg.amount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setSettings((prev) => {
                          const copy = [...prev.presetPackages];
                          copy[idx] = { ...copy[idx], amount: val };
                          return { ...prev, presetPackages: copy };
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#8E8F99' }}>Huy hiệu (Badge)</label>
                    <input
                      type="text"
                      value={pkg.badge || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSettings((prev) => {
                          const copy = [...prev.presetPackages];
                          copy[idx] = { ...copy[idx], badge: val };
                          return { ...prev, presetPackages: copy };
                        });
                      }}
                      placeholder="VD: Phổ biến, +10% Bonus..."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#D1D5DB', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!pkg.isPopular}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setSettings((prev) => {
                          const copy = [...prev.presetPackages];
                          copy[idx] = { ...copy[idx], isPopular: val };
                          return { ...prev, presetPackages: copy };
                        });
                      }}
                    />
                    Đánh dấu là gói nổi bật (Viền vàng)
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Lịch sử Giao dịch Toàn hệ thống */}
        {activeTab === 'transactions' && (
          <div
            style={{
              background: 'rgba(23, 25, 32, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            {/* Header filters */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Lịch Sử Giao Dịch & Nạp Tiền
                </h3>
                <p style={{ fontSize: '13px', color: '#8E8F99', margin: '4px 0 0 0' }}>
                  Theo dõi danh sách các giao dịch phát sinh trên toàn bộ nền tảng
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#8E8F99" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Tìm tên, email, mã GD..."
                    style={{
                      padding: '7px 12px 7px 30px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      width: '200px',
                    }}
                  />
                </div>

                <select
                  value={txFilter}
                  onChange={(e) => setTxFilter(e.target.value as typeof txFilter)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                >
                  <option value="all">Tất cả giao dịch</option>
                  <option value="topup">Chỉ nạp tiền</option>
                  <option value="vip">Chỉ nâng cấp VIP</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#8E8F99' }}>
                    <th style={{ padding: '12px 14px' }}>MÃ GIAO DỊCH</th>
                    <th style={{ padding: '12px 14px' }}>NGƯỜI DÙNG</th>
                    <th style={{ padding: '12px 14px' }}>SỐ TIỀN</th>
                    <th style={{ padding: '12px 14px' }}>PHƯƠNG THỨC</th>
                    <th style={{ padding: '12px 14px' }}>MÔ TẢ</th>
                    <th style={{ padding: '12px 14px' }}>THỜI GIAN</th>
                    <th style={{ padding: '12px 14px' }}>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#6B7280' }}>
                        Không có giao dịch nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isPositive = (tx.amount || 0) > 0;
                      return (
                        <tr
                          key={tx.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#9CA3AF', fontSize: '11px' }}>
                            {tx.id}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{tx.userName}</div>
                            <div style={{ fontSize: '11px', color: '#8E8F99' }}>{tx.userEmail}</div>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: isPositive ? '#10B981' : '#EF4444' }}>
                            {isPositive ? `+${tx.amount.toLocaleString('vi-VN')}` : tx.amount.toLocaleString('vi-VN')} ₫
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#D1D5DB' }}>
                              {tx.method || 'VietQR'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#D1D5DB', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#8E8F99', fontSize: '12px' }}>
                            {new Date(tx.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: tx.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: tx.status === 'success' ? '#10B981' : '#F59E0B',
                              }}
                            >
                              <CheckCircle2 size={12} /> {tx.status === 'success' ? 'Thành công' : 'Chờ xử lý'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal cộng tiền thủ công */}
        {showCreditModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <form
              onSubmit={handleCreditSubmit}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: '#12141A',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} color="#EC4899" /> Nạp tiền thủ công cho người dùng
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    User ID (Mã người dùng)
                  </label>
                  <input
                    type="text"
                    value={creditUserId}
                    onChange={(e) => setCreditUserId(e.target.value)}
                    placeholder="VD: user-demo-1 hoặc id tài khoản"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Số tiền cần cộng (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="100000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#10B981',
                      fontSize: '16px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#D1D5DB', display: 'block', marginBottom: '6px' }}>
                    Lý do / Ghi chú giao dịch
                  </label>
                  <input
                    type="text"
                    value={creditMemo}
                    onChange={(e) => setCreditMemo(e.target.value)}
                    placeholder="Admin thưởng hoặc bù nạp tiền"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#9CA3AF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #EC4899, #BE185D)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Xác nhận cộng tiền
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
