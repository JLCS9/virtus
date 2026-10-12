import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Body, BodyStrong, Button, Caption, Card, Display, Eyebrow, Filete, H1, H3, Lectura, Row, Screen, Stack } from '@/components/ui';
import { TemperamentBars } from '@/components/TemperamentBars';
import { useContent } from '@/features/content';
import { typeName } from '@/features/labels';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

export default function Revelacion() {
  const { t } = useTranslation();
  const r = useVirtus((s) => s.temperament);
  const onboarded = useVirtus((s) => s.onboardedAt);
  const copy = useContent().temperaments;
  if (!r) return <Redirect href="/test" />;
  const d = copy[r.dominant];
  const sec = r.secondary ? copy[r.secondary] : null;

  return (
    <Screen
      variant="marca"
      footer={
        <Button
          label={onboarded ? t('comun.volver') : t('revelacion.seguir')}
          onPress={() => (onboarded ? router.back() : router.push('/roles'))}
        />
      }>
      <Stack gap={space.s} style={{ marginTop: space.l }}>
        <Eyebrow>{t('revelacion.eyebrow')}</Eyebrow>
        <Display>{typeName(t, r)}</Display>
        <Filete style={{ marginTop: space.s }} />
      </Stack>

      <TemperamentBars result={r} />
      {!r.secondary ? <Caption>{t('revelacion.puro')}</Caption> : null}
      {r.tie ? <Caption>{t('revelacion.empate')}</Caption> : null}
      {r.inconsistent ? <Caption>{t('revelacion.inconsistente')}</Caption> : null}

      <Stack gap={space.s} style={{ marginTop: space.m }}>
        <Eyebrow>{t('revelacion.naturaleza')}</Eyebrow>
        <Lectura>{d.rasgos}</Lectura>
        {sec ? (
          <Body>
            {t('revelacion.secundario')} · {sec.nombre.toLowerCase()}: {sec.rasgos}
          </Body>
        ) : null}
      </Stack>

      <Stack gap={space.s}>
        <Eyebrow>{t('revelacion.fortalezas')}</Eyebrow>
        <Row gap={space.l}>
          {d.fortalezas.map((f) => (
            <H3 key={f}>{f}</H3>
          ))}
        </Row>
      </Stack>

      <Stack gap={space.s}>
        <Eyebrow>{t('revelacion.riesgo')}</Eyebrow>
        <Body>{d.riesgo}</Body>
      </Stack>

      <Card accent style={{ marginTop: space.m, gap: space.m }}>
        <Eyebrow>{t('revelacion.desafioEyebrow')}</Eyebrow>
        <H1>{t(`virtudes.${r.challengeVirtue}`)}</H1>
        <Body>{d.desafio}</Body>
        <Caption>{t('revelacion.desafioIntro')}</Caption>
      </Card>

      <View style={{ marginTop: space.m, gap: space.s }}>
        <BodyStrong>{t('revelacion.nota')}</BodyStrong>
        <Caption>{t('comun.borrador')}</Caption>
      </View>
    </Screen>
  );
}
