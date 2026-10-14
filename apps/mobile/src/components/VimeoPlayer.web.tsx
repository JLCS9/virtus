import { useEffect, useRef } from 'react';

import { vimeoSrc } from '@/features/courses';

const ORIGIN = 'https://player.vimeo.com';

/** En web, un iframe de Vimeo; el avance llega por la API postMessage del reproductor. */
export function VimeoPlayer({
  vimeoId,
  width,
  height,
  onProgress,
}: {
  vimeoId: string;
  width: number;
  height: number;
  onProgress?: (fraction: number) => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    let last = 0;
    const post = (method: string, value: string) => ref.current?.contentWindow?.postMessage(JSON.stringify({ method, value }), ORIGIN);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== ORIGIN || e.source !== ref.current?.contentWindow) return;
      let msg: { event?: string; data?: { percent?: number } };
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (msg.event === 'ready') {
        post('addEventListener', 'playProgress');
        post('addEventListener', 'finish');
      } else if (msg.event === 'finish' || msg.event === 'ended') {
        cb.current?.(1);
      } else if ((msg.event === 'playProgress' || msg.event === 'timeupdate') && typeof msg.data?.percent === 'number' && msg.data.percent - last >= 0.05) {
        last = msg.data.percent;
        cb.current?.(last);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [vimeoId]);

  return (
    <iframe
      ref={ref}
      key={vimeoId}
      title="Vimeo"
      width={width}
      height={height}
      style={{ border: 0, borderRadius: 12, display: 'block' }}
      src={vimeoSrc(vimeoId)}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}
