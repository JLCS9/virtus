/** La ficha de una persona. */
import { router, useLocalSearchParams } from 'expo-router';

import { Ficha } from '@/components/personas/MisPersonas';
import { goBackOrHome } from '@/features/nav';
import { usePersonas } from '@/features/personas';

export default function FichaPersona() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personas = usePersonas();
  return (
    <Ficha
      key={id}
      id={id}
      menor={personas.menor}
      onVolver={goBackOrHome}
      onCambio={() => void personas.recargar()}
      onObservar={(p) => router.push({ pathname: '/personas/observar/[id]', params: { id: p.id } })}
      onRehacer={(p) => router.push({ pathname: '/personas/nueva', params: { rehacer: p.id } })}
    />
  );
}
