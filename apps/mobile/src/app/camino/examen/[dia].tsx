/** Examen de la noche de un día del camino. */
import { useLocalSearchParams } from 'expo-router';

import { ConCamino } from '@/components/camino/ConCamino';
import { Examen } from '@/components/camino/Examen';
import { Body, Button, Caption, Screen } from '@/components/ui';
import { TOTAL_DIAS, tieneExamen } from '@/lib/camino';
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
  const abierto = Number.isInteger(dia) && dia >= 1 && dia <= Math.min(camino.diaHoy ?? 0, TOTAL_DIAS) && tieneExamen(dia);
  if (!camino.perfil || !abierto) {
    return (
      <Screen footer={<Button variant="secondary" label="Volver a mi camino" onPress={goBackOrHome} />}>
        <Body>{tieneExamen(dia) ? 'Este examen aún no se ha abierto.' : 'Hoy el cierre de la semana sustituye al examen de la noche.'}</Body>
      </Screen>
    );
  }
  return <Examen key={dia} dia={dia} camino={camino} personas={personas} onCerrar={goBackOrHome} />;
}

export default function ExamenDia() {
  return (
    <ConCamino>
      <Contenido />
    </ConCamino>
  );
}
