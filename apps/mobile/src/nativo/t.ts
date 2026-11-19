// Textos de la web: el mismo diccionario español (src/i18n/es.js) con el mismo `t('a.b.c', {n})`.
import es from '@/web/i18n/es.js';

type Dict = Record<string, unknown>;

 
export function t(clave: string, vars?: Record<string, string | number>): any {
  const valor = clave.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Dict)[k] : undefined), es);
  if (typeof valor === 'string' && vars) return valor.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  return valor ?? clave;
}
