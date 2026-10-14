import { useEffect } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { findLesson } from '@virtus/content';

import { Body, Button, Caption, Eyebrow, H2, Screen, Stack } from '@/components/ui';
import { LessonThumb } from '@/components/CourseCard';
import { VimeoPlayer } from '@/components/VimeoPlayer';
import { useContent } from '@/features/content';
import { WATCHED_AT, formatDuration } from '@/features/courses';
import { goBackOrHome } from '@/features/nav';
import { useVirtus } from '@/store/virtus';
import { color, space, type } from '@/theme';

export default function LeccionScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const found = findLesson(useContent(), id);
  const watched = useVirtus((s) => !!s.watched[id]);
  const openLesson = useVirtus((s) => s.openLesson);
  const markWatched = useVirtus((s) => s.markWatched);

  useEffect(() => {
    if (found) openLesson(id);
  }, [id, found, openLesson]);

  if (!found) {
    return (
      <Screen variant="noche" footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
        <Body>—</Body>
      </Screen>
    );
  }

  const { course, lesson, index } = found;
  const next = course.lecciones[index + 1] ?? null;
  const w = Math.min(width, 640) - space.l * 2;
  const toCourse = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/curso/[id]', params: { id: course.id } }));
  const goNext = () => next && router.replace({ pathname: '/leccion/[id]', params: { id: next.id } });

  return (
    <Screen
      variant="noche"
      footer={
        <>
          {next ? <Button label={t('cursos.siguiente')} onPress={goNext} /> : null}
          <Button variant={next ? 'ghost' : 'secondary'} label={t('cursos.volverCurso')} onPress={toCourse} />
        </>
      }>
      <StatusBar style="light" />
      <View style={{ borderRadius: 12, overflow: 'hidden' }}>
        <VimeoPlayer vimeoId={lesson.vimeoId} width={w} height={(w * 9) / 16} onProgress={(f) => f >= WATCHED_AT && markWatched(lesson.id)} />
      </View>

      <Stack gap={space.s}>
        <Eyebrow>
          {t('cursos.curso', { n: course.numero })} · {course.titulo}
        </Eyebrow>
        <H2>{lesson.titulo}</H2>
        <Caption>
          {t('cursos.leccionDe', { n: index + 1, total: course.lecciones.length })} · {formatDuration(t, lesson.duracion)}
        </Caption>
        {watched ? (
          <Text style={[type.caption, { color: color.doradoClaro, fontWeight: '700' }]}>✓ {t('cursos.vista')}</Text>
        ) : (
          <View style={{ alignSelf: 'flex-start' }}>
            <Button variant="ghost" label={t('cursos.marcarVista')} onPress={() => markWatched(lesson.id)} />
          </View>
        )}
      </Stack>

      {next ? (
        <Stack gap={space.s} style={{ marginTop: space.m }}>
          <Eyebrow>{t('cursos.aContinuacion')}</Eyebrow>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('cursos.siguiente')}: ${next.titulo}`}
            onPress={goNext}
            style={({ pressed }) => ({ flexDirection: 'row', gap: space.m, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
            <LessonThumb lesson={next} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.caption, { color: color.doradoClaro, fontWeight: '700' }]}>{next.id}</Text>
              <Text style={[type.bodyStrong, { color: color.blanco }]} numberOfLines={3}>
                {next.titulo}
              </Text>
            </View>
          </Pressable>
        </Stack>
      ) : (
        <Body style={{ marginTop: space.m }}>{t('cursos.finCurso')}</Body>
      )}
    </Screen>
  );
}
