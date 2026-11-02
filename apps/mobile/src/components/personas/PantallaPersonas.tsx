/** Pantalla «Mis personas» (ruta /personas y pestaña que sustituye al Círculo). */
import { router } from 'expo-router';

import { MisPersonas } from '@/components/personas/MisPersonas';
import { PersonasSinCuenta } from '@/components/personas/SinSesion';
import { Caption, Screen } from '@/components/ui';
import { goBackOrHome } from '@/features/nav';
import { usePersonas } from '@/features/personas';

export function PantallaPersonas({ conVolver = true }: { conVolver?: boolean }) {
  const personas = usePersonas();
  if (personas.cargando) {
    return (
      <Screen>
        <Caption>Cargando tus personas…</Caption>
      </Screen>
    );
  }
  if (personas.error) return <PersonasSinCuenta personas={personas} />;
  return (
    <MisPersonas
      personas={personas.lista}
      onVolver={conVolver ? goBackOrHome : undefined}
      onCambio={() => void personas.recargar()}
      onAbrir={(id) => router.push({ pathname: '/personas/[id]', params: { id } })}
      onCrear={() => router.push('/personas/nueva')}
    />
  );
}
