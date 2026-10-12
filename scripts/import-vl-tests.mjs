// Importa los 3 tests oficiales de virtuousleadership.com a packages/content/src/<lang>/.
// Fuente: zip «tests-virtuous-leadership» (repo tbp-test). Uso:
//   node scripts/import-vl-tests.mjs <ruta-al-directorio-descomprimido>
// Los JSON de datos se copian también a packages/content/vendor/vl-tests (procedencia).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const src = process.argv[2];
if (!src) throw new Error('Falta la ruta del directorio tests-virtuous-leadership');
const root = new URL('..', import.meta.url).pathname;
const LANGS = ['es', 'en', 'fr'];
const read = (p) => JSON.parse(readFileSync(join(src, p), 'utf8'));
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', mdash: '—', ndash: '–', iexcl: '¡', iquest: '¿', ordm: 'º', ordf: 'ª', middot: '·', bull: '•' };
const MARKS = { acute: '\u0301', grave: '\u0300', tilde: '\u0303', uml: '\u0308', circ: '\u0302', cedil: '\u0327' };
const decode = (t) =>
  t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z])(acute|grave|tilde|uml|circ|cedil);/g, (_, l, m) => (l + MARKS[m]).normalize('NFC'))
    .replace(/&([a-z]+);/g, (m, n) => NAMED[n] ?? m);
const strip = (html) =>
  decode(
    (html ?? '')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|h\d|ul|ol|div)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{2,}•/g, '\n•')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const character = read('src/data/character-test.json');
const characterText = read('src/data/character-support-text.json');
const heart = read('src/data/heart-test.json');
const heartText = read('src/data/heart-support-text.json');

for (const lang of LANGS) {
  const i18n = (await import(pathToFileURL(join(src, 'src/i18n', `${lang}.js`)).href)).default;
  const pick = (o) => (o && typeof o === 'object' ? o[lang] || o.es || o.en || '' : o ?? '');

  // ── Temperamento (TBP) ──
  const temperament = {
    id: 'vl-temperamento',
    version: '1.0.0',
    locale: lang,
    status: 'approved',
    source: 'virtuousleadership.com · test de temperamento adulto (tbp-test)',
    items: i18n.test.items,
    ui: { welcome: i18n.test.welcome, question: i18n.test.question, transition: i18n.test.transition },
    temperaments: i18n.temperaments,
    result: {
      pureNote: i18n.result.pure_note,
      challengeLabel: i18n.result.challenge_label,
      intensityLabel: i18n.result.intensity_label,
      intensityMarked: i18n.result.intensity_marked,
      intensityLight: i18n.result.intensity_light,
      virtues: i18n.result.virtues,
      profiles: i18n.result.profiles,
    },
  };

  // ── Carácter ──
  const characterOut = {
    id: 'vl-caracter',
    version: '1.0.0',
    locale: lang,
    status: 'approved',
    source: character.meta.source,
    ui: i18n.tbp_character?.question?.likert,
    welcome: i18n.tbp_character?.welcome,
    facets: character.facets,
    virtues: character.virtues,
    questions: character.questions.map((q) => ({ code: q.code, text: pick(q.text), weights: q.weights })),
    labels: Object.fromEntries(Object.entries(characterText.labels).map(([k, v]) => [k, pick(v)])),
    texts: Object.fromEntries(Object.entries(characterText.html).map(([k, v]) => [k, strip(pick(v))])),
  };

  // ── Corazón libre ──
  const heartOut = {
    id: 'vl-corazon',
    version: '1.0.0',
    locale: lang,
    status: 'approved',
    source: heart.meta.source,
    thresholds: heart.meta.thresholds,
    ui: i18n.tbp_heart?.question?.likert,
    welcome: i18n.tbp_heart?.welcome,
    disorders: heart.disorders,
    questions: heart.questions.map((q) => ({ code: q.code, disorder: q.disorder_code, text: pick(q.text) })),
    labels: Object.fromEntries(Object.entries(heartText.labels).map(([k, v]) => [k, pick(v)])),
    texts: Object.fromEntries(Object.entries(heartText.html).map(([k, v]) => [k, strip(pick(v))])),
    bookUrl: pick(heart.link_to_book),
  };

  const dir = join(root, 'packages/content/src', lang);
  const fs = await import('node:fs');
  fs.mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'vl-temperamento.json'), JSON.stringify(temperament, null, 2));
  writeFileSync(join(dir, 'vl-caracter.json'), JSON.stringify(characterOut, null, 2));
  writeFileSync(join(dir, 'vl-corazon.json'), JSON.stringify(heartOut, null, 2));
  console.log(lang, Object.keys(temperament.items).length, characterOut.questions.length, heartOut.questions.length);
}
