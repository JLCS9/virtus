import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { SurfaceProvider } from '@/components/ui';
import { color, radius, space, surface } from '@/theme';

/** Bloque azul de marca (Azul Profundo → Azul Noche) con texto blanco/crema y acento Dorado Claro. */
export function Hero({ children, style, flat }: { children: ReactNode; style?: StyleProp<ViewStyle>; flat?: boolean }) {
  return (
    <SurfaceProvider value={surface.marca}>
      <LinearGradient
        colors={[color.azulProfundo, color.azulNoche]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[{ borderRadius: flat ? 0 : radius.l, padding: space.l, gap: space.m, overflow: 'hidden' }, style]}>
        <View style={{ position: 'absolute', top: 0, left: space.l, width: 56, height: 3, backgroundColor: color.doradoClaro }} />
        {children}
      </LinearGradient>
    </SurfaceProvider>
  );
}
