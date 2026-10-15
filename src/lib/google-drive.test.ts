import { describe, expect, it } from 'vitest';
import { getGoogleDrivePreviewUrl, parseGoogleDriveUrl } from './google-drive';

const fileId = '1AbCdEfGhIjKlMnOpQrStUvWxYz';

describe('parseGoogleDriveUrl', () => {
  it.each([
    [`https://drive.google.com/file/d/${fileId}/view?usp=sharing`, fileId],
    [`https://drive.google.com/open?id=${fileId}`, fileId],
    [`https://drive.google.com/uc?id=${fileId}&export=download`, fileId],
  ])('trích xuất File ID từ %s', (url, expected) => {
    expect(parseGoogleDriveUrl(url)).toBe(expected);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,test',
    `https://example.com/file/d/${fileId}/view`,
    `http://drive.google.com/file/d/${fileId}/view`,
    'https://drive.google.com/drive/folders/abc123456789',
    'https://drive.google.com/open?id=short',
  ])('từ chối URL không hợp lệ: %s', (url) => {
    expect(parseGoogleDriveUrl(url)).toBeNull();
  });
});

describe('getGoogleDrivePreviewUrl', () => {
  it('chỉ tạo URL preview từ File ID hợp lệ', () => {
    expect(getGoogleDrivePreviewUrl(fileId)).toBe(`https://drive.google.com/file/d/${fileId}/preview`);
    expect(getGoogleDrivePreviewUrl('bad/id')).toBeNull();
  });
});
