import { describe, expect, it } from 'vitest';
import { characterDelta, cycleDay, isCycleDue, shouldConfirmTemperament, summarizeCycle } from '../src';

describe('ciclo', () => {
  const start = '2026-10-01T08:00:00.000Z';
  it('cuenta los días desde 1', () => {
    expect(cycleDay(start, new Date('2026-10-01T20:00:00Z'))).toBe(1);
    expect(cycleDay(start, new Date('2026-10-29T09:00:00Z'))).toBe(29);
  });
  it('vence tras las semanas configuradas', () => {
    expect(isCycleDue(start, 4, new Date('2026-10-28T09:00:00Z'))).toBe(false);
    expect(isCycleDue(start, 4, new Date('2026-10-29T09:00:00Z'))).toBe(true);
  });
  it('resume solo los días del ciclo', () => {
    const exam = { situation: '', situationRole: null, firstReaction: '', secondReaction: '', tomorrow: '', good: '', format: 'breve' as const, completedAt: '' };
    const s = summarizeCycle(
      {
        '2026-09-30': { date: '2026-09-30', habitsDone: [], exam: { ...exam, challengeDone: 'si', secondPrevailed: true } },
        '2026-10-02': { date: '2026-10-02', habitsDone: [], exam: { ...exam, challengeDone: 'si', secondPrevailed: false } },
      },
      start,
      new Date('2026-10-10T09:00:00Z'),
    );
    expect(s).toMatchObject({ exams: 1, done: 1, firstPrevailed: 1, secondPrevailed: 0 });
  });
});

describe('confirmación del temperamento', () => {
  const r = { takenAt: '2026-09-01T00:00:00Z', source: 'self' as const };
  it('se propone a partir de las 3 semanas', () => {
    expect(shouldConfirmTemperament([r], null, new Date('2026-09-15T00:00:00Z'))).toBe(false);
    expect(shouldConfirmTemperament([r], null, new Date('2026-09-23T00:00:00Z'))).toBe(true);
  });
  it('no se propone si ya se confirmó o se pospuso', () => {
    expect(shouldConfirmTemperament([r, r], null, new Date('2026-10-01T00:00:00Z'))).toBe(false);
    expect(shouldConfirmTemperament([r], '2026-09-30T00:00:00Z', new Date('2026-10-01T00:00:00Z'))).toBe(false);
  });
});

describe('evolución del carácter', () => {
  it('calcula la diferencia por virtud', () => {
    const a = { magnanimidad: 50, humildad: 40, prudencia: 60, fortaleza: 55, dominio: 45, justicia: 70 };
    const b = { ...a, humildad: 35, magnanimidad: 60 };
    expect(characterDelta(a, b)).toMatchObject({ humildad: -5, magnanimidad: 10, justicia: 0 });
    expect(characterDelta(null, b)).toBeNull();
  });
});
