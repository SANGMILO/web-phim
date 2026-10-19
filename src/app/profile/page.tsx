import React from 'react';
import type { Metadata } from 'next';
import { ProfileClient } from './ProfileClient';

export const metadata: Metadata = {
  title: 'Hồ sơ cá nhân & Ví thành viên | CINEVERSE',
  description: 'Quản lý thông tin tài khoản, đổi mật khẩu, nạp tiền và nâng cấp gói hội viên CINEVERSE VIP.',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
