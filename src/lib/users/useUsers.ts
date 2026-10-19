'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateUserStats, supabaseUserService } from './supabase-user-service';
import type { UserRecord } from '@/types/user-admin';

export function useUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const nextUsers = await supabaseUserService.getAllUsers();
      setError(null);
      setUsers(nextUsers);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const run = useCallback(async (operation: () => Promise<void>) => {
    try {
      await operation();
      await refresh();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Thao tác thất bại.');
      return false;
    }
  }, [refresh]);

  const stats = useMemo(() => calculateUserStats(users), [users]);

  return {
    users,
    stats,
    loading,
    error,
    refresh,
    updateUserStatus: (user: UserRecord, status: UserRecord['status']) =>
      run(() => supabaseUserService.updateUserStatus(user, status)),
    updateUserRole: (user: UserRecord, role: UserRecord['role']) =>
      run(() => supabaseUserService.updateUserRole(user, role)),
    deleteUser: (id: string) => run(() => supabaseUserService.deleteUser(id)),
  };
}
