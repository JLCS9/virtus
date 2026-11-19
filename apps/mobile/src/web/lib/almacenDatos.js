// Caché de datos con revalidación, sin React: guarda lo último que se sabe de cada cosa (personas, el
// camino del día…) para enseñarlo al instante al volver a una pantalla, mientras se pide de nuevo en
// segundo plano. Por eso al cambiar de pestaña no hay huecos que se rellenan por partes.
//
// Una `clave` identifica unos datos (incluye el usuario: 'personas:<id>'). `cargar(clave, funcion)`
// los pide: varias llamadas seguidas comparten la misma petición, salvo con `forzar` (tras guardar algo),
// que lanza una nueva y descarta el resultado de la anterior si llega más tarde.

export function crearAlmacen() {
  const vacia = Object.freeze({ datos: undefined, listo: false, error: null });
  const entradas = new Map(); // clave → { datos, listo, error }
  const oyentes = new Map(); // clave → Set de funciones
  const enCurso = new Map(); // clave → promesa de la petición vigente
  const versiones = new Map(); // clave → nº de la última petición lanzada

  const leer = (clave) => entradas.get(clave) ?? vacia;
  const avisar = (clave) => oyentes.get(clave)?.forEach((f) => f());
  const poner = (clave, valor) => { entradas.set(clave, valor); avisar(clave); };

  function suscribir(clave, oyente) {
    if (!oyentes.has(clave)) oyentes.set(clave, new Set());
    oyentes.get(clave).add(oyente);
    return () => oyentes.get(clave)?.delete(oyente);
  }

  /** Pide los datos. Devuelve la promesa de la petición (nunca rechaza: el fallo queda en la entrada). */
  function cargar(clave, funcion, { forzar = false } = {}) {
    if (!forzar && enCurso.has(clave)) return enCurso.get(clave);
    const version = (versiones.get(clave) ?? 0) + 1;
    versiones.set(clave, version);
    const vigente = () => versiones.get(clave) === version;

    const promesa = Promise.resolve()
      .then(funcion)
      .then(
        (datos) => { if (vigente()) poner(clave, { datos, listo: true, error: null }); },
        // Si ya había datos se conservan: un fallo al revalidar no debe vaciar la pantalla.
        (error) => { if (vigente()) poner(clave, { ...leer(clave), error }); },
      )
      .finally(() => { if (vigente()) enCurso.delete(clave); });
    enCurso.set(clave, promesa);
    return promesa;
  }

  /** Olvida todo (al cerrar sesión): la siguiente cuenta no debe ver nada de la anterior. */
  function limpiar() {
    const claves = [...entradas.keys()];
    entradas.clear();
    enCurso.clear();
    versiones.clear();
    claves.forEach(avisar);
  }

  return { leer, suscribir, cargar, limpiar };
}
