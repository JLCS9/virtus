import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Field, Screen, Stack, Titular } from '@/components/ui';
import { goBackOrHome } from '@/features/nav';
import { pullInvitationResults } from '@/features/invitations';
import { linkPurchasesUser } from '@/features/subscription';
import { pushAll } from '@/features/sync';
import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

/** Cuenta con código por email (sin contraseña). Apple y Google llegan con la build nativa. */
export default function Cuenta() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'in'>('email');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) {
        setEmail(data.session.user.email ?? '');
        setStep('in');
      }
    });
  }, []);

  if (!supabase) {
    return (
      <Screen footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
        <Titular eyebrow={t('cuenta.eyebrow')}>{t('cuenta.titulo')}</Titular>
        <Body>{t('cuenta.sinBackend')}</Body>
      </Screen>
    );
  }

  const send = async () => {
    setMsg(null);
    const { error } = await supabase!.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    if (error) setMsg(t('cuenta.error'));
    else setStep('code');
  };
  const verify = async () => {
    setMsg(null);
    const { data, error } = await supabase!.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    if (error) return setMsg(t('cuenta.codigoMal'));
    if (data.user) await linkPurchasesUser(data.user.id);
    await pullInvitationResults();
    setStep('in');
    setMsg((await pushAll()) ? t('cuenta.sincronizado') : t('cuenta.error'));
  };

  return (
    <Screen footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
      <Titular eyebrow={t('cuenta.eyebrow')}>{t('cuenta.titulo')}</Titular>
      <Body>{t('cuenta.intro')}</Body>
      {step === 'email' ? (
        <Stack gap={space.m}>
          <Field label={t('cuenta.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Button label={t('cuenta.enviar')} disabled={!/.+@.+\..+/.test(email)} onPress={send} />
        </Stack>
      ) : null}
      {step === 'code' ? (
        <Stack gap={space.m}>
          <Field label={t('cuenta.codigo')} value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" maxLength={8} />
          <Button label={t('cuenta.verificar')} disabled={code.length < 6} onPress={verify} />
        </Stack>
      ) : null}
      {step === 'in' ? (
        <Stack gap={space.m}>
          <Body>{t('cuenta.conectado', { email })}</Body>
          <Button variant="secondary" label={t('cuenta.sincronizar')} onPress={async () => setMsg((await pushAll()) ? t('cuenta.sincronizado') : t('cuenta.error'))} />
          <Button
            variant="ghost"
            label={t('cuenta.salir')}
            onPress={async () => {
              await supabase!.auth.signOut();
              useVirtus.getState().setRetosSuscripcion(null);
              setStep('email');
            }}
          />
        </Stack>
      ) : null}
      {msg ? <Caption>{msg}</Caption> : null}
    </Screen>
  );
}
