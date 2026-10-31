/**
 * Correspondencias entre la biblioteca (virtud + subcomponente), las 8 claves de nivel,
 * los códigos de temperamento de la app (COL/MEL/SAN/FLE) y la virtud-reto.
 */
import type { Reto, Temperamento, VirtudClave } from './tipos.ts';

export function virtudClave(reto: Pick<Reto, 'virtud' | 'subcomponente'>): VirtudClave {
  switch (reto.virtud) {
    case 'prudencia':
      return 'prudencia';
    case 'fortaleza':
      return reto.subcomponente === 'resistencia' ? 'fortaleza_resistencia' : 'fortaleza_audacia';
    case 'dominio de sí':
      return 'dominio_de_si';
    case 'justicia':
      return 'justicia';
    case 'magnanimidad':
      return 'magnanimidad';
    case 'humildad':
      return reto.subcomponente === 'fundamental' ? 'humildad_fundamental' : 'humildad_fraternal';
  }
}

export const CODIGO_TEMPERAMENTO: Record<Temperamento, 'COL' | 'MEL' | 'SAN' | 'FLE'> = {
  colerico: 'COL',
  melancolico: 'MEL',
  sanguineo: 'SAN',
  flematico: 'FLE',
};

export const TEMPERAMENTO_DE_CODIGO: Record<string, Temperamento> = {
  COL: 'colerico',
  MEL: 'melancolico',
  SAN: 'sanguineo',
  FLE: 'flematico',
};

/** Código de perfil como en el test TBP: 'COL' o 'COL-SAN'. */
export function codigoPerfil(dominante: Temperamento, secundario: Temperamento | null): string {
  return secundario ? `${CODIGO_TEMPERAMENTO[dominante]}-${CODIGO_TEMPERAMENTO[secundario]}` : CODIGO_TEMPERAMENTO[dominante];
}

/** 03 §3.1: virtud-reto por temperamento dominante. */
export const VIRTUD_RETO: Record<Temperamento, VirtudClave> = {
  colerico: 'humildad_fraternal',
  melancolico: 'fortaleza_audacia',
  sanguineo: 'fortaleza_resistencia',
  flematico: 'magnanimidad',
};

/**
 * Virtud-reto de los 12 perfiles combinados (Grandir avec son tempérament), la misma que la
 * web muestra al acabar el test (tbp-test/src/account/challengeVirtues.js), en las 8 claves.
 * Decisión acordada: esta es la que recibe ×3 en el motor (desviación explícita del 03).
 */
export const VIRTUD_RETO_PERFIL: Record<string, VirtudClave> = {
  COL: 'humildad_fraternal',
  'COL-MEL': 'humildad_fraternal',
  'COL-SAN': 'humildad_fundamental',
  MEL: 'fortaleza_audacia',
  'MEL-COL': 'humildad_fraternal',
  'MEL-FLE': 'fortaleza_audacia',
  SAN: 'fortaleza_resistencia',
  'SAN-COL': 'humildad_fundamental',
  'SAN-FLE': 'magnanimidad',
  FLE: 'magnanimidad',
  'FLE-MEL': 'fortaleza_audacia',
  'FLE-SAN': 'magnanimidad',
};

/**
 * Virtud principal (×3) y secundaria (×1,5) de necesidad para un perfil:
 * principal = la del perfil combinado; secundaria = la del dominante si es otra, o si no la
 * del secundario (como en el 03).
 */
export function virtudesReto(dominante: Temperamento, secundario: Temperamento | null): {
  principal: VirtudClave;
  secundaria: VirtudClave | null;
} {
  const principal = VIRTUD_RETO_PERFIL[codigoPerfil(dominante, secundario)] ?? VIRTUD_RETO[dominante];
  if (VIRTUD_RETO[dominante] !== principal) return { principal, secundaria: VIRTUD_RETO[dominante] };
  if (secundario && VIRTUD_RETO[secundario] !== principal) return { principal, secundaria: VIRTUD_RETO[secundario] };
  return { principal, secundaria: null };
}

/** Puente con las virtudes de ciclo de la app (`cycles.virtue`, WorkVirtue). */
export const CLAVE_A_VIRTUD_CICLO: Record<VirtudClave, string> = {
  prudencia: 'prudencia',
  fortaleza_audacia: 'audacia',
  fortaleza_resistencia: 'resistencia',
  dominio_de_si: 'dominio',
  justicia: 'justicia',
  magnanimidad: 'magnanimidad',
  humildad_fundamental: 'humildad',
  humildad_fraternal: 'humildad',
};

/** Nombre legible para mostrar o para el prompt. */
export const NOMBRE_VIRTUD: Record<VirtudClave, string> = {
  prudencia: 'prudencia',
  fortaleza_audacia: 'audacia',
  fortaleza_resistencia: 'resistencia',
  dominio_de_si: 'dominio de sí',
  justicia: 'justicia',
  magnanimidad: 'magnanimidad',
  humildad_fundamental: 'humildad fundamental',
  humildad_fraternal: 'humildad fraternal',
};
