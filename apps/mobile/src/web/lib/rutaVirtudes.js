// El ciclo de virtud: se empieza por la virtud-desafío del usuario y las demás están bloqueadas hasta que haya
// pasado un mes con ella. Hoy la pantalla solo enseña la virtud en curso («Ciclo de humildad»), pero el orden
// y el desbloqueo se calculan aquí para cuando haya contenido de las demás. Lógica pura, sin React ni red.
//
// Fechas: 'YYYY-MM-DD' locales. Un día cuenta como «trabajado» desde el primero en que el usuario aceptó
// un reto (`opcion` rellena en camino_dia).

import { diferenciaDias } from './camino.js';

// Configuración del camino. Cuánto dura cada virtud no sale de los textos de Alex: se puede ajustar aquí.
export const RUTA = { dias_por_virtud: 30 };

// Orden de las demás virtudes tras la virtud-desafío: primero las del corazón y después las cuatro
// fundamentales (el orden de la propuesta de Virtus).
export const ORDEN_VIRTUDES = ['magnanimidad', 'humildad', 'prudencia', 'fortaleza', 'dominio_de_si', 'justicia'];

// Las virtudes-desafío de los 12 perfiles (account/challengeVirtues.js) y la virtud del camino a la que
// pertenecen: la humildad en sus tres formas, y audacia y resistencia son partes de la fortaleza.
const DESAFIO_A_VIRTUD = {
  humildad: 'humildad', humildad_fraterna: 'humildad', humildad_fundamental: 'humildad',
  audacia: 'fortaleza', resistencia: 'fortaleza', magnanimidad: 'magnanimidad',
};

/** 'humildad_fraterna' → 'humildad'. null si no se reconoce. */
export const virtudDeDesafio = (desafio) => DESAFIO_A_VIRTUD[desafio] ?? null;

/** El primer día en que el usuario aceptó un reto, o null si aún no ha aceptado ninguno. */
export function inicioDeLaRuta(dias) {
  const aceptados = dias.filter((d) => d.opcion).map((d) => d.fecha).sort();
  return aceptados[0] ?? null;
}

/**
 * Los bloques del camino, en orden. Cada uno: { virtud, estado, avance }.
 *  · 'actual'      la virtud-desafío, mientras no haya pasado el mes. `avance` va de 0 a 1.
 *  · 'completada'  la virtud-desafío, pasado el mes (`avance` 1).
 *  · 'bloqueada'   las demás, mientras no haya pasado el mes con la virtud-desafío.
 *  · 'disponible'  las demás, pasado el mes.
 * `avance` (0 a 1) es cuánto del ciclo ha pasado; la pantalla no enseña días ni plazos.
 * Sin virtud-desafío (no ha hecho el test) no hay camino: devuelve [].
 */
export function bloquesDeLaRuta({ desafio, inicio, hoy, config = RUTA }) {
  if (!desafio) return [];
  const total = config.dias_por_virtud;
  const transcurridos = inicio ? Math.max(0, diferenciaDias(inicio, hoy)) : 0;
  const pasado = Boolean(inicio) && transcurridos >= total;
  const avance = pasado ? 1 : transcurridos / total;

  return [desafio, ...ORDEN_VIRTUDES.filter((v) => v !== desafio)].map((virtud, i) => {
    if (i === 0) return { virtud, estado: pasado ? 'completada' : 'actual', avance };
    return { virtud, estado: pasado ? 'disponible' : 'bloqueada', avance: 0 };
  });
}
