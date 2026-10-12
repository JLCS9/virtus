/**
 * Tokens de diseño de Virtus — derivados del Brandbook Virtuous Leadership ed. 1.0 (2026).
 * Fuente única para la app móvil y la futura web. No añadir colores ajenos al sistema.
 */

export const color = {
  azulProfundo: '#1A304F',
  azulNoche: '#0F1E33',
  doradoVirtud: '#A58B26',
  doradoClaro: '#C9AB42',
  pizarra: '#2E3744',
  plomo: '#6E7A8E',
  piedra: '#B8C0CC',
  bruma: '#E0E5EE',
  niebla: '#F4F6FA',
  blanco: '#FFFFFF',
  /** PENDIENTE DE APROBACIÓN: el brandbook nombra la crema sin dar hex. Valor tomado de alexhavard.com. */
  crema: '#FAF7EE',
} as const;

export type ColorToken = keyof typeof color;

/** Mapa semántico del brandbook aplicado al perfil de carácter. */
export const virtueColor = {
  magnanimidad: color.doradoVirtud,
  humildad: color.azulProfundo,
  prudencia: color.plomo,
  fortaleza: color.plomo,
  dominio: color.plomo,
  justicia: color.plomo,
} as const;

/** Superficies semánticas: claro (por defecto) y noche (examen y modo oscuro). */
export const surface = {
  claro: {
    fondo: color.blanco,
    fondoAlt: color.niebla,
    superficie: color.bruma,
    borde: color.piedra,
    titular: color.azulProfundo,
    texto: color.pizarra,
    /** Solo a partir de 18 px (contraste 4,3:1 sobre blanco). */
    textoSecundario: color.plomo,
    acento: color.doradoVirtud,
  },
  noche: {
    fondo: color.azulNoche,
    fondoAlt: color.azulProfundo,
    superficie: color.azulProfundo,
    borde: color.plomo,
    titular: color.blanco,
    texto: color.crema,
    textoSecundario: color.piedra,
    acento: color.doradoClaro,
  },
  marca: {
    fondo: color.azulProfundo,
    fondoAlt: color.azulNoche,
    superficie: color.azulNoche,
    borde: color.plomo,
    titular: color.blanco,
    texto: color.crema,
    textoSecundario: color.piedra,
    acento: color.doradoClaro,
  },
} as const;

export type SurfaceName = keyof typeof surface;
export type Surface = (typeof surface)[SurfaceName];

export const fontFamily = {
  slab500: 'RobotoSlab_500Medium',
  slab700: 'RobotoSlab_700Bold',
  sans400: 'Roboto_400Regular',
  sans500: 'Roboto_500Medium',
  sans700: 'Roboto_700Bold',
  sans400Italic: 'Roboto_400Regular_Italic',
} as const;

/** Escala tipográfica de la app (pt). El interlineado sube al bajar de tamaño. */
export const type = {
  display: { fontFamily: fontFamily.slab700, fontSize: 36, lineHeight: 38 },
  h1: { fontFamily: fontFamily.slab700, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: fontFamily.slab500, fontSize: 22, lineHeight: 29 },
  h3: { fontFamily: fontFamily.slab500, fontSize: 18, lineHeight: 25 },
  body: { fontFamily: fontFamily.sans400, fontSize: 16, lineHeight: 25 },
  bodyStrong: { fontFamily: fontFamily.sans500, fontSize: 16, lineHeight: 25 },
  lectura: { fontFamily: fontFamily.sans400, fontSize: 18, lineHeight: 30 },
  cita: { fontFamily: fontFamily.sans400Italic, fontSize: 17, lineHeight: 27 },
  eyebrow: { fontFamily: fontFamily.sans700, fontSize: 12, lineHeight: 16, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  caption: { fontFamily: fontFamily.sans400, fontSize: 13, lineHeight: 19 },
  boton: { fontFamily: fontFamily.sans500, fontSize: 16, lineHeight: 20 },
} as const;

export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48 } as const;
export const radius = { s: 4, m: 8, l: 12, pill: 999 } as const;

/** Filete dorado de 3 px bajo el titular (kit mínimo del brandbook). */
export const filete = { height: 3, width: 56 } as const;

/** Transiciones lentas, sin celebraciones. */
export const motion = { lenta: 450, media: 300 } as const;

/** Nunca se traduce. */
export const TAGLINE = 'Igniting Hearts for Greatness';
