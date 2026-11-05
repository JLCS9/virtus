// Portal (igual que /app en la web): solo con sesión y suscripción activa.
// Sin sesión → /login. Sin suscripción → /sin-acceso. El servidor repite la comprobación en cada llamada.
import { Redirect, Stack } from 'expo-router';

import { useAcceso, useSession } from '@/portal/hooks';
import { Shell } from '@/portal/Shell';
import { BEIGE } from '@/portal/tema';
import { Cargando } from '@/portal/ui';

export default function PortalLayout() {
  const session = useSession();
  const acceso = useAcceso(Boolean(session));

  if (session === undefined) return <Cargando />;
  if (!session) return <Redirect href="/login" />;
  if (acceso === undefined) return <Cargando />;
  if (!acceso) return <Redirect href="/sin-acceso" />;

  return (
    <Shell user={session.user}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: BEIGE } }} />
    </Shell>
  );
}
