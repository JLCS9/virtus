/** La sesión de un día del camino (Recuerda · Juega · Elige). */
import { router, useLocalSearchParams } from 'expo-router';

import { ConCamino } from '@/components/camino/ConCamino';
import { Sesion } from '@/components/camino/Sesion';
import { Body, Button, Caption, Screen } from '@/components/ui';
import { TOTAL_DIAS } from '@/lib/camino';
import { useCamino } from '@/features/camino';
import { goBackOrHome } from '@/features/nav';
import { usePersonas } from '@/features/personas';

function Contenido() {
  const { dia: param } = useLocalSearchParams<{ dia: string }>();
  const dia = Number(param);
  const camino = useCamino();
  const personas = usePersonas();
  if (camino.cargando) {
    return (
      <Screen>
        <Caption>Cargando tu camino…</Caption>
      </Screen>
    );
  }
  // Solo los días ya abiertos (hoy y los anteriores).
  const abierto = Number.isInteger(dia) && dia >= 1 && dia <= Math.min(camino.diaHoy ?? 0, TOTAL_DIAS);
  if (!camino.perfil || !abierto) {
    return (
      <Screen footer={<Button variant="secondary" label="Volver a mi camino" onPress={goBackOrHome} />}>
        <Body>{camino.perfil ? 'Este día de tu camino aún no se ha abierto.' : 'Antes de empezar, personaliza tu camino.'}</Body>
      </Screen>
    );
  }
  return (
    <Sesion
      key={dia}
      dia={dia}
      camino={camino}
      personas={personas}
      onCerrar={goBackOrHome}
      onExamen={() => router.replace({ pathname: '/camino/examen/[dia]', params: { dia: String(dia) } })}
    />
  );
}

export default function SesionDia() {
  return (
    <ConCamino>
      <Contenido />
    </ConCamino>
  );
}
