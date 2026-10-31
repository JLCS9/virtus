/**
 * Memoria de personas y escenarios (03 §3.3) y escenario de respaldo para la mañana (03 §3.4).
 * Devuelve las operaciones a aplicar; quien persiste es el orquestador.
 */
import type { Reto, RolPersona } from './tipos.ts';

export interface PersonaMemoria {
  token: string;
  rol: RolPersona | null;
  menciones: number;
  ultima_mencion: string | null;
}

export interface EscenarioMemoria {
  id: number | null;
  disparador: string | null;
  personas: string[];
  frecuencia: number;
}

export interface CambiosMemoria {
  personasNuevas: { token: string; rol: RolPersona }[];
  personasMencionadas: string[];
  /** Escenario existente cuya frecuencia sube, o null. */
  escenarioIncrementado: number | null;
  /** Escenario nuevo a crear (la etiqueta cifrada la pone el orquestador). */
  escenarioNuevo: { disparador: string; personas: string[] } | null;
}

const ROLES: RolPersona[] = ['superior', 'colaborador', 'pareja', 'hijo', 'amigo', 'padre', 'otro'];
const mismoConjunto = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

export function cambiosMemoria(
  personas: PersonaMemoria[],
  escenarios: EscenarioMemoria[],
  examen: {
    personas_nuevas: { token: string; rol: string }[];
    personas_mencionadas: string[];
    manana: { disparador: string | null; personas: string[] } | null;
  },
): CambiosMemoria {
  const conocidas = new Set(personas.map((p) => p.token));
  const personasNuevas = examen.personas_nuevas
    .filter((p) => !conocidas.has(p.token))
    .map((p) => ({ token: p.token, rol: (ROLES.includes(p.rol as RolPersona) ? p.rol : 'otro') as RolPersona }));
  const nuevas = new Set(personasNuevas.map((p) => p.token));
  const personasMencionadas = [...new Set(examen.personas_mencionadas)].filter((t) => conocidas.has(t) || nuevas.has(t));

  let escenarioIncrementado: number | null = null;
  let escenarioNuevo: CambiosMemoria['escenarioNuevo'] = null;
  const m = examen.manana;
  if (m?.disparador && m.disparador !== 'sin_disparador') {
    const igual = escenarios.find((e) => e.disparador === m.disparador && mismoConjunto(e.personas, m.personas));
    if (igual?.id != null) escenarioIncrementado = igual.id;
    else escenarioNuevo = { disparador: m.disparador, personas: m.personas };
  }
  return { personasNuevas, personasMencionadas, escenarioIncrementado, escenarioNuevo };
}

/**
 * 03 §3.4: el escenario más frecuente cuyo disparador tenga retos activos; si no hay,
 * `sin_disparador` y sin personas.
 */
export function escenarioRespaldo(escenarios: EscenarioMemoria[], retos: Reto[]): EscenarioMemoria {
  const conRetos = new Set(retos.filter((r) => r.activo).map((r) => r.disparador));
  const elegible = escenarios
    .filter((e) => e.disparador && conRetos.has(e.disparador))
    .sort((a, b) => b.frecuencia - a.frecuencia || (a.id ?? 0) - (b.id ?? 0))[0];
  return elegible ?? { id: null, disparador: 'sin_disparador', personas: [], frecuencia: 0 };
}
