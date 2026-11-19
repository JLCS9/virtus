// Lógica pura de los hábitos del Camino: estados, transiciones, límites y avance. Sin React ni red.
// Los números (máximo de activos, días de prueba, ventana, mínimo semanal…) NO están aquí: vienen de la
// hoja Hábitos de la biblioteca (`biblioteca.habitos`) y se pasan como `config`.
//
// Estados: en_prueba → activo → consolidado | en_revision;  retirado (el usuario lo deja) y vuelta atrás.
// Fechas: 'YYYY-MM-DD' locales. `fechas` es el conjunto de días marcados de UN hábito (Set de textos).

import { diaIso, diferenciaDias, sumarDias } from './camino.js';

export const VIRTUDES_HABITO = ['humildad', 'magnanimidad', 'prudencia', 'dominio_de_si', 'fortaleza', 'justicia'];

// Los retos traen su «virtud-desafío» con otros nombres: audacia y resistencia son partes de la fortaleza.
const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const VIRTUD_DE_RETO = {
  humildad: 'humildad', magnanimidad: 'magnanimidad', prudencia: 'prudencia', justicia: 'justicia', fortaleza: 'fortaleza',
  'dominio de si': 'dominio_de_si', audacia: 'fortaleza', 'resistencia y persistencia': 'fortaleza',
};

/** 'Audacia' → 'fortaleza'. null si no se reconoce. */
export const virtudDeReto = (virtud) => VIRTUD_DE_RETO[sinAcentos(String(virtud ?? ''))] ?? null;

// ───────────── Qué hábitos cuentan ─────────────

/** Los que ocupan sitio en la lista (el máximo cuenta estos) y tienen casilla diaria. */
export const ESTADOS_ACTIVOS = ['en_prueba', 'activo', 'en_revision'];
export const tieneCasilla = (habito) => ESTADOS_ACTIVOS.includes(habito.estado);

/** ¿Cabe uno más? Los consolidados y los retirados no ocupan sitio. */
export const puedeAnadir = (habitos, config) => habitos.filter(tieneCasilla).length < config.max_activos;

// ───────────── Alta desde un reto ─────────────

/** «Hoy, antes de cada decisión…» → «Antes de cada decisión…»: la opción B escrita como acto repetible. */
export function textoDeHabito(texto) {
  const sin = texto.replace(/^hoy[,\s]+/i, '').trim();
  return sin.charAt(0).toUpperCase() + sin.slice(1);
}

/**
 * ¿Se ofrece añadir a los hábitos la opción B de hoy? Solo tras cumplirla (sí o a medias) y cerrado el
 * examen; si aún no lo es de ese reto y hay sitio. Con el máximo alcanzado la opción B sigue siendo un
 * reto de un día y no se ofrece nada.
 */
export function ofrecerAlta({ dia, reto, habitos, config }) {
  if (!dia || dia.opcion !== 'habito' || !dia.examen_en || !['si', 'a_medias'].includes(dia.cumplido)) return false;
  if (habitos.some((h) => h.reto_id === reto.id && h.estado !== 'retirado')) return false;
  return puedeAnadir(habitos, config);
}

// ───────────── Marcas y avance ─────────────

/** Los días marcados de un hábito, como Set. `marcas` son filas de habito_marcas. */
export const fechasDe = (marcas, habitoId) => new Set(marcas.filter((m) => m.habito_id === habitoId).map((m) => m.fecha));

const contar = (fechas, desde, hasta) => [...fechas].filter((f) => f >= desde && f <= hasta).length;

/** Lunes de la semana de `fecha`. */
export const inicioSemana = (fecha) => sumarDias(fecha, 1 - diaIso(fecha));

/**
 * Avance de un hábito hoy: días marcados esta semana (lunes a domingo) y en la ventana móvil de los
 * últimos `dias_ventana` días, lo que falta de la prueba y el objetivo para consolidar.
 */
export function avance(habito, fechas, hoy, config) {
  return {
    semana: contar(fechas, inicioSemana(hoy), hoy),
    ventana: contar(fechas, sumarDias(hoy, -(config.dias_ventana - 1)), hoy),
    objetivo: config.dias_consolidar,
    diasDePrueba: Math.max(0, config.dias_prueba - diferenciaDias(habito.alta_en, hoy)),
  };
}

// ───────────── Cambios de estado automáticos ─────────────

// Las `semanas_bajo` últimas semanas completas (lunes a domingo, sin contar la actual), ¿todas por
// debajo del mínimo? Solo cuentan las que empezaron cuando el hábito ya estaba activo.
function semanasPorDebajo(habito, fechas, hoy, config) {
  const lunes = inicioSemana(hoy);
  for (let k = 1; k <= config.semanas_bajo; k += 1) {
    const inicio = sumarDias(lunes, -7 * k);
    if (inicio < habito.estado_desde) return false;
    if (contar(fechas, inicio, sumarDias(inicio, 6)) >= config.min_semana) return false;
  }
  return true;
}

/**
 * Si el hábito debe cambiar de estado hoy, devuelve { estado, estado_desde }; si no, null.
 *  · en_prueba → activo al pasar los días de prueba.
 *  · activo → consolidado al cumplir `dias_consolidar` de los últimos `dias_ventana` días.
 *  · activo → en_revision tras `semanas_bajo` semanas seguidas por debajo de `min_semana`.
 * Consolidar manda sobre revisar. Los demás estados solo cambian por decisión del usuario.
 */
export function cambioDeEstado(habito, fechas, hoy, config) {
  if (habito.estado === 'en_prueba') {
    return diferenciaDias(habito.alta_en, hoy) >= config.dias_prueba
      ? { estado: 'activo', estado_desde: sumarDias(habito.alta_en, config.dias_prueba) }
      : null;
  }
  if (habito.estado === 'activo') {
    if (avance(habito, fechas, hoy, config).ventana >= config.dias_consolidar) return { estado: 'consolidado', estado_desde: hoy };
    if (semanasPorDebajo(habito, fechas, hoy, config)) return { estado: 'en_revision', estado_desde: hoy };
  }
  return null;
}

// ───────────── Decisiones del usuario ─────────────

/**
 * Lo que se guarda al decidir sobre un hábito:
 *  · 'dejar'      → retirado (queda en el historial).
 *  · 'mantener'   → vuelve a activo, y las semanas bajas anteriores ya no cuentan.
 *  · 'ajustar'    → igual, con el texto nuevo (no se reinicia la cuenta).
 *  · 'recuperar'  → un retirado vuelve a «en prueba» desde hoy.
 */
export function decision(accion, hoy, texto) {
  switch (accion) {
    case 'dejar': return { estado: 'retirado', estado_desde: hoy };
    case 'mantener': return { estado: 'activo', estado_desde: hoy };
    case 'ajustar': return { estado: 'activo', estado_desde: hoy, texto: texto.trim() };
    case 'recuperar': return { estado: 'en_prueba', alta_en: hoy, estado_desde: hoy };
    default: throw new Error(`decisión desconocida: ${accion}`);
  }
}
