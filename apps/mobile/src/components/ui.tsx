/**
 * Componentes base de Virtus. Codifican las reglas del brandbook:
 * un solo nivel de titular por bloque, dorado solo como acento, Plomo solo ≥ 18 px,
 * sobre azul texto blanco o crema y Dorado Claro.
 */
import { createContext, useContext, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { color, filete, radius, space, surface, type, type Surface, type SurfaceName } from '@/theme';

const SurfaceContext = createContext<Surface>(surface.claro);
export const useSurface = () => useContext(SurfaceContext);

export function Screen({
  children,
  variant = 'claro',
  scroll = true,
  footer,
  contentStyle,
}: {
  children: ReactNode;
  variant?: SurfaceName;
  scroll?: boolean;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const s = surface[variant];
  const body = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SurfaceContext.Provider value={s}>
      <SafeAreaView style={{ flex: 1, backgroundColor: s.fondo }} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
        ) : (
          body
        )}
        {footer ? <View style={[styles.footer, { borderTopColor: variant === 'claro' ? color.bruma : 'transparent' }]}>{footer}</View> : null}
      </SafeAreaView>
    </SurfaceContext.Provider>
  );
}

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; center?: boolean; numberOfLines?: number };

function makeText(base: TextStyle, pick: (s: Surface) => string) {
  return function T({ children, style, center, numberOfLines }: TextProps) {
    const s = useSurface();
    return (
      <Text numberOfLines={numberOfLines} style={[base, { color: pick(s) }, center && { textAlign: 'center' }, style]}>
        {children}
      </Text>
    );
  };
}

export const Display = makeText(type.display, (s) => s.titular);
export const H1 = makeText(type.h1, (s) => s.titular);
export const H2 = makeText(type.h2, (s) => s.titular);
export const H3 = makeText(type.h3, (s) => s.titular);
export const Body = makeText(type.body, (s) => s.texto);
export const BodyStrong = makeText(type.bodyStrong, (s) => s.titular);
export const Lectura = makeText(type.lectura, (s) => s.texto);
/** Texto secundario: en claro usa Pizarra si es pequeño (Plomo no llega a 4,5:1 por debajo de 18 px). */
export const Caption = makeText(type.caption, (s) => (s === surface.claro ? color.pizarra : s.textoSecundario));
export const Eyebrow = makeText(type.eyebrow, (s) => s.acento);

/** Cita de Alex o de un clásico, con comillas «». */
export function Cita({ children, author, style }: { children: string; author?: string; style?: StyleProp<ViewStyle> }) {
  const s = useSurface();
  return (
    <View style={[{ gap: space.s }, style]}>
      <Text style={[type.cita, { color: s.texto }]}>«{children}»</Text>
      {author ? <Text style={[type.caption, { color: s === surface.claro ? color.pizarra : s.textoSecundario }]}>— {author}</Text> : null}
    </View>
  );
}

/** Filete dorado de 3 px bajo el titular. */
export function Filete({ style }: { style?: StyleProp<ViewStyle> }) {
  const s = useSurface();
  return <View style={[{ height: filete.height, width: filete.width, backgroundColor: s.acento }, style]} />;
}

export function Titular({ eyebrow, children, display }: { eyebrow?: string; children: string; display?: boolean }) {
  const T = display ? Display : H1;
  return (
    <View style={{ gap: space.s, marginBottom: space.m }}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <T>{children}</T>
      <Filete style={{ marginTop: space.xs }} />
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const s = useSurface();
  const onDark = s !== surface.claro;
  const bg = variant === 'primary' ? s.acento : 'transparent';
  const fg = variant === 'primary' ? (onDark ? color.azulNoche : color.blanco) : onDark ? color.blanco : color.azulProfundo;
  const border = variant === 'secondary' ? (onDark ? color.crema : color.azulProfundo) : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        variant === 'ghost' && { paddingHorizontal: 0, alignSelf: 'center' },
      ]}>
      <Text style={[type.boton, { color: fg, textDecorationLine: variant === 'ghost' ? 'underline' : 'none' }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, accent }: { children: ReactNode; style?: StyleProp<ViewStyle>; accent?: boolean }) {
  const s = useSurface();
  const onDark = s !== surface.claro;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: onDark ? color.azulProfundo : color.blanco,
          borderColor: onDark ? color.plomo : color.bruma,
          borderTopColor: accent ? s.acento : onDark ? color.plomo : color.bruma,
          borderTopWidth: accent ? 3 : 1,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const s = useSurface();
  const onDark = s !== surface.claro;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? (onDark ? color.crema : color.azulProfundo) : 'transparent',
          borderColor: selected ? 'transparent' : onDark ? color.plomo : color.piedra,
        },
      ]}>
      <Text style={[type.body, { color: selected ? (onDark ? color.azulNoche : color.blanco) : onDark ? color.crema : color.pizarra }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Choice({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const s = useSurface();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          borderColor: selected ? s.titular : color.piedra,
          backgroundColor: selected ? color.niebla : color.blanco,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.radio, { borderColor: selected ? color.azulProfundo : color.piedra }]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={[type.body, { color: color.pizarra, flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const s = useSurface();
  const onDark = s !== surface.claro;
  return (
    <View style={{ gap: space.xs }}>
      <Text style={[type.bodyStrong, { color: s.titular }]}>{label}</Text>
      {hint ? <Text style={[type.caption, { color: onDark ? s.textoSecundario : color.pizarra }]}>{hint}</Text> : null}
      <TextInput
        placeholderTextColor={onDark ? color.piedra : color.plomo}
        {...props}
        style={[
          type.body,
          styles.input,
          {
            color: onDark ? color.crema : color.pizarra,
            borderColor: onDark ? color.plomo : color.piedra,
            backgroundColor: onDark ? color.azulProfundo : color.blanco,
            minHeight: props.multiline ? 96 : 48,
            textAlignVertical: props.multiline ? 'top' : 'center',
          },
          props.style,
        ]}
      />
    </View>
  );
}

export function Divider() {
  const s = useSurface();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: s === surface.claro ? color.piedra : color.plomo }} />;
}

export function Progress({ value }: { value: number }) {
  const s = useSurface();
  return (
    <View style={{ height: 3, backgroundColor: s === surface.claro ? color.bruma : color.azulProfundo }}>
      <View style={{ height: 3, width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, backgroundColor: s.acento }} />
    </View>
  );
}

/** Sello sobre disco: la firma de la marca sobre fondos azules. Logo intacto. */
export function Sello({ size = 96 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/brand/sello.png')}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Virtuous Leadership"
    />
  );
}

export function Isotipo({ height = 32 }: { height?: number }) {
  return (
    <Image
      source={require('@/assets/brand/isotipo.png')}
      style={{ width: (height * 317) / 269, height }}
      contentFit="contain"
      accessibilityLabel="Virtuous Leadership"
    />
  );
}

/**
 * Lockup de Virtus: isotipo + «Virtus» en Roboto Slab 700 con aire = altura de la V.
 * PENDIENTE DE APROBACIÓN por quien custodia la marca.
 */
export function Wordmark({ height = 28 }: { height?: number }) {
  const s = useSurface();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: height * 0.5 }} accessibilityLabel="Virtus">
      <Isotipo height={height} />
      <Text style={{ fontFamily: type.h1.fontFamily, fontSize: height * 0.95, lineHeight: height * 1.1, color: s.titular }}>Virtus</Text>
    </View>
  );
}

export function Stack({ children, gap = space.m, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

export function Row({ children, gap = space.s, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap, alignItems: 'center' }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: space.l, paddingTop: space.l, paddingBottom: space.xl, gap: space.m, width: '100%', maxWidth: 640, alignSelf: 'center' },
  footer: { paddingHorizontal: space.l, paddingVertical: space.m, gap: space.s, borderTopWidth: StyleSheet.hairlineWidth, width: '100%', maxWidth: 640, alignSelf: 'center' },
  button: { minHeight: 52, borderRadius: radius.s, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.l },
  card: { borderWidth: 1, borderRadius: radius.m, padding: space.m, gap: space.s },
  chip: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space.m, paddingVertical: space.s, minHeight: 40, justifyContent: 'center' },
  choice: { flexDirection: 'row', alignItems: 'center', gap: space.m, borderWidth: 1, borderRadius: radius.m, padding: space.m, minHeight: 56 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.azulProfundo },
  input: { borderWidth: 1, borderRadius: radius.s, paddingHorizontal: space.m, paddingVertical: space.s },
});
