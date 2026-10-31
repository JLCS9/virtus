import { useCallback, useEffect, useMemo, useState } from 'react';

import { dateKey, dayIndex, isPracticeDay, roleOfDay, retos as R, type WorkVirtue } from '@virtus/method';
import { modelOfDay, videosFor } from '@virtus/content';

import { useVirtus } from '@/store/virtus';
import { useContent } from './content';
import { track } from './analytics';
import { type EstadoRetos, retoDelServidor, retoLocal, virtudDeReto } from './retos';

/**
 * Día de hoy. El reto lo decide el motor de retos Havard: en el servidor si hay cuenta y perfil
 * de retos (redactado para tu día), y si no, en el dispositivo con la misma biblioteca.
 * No hay «otro reto»: el método elige, no la persona.
 */
export function useToday(date = new Date()) {
  const content = useContent();
  const s = useVirtus();
  const key = dateKey(date);
  const record = s.records[key];
  const challenge = record?.challenge;
  const clave = challenge ? virtudDeReto(challenge.baseId) : null;
  const virtue = (clave ? R.CLAVE_A_VIRTUD_CICLO[clave] : s.cycle?.virtue ?? s.temperament?.challengeVirtue ?? 'humildad') as WorkVirtue;
  const role = roleOfDay(s.roles.map((r) => r.role), date);
  const practiceDay = isPracticeDay(s.plan.rhythm, date);
  const [estado, setEstado] = useState<EstadoRetos | null>(null);
  const model = useMemo(() => modelOfDay(content, virtue, dayIndex(date), s.temperament?.dominant), [content, virtue, key, s.temperament?.dominant]);
  const video = useMemo(() => {
    const list = videosFor(content, virtue);
    return list[Math.floor(dayIndex(date) / 7) % list.length];
  }, [content, virtue, key]);

  // Cada vez que se abre: el servidor manda (puede haber cerrado el examen de anoche en otro
  // dispositivo); si no responde y aún no hay reto, el motor local lo elige.
  useEffect(() => {
    if (!s.temperament) return;
    let vivo = true;
    void retoDelServidor(key).then(({ estado, reto }) => {
      if (!vivo) return;
      setEstado(estado);
      const actual = useVirtus.getState().records[key]?.challenge;
      if (reto) {
        if (actual?.baseId !== reto.retoId || actual.text !== reto.texto || actual.source !== 'servidor') {
          s.setChallenge(key, { baseId: reto.retoId, text: reto.texto, why: reto.porque, source: 'servidor', role: null, acceptedAt: actual?.acceptedAt ?? null, rerolls: 0 });
        }
      } else if (!actual || !virtudDeReto(actual.baseId)) {
        const local = retoLocal(s.temperament!, useVirtus.getState().records, key);
        if (local) s.setChallenge(key, { baseId: local.retoId, text: local.texto, why: local.porque, source: 'local', role: null, acceptedAt: null, rerolls: 0 });
      }
    });
    return () => {
      vivo = false;
    };
  }, [s.temperament, key]);

  const accept = useCallback(() => {
    s.acceptChallenge(key);
    track('challenge_accepted', { source: challenge?.source ?? 'local' });
  }, [key, challenge?.source]);

  return { key, record, virtue, role, practiceDay, model, video, accept, estado };
}
