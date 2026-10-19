const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export interface YouTubeEmbedOptions {
  autoplay?: boolean;
  mute?: boolean;
  enableJsApi?: boolean;
}

function validVideoId(value?: string | null): string | null {
  const candidate = value?.trim();
  return candidate && YOUTUBE_VIDEO_ID.test(candidate) ? candidate : null;
}

/** Extracts a YouTube video ID from share, watch, Shorts, live, or embed URLs. */
export function extractYouTubeVideoId(value?: string | null): string | null {
  if (!value?.trim()) return null;

  let input = value.trim();
  const iframeSrc = input.match(/src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) input = iframeSrc.replaceAll('&amp;', '&');

  const rawId = validVideoId(input);
  if (rawId) return rawId;

  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    let candidate: string | null = null;

    if (hostname === 'youtu.be') {
      candidate = url.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (
      hostname === 'youtube.com' ||
      hostname.endsWith('.youtube.com') ||
      hostname === 'youtube-nocookie.com' ||
      hostname.endsWith('.youtube-nocookie.com')
    ) {
      const segments = url.pathname.split('/').filter(Boolean);
      candidate = url.pathname === '/watch'
        ? url.searchParams.get('v')
        : ['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')
          ? segments[1] ?? null
          : null;
    }

    return validVideoId(candidate);
  } catch {
    return null;
  }
}

/** Converts supported YouTube links into a safe iframe embed URL. */
export function toYouTubeEmbedUrl(
  value?: string | null,
  options: YouTubeEmbedOptions = {},
): string | null {
  const videoId = extractYouTubeVideoId(value);
  if (!videoId) return null;

  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  embedUrl.searchParams.set('rel', '0');
  if (options.autoplay) embedUrl.searchParams.set('autoplay', '1');
  if (options.mute) embedUrl.searchParams.set('mute', '1');
  if (options.enableJsApi) embedUrl.searchParams.set('enablejsapi', '1');
  return embedUrl.toString();
}
