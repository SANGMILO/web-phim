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

  // 2. Direct regex match on /file/d/{ID} or /file/u/{n}/d/{ID} or /d/{ID}
  const fileMatch = input.match(/\/(?:file(?:\/u\/\d+)?\/d|d)\/([A-Za-z0-9_-]{15,})/);
  if (fileMatch?.[1]) {
    return fileMatch[1];
  }

  // 3. Match query parameter id={ID}
  const queryMatch = input.match(/[?&]id=([A-Za-z0-9_-]{15,})/);
  if (queryMatch?.[1]) {
    return queryMatch[1];
  }

  // 4. If input is already directly a raw File ID
  if (/^[A-Za-z0-9_-]{15,45}$/.test(input) && !input.includes('/') && !input.includes('.')) {
    return input;
  }

  // 5. URL parser fallback
  try {
    const normalized = input.startsWith('http://') || input.startsWith('https://')
      ? input
      : `https://${input}`;
    const url = new URL(normalized);
    if (url.hostname.includes('drive.google.com') || url.hostname.includes('docs.google.com')) {
      const pathMatch = url.pathname.match(/\/([A-Za-z0-9_-]{15,})/);
      if (pathMatch?.[1]) return pathMatch[1];
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
