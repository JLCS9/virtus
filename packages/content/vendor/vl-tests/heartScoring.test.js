// Tests del motor del Test del Corazón. `npm test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  scoreHeart, toBrevoAttributes, stageForPct,
  HEART_DISORDER_CODES, HEART_THRESHOLD_LOW, HEART_THRESHOLD_HIGH,
} from './heartScoring.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HEART = JSON.parse(readFileSync(join(__dirname, '../data/heart-test.json'), 'utf-8'));

test('stageForPct — respeta umbrales default 33 y 66', () => {
  assert.equal(stageForPct(0),      'none');
  assert.equal(stageForPct(32.9),   'none');
  assert.equal(stageForPct(33),     'stage1');
  assert.equal(stageForPct(50),     'stage1');
  assert.equal(stageForPct(65.9),   'stage1');
  assert.equal(stageForPct(66),     'stage2');
  assert.equal(stageForPct(100),    'stage2');
});

test('stageForPct — respeta umbrales inyectados', () => {
  assert.equal(stageForPct(25, { LOW_PCT: 20, HIGH_PCT: 80 }), 'stage1');
  assert.equal(stageForPct(85, { LOW_PCT: 20, HIGH_PCT: 80 }), 'stage2');
});

test('scoreHeart — all 0 → todos "none" y veredicto balanced', () => {
  const result = scoreHeart(new Array(32).fill(0), HEART);
  assert.equal(result.verdict, 'balanced');
  assert.deepEqual(result.stage1_codes, []);
  assert.deepEqual(result.stage2_codes, []);
  for (const code of HEART_DISORDER_CODES) {
    const d = result.disorders[code];
    assert.equal(d.score, 0);
    assert.equal(d.pct, 0);
    assert.equal(d.stage, 'none');
  }
});

test('scoreHeart — all 4 → todos "stage2" y veredicto has_stages', () => {
  const result = scoreHeart(new Array(32).fill(4), HEART);
  assert.equal(result.verdict, 'has_stages');
  assert.deepEqual(result.stage1_codes, []);
  assert.deepEqual(result.stage2_codes.sort(), [...HEART_DISORDER_CODES].sort());
  for (const code of HEART_DISORDER_CODES) {
    const d = result.disorders[code];
    assert.equal(d.score, 16);
    assert.equal(d.pct, 100);
    assert.equal(d.stage, 'stage2');
  }
});

test('scoreHeart — all 2 (medio) → todos "stage1"', () => {
  // 2 × 4 = 8 puntos / 16 = 50% → dentro de [33, 66) → stage1
  const result = scoreHeart(new Array(32).fill(2), HEART);
  assert.equal(result.verdict, 'has_stages');
  assert.deepEqual(result.stage2_codes, []);
  assert.deepEqual(result.stage1_codes.sort(), [...HEART_DISORDER_CODES].sort());
  for (const code of HEART_DISORDER_CODES) {
    assert.equal(result.disorders[code].score, 8);
    assert.equal(result.disorders[code].pct, 50);
    assert.equal(result.disorders[code].stage, 'stage1');
  }
});

test('scoreHeart — un solo trastorno "R" en stage2, resto balanced', () => {
  // Los 4 ítems R son las primeras 4 preguntas (por orden del ODS).
  const answers = new Array(32).fill(0);
  answers[0] = 4; answers[1] = 4; answers[2] = 4; answers[3] = 4; // 16/16 = 100% R
  const result = scoreHeart(answers, HEART);
  assert.equal(result.disorders.R.score, 16);
  assert.equal(result.disorders.R.pct, 100);
  assert.equal(result.disorders.R.stage, 'stage2');
  // Resto debe estar en none
  for (const code of HEART_DISORDER_CODES.filter(c => c !== 'R')) {
    assert.equal(result.disorders[code].stage, 'none');
  }
  assert.equal(result.verdict, 'has_stages');
  assert.deepEqual(result.stage2_codes, ['R']);
});

test('scoreHeart — 1 solo síntoma leve (score 1/16 = 6%) → none, balanced', () => {
  const answers = new Array(32).fill(0);
  answers[0] = 1; // primera pregunta con "poco de acuerdo"
  const result = scoreHeart(answers, HEART);
  assert.equal(result.verdict, 'balanced');
  assert.equal(result.disorders.R.pct, 6.25);
  assert.equal(result.disorders.R.stage, 'none');
});

test('scoreHeart — input corto se rellena con 0', () => {
  const result = scoreHeart([4, 4], HEART);
  // Sólo aporta a R (primeras 2 preguntas)
  assert.equal(result.disorders.R.score, 8);
  assert.equal(result.disorders.R.pct, 50);
  assert.equal(result.disorders.R.stage, 'stage1');
});

test('scoreHeart — clampa valores fuera de rango', () => {
  const bad = [-1, 10, 99, null, undefined, NaN, ...new Array(26).fill(0)];
  const result = scoreHeart(bad, HEART);
  // -1 → 0, 10 → 4, 99 → 4, null/undefined/NaN → 0
  // Suma para R: 0 + 4 + 4 + 0 = 8 → 50% → stage1
  assert.equal(result.disorders.R.score, 8);
  assert.equal(result.disorders.R.stage, 'stage1');
});

test('scoreHeart — thresholds inyectados sobrescriben defaults', () => {
  const answers = new Array(32).fill(2); // pct 50% para todo
  // Con umbrales default (33/66) → stage1
  const def = scoreHeart(answers, HEART);
  assert.equal(def.disorders.R.stage, 'stage1');
  // Con umbrales altos (60/90) → 50% cae en 'none'
  const strict = scoreHeart(answers, HEART, { thresholds: { LOW_PCT: 60, HIGH_PCT: 90 } });
  assert.equal(strict.disorders.R.stage, 'none');
  assert.equal(strict.verdict, 'balanced');
});

test('toBrevoAttributes — 8 SCORE + 8 STAGE + HEART_TOP + HEART_BALANCED', () => {
  const result = scoreHeart(new Array(32).fill(4), HEART);
  const attrs = toBrevoAttributes(result);
  // 18 keys esperadas
  const expectedKeys = [
    ...HEART_DISORDER_CODES.map(c => `HEART_${c}_SCORE`),
    ...HEART_DISORDER_CODES.map(c => `HEART_${c}_STAGE`),
    'HEART_TOP',
    'HEART_BALANCED',
  ];
  assert.deepEqual(Object.keys(attrs).sort(), expectedKeys.sort());
  // Con all 4 → todos stage2, HEART_TOP tiene los 8 codes, HEART_BALANCED false
  for (const code of HEART_DISORDER_CODES) {
    assert.equal(attrs[`HEART_${code}_SCORE`], 16);
    assert.equal(attrs[`HEART_${code}_STAGE`], 'stage2');
  }
  assert.equal(attrs.HEART_TOP.split(',').sort().join(','), [...HEART_DISORDER_CODES].sort().join(','));
  assert.equal(attrs.HEART_BALANCED, false);
});

test('toBrevoAttributes — all 0 → HEART_TOP vacío + HEART_BALANCED true', () => {
  const result = scoreHeart(new Array(32).fill(0), HEART);
  const attrs = toBrevoAttributes(result);
  assert.equal(attrs.HEART_TOP, '');
  assert.equal(attrs.HEART_BALANCED, true);
  for (const code of HEART_DISORDER_CODES) {
    assert.equal(attrs[`HEART_${code}_SCORE`], 0);
    assert.equal(attrs[`HEART_${code}_STAGE`], 'none');
  }
});

test('umbrales exportados coinciden con briefing (33/66)', () => {
  assert.equal(HEART_THRESHOLD_LOW, 33);
  assert.equal(HEART_THRESHOLD_HIGH, 66);
});

test('el JSON de datos tiene 32 preguntas + 8 trastornos, umbrales 33/66', () => {
  assert.equal(HEART.questions.length, 32);
  assert.equal(HEART.disorders.length, 8);
  assert.equal(HEART.meta.thresholds.LOW_PCT, 33);
  assert.equal(HEART.meta.thresholds.HIGH_PCT, 66);
  // Cada trastorno tiene exactamente 4 question_codes
  for (const d of HEART.disorders) {
    assert.equal(d.question_codes.length, 4);
  }
  // Todos los question_codes referenciados existen
  const codes = new Set(HEART.questions.map(q => q.code));
  for (const d of HEART.disorders) {
    for (const qc of d.question_codes) {
      assert.ok(codes.has(qc), `question code ${qc} not in questions array`);
    }
  }
});
