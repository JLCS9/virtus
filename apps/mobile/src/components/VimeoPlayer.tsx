import { WebView } from 'react-native-webview';

import { vimeoSrc } from '@/features/courses';

/**
 * Reproductor insertado de Vimeo. Avisa del avance (0–1) para marcar la lección como vista.
 * La página se sirve como alexhavard.com por si los vídeos vuelven a restringirse a ese dominio.
 */
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
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#0F1E33}iframe{border:0;width:100vw;height:100vh}</style></head><body>
<iframe id="v" src="${vimeoSrc(vimeoId)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
<script src="https://player.vimeo.com/api/player.js"></script>
<script>
var p = new Vimeo.Player(document.getElementById('v')), last = 0;
function send(x){ window.ReactNativeWebView.postMessage(String(x)); }
p.on('timeupdate', function(d){ if (d.percent - last >= 0.05) { last = d.percent; send(d.percent); } });
p.on('ended', function(){ send(1); });
</script></body></html>`;
  return (
    <WebView
      key={vimeoId}
      style={{ width, height, backgroundColor: '#0F1E33' }}
      source={{ html, baseUrl: 'https://alexhavard.com/' }}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      allowsPictureInPictureMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      onMessage={(e) => {
        const f = Number(e.nativeEvent.data);
        if (Number.isFinite(f)) onProgress?.(f);
      }}
    />
  );
}
