// Tests de las fichas de personas (puntuación, combinaciones, observaciones). `pnpm test`.

import { assert, test } from 'vitest';
import {
  NO_SE, PREGUNTAS, combinacion, esMenorDe18, idDeClave, claveFicha, necesitaDesempate, ordenAleatorio,
  TEMPS, type Persona, propuestaPorObservaciones, puntuar, sugerenciaDelDia,
} from './personas';

type Ficha = Pick<Persona, 'estado' | 'primario' | 'puntos'>;

const N = NO_SE;

test('8 preguntas con una respuesta por temperamento', () => {
  assert.strictEqual(PREGUNTAS.length, 8);
  for (const [, r] of PREGUNTAS) assert.deepEqual(Object.keys(r).sort(), ['COL', 'FLE', 'MEL', 'SAN']);
  const orden = ordenAleatorio();
  assert.strictEqual(orden.length, 8);
  for (const o of orden) assert.deepEqual([...o].sort(), ['COL', 'FLE', 'MEL', 'SAN']);
});

test('primario, secundario y confianza', () => {
  assert.deepEqual(puntuar(['COL', 'COL', 'COL', 'COL', 'COL', 'MEL', 'MEL', 'SAN']).primario, 'COL');
  const alta = puntuar(['COL', 'COL', 'COL', 'COL', 'COL', 'MEL', 'MEL', N]);
  assert.strictEqual(alta.confianza, 'alta');
  assert.strictEqual(alta.secundario, 'MEL');
  const media = puntuar(['COL', 'COL', 'COL', 'COL', 'MEL', 'SAN', N, N]);
  assert.strictEqual(media.confianza, 'media');
  assert.strictEqual(media.secundario, null); // el segundo solo tiene 1 punto
  assert.strictEqual(puntuar(['COL', 'COL', 'COL', 'MEL', 'MEL', 'SAN', 'FLE', N]).confianza, 'baja');
});

test('con 4 o más «No lo sé» no hay resultado', () => {
  const r = puntuar(['COL', 'COL', 'COL', 'MEL', N, N, N, N]);
  assert.strictEqual(r.primario, null);
  assert.strictEqual(necesitaDesempate(['COL', 'MEL', N, N, N, N, 'SAN', 'FLE']), false);
});

test('empate: decide el desempate y si no, la pregunta 1', () => {
  const resp = ['MEL', 'COL', 'COL', 'COL', 'MEL', 'MEL', 'SAN', 'FLE'];
  assert.strictEqual(necesitaDesempate(resp), true);
  assert.strictEqual(puntuar(resp, { rapidez: 'rapido', duracion: 'mucho' }).primario, 'COL');
  assert.strictEqual(puntuar(resp, { rapidez: 'lento', duracion: 'mucho' }).primario, 'MEL');
  // El desempate apunta a uno que no está empatado: gana la pregunta 1.
  assert.strictEqual(puntuar(resp, { rapidez: 'rapido', duracion: 'pronto' }).primario, 'MEL');
  assert.strictEqual(puntuar(resp, { rapidez: 'lento', duracion: 'mucho' }).secundario, 'COL');
});

test('combinaciones en cualquier orden', () => {
  assert.match(combinacion('MEL', 'COL')!, /decide rápido/);
  assert.strictEqual(combinacion('COL', 'MEL'), combinacion('MEL', 'COL'));
  assert.match(combinacion('FLE', 'FLE')!, /Paz asegurada/);
  assert.strictEqual(combinacion('COL', null), null);
  for (const a of TEMPS) for (const b of TEMPS) assert.ok(combinacion(a, b));
});

test('observaciones: proponen cambio solo si la nueva cambia el temperamento en cabeza', () => {
  const persona: Ficha = { estado: 'estimado', primario: 'COL', puntos: { COL: 3, MEL: 2, SAN: 2, FLE: 1 } };
  const mel = (id: number) => ({ id, temperamento: 'MEL' as const });
  assert.strictEqual(propuestaPorObservaciones(persona, [mel(1)]), null); // 3 – 2,5
  assert.strictEqual(propuestaPorObservaciones(persona, [mel(1), mel(2)]), null); // 3 – 3: empate
  assert.strictEqual(propuestaPorObservaciones(persona, [mel(1), mel(2), mel(3)]), 'MEL');
  // Si dijo «Dejarla como está», la siguiente del mismo temperamento no vuelve a preguntar.
  assert.strictEqual(propuestaPorObservaciones(persona, [mel(1), mel(2), mel(3), mel(4)]), null);
  assert.strictEqual(propuestaPorObservaciones({ ...persona, estado: 'confirmado' }, [mel(1), mel(2), mel(3)]), null);
  // Sin test: la primera observación propone su temperamento.
  assert.strictEqual(propuestaPorObservaciones({ estado: 'sin_estimar', primario: null, puntos: null }, [mel(1)]), 'MEL');
  // Test sin resultado con 4 puntos sanguíneos: una reacción flemática no propone sanguíneo.
  const luis: Ficha = { estado: 'sin_estimar', primario: null, puntos: { COL: 0, MEL: 0, SAN: 4, FLE: 0 } };
  assert.strictEqual(propuestaPorObservaciones(luis, [{ id: 1, temperamento: 'FLE' }]), null);
});

test('menores de 18 y claves de ficha', () => {
  const hoy = new Date(2026, 10, 2);
  assert.strictEqual(esMenorDe18(2010, hoy), true);
  assert.strictEqual(esMenorDe18(2008, hoy), true); // cumple 18 este año: se trata como menor
  assert.strictEqual(esMenorDe18(2007, hoy), false);
  assert.strictEqual(esMenorDe18(null, hoy), false);
  assert.strictEqual(idDeClave(claveFicha('abc')), 'abc');
  assert.strictEqual(idDeClave('familia'), null);
});

test('sugerencia del día: primero quien no ha salido esta semana y, entre ellos, la estrella', () => {
  const ana = { id: 'a', nombre: 'Ana', estrella: false, primario: 'FLE' as const, creado_en: '1' };
  const marta = { id: 'm', nombre: 'Marta', estrella: true, primario: 'MEL' as const, creado_en: '2' };
  const luis = { id: 'l', nombre: 'Luis', estrella: true, primario: null, creado_en: '3' };
  assert.strictEqual(sugerenciaDelDia([], {}, 3), null);
  assert.strictEqual(sugerenciaDelDia([ana, marta, luis], {}, 3)!.persona.nombre, 'Marta');
  // Marta ya salió esta semana: toca Luis (también con estrella), sin consejo porque no tiene temperamento.
  const s = sugerenciaDelDia([ana, marta, luis], { 2: { con_quien: 'p:m' } }, 3)!;
  assert.strictEqual(s.persona.nombre, 'Luis');
  assert.strictEqual(s.consejo, null);
  // Lo de la semana pasada no cuenta.
  assert.strictEqual(sugerenciaDelDia([ana, marta, luis], { 2: { con_quien: 'p:m' } }, 9)!.persona.nombre, 'Marta');
  assert.ok(sugerenciaDelDia([ana], {}, 4)!.consejo);
  // Ya salieron las dos con estrella: toca Ana, aunque no tenga estrella.
  assert.strictEqual(sugerenciaDelDia([ana, marta, luis], { 2: { con_quien: 'p:m' }, 3: { examen: { con_quien: 'p:l' } } }, 4)!.persona.nombre, 'Ana');
});
