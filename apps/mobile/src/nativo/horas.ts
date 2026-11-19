// Horas de los avisos: de la hora local del usuario (en su zona horaria) a la hora del móvil. Puro, con pruebas.

// ── Zonas horarias ───────────────────────────────────────────────────────────

/** Minutos que la zona va por delante de UTC en ese instante (p. ej. Madrid en invierno: 60). */
function desfase(zona: string, instante: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instante);
  const v = (t: string) => Number(partes.find((p) => p.type === t)?.value);
  const comoUtc = Date.UTC(v('year'), v('month') - 1, v('day'), v('hour') % 24, v('minute'));
  return Math.round((comoUtc - Math.floor(instante.getTime() / 60000) * 60000) / 60000);
}

const SEMANA = 7 * 24 * 60;

/**
 * Pasa una hora local de `zona` (y, si se da, un día ISO 1 lunes … 7 domingo) a la hora del móvil.
 * Devuelve { hora, minuto, diaIso }.
 */
export function aHoraDelMovil(hhmm: string, zona: string, diaIso = 1, ahora = new Date()) {
  const [h, m] = hhmm.split(':').map(Number);
  let delta = 0;
  try {
    // Lo que el móvil va por delante de la zona del usuario (0 si están en la misma).
    delta = -ahora.getTimezoneOffset() - desfase(zona, ahora);
  } catch {
    delta = 0; // zona desconocida para el móvil: se toma la hora tal cual
  }
  const total = ((((diaIso - 1) * 1440 + h * 60 + m + delta) % SEMANA) + SEMANA) % SEMANA;
  return { diaIso: Math.floor(total / 1440) + 1, hora: Math.floor((total % 1440) / 60), minuto: total % 60 };
}

/** ISO (1 lunes … 7 domingo) → expo-notifications (1 domingo … 7 sábado). */
export const diaExpo = (diaIso: number) => (diaIso % 7) + 1;
