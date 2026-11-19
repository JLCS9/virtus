// Mapa de rutas localizadas. Cada pagina tiene un pageId logico (estable en el
// codigo) y un slug por idioma (lo que aparece en la URL del navegador). Asi
// /es/colegios, /en/schools, /fr/ecoles y /ru/shkoly apuntan al mismo
// componente de React pero cada idioma tiene su URL indexable propia.
//
// Reglas:
// - Si un slug es vacio ('') se considera ruta raiz del idioma (home).
// - Los slugs no llevan barra inicial.
// - Para subrutas usar slash interno: 'tests/temperamento' -> /es/tests/temperamento.
// - El pageId 'test_temperamento' se renderiza SIN Layout (mini-app).
// - Anadir/cambiar slugs aqui es la unica fuente de verdad: rutas, useLocalPath,
//   SEO hreflang y sitemap derivan de este objeto.

export const ROUTES = {
  home:                  { es: '',                       en: '',                        fr: '',                         ru: '' },
  acreditacion_landing:  { es: 'acreditacion',           en: 'certification',           fr: 'accreditation',            ru: 'akkreditatsiya' },
  acreditacion_colegios: { es: 'acreditacion/colegios',  en: 'certification/schools',   fr: 'accreditation/ecoles',     ru: 'akkreditatsiya/shkoly' },
  programa_colegios:     { es: 'colegios',               en: 'schools',                 fr: 'ecoles',                   ru: 'shkoly' },
  colegios_gracias:      { es: 'colegios/gracias/:flow',  en: 'schools/thank-you/:flow', fr: 'ecoles/merci/:flow',       ru: 'shkoly/spasibo/:flow' },
  programa_empresas:     { es: 'empresas',               en: 'businesses',              fr: 'entreprises',              ru: 'kompanii' },
  universidades:         { es: 'universidades',          en: 'universities',            fr: 'universites',              ru: 'universitety' },
  edsup:                 { es: 'educacion-superior',     en: 'higher-education',        fr: 'enseignement-superieur',   ru: 'vysshee-obrazovanie' },
  tests:                 { es: 'tests',                  en: 'tests',                   fr: 'tests',                    ru: 'testy' },
  test_temperamento:     { es: 'tests/temperamento',     en: 'tests/temperament',       fr: 'tests/temperament',        ru: 'testy/temperament' },
  // Test de carácter — modelo de las 6 virtudes (Havard). Slugs default;
  // si quieres SEO específico distinto, cámbialos aquí.
  test_caracter:         { es: 'tests/caracter',          en: 'tests/character',         fr: 'tests/caractere',          ru: 'testy/kharakter' },
  // Test del Corazón (modelo "Corazón Libre" de A. Havard, 8 enfermedades
  // espirituales). Slugs derivan del título del libro en cada idioma.
  test_corazon:          { es: 'tests/corazon-libre',     en: 'tests/free-heart',        fr: 'tests/coeur-libre',        ru: 'testy/svobodnoe-serdtse' },
  // Página de agradecimiento tras completar el test de temperamento (adultos).
  // Pensada para landing post-envío o link directo desde Brevo. Va con Layout
  // normal (no es NO_LAYOUT) para que el usuario pueda navegar al resto del sitio.
  test_temperamento_gracias: { es: 'tests/temperamento/gracias', en: 'tests/temperament/thank-you', fr: 'tests/temperament/merci', ru: 'testy/temperament/spasibo' },
  // Test de temperamento para niños — disponible en los 4 idiomas con
  // banco unificado de preguntas por idioma (questions-children.{lang}.json)
  // y motor de personalización lang-agnostic ({X/Y} placeholders).
  test_temperamento_ninos: { es: 'tests/temperamento-infantil', en: 'tests/temperament-children', fr: 'tests/temperament-enfants', ru: 'testy/temperament-detey' },
  // Paginas legales — disponibles en 4 idiomas; menu oculto, solo bandera de idioma.
  politica_privacidad:   { es: 'politica-de-privacidad',  en: 'privacy-policy',         fr: 'politique-de-confidentialite', ru: 'politika-konfidentsialnosti' },
  cookies:               { es: 'cookies',                  en: 'cookies',                fr: 'cookies',                       ru: 'cookies' },
  contacto:              { es: 'contacto',               en: 'contact',                 fr: 'contact',                  ru: 'kontakty' },
  // Portal privado — noindex, fuera del sitemap. /app es la ruta padre
  // (las pestañas Camino y Formación se montan como rutas hijas en App.jsx).
  app:                   { es: 'app' },
  login:                 { es: 'login',                  en: 'login',                   fr: 'connexion',                ru: 'vkhod' },
  // Redirects legacy: las URLs antiguas /mi-panel/* redirigen a /app/*.
  mi_panel:              { es: 'mi-panel',               en: 'my-dashboard',            fr: 'mon-espace',               ru: 'kabinet' },
  restablecer:           { es: 'restablecer',            en: 'reset-password',          fr: 'reinitialiser',            ru: 'vosstanovlenie' },
  // Autorización del padre, madre o tutor de un menor de 14 (enlace del email). noindex.
  consentimiento_tutor:  { es: 'consentimiento-tutor',   en: 'guardian-consent',        fr: 'consentement-parental',    ru: 'soglasie-roditelya' },
};

// Paginas que se renderizan SIN Layout (sin header/menu/footer del sitio).
// Cada una usa su propio layout interno (mini-app o paginas legales con
// solo la bandera de idioma).
export const NO_LAYOUT_PAGES = new Set([
  'test_temperamento',
  'test_temperamento_ninos',
  'test_temperamento_gracias',
  'test_caracter',
  'test_corazon',
  'politica_privacidad',
  'cookies',
  'app',
  'login',
  'mi_panel',
  'restablecer',
  'consentimiento_tutor',
]);

// Reverse map: cualquier slug (de cualquier idioma) -> pageId.
// Permite que useLocalPath traduzca un path canonico ES (ej. '/colegios')
// al slug correcto del idioma actual (ej. '/en/schools'), y tambien
// que setLang sepa a que page corresponde el path actual al cambiar de
// idioma para reescribir la URL.
export const PATH_TO_PAGE = {};
for (const [pageId, slugs] of Object.entries(ROUTES)) {
  for (const slug of Object.values(slugs)) {
    const key = slug ? `/${slug}` : '/';
    // Si dos idiomas comparten el mismo slug (ej. 'tests' en ES y EN),
    // se sobrescribe con el mismo pageId — sin conflicto.
    PATH_TO_PAGE[key] = pageId;
  }
}

/**
 * Construye la URL final para `path` en el idioma `lang`.
 * - Si path es '' o '/', devuelve '/{lang}'.
 * - Si path coincide con un slug conocido (en cualquier idioma), traduce al slug
 *   del idioma destino.
 * - Si path no es interno (http, mailto, hash...), devuelve tal cual.
 * - Si no se reconoce el path, lo prefija con '/{lang}' tal cual (fallback).
 *
 * Se preserva search (?...) y hash (#...) si vienen pegados al path.
 */
export function pathForLang(path, lang) {
  if (!path) return `/${lang}`;
  if (/^(https?:|mailto:|tel:|#)/i.test(path)) return path;
  // Separa el path "limpio" del query/hash para hacer lookup
  const m = path.match(/^([^?#]*)([?#].*)?$/);
  const bare = m[1] || '/';
  const tail = m[2] || '';
  const normalizedBare = bare === '' ? '/' : bare.startsWith('/') ? bare : `/${bare}`;
  const pageId = PATH_TO_PAGE[normalizedBare];
  if (pageId) {
    const slug = ROUTES[pageId][lang];
    const newPath = slug ? `/${lang}/${slug}` : `/${lang}`;
    return newPath + tail;
  }
  // Fallback: simplemente prefijar con /{lang}
  return `/${lang}${normalizedBare === '/' ? '' : normalizedBare}${tail}`;
}

/**
 * Dado un pathname del navegador como '/en/schools' devuelve el pageId
 * ('programa_colegios') o null si no coincide.
 */
export function pageIdFromLocation(pathname) {
  // Quita el prefijo /:lang
  const m = pathname.match(/^\/[a-z]{2}(.*)$/);
  const rest = (m ? m[1] : pathname) || '';
  const key = rest === '' || rest === '/' ? '/' : rest;
  return PATH_TO_PAGE[key] || null;
}

/**
 * Devuelve un array de { lang, url } con la URL canonica en cada idioma
 * para una pagina logica (pageId). Util para hreflang y sitemap.
 */
export function alternateUrlsForPage(pageId, origin) {
  const slugs = ROUTES[pageId];
  if (!slugs) return [];
  return Object.entries(slugs).map(([lang, slug]) => ({
    lang,
    url: `${origin}/${lang}${slug ? `/${slug}` : ''}`,
  }));
}
