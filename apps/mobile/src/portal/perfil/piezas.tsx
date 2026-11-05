// Primitivas de «Mi cuenta» (web: src/app/Perfil.jsx · Fila, Lapiz, Seccion, Campo, CampoPwd, Modal, BtnGuardar).
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal as RNModal, Platform, Pressable, ScrollView, Text, TextInput, View, type KeyboardTypeOptions, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { IconoChevron } from '../Iconos';
import { BEIGE, GOLD_REF, LINE, MUTED, NAVY, PAPER, eyebrow, fuente, tarjeta } from '../tema';

export function Fila({ label, valor }: { label: string; valor: ReactNode }) {
  if (valor == null || valor === '') return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: LINE, gap: 12 }}>
      <Text style={{ ...fuente.body(400), fontSize: 13, color: MUTED, flexShrink: 1 }}>{label}</Text>
      <Text style={{ ...fuente.body(400), fontSize: 14, color: NAVY, textAlign: 'right', maxWidth: '60%' }}>{valor}</Text>
    </View>
  );
}

function Lapiz({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Editar"
      onPress={onPress}
      hitSlop={12}
      style={{ position: 'absolute', top: 18, right: 18, padding: 2 }}>
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 1 : 0.7 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={pressed ? GOLD_REF : LINE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <Path d="m15 5 4 4" />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}

export function Seccion({ titulo, children, onEdit }: { titulo: string; children: ReactNode; onEdit?: () => void }) {
  return (
    <View style={[tarjeta, { position: 'relative' }]}>
      <Text style={[eyebrow, onEdit ? { paddingRight: 24 } : null]}>{titulo}</Text>
      {onEdit ? <Lapiz onPress={onEdit} /> : null}
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

const campoBase = {
  ...fuente.body(400),
  fontSize: 14,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: LINE,
  borderRadius: 0,
  backgroundColor: '#fff',
  color: '#000',
} as const;

const Etiqueta = ({ children }: { children: ReactNode }) => (
  <Text style={{ ...fuente.body(600), fontSize: 12, color: MUTED }}>{children}</Text>
);

/** Desplegable (el <select> de la web): muestra el valor y abre la lista de opciones debajo. */
export function Selector({
  value,
  opciones,
  onChange,
  compacto,
}: {
  value: string;
  opciones: [string, string][];
  onChange: (v: string) => void;
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const actual = opciones.find(([k]) => k === value)?.[1] ?? '';
  const tam = compacto ? 12 : 14;
  const caja: ViewStyle = compacto
    ? { backgroundColor: BEIGE, borderWidth: 1, borderColor: LINE, paddingVertical: 4, paddingHorizontal: 8 }
    : { backgroundColor: '#fff', borderWidth: 1, borderColor: LINE, paddingVertical: 10, paddingHorizontal: 12 };
  return (
    <View style={compacto ? { alignSelf: 'flex-start' } : null}>
      <Pressable
        accessibilityRole="combobox"
        accessibilityState={{ expanded: abierto }}
        onPress={() => setAbierto((a) => !a)}
        style={[caja, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }]}>
        <Text style={{ ...fuente.body(400), fontSize: tam, color: compacto ? NAVY : '#000' }}>{actual}</Text>
        <IconoChevron color={MUTED} size={compacto ? 12 : 16} />
      </Pressable>
      {abierto ? (
        <View style={{ borderWidth: 1, borderTopWidth: 0, borderColor: LINE, backgroundColor: '#fff' }}>
          {opciones.map(([k, v]) => (
            <Pressable
              key={k}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: k === value }}
              onPress={() => {
                onChange(k);
                setAbierto(false);
              }}
              style={({ pressed }) => ({
                paddingVertical: compacto ? 6 : 10,
                paddingHorizontal: compacto ? 8 : 12,
                backgroundColor: pressed || k === value ? 'rgba(165,139,38,0.08)' : '#fff',
              })}>
              <Text style={{ ...fuente.body(k === value ? 600 : 400), fontSize: tam, color: NAVY }}>{v}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function Campo({
  label,
  value,
  onChange,
  opciones,
  placeholder,
  teclado,
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  opciones?: Record<string, string>;
  placeholder?: string;
  teclado?: KeyboardTypeOptions;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Etiqueta>{label}</Etiqueta>
      {opciones ? (
        <Selector value={String(value ?? '')} opciones={Object.entries(opciones)} onChange={onChange} />
      ) : (
        <TextInput
          style={campoBase}
          value={String(value ?? '')}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={MUTED}
          keyboardType={teclado}
          accessibilityLabel={label}
        />
      )}
    </View>
  );
}

export function CampoPwd({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Etiqueta>{label}</Etiqueta>
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          style={[campoBase, { paddingRight: 40 }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={MUTED}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar' : 'Mostrar'}
          onPress={onToggle}
          hitSlop={8}
          style={{ position: 'absolute', right: 8, padding: 4 }}>
          {visible ? (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <Circle cx="12" cy="12" r="3" />
            </Svg>
          ) : (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <Line x1="1" y1="1" x2="23" y2="23" />
            </Svg>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/** Casilla (el <input type="checkbox"> con su etiqueta). */
export function Casilla({ label, valor, onChange }: { label: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: valor }}
      onPress={() => onChange(!valor)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: 16,
          height: 16,
          borderWidth: 1,
          borderColor: valor ? NAVY : MUTED,
          backgroundColor: valor ? NAVY : '#fff',
          borderRadius: 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {valor ? (
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m5 12.5 4.5 4.5L19 7.5" />
          </Svg>
        ) : null}
      </View>
      <Text style={{ ...fuente.body(400), fontSize: 13, color: NAVY }}>{label}</Text>
    </Pressable>
  );
}

export function Modal({ titulo, children, onClose }: { titulo: string; children: ReactNode; onClose: () => void }) {
  return (
    <RNModal transparent visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable
          onPress={onClose}
          style={{ flex: 1, backgroundColor: 'rgba(15,29,56,0.22)', alignItems: 'center', justifyContent: 'center', padding: '4%' }}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: PAPER,
              borderTopWidth: 2,
              borderTopColor: GOLD_REF,
              width: '100%',
              maxWidth: 440,
              maxHeight: '85%',
              shadowColor: '#0F1D38',
              shadowOpacity: 0.22,
              shadowRadius: 32,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
            }}>
            <ScrollView contentContainerStyle={{ paddingVertical: 28, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <Text accessibilityRole="header" style={{ ...fuente.slab(700), fontSize: 18, color: NAVY, flexShrink: 1 }}>
                  {titulo}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} hitSlop={10} style={{ padding: 4 }}>
                  <Text style={{ ...fuente.body(400), fontSize: 20, lineHeight: 20, color: MUTED }}>×</Text>
                </Pressable>
              </View>
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

export function BtnGuardar({ onPress, guardando }: { onPress: () => void; guardando: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={guardando}
      style={({ pressed }) => ({
        backgroundColor: GOLD_REF,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        opacity: guardando ? 0.6 : pressed ? 0.85 : 1,
      })}>
      <Text style={{ ...fuente.body(600), fontSize: 14, color: '#fff' }}>{guardando ? 'Guardando…' : 'Guardar'}</Text>
    </Pressable>
  );
}

/** Botón de contorno de ancho completo («Vaciar caché y recargar», «Cerrar sesión»). */
export function BotonLinea({ children, onPress, style }: { children: ReactNode; onPress: () => void; style?: object }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        { borderWidth: 1.5, borderColor: LINE, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', opacity: pressed ? 0.7 : 1 },
        style,
      ]}>
      <Text style={{ ...fuente.body(600), fontSize: 14, color: NAVY }}>{children}</Text>
    </Pressable>
  );
}

/** Estado vacío centrado («Aún no tienes resultados», «Aún no tienes notas»). */
export function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Text style={{ ...fuente.slab(700), fontSize: 18, color: NAVY, marginBottom: 8, textAlign: 'center' }}>{titulo}</Text>
      <Text style={{ ...fuente.body(400), fontSize: 14, color: MUTED, lineHeight: 14 * 1.6, textAlign: 'center' }}>{texto}</Text>
    </View>
  );
}

export const fmtFecha = (d: string | number | Date, mes: 'long' | 'short' = 'long') =>
  new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: mes, year: 'numeric' });
