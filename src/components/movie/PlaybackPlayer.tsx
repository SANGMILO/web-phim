import type { PlaybackSource } from '@/types/movie';
import { getGoogleDrivePreviewUrl } from '../../lib/google-drive';

interface PlaybackPlayerProps {
  source?: PlaybackSource | null;
  directUrl?: string;
  posterUrl?: string;
  title: string;
  compactHelp?: boolean;
}

export function PlaybackPlayer({
  source,
  directUrl,
  posterUrl,
  title,
  compactHelp = false,
}: PlaybackPlayerProps) {
  if (source?.provider === 'google_drive') {
    const previewUrl = getGoogleDrivePreviewUrl(source.externalFileId);
    if (!previewUrl) {
      return <PlayerMessage message="Nguồn phát video chưa sẵn sàng hoặc không hợp lệ." />;
    }

    return (
      <div>
        <div className="player-container" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          <iframe
            src={previewUrl}
            title={`Phát ${title} Full HD`}
            allow="autoplay; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        </div>
        {!compactHelp && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10 }}>
            Nếu video hiển thị chưa sẵn sàng, vui lòng thử lại sau giây lát hoặc chuyển sang Trailer HD.
          </p>
        )}
      </div>
    );
  }

  if (source?.provider === 'direct' || directUrl) {
    const url = directUrl ?? source?.externalFileId;
    if (url) {
      return (
        <div className="player-container" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          <video src={url} poster={posterUrl} controls preload="metadata" style={{ width: '100%', height: '100%' }}>
            Trình duyệt của bạn không hỗ trợ phát video.
          </video>
        </div>
      );
    }
  }

  return <PlayerMessage message="Chưa có nguồn phát khả dụng cho nội dung này." />;
}

function PlayerMessage({ message }: { message: string }) {
  return (
    <div
      className="player-container"
      role="status"
      style={{ display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}
    >
      <p style={{ color: 'var(--text-secondary)', maxWidth: 560 }}>{message}</p>
    </div>
  );
}
