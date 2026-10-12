/**
 * Motor de tests genérico: un test es datos (preguntas, escala, reglas de puntuación, versión).
 * El equipo de contenido ajusta o traduce los tests sin tocar código.
 */
import type { Locale } from './types';

export type TestKind = 'temperament' | 'character' | 'heart';

export interface TestOption {
  id: string;
  label: string;
  /** Puntos que suma esta opción a cada dimensión (p. ej. { COL: 1 } o { humildad: 1 }). */
  weights: Record<string, number>;
}

export interface ChoiceItem {
  id: string;
  type: 'choice';
  prompt: string;
  options: TestOption[];
}

export interface LikertItem {
  id: string;
  type: 'likert';
  prompt: string;
  /** Dimensión que mide el ítem. */
  dimension: string;
  /** Ítem invertido: puntuar alto resta. */
  reverse?: boolean;
  /** Enunciado para la mirada de otra persona (tercera persona). */
  promptOther?: string;
}

export type TestItem = ChoiceItem | LikertItem;

export interface TestDefinition {
  id: string;
  kind: TestKind;
  version: string;
  locale: Locale;
  /** BORRADOR: contenido provisional, nunca publicable. */
  status: 'draft' | 'approved';
  title: string;
  intro: string;
  dimensions: string[];
  likertScale?: { min: number; max: number; labels: string[] };
  items: TestItem[];
  source: string;
}

/** Respuestas: id de ítem → id de opción (choice) o valor numérico (likert). */
export type Answers = Record<string, string | number>;

export function scoreTest(test: TestDefinition, answers: Answers): Record<string, number> {
  const scores: Record<string, number> = Object.fromEntries(test.dimensions.map((d) => [d, 0]));
  const scale = test.likertScale ?? { min: 1, max: 5, labels: [] };
  for (const item of test.items) {
    const answer = answers[item.id];
    if (answer === undefined) continue;
    if (item.type === 'choice') {
      const option = item.options.find((o) => o.id === answer);
      if (!option) continue;
      for (const [dim, w] of Object.entries(option.weights)) {
        if (dim in scores) scores[dim] += w;
      }
    } else {
      const v = Number(answer);
      if (Number.isNaN(v)) continue;
      const clamped = Math.min(scale.max, Math.max(scale.min, v));
      const normalized = item.reverse ? scale.max + scale.min - clamped : clamped;
      if (item.dimension in scores) scores[item.dimension] += normalized - scale.min;
    }
  }
  return scores;
}

export function isComplete(test: TestDefinition, answers: Answers): boolean {
  return test.items.every((i) => answers[i.id] !== undefined);
}

/** Máximo alcanzable por dimensión en un test Likert (para normalizar a 0–100). */
export function likertMax(test: TestDefinition): Record<string, number> {
  const scale = test.likertScale ?? { min: 1, max: 5, labels: [] };
  const max: Record<string, number> = Object.fromEntries(test.dimensions.map((d) => [d, 0]));
  for (const item of test.items) {
    if (item.type === 'likert' && item.dimension in max) max[item.dimension] += scale.max - scale.min;
  }
  return max;
}
