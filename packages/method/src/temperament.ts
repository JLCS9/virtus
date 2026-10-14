import { TEMPERAMENTS, type Temperament, type TypeCode, type WorkVirtue } from './types';

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
