'use client';

import { useState } from 'react';
import { parseGoogleDriveUrl } from '@/lib/google-drive';
import { PlaybackPlayer } from '@/components/movie/PlaybackPlayer';

interface DriveSourceFieldProps {
  defaultValue?: string;
  required?: boolean;
  label?: string;
  defaultStatus?: 'active' | 'inactive';
}

export function DriveSourceField({ defaultValue = '', required = false, label = 'Link chia sẻ Google Drive', defaultStatus = 'active' }: DriveSourceFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const fileId = parseGoogleDriveUrl(value);
  const hasValue = value.trim().length > 0;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}{required ? ' *' : ''}</label>
      <input className="input" name="drive_url" type="url" required={required} value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://drive.google.com/file/d/FILE_ID/view" />
      <select className="select" name="source_status" defaultValue={defaultStatus} aria-label="Trạng thái nguồn phát">
        <option value="active">Nguồn đang hoạt động</option>
        <option value="inactive">Tạm ngưng nguồn</option>
      </select>
      {hasValue && !fileId && <p role="alert" style={{ color: '#fb7185', fontSize: 12 }}>Link không hợp lệ. Chỉ dùng link file trên drive.google.com.</p>}
      {fileId && (
        <>
          <p style={{ color: '#4ade80', fontSize: 12 }}>Đã nhận diện File ID: {fileId}</p>
          <PlaybackPlayer source={{ id: 'preview', provider: 'google_drive', externalFileId: fileId, playbackMode: 'preview', label: 'Google Drive', status: 'active', displayOrder: 0 }} title="Bản xem trước nguồn phát" compactHelp />
          <p style={{ color: '#fbbf24', fontSize: 12 }}>Drive công khai theo liên kết không được bảo vệ bởi tài khoản đăng nhập của website.</p>
        </>
      )}
    </div>
  );
}
