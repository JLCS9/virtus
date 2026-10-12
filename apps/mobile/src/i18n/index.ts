import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import type { Locale } from '@virtus/method';
import es from './locales/es.json';
import fr from './locales/fr.json';
import en from './locales/en.json';

export const SUPPORTED: Locale[] = ['es', 'fr', 'en'];
/** Idiomas activos en esta versión. fr y en se activarán cuando estén traducidos. */
export const ENABLED: Locale[] = ['es'];

export function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode as Locale | undefined;
  return code && ENABLED.includes(code) ? code : 'es';
}

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, fr: { translation: fr }, en: { translation: en } },
  lng: deviceLocale(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
