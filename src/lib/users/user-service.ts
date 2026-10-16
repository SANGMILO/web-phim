import type { UserRecord, UserRole, UserAccountStatus, UserStats } from '@/types/user-admin';

const STORAGE_KEY = 'cineverse_users_db';
const CHANGE_EVENT = 'cineverse_users_changed';

const SEED_USERS: UserRecord[] = [
  {
    id: 'user-admin-1',
    name: 'Quản Trị Viên',
    email: 'admin@cineverse.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'admin',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    reviewsCount: 12,
    watchlistCount: 45,
  },
  {
    id: 'user-demo-1',
    name: 'Minh Hoàng',
    email: 'hoang.minh@cineverse.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'vip',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    reviewsCount: 8,
    watchlistCount: 24,
  },
  {
    id: 'user-2',
    name: 'Thanh Thảo',
    email: 'thao.thanh@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    reviewsCount: 5,
    watchlistCount: 16,
  },
  {
    id: 'user-3',
    name: 'Bảo Long',
    email: 'baolong.film@outlook.com',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    role: 'vip',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    reviewsCount: 14,
    watchlistCount: 38,
  },
  {
    id: 'user-4',
    name: 'Hà Linh',
    email: 'halinh99@yahoo.com',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    reviewsCount: 3,
    watchlistCount: 8,
  },
  {
    id: 'user-5',
    name: 'Văn Đức',
    email: 'duc.nguyenvan@fpt.edu.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    reviewsCount: 4,
    watchlistCount: 11,
  },
  {
    id: 'user-6',
    name: 'Quang Anh',
    email: 'quanganh.design@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    role: 'vip',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reviewsCount: 9,
    watchlistCount: 42,
  },
  {
    id: 'user-7',
    name: 'Mai Phương',
    email: 'phuong.mai88@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    reviewsCount: 2,
    watchlistCount: 19,
  },
  {
    id: 'user-8',
    name: 'Tuấn Kiệt',
    email: 'kiet.le@techcorp.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'user',
    status: 'suspended',
    createdAt: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    reviewsCount: 1,
    watchlistCount: 3,
  },
];

let cachedUsers: UserRecord[] | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadFromStorage(): UserRecord[] {
  if (!isBrowser()) return SEED_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
      cachedUsers = SEED_USERS;
      return SEED_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedUsers = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Error loading users from localStorage:', err);
  }
  cachedUsers = SEED_USERS;
  return SEED_USERS;
}

function saveToStorage(users: UserRecord[]): void {
  cachedUsers = users;
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: users }));
  } catch (err) {
    console.error('Error saving users to localStorage:', err);
  }
}

export const userService = {
  getAllUsers(): UserRecord[] {
    if (cachedUsers) return cachedUsers;
    return loadFromStorage();
  },

  getUserById(id: string): UserRecord | undefined {
    return this.getAllUsers().find((u) => u.id === id);
  },

  updateUserStatus(id: string, status: UserAccountStatus): boolean {
    const all = [...this.getAllUsers()];
    const index = all.findIndex((u) => u.id === id);
    if (index === -1) return false;
    all[index] = { ...all[index], status };
    saveToStorage(all);
    return true;
  },

  updateUserRole(id: string, role: UserRole): boolean {
    const all = [...this.getAllUsers()];
    const index = all.findIndex((u) => u.id === id);
    if (index === -1) return false;
    all[index] = { ...all[index], role };
    saveToStorage(all);
    return true;
  },

  deleteUser(id: string): boolean {
    const all = this.getAllUsers();
    const filtered = all.filter((u) => u.id !== id);
    if (filtered.length === all.length) return false;
    saveToStorage(filtered);
    return true;
  },

  addUser(data: {
    name: string;
    email: string;
    role?: UserRole;
    avatarUrl?: string;
  }): UserRecord {
    const all = [...this.getAllUsers()];
    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      avatarUrl: data.avatarUrl,
      role: data.role || 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      reviewsCount: 0,
      watchlistCount: 0,
    };
    all.unshift(newUser);
    saveToStorage(all);
    return newUser;
  },

  getUserStats(): UserStats {
    const all = this.getAllUsers();
    const totalUsers = all.length;
    const activeUsers = all.filter((u) => u.status === 'active').length;
    const vipUsers = all.filter((u) => u.role === 'vip').length;

    const thirtyDaysAgo = Date.now() - 3600000 * 24 * 30;
    const newThisMonth = all.filter(
      (u) => new Date(u.createdAt).getTime() >= thirtyDaysAgo
    ).length;

    return {
      totalUsers,
      activeUsers,
      vipUsers,
      newThisMonth,
    };
  },

  subscribe(callback: () => void): () => void {
    if (!isBrowser()) return () => {};
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cachedUsers = null;
        callback();
      }
    };
    const handleCustom = () => {
      callback();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(CHANGE_EVENT, handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CHANGE_EVENT, handleCustom);
    };
  },
};
