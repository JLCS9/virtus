/** Borra la cuenta y, en cascada, todos sus datos (RGPD). */
import { db } from '../_shared/db.ts';
import { adminClient, cors, json, userContext } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await userContext(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);
  // Retos (03 §7): token_map primero; sin él, lo que quedara sería irreversiblemente anónimo.
  await db()`select identidad.borrar_usuario(${ctx.user.id})`;
  const { error } = await adminClient().auth.admin.deleteUser(ctx.user.id);
  if (error) return json({ error: 'delete_failed' }, 500);
  return json({ deleted: true });
});
