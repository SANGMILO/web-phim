export type UserRole = 'user' | 'vip' | 'admin';
export type UserAccountStatus = 'active' | 'suspended';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserAccountStatus;
  createdAt: string;
  lastActiveAt: string;
  reviewsCount: number;
  watchlistCount: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  vipUsers: number;
  newThisMonth: number;
}
