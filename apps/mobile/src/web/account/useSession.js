import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Sesión actual de Supabase. `undefined` mientras carga, `null` sin sesión.
export function useSession() {
  const [session, setSession] = useState(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return session;
}
