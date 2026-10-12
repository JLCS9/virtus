import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { characterGlobals, scoreCharacter, type Virtue } from '@virtus/method';

import { Body, Button, Caption, Screen, Titular } from '@/components/ui';
import { CharacterReport } from '@/components/CharacterReport';
import { LikertTest } from '@/components/LikertTest';
import { track } from '@/features/analytics';
import { useContent } from '@/features/content';
import { goBackOrHome } from '@/features/nav';
import { useVirtus, type CharacterResult } from '@/store/virtus';

export default function TestCaracter() {
  const { t } = useTranslation();
  const test = useContent().vlTests.character;
  const addCharacter = useVirtus((s) => s.addCharacter);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<CharacterResult | null>(null);

  if (result) {
    return (
      <Screen footer={<Button label={t('comun.listo')} onPress={goBackOrHome} />}>
        <Titular eyebrow={t('caracter.eyebrow')}>{t('caracter.resultado')}</Titular>
        <Body>{t('caracter.resultadoIntro')}</Body>
        <CharacterReport self={result.self} facets={result.facets} test={test} />
        <Caption>{t('caracter.fuente')}</Caption>
      </Screen>
    );
  }

  if (!started) {
    return (
      <Screen footer={<Button label={test.welcome.button ?? t('comun.continuar')} onPress={() => setStarted(true)} />}>
        <Titular eyebrow={t('caracter.eyebrow')}>{t('caracter.titulo')}</Titular>
        <Body>{test.welcome.intro_line1}</Body>
        <Body>{test.welcome.intro_line2}</Body>
        <Body>{t('caracter.humildadNota')}</Body>
        <Caption>{test.welcome.duration_text}</Caption>
      </Screen>
    );
  }

  const u = test.ui;
  return (
    <LikertTest
      questions={test.questions}
      options={[
        // Mismo orden que el test oficial.
        { label: u.strongly_disagree, value: -1 },
        { label: u.disagree, value: -0.5 },
        { label: u.neutral, value: 0 },
        { label: u.agree, value: 0.5 },
        { label: u.strongly_agree, value: 1 },
      ]}
      progressLabel={(n, total) => t('test.pregunta', { n, total })}
      backLabel={t('test.anterior')}
      finishLabel={t('caracter.guardar')}
      onDone={(answers) => {
        const scores = scoreCharacter(answers, test);
        const r: CharacterResult = {
          takenAt: new Date().toISOString(),
          testVersion: test.version,
          self: characterGlobals(scores),
          facets: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, { passive: v.passive, active: v.active }])) as Record<
            Virtue,
            { passive: number; active: number }
          >,
          others: [],
        };
        track('test_completed', { kind: 'character', repeat: useVirtus.getState().character.length > 0 });
        addCharacter(r);
        setResult(r);
      }}
    />
  );
}
