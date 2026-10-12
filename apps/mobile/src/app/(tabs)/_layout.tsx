import { Redirect } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

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
  if (!onboarded) return <Redirect href="/bienvenida" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.azulProfundo,
        tabBarInactiveTintColor: color.plomo,
        tabBarStyle: { backgroundColor: color.blanco, borderTopColor: color.bruma },
        tabBarLabelStyle: { fontFamily: fontFamily.sans500, fontSize: 12 },
        sceneStyle: { backgroundColor: color.blanco },
      }}>
      <Tabs.Screen name="hoy" options={{ title: t('tabs.hoy'), tabBarIcon: icon({ ios: 'sun.horizon', android: 'wb_twilight', web: 'wb_twilight' }) }} />
      <Tabs.Screen name="camino" options={{ title: t('tabs.camino'), tabBarIcon: icon({ ios: 'map', android: 'map', web: 'map' }) }} />
      <Tabs.Screen
        name="biblioteca"
        options={{ title: t('tabs.biblioteca'), tabBarIcon: icon({ ios: 'books.vertical', android: 'menu_book', web: 'menu_book' }) }}
      />
      <Tabs.Screen name="circulo" options={{ title: t('tabs.circulo'), tabBarIcon: icon({ ios: 'person.2', android: 'group', web: 'group' }) }} />
      <Tabs.Screen name="yo" options={{ title: t('tabs.yo'), tabBarIcon: icon({ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }) }} />
    </Tabs>
  );
}
