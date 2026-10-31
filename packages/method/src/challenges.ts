/**
 * Reglas antes que IA: el método decide la virtud y el rol del día y escoge un reto base.
 * La IA (si está disponible) solo redacta la adaptación; si falla, se muestra el reto base.
 */
import type { DayMoment, Locale, Role, Temperament, TemperamentResult, WorkVirtue } from './types';

export interface BaseChallenge {
  id: string;
  locale: Locale;
  virtue: WorkVirtue;
  /** Roles a los que aplica. Vacío = cualquier rol. */
  roles: Role[];
  /** Temperamentos dominantes a los que va dirigido. Vacío = todos. */
  temperaments: Temperament[];
  moment: DayMoment;
  /** Texto en tuteo, concreto y verificable hoy. */
  text: string;
  /** Variante con una persona concreta: contiene {persona}. */
  withPerson?: string;
  /** Faceta de la virtud (p. ej. humildad fundamental o fraterna). */
  faceta?: string;
  source: string;
  status: 'draft' | 'approved';
}

export interface Collaborator {
  id: string;
  alias: string;
  relation: string;
  role: Role;
}

export interface DailyChallenge {
  baseId: string;
  virtue: WorkVirtue;
  role: Role | null;
  personId: string | null;
  text: string;
  adapted: boolean;
}

/** Día del año (0-based) en hora local; base de las rotaciones deterministas. */
export function dayIndex(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Rota los roles del usuario a lo largo de la semana para repartir los retos. */
export function roleOfDay(roles: Role[], date: Date): Role | null {
  if (roles.length === 0) return null;
  return roles[dayIndex(date) % roles.length];
}

/** Hash estable (FNV-1a) para ordenar candidatos de forma determinista por día. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface PickInput {
  library: BaseChallenge[];
  locale: Locale;
  virtue: WorkVirtue;
  role: Role | null;
  temperament: Pick<TemperamentResult, 'dominant' | 'secondary'> | null;
  date: Date;
  /** Ids usados recientemente o ya rechazados hoy. */
  exclude?: string[];
  /** Incluir contenido en borrador (solo desarrollo y piloto). */
  includeDrafts?: boolean;
}

/** Candidatos ordenados: primero los del rol del día, luego los generales. */
export function rankChallenges(input: PickInput): BaseChallenge[] {
  const exclude = new Set(input.exclude ?? []);
  const day = dateKey(input.date);
  const pool = input.library.filter(
    (c) =>
      c.locale === input.locale &&
      c.virtue === input.virtue &&
      (input.includeDrafts || c.status === 'approved') &&
      (c.temperaments.length === 0 || !input.temperament || c.temperaments.includes(input.temperament.dominant)),
  );
  const score = (c: BaseChallenge) => {
    const roleMatch = input.role && c.roles.includes(input.role) ? 0 : c.roles.length === 0 ? 1 : 2;
    return roleMatch;
  };
  const ranked = pool
    .filter((c) => score(c) < 2)
    .sort((a, b) => score(a) - score(b) || hash(day + a.id) - hash(day + b.id));
  const fresh = ranked.filter((c) => !exclude.has(c.id));
  // Si se agotan los no usados, se vuelve a la lista completa antes que no mostrar nada.
  return fresh.length > 0 ? fresh : ranked;
}

export function pickPerson(collaborators: Collaborator[], role: Role | null, date: Date): Collaborator | null {
  const matching = collaborators.filter((c) => c.role === role);
  if (matching.length === 0) return null;
  return matching[dayIndex(date) % matching.length];
}

/** Rellena el reto base sin IA. Es también el respaldo cuando la IA falla. */
export function renderBase(base: BaseChallenge, role: Role | null, person: Collaborator | null): DailyChallenge {
  const usePerson = person && base.withPerson;
  return {
    baseId: base.id,
    virtue: base.virtue,
    role: base.roles.length === 0 ? role : (role && base.roles.includes(role) ? role : base.roles[0]),
    personId: usePerson ? person.id : null,
    text: usePerson ? base.withPerson!.replace('{persona}', person.alias) : base.text,
    adapted: false,
  };
}
