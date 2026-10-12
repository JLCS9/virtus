import { Stack } from 'expo-router';

import { color } from '@/theme';

export default function EntradaLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: color.blanco } }} />;
}
