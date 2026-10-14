import type { TFunction } from 'i18next';

import type { Course, Lesson } from '@virtus/content';

import { useVirtus } from '@/store/virtus';

export const vimeoSrc = (id: string) =>
  `https://player.vimeo.com/video/${id}?badge=0&autopause=0&playsinline=1&title=0&byline=0&portrait=0&dnt=1`;

/** A partir de este avance una lección cuenta como vista. */
export const WATCHED_AT = 0.9;

/** «12 min» o «1 h 36 min». */
export function formatDuration(t: TFunction, seconds: number): string {
  const total = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? t('cursos.horas', { h, m: String(m).padStart(2, '0') }) : t('cursos.minutos', { m });
}

export const courseDuration = (course: Course) => course.lecciones.reduce((sum, l) => sum + l.duracion, 0);

/** Progreso de un curso y la lección por la que seguir (la primera sin ver tras la última vista). */
export function useCourseProgress(course: Course) {
  const watched = useVirtus((s) => s.watched);
  const done = course.lecciones.filter((l) => watched[l.id]).length;
  const lastSeen = course.lecciones.reduce((acc, l, i) => (watched[l.id] ? i : acc), -1);
  const next: Lesson | null =
    course.lecciones.slice(lastSeen + 1).find((l) => !watched[l.id]) ?? course.lecciones.find((l) => !watched[l.id]) ?? null;
  return { done, total: course.lecciones.length, next, started: done > 0, complete: done === course.lecciones.length, watched };
}
