import type { TFunction } from 'i18next';

import type { Temperament, TemperamentResult } from '@virtus/method';

/** «Colérico-sanguíneo» o «Melancólico» para un tipo puro. */
export function typeName(t: TFunction, r: Pick<TemperamentResult, 'dominant' | 'secondary'>): string {
  const d = t(`temperamentos.${r.dominant}`);
  return r.secondary ? `${d}-${t(`temperamentos.${r.secondary}`).toLowerCase()}` : d;
}

export function temperamentName(t: TFunction, x: Temperament): string {
  return t(`temperamentos.${x}`);
}
