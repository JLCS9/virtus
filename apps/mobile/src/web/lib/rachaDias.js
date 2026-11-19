// La racha del Camino y la tira de días (los dos anteriores, hoy y los cinco siguientes). Lógica pura,
// sin React ni red. Un día cuenta cuando el usuario ha aceptado su reto (`opcion` rellena en camino_dia).
//
// Fechas: 'YYYY-MM-DD' locales.

import { diaIso, sumarDias } from './camino.js';

const fechasHechas = (dias) => new Set(dias.filter((d) => d.opcion).map((d) => d.fecha));

/**
 * Días seguidos con un reto aceptado, contando hacia atrás desde hoy. Si hoy aún no lo ha aceptado, se
 * cuenta desde ayer: el día no ha terminado y no se rompe la racha hasta que pase.
 */
export function rachaDeCompromisos(dias, hoy) {
  const hechas = fechasHechas(dias);
  let cursor = hechas.has(hoy) ? hoy : sumarDias(hoy, -1);
  let n = 0;
  while (hechas.has(cursor)) { n += 1; cursor = sumarDias(cursor, -1); }
  return n;
}

/**
 * La tira de días: `antes` días anteriores, hoy y `despues` posteriores, en orden. Cada uno:
 * { fecha, dia (número del mes), diaSemana (ISO 1 lunes … 7 domingo), posicion ('pasado' | 'hoy' |
 * 'futuro'), hecho }.
 */
export function tiraDeDias(dias, hoy, { antes = 2, despues = 5 } = {}) {
  const hechas = fechasHechas(dias);
  const tira = [];
  for (let i = -antes; i <= despues; i += 1) {
    const fecha = sumarDias(hoy, i);
    tira.push({ fecha, dia: Number(fecha.slice(8)), diaSemana: diaIso(fecha), posicion: i < 0 ? 'pasado' : i === 0 ? 'hoy' : 'futuro', hecho: hechas.has(fecha) });
  }
  return tira;
}
