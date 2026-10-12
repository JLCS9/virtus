import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { WorkVirtue } from '@virtus/method';

import { Body, Button, Caption, Card, Eyebrow, H3, Screen, Titular } from '@/components/ui';
import { useVirtus } from '@/store/virtus';
import { color, radius, space, type, virtueColor } from '@/theme';

/** Color semántico del brandbook: magnanimidad dorado, humildad azul, cardinales Plomo. */
function tone(v: WorkVirtue) {
  if (v === 'magnanimidad') return virtueColor.magnanimidad;
  if (v === 'humildad') return virtueColor.humildad;
  return virtueColor.prudencia;
}

function Node({ v, center, current }: { v: WorkVirtue; center?: boolean; current?: boolean }) {
  const { t } = useTranslation();
  const c = tone(v);
  return (
    <View
      accessibilityLabel={t(`virtudes.${v}`)}
      style={{
        borderWidth: center ? 3 : 1,
        borderColor: c,
        borderRadius: radius.pill,
        paddingHorizontal: center ? space.l : space.m,
        paddingVertical: center ? space.m : space.s,
        backgroundColor: current ? color.niebla : color.blanco,
        alignItems: 'center',
      }}>
      <Text style={[center ? type.h2 : type.bodyStrong, { color: v === 'magnanimidad' ? color.azulProfundo : c }]}>{t(`virtudes.${v}`)}</Text>
    </View>
  );
}

export default function Camino() {
  const { t } = useTranslation();
  const s = useVirtus();
  const challenge = s.temperament?.challengeVirtue ?? 'humildad';
  const cycle = s.cycle?.virtue ?? challenge;
  const day = s.cycle ? Math.floor((Date.now() - new Date(s.cycle.startedAt).getTime()) / 86_400_000) + 1 : 1;
  const heart: WorkVirtue[] = (['magnanimidad', 'humildad'] as WorkVirtue[]).filter((v) => v !== challenge);
  const cardinal: WorkVirtue[] = (['prudencia', 'audacia', 'resistencia', 'dominio', 'justicia'] as WorkVirtue[]).filter((v) => v !== challenge);

  return (
    <Screen>
      <Titular eyebrow={t('camino.eyebrow')}>{t('camino.titulo')}</Titular>

      <View style={{ alignItems: 'center', gap: space.m, paddingVertical: space.m }}>
        <Caption>{t('camino.corazon')}</Caption>
        <View style={{ flexDirection: 'row', gap: space.s }}>{heart.map((v) => <Node key={v} v={v} current={v === cycle} />)}</View>
        <View style={{ width: 1, height: space.l, backgroundColor: color.piedra }} />
        <Caption>{t('camino.centro')}</Caption>
        <Node v={challenge} center current={challenge === cycle} />
        <View style={{ width: 1, height: space.l, backgroundColor: color.piedra }} />
        <Caption>{t('camino.cardinales')}</Caption>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.s }}>
          {cardinal.map((v) => <Node key={v} v={v} current={v === cycle} />)}
        </View>
      </View>

      <Card accent>
        <Eyebrow>{t('camino.ciclo')}</Eyebrow>
        <H3>{t(`virtudes.${cycle}`)}</H3>
        <Body>{t('camino.cicloDias', { n: day })}</Body>
        <Button variant="secondary" label={t('camino.cerrarCiclo')} onPress={() => router.push('/ciclo')} />
        <Button variant="ghost" label={t('camino.cambiarCiclo')} onPress={() => router.push('/plan')} />
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.push('/mision')}>
        <Card>
          <Eyebrow>{t('camino.itinerario')}</Eyebrow>
          <Body>{s.mission || t('hoy.sinMision')}</Body>
        </Card>
      </Pressable>
    </Screen>
  );
}
