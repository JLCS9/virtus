/** Exporta todos los datos del usuario (RGPD), descifrados, en un único JSON. */
import { cors, json, userContext } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await userContext(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);
  const { db, user } = ctx;
  const [profile, boxes, collaborators, plan, cycles, results, views, entries, invitations] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    db.rpc('get_boxes'),
    db.rpc('get_collaborators'),
    db.from('plans').select('plan, updated_at').eq('user_id', user.id).maybeSingle(),
    db.from('cycles').select('*').eq('user_id', user.id),
    db.from('test_results').select('*').eq('user_id', user.id),
    db.from('character_views').select('result, created_at').eq('user_id', user.id),
    db.rpc('get_daily_entries', { p_since: '1970-01-01' }),
    db.from('invitations').select('kind, created_at, expires_at, accepted_by').eq('inviter_id', user.id),
  ]);
  return json({
    exportedAt: new Date().toISOString(),
    email: user.email,
    profile: profile.data,
    boxes: boxes.data?.[0] ?? null,
    collaborators: collaborators.data,
    plan: plan.data,
    cycles: cycles.data,
    testResults: results.data,
    characterViews: views.data,
    dailyEntries: entries.data,
    invitations: invitations.data,
  });
});
