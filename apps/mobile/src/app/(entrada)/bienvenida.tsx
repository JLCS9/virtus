import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Body, Button, Card, Caption, Display, Eyebrow, Filete, H3, Lectura, Screen, Sello, Stack } from '@/components/ui';
import { TAGLINE, color, space, type } from '@/theme';
import { Text } from 'react-native';

export default function Bienvenida() {
  const { t } = useTranslation();
  const pasos = [t('bienvenida.paso1'), t('bienvenida.paso2'), t('bienvenida.paso3')];
  return (
    <Screen
      variant="marca"
      footer={<Button label={t('bienvenida.empezar')} onPress={() => router.push('/test')} />}>
      <View style={{ alignItems: 'flex-start', gap: space.l, marginTop: space.m }}>
        <Sello size={72} />
        <Stack gap={space.s}>
          <Eyebrow>{t('bienvenida.eyebrow')}</Eyebrow>
          <Display>{t('bienvenida.titulo')}</Display>
          <Filete style={{ marginTop: space.s }} />
        </Stack>
      </View>
      <Lectura>{t('bienvenida.p1')}</Lectura>
      <Body>{t('bienvenida.p2')}</Body>

      <Stack gap={space.s} style={{ marginTop: space.m }}>
        <Eyebrow>{t('bienvenida.comoFunciona')}</Eyebrow>
        {pasos.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-start' }}>
            <Text style={[type.h3, { color: color.doradoClaro, width: 20 }]}>{i + 1}</Text>
            <Body style={{ flex: 1 }}>{p}</Body>
          </View>
        ))}
      </Stack>

      <Card style={{ marginTop: space.m }}>
        <H3>{t('bienvenida.antropologiaTitulo')}</H3>
        <Body>{t('bienvenida.antropologia')}</Body>
      </Card>

      <Text style={[type.cita, { color: color.doradoClaro, marginTop: space.l }]}>{TAGLINE}</Text>
      <Caption>Alexandre Havard · Virtuous Leadership</Caption>
    </Screen>
  );
}
