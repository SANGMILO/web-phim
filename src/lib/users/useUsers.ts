'use client';

import { useSyncExternalStore } from 'react';
import { userService } from './user-service';
import type { UserRecord } from '@/types/user-admin';

const EMPTY_USERS: UserRecord[] = [];

function subscribe(callback: () => void) {
  return userService.subscribe(callback);
}

function getSnapshot(): UserRecord[] {
  return userService.getAllUsers();
}

function getServerSnapshot(): UserRecord[] {
  return EMPTY_USERS;
}

export function useUsers() {
  const users = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const stats = userService.getUserStats();

  return {
    users,
    stats,
    updateUserStatus: userService.updateUserStatus.bind(userService),
    updateUserRole: userService.updateUserRole.bind(userService),
    deleteUser: userService.deleteUser.bind(userService),
    addUser: userService.addUser.bind(userService),
  };
}
