import { goBackOrHome } from '@/features/nav';
import { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { examTone, type ExamEntry, type Role } from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Chip, Eyebrow, Field, Filete, H1, Row, Screen, Stack } from '@/components/ui';
import { useToday } from '@/features/today';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

export default function ExamenNoche() {
  const { t } = useTranslation();
  const today = useToday();
  const s = useVirtus();
  const tone = examTone(s.temperament?.dominant ?? null);
  const full = s.plan.examFormat === 'completo';
  const saved = today.record?.exam;
  const [e, setE] = useState<ExamEntry>(
    saved ?? {
      situation: '',
      situationRole: today.role,
      firstReaction: '',
      secondReaction: '',
      secondPrevailed: null,
      challengeDone: null,
      tomorrow: '',
      good: '',
      format: s.plan.examFormat,
      completedAt: '',
    },
  );
  const [closed, setClosed] = useState(false);
  const set = (p: Partial<ExamEntry>) => setE((x) => ({ ...x, ...p }));

  const close = () => {
    s.saveExam(today.key, { ...e, completedAt: new Date().toISOString() });
    setClosed(true);
  };

  if (closed) {
    return (
      <Screen variant="noche" scroll={false} contentStyle={{ justifyContent: 'center' }} footer={<Button label={t('ritual.volverHoy')} onPress={goBackOrHome} />}>
        <StatusBar style="light" />
        <Stack gap={space.m}>
          <Filete />
          <H1>{t(`examen.cierre.${tone}`)}</H1>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen variant="noche" footer={<Button label={t('examen.guardar')} disabled={!e.situation.trim() && !e.good.trim()} onPress={close} />}>
      <StatusBar style="light" />
      <Stack gap={space.s}>
        <Eyebrow>{t('examen.eyebrow')}</Eyebrow>
        <Filete />
      </Stack>
      <Body>{t(`examen.intro.${tone}`)}</Body>

      {today.record?.challenge ? (
        <View style={{ gap: space.xs }}>
          <Caption>{t('ritual.retoEyebrow')}</Caption>
          <BodyStrong>{today.record.challenge.text}</BodyStrong>
        </View>
      ) : null}

      <Field label={`1. ${t('examen.q1')}`} value={e.situation} onChangeText={(situation) => set({ situation })} multiline />
      {s.roles.length > 0 ? (
        <Stack gap={space.s}>
          <Caption>{t('examen.q1rol')}</Caption>
          <Row>
            {s.roles.map((r) => (
              <Chip
                key={r.role}
                label={t(`roles.${r.role}`)}
                selected={e.situationRole === r.role}
                onPress={() => set({ situationRole: e.situationRole === r.role ? null : (r.role as Role) })}
              />
            ))}
          </Row>
        </Stack>
      ) : null}

      <Field
        label={`2. ${t('examen.q2')}`}
        hint={full ? t('examen.q2hint') : undefined}
        value={e.firstReaction}
        onChangeText={(firstReaction) => set({ firstReaction })}
        multiline
      />
      <Field
        label={`3. ${t('examen.q3')}`}
        hint={full ? t('examen.q3hint') : undefined}
        value={e.secondReaction}
        onChangeText={(secondReaction) => set({ secondReaction })}
        multiline
      />
      <Stack gap={space.s}>
        <Caption>{t('examen.q3prevalecio')}</Caption>
        <Row>
          <Chip label={t('examen.primera')} selected={e.secondPrevailed === false} onPress={() => set({ secondPrevailed: false })} />
          <Chip label={t('examen.segunda')} selected={e.secondPrevailed === true} onPress={() => set({ secondPrevailed: true })} />
        </Row>
      </Stack>

      <Stack gap={space.s}>
        <BodyStrong>4. {t('examen.q4')}</BodyStrong>
        <Row>
          <Chip label={t('examen.si')} selected={e.challengeDone === 'si'} onPress={() => set({ challengeDone: 'si' })} />
          <Chip label={t('examen.enParte')} selected={e.challengeDone === 'en_parte'} onPress={() => set({ challengeDone: 'en_parte' })} />
          <Chip label={t('examen.no')} selected={e.challengeDone === 'no'} onPress={() => set({ challengeDone: 'no' })} />
        </Row>
      </Stack>
      {full ? <Field label={t('examen.q4b')} value={e.tomorrow} onChangeText={(tomorrow) => set({ tomorrow })} multiline /> : null}

      <Field label={`5. ${t('examen.q5')}`} value={e.good} onChangeText={(good) => set({ good })} multiline />
    </Screen>
  );
}
