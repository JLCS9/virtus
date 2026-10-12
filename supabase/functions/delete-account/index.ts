/** Borra la cuenta y, en cascada, todos sus datos (RGPD). */
import { adminClient, cors, json, userContext } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const ctx = await userContext(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);
  const { error } = await adminClient().auth.admin.deleteUser(ctx.user.id);
  if (error) return json({ error: 'delete_failed' }, 500);
  return json({ deleted: true });
});
