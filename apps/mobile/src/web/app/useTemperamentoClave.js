// El último test de temperamento del usuario: la fila y su clave ('SAN-COL'). `fila` es undefined mientras
// carga por primera vez y null si no hay resultado (o falló). Con caché: al volver a una pantalla ya está.
import { fetchLatestTemperament } from '../account/account';
import { useDatos } from '../account/useDatos';
import { useSession } from '../account/useSession';
import { claveTemperamento } from '../lib/virtudes.js';

export function useTemperamentoClave() {
  const session = useSession();
  const userId = session?.user?.id;
  const { datos, listo, error } = useDatos(userId ? `temperamento:${userId}` : null, async () => (await fetchLatestTemperament()) ?? null);
  const fila = listo ? datos : error ? null : undefined;
  return { fila, clave: claveTemperamento(fila?.result) };
}
