/**
 * Webhook de RevenueCat → tabla subscriptions. El app_user_id de RevenueCat es el id de
 * usuario de Supabase (la app hace Purchases.logIn(user.id) al iniciar sesión).
 */
import { adminClient, json } from '../_shared/http.ts';

const ACTIVE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT']);
const INACTIVE = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret || req.headers.get('Authorization') !== `Bearer ${secret}`) return json({ error: 'unauthorized' }, 401);
  const payload = (await req.json().catch(() => null)) as { event?: Record<string, unknown> } | null;
  const e = payload?.event;
  if (!e || typeof e.id !== 'string' || typeof e.type !== 'string') return json({ error: 'bad_payload' }, 400);
  const userId = typeof e.app_user_id === 'string' && UUID.test(e.app_user_id) ? e.app_user_id : null;

  const admin = adminClient();
  const { error: dup } = await admin.from('revenuecat_events').insert({ id: e.id, user_id: userId, type: e.type });
  if (dup) return json({ ok: true, duplicate: true });
  if (!userId) return json({ ok: true, ignored: 'anonymous' });

  let status: string | null = null;
  if (ACTIVE.has(e.type)) status = 'active';
  else if (e.type === 'CANCELLATION') status = 'cancelled'; // sigue activa hasta expiration_at
  else if (e.type === 'BILLING_ISSUE') status = 'billing_issue';
  else if (INACTIVE.has(e.type)) status = 'inactive';
  if (!status) return json({ ok: true, ignored: e.type });

  const end = typeof e.expiration_at_ms === 'number' ? new Date(e.expiration_at_ms).toISOString() : null;
  await admin.from('subscriptions').upsert({
    user_id: userId,
    provider: e.store === 'STRIPE' ? 'stripe' : 'revenuecat',
    status,
    current_period_end: end,
    updated_at: new Date().toISOString(),
  });
  return json({ ok: true });
});
