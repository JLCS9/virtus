// Tests de la lógica del Camino (fechas, racha, siguiente paso). `pnpm test`.

import { assert, test } from 'vitest';
import {
  DESLIZA_2, DESLIZA_4, ESCENAS_11, RASGOS_13, calcularInicio, diaDelCamino, diaIso, fechaDelDia, quienCorrige, racha,
  type PorDia, NOTIFICACIONES, avisosPendientes, resumenSemana1, siguientePaso, textoElige3,
} from './camino';

test('día ISO de la semana', () => {
  assert.strictEqual(diaIso('2026-11-02'), 1); // lunes
  assert.strictEqual(diaIso('2026-11-01'), 7); // domingo
});

test('el camino empieza el primer día del vídeo, hoy incluido', () => {
  assert.strictEqual(calcularInicio(7, '2026-11-01'), '2026-11-01');
  assert.strictEqual(calcularInicio(1, '2026-11-01'), '2026-11-02');
  assert.strictEqual(calcularInicio(6, '2026-11-02'), '2026-11-07');
});

test('día del camino', () => {
  assert.strictEqual(diaDelCamino('2026-11-02', '2026-11-01'), 0);
  assert.strictEqual(diaDelCamino('2026-11-02', '2026-11-02'), 1);
  assert.strictEqual(diaDelCamino('2026-11-02', '2026-11-15'), 14);
  assert.strictEqual(diaDelCamino('2026-10-26', '2026-11-02'), 8); // cruza el cambio de hora
  assert.strictEqual(fechaDelDia('2026-11-02', 8), '2026-11-09');
  assert.strictEqual(fechaDelDia('2026-10-19', 8), '2026-10-26'); // cruza el cambio de hora (25-oct)
  assert.strictEqual(calcularInicio(1, '2026-10-20'), '2026-10-26');
});

test('racha: días seguidos con actividad, desde hoy o ayer', () => {
  const en = (f: string) => new Date(`${f}T20:00:00`).toISOString();
  const dias = [{ sesion_en: en('2026-11-01') }, { examen_en: en('2026-11-02') }, { sesion_en: en('2026-11-03') }];
  assert.strictEqual(racha(dias, '2026-11-03'), 3);
  assert.strictEqual(racha(dias, '2026-11-04'), 3);
  assert.strictEqual(racha(dias, '2026-11-05'), 0);
  assert.strictEqual(racha([], '2026-11-05'), 0);
  const otoño = [{ sesion_en: en('2026-10-24') }, { sesion_en: en('2026-10-25') }, { sesion_en: en('2026-10-26') }];
  assert.strictEqual(racha(otoño, '2026-10-26'), 3);
});

test('siguiente paso', () => {
  assert.strictEqual(siguientePaso({ diaHoy: 0, porDia: {} }), null);
  assert.deepEqual(siguientePaso({ diaHoy: 2, porDia: {} }), { tipo: 'sesion', dia: 2 });
  assert.deepEqual(siguientePaso({ diaHoy: 2, porDia: { 2: { sesion_en: 'x' } } }), { tipo: 'examen', dia: 2 });
  assert.deepEqual(siguientePaso({ diaHoy: 2, porDia: { 2: { sesion_en: 'x', examen_en: 'x' } } }), { tipo: 'sesion', dia: 1, atrasada: true });
  assert.deepEqual(siguientePaso({ diaHoy: 7, porDia: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((d) => [d, { sesion_en: 'x' }])) }), { tipo: 'hecho', dia: 7 });
});

test('contenido de los juegos según la especificación', () => {
  assert.strictEqual(DESLIZA_4.length, 12);
  for (const k of ['COL', 'MEL', 'SAN', 'FLE']) assert.strictEqual(DESLIZA_4.filter(([, r]) => r === k).length, 3);
  assert.strictEqual(DESLIZA_2.length, 10);
  assert.strictEqual(RASGOS_13.length, 12);
  for (const e of ESCENAS_11) assert.deepEqual(Object.keys(e.sale).sort(), ['COL', 'FLE', 'MEL', 'SAN']);
});

test('día 3: texto según coincidencias con el primario', () => {
  assert.match(textoElige3(4, 'colérico'), /confirman tu temperamento colérico/);
  assert.match(textoElige3(2, 'colérico'), /se reparten/);
  assert.match(textoElige3(1, 'colérico'), /primera reacción/);
});

test('día 11: quién te corrige según el momento vital', () => {
  assert.strictEqual(quienCorrige(['estudio', 'trabajo']), 'un profesor');
  assert.strictEqual(quienCorrige(['trabajo']), 'tu jefe');
  assert.strictEqual(quienCorrige(['familia']), 'un familiar');
  assert.strictEqual(quienCorrige([]), 'alguien');
});

test('día 14: resumen de la semana 1', () => {
  const porDia: PorDia = {
    8: { examen: { reto: 'si', con_quien: 'amigos', reconocio: 'si' } },
    9: { examen: { reto: 'a_medias', con_quien: 'familia', reconocio: 'no' } },
    10: { examen: { reto: 'no' } },
    11: { examen: { reto: 'si', con_quien: 'solo' } },
  };
  assert.deepEqual(resumenSemana1(porDia), { contado: 2, reconocieron: 1, retos: 3 });
});

test('notificaciones: la de la sesión va con el tipo de sesión (la ficha, el día 2)', () => {
  assert.match(NOTIFICACIONES[2].sesion, /descubrir el temperamento/);
  assert.match(NOTIFICACIONES[3].sesion, /colérico en un atasco/);
  assert.strictEqual(NOTIFICACIONES[7].examen, null);
  assert.strictEqual(NOTIFICACIONES[14].examen, null);
});

test('avisos pendientes: solo futuros, sin lo ya hecho, a su hora local aunque cambie la hora', () => {
  const perfil = { inicio: '2026-10-19', hora_examen: '21:30:00' };
  const todos = avisosPendientes(perfil, {}, new Date(2026, 9, 18));
  assert.strictEqual(todos.length, 26); // 14 sesiones + 12 exámenes (sin los días 7 y 14)
  // Día 8 (26-oct, ya en horario de invierno): sigue a las 21:30 locales.
  const examen8 = todos.find((a) => a.id === 'camino-examen-8')!;
  assert.strictEqual(examen8.cuando.getDate(), 26);
  assert.strictEqual(examen8.cuando.getHours(), 21);
  assert.strictEqual(examen8.cuando.getMinutes(), 30);
  // A mitad del día 2, con la sesión hecha: queda el examen del día 2 y lo de los días siguientes.
  const resto = avisosPendientes(perfil, { 2: { dia: 2, sesion_en: 'x' } }, new Date(2026, 9, 20, 12));
  assert.deepEqual(resto.slice(0, 2).map((a) => a.id), ['camino-examen-2', 'camino-sesion-3']);
});
