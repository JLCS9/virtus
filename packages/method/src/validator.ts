/**
 * Validación automática de un reto (adaptado por IA o escrito por el equipo):
 * longitud, léxico vetado, registro personal (tuteo) y que sea realizable hoy.
 */

export interface ValidationRules {
  minLength: number;
  maxLength: number;
  /** Términos vetados: jerga de coaching, venta directa, «liderazgo» como privilegio de quien manda. */
  banned: string[];
  /** Marcas de que el reto no es para hoy. */
  notToday: string[];
  /** Marcas de registro formal (usted) en lugar de tuteo. */
  formal: string[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function containsTerm(text: string, term: string): boolean {
  const t = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9ñ])${t}([^a-z0-9ñ]|$)`).test(normalize(text));
}

export function validateChallenge(text: string, rules: ValidationRules): ValidationResult {
  const errors: string[] = [];
  const trimmed = text.trim();
  if (trimmed.length < rules.minLength) errors.push('demasiado_corto');
  if (trimmed.length > rules.maxLength) errors.push('demasiado_largo');
  for (const term of rules.banned) if (containsTerm(trimmed, term)) errors.push(`lexico_vetado:${term}`);
  for (const term of rules.notToday) if (containsTerm(trimmed, term)) errors.push(`no_es_para_hoy:${term}`);
  for (const term of rules.formal) if (containsTerm(trimmed, term)) errors.push(`registro_formal:${term}`);
  if (/[{}]/.test(trimmed)) errors.push('plantilla_sin_rellenar');
  return { ok: errors.length === 0, errors };
}
