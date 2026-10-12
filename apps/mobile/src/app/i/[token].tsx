/**
 * Pantalla pública para la persona invitada: responde el test sin cuenta.
 * No se muestra ningún dato de quien invita ni se guarda nada en este dispositivo.
 */
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  isComplete,
  likertMax,
  normalizeScores,
  resolveTemperament,
  scoreTest,
  type Answers,
  type Temperament,
  type TestDefinition,
} from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Chip, Choice, Divider, H2, Row, Screen, Stack, Titular, Wordmark } from '@/components/ui';
import { fetchInvitation, submitInvitation, type InvitationKind } from '@/features/invitations';
import { color, space } from '@/theme';

type State = { step: 'loading' } | { step: 'error' } | { step: 'test'; kind: InvitationKind; test: TestDefinition } | { step: 'done' };

export default function Invitacion() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [state, setState] = useState<State>({ step: 'loading' });
  const [answers, setAnswers] = useState<Answers>({});
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInvitation(token).then((r) => setState('error' in r ? { step: 'error' } : { step: 'test', ...r }));
  }, [token]);

  if (state.step === 'loading') return <Screen><Wordmark /></Screen>;
  if (state.step === 'error' || state.step === 'done') {
    return (
      <Screen>
        <Wordmark />
        <Titular eyebrow={t('invitado.eyebrow')}>{state.step === 'done' ? t('invitado.gracias') : t('invitado.noDisponible')}</Titular>
        <Body>{state.step === 'done' ? t('invitado.graciasTexto') : t('invitado.noDisponibleTexto')}</Body>
      </Screen>
    );
  }

  const { kind, test } = state;
  const view = kind === 'character_view';
  const scale = test.likertScale ?? { min: 1, max: 5, labels: [] };
  const values = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);

  const submit = async () => {
    setSending(true);
    const result = view
      ? normalizeScores(scoreTest(test, answers), likertMax(test))
      : resolveTemperament(scoreTest(test, answers) as Record<Temperament, number>, { testId: test.id, testVersion: test.version });
    const ok = await submitInvitation(token, result);
    setSending(false);
    setState(ok ? { step: 'done' } : { step: 'error' });
  };

  return (
    <Screen footer={<Button label={t('invitado.enviar')} disabled={!consent || !isComplete(test, answers) || sending} onPress={submit} />}>
      <Wordmark />
      <Titular eyebrow={t('invitado.eyebrow')}>{view ? t('invitado.tituloMirada') : t('invitado.tituloTest')}</Titular>
      <Body>{view ? t('invitado.introMirada') : t('invitado.introTest')}</Body>
      {test.items.map((item, i) => (
        <View key={item.id} style={{ gap: space.s }}>
          <Divider />
          {item.type === 'choice' ? (
            <>
              <H2>{`${i + 1}. ${item.prompt}`}</H2>
              {item.options.map((o) => (
                <Choice key={o.id} label={o.label} selected={answers[item.id] === o.id} onPress={() => setAnswers((a) => ({ ...a, [item.id]: o.id }))} />
              ))}
            </>
          ) : (
            <>
              <BodyStrong>{item.promptOther ?? item.prompt}</BodyStrong>
              <Row>
                {values.map((v, j) => (
                  <Chip key={v} label={scale.labels[j] ?? String(v)} selected={answers[item.id] === v} onPress={() => setAnswers((a) => ({ ...a, [item.id]: v }))} />
                ))}
              </Row>
            </>
          )}
        </View>
      ))}
      <Divider />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        onPress={() => setConsent((c) => !c)}
        style={{ flexDirection: 'row', gap: space.m, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 22,
            height: 22,
            marginTop: 2,
            borderWidth: 2,
            borderColor: consent ? color.azulProfundo : color.piedra,
            backgroundColor: consent ? color.azulProfundo : 'transparent',
          }}
        />
        <Stack gap={space.xs} style={{ flex: 1 }}>
          <BodyStrong>{view ? t('invitado.consentimientoMirada') : t('invitado.consentimientoTest')}</BodyStrong>
          <Caption>{t('invitado.privacidad')}</Caption>
        </Stack>
      </Pressable>
    </Screen>
  );
}
