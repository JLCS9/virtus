// Escrituras de Formación en Supabase, idénticas a las de la web:
//  - CirculoPersonas → crearPersona / anotarObservacion (src/account/personas.js)
//  - Test de carácter y del corazón → test_results (src/account/account.js)
import { supabase } from '@/lib/supabase';

import { resultadoParaGuardar } from '../web/lib/virtudes.js';

class PersonasError extends Error {}

function db() {
  if (!supabase) throw new PersonasError('sin_backend');
  return supabase;
}

const comprobar = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
  if (error) throw new PersonasError(error.message);
  return data;
};

function camposDeEstimacion(e: any) {
  if (!e) return {};
  return {
    estado: e.primario ? 'estimado' : 'sin_estimar',
    primario: e.primario,
    secundario: e.secundario,
    confianza: e.confianza,
    puntos: e.puntos,
  };
}

export async function crearPersona(userId: string, datos: { nombre: string; grupo: string }, estimacion: any) {
  const persona: any = comprobar(
    await db()
      .from('personas')
      .insert({ user_id: userId, ...datos, ...camposDeEstimacion(estimacion) })
      .select()
      .single(),
  );
  if (estimacion) {
    comprobar(
      await db().from('persona_estimaciones').insert({
        persona_id: persona.id,
        user_id: userId,
        respuestas: estimacion.respuestas,
        desempate: estimacion.desempate ?? null,
        puntos: estimacion.puntos,
        primario: estimacion.primario,
        secundario: estimacion.secundario,
        confianza: estimacion.confianza,
      }),
    );
  }
  return persona;
}

export async function anotarObservacion(
  userId: string,
  personaId: string,
  { situacion, palabra, temperamento, linea }: { situacion: string; palabra: string | null; temperamento: string | null; linea: string },
) {
  return comprobar(
    await db()
      .from('persona_observaciones')
      .insert({ persona_id: personaId, user_id: userId, situacion, palabra, temperamento, linea: linea || null })
      .select()
      .single(),
  );
}

export async function saveCharacterResultIfLoggedIn(puntuacion: any) {
  try {
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    const result = resultadoParaGuardar(puntuacion);
    if (!user || !result) return false;
    const { error } = await supabase.from('test_results').insert({
      user_id: user.id,
      test_id: 'vl-caracter',
      test_version: '1.0.0',
      kind: 'character',
      source: 'self',
      result,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function saveHeartResultIfLoggedIn(scoreResult: any) {
  try {
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user || !scoreResult?.disorders) return false;
    const result: Record<string, any> = {};
    for (const [code, d] of Object.entries<any>(scoreResult.disorders)) {
      result[code] = { score: d.score, pct: d.pct, stage: d.stage };
    }
    result.verdict = scoreResult.verdict;
    const { error } = await supabase.from('test_results').insert({
      user_id: user.id,
      test_id: 'vl-corazon',
      test_version: '1.0.0',
      kind: 'heart',
      source: 'self',
      result,
    });
    return !error;
  } catch {
    return false;
  }
}
