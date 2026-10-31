export * from './types';
export * from './temperament';
export * from './testEngine';
export * from './challenges';
export * from './validator';
export * from './practice';
export * from './cycle';
export * from './tbp';
export * from './character';
export * from './heart';
// El módulo de retos (biblioteca, motor, prompts, orquestador) NO se exporta aquí: es solo del servidor
// (Edge Functions y tests lo importan por ruta) y no debe viajar dentro de la app.
