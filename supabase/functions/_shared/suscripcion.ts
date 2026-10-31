/**
 * Acceso a Retos: SOLO con suscripción activa (public.suscripciones_retos). Única fuente de verdad,
 * la misma para la web y para la app. Se comprueba al principio de cada función, antes de crear
 * nada (ni siquiera el pseudónimo) y antes de llamar a ningún modelo.
 *
 * Falla cerrado: si la comprobación da error, no hay acceso.
 */
import { db } from './db.ts';
import { json } from './http.ts';

export async function suscripcionRetosActiva(userId: string): Promise<boolean> {
  try {
    const [fila] = await db()`select public.retos_activo(${userId}) as activo`;
    return fila?.activo === true;
  } catch (e) {
    console.error('retos: no se pudo comprobar la suscripción:', (e as Error).message);
    return false;
  }
}

/** 403 con un código que los clientes reconocen para esconder los retos. */
export const sinSuscripcion = (): Response => json({ error: 'sin_suscripcion' }, 403);
