/**
 * Retos diarios de carácter (método Havard). El servidor (Edge Functions retos-*) decide y redacta;
 * sin sesión, sin perfil de retos o sin red, el reto sale del mismo motor en el dispositivo con la
 * biblioteca de 113 retos, y el examen de la noche es el formulario local.
 */
import { retos as R, type DayRecord, type TemperamentResult } from '@virtus/method';
import biblioteca from '@virtus/content/src/es/retos-havard.json';

import { supabase } from '@/lib/supabase';

const RETOS = biblioteca.retos as unknown as R.Reto[];
const DISPARADORES = biblioteca.disparadores as R.Disparador[];

export type EstadoRetos = 'servidor' | 'sin_perfil' | 'sin_sesion' | 'sin_servicio';

export interface RetoMostrado {
  retoId: string;
  texto: string;
  porque: string;
  virtud: R.VirtudClave;
}

export function fechaLocal(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function conSesion(): Promise<boolean> {
  if (!supabase) return false;
  return !!(await supabase.auth.getSession()).data.session;
}

async function invocar<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase!.functions.invoke<T>(fn, { body, headers: { 'x-virtus-cliente': 'app' } });
  if (error || !data) throw error ?? new Error('sin datos');
  return data;
}

/** Reto del día desde el servidor; null + estado si hay que usar el respaldo local. */
export async function retoDelServidor(fecha: string): Promise<{ estado: EstadoRetos; reto: RetoMostrado | null }> {
  if (!(await conSesion())) return { estado: 'sin_sesion', reto: null };
  try {
    const r = await invocar<{ perfil: boolean; reto?: { reto_id: string; reto: string; porque: string; virtud: R.VirtudClave } }>(
      'retos-manana',
      { fecha },
    );
    if (!r.perfil || !r.reto) return { estado: 'sin_perfil', reto: null };
    return { estado: 'servidor', reto: { retoId: r.reto.reto_id, texto: r.reto.reto, porque: r.reto.porque, virtud: r.reto.virtud } };
  } catch {
    return { estado: 'sin_servicio', reto: null };
  }
}

/** Respaldo en el dispositivo: el mismo motor, con niveles neutros y el historial local. */
export function retoLocal(temperament: TemperamentResult, records: Record<string, DayRecord>, fecha: string): RetoMostrado | null {
  const dominante = R.TEMPERAMENTO_DE_CODIGO[temperament.dominant];
  const secundario = temperament.secondary ? R.TEMPERAMENTO_DE_CODIGO[temperament.secondary] : null;
  const ids = new Set(RETOS.map((r) => r.id));
  const historial: R.DiaRegistro[] = Object.values(records)
    .filter((d) => d.challenge && ids.has(d.challenge.baseId) && d.date < fecha)
    .map((d) => ({
      fecha: d.date,
      reto_id: d.challenge!.baseId,
      resultado: d.exam?.challengeDone === 'si' ? 'si' : d.exam?.challengeDone === 'en_parte' ? 'a_medias' : d.exam?.challengeDone === 'no' ? 'no' : null,
      tipo_fallo: d.exam?.secondPrevailed === false ? 'reaccion' : null,
      obstaculos: [],
      reescrito_por_usuario: false,
    }));
  const [c] = R.candidatos({
    perfil: { temperamento_dominante: dominante, temperamento_secundario: secundario },
    niveles: Object.fromEntries(R.VIRTUDES_CLAVE.map((v) => [v, 3])) as R.Niveles,
    historial,
    hoy: fecha,
    manana: null,
    retos: RETOS,
    disparadores: DISPARADORES,
  });
  if (!c) return null;
  return {
    retoId: c.reto_id,
    texto: c.texto,
    porque: `Trabajas la ${R.NOMBRE_VIRTUD[c.virtud]}: ${R.razonTemperamento(dominante, c.virtud)}.`,
    virtud: c.virtud,
  };
}

// ── Conversaciones (noche y onboarding) ─────────────────────────────────────────
export type Boton = R.Boton;
export interface RespuestaNoche {
  mensaje: string;
  paso: number;
  prisa: boolean;
  botones: Boton[];
  cerrada: boolean;
  crisis: boolean;
}

export const turnoNoche = (entrada: R.EntradaNoche | null) =>
  invocar<RespuestaNoche>('retos-noche', { fecha: fechaLocal(), entrada });

export const turnoOnboarding = (texto: string | null) =>
  invocar<{ mensaje: string; terminado: boolean; crisis: boolean }>('retos-onboarding', { fecha: fechaLocal(), texto });

const VIRTUD_POR_RETO = new Map(RETOS.map((r) => [r.id, R.virtudClave(r)]));
/** Virtud (8 claves) de un reto de la biblioteca Havard, o null si el id no es de ella. */
export const virtudDeReto = (id: string): R.VirtudClave | null => VIRTUD_POR_RETO.get(id) ?? null;
