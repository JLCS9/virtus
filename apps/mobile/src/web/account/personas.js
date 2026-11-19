// Fichas de personas del Camino (personas, persona_estimaciones, persona_observaciones en el Supabase
// de Virtus). RLS: cada cuenta solo ve y toca sus fichas. Son datos de terceros: solo los ve la cuenta.
import { supabase } from './supabase';

export class PersonasError extends Error {}

const comprobar = ({ data, error }) => {
  if (error) throw new PersonasError(error.message);
  return data;
};
const ahora = () => new Date().toISOString();

export async function listarPersonas() {
  return comprobar(await supabase.from('personas').select('*').order('creado_en')) ?? [];
}

export async function leerPersona(id) {
  const [persona, observaciones] = await Promise.all([
    supabase.from('personas').select('*').eq('id', id).maybeSingle(),
    supabase.from('persona_observaciones').select('*').eq('persona_id', id).order('creado_en', { ascending: false }),
  ]);
  return { persona: comprobar(persona), observaciones: comprobar(observaciones) ?? [] };
}

/** Crea la ficha y, si hubo test, guarda la estimación. Devuelve la ficha. */
export async function crearPersona(userId, datos, estimacion) {
  const persona = comprobar(await supabase.from('personas').insert({
    user_id: userId, ...datos, ...camposDeEstimacion(estimacion),
  }).select().single());
  // La ficha ya lleva su temperamento; esto es solo el historial del test. Si falla, la ficha vale
  // igual: lanzar aquí haría que al reintentar se creara una segunda ficha.
  if (estimacion) {
    try {
      await guardarEstimacion(userId, persona.id, estimacion, { soloHistorial: true });
    } catch (error) {
      console.warn('[personas] ficha creada sin historial de test:', error.message);
    }
  }
  return persona;
}

function camposDeEstimacion(e) {
  if (!e) return {};
  return {
    estado: e.primario ? 'estimado' : 'sin_estimar',
    primario: e.primario, secundario: e.secundario, confianza: e.confianza, puntos: e.puntos,
  };
}

/** Guarda un test sobre la persona (historial) y actualiza su temperamento estimado. */
export async function guardarEstimacion(userId, personaId, e, { soloHistorial = false } = {}) {
  comprobar(await supabase.from('persona_estimaciones').insert({
    persona_id: personaId, user_id: userId, respuestas: e.respuestas, desempate: e.desempate ?? null,
    puntos: e.puntos, primario: e.primario, secundario: e.secundario, confianza: e.confianza,
  }));
  if (!soloHistorial) await actualizarPersona(personaId, camposDeEstimacion(e));
}

export async function actualizarPersona(id, campos) {
  return comprobar(await supabase.from('personas').update({ ...campos, actualizado_en: ahora() }).eq('id', id).select().single());
}

export async function borrarPersona(id) {
  comprobar(await supabase.from('personas').delete().eq('id', id));
}

export async function borrarTodasLasPersonas(userId) {
  comprobar(await supabase.from('personas').delete().eq('user_id', userId));
}

export async function anotarObservacion(userId, personaId, { situacion, palabra, temperamento, linea }) {
  return comprobar(await supabase.from('persona_observaciones').insert({
    persona_id: personaId, user_id: userId, situacion, palabra, temperamento, linea: linea || null,
  }).select().single());
}

export async function borrarObservacion(id) {
  comprobar(await supabase.from('persona_observaciones').delete().eq('id', id));
}

export async function observacionesDe(personaId) {
  return comprobar(await supabase.from('persona_observaciones').select('*').eq('persona_id', personaId)) ?? [];
}

/**
 * Invitación de una ficha: el enlace con el que esa persona hace el test y verifica su temperamento.
 * Una por ficha: si ya existe se reutiliza (el enlace que se compartió sigue valiendo). El token lo
 * genera la base de datos; solo lo ve quien creó la ficha (RLS) y el servidor al validarlo.
 */
const invitacionesEnCurso = new Map();

export function invitacionDe(userId, personaId) {
  // Dos llamadas a la vez para la misma ficha (p. ej. el doble montaje de React en desarrollo)
  // comparten la petición: si no, las dos intentarían crearla.
  if (!invitacionesEnCurso.has(personaId)) {
    invitacionesEnCurso.set(personaId, leerOCrearInvitacion(userId, personaId).finally(() => invitacionesEnCurso.delete(personaId)));
  }
  return invitacionesEnCurso.get(personaId);
}

async function leerOCrearInvitacion(userId, personaId) {
  const campos = 'token, caduca_en, aceptada_en';
  const leer = () => supabase.from('persona_invitaciones').select(campos).eq('persona_id', personaId).maybeSingle();
  const existente = comprobar(await leer());
  const muerta = existente && (existente.aceptada_en || new Date(existente.caduca_en) < new Date());
  if (existente && !muerta) return existente;
  // Caducada, o usada sin que la ficha quedara verificada: ese enlace ya no sirve. Se sustituye.
  if (muerta) comprobar(await supabase.from('persona_invitaciones').delete().eq('persona_id', personaId));
  const creada = await supabase.from('persona_invitaciones').insert({ persona_id: personaId, user_id: userId }).select(campos).single();
  if (!creada.error) return creada.data;
  // Otra pestaña la creó entre la lectura y el alta (persona_id es único): vale la que ya existe.
  const ganadora = comprobar(await leer());
  if (ganadora) return ganadora;
  throw new PersonasError(creada.error.message);
}

export async function anioNacimiento(userId) {
  const { data } = await supabase.from('profiles').select('birth_year').eq('id', userId).maybeSingle();
  return data?.birth_year ?? null;
}
