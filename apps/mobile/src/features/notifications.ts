import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import i18n from '@/i18n';
import { type CaminoPerfil, type PorDia, avisosPendientes } from '@/lib/camino';
import { useVirtus, type Plan } from '@/store/virtus';

const IDS = { morning: 'virtus-morning', evening: 'virtus-evening' } as const;
let ultimoCamino = '';

function hm(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

/** Programa el ritual con notificaciones locales: funciona sin conexión. */
export async function scheduleRitual(plan: Plan): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  // Con suscripción a Retos avisa el Camino (programarCamino): se reprograma al volver a leerlo.
  if (useVirtus.getState().retosSuscripcion === 'activa') {
    ultimoCamino = '';
    return false;
  }
  await Notifications.cancelScheduledNotificationAsync(IDS.morning).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(IDS.evening).catch(() => {});
  if (!plan.notifications) return false;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: IDS.morning,
    content: { title: i18n.t('notif.mananaTitulo'), body: i18n.t('notif.mananaCuerpo'), data: { url: '/ritual/manana' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...hm(plan.morningTime) },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: IDS.evening,
    content: { title: i18n.t('notif.nocheTitulo'), body: i18n.t('notif.nocheCuerpo'), data: { url: '/ritual/noche' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...hm(plan.eveningTime) },
  });
  return true;
}

/**
 * Camino de 14 días: como mucho dos notificaciones al día, la de la sesión (a media mañana, si aún no
 * está hecha) y la del examen (a la hora elegida en «Personaliza tu camino», si aún no está hecho), con
 * el texto de cada día de la especificación. Sustituyen a las del ritual (el reto del día y la
 * conversación de la noche). Se reprograma cada vez que se lee el camino: lo ya hecho deja de avisarse.
 */
export async function programarCamino(perfil: CaminoPerfil, porDia: PorDia): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const activas = useVirtus.getState().plan.notifications;
  const avisos = activas ? avisosPendientes(perfil, porDia) : [];
  const firma = JSON.stringify(avisos.map((a) => [a.id, a.cuando.getTime()]));
  if (firma === ultimoCamino) return avisos.length > 0;

  const programadas = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of programadas) {
    if (n.identifier.startsWith('camino-')) await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
  }
  await Notifications.cancelScheduledNotificationAsync(IDS.morning).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(IDS.evening).catch(() => {});
  ultimoCamino = firma;
  if (!avisos.length) return false;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  for (const a of avisos) {
    await Notifications.scheduleNotificationAsync({
      identifier: a.id,
      content: {
        title: a.tipo === 'examen' ? 'Examen de la noche' : `Día ${a.dia} de tu camino`,
        body: a.texto,
        data: { url: a.tipo === 'examen' ? `/camino/examen/${a.dia}` : `/camino/sesion/${a.dia}` },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: a.cuando },
    });
  }
  return true;
}

/** Al tocar una notificación del ritual, abre su pantalla. Devuelve la función de limpieza. */
export function listenRitualTaps(open: (url: string) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string') open(url);
  });
  return () => sub.remove();
}
