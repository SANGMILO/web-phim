import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-main" style={{ paddingTop: 150, minHeight: '75vh', textAlign: 'center' }}>
      <p style={{ color: 'var(--accent-crimson)', fontSize: 72, fontWeight: 900, lineHeight: 1 }}>404</p>
      <h1 className="font-display" style={{ fontSize: 32, margin: '16px 0 10px' }}>Không tìm thấy nội dung</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Phim hoặc trang bạn yêu cầu không tồn tại.</p>
      <Link className="btn btn-primary" href="/">Về trang chủ</Link>
    </div>
  );
}

