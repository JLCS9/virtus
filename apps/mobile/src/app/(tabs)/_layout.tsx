import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { activarSincronizacionFormacion } from '@/features/formacionSync';
import { refrescarSuscripcionRetos } from '@/features/retos';
import { useVirtus } from '@/store/virtus';
import { color, fontFamily } from '@/theme';

type IconName = Parameters<typeof SymbolView>[0]['name'];

const icon = (name: IconName) =>
  function TabIcon({ color: tint }: { color: ColorValue }) {
    return <SymbolView name={name} size={24} tintColor={tint} />;
  };

export default function TabsLayout() {
  const { t } = useTranslation();
  const onboarded = useVirtus((s) => s.onboardedAt);
  const retos = useVirtus((s) => s.retosSuscripcion === 'activa');
  useEffect(() => {
    if (!onboarded) return;
    void refrescarSuscripcionRetos();
    activarSincronizacionFormacion();
  }, [onboarded]);
  if (!onboarded) return <Redirect href="/bienvenida" />;

  // Con suscripción a Retos la app es la nueva: una burbuja flotante con Hoy · Camino · Formación.
  // Biblioteca, Círculo y Yo siguen existiendo (se llega desde dentro), pero fuera de la barra.
  const oculta = retos ? { href: null } : {};
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: retos ? color.doradoClaro : color.azulProfundo,
        tabBarInactiveTintColor: retos ? color.piedra : color.plomo,
        tabBarStyle: retos
          ? {
              position: 'absolute',
              left: 20,
              right: 20,
              bottom: 24,
              height: 64,
              borderRadius: 32,
              borderTopWidth: 0,
              backgroundColor: color.azulProfundo,
              paddingBottom: 6,
              paddingTop: 6,
              shadowColor: '#0F1D38',
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 12,
            }
          : { backgroundColor: color.blanco, borderTopColor: color.bruma },
        tabBarLabelStyle: { fontFamily: fontFamily.sans500, fontSize: 12 },
        sceneStyle: { backgroundColor: color.blanco, paddingBottom: retos ? 96 : 0 },
      }}>
      <Tabs.Screen name="hoy" options={{ title: t('tabs.hoy'), tabBarIcon: icon({ ios: 'sun.horizon', android: 'wb_twilight', web: 'wb_twilight' }) }} />
      <Tabs.Screen name="camino" options={{ title: t('tabs.camino'), tabBarIcon: icon({ ios: 'map', android: 'map', web: 'map' }) }} />
      <Tabs.Screen
        name="formacion"
        options={{ title: t('tabs.formacion'), tabBarIcon: icon({ ios: 'graduationcap', android: 'school', web: 'school' }), ...(retos ? {} : { href: null }) }}
      />
      <Tabs.Screen
        name="biblioteca"
        options={{ title: t('tabs.biblioteca'), tabBarIcon: icon({ ios: 'books.vertical', android: 'menu_book', web: 'menu_book' }), ...oculta }}
      />
      <Tabs.Screen name="circulo" options={{ title: t('tabs.circulo'), tabBarIcon: icon({ ios: 'person.2', android: 'group', web: 'group' }), ...oculta }} />
      <Tabs.Screen
        name="yo"
        options={{ title: t('tabs.yo'), tabBarIcon: icon({ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }), ...oculta }}
      />
    </Tabs>
  );
}
