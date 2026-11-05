// Piezas compartidas por las actividades de Formación (src/formacion/Actividad.jsx de la web):
// Shell (título + barra), BotonOpcion, Caratula, Conclusion, Lightbox y estilos de texto.
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BEIGE, GOLD_REF, GOLD_REF_DK, LINE, MUTED, NAVY, PAPER, barraFondo, em, eyebrow, fuente, tarjeta } from '../tema';

export { tarjeta };

/** `window.scrollTo({ top: 0 })` de la web: lo da la pantalla que contiene el ScrollView. */
export const SubirContext = createContext<() => void>(() => {});
export const useSubir = () => useContext(SubirContext);

/** Texto Roboto (FONT_BODY) con tamaño, color y peso. */
export const tb = (size: number, color: string = NAVY, peso: 400 | 500 | 600 | 700 = 400, extra?: TextStyle): TextStyle => ({
  ...fuente.body(peso),
  fontSize: size,
  color,
  ...extra,
});
/** Texto Roboto Slab (FONT_SLAB) en negrita. */
export const ts = (size: number, color: string = NAVY, extra?: TextStyle): TextStyle => ({ ...fuente.slab(700), fontSize: size, color, ...extra });
/** line-height relativo de CSS a puntos. */
export const lh = (size: number, f: number) => Math.round(size * f);
export const cursiva = (size: number, color: string = NAVY, extra?: TextStyle): TextStyle => ({ ...fuente.body(400, true), fontSize: size, color, ...extra });
/** Etiqueta en mayúsculas pequeñas (uppercase + letterSpacing). */
export const versalita = (size: number, color: string = MUTED, peso: 400 | 600 | 700 = 400, ls = 0.06): TextStyle => ({
  ...fuente.body(peso),
  fontSize: size,
  color,
  textTransform: 'uppercase',
  letterSpacing: em(ls, size),
});

export const TEMP_NOMBRE: Record<string, string> = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };
export const TEMP_SUBTITULO: Record<string, string> = { COL: 'la acción', MEL: 'las ideas', SAN: 'las personas', FLE: 'la paz' };

export const VERDE = { bg: '#ecfdf5', borde: '#10b981', texto: '#065f46' };
export const ROJO = { bg: '#fef2f2', borde: '#ef4444', texto: '#991b1b' };
export const AMBAR = { bg: '#fef7ed', borde: '#f59e0b', texto: '#92400e' };

export function shuffleIndices(n: number) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const IconoLupa = ({ color = GOLD_REF_DK }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="10.5" cy="10.5" r="7" />
    <Path d="m21 21-5.2-5.2" />
  </Svg>
);

/** Enlace subrayado dorado con lupa («Ver diagrama», «Ver ejemplo»…). */
export function EnlaceLupa({ children, onPress, style, lupa = true }: { children: ReactNode; onPress: () => void; style?: StyleProp<ViewStyle>; lupa?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 }, style]}>
      {lupa ? <IconoLupa /> : null}
      <Text style={tb(13, GOLD_REF_DK, 600, { textDecorationLine: 'underline' })}>{children}</Text>
    </Pressable>
  );
}

/** Botón dorado (primario) de las actividades. Deshabilitado → fondo LINE. */
export function BotonDorado({
  children,
  onPress,
  disabled,
  size = 19,
  padV = 17,
  padH = 38,
  style,
  textStyle,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
  padV?: number;
  padH?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { backgroundColor: disabled ? LINE : GOLD_REF, paddingVertical: padV, paddingHorizontal: padH, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 },
        style,
      ]}>
      <Text style={[tb(size, '#fff', 600, { textAlign: 'center' }), textStyle]}>{children}</Text>
    </Pressable>
  );
}

/** Botón secundario con borde (Reintentar / ← Anterior). */
export function BotonBorde({
  children,
  onPress,
  size = 15,
  color = MUTED,
  fondo = 'transparent',
  padV = 14,
  padH = 24,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  size?: number;
  color?: string;
  fondo?: string;
  padV?: number;
  padH?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ backgroundColor: fondo, borderWidth: 1.5, borderColor: LINE, paddingVertical: padV, paddingHorizontal: padH, alignItems: 'center', opacity: pressed ? 0.7 : 1 }, style]}>
      <Text style={tb(size, color, 600)}>{children}</Text>
    </Pressable>
  );
}

/** Enlace de texto sin borde («← Anterior», «← Atrás»). */
export function EnlaceTexto({ children, onPress, color = NAVY, size = 14, style }: { children: ReactNode; onPress: () => void; color?: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [{ alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 }, style]}>
      <Text style={tb(size, color, 600)}>{children}</Text>
    </Pressable>
  );
}

/** Círculo con un símbolo dentro (carátulas, conclusiones). */
export function Medalla({ children, tam = 64, fondo = BEIGE, borde = GOLD_REF, color = GOLD_REF_DK, size = 28 }: { children: ReactNode; tam?: number; fondo?: string; borde?: string; color?: string; size?: number }) {
  return (
    <View style={{ width: tam, height: tam, borderRadius: tam / 2, backgroundColor: fondo, borderWidth: 2, borderColor: borde, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
      <Text style={ts(size, color)}>{children}</Text>
    </View>
  );
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[tarjeta, style]}>{children}</View>;
}

export function Shell({ titulo, actual, total, children }: { titulo: ReactNode; actual: number; total: number; children: ReactNode }) {
  const pct = total > 0 ? Math.round((actual / total) * 100) : 0;
  return (
    <View>
      <Text style={{ ...eyebrow, fontSize: 13, letterSpacing: em(0.16, 13) }}>{titulo}</Text>
      <View style={{ ...barraFondo, marginTop: 12, marginBottom: 8, height: 7 }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: GOLD_REF_DK }} />
      </View>
      <Text style={[tb(17, MUTED), { marginBottom: 28 }]}>
        {actual} de {total}
      </Text>
      {children}
    </View>
  );
}

export function BotonOpcion({ texto, seleccionada, correcta, revelada, onPress }: { texto: string; seleccionada: boolean; correcta: boolean; revelada: boolean; onPress: () => void }) {
  let bg = PAPER;
  let borde = LINE;
  let color = NAVY;
  if (revelada && correcta) {
    bg = VERDE.bg;
    borde = VERDE.borde;
    color = VERDE.texto;
  } else if (revelada && seleccionada && !correcta) {
    bg = ROJO.bg;
    borde = ROJO.borde;
    color = ROJO.texto;
  } else if (seleccionada) {
    bg = 'rgba(165,139,38,0.10)';
    borde = GOLD_REF;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={revelada}
      style={({ pressed }) => ({ backgroundColor: bg, borderWidth: 1.5, borderColor: borde, paddingVertical: 20, paddingHorizontal: 26, opacity: pressed ? 0.8 : 1 })}>
      <Text style={tb(20, color, 400, { lineHeight: lh(20, 1.55) })}>{texto}</Text>
    </Pressable>
  );
}

export const CARATULA_TEXTOS: Record<string, { icono: string; tipo: string; desc: string }> = {
  quiz: { icono: '?', tipo: 'Cuestionario', desc: 'Responde a unas preguntas para poner a prueba lo que has aprendido en este módulo y afianzar los conceptos clave.' },
  define: { icono: '✦', tipo: 'Definiciones y conceptos', desc: 'Selecciona todas las palabras que definen cada concepto. Para conseguir la máxima puntuación, debes escoger todas las palabras correctas.' },
  desliza: { icono: '↔', tipo: 'Identifica temperamentos', desc: 'Lee cada escena y asocia el temperamento que mejor encaja.' },
  identifica: { icono: '◉', tipo: 'Diagrama de virtudes', desc: 'Reflexiona sobre las virtudes y cómo se manifiestan en tu vida.' },
  test_profundo: { icono: '◇', tipo: 'Autoexamen profundo', desc: 'Reflexiona con sinceridad sobre estas preguntas. No hay respuestas correctas ni incorrectas: este ejercicio es para tu crecimiento personal.' },
  retos_temperamento: { icono: '✶', tipo: 'Los retos de mi temperamento', desc: 'Descubre qué aspectos de las virtudes te facilita y te dificulta tu temperamento, y cuál es tu virtud-desafío: la virtud que más necesitas trabajar a lo largo de tu vida.' },
  test_caracter: { icono: '◈', tipo: 'Test de carácter', desc: 'Evalúa tu nivel actual en las seis virtudes del liderazgo: prudencia, fortaleza, dominio de sí, justicia, magnanimidad y humildad.' },
  test_corazon: { icono: '♡', tipo: 'Test del corazón', desc: 'Evalúa la libertad de tu corazón. 32 preguntas sobre las ocho enfermedades espirituales que pueden afectar a la razón, la voluntad y el corazón.' },
};

export function Caratula({ paso, tipo, onEmpezar, modulo }: { paso: any; tipo: string; onEmpezar: () => void; modulo?: number | null }) {
  const txt = CARATULA_TEXTOS[tipo] ?? { icono: '●', tipo: 'Ejercicio', desc: '' };
  return (
    <Tarjeta>
      <View style={{ paddingTop: 20, paddingBottom: 10 }}>
        <Medalla>{txt.icono}</Medalla>
      </View>
      {modulo != null && <Text style={[eyebrow, { textAlign: 'center', marginTop: 16 }]}>Módulo {modulo}</Text>}
      <Text style={ts(28, NAVY, { marginTop: 12, marginBottom: 14, textAlign: 'center', lineHeight: lh(28, 1.3) })}>{txt.tipo}</Text>
      <Text style={tb(17, MUTED, 400, { lineHeight: lh(17, 1.7), textAlign: 'center', marginBottom: 8 })}>{paso.descripcion ?? txt.desc}</Text>
      <View style={{ alignItems: 'center', marginTop: 28, marginBottom: 8 }}>
        <BotonDorado onPress={onEmpezar} padV={18} padH={48}>
          Empezar →
        </BotonDorado>
      </View>
    </Tarjeta>
  );
}

export function Conclusion({
  titulo,
  aciertos,
  total,
  onReintentar,
  onContinuar,
  nota,
  requiereAprobado,
}: {
  titulo: string;
  aciertos: number;
  total: number;
  onReintentar: () => void;
  onContinuar: () => void;
  nota?: string;
  requiereAprobado?: boolean;
}) {
  const pct = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  const perfecto = pct === 100;
  const bueno = pct >= 70;
  const aprobado = pct >= 70;
  const bloqueado = requiereAprobado && !aprobado;
  const tono = perfecto ? VERDE : bueno ? AMBAR : ROJO;

  return (
    <Tarjeta>
      <View style={{ paddingTop: 12, paddingBottom: 8 }}>
        <Medalla tam={72} fondo={tono.bg} borde={tono.borde} color={tono.texto}>
          {pct}%
        </Medalla>
      </View>
      <Text style={ts(26, NAVY, { marginTop: 14, marginBottom: 8, textAlign: 'center', lineHeight: lh(26, 1.3) })}>
        {perfecto ? 'Perfecto' : bueno ? 'Buen trabajo' : 'Sigue practicando'}
      </Text>
      <Text style={tb(17, MUTED, 400, { lineHeight: lh(17, 1.6), textAlign: 'center', marginBottom: 6 })}>
        Has acertado{' '}
        <Text style={tb(17, NAVY, 700)}>
          {aciertos} de {total}
        </Text>{' '}
        en {titulo}.
      </Text>
      {bloqueado && (
        <Text style={tb(15, ROJO.texto, 400, { textAlign: 'center', marginTop: 8, lineHeight: lh(15, 1.5) })}>
          Necesitas al menos un 70% de aciertos para continuar. Inténtalo de nuevo.
        </Text>
      )}
      {!perfecto && !bloqueado && (
        <Text style={tb(15, MUTED, 400, { textAlign: 'center', marginTop: 8, lineHeight: lh(15, 1.5) })}>Puedes volver a intentarlo para mejorar tu puntuación.</Text>
      )}
      {nota ? <Text style={cursiva(13, MUTED, { textAlign: 'center', marginTop: 8 })}>{nota}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 28, marginBottom: 8, flexWrap: 'wrap' }}>
        {!perfecto &&
          (bloqueado ? (
            <BotonDorado onPress={onReintentar} size={17} padV={18} padH={40}>
              Reintentar
            </BotonDorado>
          ) : (
            <BotonBorde onPress={onReintentar} size={17} color={NAVY} fondo={BEIGE} padV={16} padH={32}>
              Reintentar
            </BotonBorde>
          ))}
        {!bloqueado && (
          <BotonDorado onPress={onContinuar} padV={18} padH={40}>
            Continuar →
          </BotonDorado>
        )}
      </View>
    </Tarjeta>
  );
}

/** Imagen a pantalla completa; al tocarla se amplía (zoom) y se puede desplazar. */
export function Lightbox({ src, onClose, alt, ratio = 16 / 9 }: { src: number; onClose: () => void; alt?: string; ratio?: number }) {
  const [zoomed, setZoomed] = useState(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ancho = zoomed ? Math.max(1400, width * 0.95) : width * 0.95;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        onPress={() => (zoomed ? setZoomed(false) : onClose())}
        style={{ flex: 1, backgroundColor: zoomed ? 'rgba(15,29,56,0.92)' : 'rgba(15,29,56,0.55)', justifyContent: 'center', alignItems: 'center' }}>
        {zoomed ? (
          <ScrollView style={{ width, height }} contentContainerStyle={{ minHeight: height, justifyContent: 'center' }}>
            <ScrollView horizontal contentContainerStyle={{ alignItems: 'center' }}>
              <Pressable onPress={() => setZoomed(false)}>
                <Image source={src} accessibilityLabel={alt} style={{ width: ancho, aspectRatio: ratio }} contentFit="contain" />
              </Pressable>
            </ScrollView>
          </ScrollView>
        ) : (
          <View style={{ width: ancho }}>
            <Pressable onPress={() => setZoomed(true)}>
              <Image source={src} accessibilityLabel={alt} style={{ width: ancho, height: Math.min(height * 0.8, ancho / ratio) }} contentFit="contain" />
            </Pressable>
          </View>
        )}
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onClose}
          style={{ position: 'absolute', top: insets.top + 12, right: 16, backgroundColor: zoomed ? NAVY : 'transparent', paddingVertical: 8, paddingHorizontal: 16 }}>
          <Text style={versalita(14, PAPER, 600)}>Cerrar</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** <textarea> de la web. */
export function AreaTexto({
  value,
  onChangeText,
  placeholder,
  minHeight = 90,
  fondo = '#fff',
  size = 18,
  pad = [14, 16],
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  fondo?: string;
  size?: number;
  pad?: [number, number];
  style?: StyleProp<TextStyle>;
}) {
  return (
    <TextInput
      multiline
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9a9a9a"
      textAlignVertical="top"
      style={[
        tb(size, NAVY),
        { backgroundColor: fondo, borderWidth: 1, borderColor: LINE, paddingVertical: pad[0], paddingHorizontal: pad[1], minHeight },
        style,
      ]}
    />
  );
}

/** Caja beige con borde izquierdo de color (definiciones, ejemplos, citas). */
export function CajaBorde({ children, color = GOLD_REF, ancho = 3, fondo = BEIGE, pad = [16, 20], style }: { children: ReactNode; color?: string; ancho?: number; fondo?: string; pad?: [number, number]; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: fondo, borderLeftWidth: ancho, borderLeftColor: color, paddingVertical: pad[0], paddingHorizontal: pad[1] }, style]}>{children}</View>;
}
