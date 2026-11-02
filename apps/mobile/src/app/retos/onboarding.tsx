/**
 * Antes, el onboarding de los retos con la IA. Lo sustituye «Personaliza tu camino» del Camino de 14
 * días (como en la web): esta ruta solo redirige, por si algún enlace antiguo llega aquí.
 */
import { Redirect } from 'expo-router';

import { useVirtus } from '@/store/virtus';

export default function OnboardingRetos() {
  // Solo con suscripción activa: si no, se vuelve a Hoy sin llamar al servidor.
  const activa = useVirtus((s) => s.retosSuscripcion === 'activa');
  return activa ? <Redirect href="/camino/onboarding" /> : <Redirect href="/hoy" />;
}
