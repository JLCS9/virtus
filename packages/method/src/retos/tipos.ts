/**
 * Tipos del motor de retos diarios (método Havard). Los nombres de campos son los de
 * 03_Esquema_datos_y_motor.md y los contratos JSON los de 02_Prompts_sistema.md.
 * Este módulo no importa nada de fuera de `retos/` y usa extensiones `.ts` explícitas:
 * lo comparten la app (Metro), los tests (Vitest) y las Edge Functions (Deno).
 */

export const TEMPERAMENTOS = ['colerico', 'melancolico', 'sanguineo', 'flematico'] as const;
export type Temperamento = (typeof TEMPERAMENTOS)[number];

/** Las 8 claves de nivel_virtud (03 §2.3). */
export const VIRTUDES_CLAVE = [
  'prudencia',
  'fortaleza_audacia',
  'fortaleza_resistencia',
  'dominio_de_si',
  'justicia',
  'magnanimidad',
  'humildad_fundamental',
  'humildad_fraternal',
] as const;
export type VirtudClave = (typeof VIRTUDES_CLAVE)[number];

export type Niveles = Record<VirtudClave, number>;

export type VirtudBiblioteca = 'prudencia' | 'fortaleza' | 'dominio de sí' | 'justicia' | 'magnanimidad' | 'humildad';
export type Subcomponente = 'deliberacion' | 'decision' | 'audacia' | 'resistencia' | 'fundamental' | 'fraternal';
export type Facultad = 'corazon' | 'razon' | 'voluntad';
export type Ambito = 'trabajo' | 'familia' | 'amistad' | 'vida interior' | 'cultura' | 'cuerpo' | 'sociedad';
export type TipoReto = 'accion' | 'omision' | 'contemplacion';
export type Resultado = 'si' | 'a_medias' | 'no' | 'sin_respuesta';
export type TipoFallo = 'reaccion' | 'decision';
export type NivelAtencion = 'ninguno' | 'atencion' | 'crisis';
export type RolPersona = 'superior' | 'colaborador' | 'pareja' | 'hijo' | 'amigo' | 'padre' | 'otro';

export const OBSTACULOS = [
  'conformismo',
  'perfeccionismo',
  'impaciencia',
  'falta de realismo',
  'autosatisfacción',
  'determinismo',
  'voluntarismo',
] as const;

/** Fila de metodo.reto. */
export interface Reto {
  id: string;
  texto: string;
  variante_corta: string | null;
  virtud: VirtudBiblioteca;
  subcomponente: Subcomponente | null;
  facultad: Facultad;
  ambito: Ambito;
  tipo: TipoReto;
  minutos_estimados: number | null;
  requiere_otra_persona: boolean;
  disparador: string | null;
  dif_colerico: number;
  dif_melancolico: number;
  dif_sanguineo: number;
  dif_flematico: number;
  obstaculo: string | null;
  repetible: boolean;
  pregunta_examen: string;
  fuente_libro?: string | null;
  fuente_seccion?: string | null;
  cita_literal?: string | null;
  /** Extensión: solo para este perfil dominante-secundario (retos gt-*), p. ej. 'MEL-COL'. */
  perfil_combinado: string | null;
  activo: boolean;
}

/** Fila de metodo.disparador. */
export interface Disparador {
  clave: string;
  descripcion: string;
  ambito: Ambito | null;
}

/** Lo estructurado de metodo.dia que necesita el motor (sin texto cifrado). */
export interface DiaRegistro {
  fecha: string; // YYYY-MM-DD
  reto_id: string | null;
  resultado: Resultado | null;
  tipo_fallo: TipoFallo | null;
  obstaculos: string[];
  reescrito_por_usuario: boolean | null;
}

export interface PerfilMotor {
  temperamento_dominante: Temperamento;
  temperamento_secundario: Temperamento | null;
}

/** Situación de mañana (disparador + tokens de personas), si la hay. */
export interface SituacionManana {
  disparador: string | null;
  personas: string[];
}

/** Contrato motor → orquestador (01): lo que viaja al modelo como candidato. */
export interface Candidato {
  reto_id: string;
  texto: string;
  virtud: VirtudClave;
  subcomponente: Subcomponente | null;
  tipo: TipoReto;
  disparador: string | null;
  intensidad: number;
  pregunta_examen: string;
}
