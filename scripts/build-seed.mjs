// Genera supabase/seed.sql a partir de packages/content (fuente única del contenido).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const contentDir = join(root, 'packages/content/src');
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `array[${(a ?? []).map(q).join(',')}]::text[]`;
const out = ['-- Generado por scripts/build-seed.mjs. No editar a mano.', 'begin;'];

for (const locale of readdirSync(contentDir).filter((d) => /^[a-z]{2}$/.test(d))) {
  const read = (f) => JSON.parse(readFileSync(join(contentDir, locale, f), 'utf8'));
  for (const c of read('retos.json')) {
    out.push(
      `insert into challenges_base (id, locale, virtue, roles, temperaments, moment, text, with_person, source, status) values (${[
        q(c.id), q(c.locale), q(c.virtue), arr(c.roles), arr(c.temperaments), q(c.moment), q(c.text), q(c.withPerson), q(c.source), q(c.status),
      ].join(', ')}) on conflict (id) do update set text = excluded.text, with_person = excluded.with_person, roles = excluded.roles, status = excluded.status;`,
    );
  }
  for (const f of read('fragmentos.json')) {
    out.push(
      `insert into content_pieces (id, kind, locale, author, body, virtues, source, status) values (${[
        q(f.id), q('fragment'), q(locale), q(f.author), q(f.body ?? f.text), arr(f.virtues), q(f.source), q(f.status),
      ].join(', ')}) on conflict (id) do update set body = excluded.body, status = excluded.status;`,
    );
  }
  for (const file of ['test-temperamento.json', 'test-caracter.json']) {
    const t = read(file);
    out.push(
      `insert into test_definitions (id, version, kind, locale, status, definition) values (${[
        q(t.id), q(t.version), q(t.kind), q(t.locale), q(t.status), `${q(JSON.stringify(t))}::jsonb`,
      ].join(', ')}) on conflict (id, version, locale) do update set definition = excluded.definition, status = excluded.status;`,
    );
  }
}
out.push('commit;', '');
writeFileSync(join(root, 'supabase/seed.sql'), out.join('\n'));
console.log(`seed.sql: ${out.length - 3} sentencias`);
