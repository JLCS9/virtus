/**
 * Examen nocturno (modo NOCHE, 02 §3), un turno por petición.
 * Cuerpo: { fecha, entrada: null | { tipo: 'texto', texto } | { tipo: 'boton', valor } }.
 * null abre (o reanuda) el examen de esa fecha.
 */
import { turnoNoche, type EntradaNoche } from '../../../packages/method/src/retos/index.ts';

import { cors, json } from '../_shared/http.ts';
import { contextoRetos, fechaValida } from '../_shared/retos.ts';
import { SeudonimizadorNoDisponible } from '../_shared/seudonimizar.ts';

const BOTONES = ['listo', 'si', 'a_medias', 'no', 'reaccion', 'decision', 'prisa', 'aceptar', 'parar'];

function entradaValida(e: unknown): EntradaNoche | null | undefined {
  if (e === null || e === undefined) return null;
  const x = e as Record<string, unknown>;
  if (x.tipo === 'texto' && typeof x.texto === 'string' && x.texto.trim() && x.texto.length <= 2000) {
    return { tipo: 'texto', texto: x.texto.trim() };
  }
  if (x.tipo === 'boton' && BOTONES.includes(x.valor as string)) return { tipo: 'boton', valor: x.valor as never };
  return undefined;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await contextoRetos(req);
  if (ctx instanceof Response) return ctx;
  const body = (await req.json().catch(() => ({}))) as { fecha?: string; entrada?: unknown };
  const fecha = fechaValida(body.fecha);
  const entrada = entradaValida(body.entrada);
  if (!fecha || entrada === undefined) return json({ error: 'bad_request' }, 400);
  try {
    if (!(await ctx.deps.almacen.perfil())) return json({ error: 'sin_perfil' }, 409);
    return json(await turnoNoche(ctx.deps, fecha, entrada));
  } catch (e) {
    if (e instanceof SeudonimizadorNoDisponible) return json({ error: 'seudonimizador' }, 503);
    console.error('retos-noche:', (e as Error).message);
    return json({ error: 'internal' }, 500);
  }
});
