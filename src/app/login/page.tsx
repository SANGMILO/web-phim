import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginClient } from './LoginClient';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào CINEVERSE để trải nghiệm xem phim chất lượng cao và lưu danh sách yêu thích.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-main" style={{ paddingTop: '120px' }}>Đang tải...</div>}>
      <LoginClient />
    </Suspense>
  );
}
