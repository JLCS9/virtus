/**
 * Progreso de la formación compartido con la web (mismo Supabase, mismas tablas):
 * formacion_progreso (lecciones vistas) y formacion_estado (última lección abierta).
 * El dispositivo sigue siendo la fuente del día a día; aquí solo se une con la cuenta y se sube
 * cada cambio. Al unir gana la unión: nunca se pierde una lección vista.
 */
import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';

let activo = false;

async function usuario(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Une lo del servidor con lo local y sube lo que solo estaba en el dispositivo. */
export async function sincronizarFormacion(): Promise<void> {
  const userId = await usuario();
  if (!supabase || !userId) return;
  try {
    const [{ data: filas, error }, { data: estado }] = await Promise.all([
      supabase.from('formacion_progreso').select('leccion_id, visto_en'),
      supabase.from('formacion_estado').select('ultima').maybeSingle(),
    ]);
    if (error) return;
    const remotas: Record<string, string> = Object.fromEntries((filas ?? []).map((f) => [f.leccion_id as string, f.visto_en as string]));
    const s = useVirtus.getState();
    const unidas = { ...remotas, ...s.watched };
    useVirtus.setState({ watched: unidas, lastLesson: s.lastLesson ?? ((estado?.ultima as string | null) ?? null) });
    const soloLocales = Object.keys(s.watched).filter((id) => !remotas[id]);
    if (soloLocales.length) {
      await supabase.from('formacion_progreso').upsert(soloLocales.map((id) => ({ user_id: userId, leccion_id: id, visto_en: s.watched[id] })));
    }
  } catch {
    /* sin red: se reintenta la próxima vez */
  }
}

/** Una sola vez por arranque: sincroniza y, desde entonces, sube cada lección vista o abierta. */
export function activarSincronizacionFormacion(): void {
  if (activo || !supabase) return;
  activo = true;
  void sincronizarFormacion();
  let previo = useVirtus.getState();
  useVirtus.subscribe((actual) => {
    const nuevas = Object.keys(actual.watched).filter((id) => !previo.watched[id]);
    const ultimaCambio = actual.lastLesson !== previo.lastLesson ? actual.lastLesson : undefined;
    previo = actual;
    if (!nuevas.length && ultimaCambio === undefined) return;
    void usuario().then(async (userId) => {
      if (!userId || !supabase) return;
      try {
        if (nuevas.length) {
          await supabase.from('formacion_progreso').upsert(nuevas.map((id) => ({ user_id: userId, leccion_id: id, visto_en: actual.watched[id] })));
        }
        if (ultimaCambio) await supabase.from('formacion_estado').upsert({ user_id: userId, ultima: ultimaCambio, actualizado_en: new Date().toISOString() });
      } catch {
        /* sin red: queda en el dispositivo y se sube en la próxima sincronización */
      }
    });
  });
}
