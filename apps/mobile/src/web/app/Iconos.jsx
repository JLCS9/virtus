// Iconos de trazo (24×24) para la barra inferior y las tarjetas. Heredan el color del texto.
const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const IconoHoy = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6" /></svg>
);
export const IconoCamino = (p) => (
  <svg {...base} {...p}><circle cx="6" cy="18.5" r="2" /><circle cx="18" cy="5.5" r="2" /><path d="M7.6 17.2c3.4-1.6 1.4-5 4.4-6.3 2.4-1 3.6-1.9 4.4-3.9" /></svg>
);
export const IconoFormacion = (p) => (
  <svg {...base} {...p}><path d="M3 8.2 12 4l9 4.2-9 4.2-9-4.2Z" /><path d="M7 10.4v4.4c0 1.2 2.2 2.6 5 2.6s5-1.4 5-2.6v-4.4" /><path d="M21 8.2v5" /></svg>
);
export const IconoPlay = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}><path d="M8 5.6v12.8a.7.7 0 0 0 1.06.6l10.2-6.4a.7.7 0 0 0 0-1.2L9.06 5a.7.7 0 0 0-1.06.6Z" /></svg>
);
export const IconoCheck = (p) => (
  <svg {...base} strokeWidth={2.2} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconoFlecha = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconoPerfil = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg>
);
export const IconoCandado = (p) => (
  <svg {...base} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconoChevron = (p) => (
  <svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconoVideo = (p) => (
  <svg {...base} {...p}><rect x="3" y="6" width="13" height="12" rx="1.5" /><path d="M16 10l5-3v10l-5-3" /></svg>
);
export const IconoEjercicio = (p) => (
  <svg {...base} {...p}><path d="M14 3l4 4-9.5 9.5H5v-3.5L14 3Z" /><path d="M12.5 4.5l4 4" /></svg>
);
export const IconoCuestionario = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.6 2-2.6 3.7" /><circle cx="12" cy="17.5" r=".4" fill="currentColor" stroke="none" /></svg>
);
