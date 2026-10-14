// Genera supabase/seed.sql a partir de packages/content (fuente única del contenido).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const contentDir = join(root, 'packages/content/src');
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `array[${(a ?? []).map(q).join(',')}]::text[]`;
const out = ['-- Generado por scripts/build-seed.mjs. No editar a mano.', 'begin;'];

for (const locale of readdirSync(contentDir).filter((d) => /^[a-z]{2}$/.test(d))) {
  const read = (f) => JSON.parse(readFileSync(join(contentDir, locale, f), 'utf8'));
  const has = (f) => existsSync(join(contentDir, locale, f));
  for (const c of has('retos.json') ? read('retos.json') : []) {
    out.push(
      `insert into challenges_base (id, locale, virtue, roles, temperaments, moment, text, with_person, source, status) values (${[
        q(c.id), q(c.locale), q(c.virtue), arr(c.roles), arr(c.temperaments), q(c.moment), q(c.text), q(c.withPerson), q(c.source), q(c.status),
      ].join(', ')}) on conflict (id) do update set text = excluded.text, with_person = excluded.with_person, roles = excluded.roles, status = excluded.status;`,
    );
  }
  const piece = (id, kind, author, body, mediaUrl, virtues, temperaments, source) =>
    `insert into content_pieces (id, kind, locale, author, body, media_url, virtues, temperaments, source, status) values (${[
      q(id), q(kind), q(locale), q(author), q(body), q(mediaUrl), arr(virtues), arr(temperaments), q(source), q('draft'),
    ].join(', ')}) on conflict (id) do update set body = excluded.body, media_url = excluded.media_url;`;
  for (const v of has('videos.json') ? read('videos.json') : []) out.push(piece(v.id, 'clip', v.canal, v.titulo, `https://www.youtube.com/watch?v=${v.youtubeId}`, v.virtudes, [], 'YouTube'));
  for (const m of has('modelos.json') ? read('modelos.json').modelos : [])
    out.push(piece(m.id, 'portrait', m.nombre, JSON.stringify({ lema: m.lema, resumen: m.resumen, años: m.años, ambito: m.ambito }), null, m.virtudes, m.temperamento ? [m.temperamento] : [], 'Virtuous Leadership Models'));
  for (const r of has('lecturas.json') ? read('lecturas.json') : []) out.push(piece(r.id, 'lesson', r.autor, JSON.stringify(r), null, r.virtudes, [], r.fuente));
  for (const [file, kind] of [['vl-temperamento.json', 'temperament'], ['vl-caracter.json', 'character'], ['vl-corazon.json', 'heart']]) {
    if (!has(file)) continue;
    const t = read(file);
    out.push(
      `insert into test_definitions (id, version, kind, locale, status, definition) values (${[
        q(t.id), q(t.version), q(kind), q(t.locale), q(t.status), `${q(JSON.stringify(t))}::jsonb`,
      ].join(', ')}) on conflict (id, version, locale) do update set definition = excluded.definition, status = excluded.status;`,
    );
  }
}
out.push('commit;', '');
writeFileSync(join(root, 'supabase/seed.sql'), out.join('\n'));
console.log(`seed.sql: ${out.length - 3} sentencias`);
