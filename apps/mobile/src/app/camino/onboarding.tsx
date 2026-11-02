/** «Personaliza tu camino» (y editarlo después). */
import { router } from 'expo-router';

import { ConCamino } from '@/components/camino/ConCamino';
import { Onboarding } from '@/components/camino/Onboarding';
import { Caption, Screen } from '@/components/ui';
import { fechaLocal } from '@/lib/camino';
import { useCamino } from '@/features/camino';
import { goBackOrHome } from '@/features/nav';

function Contenido() {
  const camino = useCamino();
  if (camino.cargando) {
    return (
      <Screen>
        <Caption>Cargando tu camino…</Caption>
      </Screen>
    );
  }
  return (
    <Onboarding
      perfil={camino.perfil}
      onSalir={goBackOrHome}
      onHecho={(p, quiereFicha) => {
        void camino.recargar();
        const empieza = p.inicio <= fechaLocal();
        if (quiereFicha) router.replace({ pathname: '/personas/nueva', params: empieza ? { luego: 'dia1' } : {} });
        else if (empieza) router.replace({ pathname: '/camino/sesion/[dia]', params: { dia: '1' } });
        else goBackOrHome();
      }}
    />
  );
}

export default function OnboardingCamino() {
  return (
    <ConCamino>
      <Contenido />
    </ConCamino>
  );
}
