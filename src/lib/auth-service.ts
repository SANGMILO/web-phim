'use client';

import type { User } from '@/types/auth';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

const CURRENT_USER_KEY = 'cineverse-current-user';
const listeners = new Set<() => void>();
let cachedUser: User | null = null;
let initialized = false;

const DEFAULT_DEMO_USER: User = {
  id: 'user-demo-1',
  name: 'Khán giả demo',
  email: 'demo@cineverse.vn',
  avatarUrl: '',
  createdAt: '2024-01-01T00:00:00Z',
};

function notify() {
  listeners.forEach((callback) => callback());
}

function mapUser(user: {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): User {
  return {
    id: user.id,
    email: user.email ?? '',
    name:
      (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
      user.email?.split('@')[0] ||
      'Khán giả',
    avatarUrl:
      typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : undefined,
    createdAt: user.created_at,
    isAdmin: user.app_metadata?.role === 'admin',
  };
}

function initialize() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    try {
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedUser = null;
    }
    notify();
    return;
  }

  const supabase = createClient();
  void supabase.auth.getUser().then(({ data }) => {
    cachedUser = data.user ? mapUser(data.user) : null;
    notify();
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = session?.user ? mapUser(session.user) : null;
    notify();
  });
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  needsEmailConfirmation?: boolean;
}

export const authService = {
  subscribe(callback: () => void) {
    listeners.add(callback);
    initialize();
    return () => listeners.delete(callback);
  },
  getSnapshot: () => cachedUser,
  getServerSnapshot: () => null,

  async login(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase chưa được cấu hình. Hãy dùng tài khoản demo.' };
    }
    const { data, error } = await createClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { success: false, error: error.message };
    const user = data.user ? mapUser(data.user) : undefined;
    return { success: Boolean(user), user };
  },

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Cần cấu hình Supabase trước khi đăng ký tài khoản thật.' };
    }
    const { data, error } = await createClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    if (error) return { success: false, error: error.message };
    const user = data.user ? mapUser(data.user) : undefined;
    return { success: Boolean(user), user, needsEmailConfirmation: !data.session };
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      await createClient().auth.signOut();
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      cachedUser = null;
      notify();
    }
  },

  async loginDemo(): Promise<User> {
    if (isSupabaseConfigured()) {
      throw new Error('Tài khoản demo chỉ khả dụng khi Supabase chưa được cấu hình.');
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(DEFAULT_DEMO_USER));
    cachedUser = DEFAULT_DEMO_USER;
    notify();
    return DEFAULT_DEMO_USER;
  },

  updateUser(partial: Partial<User>) {
    if (!cachedUser) return;
    cachedUser = { ...cachedUser, ...partial };
    if (!isSupabaseConfigured() && typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cachedUser));
    }
    notify();
  },

  async updatePassword(newPassword: string): Promise<AuthResult> {
    if (newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu phải chứa ít nhất 6 ký tự.' };
    }
    if (isSupabaseConfigured()) {
      const { data, error } = await createClient().auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      const user = data.user ? mapUser(data.user) : undefined;
      return { success: true, user };
    }
    return { success: true, user: cachedUser || undefined };
  },
};

