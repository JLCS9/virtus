import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Eyebrow, H1, H2, Lectura, Row, Screen, Stack } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { useContent } from '@/features/content';
import { goBackOrHome } from '@/features/nav';
import { color, space } from '@/theme';

/** Lectura breve en tarjetas: una idea por pantalla. */
export default function LecturaScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useContent().readings.find((x) => x.id === id);
  const [i, setI] = useState(-1);
  const { height } = useWindowDimensions();
  if (!r) return null;
  const card = i >= 0 ? r.tarjetas[i] : null;
  const last = i === r.tarjetas.length - 1;

  return (
    <Screen
      footer={
        <View style={{ gap: space.s }}>
          {last ? (
            <Button label={t('comun.listo')} onPress={goBackOrHome} />
          ) : (
            <Button label={i < 0 ? t('lectura.empezar') : t('lectura.siguiente')} onPress={() => setI((x) => x + 1)} />
          )}
          {i >= 0 ? <Button variant="ghost" label={t('test.anterior')} onPress={() => setI((x) => x - 1)} /> : <Button variant="ghost" label={t('comun.volver')} onPress={goBackOrHome} />}
        </View>
      }>
      {!card ? (
        <Stack gap={space.l} style={{ marginTop: space.xl }}>
          <Eyebrow>{r.autor}</Eyebrow>
          <H1>{r.titulo}</H1>
          <Lectura>{r.intro}</Lectura>
        </Stack>
      ) : (
        <Hero style={{ minHeight: height * 0.45, justifyContent: 'center' }}>
          <Eyebrow>
            {i + 1} / {r.tarjetas.length}
          </Eyebrow>
          <H2>{card.titulo}</H2>
          <Body>{card.texto}</Body>
          {last && r.cierre ? <Body style={{ color: color.doradoClaro }}>{r.cierre}</Body> : null}
        </Hero>
      )}
      <Row style={{ justifyContent: 'center', marginTop: space.m }}>
        {r.tarjetas.map((_, k) => (
          <View key={k} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: k === i ? color.doradoVirtud : color.bruma }} />
        ))}
      </Row>
      <Caption>{r.fuente}</Caption>
    </Screen>
  );
}
