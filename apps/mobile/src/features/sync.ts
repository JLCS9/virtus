/**
 * Sincronización offline-first: el dispositivo es la fuente de verdad del día a día y el
 * servidor guarda una copia cifrada. Nunca se sube el temperamento estimado de terceros
 * ni nada del diario a la analítica.
 */
import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';

export async function pushAll(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const s = useVirtus.getState();
  const since = s.syncedAt ?? '1970-01-01T00:00:00Z';

  const calls: PromiseLike<{ error: unknown }>[] = [
    supabase.rpc('save_boxes', { p_mission: s.mission, p_mission_notes: s.missionNotes, p_roles: s.roles }),
    supabase.from('plans').upsert({ user_id: data.session.user.id, plan: s.plan, updated_at: new Date().toISOString() }),
    supabase.from('profiles').update({ locale: s.locale, spiritual: s.plan.spiritual, onboarded_at: s.onboardedAt }).eq('id', data.session.user.id),
  ];
  for (const r of s.temperamentHistory.filter((x) => x.takenAt > since)) {
    calls.push(
      supabase.from('test_results').insert({
        user_id: data.session.user.id,
        test_id: r.testId,
        test_version: r.testVersion,
        kind: 'temperament',
        result: { type: r.type, dominant: r.dominant, secondary: r.secondary, isPure: r.isPure, secondaryStrength: r.secondaryStrength, scores: r.scores },
        taken_at: r.takenAt,
      }),
    );
  }
  for (const r of s.character.filter((x) => x.takenAt > since)) {
    calls.push(
      supabase.from('test_results').insert({
        user_id: data.session.user.id,
        test_id: 'vl-caracter',
        test_version: r.testVersion,
        kind: 'character',
        result: { self: r.self, facets: r.facets ?? null },
        taken_at: r.takenAt,
      }),
    );
  }
  for (const h of s.heart.filter((x) => x.takenAt > since)) {
    calls.push(
      supabase.from('test_results').insert({
        user_id: data.session.user.id,
        test_id: 'vl-corazon',
        test_version: h.testVersion,
        kind: 'heart',
        result: { pct: h.pct, stage: h.stage, verdict: h.verdict },
        taken_at: h.takenAt,
      }),
    );
  }
  for (const day of Object.values(s.records)) {
    calls.push(
      supabase.rpc('save_daily_entry', {
        p_day: day.date,
        p_challenge_base_id: day.challenge?.baseId ?? null,
        p_accepted_at: day.challenge?.acceptedAt ?? null,
        p_payload: { challenge: day.challenge ?? null, exam: day.exam ?? null, habitsDone: day.habitsDone },
      }),
    );
  }
  const results = await Promise.all(calls);

  // Colaboradores: solo alias, relación y rol. El temperamento estimado se queda en el dispositivo.
  for (const c of s.collaborators) {
    const { data: id } = await supabase.rpc('save_collaborator', {
      p_id: c.remoteId ?? null,
      p_alias: c.alias,
      p_relation: c.relation,
      p_role: c.role,
    });
    if (id && id !== c.remoteId) s.upsertCollaborator({ ...c, remoteId: id as string });
  }

  const ok = results.every((r) => !r.error);
  if (ok) s.markSynced(new Date().toISOString());
  return ok;
}
