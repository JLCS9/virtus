// PROPIO DE LA APP (sustituye a src/account/supabase.js de la web; lo pone scripts/sync-web.mjs).
//
// Mismo proyecto de Supabase que la web, pero dentro de la app la sesión NO se guarda aquí: la
// mantiene el lado nativo (apps/mobile/src/lib/supabase.ts, que es quien la renueva) y se la pasa al
// portal con setSession (ver apps/mobile/src/portal/PortalWeb.tsx). Así hay un solo dueño del
// refresh token y no se invalidan el uno al otro.
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anonKey
  ? createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'vl-portal-app' },
  })
  : null;

export const accountsEnabled = Boolean(supabase);
