import { goBackOrHome } from '@/features/nav';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isComplete, likertMax, normalizeScores, scoreTest, type Answers, type Virtue } from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Chip, Divider, Row, Screen, Titular } from '@/components/ui';
import { useContent } from '@/features/content';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

export default function TestCaracter() {
  const { t } = useTranslation();
  const test = useContent().tests.character;
  const addCharacter = useVirtus((s) => s.addCharacter);
  const [answers, setAnswers] = useState<Answers>({});
  const scale = test.likertScale!;
  const values = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);

  const save = () => {
    const self = normalizeScores(scoreTest(test, answers), likertMax(test)) as Record<Virtue, number>;
    addCharacter({ takenAt: new Date().toISOString(), testVersion: test.version, self, others: [] });
    goBackOrHome();
  };

  return (
    <Screen footer={<Button label={t('caracter.guardar')} disabled={!isComplete(test, answers)} onPress={save} />}>
      <Titular eyebrow={t('caracter.eyebrow')}>{test.title}</Titular>
      <Body>{test.intro}</Body>
      {test.status === 'draft' ? <Caption>{t('comun.borrador')}</Caption> : null}
      {test.items.map((item) => (
        <View key={item.id} style={{ gap: space.s }}>
          <Divider />
          <BodyStrong>{item.prompt}</BodyStrong>
          <Row>
            {values.map((v, i) => (
              <Chip key={v} label={scale.labels[i] ?? String(v)} selected={answers[item.id] === v} onPress={() => setAnswers((a) => ({ ...a, [item.id]: v }))} />
            ))}
          </Row>
        </View>
      ))}
    </Screen>
  );
}
