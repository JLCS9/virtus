/**
 * Flujo de la persona invitada (sin cuenta), autorizado solo por el token.
 *  GET  ?token=…  → tipo de invitación (los tests oficiales están en la app).
 *  POST { token, consent, result } → guarda la respuesta una sola vez.
 * No se devuelve ningún dato de quien invita.
 */
import { adminClient, cors, json } from '../_shared/http.ts';

const VIRTUES = ['magnanimidad', 'humildad', 'prudencia', 'fortaleza', 'dominio', 'justicia'];
const TEMPERAMENTS = ['COL', 'MEL', 'SAN', 'FLE'];

type Invitation = { id: string; inviter_id: string; kind: 'temperament' | 'character_view'; expires_at: string; completed_at: string | null };

async function load(token: string | null): Promise<Invitation | null> {
  if (!token || token.length < 16) return null;
  const { data } = await adminClient()
    .from('invitations')
    .select('id, inviter_id, kind, expires_at, completed_at')
    .eq('token', token)
    .maybeSingle();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data as Invitation;
}

function validCharacter(r: unknown): r is Record<string, number> {
  if (!r || typeof r !== 'object') return false;
  return VIRTUES.every((v) => {
    const x = (r as Record<string, unknown>)[v];
    return typeof x === 'number' && x >= 0 && x <= 100;
  });
}

const TYPES = new Set(['COL', 'COL-MEL', 'COL-SAN', 'MEL', 'MEL-COL', 'MEL-FLE', 'SAN', 'SAN-COL', 'SAN-FLE', 'FLE', 'FLE-MEL', 'FLE-SAN']);

function validTemperament(r: unknown): r is { type: string; dominant: string; secondary: string | null; isPure: boolean } {
  if (!r || typeof r !== 'object') return false;
  const t = r as Record<string, unknown>;
  return (
    typeof t.type === 'string' &&
    TYPES.has(t.type) &&
    t.dominant === t.type.split('-')[0] &&
    (t.secondary ?? null) === (t.type.split('-')[1] ?? null) &&
    typeof t.isPure === 'boolean'
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const admin = adminClient();

  if (req.method === 'GET') {
    const inv = await load(new URL(req.url).searchParams.get('token'));
    if (!inv) return json({ error: 'not_found' }, 404);
    if (inv.completed_at) return json({ error: 'already_completed' }, 409);
    // Los tests oficiales viajan dentro de la app; aquí solo se confirma el tipo de invitación.
    return json({ kind: inv.kind });
  }

  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = (await req.json().catch(() => null)) as { token?: string; consent?: boolean; result?: unknown } | null;
  const inv = await load(body?.token ?? null);
  if (!inv) return json({ error: 'not_found' }, 404);
  if (inv.completed_at) return json({ error: 'already_completed' }, 409);
  if (body?.consent !== true) return json({ error: 'consent_required' }, 400);
  const now = new Date().toISOString();

  if (inv.kind === 'character_view') {
    if (!validCharacter(body.result)) return json({ error: 'bad_result' }, 400);
    const { error } = await admin.from('character_views').insert({ user_id: inv.inviter_id, invitation_id: inv.id, result: body.result });
    if (error) return json({ error: 'insert_failed' }, 500);
    await admin.from('invitations').update({ completed_at: now, consent_at: now }).eq('id', inv.id);
  } else {
    if (!validTemperament(body.result)) return json({ error: 'bad_result' }, 400);
    const { type, dominant, secondary, isPure } = body.result;
    await admin
      .from('invitations')
      .update({ completed_at: now, consent_at: now, result: { type, dominant, secondary, isPure } })
      .eq('id', inv.id);
  }
  return json({ ok: true });
});
