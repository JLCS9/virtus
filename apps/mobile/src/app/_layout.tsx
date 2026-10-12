import '@/i18n';

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular';
import { Roboto_400Regular_Italic } from '@expo-google-fonts/roboto/400Regular_Italic';
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium';
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold';
import { RobotoSlab_500Medium } from '@expo-google-fonts/roboto-slab/500Medium';
import { RobotoSlab_700Bold } from '@expo-google-fonts/roboto-slab/700Bold';

import { listenRitualTaps } from '@/features/notifications';
import { configurePurchases } from '@/features/subscription';
import { useHydrated } from '@/store/virtus';
import { color, motion } from '@/theme';

SplashScreen.preventAutoHideAsync();
configurePurchases();
SplashScreen.setOptions({ duration: motion.lenta, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_400Regular_Italic,
    Roboto_500Medium,
    Roboto_700Bold,
    RobotoSlab_500Medium,
    RobotoSlab_700Bold,
  });
  const hydrated = useHydrated();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => listenRitualTaps((url) => router.push(url as never)), []);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: color.blanco } }}>
        <Stack.Screen name="(entrada)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ritual" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
