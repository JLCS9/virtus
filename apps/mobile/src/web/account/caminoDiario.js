// Camino diario: lo que el usuario cuenta de su vida (camino_variables) y lo que hace cada día
// (camino_dia). RLS: cada cuenta solo lee y escribe sus filas. El contenido (retos, citas) no viene de
// aquí: está en src/data/camino-biblioteca.json. SQL: supabase-migraciones/20261118_camino_diario.sql.
import { supabase } from './supabase';

export class CaminoDiarioError extends Error {}

const comprobar = ({ data, error }) => {
  if (error) throw new CaminoDiarioError(error.message);
  return data;
};

const VARIABLES = 'variable, valor, persona_id, origen';
const DIA = 'fecha, reto_id, cita_id, temperamento, opcion, texto, elegido_en, cumplido, reflexion, nutrir_variable, nutrir_respuesta, examen_en';

/** Todas las variables del usuario: [{ variable, valor, persona_id, origen }]. */
export async function leerVariables() {
  return comprobar(await supabase.from('camino_variables').select(VARIABLES));
}

/**
 * Guarda (crea o cambia) una variable. `valor` null = «saltar»: la pregunta cuenta como respondida y se
 * usa el texto por defecto. `personaId` si se eligió de «Tu entorno».
 */
export async function guardarVariable(userId, { variable, valor = null, personaId = null, origen = 'manual' }) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  return comprobar(await supabase.from('camino_variables')
    .upsert({ user_id: userId, variable, valor: texto || null, persona_id: personaId, origen }, { onConflict: 'user_id,variable' })
    .select(VARIABLES).single());
}

/** Los días con actividad, del más antiguo al más reciente. */
export async function leerDias() {
  return comprobar(await supabase.from('camino_dia').select(DIA).order('fecha'));
}

// Lo único que se puede escribir en un día: nada de user_id, fechas ni marcas internas.
const CAMPOS_DIA = new Set([
  'reto_id', 'cita_id', 'temperamento', 'opcion', 'texto', 'elegido_en', 'cumplido', 'reflexion',
  'nutrir_variable', 'nutrir_respuesta', 'examen_en',
]);

/**
 * Crea o actualiza el día `fecha` ('YYYY-MM-DD', local). Solo cambia los campos que se pasan: un día
 * a medias conserva lo que ya tenía.
 */
export async function guardarDia(userId, fecha, campos) {
  const limpio = {};
  for (const [k, v] of Object.entries(campos)) {
    if (CAMPOS_DIA.has(k)) limpio[k] = v;
  }
  return comprobar(await supabase.from('camino_dia')
    .upsert({ user_id: userId, fecha, ...limpio }, { onConflict: 'user_id,fecha' })
    .select(DIA).single());
}

// ───────────── Hábitos ─────────────

const HABITO = 'id, texto, virtud, reto_id, estado, alta_en, estado_desde';

/** Todos los hábitos del usuario, del más antiguo al más reciente. */
export async function leerHabitos() {
  return comprobar(await supabase.from('habitos').select(HABITO).order('creado_en'));
}

/** Las casillas marcadas desde `desde` ('YYYY-MM-DD'): [{ habito_id, fecha }]. */
export async function leerMarcas(desde) {
  return comprobar(await supabase.from('habito_marcas').select('habito_id, fecha').gte('fecha', desde));
}

/** Da de alta un hábito, que empieza «en prueba» hoy. `retoId` es null si lo escribió el usuario. */
export async function crearHabito(userId, { texto, virtud, retoId = null, hoy }) {
  return comprobar(await supabase.from('habitos')
    .insert({ user_id: userId, texto: texto.trim(), virtud, reto_id: retoId, estado: 'en_prueba', alta_en: hoy, estado_desde: hoy })
    .select(HABITO).single());
}

const CAMPOS_HABITO = new Set(['texto', 'estado', 'alta_en', 'estado_desde']);

/** Cambia el texto o el estado de un hábito (las decisiones salen de `decision()` en lib/habitos.js). */
export async function actualizarHabito(id, campos) {
  const limpio = {};
  for (const [k, v] of Object.entries(campos)) {
    if (CAMPOS_HABITO.has(k)) limpio[k] = v;
  }
  return comprobar(await supabase.from('habitos').update(limpio).eq('id', id).select(HABITO).single());
}

export async function marcarHabito(userId, habitoId, fecha) {
  return comprobar(await supabase.from('habito_marcas')
    .upsert({ habito_id: habitoId, user_id: userId, fecha }, { onConflict: 'habito_id,fecha', ignoreDuplicates: true }));
}

export async function desmarcarHabito(habitoId, fecha) {
  return comprobar(await supabase.from('habito_marcas').delete().eq('habito_id', habitoId).eq('fecha', fecha));
}
