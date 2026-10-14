import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { courseMatches } from '@virtus/content';

import { Body, Button, Caption, Divider, Eyebrow, H1, Progress, Screen, Stack } from '@/components/ui';
import { LessonThumb } from '@/components/CourseCard';
import { useContent } from '@/features/content';
import { courseDuration, formatDuration, useCourseProgress } from '@/features/courses';
import { goBackOrHome } from '@/features/nav';
import { useVirtus } from '@/store/virtus';
import { color, radius, space, type } from '@/theme';

export default function CursoScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = useContent().courses.find((c) => c.id === id);
  if (!course) {
    return (
      <Screen footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
        <Body>—</Body>
      </Screen>
    );
  }
  return <Curso course={course} />;
}

function Curso({ course }: { course: NonNullable<ReturnType<typeof useContent>['courses'][number]> }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const virtue = useVirtus((s) => s.cycle?.virtue ?? null);
  const dominant = useVirtus((s) => s.temperament?.dominant ?? null);
  const { done, total, next, started, complete, watched } = useCourseProgress(course);
  const w = Math.min(width, 640) - space.l * 2;
  const open = (lessonId: string) => router.push({ pathname: '/leccion/[id]', params: { id: lessonId } });
  const target = next ?? course.lecciones[0];
  const cta = complete ? t('cursos.verDeNuevo') : started ? t('cursos.continuar', { n: target.id }) : t('cursos.empezar');

  return (
    <Screen
      footer={
        <>
          <Button label={cta} onPress={() => open(target.id)} />
          <Button variant="ghost" label={t('comun.volver')} onPress={goBackOrHome} />
        </>
      }>
      <Pressable accessibilityRole="button" accessibilityLabel={cta} onPress={() => open(target.id)}>
        <View style={{ width: w, height: (w * 9) / 16, borderRadius: radius.l, overflow: 'hidden', backgroundColor: color.azulNoche }}>
          {course.lecciones[0]?.miniatura ? (
            <Image source={{ uri: course.lecciones[0].miniatura }} style={{ width: w, height: (w * 9) / 16 }} contentFit="cover" transition={300} />
          ) : null}
          <LinearGradient colors={['rgba(15,30,51,0)', 'rgba(15,30,51,0.75)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }} />
          <Text style={{ position: 'absolute', left: space.l, bottom: space.m, fontFamily: type.display.fontFamily, fontSize: 56, lineHeight: 60, color: color.doradoClaro }}>
            {String(course.numero).padStart(2, '0')}
          </Text>
        </View>
      </Pressable>

      <Stack gap={space.s}>
        <Eyebrow>
          {[t('cursos.eyebrow'), virtue && courseMatches(course, virtue) ? t('cursos.paraTuCiclo') : null].filter(Boolean).join(' · ')}
        </Eyebrow>
        <H1>{course.titulo}</H1>
        <Caption>
          {t('cursos.lecciones', { count: total })} · {formatDuration(t, courseDuration(course))}
        </Caption>
      </Stack>

      {started ? (
        <Stack gap={space.xs}>
          <Progress value={done / total} />
          <Caption>{complete ? t('cursos.completado') : t('cursos.vistas', { done, total })}</Caption>
        </Stack>
      ) : null}

      <Stack gap={0}>
        {course.lecciones.map((l, i) => {
          const isNext = started && !complete && next?.id === l.id;
          const yours = dominant !== null && l.temperamentos.includes(dominant);
          return (
            <View key={l.id}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${l.id} ${l.titulo}${watched[l.id] ? `, ${t('cursos.vista')}` : ''}`}
                onPress={() => open(l.id)}
                style={({ pressed }) => ({ flexDirection: 'row', gap: space.m, paddingVertical: space.m, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
                <LessonThumb lesson={l} watched={!!watched[l.id]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.caption, { color: color.doradoVirtud, fontWeight: '700' }]}>
                    {[l.id, isNext ? t('cursos.siguienteEtiqueta') : null, yours ? t('cursos.tuTemperamento') : null].filter(Boolean).join(' · ')}
                  </Text>
                  <Text style={[type.bodyStrong, { color: watched[l.id] ? color.pizarra : color.azulProfundo }]} numberOfLines={3}>
                    {l.titulo}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </Stack>
    </Screen>
  );
}
