// Armazón del portal: cabecera (fecha, «Hola, nombre», Mi cuenta) y la burbuja de pestañas
// Hoy · Camino · Formación. Equivale a src/app/AppShell.jsx de la web.
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';

import { fetchFirstName } from './datos';
import { IconoCandado, IconoFormacion, IconoHoy } from './Iconos';
import { BEIGE, MUTED, NAVY, eyebrow, fechaLarga, fuente, sombraBurbuja } from './tema';

const logo = require('./web/assets/logo-1.png');

type Pestana = { ruta: string; etiqueta: string; Icono: typeof IconoHoy; bloqueada?: boolean };

// En la web, Camino está bloqueado («Próximamente»).
const PESTANAS: Pestana[] = [
  { ruta: '/portal', etiqueta: 'Hoy', Icono: IconoHoy },
  { ruta: '/portal/camino', etiqueta: 'Camino', Icono: IconoCandado, bloqueada: true },
  { ruta: '/portal/formacion', etiqueta: 'Formación', Icono: IconoFormacion },
];

const activaEn = (pathname: string, ruta: string) =>
  ruta === '/portal' ? pathname === '/portal' : pathname === ruta || pathname.startsWith(`${ruta}/`);

export function Shell({ user, children }: { user: User; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [nombre, setNombre] = useState('');
  const enPerfil = pathname.startsWith('/portal/perfil');

  useEffect(() => {
    let vivo = true;
    fetchFirstName(user)
      .then((n) => vivo && setNombre(n))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [user]);

  return (
    <View style={{ flex: 1, backgroundColor: BEIGE }}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable accessibilityLabel="Virtuous Leadership" onPress={() => router.navigate('/portal')}>
          <Image source={logo} style={{ width: 40, height: 40, borderRadius: 20 }} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={eyebrow} numberOfLines={1}>
            {fechaLarga()}
          </Text>
          <Text style={{ ...fuente.slab(700), fontSize: 21, lineHeight: 25, color: NAVY }} numberOfLines={1}>
            {nombre ? `Hola, ${nombre}` : 'Hola'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate('/portal/perfil')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: enPerfil ? 'rgba(165,139,38,0.12)' : 'transparent',
          }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ ...fuente.body(700), fontSize: 14, color: '#fff' }}>{nombre ? nombre[0].toUpperCase() : '?'}</Text>
          </View>
          <Text style={{ ...fuente.body(600), fontSize: 13, color: enPerfil ? NAVY : MUTED }}>Mi cuenta</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>{children}</View>

      <NavBurbuja pathname={pathname} bottom={Math.max(16, insets.bottom)} />
    </View>
  );
}

/** Espacio que dejan las pantallas debajo para que la burbuja no tape el final (paddingBottom 132 en la web). */
export const ESPACIO_BURBUJA = 132;

function NavBurbuja({ pathname, bottom }: { pathname: string; bottom: number }) {
  const [toast, setToast] = useState(false);
  const opacidad = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!toast) return undefined;
    Animated.timing(opacidad, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      opacidad.setValue(0);
      setToast(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [toast, opacidad]);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom, alignItems: 'center', gap: 10 }}>
      {toast ? (
        <Animated.View
          accessibilityLiveRegion="polite"
          style={[
            sombraBurbuja,
            { opacity: opacidad, backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999 },
          ]}>
          <Text style={{ ...fuente.body(600), fontSize: 13.5, color: NAVY }}>Próximamente</Text>
        </Animated.View>
      ) : null}
      <View style={[sombraBurbuja, { flexDirection: 'row', gap: 4, padding: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.94)' }]}>
        {PESTANAS.map(({ ruta, etiqueta, Icono, bloqueada }) => {
          const activa = !bloqueada && activaEn(pathname, ruta);
          const tinta = activa ? NAVY : MUTED;
          return (
            <Pressable
              key={ruta}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa, disabled: bloqueada }}
              accessibilityLabel={bloqueada ? `${etiqueta}, próximamente` : etiqueta}
              onPress={() => (bloqueada ? setToast(true) : router.navigate(ruta as never))}
              style={{
                minWidth: 84,
                alignItems: 'center',
                gap: 3,
                paddingTop: 9,
                paddingBottom: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                opacity: bloqueada ? 0.55 : 1,
                backgroundColor: activa ? 'rgba(165,139,38,0.14)' : 'transparent',
              }}>
              <Icono color={tinta} size={24} />
              <Text style={{ ...fuente.body(activa ? 700 : 500), fontSize: 11.5, letterSpacing: 0.23, color: tinta }}>{etiqueta}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
