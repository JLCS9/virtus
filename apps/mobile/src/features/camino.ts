/**
 * Camino · los 14 primeros días. Se guarda en el Supabase de Virtus, en las mismas tablas que usa la
 * web (camino_perfil, camino_dias, camino_linea_base; RLS: cada cuenta solo lee y escribe sus filas):
 * lo que se hace en la app se ve en la web y al revés. Exige cuenta con suscripción a Retos.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import { type CaminoDia, type CaminoPerfil, type Examen, type LineaBase, type PorDia, diaDelCamino, fechaLocal, racha } from '@/lib/camino';
import { programarCamino } from './notifications';

export class CaminoError extends Error {}

const comprobar = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
  if (error) throw new CaminoError(error.message);
  return data;
};
/** Para `.single()`: si no hay error, hay fila. */
const fila = <T>(r: { data: T; error: { message: string } | null }) => comprobar(r) as NonNullable<T>;
const ahora = () => new Date().toISOString();

export async function usuarioId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function cuenta() {
  const id = await usuarioId();
  if (!supabase || !id) throw new CaminoError('sin_sesion');
  return { db: supabase, userId: id };
}

interface Datos {
  perfil: CaminoPerfil | null;
  dias: CaminoDia[];
  lineaBase: LineaBase | null;
}

export async function leerCamino(): Promise<Datos> {
  const { db } = await cuenta();
  const [perfil, dias, lineaBase] = await Promise.all([
    db.from('camino_perfil').select('*').maybeSingle(),
    db.from('camino_dias').select('*').order('dia'),
    db.from('camino_linea_base').select('*').maybeSingle(),
  ]);
  return { perfil: comprobar(perfil), dias: comprobar(dias) ?? [], lineaBase: comprobar(lineaBase) };
}

export async function guardarPerfil(campos: Omit<CaminoPerfil, 'user_id'>): Promise<CaminoPerfil> {
  const { db, userId } = await cuenta();
  return fila(await db.from('camino_perfil').upsert({ user_id: userId, ...campos, actualizado_en: ahora() }).select().single());
}

export async function guardarSesion(dia: number, { juego, conQuien }: { juego: unknown; conQuien: string | null }) {
  const { db, userId } = await cuenta();
  return comprobar(
    await db
      .from('camino_dias')
      .upsert({ user_id: userId, dia, sesion_en: ahora(), juego: juego ?? null, con_quien: conQuien ?? null, actualizado_en: ahora() })
      .select()
      .single(),
  );
}

export async function guardarExamen(dia: number, examen: Examen) {
  const { db, userId } = await cuenta();
  return comprobar(await db.from('camino_dias').upsert({ user_id: userId, dia, examen_en: ahora(), examen, actualizado_en: ahora() }).select().single());
}

export async function guardarLineaBase(campos: LineaBase) {
  const { db, userId } = await cuenta();
  return comprobar(await db.from('camino_linea_base').upsert({ user_id: userId, ...campos, actualizado_en: ahora() }).select().single());
}

// ── Estado compartido por las pestañas Hoy y Camino y las pantallas de la sesión ──

const useCaminoStore = create<{ cargando: boolean; error: unknown; datos: Datos | null }>(() => ({ cargando: true, error: null, datos: null }));
let enCurso: Promise<void> | null = null;

/** Vuelve a leer el camino de la cuenta y reprograma las notificaciones con lo que quede por hacer. */
export function recargarCamino(): Promise<void> {
  enCurso ??= leerCamino()
    .then((datos) => {
      useCaminoStore.setState({ cargando: false, error: null, datos });
      if (datos.perfil) void programarCamino(datos.perfil, porDiaDe(datos.dias)).catch(() => {});
    })
    .catch((error) => useCaminoStore.setState((s) => ({ cargando: false, error: s.datos ? null : error })))
    .finally(() => {
      enCurso = null;
    });
  return enCurso;
}

const porDiaDe = (dias: CaminoDia[]): PorDia => Object.fromEntries(dias.map((d) => [d.dia, d]));

export interface EstadoCamino {
  cargando: boolean;
  error: unknown;
  recargar: () => Promise<void>;
  perfil: CaminoPerfil | null;
  lineaBase: LineaBase | null;
  porDia: PorDia;
  /** ≤0: aún no empieza · 1…14: en curso · >14: terminado (null sin perfil). */
  diaHoy: number | null;
  racha: number;
}

export function useCamino(): EstadoCamino {
  const { cargando, error, datos } = useCaminoStore();
  useEffect(() => {
    void recargarCamino();
  }, []);
  const hoy = fechaLocal();
  return {
    cargando: cargando && !datos,
    error,
    recargar: recargarCamino,
    perfil: datos?.perfil ?? null,
    lineaBase: datos?.lineaBase ?? null,
    porDia: porDiaDe(datos?.dias ?? []),
    diaHoy: datos?.perfil ? diaDelCamino(datos.perfil.inicio, hoy) : null,
    racha: racha(datos?.dias ?? [], hoy),
  };
}
