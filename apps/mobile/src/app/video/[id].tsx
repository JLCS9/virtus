import { useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Eyebrow, H2, Screen, Stack } from '@/components/ui';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { useContent } from '@/features/content';
import { goBackOrHome } from '@/features/nav';
import { space } from '@/theme';

export default function VideoScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const video = useContent().videos.find((v) => v.id === id);
  const w = Math.min(width, 640) - space.l * 2;
  return (
    <Screen variant="noche" footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
      <StatusBar style="light" />
      {video ? (
        <Stack gap={space.m}>
          <View style={{ borderRadius: 12, overflow: 'hidden' }}>
            <YouTubePlayer youtubeId={video.youtubeId} width={w} height={(w * 9) / 16} />
          </View>
          <Eyebrow>{video.canal}</Eyebrow>
          <H2>{video.titulo}</H2>
          <Caption>{t('biblioteca.videoNota')}</Caption>
        </Stack>
      ) : (
        <Body>—</Body>
      )}
    </Screen>
  );
}
