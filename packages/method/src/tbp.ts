/**
 * Test de temperamento oficial (TBP, virtuousleadership.com), portado de TestTBP.jsx.
 *  Etapa 1: 16 afirmaciones (4 por temperamento), verdadero/falso.
 *    «Verdadero» suma 1 a su temperamento; «falso» suma 0,5 al diagonal (incompatible).
 *  Desempate: si hay empate en cabeza, 2 afirmaciones más por temperamento empatado;
 *    si persiste, gana el que tuvo más «verdadero» en la etapa 1.
 *  Etapa 2: 6 afirmaciones del dominante; 3 suman hacia el secundario A y 3 hacia el B.
 *  Perfil puro si el margen de la etapa 1 es ≥ 2 y |etapa 2| ≤ 1.
 */
import { CHALLENGE_VIRTUE } from './temperament';
import type { Temperament, TemperamentResult, TypeCode } from './types';

export type TbpAnswer = 'SI' | 'NO';
export interface TbpItem {
  id: string;
  type: Temperament;
}
export type Scores = Record<Temperament, number>;

export const STAGE1_IDS: Record<Temperament, string[]> = {
  COL: ['COL1', 'COL2', 'COL3', 'COL4'],
  SAN: ['SAN1', 'SAN2', 'SAN3', 'SAN4'],
  MEL: ['MEL1', 'MEL2', 'MEL3', 'MEL4'],
  FLE: ['FLE1', 'FLE2', 'FLE3', 'FLE4'],
};

export const TIE_IDS: Record<Temperament, string[]> = {
  COL: ['TCOL1', 'TCOL2'],
  SAN: ['TSAN1', 'TSAN2'],
  MEL: ['TMEL1', 'TMEL2'],
  FLE: ['TFLE1', 'TFLE2'],
};

type Adj = 'A' | 'B';
export const STAGE2: Record<Temperament, { A: Temperament; B: Temperament; items: { id: string; adj: Adj }[] }> = {
  COL: { A: 'SAN', B: 'MEL', items: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `S2_C${n}`, adj: (n <= 3 ? 'A' : 'B') as Adj })) },
  SAN: { A: 'COL', B: 'FLE', items: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `S2_S${n}`, adj: (n <= 3 ? 'A' : 'B') as Adj })) },
  MEL: { A: 'COL', B: 'FLE', items: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `S2_M${n}`, adj: (n <= 3 ? 'A' : 'B') as Adj })) },
  FLE: { A: 'SAN', B: 'MEL', items: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `S2_F${n}`, adj: (n <= 3 ? 'A' : 'B') as Adj })) },
};

const DIAGONAL: Record<Temperament, Temperament> = { COL: 'FLE', FLE: 'COL', SAN: 'MEL', MEL: 'SAN' };
const TYPES: Temperament[] = ['COL', 'SAN', 'MEL', 'FLE'];

const TYPE_BY_ID: Record<string, Temperament> = Object.fromEntries(
  TYPES.flatMap((t) => [...STAGE1_IDS[t], ...TIE_IDS[t]].map((id) => [id, t])),
);

export type Rng = () => number;

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4 rondas de 4 (una por temperamento), sin repetir temperamento entre rondas consecutivas. */
export function buildStage1Order(rng: Rng = Math.random): TbpItem[] {
  const slots = Object.fromEntries(TYPES.map((t) => [t, shuffle([0, 1, 2, 3], rng)])) as Record<Temperament, number[]>;
  const out: TbpItem[] = [];
  for (let r = 0; r < 4; r++) {
    const round = shuffle(TYPES, rng);
    if (r > 0 && out.length && round[0] === out[out.length - 1].type) {
      const swap = 1 + Math.floor(rng() * 3);
      [round[0], round[swap]] = [round[swap], round[0]];
    }
    for (const t of round) out.push({ id: STAGE1_IDS[t][slots[t][r]], type: t });
  }
  return out;
}

export function buildTieOrder(tied: Temperament[], rng: Rng = Math.random): TbpItem[] {
  return shuffle(
    tied.flatMap((t) => TIE_IDS[t].map((id) => ({ id, type: t }))),
    rng,
  );
}

export function buildStage2Order(primary: Temperament, rng: Rng = Math.random) {
  return shuffle(STAGE2[primary].items, rng);
}

export function applyAnswers(items: TbpItem[], answers: (TbpAnswer | undefined)[]): Scores {
  const scores: Scores = { COL: 0, SAN: 0, MEL: 0, FLE: 0 };
  items.forEach((item, i) => {
    const a = answers[i];
    if (!a) return;
    const t = TYPE_BY_ID[item.id];
    if (a === 'SI') scores[t] += 1;
    else scores[DIAGONAL[t]] += 0.5;
  });
  return scores;
}

export function mergeScores(a: Scores, b: Scores): Scores {
  return { COL: a.COL + b.COL, SAN: a.SAN + b.SAN, MEL: a.MEL + b.MEL, FLE: a.FLE + b.FLE };
}

export function topAndMargin(scores: Scores) {
  const entries = (Object.entries(scores) as [Temperament, number][]).sort((a, b) => b[1] - a[1]);
  const tiedTypes = entries.filter(([, v]) => v === entries[0][1]).map(([k]) => k);
  return { top: entries[0][0], margin: entries[0][1] - entries[1][1], tiedTypes };
}

/** Si el desempate no deshace el empate: gana el que tuvo más «verdadero» en la etapa 1. */
export function breakTie(tied: Temperament[], stage1: TbpItem[], stage1Answers: (TbpAnswer | undefined)[]): Temperament {
  const yes: Scores = { COL: 0, SAN: 0, MEL: 0, FLE: 0 };
  stage1.forEach((item, i) => {
    if (stage1Answers[i] === 'SI') yes[TYPE_BY_ID[item.id]] += 1;
  });
  return tied.reduce((best, t) => (yes[t] > yes[best] ? t : best), tied[0]);
}

export function stage2Score(items: { adj: Adj }[], answers: (TbpAnswer | undefined)[]): number {
  return items.reduce((s, item, i) => (answers[i] === 'SI' ? s + (item.adj === 'A' ? 1 : -1) : s), 0);
}

export interface TbpDecision {
  key: TypeCode;
  isPure: boolean;
  margin: number;
  score2: number;
  secondary: Temperament | null;
}

export function decideProfile(primary: Temperament, scores: Scores, score2: number): TbpDecision {
  const { margin } = topAndMargin(scores);
  const cfg = STAGE2[primary];
  if (margin >= 2 && Math.abs(score2) <= 1) return { key: primary, isPure: true, margin, score2, secondary: null };
  const secondary = score2 > 0 ? cfg.A : score2 < 0 ? cfg.B : scores[cfg.A] >= scores[cfg.B] ? cfg.A : cfg.B;
  return { key: `${primary}-${secondary}` as TypeCode, isPure: false, margin, score2, secondary };
}

/** Resultado en el formato de Virtus. Intensidad del secundario: «marcada» si |etapa 2| = 3. */
export function toTemperamentResult(
  primary: Temperament,
  scores: Scores,
  decision: TbpDecision,
  meta: { testId: string; testVersion: string; takenAt?: string; source?: TemperamentResult['source'] },
): TemperamentResult {
  return {
    testId: meta.testId,
    testVersion: meta.testVersion,
    takenAt: meta.takenAt ?? new Date().toISOString(),
    scores,
    dominant: primary,
    secondary: decision.secondary,
    type: decision.key,
    isPure: decision.isPure,
    secondaryStrength: decision.isPure ? null : Math.abs(decision.score2) === 3 ? 'marcada' : 'ligera',
    challengeVirtue: CHALLENGE_VIRTUE[primary],
    source: meta.source ?? 'self',
  };
}
