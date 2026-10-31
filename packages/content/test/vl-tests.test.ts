/**
 * Verifica que los motores portados a TypeScript reproducen exactamente los
 * originales de virtuousleadership.com (fixtures del Excel oficial incluidos).
 */
import { describe, expect, it } from 'vitest';
import {
  CHARACTER_CODE,
  applyAnswers,
  breakTie,
  buildStage1Order,
  buildTieOrder,
  decideProfile,
  heartStage,
  mergeScores,
  scoreCharacter,
  scoreHeart,
  stage2Score,
  STAGE2,
  topAndMargin,
  type TbpAnswer,
} from '@virtus/method';

import characterData from '../vendor/vl-tests/character-test.json';
import fixtures from '../vendor/vl-tests/character-test-fixtures.json';
import heartData from '../vendor/vl-tests/heart-test.json';
import { getContent } from '../src';

const CODES = Object.keys(CHARACTER_CODE);

describe('carácter (motor oficial)', () => {
  const check = (answers: number[], expected: Record<string, { global: number; passive: number; active: number }>) => {
    const r = scoreCharacter(answers, characterData as never);
    for (const code of CODES) {
      const v = r[CHARACTER_CODE[code]];
      expect(v.global, `${code}.global`).toBe(expected[code].global);
      expect(v.passive, `${code}.passive`).toBe(expected[code].passive);
      expect(v.active, `${code}.active`).toBe(expected[code].active);
    }
  };
  it(`fixtures reales del Excel (${fixtures.real.length})`, () => {
    for (const f of fixtures.real) check(f.answers_values, f.expected);
  });
  it('fixtures sintéticas', () => {
    for (const f of Object.values(fixtures.synthetic as Record<string, { answers_values: number[]; expected: never }>)) check(f.answers_values, f.expected);
  });
  it('todo +1 ≈ 100, todo −1 ≈ 0, todo 0 = 50', () => {
    const all = (v: number) => scoreCharacter(new Array(68).fill(v), characterData as never);
    for (const s of Object.values(all(1))) expect(s.global).toBeCloseTo(100, 1);
    for (const s of Object.values(all(-1))) expect(s.global).toBeCloseTo(0, 1);
    for (const s of Object.values(all(0))) expect(s.global).toBe(50);
  });
  it('umbrales de etapa 40 / 70', () => {
    const r = scoreCharacter(new Array(68).fill(0), characterData as never);
    expect(r.prudencia.stage).toBe('moderado');
  });
});

describe('corazón libre (motor oficial)', () => {
  const H = heartData as never;
  it('umbrales 33 / 66', () => {
    expect(heartStage(32.99)).toBe('none');
    expect(heartStage(33)).toBe('stage1');
    expect(heartStage(66)).toBe('stage2');
  });
  it('todo 0 → equilibrado; todo 4 → las 8 en stage2; todo 2 → stage1', () => {
    expect(scoreHeart(new Array(32).fill(0), H).verdict).toBe('balanced');
    expect(scoreHeart(new Array(32).fill(4), H).stage2).toHaveLength(8);
    expect(scoreHeart(new Array(32).fill(2), H).stage1).toHaveLength(8);
  });
  it('un solo trastorno al máximo', () => {
    const answers = new Array(32).fill(0);
    heartData.questions.forEach((q, i) => {
      if (q.disorder_code === 'R') answers[i] = 4;
    });
    const r = scoreHeart(answers, H);
    expect(r.stage2).toEqual(['R']);
    expect(r.disorders.R.pct).toBe(100);
  });
  it('clampa valores fuera de rango y rellena con 0', () => {
    const r = scoreHeart([9, -3], H);
    expect(r.disorders.R.score).toBe(4);
  });
});

describe('temperamento TBP (motor oficial)', () => {
  const rng = (() => {
    let s = 42;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();

  it('etapa 1: 16 ítems, 4 por temperamento, sin repetir tipo en el cambio de ronda', () => {
    const order = buildStage1Order(rng);
    expect(order).toHaveLength(16);
    for (const t of ['COL', 'SAN', 'MEL', 'FLE']) expect(order.filter((o) => o.type === t)).toHaveLength(4);
    for (let r = 1; r < 4; r++) expect(order[r * 4].type).not.toBe(order[r * 4 - 1].type);
  });

  it('«verdadero» suma 1; «falso» suma 0,5 al diagonal', () => {
    const items = [
      { id: 'COL1', type: 'COL' as const },
      { id: 'MEL1', type: 'MEL' as const },
    ];
    expect(applyAnswers(items, ['SI', 'NO'])).toEqual({ COL: 1, SAN: 0.5, MEL: 0, FLE: 0 });
  });

  it('perfil puro con margen ≥ 2 y etapa 2 neutra', () => {
    const d = decideProfile('COL', { COL: 4, SAN: 2, MEL: 1, FLE: 0 }, 1);
    expect(d).toMatchObject({ key: 'COL', isPure: true });
  });

  it('secundario por la etapa 2 (A suma, B resta) y desempate por puntuación', () => {
    expect(decideProfile('MEL', { COL: 1, SAN: 0, MEL: 4, FLE: 3 }, 2).key).toBe('MEL-COL');
    expect(decideProfile('MEL', { COL: 1, SAN: 0, MEL: 4, FLE: 3 }, -3).key).toBe('MEL-FLE');
    expect(decideProfile('MEL', { COL: 1, SAN: 0, MEL: 4, FLE: 3 }, 0).key).toBe('MEL-FLE');
    expect(stage2Score(STAGE2.SAN.items, ['SI', 'SI', 'NO', 'SI', 'NO', 'NO'])).toBe(1);
  });

  it('empate en cabeza → desempate; si persiste, más «verdadero» en la etapa 1', () => {
    const s1 = [
      { id: 'COL1', type: 'COL' as const },
      { id: 'COL2', type: 'COL' as const },
      { id: 'SAN1', type: 'SAN' as const },
    ];
    const a: TbpAnswer[] = ['SI', 'SI', 'SI'];
    const scores = mergeScores(applyAnswers(s1, a), { COL: 0, SAN: 1, MEL: 0, FLE: 0 });
    expect(topAndMargin(scores).tiedTypes.sort()).toEqual(['COL', 'SAN']);
    expect(breakTie(['SAN', 'COL'], s1, a)).toBe('COL');
    expect(buildTieOrder(['COL', 'SAN'], rng)).toHaveLength(4);
  });

  it('las 48 afirmaciones existen en el contenido en español', () => {
    const items = getContent('es').vlTests.temperament.items;
    const ids = [
      ...['COL', 'SAN', 'MEL', 'FLE'].flatMap((t) => [1, 2, 3, 4].map((n) => `${t}${n}`)),
      ...['COL', 'SAN', 'MEL', 'FLE'].flatMap((t) => [1, 2].map((n) => `T${t}${n}`)),
      ...Object.values(STAGE2).flatMap((c) => c.items.map((i) => i.id)),
    ];
    for (const id of ids) expect(items[id], id).toBeTruthy();
  });

  it('los 12 perfiles tienen nombre, fortaleza, debilidad y reto', () => {
    const profiles = getContent('es').vlTests.temperament.result.profiles;
    expect(Object.keys(profiles)).toHaveLength(12);
    for (const p of Object.values(profiles)) expect(p.reto.length).toBeGreaterThan(10);
  });
});
