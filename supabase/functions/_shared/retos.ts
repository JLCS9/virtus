/**
 * Contexto común de las funciones retos-*: usuario autenticado → pseudo_id → dependencias del
 * orquestador. También el control de acceso de la web y el mensaje de crisis.
 */
import type { Dependencias } from '../../../packages/method/src/retos/index.ts';

import { almacenPara } from './almacen.ts';
import { modeloAnthropicDirecto } from './anthropic-temporal.ts';
import { ModeloNoDisponible, modeloBedrock, RespuestaRechazada } from './bedrock.ts';
import { db, pseudoId } from './db.ts';
import { json, userContext } from './http.ts';
import { SeudonimizadorNoDisponible, seudonimizadorPara } from './seudonimizar.ts';
import { sinSuscripcion, suscripcionRetosActiva } from './suscripcion.ts';

/**
 * PROVISIONAL: debe sustituirlo el texto redactado y revisado por un profesional (brief 01).
 * Se puede sobrescribir sin desplegar con el secreto MENSAJES_CRISIS_JSON ({"ES": "...", "*": "..."}).
 */
const MENSAJES_CRISIS: Record<string, string> = {
  ES:
    'Lo que cuentas es importante y no tienes por qué llevarlo solo. Esta noche dejamos el examen. ' +
    'Si piensas en hacerte daño, llama ahora al 024 (atención a la conducta suicida, gratuita y 24 horas) ' +
    'o al 112 si hay peligro inmediato. Habla también con alguien de confianza.',
  '*':
    'Lo que cuentas es importante y no tienes por qué llevarlo solo. Esta noche dejamos el examen. ' +
    'Si piensas en hacerte daño o hay peligro inmediato, llama al número de emergencias de tu país ' +
    'y habla con alguien de confianza.',
};

function mensajeCrisis(pais: string | null): string {
  let mensajes = MENSAJES_CRISIS;
  try {
    const extra = Deno.env.get('MENSAJES_CRISIS_JSON');
    if (extra) mensajes = { ...mensajes, ...JSON.parse(extra) };
  } catch {
    /* se usan los provisionales */
  }
  return mensajes[(pais ?? '').toUpperCase()] ?? mensajes['*'];
}

/** Fecha local del usuario (la envía el cliente); se acepta ±1 día respecto a UTC. */
export function fechaValida(f: unknown): string | null {
  if (typeof f !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return null;
  const diff = Math.abs(Date.parse(`${f}T12:00:00Z`) - Date.now());
  return diff <= 36 * 3_600_000 ? f : null;
}

export interface ContextoRetos {
  userId: string;
  /** Cuenta de pruebas (modo temporal de Anthropic): solo a estas se les enseña el detalle de un error. */
  probador: boolean;
  deps: Dependencias;
}

/**
 * Respuesta de error de las funciones retos-*. Si el modelo o el seudonimizador no están disponibles
 * es un 503 con un código que la web y la app muestran como «servicio no disponible» (no un 500 que
 * parece culpa de la persona). El detalle técnico solo se devuelve a las cuentas de prueba.
 */
export function respuestaError(e: unknown, probador: boolean): Response {
  const indisponible =
    e instanceof SeudonimizadorNoDisponible || e instanceof ModeloNoDisponible || e instanceof RespuestaRechazada;
  const detalle = probador
    ? { detalle: `${e instanceof Error ? e.constructor.name : 'Error'}: ${e instanceof Error ? e.message : String(e)}`.slice(0, 400) }
    : {};
  return json({ error: indisponible ? 'servicio_no_disponible' : 'internal', ...detalle }, indisponible ? 503 : 500);
}

/**
 * Autentica y prepara el contexto. Devuelve una Response si hay que cortar (401/403).
 * ACCESO: solo con suscripción activa a Retos, igual para la web y la app. Es lo primero que se
 * comprueba: sin ella no se crea nada (ni el pseudónimo) ni se llama a ningún modelo.
 */
export async function contextoRetos(req: Request): Promise<ContextoRetos | Response> {
  const ctx = await userContext(req);
  if (!ctx) return json({ error: 'unauthorized' }, 401);
  const userId = ctx.user.id;
  if (!(await suscripcionRetosActiva(userId))) return sinSuscripcion();
  const sql = db();

  // feature_access ya no da acceso: solo elige el proveedor del modelo. Lo escribe solo el servicio,
  // y la marca depende del usuario del JWT, no de lo que mande el cliente.
  const features = new Set(
    (await sql`select feature from public.feature_access where user_id = ${userId}`).map((f) => f.feature as string),
  );

  const [perfilCuenta] = await sql`select country from public.profiles where id = ${userId}`;
  const pseudo = await pseudoId(userId);
  return {
    userId,
    probador: features.has('retos_anthropic_directo'),
    deps: {
      // TEMPORAL: mientras AWS activa Bedrock, todas las cuentas con suscripción usan la API de Anthropic.
      // Al activarse Bedrock: secreto RETOS_MODELO=bedrock (sin redesplegar código).
      modelo: features.has('retos_anthropic_directo') || Deno.env.get('RETOS_MODELO') !== 'bedrock' ? modeloAnthropicDirecto : modeloBedrock,
      almacen: almacenPara(pseudo),
      seudo: await seudonimizadorPara(userId),
      mensajeCrisis: mensajeCrisis(perfilCuenta?.country ?? 'ES'),
      // Trazas sin texto de usuario ni identidad: solo el evento y datos estructurados.
      log: (evento, datos) => console.log(JSON.stringify({ fn: 'retos', evento, ...datos })),
    },
  };
}

/** Temperamento del test TBP (test_results), si existe: lo usa el onboarding. */
export async function temperamentoDelTest(userId: string) {
  const T: Record<string, 'colerico' | 'melancolico' | 'sanguineo' | 'flematico'> = {
    COL: 'colerico',
    MEL: 'melancolico',
    SAN: 'sanguineo',
    FLE: 'flematico',
  };
  const [r] = await db()`
    select result from public.test_results
    where user_id = ${userId} and kind = 'temperament' order by taken_at desc limit 1`;
  if (!r) return null;
  const res = r.result as Record<string, unknown>;
  // Web: profileKey 'SAN-COL'; app: type 'SAN-COL' (o dominant/secondary).
  const clave = String(res.profileKey ?? res.type ?? [res.dominant, res.secondary].filter(Boolean).join('-'));
  const [d, s] = clave.split('-');
  if (!T[d]) return null;
  return { dominante: T[d], secundario: s && T[s] ? T[s] : null };
}
