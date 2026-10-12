import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import type { Video } from '@virtus/content';

import { color, radius, space, type } from '@/theme';

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Miniatura del vídeo con el botón de reproducir; abre el reproductor insertado. */
export function VideoCard({ video, width = 260 }: { video: Video; width?: number }) {
  const h = (width * 9) / 16;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Vídeo: ${video.titulo}`}
      onPress={() => router.push({ pathname: '/video/[id]', params: { id: video.id } })}
      style={({ pressed }) => ({ width, gap: space.s, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width, height: h, borderRadius: radius.m, overflow: 'hidden', backgroundColor: color.azulNoche }}>
        <Image source={{ uri: youtubeThumb(video.youtubeId) }} style={{ width, height: h }} contentFit="cover" transition={300} />
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,30,51,0.25)' }} />
        <View
          style={{
            position: 'absolute',
            left: (width - 52) / 2,
            top: (h - 52) / 2,
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: color.doradoClaro,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={{ marginLeft: 4, width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 16, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color.azulNoche }} />
        </View>
      </View>
      <Text style={[type.bodyStrong, { color: color.azulProfundo }]} numberOfLines={2}>
        {video.titulo}
      </Text>
      <Text style={[type.caption, { color: color.pizarra }]}>{video.canal}</Text>
    </Pressable>
  );
}
