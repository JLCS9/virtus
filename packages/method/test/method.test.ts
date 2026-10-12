import { describe, expect, it } from 'vitest';
import {
  ALL_TYPES,
  CHALLENGE_VIRTUE,
  rankChallenges,
  renderBase,
  resolveTemperament,
  roleOfDay,
  scoreTest,
  summarizeWeek,
  toPercent,
  validateChallenge,
  type BaseChallenge,
  type TestDefinition,
} from '../src';

const meta = { testId: 't', testVersion: '1' };

describe('temperamento', () => {
  it('hay exactamente 12 tipos y ninguno imposible', () => {
    expect(ALL_TYPES).toHaveLength(12);
    for (const bad of ['COL-FLE', 'FLE-COL', 'MEL-SAN', 'SAN-MEL']) expect(ALL_TYPES).not.toContain(bad);
  });

  it('los porcentajes suman 100', () => {
    const p = toPercent({ COL: 7, MEL: 3, SAN: 5, FLE: 1 });
    expect(Object.values(p).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('el secundario nunca es el incompatible con el dominante', () => {
    const r = resolveTemperament({ COL: 10, FLE: 8, SAN: 4, MEL: 2 }, meta);
    expect(r.dominant).toBe('COL');
    expect(r.secondary).toBe('SAN');
    expect(r.type).toBe('COL-SAN');
    expect(r.inconsistent).toBe(true);
  });

  it('secundario por debajo del 10 % → tipo puro', () => {
    const r = resolveTemperament({ MEL: 20, FLE: 2, COL: 1, SAN: 0 }, meta);
    expect(r.secondary).toBeNull();
    expect(r.type).toBe('MEL');
  });

  it('virtud-desafío por dominante', () => {
    expect(CHALLENGE_VIRTUE).toEqual({ COL: 'humildad', MEL: 'audacia', SAN: 'resistencia', FLE: 'magnanimidad' });
    expect(resolveTemperament({ FLE: 9, MEL: 5, COL: 0, SAN: 1 }, meta).challengeVirtue).toBe('magnanimidad');
  });

  it('marca empate cuando dominante y secundario casi coinciden', () => {
    expect(resolveTemperament({ SAN: 10, COL: 10, MEL: 0, FLE: 1 }, meta).tie).toBe(true);
  });
});

describe('motor de tests', () => {
  const test: TestDefinition = {
    id: 'x', kind: 'character', version: '1', locale: 'es', status: 'draft', title: '', intro: '', source: '',
    dimensions: ['humildad'], likertScale: { min: 1, max: 5, labels: [] },
    items: [
      { id: 'a', type: 'likert', prompt: '', dimension: 'humildad' },
      { id: 'b', type: 'likert', prompt: '', dimension: 'humildad', reverse: true },
    ],
  };
  it('puntúa Likert con ítems invertidos', () => {
    expect(scoreTest(test, { a: 5, b: 1 })).toEqual({ humildad: 8 });
  });
});

describe('retos', () => {
  const lib: BaseChallenge[] = [
    { id: 'h1', locale: 'es', virtue: 'humildad', roles: ['padre_madre'], temperaments: [], moment: 'manana', text: 'Hoy, antes de corregir a tu hijo, pregúntale primero cómo lo ve él.', source: '', status: 'draft' },
    { id: 'h2', locale: 'es', virtue: 'humildad', roles: [], temperaments: [], moment: 'manana', text: 'Hoy pide consejo a alguien antes de decidir.', withPerson: 'Hoy pide consejo a {persona} antes de decidir.', source: '', status: 'draft' },
    { id: 'a1', locale: 'es', virtue: 'audacia', roles: [], temperaments: [], moment: 'manana', text: 'x', source: '', status: 'approved' },
  ];
  const base = { library: lib, locale: 'es' as const, virtue: 'humildad' as const, temperament: null, date: new Date(2026, 9, 12), includeDrafts: true };

  it('prioriza el rol del día', () => {
    expect(rankChallenges({ ...base, role: 'padre_madre' })[0].id).toBe('h1');
  });
  it('excluye borradores si no se piden', () => {
    expect(rankChallenges({ ...base, role: null, includeDrafts: false })).toHaveLength(0);
  });
  it('pedir otro excluye el rechazado', () => {
    expect(rankChallenges({ ...base, role: 'padre_madre', exclude: ['h1'] })[0].id).toBe('h2');
  });
  it('rellena la persona', () => {
    const r = renderBase(lib[1], 'trabajo', { id: 'p', alias: 'Marta', relation: '', role: 'trabajo' });
    expect(r.text).toBe('Hoy pide consejo a Marta antes de decidir.');
  });
  it('rota los roles por día', () => {
    const a = roleOfDay(['trabajo', 'conyuge'], new Date(2026, 0, 1));
    const b = roleOfDay(['trabajo', 'conyuge'], new Date(2026, 0, 2));
    expect(a).not.toBe(b);
  });
});

describe('validador', () => {
  const rules = { minLength: 20, maxLength: 200, banned: ['mindset', 'empoderar'], notToday: ['esta semana'], formal: ['usted'] };
  it('acepta un reto correcto', () => {
    expect(validateChallenge('Hoy, antes de corregir a tu hijo, pregúntale primero cómo lo ve él.', rules).ok).toBe(true);
  });
  it('rechaza léxico vetado sin importar tildes ni mayúsculas', () => {
    expect(validateChallenge('Hoy trabaja tu MINDSET de servicio con tu equipo.', rules).errors).toContain('lexico_vetado:mindset');
  });
  it('rechaza retos que no son para hoy y registro formal', () => {
    const r = validateChallenge('Esta semana usted debe escuchar a su equipo con calma.', rules);
    expect(r.errors).toEqual(expect.arrayContaining(['no_es_para_hoy:esta semana', 'registro_formal:usted']));
  });
});

describe('revisión semanal', () => {
  it('cuenta en qué roles ganó la primera reacción', () => {
    const exam = { situation: '', firstReaction: '', secondReaction: '', challengeDone: 'si' as const, tomorrow: '', good: '', format: 'breve' as const, completedAt: '' };
    const s = summarizeWeek(
      {
        '2026-10-11': { date: '2026-10-11', habitsDone: ['h'], exam: { ...exam, situationRole: 'trabajo', secondPrevailed: false } },
        '2026-10-12': { date: '2026-10-12', habitsDone: [], exam: { ...exam, situationRole: 'trabajo', secondPrevailed: true } },
      },
      new Date(2026, 9, 12),
    );
    expect(s.byRole).toEqual([{ role: 'trabajo', firstWon: 1, secondWon: 1 }]);
    expect(s.examsDone).toBe(2);
    expect(s.habits).toEqual({ h: 1 });
  });
});
