import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { modelsFor, videosFor } from '@virtus/content';

import { Caption, Eyebrow, Screen, Stack, Titular } from '@/components/ui';
import { Carousel } from '@/components/Carousel';
import { Hero } from '@/components/Hero';
import { ModelCard } from '@/components/ModelCard';
import { VideoCard } from '@/components/VideoCard';
import { useContent } from '@/features/content';
import { useVirtus } from '@/store/virtus';
import { color, radius, space, type } from '@/theme';

const ICONS = {
  libros: { ios: 'book.closed', android: 'menu_book', web: 'menu_book' },
  musica: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  peliculas: { ios: 'film', android: 'movie', web: 'movie' },
  pinturas: { ios: 'paintpalette', android: 'palette', web: 'palette' },
} as const;

export default function Biblioteca() {
  const { t } = useTranslation();
  const content = useContent();
  const virtue = useVirtus((s) => s.cycle?.virtue ?? s.temperament?.challengeVirtue ?? 'magnanimidad');
  const dominant = useVirtus((s) => s.temperament?.dominant ?? null);
  const videos = [...videosFor(content, virtue), ...content.videos.filter((v) => !videosFor(content, virtue).includes(v))];
  const models = modelsFor(content, virtue, dominant);

  return (
    <Screen>
      <Titular eyebrow={t('biblioteca.eyebrow')}>{t('biblioteca.titulo')}</Titular>

      <Carousel title={t('biblioteca.videos')}>
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </Carousel>

      <Carousel title={t('biblioteca.modelos')}>
        {models.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
      </Carousel>

      <Stack gap={space.s}>
        <Eyebrow>{t('biblioteca.entorno')}</Eyebrow>
        <Caption>{t('biblioteca.entornoTexto')}</Caption>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }}>
          {content.environment.secciones.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/entorno/[seccion]', params: { seccion: s.id } })}
              style={({ pressed }) => ({
                flexBasis: '46%',
                flexGrow: 1,
                padding: space.m,
                gap: space.s,
                borderRadius: radius.l,
                backgroundColor: color.niebla,
                opacity: pressed ? 0.85 : 1,
              })}>
              <SymbolView name={ICONS[s.id]} size={28} tintColor={color.doradoVirtud} />
              <Text style={[type.h3, { color: color.azulProfundo }]}>{s.titulo}</Text>
              <Text style={[type.caption, { color: color.pizarra }]}>{s.items.length}</Text>
            </Pressable>
          ))}
        </View>
      </Stack>

      <Stack gap={space.s}>
        <Eyebrow>{t('biblioteca.lecturas')}</Eyebrow>
        {content.readings.map((r) => (
          <Pressable key={r.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/lectura/[id]', params: { id: r.id } })}>
            <Hero>
              <Text style={[type.h3, { color: color.blanco }]}>{r.titulo}</Text>
              <Text style={[type.caption, { color: color.piedra }]}>
                {r.tarjetas.length} · {r.autor}
              </Text>
            </Hero>
          </Pressable>
        ))}
      </Stack>
    </Screen>
  );
}
