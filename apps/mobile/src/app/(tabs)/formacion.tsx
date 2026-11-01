import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Body, Caption, Card, Eyebrow, Screen, Titular } from '@/components/ui';
import { CourseCard } from '@/components/CourseCard';
import { ProgressRing } from '@/components/ProgressRing';
import { useContent } from '@/features/content';
import { formatDuration, overallProgress } from '@/features/courses';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

import { ContinueLesson } from './biblioteca';

/** Formación de las cuentas con suscripción: tu progreso y los siete cursos, uno bajo otro. */
export default function Formacion() {
  const { t } = useTranslation();
  const content = useContent();
  const watched = useVirtus((s) => s.watched);
  const { done, total, value } = overallProgress(content.courses, watched);
  const segundos = content.courses.flatMap((c) => c.lecciones).filter((l) => watched[l.id]).reduce((n, l) => n + l.duracion, 0);

  return (
    <Screen>
      <Titular eyebrow={t('formacion.eyebrow')}>{t('formacion.titulo')}</Titular>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <ProgressRing value={value} size={72} label={`${Math.round(value * 100)}%`} />
          <View style={{ flex: 1, gap: 2 }}>
            <Eyebrow>{t('formacion.progreso')}</Eyebrow>
            <Body>{t('formacion.leccionesDe', { done, total })}</Body>
            <Caption>{t('formacion.tiempoVisto', { tiempo: formatDuration(t, segundos) })}</Caption>
          </View>
        </View>
      </Card>

      <ContinueLesson />

      <View style={{ gap: space.l }}>
        {content.courses.map((c) => (
          <CourseCard key={c.id} course={c} width={320} />
        ))}
      </View>
    </Screen>
  );
}
