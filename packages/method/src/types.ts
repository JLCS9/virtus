export type Locale = 'es' | 'fr' | 'en';

export const TEMPERAMENTS = ['COL', 'MEL', 'SAN', 'FLE'] as const;
export type Temperament = (typeof TEMPERAMENTS)[number];

/** Las seis virtudes del sistema. La fortaleza tiene dos caras: audacia y resistencia. */
export const VIRTUES = ['magnanimidad', 'humildad', 'prudencia', 'fortaleza', 'dominio', 'justicia'] as const;
export type Virtue = (typeof VIRTUES)[number];

/** Virtudes sobre las que se puede trabajar un ciclo (incluye las dos caras de la fortaleza). */
export const WORK_VIRTUES = ['magnanimidad', 'humildad', 'audacia', 'resistencia', 'prudencia', 'dominio', 'justicia'] as const;
export type WorkVirtue = (typeof WORK_VIRTUES)[number];

export const ROLES = ['padre_madre', 'hijo_hermano', 'conyuge', 'educador', 'trabajo', 'comunidad', 'otro'] as const;
export type Role = (typeof ROLES)[number];

export type DayMoment = 'manana' | 'dia' | 'noche';

/** Código de tipo: dominante solo ("COL") o dominante-secundario ("COL-SAN"). */
export type TypeCode = Temperament | `${Temperament}-${Temperament}`;

export interface TemperamentResult {
  testId: string;
  testVersion: string;
  takenAt: string;
  /** Puntuación de la etapa 1 (más desempate) por temperamento. */
  scores: Record<Temperament, number>;
  dominant: Temperament;
  secondary: Temperament | null;
  type: TypeCode;
  /** Perfil puro: el secundario apenas influye (estadísticamente menos frecuente). */
  isPure: boolean;
  /** Intensidad del secundario según la etapa 2. */
  secondaryStrength: 'marcada' | 'ligera' | null;
  challengeVirtue: WorkVirtue;
  source: 'self' | 'estimated' | 'invitation';
}
