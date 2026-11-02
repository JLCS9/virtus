/**
 * Crear una ficha («Descubre el temperamento de X») o rehacer el test de una que ya existe
 * (?rehacer=id). Con ?luego=dia1 (desde «Personaliza tu camino»), al terminar va a la sesión del día 1.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { CrearFicha } from '@/components/personas/CrearFicha';
import { PersonasSinCuenta } from '@/components/personas/SinSesion';
import { Caption, Screen } from '@/components/ui';
import { useCamino } from '@/features/camino';
import { goBackOrHome } from '@/features/nav';
import { usePersonas } from '@/features/personas';

export default function NuevaFicha() {
  const { rehacer, luego } = useLocalSearchParams<{ rehacer?: string; luego?: string }>();
  const personas = usePersonas();
  const camino = useCamino();
  const persona = rehacer ? personas.porId[rehacer] : null;
  const alDia1 = () => router.replace({ pathname: '/camino/sesion/[dia]', params: { dia: '1' } });

  if (personas.cargando || (rehacer && !persona && !personas.error)) {
    return (
      <Screen>
        <Caption>Cargando…</Caption>
      </Screen>
    );
  }
  if (personas.error) return <PersonasSinCuenta personas={personas} />;
  return (
    <CrearFicha
      key={rehacer ?? 'nueva'}
      estadoVida={camino.perfil?.estado_vida}
      menor={personas.menor}
      persona={persona}
      onSalir={() => (luego === 'dia1' ? alDia1() : goBackOrHome())}
      onHecho={(p) => {
        void personas.recargar();
        if (luego === 'dia1') alDia1();
        else if (rehacer) goBackOrHome();
        else router.replace({ pathname: '/personas/[id]', params: { id: p.id } });
      }}
    />
  );
}
