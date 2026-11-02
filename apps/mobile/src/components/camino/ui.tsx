/** Piezas comunes de las pantallas del Camino y de las fichas: todo se responde con toques. */
import { Children, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import type { Temp } from '@/lib/camino';
import { Button, Eyebrow, Screen } from '@/components/ui';
import { color, fontFamily, radius, space, type } from '@/theme';

/** Colores de la rueda (los de la web): colérico rojo, melancólico morado, sanguíneo naranja, flemático verde. */
export const TEMP_COLORS: Record<Temp, string> = { COL: '#9C3A3A', MEL: '#5A3F8B', SAN: '#D67A2C', FLE: '#3F7A56' };
export const NOMBRES: Record<Temp, string> = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };
export const VERDE = '#3F7A56';
export const ROJO = '#9C3A3A';
/** Fondo dorado suave para lo destacado. */
export const DORADO_SUAVE = 'rgba(165,139,38,0.12)';

export const fraseGrande: TextStyle = { fontFamily: fontFamily.slab500, fontSize: 23, lineHeight: 31, color: color.pizarra };
export const titular: TextStyle = { fontFamily: fontFamily.slab700, fontSize: 24, lineHeight: 31, color: color.azulProfundo };
export const parrafo: TextStyle = { ...type.body, color: color.pizarra };
export const nota: TextStyle = { ...type.caption, color: color.pizarra };

export function Pantalla({
  etiqueta,
  pregunta,
  children,
  pie,
  onVolver,
}: {
  etiqueta?: string;
  pregunta?: string;
  children?: ReactNode;
  pie?: ReactNode;
  onVolver?: () => void;
}) {
  return (
    <Screen footer={pie}>
      {etiqueta || onVolver ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.m }}>
          {etiqueta ? <Eyebrow style={{ flex: 1 }}>{etiqueta}</Eyebrow> : <View />}
          {onVolver ? (
            <Pressable accessibilityRole="button" onPress={onVolver} hitSlop={12}>
              <Text style={[type.caption, { color: color.plomo, fontSize: 14 }]}>Salir</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {pregunta ? <Text style={titular}>{pregunta}</Text> : null}
      {children}
    </Screen>
  );
}

/** Rejilla de opciones de `columnas` columnas. */
export function Opciones({ children, columnas = 1 }: { children: ReactNode; columnas?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
      {Children.toArray(children).map((hijo, i) => (
        <View key={i} style={{ width: `${100 / columnas}%`, padding: 5 }}>
          {hijo}
        </View>
      ))}
    </View>
  );
}

export function Opcion({
  activa = false,
  onPress,
  children,
  disabled = false,
  compacta = false,
  style,
}: {
  activa?: boolean;
  onPress?: () => void;
  children: ReactNode;
  disabled?: boolean;
  compacta?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activa, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: 48,
          justifyContent: 'center',
          borderRadius: radius.l,
          borderWidth: 1,
          borderColor: activa ? color.azulProfundo : color.bruma,
          backgroundColor: activa ? color.azulProfundo : color.blanco,
          paddingVertical: compacta ? 11 : 15,
          paddingHorizontal: compacta ? 10 : 16,
          opacity: disabled && !activa ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {typeof children === 'string' ? (
        <Text style={[type.body, { fontSize: compacta ? 14.5 : 16, color: activa ? color.blanco : color.pizarra, textAlign: compacta ? 'center' : 'left' }]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function Puntos({ total, actual }: { total: number; actual: number }) {
  return (
    <View accessibilityLabel={`Paso ${actual + 1} de ${total}`} style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i <= actual ? color.doradoVirtud : color.bruma }} />
      ))}
    </View>
  );
}

export function Continuar({ onPress, label = 'Continuar', disabled }: { onPress: () => void; label?: string; disabled?: boolean }) {
  return <Button label={`${label}  →`} onPress={onPress} disabled={disabled} />;
}

export function Atras({ onPress, label = '← Atrás' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10} style={{ alignSelf: 'flex-start', paddingVertical: space.xs }}>
      <Text style={[type.bodyStrong, { color: color.azulProfundo }]}>{label}</Text>
    </Pressable>
  );
}

/** Bloque con título pequeño y filete superior (cierres, fichas). */
export function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: color.bruma, paddingTop: space.m, gap: space.s }}>
      <Text style={[type.eyebrow, { color: color.plomo }]}>{titulo}</Text>
      {children}
    </View>
  );
}

export function Chip({ color: c, texto }: { color: string; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingLeft: 10, paddingRight: 12, borderRadius: radius.pill, backgroundColor: color.niebla }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c }} />
      <Text style={[type.caption, { color: color.pizarra, fontSize: 13.5 }]}>{texto}</Text>
    </View>
  );
}

export function Hecho({ titulo }: { titulo: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color.azulProfundo, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: color.blanco, fontSize: 22 }}>✓</Text>
      </View>
      <Text style={titular}>{titulo}</Text>
    </View>
  );
}

export const textoError = (texto: string) => <Text style={[type.body, { color: ROJO }]}>{texto}</Text>;
