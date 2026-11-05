// Catálogo de Formación (lo sirve el servidor, solo con suscripción activa) y progreso de la persona
// (src/formacion/useFormacion.js de la web). El progreso vive SOLO en el dispositivo, como en la web
// (localStorage → AsyncStorage, misma clave `vl-formacion:${userId}` y mismo JSON).
import { useCallback, useEffect, useState } from 'react';

import { catalogoFormacion } from '../datos';
import { guardarJSON, leerJSON } from './almacen';

let cache: any[] | null = null; // el catálogo no cambia durante la visita
export function olvidarCatalogo() {
  cache = null;
}

type EstadoCatalogo = { cargando: boolean; cursos?: any[]; error?: any };

export function useCatalogo() {
  const [estado, setEstado] = useState<EstadoCatalogo>(cache ? { cargando: false, cursos: cache } : { cargando: true });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (cache) return undefined;
    let vivo = true;
    catalogoFormacion()
      .then((r) => {
        cache = r.cursos;
        if (vivo) setEstado({ cargando: false, cursos: cache });
      })
      .catch((error) => {
        if (vivo) setEstado({ cargando: false, error });
      });
    return () => {
      vivo = false;
    };
  }, [intento]);

  return {
    ...estado,
    reintentar: () => {
      setEstado({ cargando: true });
      setIntento((n) => n + 1);
    },
  };
}

const clave = (userId: string) => `vl-formacion:${userId}`;
type Progreso = { vistas: Record<string, string>; ultima: string | null };
const vacio = (): Progreso => ({ vistas: {}, ultima: null });

async function leer(userId: string): Promise<Progreso> {
  const bruto = await leerJSON<any>(clave(userId));
  return bruto && typeof bruto.vistas === 'object' ? { vistas: bruto.vistas, ultima: bruto.ultima ?? null } : vacio();
}

export function useProgreso(userId: string) {
  const [estado, setEstado] = useState<Progreso>(vacio);
  const [leidoPara, setLeidoPara] = useState<string | null>(null);
  const listo = leidoPara === userId;
  useEffect(() => {
    let vivo = true;
    leer(userId).then((p) => {
      if (!vivo) return;
      setEstado(p);
      setLeidoPara(userId);
    });
    return () => {
      vivo = false;
    };
  }, [userId]);

  const cambiar = useCallback(
    (f: (p: Progreso) => Progreso) => {
      setEstado((previo) => {
        const nuevo = f(previo);
        if (nuevo !== previo) guardarJSON(clave(userId), nuevo);
        return nuevo;
      });
    },
    [userId],
  );

  return {
    listo,
    vistas: estado.vistas,
    ultima: estado.ultima,
    abrir: (id: string) => cambiar((p) => (p.ultima === id ? p : { ...p, ultima: id })),
    marcarVista: (id: string) => cambiar((p) => (p.vistas[id] ? p : { vistas: { ...p.vistas, [id]: new Date().toISOString() }, ultima: id })),
    desmarcar: (id: string) =>
      cambiar((p) => {
        const resto = { ...p.vistas };
        delete resto[id];
        return { ...p, vistas: resto };
      }),
  };
}
