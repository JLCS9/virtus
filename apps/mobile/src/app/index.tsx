import { Redirect } from 'expo-router';

// La app es el portal de la web: /portal decide (sin sesión → /login, sin suscripción → /sin-acceso).
export default function Index() {
  return <Redirect href="/portal" />;
}
