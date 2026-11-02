/** Observación rápida de una persona: qué pasó, cómo reaccionó y una línea opcional. */
import { useLocalSearchParams } from 'expo-router';

import { Observacion } from '@/components/personas/Observacion';
import { Caption, Screen } from '@/components/ui';
import { goBackOrHome } from '@/features/nav';
import { usePersonas } from '@/features/personas';

export default function ObservarPersona() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personas = usePersonas();
  const persona = personas.porId[id];
  if (!persona) {
    return (
      <Screen>
        <Caption>{personas.cargando ? 'Cargando…' : 'No he encontrado esta ficha.'}</Caption>
      </Screen>
    );
  }
  return (
    <Observacion
      key={id}
      persona={persona}
      onSalir={goBackOrHome}
      onHecho={() => {
        void personas.recargar();
        goBackOrHome();
      }}
    />
  );
}
