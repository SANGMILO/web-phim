import { isSupabaseConfigured } from '@/lib/supabase/config';

export function DemoModeBanner({ isDemo }: { isDemo: boolean }) {
  const configured = isSupabaseConfigured();
  if (configured && !isDemo) return null;
  return (
    <aside
      aria-label="Trạng thái dữ liệu"
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 90,
        padding: '8px 12px',
        borderRadius: 999,
        background: 'rgba(8, 9, 12, 0.9)',
        border: '1px solid rgba(130, 120, 255, 0.45)',
        color: 'var(--text-secondary)',
        fontSize: 12,
        backdropFilter: 'blur(12px)',
      }}
    >
      {configured
        ? 'Dữ liệu demo · Supabase chưa có phim đã xuất bản'
        : 'Dữ liệu demo · chưa kết nối Supabase'}
    </aside>
  );
}

