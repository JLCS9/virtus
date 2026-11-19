// Rutas del portal en la app y enlaces a las páginas públicas de la web (tests, resultados…).
import * as WebBrowser from 'expo-web-browser';

export const WEB = 'https://virtuousleadership.com/es';

/** Rutas de la web (/tests/temperamento…) que en la app se abren en el navegador. */
export const PAGINA_WEB = {
  testTemperamento: `${WEB}/tests/temperamento`,
  testCaracter: `${WEB}/tests/caracter`,
  testCorazon: `${WEB}/tests/corazon-libre`,
  resultadoTemperamento: `${WEB}/tests/temperamento/gracias`,
  restablecer: `${WEB}/restablecer`,
  privacidad: `${WEB}/politica-de-privacidad`,
} as const;

export const abrirWeb = (url: string) => WebBrowser.openBrowserAsync(url);
