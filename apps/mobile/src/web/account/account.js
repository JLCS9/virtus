// Alta de cuenta tras el test de temperamento y guardado del resultado.
import { supabase } from './supabase';
import { resultadoParaGuardar } from '../lib/virtudes.js';

const ACCOUNT_URL = process.env.EXPO_PUBLIC_ACCOUNT_URL || '/api/account';

export class AccountError extends Error {
  constructor(code) { super(code); this.code = code; }
}

const API_BASE = ACCOUNT_URL.replace(/\/account$/, '');

// Supabase devuelve 'user_banned' a las cuentas de menores de 14 que aún no ha
// autorizado su tutor (la cuenta nace bloqueada hasta entonces).
const isPendingGuardian = error => error?.code === 'user_banned' || /banned/i.test(error?.message || '');

// Crea la cuenta (o detecta que ya existe) e inicia sesión con la contraseña.
// Menor de 14 (guardianEmail): la cuenta queda pendiente del tutor, no se inicia
// sesión y el servidor guarda el resultado → { pendingGuardian: true }.
// Errores: 'wrong_password' (la cuenta ya existía y la contraseña no coincide),
// 'pending_guardian', 'guardian_required', 'guardian_unavailable',
// 'rate_limited', 'failed'.
export async function createAccountAndSignIn({ email, password, name, birthYear, sex, language, turned14, guardianEmail, result }) {
  let res;
  try {
    res = await fetch(ACCOUNT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, birthYear, sex, language, consent: true, turned14, guardianEmail, result }),
    });
  } catch {
    throw new AccountError('failed');
  }
  if (res.status === 429) throw new AccountError('rate_limited');
  if (res.status === 202) return { pendingGuardian: true };
  if (res.status === 400 && guardianEmail !== undefined) throw new AccountError('guardian_required');
  if (res.status === 503 && guardianEmail !== undefined) throw new AccountError('guardian_unavailable');
  if (res.status !== 201 && res.status !== 409) throw new AccountError('failed');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error && isPendingGuardian(error)) throw new AccountError('pending_guardian');
  if (error) throw new AccountError(res.status === 409 ? 'wrong_password' : 'failed');
  return { existed: res.status === 409 };
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error && isPendingGuardian(error)) throw new AccountError('pending_guardian');
  if (error) throw new AccountError(error.status === 400 ? 'invalid' : 'failed');
}

// Registra en el servidor lo que el usuario ha aceptado en el formulario del
// test (cuenta + boletín sí/no). Requiere sesión. No rompe el flujo si falla.
export async function recordFormConsents({ newsletter, language }) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return false;
    const res = await fetch(`${API_BASE}/consents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newsletter, language }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// El tutor autoriza la cuenta del menor. Devuelve 'ok' | 'already' | 'invalid' | 'expired' | 'failed'.
export async function confirmGuardian(token) {
  try {
    const res = await fetch(`${API_BASE}/guardian/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    return data.status || 'failed';
  } catch {
    return 'failed';
  }
}

export async function sendPasswordReset(email, redirectTo) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new AccountError('failed');
}

// Guarda el resultado en test_results (RLS: cada usuario solo ve los suyos).
export async function saveTemperamentResult(result) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AccountError('failed');
  const { error } = await supabase.from('test_results').insert({
    user_id: user.id,
    test_id: 'vl-temperamento',
    test_version: 'tbp-v1',
    kind: 'temperament',
    result,
  });
  if (error) throw new AccountError('failed');
}

export async function fetchLatestTemperament() {
  const { data, error } = await supabase
    .from('test_results')
    .select('result, taken_at')
    .eq('kind', 'temperament')
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AccountError('failed');
  return data;
}

export async function fetchFirstName(user) {
  return (await fetchNombreYSexo(user)).nombre;
}

/** { nombre, sexo } del perfil. sexo: 'hombre' | 'mujer' | null (para concordar el género). */
export async function fetchNombreYSexo(user) {
  const { data } = await supabase.from('profiles').select('first_name, sex').eq('id', user.id).maybeSingle();
  return {
    nombre: data?.first_name || user.user_metadata?.first_name || '',
    sexo: data?.sex === 'hombre' || data?.sex === 'mujer' ? data.sex : null,
  };
}

/** «Bienvenido, Álvaro» / «Bienvenida, Marta»; sin sexo conocido, «Te damos la bienvenida, …». */
export function saludoBienvenida(nombre, sexo) {
  const base = sexo === 'mujer' ? 'Bienvenida' : sexo === 'hombre' ? 'Bienvenido' : 'Te damos la bienvenida';
  return nombre ? `${base}, ${nombre}` : base;
}

// Último resultado del test de carácter (el que guarda la web o la app móvil), o null.
export async function fetchLatestCharacter() {
  const { data, error } = await supabase
    .from('test_results')
    .select('result, taken_at')
    .eq('kind', 'character')
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AccountError('failed');
  return data;
}

// Guarda el resultado del test de carácter si hay sesión, con la misma forma que la app móvil
// (test_results, kind 'character'). Es silencioso: nunca debe romper ni retrasar el test.
export async function saveCharacterResultIfLoggedIn(puntuacion) {
  try {
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    const result = resultadoParaGuardar(puntuacion);
    if (!user || !result) return false;
    const { error } = await supabase.from('test_results').insert({
      user_id: user.id,
      test_id: 'vl-caracter',
      test_version: '1.0.0',
      kind: 'character',
      source: 'self',
      result,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function saveHeartResultIfLoggedIn(scoreResult) {
  try {
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user || !scoreResult?.disorders) return false;
    const result = {};
    for (const [code, d] of Object.entries(scoreResult.disorders)) {
      result[code] = { score: d.score, pct: d.pct, stage: d.stage };
    }
    result.verdict = scoreResult.verdict;
    const { error } = await supabase.from('test_results').insert({
      user_id: user.id,
      test_id: 'vl-corazon',
      test_version: '1.0.0',
      kind: 'heart',
      source: 'self',
      result,
    });
    return !error;
  } catch {
    return false;
  }
}
