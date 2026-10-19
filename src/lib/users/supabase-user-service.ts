import { createClient } from '@/lib/supabase/client';
import type { UserAccountStatus, UserRecord, UserRole, UserStats } from '@/types/user-admin';

type AdminUserRow = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  role: UserRole;
  status: UserAccountStatus;
  created_at: string;
  last_active_at: string;
  reviews_count: number;
  watchlist_count: number;
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function calculateUserStats(users: UserRecord[]): UserStats {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.status === 'active').length,
    vipUsers: users.filter((user) => user.role === 'vip').length,
    newThisMonth: users.filter((user) => new Date(user.createdAt).getTime() >= thirtyDaysAgo).length,
  };
}

export const supabaseUserService = {
  async getAllUsers(): Promise<UserRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('admin_list_users');
    throwIfError(error);

    return ((data ?? []) as AdminUserRow[]).map((user) => ({
      id: user.id,
      name: user.display_name,
      email: user.email,
      avatarUrl: user.avatar_url || undefined,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
      reviewsCount: Number(user.reviews_count),
      watchlistCount: Number(user.watchlist_count),
    }));
  },

  async updateUserStatus(user: UserRecord, status: UserAccountStatus): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.rpc('admin_update_user', {
      target_user_id: user.id,
      new_role: user.role,
      new_status: status,
    });
    throwIfError(error);
  },

  async updateUserRole(user: UserRecord, role: UserRole): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.rpc('admin_update_user', {
      target_user_id: user.id,
      new_role: role,
      new_status: user.status,
    });
    throwIfError(error);
  },

  async deleteUser(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: id });
    throwIfError(error);
  },
};
