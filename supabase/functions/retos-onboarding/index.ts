/**
 * Onboarding conversacional (modo ONBOARDING, 02 §1), un turno por petición.
 * Cuerpo: { fecha, texto: string | null }. Si la persona ya hizo el test TBP, su temperamento
 * entra como dato del sistema y prevalece sobre el que extraiga el modelo.
 */
import { turnoOnboarding } from '../../../packages/method/src/retos/index.ts';

import { cors, json } from '../_shared/http.ts';
import { contextoRetos, fechaValida, temperamentoDelTest } from '../_shared/retos.ts';
import { SeudonimizadorNoDisponible } from '../_shared/seudonimizar.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await contextoRetos(req);
  if (ctx instanceof Response) return ctx;
  const body = (await req.json().catch(() => ({}))) as { fecha?: string; texto?: unknown };
  const fecha = fechaValida(body.fecha);
  const texto = typeof body.texto === 'string' && body.texto.trim() ? body.texto.trim().slice(0, 2000) : null;
  if (!fecha) return json({ error: 'bad_fecha' }, 400);
  try {
    const temperamento = await temperamentoDelTest(ctx.userId);
    return json(await turnoOnboarding(ctx.deps, fecha, texto, temperamento));
  } catch (e) {
    if (e instanceof SeudonimizadorNoDisponible) return json({ error: 'seudonimizador' }, 503);
    console.error('retos-onboarding:', (e as Error).message);
    return json({ error: 'internal' }, 500);
  }
});
