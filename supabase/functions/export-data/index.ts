/** Exporta todos los datos del usuario (RGPD), descifrados, en un único JSON. */
import { almacenPara } from '../_shared/almacen.ts';
import { db } from '../_shared/db.ts';
import { cors, json, userContext } from '../_shared/http.ts';
import { seudonimizadorPara } from '../_shared/seudonimizar.ts';

/** Retos (03 §7): perfil + registro con los tokens restaurados. */
async function exportarRetos(userId: string) {
  const sql = db();
  const [p] = await sql`select pseudo_id from identidad.user_pseudonym where user_id = ${userId}`;
  if (!p) return null;
  const seudo = await seudonimizadorPara(userId);
  const restaurar = (t: string | null) => (t ? seudo.restaurar(t) : null);
  const perfil = await almacenPara(p.pseudo_id).perfil();
  const dias = await sql`
    select to_char(fecha, 'YYYY-MM-DD') as fecha, reto_id, public.field_dec(reto_texto) as reto_texto, reto_porque,
           public.field_dec(situacion) as situacion, resultado, tipo_fallo, public.field_dec(nota_usuario) as nota_usuario,
           public.field_dec(resumen_dia) as resumen_dia, obstaculos, paso_alcanzado, modo_prisa
    from metodo.dia where pseudo_id = ${p.pseudo_id} order by fecha`;
  return {
    perfil: perfil && { ...perfil, mision: await restaurar(perfil.mision) },
    dias: await Promise.all(
      dias.map(async (d) => ({
        ...d,
        reto_texto: await restaurar(d.reto_texto),
        situacion: await restaurar(d.situacion),
        nota_usuario: await restaurar(d.nota_usuario),
        resumen_dia: await restaurar(d.resumen_dia),
      })),
    ),
  };
}

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
    retos: await exportarRetos(user.id),
  });
});
