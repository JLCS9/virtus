/**
 * Pantalla pública para la persona invitada: responde un test oficial sin cuenta.
 * No se muestra ningún dato de quien invita ni se guarda nada en este dispositivo.
 */
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { characterGlobals, scoreCharacter, type TemperamentResult } from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Screen, Stack, Titular, Wordmark } from '@/components/ui';
import { LikertTest } from '@/components/LikertTest';
import { TbpTest } from '@/components/TbpTest';
import { useContent } from '@/features/content';
import { submitInvitation, validateInvitation, type InvitationKind } from '@/features/invitations';
import { color, space } from '@/theme';

type Step = 'loading' | 'error' | 'consent' | 'test' | 'done';

export default function Invitacion() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const tests = useContent().vlTests;
  const [step, setStep] = useState<Step>('loading');
  const [kind, setKind] = useState<InvitationKind>('temperament');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    validateInvitation(token).then((r) => {
      if (!r) return setStep('error');
      setKind(r);
      setStep('consent');
    });
  }, [token]);

  const send = async (result: unknown) => {
    setStep('loading');
    setStep((await submitInvitation(token, result)) ? 'done' : 'error');
  };

  if (step === 'loading') return <Screen><Wordmark /></Screen>;
  if (step === 'error' || step === 'done') {
    return (
      <Screen>
        <Wordmark />
        <Titular eyebrow={t('invitado.eyebrow')}>{step === 'done' ? t('invitado.gracias') : t('invitado.noDisponible')}</Titular>
        <Body>{step === 'done' ? t('invitado.graciasTexto') : t('invitado.noDisponibleTexto')}</Body>
      </Screen>
    );
  }

  const view = kind === 'character_view';
  if (step === 'consent') {
    return (
      <Screen footer={<Button label={t('comun.continuar')} disabled={!consent} onPress={() => setStep('test')} />}>
        <Wordmark />
        <Titular eyebrow={t('invitado.eyebrow')}>{view ? t('invitado.tituloMirada') : t('invitado.tituloTest')}</Titular>
        <Body>{view ? t('invitado.introMirada') : t('invitado.introTest')}</Body>
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

  if (!view) {
    return (
      <TbpTest
        test={tests.temperament}
        source="invitation"
        onDone={(r: TemperamentResult) => send({ type: r.type, dominant: r.dominant, secondary: r.secondary, isPure: r.isPure })}
      />
    );
  }

  const u = tests.character.ui;
  return (
    <LikertTest
      header={
        <View style={{ borderLeftWidth: 3, borderLeftColor: color.doradoVirtud, paddingLeft: space.m }}>
          <Caption>{t('invitado.instruccionMirada')}</Caption>
        </View>
      }
      questions={tests.character.questions}
      options={[
        { label: u.strongly_disagree, value: -1 },
        { label: u.disagree, value: -0.5 },
        { label: u.neutral, value: 0 },
        { label: u.agree, value: 0.5 },
        { label: u.strongly_agree, value: 1 },
      ]}
      progressLabel={(n, total) => t('test.pregunta', { n, total })}
      backLabel={t('test.anterior')}
      finishLabel={t('invitado.enviar')}
      onDone={(answers) => send(characterGlobals(scoreCharacter(answers, tests.character)))}
    />
  );
}
