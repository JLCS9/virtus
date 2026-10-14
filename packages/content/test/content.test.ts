import { describe, expect, it } from 'vitest';
import { validateChallenge, ALL_TYPES } from '@virtus/method';
import { getContent } from '../src';

const c = getContent('es');

describe('contenido es', () => {
  it('todos los retos base pasan el validador', () => {
    for (const r of c.challenges) {
      expect(validateChallenge(r.text, c.lexicon), r.id).toEqual({ ok: true, errors: [] });
      if (r.withPerson) {
        expect(r.withPerson).toContain('{persona}');
        expect(validateChallenge(r.withPerson.replace('{persona}', 'Marta'), c.lexicon).ok, r.id).toBe(true);
      }
    }
  });
  it('hay retos para las cuatro virtudes-desafío', () => {
    for (const v of ['humildad', 'audacia', 'resistencia', 'magnanimidad']) {
      expect(c.challenges.filter((r) => r.virtue === v).length).toBeGreaterThanOrEqual(6);
    }
  });
  it('ids únicos', () => {
    const ids = c.challenges.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('biblioteca', () => {
  it('hay 12 tipos con nombre y reto', () => {
    for (const code of ALL_TYPES) {
      expect(c.types[code], code).toBeDefined();
      expect(c.types[code].name.length).toBeGreaterThan(3);
    }
  });
  it('los modelos de cada temperamento existen', () => {
    for (const t of Object.values(c.temperaments)) for (const id of t.modelos) expect(c.models.some((m) => m.id === id), id).toBe(true);
  });
  it('vídeos sin duplicados', () => {
    const ids = c.videos.map((v) => v.youtubeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
