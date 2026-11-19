// Catálogo de Formación (lo sirve el servidor, solo con suscripción activa) y progreso de la persona.
//
// PROGRESO: de momento se guarda SOLO en este navegador (localStorage, por cuenta). La app móvil de
// Virtus lo guarda también solo en el dispositivo, así que web y app no comparten progreso todavía.
// Para compartirlo hace falta una tabla en el servidor (pendiente de decisión).
import { useCallback, useEffect, useState } from 'react';
import { catalogoFormacion } from '../account/retos';

let cache = null; // el catálogo no cambia durante la visita
export function olvidarCatalogo() { cache = null; }

// Solo en desarrollo: si existe public/__dev_cursos.json (sin versionar), el catálogo se lee de ahí
// en lugar de la función, para probar en local sin desplegarla. En producción no existe.
const cargarCatalogo = () => (
  (process.env.NODE_ENV !== 'production')
    ? fetch('/__dev_cursos.json').then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : Promise.reject(new Error('sin fixture')))).catch(() => catalogoFormacion())
    : catalogoFormacion()
);

export function useCatalogo() {
  const [estado, setEstado] = useState(cache ? { cargando: false, cursos: cache } : { cargando: true });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (cache) return undefined;
    let vivo = true;
    setEstado({ cargando: true });
    cargarCatalogo()
      .then((r) => { cache = r.cursos; if (vivo) setEstado({ cargando: false, cursos: cache }); })
      .catch((error) => { if (vivo) setEstado({ cargando: false, error }); });
    return () => { vivo = false; };
  }, [intento]);

  return { ...estado, reintentar: () => setIntento((n) => n + 1) };
}

const clave = (userId) => `vl-formacion:${userId}`;
const vacio = () => ({ vistas: {}, ultima: null });

function leer(userId) {
  try {
    const bruto = JSON.parse(localStorage.getItem(clave(userId)));
    return bruto && typeof bruto.vistas === 'object' ? { vistas: bruto.vistas, ultima: bruto.ultima ?? null } : vacio();
  } catch { return vacio(); }
}

export function useProgreso(userId) {
  const [estado, setEstado] = useState(() => leer(userId));
  useEffect(() => { setEstado(leer(userId)); }, [userId]);

  const cambiar = useCallback((f) => {
    setEstado((previo) => {
      const nuevo = f(previo);
      try { localStorage.setItem(clave(userId), JSON.stringify(nuevo)); } catch { /* sin almacenamiento */ }
      return nuevo;
    });
  }, [userId]);

  return {
    vistas: estado.vistas,
    ultima: estado.ultima,
    abrir: (id) => cambiar((p) => (p.ultima === id ? p : { ...p, ultima: id })),
    marcarVista: (id) => cambiar((p) => (p.vistas[id] ? p : { vistas: { ...p.vistas, [id]: new Date().toISOString() }, ultima: id })),
    desmarcar: (id) => cambiar((p) => { const { [id]: _quitada, ...resto } = p.vistas; return { ...p, vistas: resto }; }),
  };
}
