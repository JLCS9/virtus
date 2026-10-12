import { useCallback, useEffect, useMemo } from 'react';

import {
  dateKey,
  dayIndex,
  isPracticeDay,
  pickPerson,
  rankChallenges,
  renderBase,
  roleOfDay,
  type DailyChallenge,
} from '@virtus/method';
import { fragmentFor } from '@virtus/content';

import { useVirtus } from '@/store/virtus';
import { INCLUDE_DRAFTS, useContent } from './content';
import { adaptChallenge } from './adapt';

export function useToday(date = new Date()) {
  const content = useContent();
  const s = useVirtus();
  const key = dateKey(date);
  const record = s.records[key];
  const virtue = s.cycle?.virtue ?? s.temperament?.challengeVirtue ?? 'humildad';
  const role = roleOfDay(s.roles.map((r) => r.role), date);
  const practiceDay = isPracticeDay(s.plan.rhythm, date);
  const fragment = useMemo(() => fragmentFor(content, virtue, dayIndex(date)), [content, virtue, key]);

  const build = useCallback(
    (exclude: string[]): DailyChallenge | null => {
      const candidates = rankChallenges({
        library: content.challenges,
        locale: s.locale,
        virtue,
        role,
        temperament: s.temperament,
        date,
        exclude,
        includeDrafts: INCLUDE_DRAFTS,
      });
      const base = candidates[0];
      if (!base) return null;
      const person = pickPerson(s.collaborators, role, date);
      return renderBase(base, role, person);
    },
    [content, s.locale, virtue, role, s.temperament, s.collaborators, key],
  );

  const assign = useCallback(
    async (daily: DailyChallenge, rerolls: number) => {
      s.setChallenge(key, { baseId: daily.baseId, text: daily.text, role: daily.role, acceptedAt: null, rerolls });
      // La IA solo redacta la adaptación; si falla o no hay backend, queda el reto base.
      const adapted = await adaptChallenge(daily, { temperament: s.temperament, record: s.records, lexicon: content.lexicon });
      if (adapted && useVirtus.getState().records[key]?.challenge?.baseId === daily.baseId) {
        s.setChallenge(key, { baseId: daily.baseId, text: adapted, role: daily.role, acceptedAt: null, rerolls });
      }
    },
    [key, s.temperament, content.lexicon],
  );

  // Asigna el reto del día la primera vez que se abre.
  useEffect(() => {
    if (!s.temperament || record?.challenge) return;
    const daily = build(s.recentChallenges);
    if (daily) void assign(daily, 0);
  }, [s.temperament, record?.challenge, key]);

  const reroll = useCallback(() => {
    const current = record?.challenge;
    const exclude = [...s.recentChallenges, ...(current ? [current.baseId] : [])];
    const daily = build(exclude);
    if (!daily || daily.baseId === current?.baseId) return false;
    void assign(daily, (current?.rerolls ?? 0) + 1);
    return true;
  }, [record?.challenge, s.recentChallenges, build, assign]);

  return { key, record, virtue, role, practiceDay, fragment, reroll, accept: () => s.acceptChallenge(key) };
}
