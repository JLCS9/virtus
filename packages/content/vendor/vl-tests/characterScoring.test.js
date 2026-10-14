// Tests del motor de scoring del Test de Carácter.
// Ejecutar con: npm test  (alias de `node --test src/lib/*.test.js`).
//
// Estrategia:
//   1. Casos sintéticos (all +1, all -1, all 0) — verifican que el motor
//      produce los rangos extremos esperados (~100%, ~0%, 50%).
//   2. Fixtures reales del Excel (Sheet6.test_results_character) — el script
//      de extracción precomputó el `expected` con el mismo algoritmo en
//      Python. Si JS y Python divergen aquí, los tests fallan: garantiza
//      coherencia entre el JSON de datos y el motor.
//
// Si los tests fallan tras un cambio en characterScoring.js, NO se debe
// regenerar las fixtures sin entender por qué cambia el output — eso sería
// circular. Investiga primero.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { scoreCharacter, getStageKey, toBrevoAttributes } from './characterScoring.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(readFileSync(join(__dirname, '../data/character-test.json'), 'utf-8'));
const FIXTURES = JSON.parse(readFileSync(join(__dirname, '../data/character-test-fixtures.json'), 'utf-8'));

const VIRTUE_CODES = ['P', 'C', 'S', 'J', 'M', 'H'];

test('scoreCharacter — structure: 6 virtudes con global/passive/active y claves i18n', () => {
  const result = scoreCharacter(new Array(68).fill(0), DATA);
  assert.deepEqual(Object.keys(result).sort(), [...VIRTUE_CODES].sort());
  for (const code of VIRTUE_CODES) {
    const v = result[code];
    assert.ok('global' in v && 'passive' in v && 'active' in v,
      `${code} missing global/passive/active`);
    assert.equal(typeof v.global, 'number');
    assert.equal(typeof v.passive, 'number');
    assert.equal(typeof v.active, 'number');
    assert.ok(v.passive_facet_key?.startsWith('chResult'),
      `${code} passive_facet_key invalid: ${v.passive_facet_key}`);
    assert.ok(v.active_facet_key?.startsWith('chResult'),
      `${code} active_facet_key invalid: ${v.active_facet_key}`);
    assert.ok(v.virtue_label_key?.startsWith('chResult'),
      `${code} virtue_label_key invalid: ${v.virtue_label_key}`);
    assert.ok(v.virtue_html_key?.endsWith('.html'),
      `${code} virtue_html_key invalid: ${v.virtue_html_key}`);
  }
});

test('caso límite all +1 → todos los porcentajes ≈ 100', () => {
  const answers = new Array(68).fill(1);
  const result = scoreCharacter(answers, DATA);
  for (const code of VIRTUE_CODES) {
    assert.equal(result[code].global, 100, `${code}.global should be 100`);
    assert.equal(result[code].passive, 100, `${code}.passive should be 100`);
    assert.equal(result[code].active, 100, `${code}.active should be 100`);
  }
});

test('caso límite all -1 → todos los porcentajes ≈ 0', () => {
  const answers = new Array(68).fill(-1);
  const result = scoreCharacter(answers, DATA);
  for (const code of VIRTUE_CODES) {
    assert.equal(result[code].global, 0, `${code}.global should be 0`);
    assert.equal(result[code].passive, 0, `${code}.passive should be 0`);
    assert.equal(result[code].active, 0, `${code}.active should be 0`);
  }
});

test('caso límite all 0 → todos los porcentajes = 50 (neutro)', () => {
  const answers = new Array(68).fill(0);
  const result = scoreCharacter(answers, DATA);
  for (const code of VIRTUE_CODES) {
    assert.equal(result[code].global, 50, `${code}.global should be 50`);
    assert.equal(result[code].passive, 50, `${code}.passive should be 50`);
    assert.equal(result[code].active, 50, `${code}.active should be 50`);
  }
});

test('input corto (menos de 68 respuestas) se rellena con 0 sin lanzar', () => {
  // 1 sola respuesta a +1 (la primera, P1). Las 67 restantes implícitamente 0.
  // Las preguntas no aportan nada a otras virtudes excepto a la suya.
  // Como mínimo P.global debe ser > 50 (algo positivo contó) y al menos una
  // virtud (las que NO comparten ítem con P1) debe seguir en 50.
  const result = scoreCharacter([1], DATA);
  // P1 tiene peso 1 sólo en Deliberation (única col activa para P1 en el Excel),
  // así que P.passive sube, P.active queda en 50, y P.global queda intermedio.
  assert.ok(result.P.global > 50,  `P.global should be > 50 with 1×P1 answered, got ${result.P.global}`);
  assert.ok(result.P.global < 100, `P.global should be < 100 with only 1 answer, got ${result.P.global}`);
  // Todas las virtudes deben estar en rango válido [0,100].
  for (const code of VIRTUE_CODES) {
    assert.ok(result[code].global >= 0 && result[code].global <= 100,
      `${code}.global out of range: ${result[code].global}`);
  }
});

test('input vacío / null / undefined → tratado como todo-0 (50%)', () => {
  for (const empty of [[], null, undefined]) {
    const result = scoreCharacter(empty, DATA);
    assert.equal(result.P.global, 50, `empty=${empty} should give 50%`);
  }
});

test('valores no numéricos en answers se ignoran (tratados como 0)', () => {
  const answers = ['x', null, undefined, NaN, Infinity, ...new Array(63).fill(0)];
  const result = scoreCharacter(answers, DATA);
  // Todos efectivamente neutros → 50%
  for (const code of VIRTUE_CODES) {
    assert.equal(result[code].global, 50);
  }
});

test('getStageKey mapea correctamente a los 3 umbrales', () => {
  assert.equal(getStageKey(0),      'chResultVirtueStage0');
  assert.equal(getStageKey(39.99),  'chResultVirtueStage0');
  assert.equal(getStageKey(40),     'chResultVirtueStage1');
  assert.equal(getStageKey(50),     'chResultVirtueStage1');
  assert.equal(getStageKey(69.99),  'chResultVirtueStage1');
  assert.equal(getStageKey(70),     'chResultVirtueStage2');
  assert.equal(getStageKey(100),    'chResultVirtueStage2');
});

test('toBrevoAttributes aplana a 18 enteros con keys CODE_GLOBAL/PASSIVE/ACTIVE', () => {
  const result = scoreCharacter(new Array(68).fill(0.5), DATA);
  const attrs = toBrevoAttributes(result);
  const expectedKeys = VIRTUE_CODES.flatMap(c => [`${c}_GLOBAL`, `${c}_PASSIVE`, `${c}_ACTIVE`]);
  assert.deepEqual(Object.keys(attrs).sort(), expectedKeys.sort());
  for (const k of expectedKeys) {
    assert.equal(typeof attrs[k], 'number', `${k} should be number`);
    assert.equal(attrs[k], Math.round(attrs[k]), `${k} should be integer`);
    assert.ok(attrs[k] >= 0 && attrs[k] <= 100, `${k} out of range: ${attrs[k]}`);
  }
  // All +0.5 → norm = +0.5 → pct = 75%
  for (const c of VIRTUE_CODES) {
    assert.equal(attrs[`${c}_GLOBAL`], 75);
  }
});

// ─────────────── Fixtures reales del Excel (Sheet6) ───────────────
// El script de extracción precomputa `expected` en Python con el mismo
// algoritmo. Aquí lo verificamos en JS — si divergen, una de las dos
// implementaciones está mal.

test('fixtures sintéticas (extraction script) coinciden con motor JS', () => {
  for (const [name, fix] of Object.entries(FIXTURES.synthetic)) {
    const result = scoreCharacter(fix.answers_values, DATA);
    for (const code of VIRTUE_CODES) {
      assert.equal(result[code].global, fix.expected[code].global,
        `${name}: ${code}.global mismatch (js=${result[code].global}, py=${fix.expected[code].global})`);
      assert.equal(result[code].passive, fix.expected[code].passive,
        `${name}: ${code}.passive mismatch`);
      assert.equal(result[code].active, fix.expected[code].active,
        `${name}: ${code}.active mismatch`);
    }
  }
});

test(`fixtures reales (${FIXTURES.real.length} filas de Sheet6) coinciden con motor JS`, () => {
  for (let i = 0; i < FIXTURES.real.length; i++) {
    const fix = FIXTURES.real[i];
    const result = scoreCharacter(fix.answers_values, DATA);
    for (const code of VIRTUE_CODES) {
      assert.equal(result[code].global, fix.expected[code].global,
        `fixture[${i}] row ${fix.source_row} locale=${fix.locale}: ${code}.global mismatch ` +
        `(js=${result[code].global}, py=${fix.expected[code].global})`);
      assert.equal(result[code].passive, fix.expected[code].passive,
        `fixture[${i}]: ${code}.passive mismatch`);
      assert.equal(result[code].active, fix.expected[code].active,
        `fixture[${i}]: ${code}.active mismatch`);
    }
  }
});
