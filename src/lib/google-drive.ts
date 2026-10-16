const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{15,}$/;

export function isGoogleDriveFileId(value: string): boolean {
  return FILE_ID_PATTERN.test(value.trim());
}

export function parseGoogleDriveUrl(value: string): string | null {
  if (!value) return null;
  let input = value.trim();
  if (!input) return null;

  // 1. If input is HTML iframe embed, extract src
  const iframeSrcMatch = input.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch?.[1]) {
    input = iframeSrcMatch[1].trim();
  }

  // 2. If input is directly a raw File ID (no slashes, no protocol, no dots)
  if (/^[A-Za-z0-9_-]{15,45}$/.test(input) && !input.includes('/') && !input.includes('.')) {
    return input;
  }

  // 3. For URLs, ensure https and drive.google.com or docs.google.com
  try {
    const normalized = input.startsWith('http://') || input.startsWith('https://')
      ? input
      : `https://${input}`;
    const url = new URL(normalized);

    // Enforce https
    if (url.protocol !== 'https:') {
      return null;
    }

    // Enforce Google Drive domain
    const host = url.hostname.toLowerCase();
    if (!host.endsWith('drive.google.com') && !host.endsWith('docs.google.com')) {
      return null;
    }

    // Reject folder links
    if (url.pathname.includes('/folders/')) {
      return null;
    }

    // Match /file/d/{ID}, /file/u/{n}/d/{ID}, or /d/{ID}
    const pathFileMatch = url.pathname.match(/\/(?:file(?:\/u\/\d+)?\/d|d)\/([A-Za-z0-9_-]{15,})/);
    if (pathFileMatch?.[1]) {
      return pathFileMatch[1];
    }

    // Match query parameter id={ID} (e.g. /open?id=... or /uc?id=...)
    const queryId = url.searchParams.get('id');
    if (queryId && isGoogleDriveFileId(queryId)) {
      return queryId;
    }
  } catch {
    // Ignore URL parse errors
  }

  return null;
}

export function getGoogleDrivePreviewUrl(fileId: string): string | null {
  if (!fileId || !isGoogleDriveFileId(fileId)) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}
