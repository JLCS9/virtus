import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Chip, Cita, Eyebrow, H1, Lectura, Row, Screen, Stack } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { Monogram } from '@/components/ModelCard';
import { useContent } from '@/features/content';
import { goBackOrHome } from '@/features/nav';
import { space } from '@/theme';

export default function ModeloScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = useContent().models.find((x) => x.id === id);
  if (!m) return null;
  return (
    <Screen footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
      <Hero>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, marginTop: space.s }}>
          <Monogram name={m.nombre} size={72} />
          <Stack gap={space.xs} style={{ flex: 1 }}>
            <Eyebrow>
              {m.ambito} · {m.años}
            </Eyebrow>
            <H1>{m.nombre}</H1>
          </Stack>
        </View>
        {m.lema ? <Cita>{m.lema}</Cita> : null}
      </Hero>
      <Lectura>{m.resumen}</Lectura>
      <Stack gap={space.s}>
        <Eyebrow>{t('biblioteca.virtudesVividas')}</Eyebrow>
        <Row>
          {m.virtudes.map((v) => (
            <Chip key={v} label={t(`virtudes.${v}`)} />
          ))}
        </Row>
      </Stack>
      {m.temperamento ? <Body>{t('biblioteca.temperamentoModelo', { t: t(`temperamentos.${m.temperamento}`).toLowerCase() })}</Body> : null}
      <Caption>{t('biblioteca.fuenteModelos')}</Caption>
    </Screen>
  );
}
