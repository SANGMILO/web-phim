import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PlaybackPlayer } from './PlaybackPlayer';

describe('PlaybackPlayer', () => {
  it('render iframe preview cho nguồn Google Drive hợp lệ', () => {
    const html = renderToStaticMarkup(
      <PlaybackPlayer
        title="Phim thử nghiệm"
        source={{
          id: 'source-1',
          provider: 'google_drive',
          externalFileId: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
          playbackMode: 'preview',
          label: 'Google Drive',
          status: 'active',
          displayOrder: 0,
        }}
      />,
    );

    expect(html).toContain('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/preview');
    expect(html).toContain('allowFullScreen');
    expect(html).not.toContain('<video');
  });

  it('không render iframe hoặc video khi thiếu nguồn', () => {
    const html = renderToStaticMarkup(<PlaybackPlayer title="Phim chưa có nguồn" />);
    expect(html).toContain('Chưa có nguồn phát khả dụng');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<video');
  });

  it('không render iframe khi File ID không hợp lệ', () => {
    const html = renderToStaticMarkup(
      <PlaybackPlayer
        title="Nguồn lỗi"
        source={{
          id: 'source-2',
          provider: 'google_drive',
          externalFileId: 'bad/id',
          playbackMode: 'preview',
          label: 'Google Drive',
          status: 'active',
          displayOrder: 0,
        }}
      />,
    );
    expect(html).toContain('Mã tệp Google Drive không hợp lệ');
    expect(html).not.toContain('<iframe');
  });
});
