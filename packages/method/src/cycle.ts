/**
 * Ciclos de trabajo sobre una virtud y confirmación del temperamento.
 */
import type { DayRecord } from './practice';
import type { TemperamentResult, Virtue } from './types';

const DAY = 86_400_000;

/** Día del ciclo, empezando en 1. */
export function cycleDay(startedAt: string, now: Date): number {
  return Math.max(1, Math.floor((now.getTime() - new Date(startedAt).getTime()) / DAY) + 1);
}

export function isCycleDue(startedAt: string, weeks: number, now: Date): boolean {
  return cycleDay(startedAt, now) > weeks * 7;
}

/**
 * El temperamento no cambia, pero la medición puede fallar: se propone confirmar
 * a las 3–4 semanas, una sola vez, si solo hay un resultado propio.
 */
export function shouldConfirmTemperament(
  history: Pick<TemperamentResult, 'takenAt' | 'source'>[],
  dismissedAt: string | null,
  now: Date,
): boolean {
  const own = history.filter((r) => r.source === 'self');
  if (own.length !== 1 || dismissedAt) return false;
  const days = (now.getTime() - new Date(own[0].takenAt).getTime()) / DAY;
  return days >= 21;
}

export interface CycleSummary {
  days: number;
  accepted: number;
  exams: number;
  done: number;
  secondPrevailed: number;
  firstPrevailed: number;
}

export function summarizeCycle(records: Record<string, DayRecord>, startedAt: string, now: Date): CycleSummary {
  const from = startedAt.slice(0, 10);
  const s: CycleSummary = { days: cycleDay(startedAt, now), accepted: 0, exams: 0, done: 0, secondPrevailed: 0, firstPrevailed: 0 };
  for (const r of Object.values(records)) {
    if (r.date < from) continue;
    if (r.challenge?.acceptedAt) s.accepted++;
    if (!r.exam) continue;
    s.exams++;
    if (r.exam.challengeDone === 'si') s.done++;
    if (r.exam.secondPrevailed === true) s.secondPrevailed++;
    if (r.exam.secondPrevailed === false) s.firstPrevailed++;
  }
  return s;
}

/** Diferencia por virtud entre dos perfiles de carácter (puntos sobre 100). */
export function characterDelta(
  previous: Record<Virtue, number> | null,
  current: Record<Virtue, number>,
): Record<Virtue, number> | null {
  if (!previous) return null;
  return Object.fromEntries(Object.entries(current).map(([k, v]) => [k, (v as number) - (previous[k as Virtue] ?? 0)])) as Record<
    Virtue,
    number
  >;
}
