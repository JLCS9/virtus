import { goBackOrHome } from '@/features/nav';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { dayIndex, summarizeWeek } from '@virtus/method';
import { fragmentFor } from '@virtus/content';

import { Body, BodyStrong, Button, Caption, Cita, Divider, Eyebrow, H2, Screen, Stack, Titular } from '@/components/ui';
import { useEffect } from 'react';

import { track } from '@/features/analytics';
import { useContent } from '@/features/content';
import { useVirtus } from '@/store/virtus';
import { color, space, type } from '@/theme';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, gap: space.xs }}>
      <Text style={[type.h1, { color: color.doradoVirtud }]}>{value}</Text>
      <Caption>{label}</Caption>
    </View>
  );
}

export default function Semana() {
  const { t } = useTranslation();
  const s = useVirtus();
  const content = useContent();
  const now = new Date();
  useEffect(() => track('weekly_opened', {}), []);
  const w = summarizeWeek(s.records, now);
  const virtue = s.cycle?.virtue ?? 'humildad';
  const reading = fragmentFor(content, virtue, dayIndex(now) + 3);

  return (
    <Screen footer={<Button label={t('ritual.volverHoy')} onPress={goBackOrHome} />}>
      <Titular eyebrow={t('semana.eyebrow')}>{t('semana.titulo')}</Titular>
      <View style={{ flexDirection: 'row', gap: space.m }}>
        <Stat value={w.daysAccepted} label={t('semana.dias')} />
        <Stat value={w.examsDone} label={t('semana.examenes')} />
        <Stat value={w.challengesDone} label={t('semana.retos')} />
      </View>
      <Divider />
      <Stack gap={space.s}>
        <Eyebrow>{t('semana.patrones')}</Eyebrow>
        {w.byRole.length === 0 ? <Body>{t('semana.sinPatrones')}</Body> : null}
        {w.byRole.map((r) => (
          <View key={String(r.role)} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.m }}>
            <BodyStrong>{r.role ? t(`roles.${r.role}`) : '—'}</BodyStrong>
            <Body>
              {r.firstWon} {t('semana.primera')} · {r.secondWon} {t('semana.segunda')}
            </Body>
          </View>
        ))}
      </Stack>
      {s.plan.habits.length > 0 ? (
        <>
          <Divider />
          <Stack gap={space.s}>
            <Eyebrow>{t('semana.habitos')}</Eyebrow>
            {s.plan.habits.map((h) => (
              <View key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.m }}>
                <Body style={{ flex: 1 }}>{h.label}</Body>
                <Body>{t('semana.veces', { n: w.habits[h.id] ?? 0 })}</Body>
              </View>
            ))}
          </Stack>
        </>
      ) : null}
      <Divider />
      <Stack gap={space.s}>
        <H2>{t('semana.lectura')}</H2>
        <Cita author={reading.author}>{reading.text}</Cita>
      </Stack>
    </Screen>
  );
}
