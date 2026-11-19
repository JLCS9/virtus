// El último test de carácter del usuario. `fila` es undefined mientras carga por primera vez y null si no hay
// resultado (o falló); `resultado` es {valores, facetas} ya normalizado, o null. Comparte caché con MapaCaracter.
import { fetchLatestCharacter } from '../account/account';
import { useDatos } from '../account/useDatos';
import { useSession } from '../account/useSession';
import { resultadoCaracter } from '../lib/virtudes.js';

export function useCaracter() {
  const session = useSession();
  const userId = session?.user?.id;
  const { datos, listo, error } = useDatos(userId ? `caracter:${userId}` : null, async () => (await fetchLatestCharacter()) ?? null);
  const fila = listo ? datos : error ? null : undefined;
  return { fila, resultado: resultadoCaracter(fila?.result) };
}
