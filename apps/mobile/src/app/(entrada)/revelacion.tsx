import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { typeCopy } from '@virtus/content';

import { Body, Button, Caption, Card, Chip, Display, Eyebrow, H1, H3, Row, Screen, Stack } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { ModelCard } from '@/components/ModelCard';
import { TemperamentWheel } from '@/components/TemperamentWheel';
import { useContent } from '@/features/content';
import { typeName } from '@/features/labels';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

export default function Revelacion() {
  const { t } = useTranslation();
  const r = useVirtus((s) => s.temperament);
  const onboarded = useVirtus((s) => s.onboardedAt);
  const content = useContent();
  const [more, setMore] = useState(false);
  if (!r) return <Redirect href="/test" />;
  const d = content.temperaments[r.dominant];
  const tipo = typeCopy(content, r.type);
  const model = content.models.find((m) => m.id === d.modelos[0]);

  return (
    <Screen
      variant="marca"
      footer={<Button label={onboarded ? t('comun.volver') : t('revelacion.seguir')} onPress={() => (onboarded ? router.back() : router.push('/roles'))} />}>
      <Stack gap={space.xs} style={{ alignItems: 'center', marginTop: space.m }}>
        <Eyebrow>{t('revelacion.eyebrow')}</Eyebrow>
        <Display center>{tipo ? tipo.name.charAt(0) + tipo.name.slice(1).toLowerCase() : d.arquetipo}</Display>
        <Body center>
          {typeName(t, r)}
          {r.isPure ? ` · ${t('revelacion.puro')}` : ''}
        </Body>
        {r.secondaryStrength ? <Caption>{t('revelacion.intensidad', { i: r.secondaryStrength })}</Caption> : null}
      </Stack>

      <View style={{ alignItems: 'center', paddingVertical: space.s }}>
        <TemperamentWheel size={250} dominant={r.dominant} secondary={r.secondary} onDark />
      </View>

      <Row style={{ justifyContent: 'center' }}>
        <Chip label={d.valor} selected />
        {d.fortalezas.map((f) => (
          <Chip key={f} label={f} />
        ))}
      </Row>

      <Card accent style={{ gap: space.s }}>
        <Eyebrow>{t('revelacion.desafioEyebrow')}</Eyebrow>
        <H1>{tipo?.challenge ?? t(`virtudes.${r.challengeVirtue}`)}</H1>
        <Body>{tipo?.reto ?? d.claveDesafio}</Body>
        <Caption>{t('revelacion.desafioIntro')}</Caption>
      </Card>

      {!more ? (
        <Button variant="ghost" label={t('revelacion.verMas')} onPress={() => setMore(true)} />
      ) : (
        <Stack gap={space.l}>
          {tipo ? (
            <Stack gap={space.s}>
              <H3>{t('revelacion.fortalezas')}</H3>
              <Body>{tipo.fortaleza}</Body>
              <H3>{t('revelacion.riesgo')}</H3>
              <Body>{tipo.debilidad}</Body>

            </Stack>
          ) : null}
          <Caption>{t('revelacion.reactividad', { r: d.reactividad.toLowerCase() })}</Caption>
        </Stack>
      )}

      {model ? (
        <Stack gap={space.s}>
          <Eyebrow>{t('revelacion.modelo')}</Eyebrow>
          <ModelCard model={model} width={260} />
        </Stack>
      ) : null}

      <Hero flat style={{ marginHorizontal: -space.l, paddingVertical: space.m }}>
        <Body>{t('revelacion.nota')}</Body>
      </Hero>
      <Caption>{t('revelacion.fuenteOficial')}</Caption>
    </Screen>
  );
}
