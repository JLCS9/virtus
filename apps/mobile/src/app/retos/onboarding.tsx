/**
 * Onboarding de los retos (modo ONBOARDING del método): una conversación breve, una sola vez.
 * Si ya hiciste el test de temperamento, el servidor lo usa y no te lo vuelve a preguntar.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Eyebrow, Filete, Screen, Stack } from '@/components/ui';
import { EntradaChat, ListaChat, useConversacion } from '@/components/RetoChat';
import { turnoOnboarding } from '@/features/retos';
import { goBackOrHome } from '@/features/nav';
import { space } from '@/theme';

export default function OnboardingRetos() {
  const { t } = useTranslation();
  const c = useConversacion(turnoOnboarding);
  const fin = !!c.ultima && (c.ultima.terminado || c.ultima.crisis);
  return (
    <Screen
      footer={
        fin ? (
          <Button label={t('ritual.volverHoy')} onPress={() => (router.canGoBack() ? router.back() : goBackOrHome())} />
        ) : (
          <EntradaChat botones={[]} etiquetaBoton={(b) => b} onBoton={() => {}} ocupado={c.ocupado} onEnviar={(x) => c.paso(x, x)} />
        )
      }>
      <Stack gap={space.s}>
        <Eyebrow>{t('retos.configurarTitulo')}</Eyebrow>
        <Filete />
      </Stack>
      <Body>{t('retos.configurarTexto')}</Body>
      <ListaChat mensajes={c.mensajes} ocupado={c.ocupado} />
      {c.error ? <Caption>{c.error}</Caption> : null}
      {c.ultima?.terminado ? <Body>{t('retos.listo')}</Body> : null}
    </Screen>
  );
}
