// Hooks del portal, iguales a los de la web (useSession, useAcceso, useCamino, usePersonas).
 
import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { anioNacimiento, leerCamino, listarPersonas, tieneAccesoRetos, type DatosCamino } from './datos';
import { diaDelCamino, fechaLocal, racha } from './web/lib/camino.js';
import { esMenorDe18 } from './web/lib/personas.js';

/** Sesión de Supabase. `undefined` mientras carga, `null` sin sesión. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null);
  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

let ultimoAcceso: boolean | undefined;

/** ¿Suscripción activa? `undefined` mientras se comprueba (se recuerda entre pantallas). */
export function useAcceso(activo = true): boolean | undefined {
  const [acceso, setAcceso] = useState(ultimoAcceso);
  useEffect(() => {
    if (!activo) return undefined;
    let vivo = true;
    tieneAccesoRetos()
      .then((ok) => {
        ultimoAcceso = ok;
        if (vivo) setAcceso(ok);
      })
      .catch(() => {
        if (vivo) setAcceso(false);
      });
    return () => {
      vivo = false;
    };
  }, [activo]);
  return activo ? acceso : undefined;
}

export function olvidarAcceso() {
  ultimoAcceso = undefined;
}

export function useCamino() {
  const [estado, setEstado] = useState<{ cargando: boolean; datos?: DatosCamino; error?: unknown }>({ cargando: true });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vivo = true;
    leerCamino()
      .then((datos) => vivo && setEstado({ cargando: false, datos }))
      .catch((error) => vivo && setEstado({ cargando: false, error }));
    return () => {
      vivo = false;
    };
  }, [intento]);

  const recargar = useCallback(() => {
    setEstado((e) => (e.datos ? e : { cargando: true }));
    setIntento((n) => n + 1);
  }, []);
  const datos = estado.datos;
  const hoy = fechaLocal();
  const porDia: Record<number, any> = Object.fromEntries((datos?.dias ?? []).map((d) => [d.dia, d]));

  return {
    cargando: estado.cargando,
    error: estado.error,
    recargar,
    perfil: datos?.perfil ?? null,
    lineaBase: datos?.lineaBase ?? null,
    porDia,
    // ≤0: aún no empieza · 1…14: en curso · >14: terminado
    diaHoy: datos?.perfil ? (diaDelCamino(datos.perfil.inicio, hoy) as number) : null,
    racha: racha(datos?.dias ?? [], hoy) as number,
  };
}

export function usePersonas() {
  const session = useSession();
  const userId = session?.user?.id;
  const [estado, setEstado] = useState<{ cargando: boolean; lista: any[]; menor?: boolean; error?: unknown }>({ cargando: true, lista: [] });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;
    let vivo = true;
    Promise.all([listarPersonas(), anioNacimiento(userId)])
      .then(([lista, anio]) => vivo && setEstado({ cargando: false, lista, menor: esMenorDe18(anio) }))
      .catch((error) => vivo && setEstado({ cargando: false, lista: [], error }));
    return () => {
      vivo = false;
    };
  }, [userId, intento]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);
  return { ...estado, recargar, porId: Object.fromEntries(estado.lista.map((p) => [p.id, p])) };
}
