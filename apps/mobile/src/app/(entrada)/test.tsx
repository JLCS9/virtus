import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { isComplete, resolveTemperament, scoreTest, type Answers, type Temperament } from '@virtus/method';

import { Body, Button, Caption, Choice, Eyebrow, H2, Progress, Screen, Stack } from '@/components/ui';
import { track } from '@/features/analytics';
import { useContent } from '@/features/content';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

export default function TestTemperamento() {
  const { t } = useTranslation();
  const test = useContent().tests.temperament;
  const setTemperament = useVirtus((s) => s.setTemperament);
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const item = index >= 0 ? test.items[index] : null;
  const total = test.items.length;
  const done = useMemo(() => isComplete(test, answers), [test, answers]);

  const finish = () => {
    const scores = scoreTest(test, answers) as Record<Temperament, number>;
    track('test_completed', { kind: 'temperament', repeat: useVirtus.getState().temperamentHistory.length > 0 });
    setTemperament(resolveTemperament(scores, { testId: test.id, testVersion: test.version }));
    router.replace('/revelacion');
  };

  const choose = (optionId: string) => {
    if (!item) return;
    setAnswers((a) => ({ ...a, [item.id]: optionId }));
    if (timer.current) clearTimeout(timer.current);
    // Se responde con la primera reacción: avanzamos solos tras elegir.
    if (index < total - 1) timer.current = setTimeout(() => setIndex((i) => i + 1), 280);
  };

  if (!item) {
    return (
      <Screen footer={<Button label={t('comun.continuar')} onPress={() => setIndex(0)} />}>
        <Stack gap={space.s}>
          <Eyebrow>{t('test.eyebrow')}</Eyebrow>
          <H2>{test.title}</H2>
        </Stack>
        <Body>{test.intro}</Body>
        {test.status === 'draft' ? <Caption>{t('comun.borrador')}</Caption> : null}
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={{ gap: space.s }}>
          {done ? <Button label={t('test.ver')} onPress={finish} /> : null}
          {index > 0 ? <Button variant="ghost" label={t('test.anterior')} onPress={() => setIndex((i) => i - 1)} /> : null}
        </View>
      }>
      <Stack gap={space.s}>
        <Eyebrow>{t('test.pregunta', { n: index + 1, total })}</Eyebrow>
        <Progress value={(index + 1) / total} />
      </Stack>
      <H2>{item.prompt}</H2>
      {item.type === 'choice' ? (
        <View accessibilityRole="radiogroup" style={{ gap: space.s }}>
          {item.options.map((o) => (
            <Choice key={o.id} label={o.label} selected={answers[item.id] === o.id} onPress={() => choose(o.id)} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
