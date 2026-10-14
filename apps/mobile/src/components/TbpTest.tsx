/**
 * Flujo del test de temperamento oficial: etapa 1 → desempate (si hace falta) →
 * transición → etapa 2. Devuelve el resultado ya decidido por el motor oficial.
 */
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  applyAnswers,
  breakTie,
  buildStage1Order,
  buildStage2Order,
  buildTieOrder,
  decideProfile,
  mergeScores,
  stage2Score,
  toTemperamentResult,
  topAndMargin,
  type Scores,
  type TbpAnswer,
  type TbpItem,
  type Temperament,
  type TemperamentResult,
} from '@virtus/method';
import type { VlTemperamentTest } from '@virtus/content';

import { Body, Button, Caption, Eyebrow, H1, Progress, Screen, Stack } from '@/components/ui';
import { color, radius, space, type } from '@/theme';

type Phase = 'welcome' | 'stage1' | 'tie' | 'transition' | 'stage2';

function Answer({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 64,
        borderRadius: radius.m,
        borderWidth: 1.5,
        borderColor: color.azulProfundo,
        backgroundColor: pressed ? color.azulProfundo : color.blanco,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      {({ pressed }) => <Text style={[type.h3, { color: pressed ? color.blanco : color.azulProfundo, letterSpacing: 1 }]}>{label}</Text>}
    </Pressable>
  );
}

export function TbpTest({
  test,
  onDone,
  intro,
  source = 'self',
}: {
  test: VlTemperamentTest;
  onDone: (r: TemperamentResult) => void;
  intro?: string;
  source?: TemperamentResult['source'];
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('welcome');
  const [s1] = useState<TbpItem[]>(() => buildStage1Order());
  const [a1, setA1] = useState<TbpAnswer[]>([]);
  const [tie, setTie] = useState<TbpItem[]>([]);
  const [aT, setAT] = useState<TbpAnswer[]>([]);
  const [primary, setPrimary] = useState<Temperament | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [s2, setS2] = useState<{ id: string; adj: 'A' | 'B' }[]>([]);
  const [a2, setA2] = useState<TbpAnswer[]>([]);
  const [i, setI] = useState(0);

  const total = 16 + tie.length + 6;
  const position = phase === 'stage1' ? i + 1 : phase === 'tie' ? 16 + i + 1 : phase === 'stage2' ? 16 + tie.length + i + 1 : 0;
  const item = useMemo(() => (phase === 'stage1' ? s1[i] : phase === 'tie' ? tie[i] : phase === 'stage2' ? s2[i] : null), [phase, i, s1, tie, s2]);

  const finishStage1 = (merged: Scores, forced?: Temperament) => {
    const top = forced ?? topAndMargin(merged).top;
    setScores(merged);
    setPrimary(top);
    setS2(buildStage2Order(top));
    setI(0);
    setPhase('transition');
  };

  const answer = (v: TbpAnswer) => {
    if (phase === 'stage1') {
      const next = [...a1];
      next[i] = v;
      setA1(next);
      if (i + 1 < s1.length) return setI(i + 1);
      const sc = applyAnswers(s1, next);
      const { tiedTypes } = topAndMargin(sc);
      if (tiedTypes.length >= 2) {
        setTie(buildTieOrder(tiedTypes));
        setI(0);
        return setPhase('tie');
      }
      return finishStage1(sc);
    }
    if (phase === 'tie') {
      const next = [...aT];
      next[i] = v;
      setAT(next);
      if (i + 1 < tie.length) return setI(i + 1);
      const merged = mergeScores(applyAnswers(s1, a1), applyAnswers(tie, next));
      const { top, tiedTypes } = topAndMargin(merged);
      return finishStage1(merged, tiedTypes.length >= 2 ? breakTie(tiedTypes, s1, a1) : top);
    }
    if (phase === 'stage2' && primary && scores) {
      const next = [...a2];
      next[i] = v;
      setA2(next);
      if (i + 1 < s2.length) return setI(i + 1);
      const decision = decideProfile(primary, scores, stage2Score(s2, next));
      onDone(toTemperamentResult(primary, scores, decision, { testId: test.id, testVersion: test.version, source }));
    }
  };

  if (phase === 'welcome') {
    return (
      <Screen footer={<Button label={test.ui.welcome.button} onPress={() => setPhase('stage1')} />}>
        <Stack gap={space.s} style={{ marginTop: space.l }}>
          <Eyebrow>{t('test.eyebrow')}</Eyebrow>
          <H1>{t('test.titulo')}</H1>
        </Stack>
        <Body>{intro ?? test.ui.welcome.intro}</Body>
        <View style={{ borderLeftWidth: 3, borderLeftColor: color.doradoVirtud, paddingLeft: space.m }}>
          <Body>{test.ui.welcome.notice}</Body>
        </View>
        <Caption>
          {test.ui.welcome.duration_label} · {test.ui.welcome.duration_text}
        </Caption>
        <Caption>{test.ui.welcome.byline}</Caption>
      </Screen>
    );
  }

  if (phase === 'transition' && primary) {
    return (
      <Screen variant="marca" footer={<Button label={test.ui.transition.button} onPress={() => setPhase('stage2')} />}>
        <Stack gap={space.m} style={{ marginTop: space.xxl }}>
          <Eyebrow>{test.ui.transition.eyebrow}</Eyebrow>
          <H1>
            {test.ui.transition.title_template}
            {test.temperaments[primary].name.toLowerCase()}
            {test.ui.transition.title_template_suffix}
          </H1>
          <Body>{test.ui.transition.text}</Body>
        </Stack>
      </Screen>
    );
  }

  const back = () => i > 0 && setI(i - 1);
  return (
    <Screen
      footer={
        <View style={{ gap: space.s }}>
          <View style={{ flexDirection: 'row', gap: space.m }}>
            <Answer label={test.ui.question.yes} onPress={() => answer('SI')} />
            <Answer label={test.ui.question.no} onPress={() => answer('NO')} />
          </View>
          {i > 0 ? <Button variant="ghost" label={test.ui.question.back.replace('← ', '')} onPress={back} /> : null}
        </View>
      }>
      <Stack gap={space.s}>
        <Eyebrow>{test.ui.question.progress.replace('{n}', String(position)).replace('{total}', String(total))}</Eyebrow>
        <Progress value={position / total} />
      </Stack>
      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: space.xl }}>
        <Text style={[type.h2, { color: color.azulProfundo, textAlign: 'center' }]}>{item ? test.items[item.id] : ''}</Text>
      </View>
    </Screen>
  );
}
