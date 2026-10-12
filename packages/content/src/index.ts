import type { BaseChallenge, Locale, TestDefinition, Temperament, ValidationRules, WorkVirtue } from '@virtus/method';

import retosEs from './es/retos.json';
import habitosEs from './es/habitos.json';
import temperamentosEs from './es/temperamentos.json';
import lexicoEs from './es/lexico.json';
import fragmentosEs from './es/fragmentos.json';
import testTemperamentoEs from './es/test-temperamento.json';
import testCaracterEs from './es/test-caracter.json';

export interface TemperamentCopy {
  nombre: string;
  rasgos: string;
  fortalezas: string[];
  riesgo: string;
  desafio: string;
}

export interface Fragment {
  id: string;
  author: string;
  text: string;
  source: string;
  virtues: string[];
  status: 'draft' | 'approved';
}

export interface ContentBundle {
  locale: Locale;
  challenges: BaseChallenge[];
  habits: Record<string, string[]>;
  temperaments: Record<Temperament, TemperamentCopy>;
  lexicon: ValidationRules;
  fragments: Fragment[];
  tests: { temperament: TestDefinition; character: TestDefinition };
}

const es: ContentBundle = {
  locale: 'es',
  challenges: retosEs as unknown as BaseChallenge[],
  habits: habitosEs,
  temperaments: temperamentosEs as unknown as Record<Temperament, TemperamentCopy>,
  lexicon: lexicoEs,
  fragments: fragmentosEs as unknown as Fragment[],
  tests: {
    temperament: testTemperamentoEs as unknown as TestDefinition,
    character: testCaracterEs as unknown as TestDefinition,
  },
};

const bundles: Partial<Record<Locale, ContentBundle>> = { es };

/** Contenido por idioma; fr/en caen al español hasta que se traduzcan. */
export function getContent(locale: Locale): ContentBundle {
  return bundles[locale] ?? es;
}

export function habitsFor(content: ContentBundle, virtue: WorkVirtue): string[] {
  return content.habits[virtue] ?? [];
}

/** Fragmento del día para una virtud, determinista por fecha. */
export function fragmentFor(content: ContentBundle, virtue: WorkVirtue, dayIndex: number): Fragment {
  const pool = content.fragments.filter((f) => f.virtues.length === 0 || f.virtues.includes(virtue));
  return pool[dayIndex % pool.length];
}
