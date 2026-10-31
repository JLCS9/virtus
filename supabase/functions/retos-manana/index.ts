/**
 * Reto del día (modo MAÑANA, 02 §2). Sin conversación: si anoche se cerró el examen, el reto ya
 * está redactado; si no, el motor lo elige con el escenario de respaldo y el modelo lo redacta.
 * Respuesta: { perfil: false } si aún no hay onboarding.
 */
import { retoDelDia } from '../../../packages/method/src/retos/index.ts';

import { cors, json } from '../_shared/http.ts';
import { contextoRetos, fechaValida } from '../_shared/retos.ts';
import { SeudonimizadorNoDisponible } from '../_shared/seudonimizar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await contextoRetos(req);
  if (ctx instanceof Response) return ctx;
  const body = (await req.json().catch(() => ({}))) as { fecha?: string };
  const fecha = fechaValida(body.fecha);
  if (!fecha) return json({ error: 'bad_fecha' }, 400);
  try {
    if (!(await ctx.deps.almacen.perfil())) return json({ perfil: false });
    const reto = await retoDelDia(ctx.deps, fecha);
    return json({ perfil: true, reto });
  } catch (e) {
    if (e instanceof SeudonimizadorNoDisponible) return json({ error: 'seudonimizador' }, 503);
    console.error('retos-manana:', (e as Error).message);
    return json({ error: 'internal' }, 500);
  }
});
