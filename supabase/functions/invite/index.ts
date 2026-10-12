/**
 * Crea una invitación (test de temperamento o mirada de los otros) y devuelve el enlace.
 * Nunca se contacta a nadie: el usuario comparte el enlace por su cuenta.
 */
import { adminClient, cors, json, userContext } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await userContext(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);
  const { kind, collaboratorId } = (await req.json().catch(() => ({}))) as { kind?: string; collaboratorId?: string };
  if (kind !== 'temperament' && kind !== 'character_view') return json({ error: 'bad_kind' }, 400);

  const base = Deno.env.get('INVITE_BASE_URL');
  if (!base) return json({ error: 'invite_base_url_missing' }, 500);

  const admin = adminClient();
  if (collaboratorId) {
    const { data: own } = await admin.from('collaborators').select('id').eq('id', collaboratorId).eq('user_id', ctx.user.id).maybeSingle();
    if (!own) return json({ error: 'not_found' }, 404);
    await admin.from('collaborators').update({ invited_at: new Date().toISOString() }).eq('id', collaboratorId);
  }
  const { data, error } = await admin
    .from('invitations')
    .insert({ inviter_id: ctx.user.id, kind, collaborator_id: collaboratorId ?? null })
    .select('token')
    .single();
  if (error) return json({ error: 'insert_failed' }, 500);
  return json({ url: `${base.replace(/\/$/, '')}/i/${data.token}` });
});
