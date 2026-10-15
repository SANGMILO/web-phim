'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  FileCode,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useMovieAdmin } from '@/lib/movies/useMovieAdmin';
import { useToast } from '@/components/admin/AdminToast';

export default function AdminSettingsPage() {
  const { movies, resetToDefault, exportJson, importJson } = useMovieAdmin();
  const { showToast } = useToast();

  const [importText, setImportText] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // Compute storage size in localStorage
  let storageSizeKb = '0';
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('cineverse_movies_db');
    if (raw) {
      storageSizeKb = (new Blob([raw]).size / 1024).toFixed(1);
    }
  }

  const handleExport = () => {
    const jsonStr = exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cineverse-movies-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file sao lưu JSON thành công!', 'success');
  };

  const handleImport = () => {
    if (!importText.trim()) {
      showToast('Vui lòng dán nội dung JSON cần nhập.', 'error');
      return;
    }
    const res = importJson(importText);
    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} bộ phim vào hệ thống!`, 'success');
      setImportText('');
    } else {
      showToast(res.error || 'Lỗi khi nhập dữ liệu JSON.', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        const res = importJson(content);
        if (res.success) {
          showToast(`Đã nhập thành công ${res.count} bộ phim từ file "${file.name}"!`, 'success');
        } else {
          showToast(res.error || 'File JSON không hợp lệ.', 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetConfirm = () => {
    resetToDefault();
    showToast('Đã khôi phục toàn bộ 31 bộ phim mẫu gốc!', 'success');
    setShowResetModal(false);
  };

  return (
    <>
      <AdminHeader
        onToggleSidebar={() => {
          const sidebar = document.querySelector('.admin-sidebar');
          if (sidebar) sidebar.classList.toggle('open');
        }}
        title="Cơ sở dữ liệu & Cài đặt hệ thống"
        subtitle="Quản lý sao lưu, khôi phục và cấu hình dữ liệu phim"
      />

      <div style={{ padding: '28px', maxWidth: '1200px', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Thống kê cơ sở dữ liệu */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(117, 221, 243, 0.12)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HardDrive size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Trạng thái kho dữ liệu (Storage)</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Lưu trữ cục bộ an toàn, sẵn sàng đồng bộ hoặc kết nối cơ sở dữ liệu phía máy chủ
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tổng số bản ghi phim</span>
                <p className="font-display" style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                  {movies.length} tác phẩm
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dung lượng bộ nhớ</span>
                <p className="font-display" style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                  {storageSizeKb} KB
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tình trạng kết nối</span>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#2ed573',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle size={16} /> Hoạt động bình thường
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Sao lưu & Xuất dữ liệu */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(130, 120, 255, 0.12)',
                  color: 'var(--accent-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Sao lưu & Xuất dữ liệu JSON</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Tải toàn bộ danh sách tác phẩm về máy tính để sao lưu hoặc chuyển giao
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              File xuất ra ở định dạng chuẩn JSON đầy đủ các trường: tên phim, ảnh poster, backdrop,
              thời lượng, tập phim, đạo diễn và liên kết video stream.
            </p>

            <button
              onClick={handleExport}
              className="btn btn-secondary"
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Download size={16} /> Tải file sao lưu (JSON Backup)
            </button>
          </div>

          {/* Card 3: Nhập dữ liệu từ JSON */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(46, 213, 115, 0.12)',
                  color: '#2ed573',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Nhập dữ liệu từ JSON (Import)</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Khôi phục hoặc nạp thêm phim hàng loạt từ file JSON
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  htmlFor="file-upload"
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileCode size={16} /> Chọn file JSON từ máy tính
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Hoặc dán trực tiếp đoạn mã JSON vào đây:
                </label>
                <textarea
                  rows={4}
                  placeholder='[ { "title": "Tên phim", "slug": "ten-phim", "contentType": "movie", ... } ]'
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <button
                  onClick={handleImport}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  Nạp dữ liệu vào hệ thống
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Khôi phục dữ liệu gốc (Danger Zone) */}
          <div
            style={{
              background: '#101116',
              border: '1px solid rgba(229, 57, 79, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(229, 57, 79, 0.15)',
                  color: 'var(--accent-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RotateCcw size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-crimson)' }}>
                  Khôi phục dữ liệu gốc mặc định (Reset)
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Đặt lại toàn bộ danh mục về 31 bộ phim mẫu ban đầu (đã xác thực hình ảnh 100%)
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Thao tác này sẽ xóa các phim tùy chỉnh bạn đã thêm hoặc sửa và phục hồi lại 31 bộ phim
              mẫu chuẩn điện ảnh ban đầu.
            </p>

            <button
              onClick={() => setShowResetModal(true)}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(229, 57, 79, 0.15)',
                border: '1px solid rgba(229, 57, 79, 0.4)',
                color: 'var(--accent-crimson)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <RotateCcw size={15} /> Đặt lại về 31 phim gốc
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#14161f',
              border: '1px solid rgba(229, 57, 79, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(229, 57, 79, 0.15)',
                  color: 'var(--accent-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Xác nhận khôi phục</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Hành động này sẽ ghi đè các thay đổi hiện tại.
                </p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              Bạn có chắc chắn muốn khôi phục kho phim về 31 bộ phim mẫu ban đầu không? Tất cả các phim
              bạn tự tạo sẽ bị đặt lại.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowResetModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleResetConfirm}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  background: 'var(--accent-crimson)',
                }}
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
