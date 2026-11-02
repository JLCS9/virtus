/** Las fichas viven en la cuenta (compartidas con la web): sin sesión, se invita a entrar. */
import { router } from 'expo-router';

import { Body, Button, Card, Screen, Titular } from '@/components/ui';
import type { EstadoPersonas } from '@/features/personas';

export function PersonasSinCuenta({ personas }: { personas: EstadoPersonas }) {
  return (
    <Screen>
      <Titular eyebrow="Mis personas">Tu gente</Titular>
      <Card accent>
        <Body>
          {personas.sinSesion
            ? 'Tus fichas de personas se guardan en tu cuenta, para verlas también en la web. Entra con tu cuenta para crearlas; lo que tenías en el Círculo se pasará a fichas.'
            : 'No he podido cargar tus fichas ahora mismo.'}
        </Body>
        {personas.sinSesion ? (
          <Button label="Entrar con mi cuenta" onPress={() => router.push('/cuenta' as never)} />
        ) : (
          <Button variant="secondary" label="Reintentar" onPress={() => void personas.recargar()} />
        )}
      </Card>
    </Screen>
  );
}
