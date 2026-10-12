/**
 * Flujo de la persona invitada (sin cuenta), autorizado solo por el token.
 *  GET  ?token=…  → tipo de invitación y definición del test a responder.
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

function validTemperament(r: unknown): r is { percent: Record<string, number>; dominant: string; secondary: string | null; type: string } {
  if (!r || typeof r !== 'object') return false;
  const t = r as Record<string, unknown>;
  const p = t.percent as Record<string, unknown> | undefined;
  return (
    TEMPERAMENTS.includes(t.dominant as string) &&
    (t.secondary === null || TEMPERAMENTS.includes(t.secondary as string)) &&
    typeof t.type === 'string' &&
    !!p &&
    TEMPERAMENTS.every((k) => typeof p[k] === 'number')
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const admin = adminClient();

  if (req.method === 'GET') {
    const inv = await load(new URL(req.url).searchParams.get('token'));
    if (!inv) return json({ error: 'not_found' }, 404);
    if (inv.completed_at) return json({ error: 'already_completed' }, 409);
    const kind = inv.kind === 'temperament' ? 'temperament' : 'character';
    const { data: def } = await admin
      .from('test_definitions')
      .select('definition')
      .eq('kind', kind)
      .eq('locale', 'es')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return json({ kind: inv.kind, test: def?.definition ?? null });
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
    const { percent, dominant, secondary, type } = body.result;
    await admin
      .from('invitations')
      .update({ completed_at: now, consent_at: now, result: { percent, dominant, secondary, type } })
      .eq('id', inv.id);
  }
  return json({ ok: true });
});
