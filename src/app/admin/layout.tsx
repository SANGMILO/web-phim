'use client';

import React, { useState } from 'react';
import { ToastProvider } from '@/components/admin/AdminToast';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div
        style={{
          minHeight: '100vh',
          background: '#08090C',
          color: 'var(--text-primary)',
          display: 'flex',
        }}
      >
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div
          style={{
            flex: 1,
            marginLeft: '260px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            transition: 'margin 0.3s ease',
          }}
          className="admin-main-wrapper"
        >
          {children}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main-wrapper {
            margin-left: 0 !important;
          }
          .admin-menu-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </ToastProvider>
  );
}
