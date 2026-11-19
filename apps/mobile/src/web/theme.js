// Sistema de diseño unificado web + portal.
// Roboto Slab (headings) + Roboto (body), paleta azul profundo + oro.

export const NAVY      = '#1B2A4A';
export const NAVY_SOFT = '#2A3B5F';
export const NAVY_DEEP = '#0F1D38';
export const GOLD      = '#a58b26';
export const GOLD_SOFT = '#c9ab42';
export const GOLD_DEEP = '#786622';
export const BEIGE     = '#F4F1EA';
export const PAPER     = '#FBF8F1';
export const INK       = '#22262E';
export const MUTED     = '#6B6B6B';
export const LINE      = '#D8D2C2';

export const FONT_SLAB = "'Roboto Slab', Georgia, serif";
export const FONT_BODY = "'Roboto', system-ui, sans-serif";

export const GOLD_REF     = GOLD;
export const GOLD_REF_LT  = GOLD_SOFT;
export const GOLD_REF_DK  = GOLD_DEEP;
export const BRUMA         = '#e0e5ee';

// Feedback — colores semánticos para éxito/error/alerta en ejercicios y formularios.
export const SUCCESS_BG = '#ecfdf5';
export const SUCCESS    = '#10b981';
export const SUCCESS_DK = '#065f46';
export const ERROR_BG   = '#fef2f2';
export const ERROR      = '#ef4444';
export const ERROR_DK   = '#991b1b';
export const WARNING_BG = '#fef7ed';
export const WARNING    = '#f59e0b';
export const WARNING_DK = '#92400e';

export const MAX_WIDTH = 1100;

// Etiquetas de los 4 temperamentos (compartidas con el test).
export const TEMP_COLORS = {
  COL: '#9C3A3A',
  MEL: '#5A3F8B',
  SAN: '#D67A2C',
  FLE: '#3F7A56',
};

// Clases reusables de estilo. Usadas vía `style={{...}}` o desestructurando.
export const styles = {
  container: {
    maxWidth: MAX_WIDTH,
    margin: '0 auto',
    padding: '0 24px',
  },
  h1: {
    fontFamily: FONT_SLAB,
    fontSize: 'clamp(34px, 5vw, 52px)',
    fontWeight: 700,
    color: NAVY,
    letterSpacing: '-0.01em',
    lineHeight: 1.08,
    margin: 0,
  },
  h2: {
    fontFamily: FONT_SLAB,
    fontSize: 'clamp(26px, 3.4vw, 36px)',
    fontWeight: 700,
    color: NAVY,
    letterSpacing: '-0.005em',
    lineHeight: 1.2,
    margin: 0,
  },
  h3: {
    fontFamily: FONT_SLAB,
    fontSize: 22,
    fontWeight: 700,
    color: NAVY,
    margin: 0,
  },
  eyebrow: {
    fontFamily: FONT_BODY,
    fontSize: 14,
    color: GOLD_REF_DK,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginBottom: 12,
  },
  para: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    lineHeight: 1.65,
    color: INK,
    margin: '12px 0',
  },
  paraLarge: {
    fontFamily: FONT_SLAB,
    fontStyle: 'italic',
    fontSize: 'clamp(18px, 2vw, 22px)',
    lineHeight: 1.5,
    color: NAVY_SOFT,
    margin: '12px 0 24px 0',
  },
  buttonPrimary: {
    display: 'inline-block',
    fontFamily: FONT_BODY,
    fontSize: 16,
    letterSpacing: '0.02em',
    fontWeight: 600,
    color: '#fff',
    background: GOLD,
    border: 'none',
    padding: '16px 28px',
    borderRadius: 0,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 160ms ease',
  },
  buttonSecondary: {
    display: 'inline-block',
    fontFamily: FONT_BODY,
    fontSize: 14,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    color: NAVY,
    background: 'transparent',
    border: `1px solid ${NAVY}`,
    padding: '14px 28px',
    borderRadius: 0,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 160ms ease',
  },
};

// Hover handlers reusables — `<button onMouseOver={hover.primary.over} ...>`
export const hover = {
  primary: {
    over: e => { e.currentTarget.style.background = GOLD_SOFT; },
    out:  e => { e.currentTarget.style.background = GOLD; },
  },
  secondary: {
    over: e => { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = PAPER; },
    out:  e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = NAVY; },
  },
};
