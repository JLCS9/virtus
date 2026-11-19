// Datos con caché y revalidación (ver lib/almacenDatos.js). Al volver a una pantalla se enseña al instante
// lo último que se sabía y se actualiza en segundo plano; así cambiar de pestaña no deja huecos.
//
//   const { datos, listo, error, cargando, recargar } = useDatos(`personas:${userId}`, () => pedir());
//
// `clave` null = no pedir nada (p. ej. aún sin sesión). `recargar()` fuerza una petición nueva: úsala
// tras guardar algo. `cargando` es true solo mientras NO hay datos que enseñar; si hay datos viejos y la
// actualización falla, se siguen enseñando (`error` solo se informa cuando no hay nada).
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { crearAlmacen } from '../lib/almacenDatos.js';

const almacen = crearAlmacen();
const SIN_DATOS = Object.freeze({ datos: undefined, listo: false, error: null });
const nadie = () => () => {};

/** Olvida todos los datos guardados (al cerrar sesión). */
export const olvidarDatos = () => almacen.limpiar();

export function useDatos(clave, cargar) {
  const entrada = useSyncExternalStore(
    useCallback((aviso) => (clave ? almacen.suscribir(clave, aviso) : nadie()), [clave]),
    () => (clave ? almacen.leer(clave) : SIN_DATOS),
  );
  const funcion = useRef(cargar);
  funcion.current = cargar;

  useEffect(() => {
    if (clave) almacen.cargar(clave, () => funcion.current());
  }, [clave]);

  const recargar = useCallback(() => (clave ? almacen.cargar(clave, () => funcion.current(), { forzar: true }) : Promise.resolve()), [clave]);

  return {
    datos: entrada.datos,
    listo: entrada.listo,
    error: entrada.listo ? null : entrada.error,
    cargando: !entrada.listo && !entrada.error,
    recargar,
  };
}
