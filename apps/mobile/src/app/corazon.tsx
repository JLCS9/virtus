/**
 * Test «Corazón libre» (oficial). Las tendencias se presentan con un nombre descriptivo
 * y su remedio; el nombre del libro aparece solo como referencia.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HEART_CODES, scoreHeart, type HeartCode } from '@virtus/method';

import { HeartReport } from '@/components/HeartReport';
import { Body, Button, Caption, Eyebrow, Screen, Stack, Titular } from '@/components/ui';
import { LikertTest } from '@/components/LikertTest';
import { useContent } from '@/features/content';
import { goBackOrHome } from '@/features/nav';
import { useVirtus, type HeartRecord } from '@/store/virtus';
import { space } from '@/theme';

export default function TestCorazon() {
  const { t } = useTranslation();
  const test = useContent().vlTests.heart;
  const addHeart = useVirtus((s) => s.addHeart);
  const [started, setStarted] = useState(false);
  const [record, setRecord] = useState<HeartRecord | null>(null);

  if (record) {
    return (
      <Screen footer={<Button label={t('comun.listo')} onPress={goBackOrHome} />}>
        <Titular eyebrow={t('corazon.eyebrow')}>{t('corazon.resultado')}</Titular>
        <Body>{t('corazon.resultadoIntro')}</Body>
        <HeartReport record={record} />
        <Caption>{t('corazon.ayuda')}</Caption>
      </Screen>
    );
  }

  if (!started) {
    return (
      <Screen footer={<Button label={t('comun.continuar')} onPress={() => setStarted(true)} />}>
        <Titular eyebrow={t('corazon.eyebrow')}>{t('corazon.titulo')}</Titular>
        <Body>{t('corazon.intro')}</Body>
        <Stack gap={space.xs}>
          <Eyebrow>{t('corazon.queMide')}</Eyebrow>
          <Body>{test.texts['about-heart.html']}</Body>
        </Stack>
        <Caption>{test.welcome?.duration_text ?? ''}</Caption>
        <Caption>{t('corazon.ayuda')}</Caption>
      </Screen>
    );
  }

  const u = test.ui;
  return (
    <LikertTest
      questions={test.questions}
      options={[
        // Mismo orden que el test oficial; todas las afirmaciones describen un síntoma.
        { label: u.strongly_agree, value: 4 },
        { label: u.agree, value: 3 },
        { label: u.neutral, value: 2 },
        { label: u.disagree, value: 1 },
        { label: u.strongly_disagree, value: 0 },
      ]}
      progressLabel={(n, total) => t('test.pregunta', { n, total })}
      backLabel={t('test.anterior')}
      finishLabel={t('corazon.ver')}
      onDone={(answers) => {
        const r = scoreHeart(answers, test);
        const rec: HeartRecord = {
          takenAt: new Date().toISOString(),
          testVersion: test.version,
          pct: Object.fromEntries(HEART_CODES.map((c: HeartCode) => [c, r.disorders[c].pct])),
          stage: Object.fromEntries(HEART_CODES.map((c: HeartCode) => [c, r.disorders[c].stage])),
          verdict: r.verdict,
        };
        addHeart(rec);
        setRecord(rec);
      }}
    />
  );
}
