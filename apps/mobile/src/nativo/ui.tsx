// Piezas visuales del portal, equivalentes a los estilos de la web (src/app/estilos.js).
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { IconoFlecha } from './Iconos';
import {
  BEIGE,
  GOLD_REF,
  MUTED,
  NAVY,
  NAVY_SOFT,
  PAPER,
  eyebrow,
  fuente,
  heroColores,
  parrafo,
  sombraHero,
  tarjeta,
  titulo,
} from './tema';

export function Tarjeta({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[tarjeta, style]}>{children}</View>;
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[eyebrow, style]}>{children}</Text>;
}

export function Titulo({ children, tam = 28, style }: { children: ReactNode; tam?: number; style?: StyleProp<TextStyle> }) {
  return (
    <Text accessibilityRole="header" style={[titulo(tam), style]}>
      {children}
    </Text>
  );
}

export function Parrafo({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[parrafo, style]}>{children}</Text>;
}

export const Negrita = ({ children }: { children: ReactNode }) => <Text style={fuente.body(700)}>{children}</Text>;

type Variante = 'primario' | 'sobreClaro' | 'contorno';

/** botonPrimario (dorado), botonSobreClaro (azul) y botonContorno de la web. */
export function Boton({
  children,
  onPress,
  variante = 'primario',
  flecha,
  ancho,
  ocupado,
  disabled,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  variante?: Variante;
  flecha?: boolean;
  ancho?: boolean;
  ocupado?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fondo = variante === 'primario' ? GOLD_REF : variante === 'sobreClaro' ? NAVY : 'transparent';
  const texto = variante === 'contorno' ? NAVY : variante === 'sobreClaro' ? PAPER : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || ocupado}
      style={({ pressed }) => [
        {
          backgroundColor: pressed && variante === 'sobreClaro' ? NAVY_SOFT : fondo,
          borderWidth: variante === 'contorno' ? 2 : 0,
          borderColor: NAVY,
          paddingVertical: variante === 'contorno' ? 14 : 16,
          paddingHorizontal: 28,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          alignSelf: ancho ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : pressed && variante !== 'sobreClaro' ? 0.85 : 1,
        },
        style,
      ]}>
      {ocupado ? <ActivityIndicator color={texto} /> : null}
      <Text style={{ ...fuente.body(600), fontSize: 16, letterSpacing: 0.32, color: texto }}>{children}</Text>
      {flecha ? <IconoFlecha size={18} color={texto} /> : null}
    </Pressable>
  );
}

/** Enlace de texto («Ver mi resultado completo →»). */
export function Enlace({ children, onPress, color = NAVY }: { children: ReactNode; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      {({ pressed }) => <Text style={{ ...fuente.body(600), fontSize: 14, color, opacity: pressed ? 0.6 : 1 }}>{children}</Text>}
    </Pressable>
  );
}

/** La tarjeta azul con degradado y la raya dorada arriba (Hero de la web). */
export function Hero({ children }: { children: ReactNode }) {
  return (
    <View style={[sombraHero, { backgroundColor: NAVY }]}>
      <LinearGradient
        colors={heroColores}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 28, paddingHorizontal: 24, paddingBottom: 26, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: 24, width: 56, height: 3, backgroundColor: GOLD_REF }} />
        {children}
      </LinearGradient>
    </View>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: BEIGE, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ ...fuente.body(400), fontSize: 15, color: NAVY }}>{texto}</Text>
    </View>
  );
}

/** Aviso (error u ok): `Notice` de la web (src/account/ui.jsx). */
export function Aviso({ children, tono = 'error' }: { children: ReactNode; tono?: 'error' | 'ok' }) {
  const err = tono === 'error';
  return (
    <View
      accessibilityRole={err ? 'alert' : 'text'}
      style={{
        marginBottom: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 2,
        backgroundColor: err ? '#F8E5E5' : '#EEF3E8',
        borderWidth: 1,
        borderColor: err ? '#C97A7A' : '#9DB58A',
      }}>
      <Text style={{ ...fuente.body(400), fontSize: 14, lineHeight: 20, color: err ? '#7A1F1F' : '#2F4A22' }}>{children}</Text>
    </View>
  );
}

export const textoSuave = { color: MUTED } as const;
