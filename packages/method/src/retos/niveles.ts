/**
 * Actualización de niveles (03 §3.2). Se ejecuta tras EXTRAER_EXAMEN, nunca la decide el modelo.
 */
import type { DiaRegistro, Resultado, TipoFallo } from './tipos.ts';

export const MAX_CAMBIO_DIARIO = 0.3;

export function delta(resultado: Resultado | null, tipoFallo: TipoFallo | null): number {
  if (resultado === 'si') return 0.15;
  if (resultado === 'a_medias') return 0.05;
  if (resultado === 'no') return tipoFallo === 'decision' ? -0.1 : 0.0; // la primera reacción no baja el nivel
  return 0.0;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export interface NuevoNivel {
  nivel: number;
  confianza: number;
}

/**
 * @param actual     nivel vigente de la virtud del reto
 * @param historial  niveles diarios previos de esa virtud (los más recientes al final; se usan 13)
 */
export function actualizarNivel(
  actual: number,
  confianza: number,
  historial: number[],
  resultado: Resultado | null,
  tipoFallo: TipoFallo | null,
): NuevoNivel {
  const d = clamp(delta(resultado, tipoFallo), -MAX_CAMBIO_DIARIO, MAX_CAMBIO_DIARIO);
  const ventana = [...historial.slice(-13), actual + d];
  const media = ventana.reduce((s, x) => s + x, 0) / ventana.length;
  // Nunca más de 0,3 puntos por día (02, validaciones del orquestador).
  const acotado = clamp(media, actual - MAX_CAMBIO_DIARIO, actual + MAX_CAMBIO_DIARIO);
  return { nivel: clamp(round3(acotado), 1, 5), confianza: Math.min(1.0, round3(confianza + 0.05)) };
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

/**
 * Si >85 % de los últimos 14 días son «sí», el objetivo sube a nivel + 1,5 (redondeado).
 * Se exige al menos una semana de registro para no subir con uno o dos días.
 */
export function objetivoIntensidad(nivel: number, ultimos14: DiaRegistro[]): number {
  const si = ultimos14.filter((d) => d.resultado === 'si').length;
  if (ultimos14.length >= 7 && si / ultimos14.length > 0.85) return Math.min(5, Math.round(nivel + 1.5));
  return Math.min(5, nivel + 1);
}

/** Veces que aparece cada obstáculo en los días dados. */
export function contarObstaculos(dias: DiaRegistro[]): Map<string, number> {
  const n = new Map<string, number>();
  for (const d of dias) for (const o of d.obstaculos ?? []) n.set(o, (n.get(o) ?? 0) + 1);
  return n;
}

/** Obstáculos que aparecen 3 o más veces en los últimos 14 días. */
export function obstaculosRecurrentes(ultimos14: DiaRegistro[]): Set<string> {
  return new Set([...contarObstaculos(ultimos14)].filter(([, c]) => c >= 3).map(([o]) => o));
}
