// Estado del Camino diario del usuario: sus variables, sus días y sus hábitos con las casillas
// recientes. Los valores ya resueltos con las fichas de «Tu entorno» se calculan donde se pintan:
// `valoresDe(variables, personas.porId)`. Los hábitos cambian de estado solos (prueba → activo,
// consolidado, en revisión) con las reglas de lib/habitos.js y los números de la biblioteca.
// Con caché: al volver a una pantalla se ve al instante y se actualiza en segundo plano.
import { useEffect, useMemo } from 'react';
import { actualizarHabito, leerDias, leerHabitos, leerMarcas, leerVariables } from '../account/caminoDiario';
import { useDatos } from '../account/useDatos';
import { useSession } from '../account/useSession';
import biblioteca from '../data/camino-biblioteca.json';
import { fechaLocal, sumarDias } from '../lib/camino.js';
import { cambioDeEstado, fechasDe } from '../lib/habitos.js';

const CONFIG_HABITOS = biblioteca.habitos;
// Marcas que hacen falta: la ventana de consolidación y las semanas completas de revisión, con margen.
const DIAS_DE_MARCAS = 45;
const SIN_DATOS = { variables: [], dias: [], habitos: [], marcas: [] };

export function useCaminoDiario() {
  const session = useSession();
  const userId = session?.user?.id;
  const hoy = fechaLocal();
  const { datos, cargando, error, recargar } = useDatos(userId ? `camino:${userId}` : null, async () => {
    const [variables, dias, habitos, marcas] = await Promise.all([leerVariables(), leerDias(), leerHabitos(), leerMarcas(sumarDias(fechaLocal(), -DIAS_DE_MARCAS))]);
    return { variables, dias, habitos, marcas };
  });
  const { variables, dias, habitos, marcas } = datos ?? SIN_DATOS;

  // Cambios de estado automáticos. Si falla el guardado no se reintenta en bucle: el estado no cambia.
  useEffect(() => {
    if (!datos) return;
    const cambios = habitos
      .map((h) => ({ h, c: cambioDeEstado(h, fechasDe(marcas, h.id), hoy, CONFIG_HABITOS) }))
      .filter((x) => x.c);
    if (!cambios.length) return;
    Promise.all(cambios.map(({ h, c }) => actualizarHabito(h.id, c))).then(recargar).catch(() => {});
  }, [datos, habitos, marcas, hoy, recargar]);

  // Variables con fila, aunque la respuesta fuera «saltar»: las preguntas iniciales se dan por hechas.
  const respondidas = useMemo(() => new Set(variables.map((v) => v.variable)), [variables]);

  return {
    cargando, error, variables, dias, habitos, marcas,
    recargar,
    userId,
    respondidas,
    hoy,
    configHabitos: CONFIG_HABITOS,
    diaDeHoy: dias.find((d) => d.fecha === hoy) ?? null,
  };
}
