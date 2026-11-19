// Acceso (src/pages/Login.jsx de la web): email + contraseña, «¿Has olvidado tu contraseña?» y enlace al test.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { AccountError, hayCuentas, sendPasswordReset, signIn, useSession } from '@/nativo/cuenta';
import { PAGINA_WEB, abrirWeb } from '@/nativo/navegacion';
import { t } from '@/nativo/t';
import { BEIGE, GOLD, INK, LINE, MUTED, NAVY, NAVY_SOFT, PAPER } from '@/nativo/tema';
import { Aviso } from '@/nativo/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Fuentes de las páginas públicas de la web: FONT_SERIF (Cormorant Garamond) y FONT_SANS (Inter).
const SERIF = 'CormorantGaramond_600SemiBold';
const SANS = 'Inter_400Regular';
const SANS_600 = 'Inter_600SemiBold';

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        backgroundColor: PAPER,
        borderWidth: 1,
        borderColor: LINE,
        borderRadius: 4,
        paddingVertical: 40,
        paddingHorizontal: 28,
        shadowColor: NAVY,
        shadowOpacity: 0.06,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }}>
      {children}
    </View>
  );
}

function Ojo({ visible }: { visible: boolean }) {
  const p = { stroke: MUTED, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      {visible ? (
        <>
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" {...p} />
          <Circle cx="12" cy="12" r="3" {...p} />
        </>
      ) : (
        <>
          <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" {...p} />
          <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" {...p} />
          <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" {...p} />
          <Line x1="1" y1="1" x2="23" y2="23" {...p} />
        </>
      )}
    </Svg>
  );
}

function Campo({
  label,
  value,
  onChangeText,
  password,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  password?: boolean;
}) {
  const [foco, setFoco] = useState(false);
  const [ver, setVer] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily: SANS_600, fontSize: 12, color: NAVY, letterSpacing: 0.72, textTransform: 'uppercase', marginBottom: 6 }}>{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          secureTextEntry={password && !ver}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={password ? 'default' : 'email-address'}
          textContentType={password ? 'password' : 'emailAddress'}
          autoComplete={password ? 'current-password' : 'email'}
          style={{
            fontFamily: SANS,
            fontSize: 15,
            paddingVertical: 12,
            paddingLeft: 14,
            paddingRight: password ? 44 : 14,
            backgroundColor: PAPER,
            color: INK,
            borderWidth: 1,
            borderColor: foco ? GOLD : LINE,
            borderRadius: 2,
          }}
        />
        {password ? (
          <Pressable
            accessibilityLabel={ver ? 'Ocultar' : 'Mostrar'}
            onPress={() => setVer((v) => !v)}
            hitSlop={10}
            style={{ position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center', padding: 4 }}>
            <Ojo visible={ver} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const titulo = (
    <>
      <Text style={{ fontFamily: SANS_600, fontSize: 12, letterSpacing: 2.16, textTransform: 'uppercase', color: '#9D8240', marginBottom: 10 }}>
        {t('panel.eyebrow')}
      </Text>
      <Text accessibilityRole="header" style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 35, color: NAVY }}>
        {t('panel.login_title')}
      </Text>
    </>
  );
  const parrafo = { fontFamily: SANS, fontSize: 16, lineHeight: 26, color: INK };

  if (!hayCuentas) {
    return (
      <Card>
        {titulo}
        <Text style={[parrafo, { marginTop: 12 }]}>{t('panel.no_accounts')}</Text>
        <Pressable onPress={() => abrirWeb(PAGINA_WEB.testTemperamento)}>
          <Text style={{ fontFamily: SANS, color: NAVY, marginTop: 12 }}>{t('panel.take_test')} →</Text>
        </Pressable>
      </Card>
    );
  }

  async function submit() {
    if (busy) return;
    setError(null);
    setResetSent(false);
    if (!EMAIL_RE.test(email.trim()) || !password) {
      setError(t('panel.errors.invalid'));
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err) {
      const code = err instanceof AccountError ? err.code : 'failed';
      setError(t(code === 'invalid' ? 'panel.errors.invalid' : code === 'pending_guardian' ? 'panel.errors.pending_guardian' : 'panel.errors.generic'));
      setBusy(false);
    }
  }

  async function forgot() {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('panel.errors.email_for_reset'));
      return;
    }
    try {
      // El enlace del email lleva a la página de la web para elegir la contraseña nueva.
      await sendPasswordReset(email.trim().toLowerCase(), PAGINA_WEB.restablecer);
      setResetSent(true);
    } catch {
      setError(t('panel.errors.generic'));
    }
  }

  return (
    <Card>
      {titulo}
      <Text style={[parrafo, { marginTop: 12, marginBottom: 24 }]}>{t('panel.login_intro')}</Text>

      {error ? <Aviso>{error}</Aviso> : null}
      {resetSent ? <Aviso tono="ok">{t('panel.reset_sent')}</Aviso> : null}

      <Campo label={t('panel.fields.email')} value={email} onChangeText={setEmail} />
      <Campo label={t('panel.fields.password')} value={password} onChangeText={setPassword} password />
      <Pressable
        accessibilityRole="button"
        onPress={submit}
        disabled={busy}
        style={{ backgroundColor: busy ? NAVY_SOFT : NAVY, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 2, alignItems: 'center' }}>
        <Text style={{ fontFamily: SANS_600, fontSize: 14, letterSpacing: 0.56, color: PAPER }}>{busy ? t('panel.submitting') : t('panel.submit')}</Text>
      </Pressable>

      <View style={{ marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Pressable onPress={forgot}>
          <Text style={{ fontFamily: SANS, fontSize: 14, color: NAVY, textDecorationLine: 'underline' }}>{t('panel.forgot')}</Text>
        </Pressable>
        <Pressable onPress={() => abrirWeb(PAGINA_WEB.testTemperamento)}>
          <Text style={{ fontFamily: SANS, fontSize: 14, color: NAVY, textDecorationLine: 'underline' }}>{t('panel.no_account')}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function Login() {
  const session = useSession();
  const insets = useSafeAreaInsets();
  if (session) return <Redirect href="/portal" />;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BEIGE }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top + 48, paddingBottom: insets.bottom + 48, paddingHorizontal: 24 }}>
        {session === undefined ? <Text style={{ fontFamily: SANS, textAlign: 'center', color: MUTED }}>...</Text> : <LoginForm />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
