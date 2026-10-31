/**
 * Catálogo de Formación (cursos en vídeo de Alexandre Havard: 7 cursos, 56 lecciones).
 * SOLO con suscripción activa (la misma que los retos): los títulos y los identificadores de
 * Vimeo no deben viajar dentro de la web pública, por eso los sirve el servidor y no el bundle.
 * El progreso de cada persona no está aquí: lo guarda quien consume esta función.
 */
import cursos from '../../../packages/content/src/es/cursos.json' with { type: 'json' };

import { cors, json, userContext } from '../_shared/http.ts';
import { sinSuscripcion, suscripcionRetosActiva } from '../_shared/suscripcion.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await userContext(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);
  if (!(await suscripcionRetosActiva(ctx.user.id))) return sinSuscripcion();
  return json({ cursos });
});
