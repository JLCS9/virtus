import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-virtus-cliente',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** Cliente con el JWT del usuario (respeta RLS) y el usuario autenticado. */
export async function userContext(req: Request): Promise<{ db: SupabaseClient; user: User } | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const { data } = await db.auth.getUser();
  return data.user ? { db, user: data.user } : null;
}

/** Cliente de servicio: solo para operaciones que el usuario no puede hacer por RLS. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}
