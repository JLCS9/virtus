/**
 * Operaciones que requieren cuenta y backend. Sin backend devuelven null y la app
 * lo indica con sobriedad; nada se envía a terceros sin invitación expresa.
 */
import { Share } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';

export const backendEnabled = () => supabase !== null;

/** Crea un enlace de invitación (test de temperamento o mirada de los otros) y abre el menú de compartir. */
export async function invite(kind: 'temperament' | 'character_view', collaboratorAlias: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.functions.invoke<{ url: string }>('invite', { body: { kind, alias: collaboratorAlias } });
  if (error || !data?.url) return false;
  await Share.share({ message: data.url });
  return true;
}

/** Exporta todo lo guardado en el dispositivo (RGPD). En servidor: Edge Function export-data. */
export async function exportLocal(): Promise<void> {
  const { records, mission, missionNotes, roles, collaborators, plan, temperamentHistory, character, cycle } = useVirtus.getState();
  const data = { exportedAt: new Date().toISOString(), mission, missionNotes, roles, collaborators, plan, cycle, temperamentHistory, character, records };
  await Share.share({ message: JSON.stringify(data, null, 2) });
}

export async function deleteEverything(): Promise<void> {
  if (supabase) {
    await supabase.functions.invoke('delete-account', { body: {} }).catch(() => null);
    await supabase.auth.signOut().catch(() => null);
  }
  useVirtus.getState().reset();
}
