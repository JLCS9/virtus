import { useState } from 'react';
import { Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { WORK_VIRTUES, type WorkVirtue } from '@virtus/method';
import { habitsFor } from '@virtus/content';

import { Body, BodyStrong, Button, Caption, Chip, Divider, Eyebrow, Field, Row, Stack } from '@/components/ui';
import { useContent } from '@/features/content';
import type { Habit, Plan } from '@/store/virtus';
import { color, space } from '@/theme';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidPlan(p: Plan) {
  return TIME.test(p.morningTime) && TIME.test(p.eveningTime) && p.habits.length <= 3 && p.rhythm.some(Boolean);
}

function Toggle({ label, note, value, onChange }: { label: string; note?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
      <View style={{ flex: 1, gap: space.xs }}>
        <BodyStrong>{label}</BodyStrong>
        {note ? <Caption>{note}</Caption> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: color.azulProfundo, false: color.piedra }}
        thumbColor={color.blanco}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function PlanForm({
  plan,
  onChange,
  virtue,
  onVirtue,
}: {
  plan: Plan;
  onChange: (p: Plan) => void;
  virtue: WorkVirtue;
  onVirtue: (v: WorkVirtue) => void;
}) {
  const { t } = useTranslation();
  const content = useContent();
  const [custom, setCustom] = useState('');
  const days = t('dias', { returnObjects: true }) as string[];
  const suggestions = habitsFor(content, virtue);
  const set = (p: Partial<Plan>) => onChange({ ...plan, ...p });

  const toggleHabit = (label: string) => {
    const exists = plan.habits.find((h) => h.label === label);
    if (exists) set({ habits: plan.habits.filter((h) => h.label !== label) });
    else if (plan.habits.length < 3) set({ habits: [...plan.habits, { id: `h-${Date.now()}`, label, reminder: null } as Habit] });
  };

  return (
    <Stack gap={space.l}>
      <Stack gap={space.s}>
        <Eyebrow>{t('plan.manana')}</Eyebrow>
        <Field
          label={t('plan.hora')}
          value={plan.morningTime}
          onChangeText={(morningTime) => set({ morningTime })}
          placeholder="07:30"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        <BodyStrong>{t('plan.duracion')}</BodyStrong>
        <Row>
          <Chip label={t('plan.min2')} selected={plan.morningMinutes === 2} onPress={() => set({ morningMinutes: 2 })} />
          <Chip label={t('plan.min5')} selected={plan.morningMinutes === 5} onPress={() => set({ morningMinutes: 5 })} />
        </Row>
      </Stack>
      <Divider />
      <Stack gap={space.s}>
        <Eyebrow>{t('plan.noche')}</Eyebrow>
        <Field
          label={t('plan.hora')}
          value={plan.eveningTime}
          onChangeText={(eveningTime) => set({ eveningTime })}
          placeholder="21:30"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        <BodyStrong>{t('plan.formato')}</BodyStrong>
        <Row>
          <Chip label={t('plan.breve')} selected={plan.examFormat === 'breve'} onPress={() => set({ examFormat: 'breve' })} />
          <Chip label={t('plan.completo')} selected={plan.examFormat === 'completo'} onPress={() => set({ examFormat: 'completo' })} />
        </Row>
      </Stack>
      <Divider />
      <Stack gap={space.s}>
        <Eyebrow>{t('plan.ciclo')}</Eyebrow>
        <Caption>{t('plan.cicloNota')}</Caption>
        <Row>
          {WORK_VIRTUES.map((v) => (
            <Chip key={v} label={t(`virtudes.${v}`)} selected={virtue === v} onPress={() => onVirtue(v)} />
          ))}
        </Row>
      </Stack>
      <Divider />
      <Stack gap={space.s}>
        <Eyebrow>{t('plan.habitos')}</Eyebrow>
        <Caption>{t('plan.habitosNota')}</Caption>
        <Row>
          {[...new Set([...suggestions, ...plan.habits.map((h) => h.label)])].map((label) => (
            <Chip key={label} label={label} selected={plan.habits.some((h) => h.label === label)} onPress={() => toggleHabit(label)} />
          ))}
        </Row>
        {plan.habits.length < 3 ? (
          <View style={{ gap: space.s }}>
            <Field label={t('plan.habitoPropio')} value={custom} onChangeText={setCustom} maxLength={80} />
            <Button
              variant="secondary"
              label={t('comun.anadir')}
              disabled={custom.trim().length < 3}
              onPress={() => {
                toggleHabit(custom.trim());
                setCustom('');
              }}
            />
          </View>
        ) : null}
      </Stack>
      <Divider />
      <Stack gap={space.s}>
        <Eyebrow>{t('plan.ritmo')}</Eyebrow>
        <Caption>{t('plan.ritmoNota')}</Caption>
        <Row>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <Chip
              key={d}
              label={days[d]}
              selected={plan.rhythm[d]}
              onPress={() => set({ rhythm: plan.rhythm.map((v, i) => (i === d ? !v : v)) })}
            />
          ))}
        </Row>
      </Stack>
      <Divider />
      <Toggle label={t('plan.notificaciones')} value={plan.notifications} onChange={(notifications) => set({ notifications })} />
      <Toggle
        label={t('plan.espiritual')}
        note={t('plan.espiritualNota')}
        value={plan.spiritual}
        onChange={(spiritual) => set({ spiritual })}
      />
      {!isValidPlan(plan) ? <Body>{t('plan.horaInvalida')}</Body> : null}
    </Stack>
  );
}
