'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-main" style={{ paddingTop: 150, minHeight: '75vh', textAlign: 'center' }}>
      <p style={{ color: 'var(--accent-crimson)', fontWeight: 700 }}>Không thể tải nội dung</p>
      <h1 className="font-display" style={{ fontSize: 32, margin: '12px 0' }}>Đã xảy ra lỗi ngoài dự kiến</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Vui lòng thử lại. Nếu lỗi tiếp diễn, hãy kiểm tra kết nối Supabase.</p>
      <button className="btn btn-primary" onClick={reset}>Thử lại</button>
    </div>
  );
}

