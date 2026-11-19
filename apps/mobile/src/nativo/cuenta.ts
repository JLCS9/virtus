// Cuenta en el lado nativo: entrar, salir, sesión y llave de acceso al portal.
// Mismas consultas que la web (src/account/account.js, retos.js, useSession.js, useAcceso.js).
// La sesión vive aquí (AsyncStorage) y se le pasa al portal (src/portal/PortalWeb.tsx).
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

function db() {
  if (!supabase) throw new Error('sin_backend');
  return supabase;
}

export const hayCuentas = supabase !== null;

export class AccountError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const pendienteDeTutor = (error: { code?: string; message?: string } | null) =>
  error?.code === 'user_banned' || /banned/i.test(error?.message || '');

export async function signIn(email: string, password: string) {
  const { error } = await db().auth.signInWithPassword({ email, password });
  if (error && pendienteDeTutor(error)) throw new AccountError('pending_guardian');
  if (error) throw new AccountError(error.status === 400 ? 'invalid' : 'failed');
}

export async function sendPasswordReset(email: string, redirectTo: string) {
  const { error } = await db().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new AccountError('failed');
}

export async function salir() {
  await db().auth.signOut({ scope: 'local' });
}

/** ¿Suscripción activa (public.suscripciones_retos)? Solo decide qué enseñar: el servidor lo exige igualmente. */
export async function tieneAccesoRetos(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.from('suscripciones_retos').select('activa, hasta').maybeSingle();
  return Boolean(data?.activa && (!data.hasta || new Date(data.hasta) > new Date()));
}

/** Sesión de Supabase. `undefined` mientras carga, `null` sin sesión. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null);
  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

let ultimoAcceso: boolean | undefined;

/** ¿Suscripción activa? `undefined` mientras se comprueba (se recuerda entre pantallas). */
export function useAcceso(activo = true): boolean | undefined {
  const [acceso, setAcceso] = useState(ultimoAcceso);
  useEffect(() => {
    if (!activo) return undefined;
    let vivo = true;
    tieneAccesoRetos()
      .then((ok) => {
        ultimoAcceso = ok;
        if (vivo) setAcceso(ok);
      })
      .catch(() => {
        if (vivo) setAcceso(false);
      });
    return () => {
      vivo = false;
    };
  }, [activo]);
  return activo ? acceso : undefined;
}

export function olvidarAcceso() {
  ultimoAcceso = undefined;
}
