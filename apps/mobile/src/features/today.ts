import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  dateKey,
  dayIndex,
  isPracticeDay,
  pickPerson,
  rankChallenges,
  renderBase,
  roleOfDay,
  type DailyChallenge,
  type WorkVirtue,
} from '@virtus/method';
import { modelOfDay, videosFor } from '@virtus/content';

import { useVirtus } from '@/store/virtus';
import { INCLUDE_DRAFTS, useContent } from './content';
import { adaptChallenge } from './adapt';
import { track } from './analytics';
import { type EstadoRetos, refrescarSuscripcionRetos, retoDelServidor, VIRTUD_CICLO } from './retos';

/**
 * Día de hoy. Dos modos según la SUSCRIPCIÓN A RETOS de la cuenta (por defecto desactivada):
 * - Sin suscripción: el reto de siempre (biblioteca de la app, «otro reto», examen local).
 * - Con suscripción activa: el servidor decide y redacta el reto (método Havard). Si no responde,
 *   se cae al reto de siempre. Nada del método viaja en la app: es todo del servidor.
 */
export function useToday(date = new Date()) {
  const content = useContent();
  const s = useVirtus();
  const key = dateKey(date);
  const record = s.records[key];
  const challenge = record?.challenge;
  const retos = s.retosSuscripcion === 'activa';
  const [estado, setEstado] = useState<EstadoRetos | null>(null);
  // El reto de siempre: sin suscripción, y de respaldo si el servidor no da reto.
  const clasico = !retos || (estado !== null && estado !== 'servidor');

  const virtueBase = s.cycle?.virtue ?? s.temperament?.challengeVirtue ?? 'humildad';
  const virtue = ((challenge?.source === 'servidor' && challenge.virtudClave && VIRTUD_CICLO[challenge.virtudClave]) || virtueBase) as WorkVirtue;
  const role = roleOfDay(s.roles.map((r) => r.role), date);
  const practiceDay = isPracticeDay(s.plan.rhythm, date);
  const model = useMemo(() => modelOfDay(content, virtue, dayIndex(date), s.temperament?.dominant), [content, virtue, key, s.temperament?.dominant]);
  const video = useMemo(() => {
    const list = videosFor(content, virtue);
    return list[Math.floor(dayIndex(date) / 7) % list.length];
  }, [content, virtue, key]);

  const build = useCallback(
    (exclude: string[]): DailyChallenge | null => {
      const candidates = rankChallenges({
        library: content.challenges,
        locale: s.locale,
        virtue: virtueBase,
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
    [content, s.locale, virtueBase, role, s.temperament, s.collaborators, key],
  );

  const assign = useCallback(
    async (daily: DailyChallenge, rerolls: number) => {
      s.setChallenge(key, { baseId: daily.baseId, text: daily.text, role: daily.role, acceptedAt: null, rerolls });
      // La adaptación por IA también es solo para suscripción activa (el servidor lo exige).
      if (!retos) return;
      const adapted = await adaptChallenge(daily, { temperament: s.temperament, record: s.records, lexicon: content.lexicon });
      if (adapted && useVirtus.getState().records[key]?.challenge?.baseId === daily.baseId) {
        s.setChallenge(key, { baseId: daily.baseId, text: adapted, role: daily.role, acceptedAt: null, rerolls });
      }
    },
    [key, retos, s.temperament, content.lexicon],
  );

  // Cada vez que se abre se comprueba la suscripción en el servidor (solo lee la fila propia).
  useEffect(() => {
    void refrescarSuscripcionRetos();
  }, []);

  // Con suscripción: el servidor decide y redacta el reto, y manda sobre el que haya en el dispositivo.
  useEffect(() => {
    // El servidor saca el temperamento del test de la cuenta: no hace falta tenerlo en el dispositivo.
    if (!retos) return;
    let vivo = true;
    void retoDelServidor(key).then(({ estado, reto }) => {
      if (!vivo) return;
      setEstado(estado);
      if (estado === 'sin_suscripcion') void refrescarSuscripcionRetos(); // se desactivó desde que se supo
      if (!reto) return;
      const actual = useVirtus.getState().records[key]?.challenge;
      if (actual?.baseId !== reto.retoId || actual.text !== reto.texto || actual.source !== 'servidor') {
        s.setChallenge(key, {
          baseId: reto.retoId,
          text: reto.texto,
          why: reto.porque,
          virtudClave: reto.virtud,
          source: 'servidor',
          role: null,
          acceptedAt: actual?.acceptedAt ?? null,
          rerolls: 0,
        });
      }
    });
    return () => {
      vivo = false;
    };
  }, [retos, s.temperament, key]);

  // Asigna el reto de siempre la primera vez que se abre. Si hay uno del servidor y la cuenta ya no
  // tiene suscripción, se sustituye por el de siempre.
  useEffect(() => {
    if (!clasico || !s.temperament) return;
    if (record?.challenge && !(!retos && record.challenge.source === 'servidor')) return;
    const daily = build(s.recentChallenges);
    if (daily) void assign(daily, 0);
  }, [clasico, retos, s.temperament, record?.challenge, key]);

  const reroll = useCallback(() => {
    const current = record?.challenge;
    const exclude = [...s.recentChallenges, ...(current ? [current.baseId] : [])];
    const daily = build(exclude);
    if (!daily || daily.baseId === current?.baseId) return false;
    void assign(daily, (current?.rerolls ?? 0) + 1);
    track('challenge_rerolled', {});
    return true;
  }, [record?.challenge, s.recentChallenges, build, assign]);

  return {
    key,
    record,
    virtue,
    role,
    practiceDay,
    model,
    video,
    // «Otro reto» solo en el reto de siempre: en el método lo elige el motor, no la persona.
    reroll: retos ? undefined : reroll,
    accept: () => {
      s.acceptChallenge(key);
      track('challenge_accepted', { rerolls: challenge?.rerolls ?? 0, adapted: false, ...(challenge?.source === 'servidor' ? { source: 'servidor' as const } : {}) });
    },
    /** Con suscripción: cómo ha respondido el servidor (null mientras tanto). Sin ella, siempre null. */
    retos,
    estado: retos ? estado : null,
  };
}
