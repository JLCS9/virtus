/**
 * Ritual diario, examen y revisión semanal.
 */
import { dateKey } from './challenges';
import type { Role, Temperament, Virtue } from './types';

/** Tono del examen según el dominante: más alentador con el melancólico, más confrontador con el colérico. */
export type ExamTone = 'alentador' | 'confrontador' | 'sereno';

export function examTone(dominant: Temperament | null): ExamTone {
  if (dominant === 'MEL') return 'alentador';
  if (dominant === 'COL') return 'confrontador';
  return 'sereno';
}

export interface ExamEntry {
  situation: string;
  situationRole: Role | null;
  firstReaction: string;
  secondReaction: string;
  /** ¿Prevaleció la segunda reacción (libre) sobre la primera (fisiológica)? */
  secondPrevailed: boolean | null;
  challengeDone: 'si' | 'en_parte' | 'no' | null;
  tomorrow: string;
  good: string;
  format: 'breve' | 'completo';
  completedAt: string;
}

export interface DayRecord {
  date: string;
  challenge?: {
    baseId: string;
    text: string;
    role: Role | null;
    acceptedAt: string | null;
    rerolls: number;
    /** Retos Havard: línea de porqué y si lo redactó el servidor o es el respaldo local. */
    why?: string;
    /** Clave de nivel (8) de la virtud del reto, tal como la manda el servidor. */
    virtudClave?: string;
    source?: 'servidor';
  };
  exam?: ExamEntry;
  habitsDone: string[];
}

/** Días de práctica por día de la semana (0 = domingo). */
export type Rhythm = boolean[];

export function isPracticeDay(rhythm: Rhythm, date: Date): boolean {
  return rhythm[date.getDay()] ?? true;
}

export interface WeeklySummary {
  from: string;
  to: string;
  daysWithChallenge: number;
  daysAccepted: number;
  examsDone: number;
  challengesDone: number;
  /** Por rol: cuántas veces ganó la primera reacción y cuántas la segunda. */
  byRole: { role: Role | null; firstWon: number; secondWon: number }[];
  habits: Record<string, number>;
}

export function weekDates(end: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (6 - i));
    return dateKey(d);
  });
}

export function summarizeWeek(records: Record<string, DayRecord>, end: Date): WeeklySummary {
  const days = weekDates(end);
  const byRole = new Map<Role | null, { firstWon: number; secondWon: number }>();
  const habits: Record<string, number> = {};
  let daysWithChallenge = 0;
  let daysAccepted = 0;
  let examsDone = 0;
  let challengesDone = 0;
  for (const day of days) {
    const r = records[day];
    if (!r) continue;
    if (r.challenge) daysWithChallenge++;
    if (r.challenge?.acceptedAt) daysAccepted++;
    for (const h of r.habitsDone) habits[h] = (habits[h] ?? 0) + 1;
    if (!r.exam) continue;
    examsDone++;
    if (r.exam.challengeDone === 'si') challengesDone++;
    if (r.exam.secondPrevailed === null) continue;
    const key = r.exam.situationRole;
    const agg = byRole.get(key) ?? { firstWon: 0, secondWon: 0 };
    if (r.exam.secondPrevailed) agg.secondWon++;
    else agg.firstWon++;
    byRole.set(key, agg);
  }
  return {
    from: days[0],
    to: days[6],
    daysWithChallenge,
    daysAccepted,
    examsDone,
    challengesDone,
    byRole: [...byRole.entries()].map(([role, v]) => ({ role, ...v })).sort((a, b) => b.firstWon - a.firstWon),
    habits,
  };
}

/** Perfil de carácter: autoevaluación y mirada de otros, cada una 0–100 por virtud. */
export interface CharacterProfile {
  self: Record<Virtue, number>;
  others: Record<Virtue, number> | null;
  othersCount: number;
}

export function normalizeScores<K extends string>(scores: Record<K, number>, max: Record<K, number>): Record<K, number> {
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, max[k as K] > 0 ? Math.round(((v as number) / max[k as K]) * 100) : 0]),
  ) as Record<K, number>;
}

export function averageProfiles<K extends string>(profiles: Record<K, number>[]): Record<K, number> | null {
  if (profiles.length === 0) return null;
  const keys = Object.keys(profiles[0]) as K[];
  return Object.fromEntries(
    keys.map((k) => [k, Math.round(profiles.reduce((a, p) => a + (p[k] ?? 0), 0) / profiles.length)]),
  ) as Record<K, number>;
}
