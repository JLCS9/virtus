// Notas por paso (src/formacion/useNotas.js de la web): clave `vl-notas:${userId}:${moduloId}`,
// mismo JSON { [pasoId]: [{ id, texto, fecha }] }, en AsyncStorage.
import { useCallback, useEffect, useState } from 'react';

import { guardarJSON, leerJSON } from './almacen';

export type Nota = { id: string; texto: string; fecha: string };
export type Notas = Record<string, Nota[]>;

const clave = (userId: string, moduloId: string) => `vl-notas:${userId}:${moduloId}`;

export function useNotas(userId: string, moduloId: string) {
  const [notas, setNotas] = useState<Notas>({});

  useEffect(() => {
    let vivo = true;
    leerJSON<Notas>(clave(userId, moduloId)).then((n) => {
      if (vivo) setNotas(n ?? {});
    });
    return () => {
      vivo = false;
    };
  }, [userId, moduloId]);

  const cambiar = useCallback(
    (f: (n: Notas) => Notas) => {
      setNotas((previas) => {
        const nuevas = f(previas);
        guardarJSON(clave(userId, moduloId), nuevas);
        return nuevas;
      });
    },
    [userId, moduloId],
  );

  return {
    notas,
    agregar(pasoId: string, texto: string) {
      const entrada = { id: Date.now().toString(36), texto, fecha: new Date().toISOString() };
      cambiar((n) => ({ ...n, [pasoId]: [...(n[pasoId] ?? []), entrada] }));
    },
    eliminar(pasoId: string, notaId: string) {
      cambiar((n) => {
        const lista = (n[pasoId] ?? []).filter((x) => x.id !== notaId);
        const nuevas = { ...n };
        if (lista.length === 0) delete nuevas[pasoId];
        else nuevas[pasoId] = lista;
        return nuevas;
      });
    },
  };
}
