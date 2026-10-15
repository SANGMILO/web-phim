const DRIVE_HOST = 'drive.google.com';
const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

export function isGoogleDriveFileId(value: string): boolean {
  return FILE_ID_PATTERN.test(value);
}

export function parseGoogleDriveUrl(value: string): string | null {
  const input = value.trim();
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== DRIVE_HOST) {
    return null;
  }

  const fileMatch = url.pathname.match(/^\/file\/d\/([^/]+)(?:\/|$)/);
  const queryId =
    url.pathname === '/open' || url.pathname === '/uc'
      ? url.searchParams.get('id')
      : null;
  const fileId = fileMatch?.[1] ?? queryId;

  return fileId && isGoogleDriveFileId(fileId) ? fileId : null;
}

export function getGoogleDrivePreviewUrl(fileId: string): string | null {
  if (!isGoogleDriveFileId(fileId)) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}
