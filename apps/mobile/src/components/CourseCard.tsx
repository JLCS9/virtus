import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import type { Course, Lesson } from '@virtus/content';

import { Progress } from '@/components/ui';
import { courseDuration, formatDuration, useCourseProgress } from '@/features/courses';
import { color, radius, space, type } from '@/theme';

const CHECK = { ios: 'checkmark', android: 'check', web: 'check' } as const;

/** Miniatura 16:9 con número de curso grande; abre la ficha del curso. */
export function CourseCard({ course, width = 280, highlight }: { course: Course; width?: number; highlight?: string }) {
  const { t } = useTranslation();
  const { done, total, started, complete } = useCourseProgress(course);
  const h = (width * 9) / 16;
  const thumb = course.lecciones[0]?.miniatura;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('cursos.curso', { n: course.numero })}: ${course.titulo}`}
      onPress={() => router.push({ pathname: '/curso/[id]', params: { id: course.id } })}
      style={({ pressed }) => ({ width, gap: space.s, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width, height: h, borderRadius: radius.m, overflow: 'hidden', backgroundColor: color.azulNoche }}>
        {thumb ? <Image source={{ uri: thumb }} style={{ width, height: h }} contentFit="cover" transition={300} /> : null}
        <LinearGradient
          colors={['rgba(15,30,51,0.05)', 'rgba(15,30,51,0.85)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h * 0.7 }}
        />
        <Text style={{ position: 'absolute', left: space.m, bottom: space.s, fontFamily: type.display.fontFamily, fontSize: 40, lineHeight: 44, color: color.doradoClaro }}>
          {String(course.numero).padStart(2, '0')}
        </Text>
        {highlight ? (
          <View style={{ position: 'absolute', top: space.s, left: space.s, backgroundColor: color.doradoClaro, borderRadius: radius.s, paddingHorizontal: space.s, paddingVertical: 2 }}>
            <Text style={[type.caption, { color: color.azulNoche, fontWeight: '700' }]}>{highlight}</Text>
          </View>
        ) : null}
        {complete ? (
          <View style={{ position: 'absolute', top: space.s, right: space.s, width: 28, height: 28, borderRadius: 14, backgroundColor: color.doradoClaro, alignItems: 'center', justifyContent: 'center' }}>
            <SymbolView name={CHECK} size={16} tintColor={color.azulNoche} />
          </View>
        ) : null}
      </View>
      <Text style={[type.h3, { color: color.azulProfundo }]} numberOfLines={2}>
        {course.titulo}
      </Text>
      <Text style={[type.caption, { color: color.pizarra }]}>
        {started && !complete
          ? t('cursos.vistas', { done, total })
          : `${t('cursos.lecciones', { count: total })} · ${formatDuration(t, courseDuration(course))}`}
      </Text>
      {started && !complete ? <Progress value={done / total} /> : null}
    </Pressable>
  );
}

/** Miniatura pequeña de una lección con su duración y, si se vio, una marca. */
export function LessonThumb({ lesson, width = 112, watched }: { lesson: Lesson; width?: number; watched?: boolean }) {
  const { t } = useTranslation();
  const h = (width * 9) / 16;
  return (
    <View style={{ width, height: h, borderRadius: radius.s, overflow: 'hidden', backgroundColor: color.azulNoche }}>
      {lesson.miniatura ? <Image source={{ uri: lesson.miniatura }} style={{ width, height: h, opacity: watched ? 0.55 : 1 }} contentFit="cover" transition={200} /> : null}
      <View style={{ position: 'absolute', right: 4, bottom: 4, backgroundColor: 'rgba(15,30,51,0.8)', borderRadius: 4, paddingHorizontal: 4 }}>
        <Text style={[type.caption, { color: color.blanco, fontSize: 11, lineHeight: 16 }]}>{formatDuration(t, lesson.duracion)}</Text>
      </View>
      {watched ? (
        <View style={{ position: 'absolute', left: 4, top: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: color.doradoClaro, alignItems: 'center', justifyContent: 'center' }}>
          <SymbolView name={CHECK} size={13} tintColor={color.azulNoche} />
        </View>
      ) : null}
    </View>
  );
}
