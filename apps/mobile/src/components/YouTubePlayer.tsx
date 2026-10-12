import { WebView } from 'react-native-webview';

/** Reproductor insertado de YouTube (modo de privacidad mejorada, sin cookies hasta reproducir). */
export function YouTubePlayer({ youtubeId, width, height }: { youtubeId: string; width: number; height: number }) {
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:#0F1E33}iframe{border:0;width:100vw;height:100vh}</style></head><body><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}?playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`;
  return (
    <WebView
      style={{ width, height, backgroundColor: '#0F1E33' }}
      source={{ html, baseUrl: 'https://www.youtube-nocookie.com' }}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
    />
  );
}
