// Progreso de un módulo (src/formacion/useModulo.js de la web): misma clave
// `vl-modulo:${userId}:${moduloId}` y mismo JSON { completados, pasoActual }, en AsyncStorage.
import { useCallback, useEffect, useState } from 'react';

import { guardarJSON, leerJSON } from './almacen';

const clave = (userId: string, moduloId: string) => `vl-modulo:${userId}:${moduloId}`;
export type Completados = Record<string, { fecha: string; [k: string]: any }>;
type Estado = { completados: Completados; pasoActual: string | null };
const vacio = (): Estado => ({ completados: {}, pasoActual: null });

/** Lee solo los completados (la portada de Formación y el cuaderno los necesitan sin el hook). */
export async function leerCompletados(userId: string, moduloId: string): Promise<Completados> {
  const bruto = await leerJSON<any>(clave(userId, moduloId));
  return bruto && typeof bruto.completados === 'object' ? bruto.completados : {};
}

export function useModuloProgreso(userId: string, moduloId: string) {
  const [estado, setEstado] = useState<Estado>(vacio);
  const [leidoPara, setLeidoPara] = useState<string | null>(null);
  const listo = leidoPara === `${userId}:${moduloId}`;
  useEffect(() => {
    let vivo = true;
    // Como la web: al abrir, se vuelve al listado (pasoActual: null).
    leerCompletados(userId, moduloId).then((completados) => {
      if (!vivo) return;
      setEstado({ completados, pasoActual: null });
      setLeidoPara(`${userId}:${moduloId}`);
    });
    return () => {
      vivo = false;
    };
  }, [userId, moduloId]);

  const cambiar = useCallback(
    (f: (p: Estado) => Estado) => {
      setEstado((previo) => {
        const nuevo = f(previo);
        guardarJSON(clave(userId, moduloId), nuevo);
        return nuevo;
      });
    },
    [userId, moduloId],
  );

  return {
    listo,
    completados: estado.completados,
    pasoActual: estado.pasoActual,
    completar: (pasoId: string, resultado?: Record<string, any>) =>
      cambiar((p) => ({
        completados: { ...p.completados, [pasoId]: { fecha: new Date().toISOString(), ...(resultado ?? {}) } },
        pasoActual: p.pasoActual,
      })),
    irA: (pasoId: string | null) => cambiar((p) => ({ ...p, pasoActual: pasoId })),
    reset: () => cambiar(() => vacio()),
  };
}

export type ModuloProgreso = ReturnType<typeof useModuloProgreso>;
