#!/usr/bin/env node
// Copia a la app el portal /app de la web (JLCS9/virtuous-leadership-web) tal cual.
//
// La web manda: lo que hay en apps/mobile/src/web/ NO se edita a mano; se vuelve a copiar con este
// script. La app lo pinta dentro de un componente DOM de Expo (apps/mobile/src/portal/PortalWeb.tsx),
// así que cada bloque, texto, estilo y consulta a Supabase es el mismo código que corre en la web.
//
// Uso:  node scripts/sync-web.mjs /ruta/a/virtuous-leadership-web
//
// Qué hace:
//  1. Recorre los imports desde las pantallas del portal (ENTRADAS) y copia solo lo que se usa
//     (código, JSON e imágenes), con la misma estructura de carpetas que src/ en la web.
//  2. Aplica unos pocos cambios mecánicos para que el código corra en la app (TRANSFORMACIONES).
//  3. Pone encima los ficheros propios de la app (scripts/sync-web/overrides/), p. ej. el cliente
//     de Supabase, que en la app recibe la sesión del lado nativo.
//  4. Reduce las fotos grandes a 1600 px (macOS: sips) y anota la versión copiada en VERSION_WEB.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.resolve(process.argv[2] ?? '');
if (!process.argv[2] || !fs.existsSync(path.join(WEB, 'src/app/AppShell.jsx'))) {
  console.error('Uso: node scripts/sync-web.mjs /ruta/a/virtuous-leadership-web');
  process.exit(1);
}
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, 'apps/mobile/src/web');
const OVERRIDES = path.join(RAIZ, 'scripts/sync-web/overrides');

// Pantallas del portal (las rutas hijas de /app en src/App.jsx de la web) y su armazón.
const ENTRADAS = [
  'src/app/AppShell.jsx',
  'src/app/Bienvenida.jsx',
  'src/app/Hoy.jsx',
  'src/app/CaminoDiario.jsx',
  'src/formacion/Formacion.jsx',
  'src/formacion/Modulo.jsx',
  'src/app/ResultadoCaracter.jsx',
  'src/app/Personas.jsx',
  'src/app/Perfil.jsx',
  'src/app/Horarios.jsx',
  'src/i18n/index.jsx',
  'src/lib/preferencias.js',
];

// Cambios mecánicos (siempre los mismos) para que el código de Vite corra en la app.
const TRANSFORMACIONES = [
  // Variables de Vite → variables de Expo (se incrustan al compilar).
  [/import\.meta\.env\.DEV\b/g, "(process.env.NODE_ENV !== 'production')"],
  [/import\.meta\.env\.VITE_(\w+)/g, 'process.env.EXPO_PUBLIC_$1'],
  // La app no tiene la URL del navegador: la ruta es la del router del portal y las páginas de la
  // web fuera del portal (tests…) se abren en el navegador del móvil (ver PortalWeb.tsx).
  [/window\.location\.assign\(/g, 'window.__vlAbrirWeb('],
  [/window\.location\.pathname/g, 'window.__vlRuta()'],
];

const EXT = ['', '.js', '.jsx', '/index.js', '/index.jsx'];
const IMPORT_RE = /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;
const CODIGO = /\.(m?js|jsx)$/;

const vistos = new Set();
const paquetes = new Set();
function visitar(fichero) {
  if (vistos.has(fichero)) return;
  vistos.add(fichero);
  if (!CODIGO.test(fichero)) return;
  const texto = fs.readFileSync(fichero, 'utf8');
  for (const m of texto.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3];
    if (!spec.startsWith('.')) {
      paquetes.add(spec.split('/').slice(0, spec.startsWith('@') ? 2 : 1).join('/'));
      continue;
    }
    const base = path.resolve(path.dirname(fichero), spec);
    const hallado = EXT.map((e) => base + e).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!hallado) throw new Error(`No encuentro ${spec} (importado en ${path.relative(WEB, fichero)})`);
    visitar(hallado);
  }
}
ENTRADAS.forEach((e) => visitar(path.join(WEB, e)));

// Los overrides sustituyen a su original: no se copia lo que solo importaba el original.
const overrides = fs.existsSync(OVERRIDES)
  ? fs.readdirSync(OVERRIDES, { recursive: true }).filter((f) => fs.statSync(path.join(OVERRIDES, f)).isFile())
  : [];

fs.rmSync(DESTINO, { recursive: true, force: true });
let copiados = 0;
for (const origen of [...vistos].sort()) {
  const rel = path.relative(path.join(WEB, 'src'), origen);
  if (rel.startsWith('..')) throw new Error(`Fuera de src/: ${origen}`);
  const destino = path.join(DESTINO, rel);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  if (CODIGO.test(origen)) {
    let texto = fs.readFileSync(origen, 'utf8');
    for (const [re, por] of TRANSFORMACIONES) texto = texto.replace(re, por);
    if (/import\.meta/.test(texto)) throw new Error(`Queda import.meta sin transformar en ${rel}: añade la regla a TRANSFORMACIONES`);
    fs.writeFileSync(destino, texto);
  } else {
    fs.copyFileSync(origen, destino);
  }
  copiados++;
}
for (const rel of overrides) {
  fs.mkdirSync(path.dirname(path.join(DESTINO, rel)), { recursive: true });
  fs.copyFileSync(path.join(OVERRIDES, rel), path.join(DESTINO, rel));
}

// Fotos a 1600 px como máximo (en el móvil se ven igual y la app pesa menos). sips viene con macOS.
if (process.platform === 'darwin') {
  const grandes = [...vistos]
    .map((o) => path.join(DESTINO, path.relative(path.join(WEB, 'src'), o)))
    .filter((f) => /\.(jpe?g|png)$/i.test(f) && fs.statSync(f).size > 400_000);
  for (const f of grandes) execFileSync('sips', ['-Z', '1600', f], { stdio: 'ignore' });
}

const version = execFileSync('git', ['-C', WEB, 'rev-parse', '--short', 'HEAD']).toString().trim();
fs.writeFileSync(path.join(DESTINO, 'VERSION_WEB'), `${version}\n`);
fs.writeFileSync(
  path.join(DESTINO, 'LEEME.md'),
  `# Copia del portal de la web — no editar a mano\n\nCopiado de virtuous-leadership-web@${version} con \`node scripts/sync-web.mjs <ruta-web>\`.\n` +
    `Los cambios se hacen en la web y se vuelven a copiar. Ficheros propios de la app: scripts/sync-web/overrides/.\n`,
);

const app = JSON.parse(fs.readFileSync(path.join(RAIZ, 'apps/mobile/package.json'), 'utf8'));
const faltan = [...paquetes].filter((p) => !app.dependencies?.[p] && !['react', 'react-dom'].includes(p));
console.log(`Copiados ${copiados} ficheros (+${overrides.length} propios de la app) de virtuous-leadership-web@${version} a ${path.relative(RAIZ, DESTINO)}`);
console.log(`Paquetes que usa: ${[...paquetes].sort().join(', ')}`);
if (faltan.length) {
  console.error(`Faltan en apps/mobile/package.json: ${faltan.join(', ')} (npx expo install …)`);
  process.exit(1);
}
