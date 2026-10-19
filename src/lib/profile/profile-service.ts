'use client';

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'vip_month' | 'vip_year';
  amount: number;
  description: string;
  createdAt: string;
  status: 'success' | 'pending';
  method?: string;
}

export interface UserProfileData {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  favoriteGenres?: string[];
  balance: number; // in VND
  isVip: boolean;
  vipExpiresAt?: string;
  transactions: WalletTransaction[];
}

const STORAGE_KEY = 'cineverse_user_profile_data_v1';
const CHANGE_EVENT = 'cineverse_profile_changed';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

const DEFAULT_PROFILE: UserProfileData = {
  userId: 'user-demo-1',
  displayName: 'user 1',
  email: 'xuandongtk@gmail.com',
  avatarUrl: 'av-1',
  bio: 'Người yêu điện ảnh đích thực. Thích trải nghiệm âm thanh vòm và hình ảnh 4K HDR.',
  phone: '0988 123 456',
  favoriteGenres: ['Hành động', 'Khoa học viễn tưởng', 'Phiêu lưu'],
  balance: 150000,
  isVip: true,
  vipExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  transactions: [
    {
      id: 'tx-init-1',
      type: 'topup',
      amount: 200000,
      description: 'Nạp tiền vào tài khoản qua VietQR (MB Bank)',
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      status: 'success',
      method: 'VietQR',
    },
    {
      id: 'tx-init-2',
      type: 'vip_month',
      amount: -59000,
      description: 'Đăng ký gói CINEVERSE VIP 1 Tháng (4K HDR)',
      createdAt: new Date(Date.now() - 3600000 * 24 * 2 + 60000).toISOString(),
      status: 'success',
      method: 'Ví CineVerse',
    },
    {
      id: 'tx-init-3',
      type: 'topup',
      amount: 50000,
      description: 'Khuyến mãi thành viên mới gia nhập CineVerse',
      createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      status: 'success',
      method: 'CineVerse Gift',
    },
  ],
};

let memoryStore: Record<string, UserProfileData> | null = null;

function getStore(): Record<string, UserProfileData> {
  if (memoryStore) return memoryStore;
  if (!isBrowser()) {
    memoryStore = { [DEFAULT_PROFILE.userId]: DEFAULT_PROFILE };
    return memoryStore;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryStore = JSON.parse(raw);
    } else {
      memoryStore = { [DEFAULT_PROFILE.userId]: DEFAULT_PROFILE };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    }
  } catch {
    memoryStore = { [DEFAULT_PROFILE.userId]: DEFAULT_PROFILE };
  }
  return memoryStore || { [DEFAULT_PROFILE.userId]: DEFAULT_PROFILE };
}

function persistStore(data: Record<string, UserProfileData>, emit = true) {
  memoryStore = data;
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (emit) {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    }
  } catch (err) {
    console.error('Error saving profile data:', err);
  }
}

export const profileService = {
  getProfile(userId: string, defaultName?: string, defaultEmail?: string): UserProfileData {
    const store = getStore();
    if (store[userId]) {
      return store[userId];
    }

    const newProfile: UserProfileData = {
      userId,
      displayName: defaultName || 'user 1',
      email: defaultEmail || 'xuandongtk@gmail.com',
      avatarUrl: 'av-1',
      bio: 'Thành viên CineVerse',
      phone: '',
      favoriteGenres: ['Hành động', 'Khoa học viễn tưởng'],
      balance: 150000,
      isVip: true,
      vipExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      transactions: [
        {
          id: `tx-init-${Date.now()}`,
          type: 'topup',
          amount: 150000,
          description: 'Quà tặng chào mừng thành viên mới',
          createdAt: new Date().toISOString(),
          status: 'success',
          method: 'CineVerse Gift',
        },
      ],
    };

    store[userId] = newProfile;
    persistStore(store, false);
    return newProfile;
  },

  updateProfile(userId: string, updates: Partial<UserProfileData>): UserProfileData {
    const store = getStore();
    const current = store[userId] || this.getProfile(userId);
    const updated: UserProfileData = {
      ...current,
      ...updates,
      userId,
    };
    store[userId] = updated;
    persistStore(store, true);
    return updated;
  },

  topUp(userId: string, amount: number, method = 'VietQR'): UserProfileData {
    const store = getStore();
    const current = store[userId] || this.getProfile(userId);
    const newTransaction: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'topup',
      amount,
      description: `Nạp tiền vào tài khoản qua ${method}`,
      createdAt: new Date().toISOString(),
      status: 'success',
      method,
    };

    const updated: UserProfileData = {
      ...current,
      balance: (current.balance || 0) + amount,
      transactions: [newTransaction, ...(current.transactions || [])],
    };
    store[userId] = updated;
    persistStore(store, true);
    return updated;
  },

  upgradeVip(
    userId: string,
    plan: 'vip_month' | 'vip_year'
  ): { success: boolean; error?: string; profile: UserProfileData } {
    const store = getStore();
    const current = store[userId] || this.getProfile(userId);
    const cost = plan === 'vip_month' ? 59000 : 590000;
    const durationDays = plan === 'vip_month' ? 30 : 365;
    const planName = plan === 'vip_month' ? 'VIP Tháng (30 ngày)' : 'VIP Năm (365 ngày)';

    if ((current.balance || 0) < cost) {
      return {
        success: false,
        error: `Số dư không đủ (${(current.balance || 0).toLocaleString('vi-VN')} ₫). Cần ${cost.toLocaleString('vi-VN')} ₫. Vui lòng nạp thêm tiền.`,
        profile: current,
      };
    }

    const currentExpiry = current.vipExpiresAt ? new Date(current.vipExpiresAt).getTime() : Date.now();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiry = new Date(baseTime + durationDays * 24 * 3600 * 1000).toISOString();

    const newTransaction: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: plan,
      amount: -cost,
      description: `Nâng cấp gói ${planName}`,
      createdAt: new Date().toISOString(),
      status: 'success',
      method: 'Ví CineVerse',
    };

    const updated: UserProfileData = {
      ...current,
      balance: (current.balance || 0) - cost,
      isVip: true,
      vipExpiresAt: newExpiry,
      transactions: [newTransaction, ...(current.transactions || [])],
    };

    store[userId] = updated;
    persistStore(store, true);
    return { success: true, profile: updated };
  },

  subscribe(callback: () => void): () => void {
    if (!isBrowser()) return () => {};
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        memoryStore = null;
        callback();
      }
    };
    const handleCustom = () => callback();

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CHANGE_EVENT, handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CHANGE_EVENT, handleCustom);
    };
  },
};
