/** Las pantallas del Camino solo existen con suscripción a Retos (la web exige lo mismo). */
import { useEffect, type ReactNode } from 'react';
import { Redirect } from 'expo-router';

import { Caption, Screen } from '@/components/ui';
import { refrescarSuscripcionRetos } from '@/features/retos';
import { useVirtus } from '@/store/virtus';

export function ConCamino({ children }: { children: ReactNode }) {
  const suscripcion = useVirtus((s) => s.retosSuscripcion);
  useEffect(() => {
    if (suscripcion === null) void refrescarSuscripcionRetos();
  }, [suscripcion]);
  if (suscripcion === 'inactiva') return <Redirect href="/hoy" />;
  if (suscripcion === null) {
    return (
      <Screen>
        <Caption>…</Caption>
      </Screen>
    );
  }
  return children;
}
