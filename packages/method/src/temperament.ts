import { TEMPERAMENTS, type Temperament, type TemperamentResult, type TypeCode, type WorkVirtue } from './types';

/** Virtud-desafío por temperamento dominante (glosario del brandbook). */
export const CHALLENGE_VIRTUE: Record<Temperament, WorkVirtue> = {
  COL: 'humildad',
  MEL: 'audacia',
  SAN: 'resistencia',
  FLE: 'magnanimidad',
};

/** Colérico-flemático y melancólico-sanguíneo son combinaciones imposibles. */
export const INCOMPATIBLE: Record<Temperament, Temperament> = {
  COL: 'FLE',
  FLE: 'COL',
  MEL: 'SAN',
  SAN: 'MEL',
};

/** Un secundario por debajo de este porcentaje apenas influye: el tipo se considera puro. */
export const PURE_THRESHOLD = 10;
/** Diferencia (en puntos) por debajo de la cual dominante y secundario se consideran empatados. */
export const TIE_MARGIN = 3;

export function isPossibleType(dominant: Temperament, secondary: Temperament | null): boolean {
  return secondary === null || (secondary !== dominant && INCOMPATIBLE[dominant] !== secondary);
}

/** Los 12 tipos: 4 puros y 8 combinaciones posibles. */
export const ALL_TYPES: TypeCode[] = TEMPERAMENTS.flatMap((d) => [
  d as TypeCode,
  ...TEMPERAMENTS.filter((s) => isPossibleType(d, s) && s !== d).map((s) => `${d}-${s}` as TypeCode),
]);

export function parseType(code: TypeCode): { dominant: Temperament; secondary: Temperament | null } {
  const [d, s] = code.split('-') as [Temperament, Temperament | undefined];
  return { dominant: d, secondary: s ?? null };
}

/** Redondeo a porcentajes enteros que suman exactamente 100 (método del mayor resto). */
export function toPercent(scores: Record<Temperament, number>): Record<Temperament, number> {
  const total = TEMPERAMENTS.reduce((a, t) => a + Math.max(0, scores[t]), 0);
  if (total === 0) return { COL: 25, MEL: 25, SAN: 25, FLE: 25 };
  const raw = TEMPERAMENTS.map((t) => ({ t, v: (Math.max(0, scores[t]) / total) * 100 }));
  const floored = raw.map((r) => ({ ...r, f: Math.floor(r.v) }));
  let rest = 100 - floored.reduce((a, r) => a + r.f, 0);
  [...floored].sort((a, b) => b.v - b.f - (a.v - a.f)).forEach((r) => {
    if (rest > 0) {
      r.f += 1;
      rest -= 1;
    }
  });
  return Object.fromEntries(floored.map((r) => [r.t, r.f])) as Record<Temperament, number>;
}

export function resolveTemperament(
  scores: Record<Temperament, number>,
  meta: { testId: string; testVersion: string; takenAt?: string; source?: 'self' | 'estimated' },
): TemperamentResult {
  const percent = toPercent(scores);
  const ranked = [...TEMPERAMENTS].sort((a, b) => percent[b] - percent[a] || TEMPERAMENTS.indexOf(a) - TEMPERAMENTS.indexOf(b));
  const dominant = ranked[0];
  const candidates = ranked.filter((t) => t !== dominant && t !== INCOMPATIBLE[dominant]);
  const best = candidates[0];
  const secondary = percent[best] >= PURE_THRESHOLD ? best : null;
  const tie = secondary !== null && percent[dominant] - percent[secondary] <= TIE_MARGIN;
  const opposite = INCOMPATIBLE[dominant];
  const inconsistent = percent[opposite] > percent[best] && percent[opposite] >= PURE_THRESHOLD;

  return {
    testId: meta.testId,
    testVersion: meta.testVersion,
    takenAt: meta.takenAt ?? new Date().toISOString(),
    scores,
    percent,
    dominant,
    secondary,
    type: secondary ? `${dominant}-${secondary}` : dominant,
    challengeVirtue: CHALLENGE_VIRTUE[dominant],
    tie,
    inconsistent,
    source: meta.source ?? 'self',
  };
}
