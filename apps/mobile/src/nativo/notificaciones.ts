// Notificaciones push del móvil, programadas según los horarios del usuario.
//
// La fuente es la misma tabla que usa la web, public.preferencias_notificaciones (la configuración
// primaria de avisos, «Tu día a día»: /app/horarios, la bienvenida y Perfil). Aquí solo se lee, nunca
// se guarda una copia: cada vez que pueden haber cambiado (al abrir la app, al volver a ella y al salir
// de esas pantallas del portal) se vuelven a programar.
//
//  · hora_reto       → cada día: el reto del día        (abre Hoy)
//  · hora_reflexion  → cada día: el examen de la noche   (abre Hoy)
//  · dia_formacion + hora_formacion → cada semana: la formación (abre Formación)
//  · avisos_push = false → ninguna
//
// Las horas son hora local del usuario en `zona_horaria`; si el móvil está en otra zona, se convierten.
// Son notificaciones locales (las programa el propio móvil), así que no hace falta servidor de envío.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { RUTA_PORTAL } from '@/portal/constantes';
import { normalizar, zonaDelDispositivo } from '@/web/lib/preferencias.js';
import { aHoraDelMovil, diaExpo } from './horas';

type Preferencias = {
  hora_reto: string;
  hora_reflexion: string;
  dia_formacion: number;
  hora_formacion: string;
  zona_horaria: string;
  avisos_push: boolean;
};

const CAMPOS = 'hora_reto, hora_reflexion, dia_formacion, hora_formacion, zona_horaria, avisos_email, avisos_push';
const CANAL = 'avisos';
const CLAVE_FIRMA = 'vl-avisos-programados';

// Textos de los avisos (mismo tono que «Tu día a día» en la web).
export const AVISOS = {
  reto: { title: 'Tu reto de hoy', body: 'Descubre tu reto de hoy y acepta tu compromiso.', ruta: RUTA_PORTAL },
  reflexion: { title: 'Tu reflexión del día', body: 'Unos minutos para repasar cómo ha ido el reto.', ruta: RUTA_PORTAL },
  formacion: { title: 'Tu formación de la semana', body: 'Entre 10 y 20 minutos para avanzar en tu formación.', ruta: `${RUTA_PORTAL}/formacion` },
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Programación ─────────────────────────────────────────────────────────────

async function leerPreferencias(): Promise<Preferencias | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('preferencias_notificaciones').select(CAMPOS).maybeSingle();
  if (error) throw error;
  return normalizar(data, zonaDelDispositivo()) as Preferencias;
}

async function permiso(): Promise<boolean> {
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  if (!actual.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

function contenido(aviso: (typeof AVISOS)[keyof typeof AVISOS]): Notifications.NotificationContentInput {
  return { title: aviso.title, body: aviso.body, data: { ruta: aviso.ruta }, sound: 'default' };
}

let enCurso: Promise<void> | null = null;

/** Lee los horarios del usuario y deja programados exactamente esos avisos. Nunca lanza. */
export function programarAvisos(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  enCurso ??= programar()
    .catch((e) => console.warn('[avisos] no se han podido programar', e))
    .finally(() => {
      enCurso = null;
    });
  return enCurso;
}

async function programar() {
  const p = await leerPreferencias();
  if (!p) return;

  const reto = aHoraDelMovil(p.hora_reto, p.zona_horaria);
  const reflexion = aHoraDelMovil(p.hora_reflexion, p.zona_horaria);
  const formacion = aHoraDelMovil(p.hora_formacion, p.zona_horaria, p.dia_formacion);

  // Si nada ha cambiado desde la última vez y los avisos siguen ahí, no se toca nada.
  const firma = JSON.stringify({ avisos: p.avisos_push, reto, reflexion, formacion });
  const programados = await Notifications.getAllScheduledNotificationsAsync();
  const esperados = p.avisos_push ? 3 : 0;
  if ((await AsyncStorage.getItem(CLAVE_FIRMA)) === firma && programados.length === esperados) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(CLAVE_FIRMA);
  if (!p.avisos_push) {
    await AsyncStorage.setItem(CLAVE_FIRMA, firma);
    return;
  }
  if (!(await permiso())) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Avisos del día',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const canal = Platform.OS === 'android' ? { channelId: CANAL } : {};

  await Notifications.scheduleNotificationAsync({
    identifier: 'vl-reto',
    content: contenido(AVISOS.reto),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: reto.hora, minute: reto.minuto, ...canal },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: 'vl-reflexion',
    content: contenido(AVISOS.reflexion),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: reflexion.hora, minute: reflexion.minuto, ...canal },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: 'vl-formacion',
    content: contenido(AVISOS.formacion),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: diaExpo(formacion.diaIso),
      hour: formacion.hora,
      minute: formacion.minuto,
      ...canal,
    },
  });
  await AsyncStorage.setItem(CLAVE_FIRMA, firma);
}

/** Al cerrar sesión: fuera los avisos de esa cuenta. */
export async function cancelarAvisos() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  await AsyncStorage.removeItem(CLAVE_FIRMA).catch(() => {});
}

/** Pantalla del portal que abre la notificación tocada (o null). */
function rutaDeAviso(respuesta: Notifications.NotificationResponse | null | undefined): string | null {
  const ruta = respuesta?.notification.request.content.data?.ruta;
  return typeof ruta === 'string' && ruta.startsWith(RUTA_PORTAL) ? ruta : null;
}

/**
 * Cuando se toca un aviso (con la app abierta o al arrancarla desde él), la pantalla del portal a la que
 * hay que ir. `n` cambia con cada toque, aunque la ruta sea la misma.
 */
export function useAvisoTocado(): { ruta: string; n: number } | null {
  const [ir, setIr] = useState<{ ruta: string; n: number } | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const atender = (respuesta: Notifications.NotificationResponse | null) => {
      const ruta = rutaDeAviso(respuesta);
      if (!ruta) return;
      Notifications.clearLastNotificationResponseAsync().catch(() => {}); // que no se repita al volver a entrar
      setIr((anterior) => ({ ruta, n: (anterior?.n ?? 0) + 1 }));
    };
    Notifications.getLastNotificationResponseAsync().then(atender).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(atender);
    return () => sub.remove();
  }, []);
  return ir;
}
