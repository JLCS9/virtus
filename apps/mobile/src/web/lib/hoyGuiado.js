// Hoy guiado: qué te falta hacer hoy y en qué orden, para enseñártelo de uno en uno hasta que estés al día.
// Lógica pura, sin React ni red.
//
// Los pasos, en orden: 'iniciales' (las preguntas de la primera vez), 'frase' (la frase del día), 'reto'
// (aceptar el reto) y 'examen' (el examen de la noche). El examen solo cuenta como pendiente cuando ya toca:
// a partir de la hora de reflexión que la persona eligió en sus horarios. Antes, aunque haya aceptado el
// reto, está al día (puede hacerlo antes desde la pantalla principal).

export const HORA_EXAMEN_POR_DEFECTO = '21:30';

/** 'HH:MM' (o 'HH:MM:SS', como lo da Postgres) → minutos desde medianoche; null si no es una hora. */
export function aMinutos(hora) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(hora ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** ¿Ya es hora del examen? `ahora` es un Date (hora local del dispositivo); `hora` la de reflexión elegida. */
export function examenToca(ahora, hora = HORA_EXAMEN_POR_DEFECTO) {
  const limite = aMinutos(hora) ?? aMinutos(HORA_EXAMEN_POR_DEFECTO);
  return ahora.getHours() * 60 + ahora.getMinutes() >= limite;
}

/**
 * Los pasos que faltan hoy, en orden. Sin contenido que enseñar no hay pasos.
 *  · iniciales   si quedan preguntas iniciales por responder.
 *  · frase, reto si aún no ha aceptado el reto de hoy (la frase solo si hay una que enseñar).
 *  · examen      si ya toca y no lo ha hecho.
 */
export function pasosDeHoy({ hayContenido, inicialesPendientes = 0, hayCita = true, retoAceptado, examenHecho, examenToca: toca }) {
  if (!hayContenido) return [];
  const pasos = [];
  if (inicialesPendientes > 0) pasos.push('iniciales');
  if (!retoAceptado) {
    if (hayCita) pasos.push('frase');
    pasos.push('reto');
  }
  if (toca && !examenHecho) pasos.push('examen');
  return pasos;
}

/** El paso que toca ahora: el primero que falta, saltando la frase si ya se ha leído. null = al día. */
export function pasoActual(pasos, { fraseVista = false } = {}) {
  return pasos.find((p) => !(p === 'frase' && fraseVista)) ?? null;
}
