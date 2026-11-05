/**
 * Tokens del portal, calcados de la web (virtuous-leadership-web: src/theme.js y src/app/estilos.js).
 * Si cambian en la web, se cambian aquí: la web manda.
 */
import type { TextStyle, ViewStyle } from 'react-native';

export const NAVY = '#1B2A4A';
export const NAVY_SOFT = '#2A3B5F';
export const NAVY_DEEP = '#0F1D38';
export const GOLD = '#C5A55A';
export const GOLD_DEEP = '#9D8240';
export const BEIGE = '#F4F1EA';
export const PAPER = '#FBF8F1';
export const INK = '#22262E';
export const MUTED = '#6B6B6B';
export const LINE = '#D8D2C2';
export const GOLD_REF = '#a58b26';
export const GOLD_REF_LT = '#c9ab42';
export const GOLD_REF_DK = '#786622';
export const BRUMA = '#e0e5ee';

export const TEMP_COLORS: Record<string, string> = { COL: '#9C3A3A', MEL: '#5A3F8B', SAN: '#D67A2C', FLE: '#3F7A56' };

/** En la web: FONT_SLAB = Roboto Slab (400/700) y FONT_BODY = Roboto (400/600/italic). */
export const fuente = {
  slab: (peso: 400 | 600 | 700 = 700): TextStyle => ({ fontFamily: peso >= 600 ? 'RobotoSlab_700Bold' : 'RobotoSlab_400Regular' }),
  body: (peso: 400 | 500 | 600 | 700 = 400, italic = false): TextStyle => ({
    fontFamily: italic ? 'Roboto_400Regular_Italic' : peso >= 700 ? 'Roboto_700Bold' : peso >= 500 ? 'Roboto_500Medium' : 'Roboto_400Regular',
  }),
};

/** `em` de CSS a puntos para letterSpacing. */
export const em = (valor: number, tam: number) => valor * tam;

const sombraBase = (opacidad: number, radio: number, y: number): ViewStyle => ({
  shadowColor: NAVY_DEEP,
  shadowOpacity: opacidad,
  shadowRadius: radio,
  shadowOffset: { width: 0, height: y },
  elevation: Math.round(radio / 2),
});

export const sombra = sombraBase(0.1, 8, 2);
export const sombraHero = sombraBase(0.22, 24, 8);
export const sombraBurbuja = sombraBase(0.18, 24, 4);

export const tarjeta: ViewStyle = {
  backgroundColor: PAPER,
  borderTopWidth: 2,
  borderTopColor: GOLD_REF,
  paddingVertical: 24,
  paddingHorizontal: 22,
};

export const eyebrow: TextStyle = {
  ...fuente.body(600),
  fontSize: 14,
  letterSpacing: em(0.16, 14),
  textTransform: 'uppercase',
  color: GOLD_REF_DK,
};

export const titulo = (tam = 28): TextStyle => ({ ...fuente.slab(700), color: NAVY, fontSize: tam, lineHeight: Math.round(tam * 1.08) + 2 });

export const parrafo: TextStyle = { ...fuente.body(400), fontSize: 18, lineHeight: 18 * 1.65, color: MUTED };

export const heroColores = [NAVY, NAVY_DEEP] as const;

export const barraFondo: ViewStyle = { height: 6, backgroundColor: 'rgba(27,42,74,0.10)', overflow: 'hidden' };

export function fechaLarga(d = new Date()) {
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
