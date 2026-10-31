/**
 * Retos diarios de carácter (método Havard). Solo con SUSCRIPCIÓN ACTIVA a Retos (por defecto
 * desactivada; se activa a mano). Toda la lógica vive en el servidor (Edge Functions retos-*, que
 * repiten la comprobación): ni la biblioteca de retos, ni el motor, ni los prompts viajan en la app.
 * Sin suscripción, la app se comporta como antes de los retos.
 */
import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';

export type EstadoRetos = 'servidor' | 'sin_perfil' | 'sin_sesion' | 'sin_suscripcion' | 'sin_servicio';

/** Las 8 claves de nivel del servidor → la virtud del ciclo de la app. */
export const VIRTUD_CICLO: Record<string, string> = {
  prudencia: 'prudencia',
  fortaleza_audacia: 'audacia',
  fortaleza_resistencia: 'resistencia',
  dominio_de_si: 'dominio',
  justicia: 'justicia',
  magnanimidad: 'magnanimidad',
  humildad_fundamental: 'humildad',
  humildad_fraternal: 'humildad',
};

export interface RetoMostrado {
  retoId: string;
  texto: string;
  porque: string;
  /** Una de las 8 claves de nivel. */
  virtud: string;
}

export function fechaLocal(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Pregunta al servidor si la cuenta tiene la suscripción activa (solo lee su propia fila) y lo
 * guarda. Sin sesión, la respuesta es «inactiva». Si no hay red se deja lo último que se supo.
 */
export async function refrescarSuscripcionRetos(): Promise<void> {
  const { setRetosSuscripcion } = useVirtus.getState();
  if (!supabase) return setRetosSuscripcion('inactiva');
  try {
    const { data: sesion } = await supabase.auth.getSession();
    if (!sesion.session) return setRetosSuscripcion('inactiva');
    const { data, error } = await supabase.from('suscripciones_retos').select('activa, hasta').maybeSingle();
    if (error) return; // sin red o error: no se cambia lo último conocido
    const activa = !!data?.activa && (!data.hasta || new Date(data.hasta) > new Date());
    setRetosSuscripcion(activa ? 'activa' : 'inactiva');
  } catch {
    /* sin red: se deja lo último conocido */
  }
}

async function invocar<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase!.functions.invoke<T>(fn, { body, headers: { 'x-virtus-cliente': 'app' } });
  if (error || !data) throw error ?? new Error('sin datos');
  return data;
}

/** Reto del día desde el servidor. Si no se puede, dice por qué y la app usa su reto de siempre. */
export async function retoDelServidor(fecha: string): Promise<{ estado: EstadoRetos; reto: RetoMostrado | null }> {
  if (!supabase || !(await supabase.auth.getSession()).data.session) return { estado: 'sin_sesion', reto: null };
  try {
    const r = await invocar<{ perfil: boolean; reto?: { reto_id: string; reto: string; porque: string; virtud: string } }>('retos-manana', { fecha });
    if (!r.perfil || !r.reto) return { estado: 'sin_perfil', reto: null };
    return { estado: 'servidor', reto: { retoId: r.reto.reto_id, texto: r.reto.reto, porque: r.reto.porque, virtud: r.reto.virtud } };
  } catch (e) {
    // El servidor dice 403 cuando la suscripción no está activa (se pudo desactivar desde que se supo).
    const status = (e as { context?: { status?: number } })?.context?.status;
    return { estado: status === 403 ? 'sin_suscripcion' : 'sin_servicio', reto: null };
  }
}

// ── Conversaciones (noche y onboarding) ─────────────────────────────────────────
export type Boton = 'listo' | 'si' | 'a_medias' | 'no' | 'reaccion' | 'decision' | 'prisa' | 'aceptar' | 'parar';
export type EntradaNoche = { tipo: 'texto'; texto: string } | { tipo: 'boton'; valor: Boton };

export interface RespuestaNoche {
  mensaje: string;
  paso: number;
  prisa: boolean;
  botones: Boton[];
  cerrada: boolean;
  crisis: boolean;
}

export const turnoNoche = (entrada: EntradaNoche | null) =>
  invocar<RespuestaNoche>('retos-noche', { fecha: fechaLocal(), entrada });

export const turnoOnboarding = (texto: string | null) =>
  invocar<{ mensaje: string; terminado: boolean; crisis: boolean }>('retos-onboarding', { fecha: fechaLocal(), texto });
