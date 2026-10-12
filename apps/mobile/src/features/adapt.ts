/**
 * Adaptación del reto por IA (M4). Llama a la Edge Function `adapt-challenge` si el backend
 * está configurado. Nunca conversa con el usuario. Valida el resultado en el dispositivo
 * y, si algo falla, devuelve null para que se muestre el reto base.
 */
import { validateChallenge, type DailyChallenge, type DayRecord, type TemperamentResult, type ValidationRules } from '@virtus/method';

import { supabase } from '@/lib/supabase';

export async function adaptChallenge(
  daily: DailyChallenge,
  ctx: { temperament: TemperamentResult | null; record: Record<string, DayRecord>; lexicon: ValidationRules },
): Promise<string | null> {
  if (!supabase || !ctx.temperament) return null;
  try {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return null;
    const yesterday = Object.values(ctx.record)
      .filter((r) => r.exam)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.exam;
    const { data, error } = await supabase.functions.invoke<{ text: string | null }>('adapt-challenge', {
      body: {
        baseId: daily.baseId,
        baseText: daily.text,
        virtue: daily.virtue,
        role: daily.role,
        dominant: ctx.temperament.dominant,
        secondary: ctx.temperament.secondary,
        // Solo lo mínimo: si ayer prevaleció la primera reacción y si cumplió el reto.
        yesterday: yesterday ? { secondPrevailed: yesterday.secondPrevailed, challengeDone: yesterday.challengeDone } : null,
      },
    });
    if (error || !data?.text) return null;
    return validateChallenge(data.text, ctx.lexicon).ok ? data.text : null;
  } catch {
    return null;
  }
}
