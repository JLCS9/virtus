/**
 * Test de carácter oficial (6 virtudes), portado de characterScoring.js.
 * 68 respuestas en {-1, -0.5, 0, 0.5, 1}; cada pregunta pesa en una o varias de las
 * 12 facetas (aspecto pasivo y activo de cada virtud).
 */
import type { Virtue } from './types';

export interface CharacterFacet {
  key: string;
  virtue: string;
  role: 'passive' | 'active';
  label_key: string;
  denominator: number;
}
export interface CharacterVirtueDef {
  code: string;
  label_key: string;
  html_key: string;
  denominator: number;
  passive_facet: string;
  active_facet: string;
}
export interface CharacterTestData {
  facets: CharacterFacet[];
  virtues: CharacterVirtueDef[];
  questions: { code: string; text?: string; weights: number[] }[];
}

export const LIKERT_CHARACTER = [-1, -0.5, 0, 0.5, 1] as const;

/** Códigos del test oficial → virtudes de Virtus. */
export const CHARACTER_CODE: Record<string, Virtue> = {
  P: 'prudencia',
  C: 'fortaleza',
  S: 'dominio',
  J: 'justicia',
  M: 'magnanimidad',
  H: 'humildad',
};

export const STAGE_THRESHOLDS = { LOW_MAX: 40, MODERATE_MAX: 70 } as const;
export type CharacterStage = 'bajo' | 'moderado' | 'alto';

export function characterStage(pct: number): CharacterStage {
  if (pct < STAGE_THRESHOLDS.LOW_MAX) return 'bajo';
  if (pct < STAGE_THRESHOLDS.MODERATE_MAX) return 'moderado';
  return 'alto';
}

export interface VirtueScore {
  global: number;
  passive: number;
  active: number;
  stage: CharacterStage;
  passiveLabelKey: string;
  activeLabelKey: string;
  labelKey: string;
  textKey: string;
}

const pct = (raw: number, denom: number) => (denom ? Math.round(((raw / denom + 1) / 2) * 100 * 100) / 100 : 0);

export function scoreCharacter(answers: (number | null | undefined)[] | null | undefined, test: CharacterTestData): Record<Virtue, VirtueScore> {
  const n = test.questions.length;
  const padded = Array.from({ length: n }, (_, i) => {
    const v = answers?.[i];
    return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  });
  const raw = new Array(test.facets.length).fill(0);
  padded.forEach((a, q) => {
    if (a === 0) return;
    test.questions[q].weights.forEach((w, f) => {
      raw[f] += a * w;
    });
  });
  const idx = Object.fromEntries(test.facets.map((f, i) => [f.key, i]));
  const out = {} as Record<Virtue, VirtueScore>;
  for (const v of test.virtues) {
    const ip = idx[v.passive_facet];
    const ia = idx[v.active_facet];
    const fp = test.facets[ip];
    const fa = test.facets[ia];
    const global = pct(raw[ip] + raw[ia], fp.denominator + fa.denominator);
    out[CHARACTER_CODE[v.code]] = {
      global,
      passive: pct(raw[ip], fp.denominator),
      active: pct(raw[ia], fa.denominator),
      stage: characterStage(global),
      passiveLabelKey: fp.label_key,
      activeLabelKey: fa.label_key,
      labelKey: v.label_key,
      textKey: v.html_key,
    };
  }
  return out;
}

/** Perfil 0–100 por virtud (global redondeado), el formato que usa el resto de la app. */
export function characterGlobals(scores: Record<Virtue, VirtueScore>): Record<Virtue, number> {
  return Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.round(v.global)])) as Record<Virtue, number>;
}
