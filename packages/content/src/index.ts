import type { BaseChallenge, Locale, TestDefinition, Temperament, TypeCode, ValidationRules, WorkVirtue } from '@virtus/method';

import retosEs from './es/retos.json';
import habitosEs from './es/habitos.json';
import temperamentosEs from './es/temperamentos.json';
import lexicoEs from './es/lexico.json';
import videosEs from './es/videos.json';
import modelosEs from './es/modelos.json';
import entornoEs from './es/entorno.json';
import lecturasEs from './es/lecturas.json';
import testTemperamentoEs from './es/test-temperamento.json';
import testCaracterEs from './es/test-caracter.json';

/** Uno de los cuatro temperamentos: arquetipo, valor y claves. */
export interface TemperamentCopy {
  nombre: string;
  arquetipo: string;
  valor: string;
  reactividad: string;
  fortalezas: string[];
  riesgos: string[];
  comunicar: string;
  desafio: WorkVirtue;
  claveDesafio: string;
  modelos: string[];
}

/** Uno de los 12 tipos (guía de Crecer con tu temperamento). */
export interface TypeCopy {
  nombre: string;
  fortaleza: string;
  debilidad: string;
  reto: { virtud: WorkVirtue; faceta: string | null };
}

export interface Video {
  id: string;
  youtubeId: string;
  titulo: string;
  canal: string;
  temas: string[];
  virtudes: string[];
}

export interface Model {
  id: string;
  nombre: string;
  años: string;
  ambito: string;
  lema: string;
  resumen: string;
  virtudes: string[];
  temperamento: Temperament | null;
}

export interface Reading {
  id: string;
  titulo: string;
  autor: string;
  virtudes: string[];
  intro: string;
  tarjetas: { titulo: string; texto: string }[];
  cierre: string;
  fuente: string;
}

export interface Environment {
  intro: string;
  secciones: { id: 'libros' | 'musica' | 'peliculas' | 'pinturas'; titulo: string; items: string[] }[];
  destacados: Record<string, string>;
  fuente: string;
}

export interface ContentBundle {
  locale: Locale;
  challenges: BaseChallenge[];
  habits: Record<string, string[]>;
  temperaments: Record<Temperament, TemperamentCopy>;
  types: Record<TypeCode, TypeCopy>;
  lexicon: ValidationRules;
  videos: Video[];
  models: Model[];
  environment: Environment;
  readings: Reading[];
  tests: { temperament: TestDefinition; character: TestDefinition };
}

const es: ContentBundle = {
  locale: 'es',
  challenges: retosEs as unknown as BaseChallenge[],
  habits: habitosEs,
  temperaments: temperamentosEs.temperamentos as unknown as Record<Temperament, TemperamentCopy>,
  types: temperamentosEs.tipos as unknown as Record<TypeCode, TypeCopy>,
  lexicon: lexicoEs,
  videos: videosEs,
  models: modelosEs.modelos as unknown as Model[],
  environment: entornoEs as unknown as Environment,
  readings: lecturasEs,
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

/** La virtud del ciclo encaja con una pieza etiquetada (audacia y resistencia cuentan como fortaleza). */
function matches(tags: string[], virtue: WorkVirtue): boolean {
  if (tags.includes(virtue)) return true;
  return (virtue === 'audacia' || virtue === 'resistencia') && tags.includes('fortaleza');
}

/** Modelos para una virtud, primero los del mismo temperamento dominante. */
export function modelsFor(content: ContentBundle, virtue: WorkVirtue, dominant?: Temperament | null): Model[] {
  const pool = content.models.filter((m) => matches(m.virtudes, virtue));
  const list = pool.length > 0 ? pool : content.models;
  return [...list].sort((a, b) => Number(b.temperamento === dominant) - Number(a.temperamento === dominant));
}

/** Modelo del día: rota entre los de la virtud, de forma determinista. */
export function modelOfDay(content: ContentBundle, virtue: WorkVirtue, dayIndex: number, dominant?: Temperament | null): Model {
  const list = modelsFor(content, virtue, dominant);
  return list[dayIndex % list.length];
}

export function videosFor(content: ContentBundle, virtue: WorkVirtue): Video[] {
  const list = content.videos.filter((v) => matches(v.virtudes, virtue));
  return list.length > 0 ? list : content.videos;
}

export function typeCopy(content: ContentBundle, code: TypeCode): TypeCopy {
  return content.types[code];
}
