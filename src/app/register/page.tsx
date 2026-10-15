import type { Metadata } from 'next';
import { RegisterClient } from './RegisterClient';

export const metadata: Metadata = {
  title: 'Đăng ký tài khoản',
  description: 'Tạo tài khoản CINEVERSE để lưu danh sách phim, đồng bộ tiến độ xem và nhận đề xuất phim hay.',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
