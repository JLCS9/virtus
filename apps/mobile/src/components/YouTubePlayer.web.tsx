/** En web, un iframe directo de YouTube (modo de privacidad mejorada). */
export function YouTubePlayer({ youtubeId, width, height }: { youtubeId: string; width: number; height: number }) {
  return (
    <iframe
      title="YouTube"
      width={width}
      height={height}
      style={{ border: 0, borderRadius: 12 }}
      src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}
