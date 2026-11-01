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

/** Avance global de la formación (todas las lecciones de todos los cursos). */
export function overallProgress(courses: Course[], watched: Record<string, string>) {
  const lessons = courses.flatMap((c) => c.lecciones);
  const done = lessons.filter((l) => watched[l.id]).length;
  return { done, total: lessons.length, value: lessons.length ? done / lessons.length : 0 };
}

/**
 * La lección a la que volver: la última abierta si aún no se ha visto; si no, la siguiente de ese
 * curso; si el curso está completo (o no hay última), la primera sin ver del primer curso sin terminar.
 */
export function nextLessonOverall(courses: Course[], watched: Record<string, string>, lastId: string | null) {
  const nextIn = (course: Course): Lesson | null => {
    const lastSeen = course.lecciones.reduce((acc, l, i) => (watched[l.id] ? i : acc), -1);
    return course.lecciones.slice(lastSeen + 1).find((l) => !watched[l.id]) ?? course.lecciones.find((l) => !watched[l.id]) ?? null;
  };
  const prev = lastId ? courses.find((c) => c.lecciones.some((l) => l.id === lastId)) : undefined;
  if (prev && prev.lecciones.some((l) => !watched[l.id])) {
    const lesson = watched[lastId!] ? nextIn(prev) : prev.lecciones.find((l) => l.id === lastId) ?? null;
    if (lesson) return { course: prev, lesson };
  }
  for (const course of courses) {
    const lesson = nextIn(course);
    if (lesson) return { course, lesson };
  }
  return null;
}
