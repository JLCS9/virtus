import { router } from 'expo-router';

/** Volver atrás; si se llegó por enlace directo (p. ej. desde una notificación), ir a Hoy. */
export function goBackOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/hoy');
}
