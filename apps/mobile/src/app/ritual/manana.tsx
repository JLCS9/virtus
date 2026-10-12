import { goBackOrHome } from '@/features/nav';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Card, Cita, Eyebrow, Filete, H2, Lectura, Screen, Stack } from '@/components/ui';
import { useToday } from '@/features/today';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

export default function RitualManana() {
  const { t } = useTranslation();
  const today = useToday();
  const mission = useVirtus((s) => s.mission);
  const [noMore, setNoMore] = useState(false);
  const challenge = today.record?.challenge;
  const accepted = !!challenge?.acceptedAt;

  return (
    <Screen
      footer={
        accepted ? (
          <Button label={t('ritual.volverHoy')} onPress={goBackOrHome} />
        ) : (
          <View style={{ gap: space.s }}>
            <Button label={t('ritual.aceptar')} disabled={!challenge} onPress={today.accept} />
            <Button variant="ghost" label={t('ritual.otro')} onPress={() => setNoMore(!today.reroll())} />
          </View>
        )
      }>
      <Stack gap={space.s}>
        <Eyebrow>{t('ritual.eyebrow', { virtud: t(`virtudes.${today.virtue}`) })}</Eyebrow>
        <Filete />
      </Stack>

      <Stack gap={space.s}>
        <Caption>{t('ritual.lectura')}</Caption>
        <Cita author={today.fragment.author}>{today.fragment.text}</Cita>
      </Stack>

      {mission ? (
        <View style={{ gap: space.xs }}>
          <Eyebrow>{t('hoy.mision')}</Eyebrow>
          <Lectura>{mission}</Lectura>
        </View>
      ) : null}

      <Card accent style={{ gap: space.m, marginTop: space.s }}>
        <Eyebrow>{t('ritual.retoEyebrow')}</Eyebrow>
        <H2>{challenge?.text ?? '…'}</H2>
        {challenge?.role ? <Caption>{t('ritual.rol', { rol: t(`roles.${challenge.role}`) })}</Caption> : null}
      </Card>

      {accepted ? <Body>{t('ritual.aceptado')}</Body> : null}
      {noMore ? <Caption>{t('ritual.sinRetos')}</Caption> : null}
    </Screen>
  );
}
