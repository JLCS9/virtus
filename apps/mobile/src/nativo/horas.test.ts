import { describe, expect, it } from 'vitest';

import { aHoraDelMovil, diaExpo } from './horas';

// Las pruebas corren con TZ=Europe/Madrid (ver package.json): el «móvil» está en Madrid.
const invierno = new Date('2026-01-15T12:00:00Z');
const verano = new Date('2026-07-15T12:00:00Z');

describe('aHoraDelMovil', () => {
  it('misma zona: la hora no cambia', () => {
    expect(aHoraDelMovil('08:00', 'Europe/Madrid', 1, invierno)).toEqual({ diaIso: 1, hora: 8, minuto: 0 });
    expect(aHoraDelMovil('21:30', 'Europe/Madrid', 7, verano)).toEqual({ diaIso: 7, hora: 21, minuto: 30 });
  });

  it('usuario en Nueva York, móvil en Madrid: 6 h más', () => {
    expect(aHoraDelMovil('08:00', 'America/New_York', 1, invierno)).toEqual({ diaIso: 1, hora: 14, minuto: 0 });
  });

  it('cambia de día y de semana cuando hace falta', () => {
    // Domingo 21:30 en Nueva York = lunes 03:30 en Madrid.
    expect(aHoraDelMovil('21:30', 'America/New_York', 7, invierno)).toEqual({ diaIso: 1, hora: 3, minuto: 30 });
    // Lunes 07:00 en Tokio (+8 h respecto a Madrid en invierno) = domingo 23:00 en Madrid.
    expect(aHoraDelMovil('07:00', 'Asia/Tokyo', 1, invierno)).toEqual({ diaIso: 7, hora: 23, minuto: 0 });
  });

  it('zona desconocida: se toma la hora tal cual', () => {
    expect(aHoraDelMovil('10:00', 'Marte/Olympus', 3, invierno)).toEqual({ diaIso: 3, hora: 10, minuto: 0 });
  });
});

describe('diaExpo', () => {
  it('ISO (1 lunes … 7 domingo) → expo (1 domingo … 7 sábado)', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(diaExpo)).toEqual([2, 3, 4, 5, 6, 7, 1]);
  });
});
