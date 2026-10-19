import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/supabase/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authorize on the server before rendering any dashboard client code.
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
