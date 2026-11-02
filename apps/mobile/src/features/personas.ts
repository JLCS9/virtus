/**
 * Fichas de personas del Camino (personas, persona_estimaciones, persona_observaciones en el Supabase
 * de Virtus, las mismas que usa la web). RLS: cada cuenta solo ve y toca sus fichas. Son datos de
 * terceros: solo los ve la propia cuenta. Sustituyen al antiguo «Círculo» de la app: lo que hubiera en
 * él se pasa una vez a fichas al entrar con la cuenta (ver `migrarCirculo`).
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import { parseType, type Role } from '@virtus/method';

import { supabase } from '@/lib/supabase';
import type { Temp } from '@/lib/camino';
import { type Desempate, type Grupo, type Observacion, type Persona, type Puntuacion, esMenorDe18 } from '@/lib/personas';
import { useVirtus, type CollaboratorBox } from '@/store/virtus';
import { usuarioId } from './camino';

export class PersonasError extends Error {}

const comprobar = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
  if (error) throw new PersonasError(error.message);
  return data;
};
/** Para `.single()`: si no hay error, hay fila. */
const fila = <T>(r: { data: T; error: { message: string } | null }) => comprobar(r) as NonNullable<T>;
const ahora = () => new Date().toISOString();

async function cuenta() {
  const id = await usuarioId();
  if (!supabase || !id) throw new PersonasError('sin_sesion');
  return { db: supabase, userId: id };
}

export async function listarPersonas(): Promise<Persona[]> {
  const { db } = await cuenta();
  return comprobar(await db.from('personas').select('*').order('creado_en')) ?? [];
}

export async function leerPersona(id: string): Promise<{ persona: Persona | null; observaciones: Observacion[] }> {
  const { db } = await cuenta();
  const [persona, observaciones] = await Promise.all([
    db.from('personas').select('*').eq('id', id).maybeSingle(),
    db.from('persona_observaciones').select('*').eq('persona_id', id).order('creado_en', { ascending: false }),
  ]);
  return { persona: comprobar(persona), observaciones: comprobar(observaciones) ?? [] };
}

export interface DatosFicha {
  nombre: string;
  grupo: Grupo;
  relacion: string | null;
  avatar: string | null;
  estrella: boolean;
  me_cuesta: boolean;
}

export type Estimacion = Puntuacion & { respuestas: string[]; desempate: Desempate | null };

function camposDeEstimacion(e: Estimacion | null) {
  if (!e) return {};
  return {
    estado: (e.primario ? 'estimado' : 'sin_estimar') as Persona['estado'],
    primario: e.primario,
    secundario: e.secundario,
    confianza: e.confianza,
    puntos: e.puntos,
  };
}

/** Crea la ficha y, si hubo test, guarda la estimación. Devuelve la ficha. */
export async function crearPersona(datos: DatosFicha, estimacion: Estimacion | null): Promise<Persona> {
  const { db, userId } = await cuenta();
  const persona: Persona = fila(await db.from('personas').insert({ user_id: userId, ...datos, ...camposDeEstimacion(estimacion) }).select().single());
  if (estimacion) await guardarEstimacion(persona.id, estimacion, { soloHistorial: true });
  return persona;
}

/** Guarda un test sobre la persona (historial) y actualiza su temperamento estimado. */
export async function guardarEstimacion(personaId: string, e: Estimacion, { soloHistorial = false } = {}) {
  const { db, userId } = await cuenta();
  comprobar(
    await db.from('persona_estimaciones').insert({
      persona_id: personaId,
      user_id: userId,
      respuestas: e.respuestas,
      desempate: e.desempate ?? null,
      puntos: e.puntos,
      primario: e.primario,
      secundario: e.secundario,
      confianza: e.confianza,
    }),
  );
  if (!soloHistorial) await actualizarPersona(personaId, camposDeEstimacion(e));
}

export async function actualizarPersona(id: string, campos: Partial<Persona>): Promise<Persona> {
  const { db } = await cuenta();
  return fila(await db.from('personas').update({ ...campos, actualizado_en: ahora() }).eq('id', id).select().single());
}

export async function borrarPersona(id: string) {
  const { db } = await cuenta();
  comprobar(await db.from('personas').delete().eq('id', id));
}

export async function borrarTodasLasPersonas() {
  const { db, userId } = await cuenta();
  comprobar(await db.from('personas').delete().eq('user_id', userId));
}

export async function anotarObservacion(
  personaId: string,
  { situacion, palabra, temperamento, linea }: { situacion: string; palabra: string; temperamento: Temp; linea: string },
): Promise<Observacion> {
  const { db, userId } = await cuenta();
  return fila(
    await db
      .from('persona_observaciones')
      .insert({ persona_id: personaId, user_id: userId, situacion, palabra, temperamento, linea: linea || null })
      .select()
      .single(),
  );
}

export async function borrarObservacion(id: string) {
  const { db } = await cuenta();
  comprobar(await db.from('persona_observaciones').delete().eq('id', id));
}

export async function observacionesDe(personaId: string): Promise<Observacion[]> {
  const { db } = await cuenta();
  return comprobar(await db.from('persona_observaciones').select('*').eq('persona_id', personaId)) ?? [];
}

async function anioNacimiento(): Promise<number | null> {
  const { db, userId } = await cuenta();
  const { data } = await db.from('profiles').select('birth_year').eq('id', userId).maybeSingle();
  return (data?.birth_year as number | null) ?? null;
}

// ── Del Círculo a las fichas ──

const GRUPO_DE_ROL: Record<Role, Grupo> = {
  padre_madre: 'familia',
  hijo_hermano: 'familia',
  conyuge: 'familia',
  educador: 'trabajo',
  trabajo: 'trabajo',
  comunidad: 'comunidad',
  otro: 'amigos',
};

/** La ficha equivalente a un colaborador del Círculo (su tipo estimado o confirmado pasa a la ficha). */
export function fichaDeColaborador(c: CollaboratorBox) {
  const tipo = c.estimated ? parseType(c.estimated) : null;
  return {
    nombre: c.alias.trim().slice(0, 40),
    grupo: GRUPO_DE_ROL[c.role] ?? 'amigos',
    relacion: c.relation.trim().slice(0, 30) || null,
    avatar: null,
    estrella: true, // en el Círculo solo estaban los colaboradores privilegiados
    me_cuesta: false,
    estado: tipo ? (c.confirmed ? 'confirmado' : 'estimado') : 'sin_estimar',
    primario: (tipo?.dominant ?? null) as Temp | null,
    secundario: (tipo?.secondary ?? null) as Temp | null,
  };
}

/**
 * Pasa una sola vez a fichas lo que hubiera en el Círculo del dispositivo (una ficha por colaborador,
 * sin duplicar si ya hay una con el mismo nombre). El Círculo del dispositivo no se borra: queda
 * marcado como pasado a esa cuenta.
 */
export async function migrarCirculo(existentes: Persona[]): Promise<boolean> {
  const s = useVirtus.getState();
  const userId = await usuarioId();
  if (!supabase || !userId || s.circuloMigradoA === userId) return false;
  const nombres = new Set(existentes.map((p) => p.nombre.trim().toLowerCase()));
  const nuevas = s.collaborators
    .filter((c) => c.alias.trim() && !nombres.has(c.alias.trim().toLowerCase()))
    .map((c) => ({ user_id: userId, ...fichaDeColaborador(c) }));
  if (nuevas.length) comprobar(await supabase.from('personas').insert(nuevas));
  s.markCirculoMigrado(userId);
  return nuevas.length > 0;
}

// ── Estado compartido ──

const usePersonasStore = create<{ cargando: boolean; error: unknown; lista: Persona[]; menor: boolean }>(() => ({
  cargando: true,
  error: null,
  lista: [],
  menor: false,
}));
let enCurso: Promise<void> | null = null;

export function recargarPersonas(): Promise<void> {
  enCurso ??= (async () => {
    try {
      let lista = await listarPersonas();
      if (await migrarCirculo(lista).catch(() => false)) lista = await listarPersonas();
      const menor = esMenorDe18(await anioNacimiento().catch(() => null));
      usePersonasStore.setState({ cargando: false, error: null, lista, menor });
    } catch (error) {
      usePersonasStore.setState({ cargando: false, error });
    } finally {
      enCurso = null;
    }
  })();
  return enCurso;
}

export interface EstadoPersonas {
  cargando: boolean;
  error: unknown;
  lista: Persona[];
  porId: Record<string, Persona>;
  /** Menor de 18: sin la marca «Me cuesta». */
  menor: boolean;
  /** Sin cuenta no hay fichas: viven en el Supabase de Virtus, compartidas con la web. */
  sinSesion: boolean;
  recargar: () => Promise<void>;
}

export function usePersonas(): EstadoPersonas {
  const { cargando, error, lista, menor } = usePersonasStore();
  useEffect(() => {
    void recargarPersonas();
  }, []);
  return {
    cargando,
    error,
    lista,
    menor,
    sinSesion: error instanceof PersonasError && error.message === 'sin_sesion',
    porId: Object.fromEntries(lista.map((p) => [p.id, p])),
    recargar: recargarPersonas,
  };
}
