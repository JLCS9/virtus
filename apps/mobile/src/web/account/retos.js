// Retos diarios de carácter (método Havard), compartidos con la app Virtus.
// Toda la lógica vive en las Edge Functions retos-* del proyecto Supabase de Virtus;
// aquí solo se llaman. Solo con suscripción activa (public.suscripciones_retos): por defecto
// desactivada, se activa a mano. El servidor lo exige en cada llamada.
import { supabase } from './supabase';

export class RetosError extends Error {
  // `detalle`: texto técnico del fallo; el servidor solo lo manda a las cuentas de prueba.
  constructor(code, detalle = null) { super(code); this.code = code; this.detalle = detalle; }
}

/**
 * ¿Tiene esta cuenta la suscripción a Retos activa? (RLS: cada una solo ve su fila.)
 * Es solo para mostrar u ocultar la interfaz: quien manda es el servidor, que repite la comprobación
 * en cada función y responde 403 'sin_suscripcion' si no está activa.
 */
export async function tieneAccesoRetos() {
  if (!supabase) return false;
  const { data } = await supabase.from('suscripciones_retos').select('activa, hasta').maybeSingle();
  return Boolean(data?.activa && (!data.hasta || new Date(data.hasta) > new Date()));
}

/** Fecha local YYYY-MM-DD: el día del usuario, no el de UTC. */
export function fechaLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function llamar(fn, body) {
  const { data, error } = await supabase.functions.invoke(fn, { body, headers: { 'x-virtus-cliente': 'web' } });
  if (error) {
    const status = error.context?.status;
    let detalle = null;
    try { detalle = (await error.context.json())?.detalle ?? null; } catch { /* sin cuerpo */ }
    throw new RetosError(status === 403 ? 'forbidden' : status === 503 ? 'unavailable' : 'failed', detalle);
  }
  return data;
}

export const retoDeHoy = () => llamar('retos-manana', { fecha: fechaLocal() });
export const turnoNoche = (entrada) => llamar('retos-noche', { fecha: fechaLocal(), entrada });
export const turnoOnboarding = (texto) => llamar('retos-onboarding', { fecha: fechaLocal(), texto });

// Catálogo de Formación (cursos en vídeo). Solo con suscripción activa: lo sirve el servidor para
// que los títulos y los vídeos no viajen en la web pública.
export const catalogoFormacion = () => llamar('formacion-catalogo', {});
