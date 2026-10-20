'use client';

import {
  PaymentSettings,
  AdminTransactionItem,
} from '@/types/payment';

export interface BankInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
}

export const SUPPORTED_BANKS: BankInfo[] = [
  { id: 'MB', code: 'MB', shortName: 'MB Bank', name: 'MB BANK (Ngân hàng Quân Đội)' },
  { id: 'VCB', code: 'VCB', shortName: 'Vietcombank', name: 'Vietcombank (Ngoại thương Việt Nam)' },
  { id: 'TCB', code: 'TCB', shortName: 'Techcombank', name: 'Techcombank (Kỹ Thương Việt Nam)' },
  { id: 'VPB', code: 'VPB', shortName: 'VPBank', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { id: 'ACB', code: 'ACB', shortName: 'ACB', name: 'ACB (Á Châu)' },
  { id: 'BIDV', code: 'BIDV', shortName: 'BIDV', name: 'BIDV (Đầu tư và Phát triển)' },
  { id: 'ICB', code: 'ICB', shortName: 'VietinBank', name: 'VietinBank (Công Thương Việt Nam)' },
  { id: 'TPB', code: 'TPB', shortName: 'TPBank', name: 'TPBank (Tiên Phong)' },
  { id: 'VBA', code: 'VBA', shortName: 'Agribank', name: 'Agribank (Nông nghiệp & PTNT)' },
  { id: 'STB', code: 'STB', shortName: 'Sacombank', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { id: 'HDB', code: 'HDB', shortName: 'HDBank', name: 'HDBank (Phát triển TP.HCM)' },
  { id: 'OCB', code: 'OCB', shortName: 'OCB', name: 'OCB (Phương Đông)' },
  { id: 'VIB', code: 'VIB', shortName: 'VIB', name: 'VIB (Quốc tế)' },
  { id: 'SHB', code: 'SHB', shortName: 'SHB', name: 'SHB (Sài Gòn - Hà Nội)' },
  { id: 'MSB', code: 'MSB', shortName: 'MSB', name: 'MSB (Hàng Hải)' },
];

const STORAGE_KEY = 'cineverse_payment_settings_v1';
const PROFILE_STORAGE_KEY = 'cineverse_user_profile_data_v1';
const CHANGE_EVENT = 'cineverse_payment_settings_changed';

type StoredTransaction = Partial<AdminTransactionItem>;

type StoredProfile = {
  userId?: string;
  displayName?: string;
  name?: string;
  email?: string;
  transactions?: StoredTransaction[];
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  methods: {
    vietqr: true,
    momo: false,
    zalopay: false,
    card: false,
  },
  bank: {
    bankId: 'MB',
    bankName: 'MB BANK (Quân Đội)',
    accountNumber: '',
    accountHolder: '',
    memoPrefix: 'CV NAP',
    note: 'Quét mã QR tự động nhận tiền trong 30s qua App Ngân hàng (MB, VCB, Techcombank...)',
  },
  momo: {
    phone: '',
    accountHolder: '',
    note: 'Chưa kích hoạt xác minh tự động',
  },
  zalopay: {
    phone: '',
    accountHolder: '',
    note: 'Chưa kích hoạt xác minh tự động',
  },
  card: {
    gatewayName: 'Chưa cấu hình',
    note: 'Chưa kích hoạt cổng thẻ',
    instructions: 'Chỉ bật khi đã tích hợp webhook xác minh từ nhà cung cấp cổng thẻ.',
  },
  presetPackages: [
    { id: 'p-50k', amount: 50000, badge: '' },
    { id: 'p-100k', amount: 100000, badge: 'Phổ biến', isPopular: true },
    { id: 'p-200k', amount: 200000, badge: '+10% Bonus' },
    { id: 'p-500k', amount: 500000, badge: '+20% VIP Bonus' },
    { id: 'p-1m', amount: 1000000, badge: '+25% King' },
  ],
  currency: 'VND',
  updatedAt: new Date().toISOString(),
};

let memorySettings: PaymentSettings | null = null;

export const paymentService = {
  getSettings(): PaymentSettings {
    if (memorySettings) return memorySettings;
    if (!isBrowser()) return DEFAULT_PAYMENT_SETTINGS;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults for null-safety
        memorySettings = {
          ...DEFAULT_PAYMENT_SETTINGS,
          ...parsed,
          methods: {
            ...DEFAULT_PAYMENT_SETTINGS.methods,
            ...(parsed.methods || {}),
          },
          bank: {
            ...DEFAULT_PAYMENT_SETTINGS.bank,
            ...(parsed.bank || {}),
          },
          momo: {
            ...DEFAULT_PAYMENT_SETTINGS.momo,
            ...(parsed.momo || {}),
          },
          zalopay: {
            ...DEFAULT_PAYMENT_SETTINGS.zalopay,
            ...(parsed.zalopay || {}),
          },
          card: {
            ...DEFAULT_PAYMENT_SETTINGS.card,
            ...(parsed.card || {}),
          },
          presetPackages: Array.isArray(parsed.presetPackages) && parsed.presetPackages.length > 0
            ? parsed.presetPackages
            : DEFAULT_PAYMENT_SETTINGS.presetPackages,
        };
      } else {
        memorySettings = DEFAULT_PAYMENT_SETTINGS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAYMENT_SETTINGS));
      }
    } catch {
      memorySettings = DEFAULT_PAYMENT_SETTINGS;
    }

    return memorySettings || DEFAULT_PAYMENT_SETTINGS;
  },

  updateSettings(updates: Partial<PaymentSettings>): PaymentSettings {
    const current = this.getSettings();
    const updated: PaymentSettings = {
      ...current,
      ...updates,
      methods: {
        ...current.methods,
        ...(updates.methods || {}),
      },
      bank: {
        ...current.bank,
        ...(updates.bank || {}),
      },
      momo: {
        ...current.momo,
        ...(updates.momo || {}),
      },
      zalopay: {
        ...current.zalopay,
        ...(updates.zalopay || {}),
      },
      card: {
        ...current.card,
        ...(updates.card || {}),
      },
      presetPackages: updates.presetPackages || current.presetPackages,
      updatedAt: new Date().toISOString(),
    };

    memorySettings = updated;
    if (isBrowser()) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
      } catch (err) {
        console.error('Failed to save payment settings:', err);
      }
    }
    return updated;
  },

  resetSettings(): PaymentSettings {
    memorySettings = { ...DEFAULT_PAYMENT_SETTINGS, updatedAt: new Date().toISOString() };
    if (isBrowser()) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(memorySettings));
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
      } catch (err) {
        console.error('Failed to reset payment settings:', err);
      }
    }
    return memorySettings;
  },

  getVietQrUrl(params: {
    bankId: string;
    accountNumber: string;
    amount?: number;
    memo?: string;
    accountHolder?: string;
  }): string {
    const cleanAccount = (params.accountNumber || '').replace(/[\s.-]/g, '');
    const cleanBank = (params.bankId || 'MB').trim();
    const baseUrl = `https://img.vietqr.io/image/${cleanBank}-${cleanAccount}-compact2.png`;

    const queryParams = new URLSearchParams();
    if (params.amount && params.amount > 0) {
      queryParams.set('amount', params.amount.toString());
    }
    if (params.memo) {
      queryParams.set('addInfo', params.memo);
    }
    if (params.accountHolder) {
      queryParams.set('accountName', params.accountHolder);
    }

    const qs = queryParams.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  },

  getAllTransactions(): AdminTransactionItem[] {
    if (!isBrowser()) return [];

    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw) as Record<string, StoredProfile>;
      const items: AdminTransactionItem[] = [];

      Object.entries(data).forEach(([userId, profile]) => {
        if (profile && Array.isArray(profile.transactions)) {
          profile.transactions.forEach((tx) => {
            items.push({
              id: tx.id || `tx-${Date.now()}`,
              userId: profile.userId || userId,
              userName: profile.displayName || profile.name || 'Người dùng',
              userEmail: profile.email || 'Chưa cập nhật',
              type: tx.type || 'topup',
              amount: tx.amount || 0,
              description: tx.description || 'Giao dịch nạp tiền',
              createdAt: tx.createdAt || new Date().toISOString(),
              status: tx.status || 'success',
              method: tx.method || 'VietQR',
            });
          });
        }
      });

      // Sort newest first
      return items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  },

  subscribe(callback: () => void): () => void {
    if (!isBrowser()) return () => {};

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === PROFILE_STORAGE_KEY) {
        memorySettings = null;
        callback();
      }
    };

    const handleCustom = () => callback();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CHANGE_EVENT, handleCustom);
    window.addEventListener('cineverse_profile_changed', handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CHANGE_EVENT, handleCustom);
      window.removeEventListener('cineverse_profile_changed', handleCustom);
    };
  },
};
