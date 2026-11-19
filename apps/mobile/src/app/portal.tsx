// Portal (igual que /es/app en la web): solo con sesión y suscripción activa.
// Sin sesión → /login. Sin suscripción → /sin-acceso. El servidor repite la comprobación en cada llamada.
//
// Dentro va el portal de la web tal cual (src/portal/PortalWeb.tsx). Este lado nativo pone la sesión,
// abre en el navegador lo que sale del portal, comparte y copia con el móvil, y programa las
// notificaciones según los horarios del usuario.
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, AppState, Linking, Share, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { olvidarAcceso, salir, useAcceso, useSession } from '@/nativo/cuenta';
import { cancelarAvisos, programarAvisos, useAvisoTocado } from '@/nativo/notificaciones';
import { BEIGE, NAVY } from '@/nativo/tema';
import { RUTA_PORTAL } from '@/portal/constantes';
import PortalWeb from '@/portal/PortalWeb';

// Pantallas del portal donde se cambian los horarios: al salir de ellas se reprograman los avisos.
const PANTALLAS_HORARIOS = [`${RUTA_PORTAL}/horarios`, `${RUTA_PORTAL}/bienvenida`, `${RUTA_PORTAL}/perfil`];

function Cargando() {
  return (
    <View style={{ flex: 1, backgroundColor: BEIGE, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={NAVY} />
    </View>
  );
}

export default function Portal() {
  const session = useSession();
  const acceso = useAcceso(Boolean(session));
  const insets = useSafeAreaInsets();

  // Avisos: al entrar y cada vez que se vuelve a la app (los horarios pueden haberse cambiado en la web).
  const dentro = Boolean(session && acceso);
  useEffect(() => {
    if (!dentro) return undefined;
    programarAvisos();
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') programarAvisos();
    });
    return () => sub.remove();
  }, [dentro]);

  // Notificación tocada → su pantalla del portal.
  const ir = useAvisoTocado();

  const rutaAnterior = useRef<string>(RUTA_PORTAL);
  const onRuta = useCallback(async (ruta: string) => {
    const antes = rutaAnterior.current.split('?')[0];
    rutaAnterior.current = ruta;
    if (PANTALLAS_HORARIOS.includes(antes) && antes !== ruta.split('?')[0]) programarAvisos();
  }, []);

  const onSesionCerrada = useCallback(async () => {
    olvidarAcceso();
    await cancelarAvisos();
    await salir().catch(() => {});
    router.replace('/login');
  }, []);

  const abrirWeb = useCallback(async (url: string) => {
    await WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
  }, []);
  const abrirExterno = useCallback(async (url: string) => {
    if (/^https?:/i.test(url) && !/wa\.me|whatsapp\.com/i.test(url)) await abrirWeb(url);
    else await Linking.openURL(url).catch(() => {});
  }, [abrirWeb]);
  const copiar = useCallback(async (texto: string) => {
    await Clipboard.setStringAsync(texto);
  }, []);
  const compartir = useCallback(async (texto: string) => {
    await Share.share({ message: texto }).catch(() => {});
  }, []);

  const access = session?.access_token;
  const refresh = session?.refresh_token;
  const sesion = useMemo(() => (access && refresh ? { access_token: access, refresh_token: refresh } : null), [access, refresh]);

  if (session === undefined) return <Cargando />;
  if (!session || !sesion) return <Redirect href="/login" />;
  if (acceso === undefined) return <Cargando />;
  if (!acceso) return <Redirect href="/sin-acceso" />;

  return (
    <View style={{ flex: 1, backgroundColor: BEIGE, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <PortalWeb
        sesion={sesion}
        ir={ir}
        abrirWeb={abrirWeb}
        abrirExterno={abrirExterno}
        copiar={copiar}
        compartir={compartir}
        onRuta={onRuta}
        onSesionCerrada={onSesionCerrada}
        dom={{
          style: { flex: 1, backgroundColor: BEIGE },
          containerStyle: { flex: 1 },
          bounces: false,
          overScrollMode: 'never',
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          allowsFullscreenVideo: true,
          keyboardDisplayRequiresUserAction: false,
        }}
      />
    </View>
  );
}
