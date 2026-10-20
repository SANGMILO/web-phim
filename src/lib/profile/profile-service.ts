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
  balance: 0,
  isVip: false,
  transactions: [],
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
      balance: 0,
      isVip: false,
      transactions: [],
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
