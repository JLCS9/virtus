// Preferencias de trabajo diario y avisos del usuario (public.preferencias_notificaciones, RLS: solo
// las propias). Es la misma tabla que lee la app móvil: no guardes copias en otro sitio.
import { supabase } from './supabase';
import { ZONA_POR_DEFECTO, normalizar, sonValidas, zonaDelDispositivo } from '../lib/preferencias.js';

export class PreferenciasError extends Error {}

const CAMPOS = 'hora_reto, hora_reflexion, dia_formacion, hora_formacion, zona_horaria, avisos_email, avisos_push';

/** { preferencias, configurado }: `configurado` es false si aún no hay fila (se devuelven las de por defecto). */
export async function leerPreferencias() {
  const { data, error } = await supabase.from('preferencias_notificaciones').select(CAMPOS).maybeSingle();
  if (error) throw new PreferenciasError(error.message);
  return { preferencias: normalizar(data, zonaDelDispositivo()), configurado: Boolean(data) };
}

/** Guarda (crea o actualiza) las preferencias. Devuelve las guardadas, ya normalizadas. */
export async function guardarPreferencias(userId, preferencias) {
  if (!sonValidas(preferencias)) throw new PreferenciasError('preferencias no válidas');
  const { hora_reto, hora_reflexion, dia_formacion, hora_formacion, zona_horaria, avisos_email, avisos_push } = preferencias;
  const guardar = (zona) => supabase.from('preferencias_notificaciones')
    .upsert({ user_id: userId, hora_reto, hora_reflexion, dia_formacion, hora_formacion, zona_horaria: zona, avisos_email, avisos_push }, { onConflict: 'user_id' })
    .select(CAMPOS).single();
  let { data, error } = await guardar(zona_horaria);
  // 22023: la base de datos no conoce esa zona (la da el navegador; puede ser un alias raro). Antes
  // que dejar al usuario sin poder guardar, se guarda con la zona por defecto.
  if (error?.code === '22023' && zona_horaria !== ZONA_POR_DEFECTO) ({ data, error } = await guardar(ZONA_POR_DEFECTO));
  if (error) throw new PreferenciasError(error.message);
  return normalizar(data);
}
