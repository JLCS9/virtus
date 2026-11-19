// Las fichas de personas de la cuenta (y si es menor de 18, para ocultar la marca «me cuesta»). Con caché:
// al volver a una pantalla se ven al instante y se actualizan en segundo plano.
import { useMemo } from 'react';
import { anioNacimiento, listarPersonas } from '../account/personas';
import { useDatos } from '../account/useDatos';
import { esMenorDe18 } from '../lib/personas.js';
import { useSession } from '../account/useSession';

const SIN_LISTA = [];

export function usePersonas() {
  const session = useSession();
  const userId = session?.user?.id;
  const { datos, cargando, error, recargar } = useDatos(userId ? `personas:${userId}` : null, async () => {
    const [lista, anio] = await Promise.all([listarPersonas(), anioNacimiento(userId)]);
    return { lista, menor: esMenorDe18(anio) };
  });
  const lista = datos?.lista ?? SIN_LISTA;
  const porId = useMemo(() => Object.fromEntries(lista.map((p) => [p.id, p])), [lista]);
  return { cargando, lista, menor: datos?.menor, error, recargar, porId };
}
