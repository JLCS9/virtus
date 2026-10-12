import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import i18n from '@/i18n';
import type { Plan } from '@/store/virtus';

const IDS = { morning: 'virtus-morning', evening: 'virtus-evening' } as const;

function hm(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

/** Programa el ritual con notificaciones locales: funciona sin conexión. */
export async function scheduleRitual(plan: Plan): Promise<boolean> {
  if (Platform.OS === 'web') return false;
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
