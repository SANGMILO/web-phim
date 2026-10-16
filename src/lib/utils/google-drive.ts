import { getGoogleDrivePreviewUrl, parseGoogleDriveUrl } from '@/lib/google-drive';

/**
 * Extracts a Google Drive File ID from an HTTPS URL on drive.google.com.
 * Examples supported:
 * - https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing
 * - https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview
 * - https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs
 * - https://drive.google.com/uc?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs
 */
export function extractGoogleDriveId(urlOrId?: string | null): string | null {
  return typeof urlOrId === 'string' ? parseGoogleDriveUrl(urlOrId) : null;
}

/**
 * Converts any Google Drive link to an embeddable preview iframe URL:
 * https://drive.google.com/file/d/{ID}/preview
 */
export function toGoogleDriveEmbedUrl(urlOrId?: string | null): string | null {
  const fileId = extractGoogleDriveId(urlOrId);
  return fileId ? getGoogleDrivePreviewUrl(fileId) : null;
}

/**
 * Checks whether a given string is a valid Google Drive video link or ID.
 */
export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url) return false;
  return extractGoogleDriveId(url) !== null;
}
