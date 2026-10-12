/**
 * Invitaciones: la persona invitada responde sin cuenta (token) y quien invita
 * incorpora después los resultados. Todo pasa por el backend; sin él no hay invitaciones.
 */
import type { TypeCode, Virtue } from '@virtus/method';

import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';

export type InvitationKind = 'temperament' | 'character_view';

/** Comprueba que el enlace es válido y devuelve el tipo de invitación. Los tests vienen en la app. */
export async function validateInvitation(token: string): Promise<InvitationKind | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke<{ kind: InvitationKind }>(`invitation?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  });
  return error || !data?.kind ? null : data.kind;
}

export async function submitInvitation(token: string, result: unknown): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.functions.invoke<{ ok: boolean }>('invitation', {
    method: 'POST',
    body: { token, consent: true, result },
  });
  return !error && !!data?.ok;
}

/** Incorpora lo que han respondido las personas invitadas. Devuelve cuántas novedades hubo. */
export async function pullInvitationResults(): Promise<number> {
  if (!supabase) return 0;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return 0;
  const s = useVirtus.getState();
  const seen = new Set(s.processedRemote);
  const fresh: string[] = [];

  const { data: invites } = await supabase
    .from('invitations')
    .select('id, kind, collaborator_id, result')
    .eq('kind', 'temperament')
    .not('completed_at', 'is', null);
  for (const inv of invites ?? []) {
    if (seen.has(inv.id)) continue;
    const c = s.collaborators.find((x) => x.remoteId && x.remoteId === inv.collaborator_id);
    const type = (inv.result as { type?: TypeCode } | null)?.type;
    if (c && type) s.upsertCollaborator({ ...c, estimated: type, confirmed: true });
    fresh.push(inv.id);
  }

  const { data: views } = await supabase.from('character_views').select('id, result');
  for (const v of views ?? []) {
    if (seen.has(v.id)) continue;
    s.addOthersView(v.result as Record<Virtue, number>);
    fresh.push(v.id);
  }

  if (fresh.length) s.markProcessed(fresh);
  return fresh.length;
}
