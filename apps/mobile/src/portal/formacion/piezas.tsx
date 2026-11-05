// Piezas de las pantallas de Formación: Anillo de progreso, Reproductor de Vimeo, Portada,
// botón «← volver» y la tarjeta azul «Continúa donde lo dejaste» (src/formacion/Formacion.jsx).
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { VimeoPlayer } from '@/components/VimeoPlayer';
import { IconoPlay } from '../Iconos';
import { GOLD_REF_DK, GOLD_REF_LT, NAVY, PAPER, eyebrow, fuente, heroColores, sombraHero } from '../tema';
import { tb } from './comun';

/** Anillo de porcentaje (SVG) con el número en el centro. */
export function Anillo({ valor, tam = 84, sw: swFijo, fs: fsFijo }: { valor: number; tam?: number; sw?: number; fs?: number }) {
  const r = (tam - 10) / 2;
  const c = 2 * Math.PI * r;
  const sw = swFijo ?? (tam < 60 ? 3.5 : 5);
  const fs = fsFijo ?? (tam < 60 ? 12 : 22);
  return (
    <View accessibilityRole="image" accessibilityLabel={`${valor} % completado`} style={{ width: tam, height: tam }}>
      <Svg width={tam} height={tam} viewBox={`0 0 ${tam} ${tam}`}>
        <Circle cx={tam / 2} cy={tam / 2} r={r} fill="none" stroke="rgba(27,42,74,0.10)" strokeWidth={sw} />
        <Circle
          cx={tam / 2}
          cy={tam / 2}
          r={r}
          fill="none"
          stroke={GOLD_REF_DK}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${(c * valor) / 100} ${c}`}
          transform={`rotate(-90 ${tam / 2} ${tam / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...fuente.slab(700), fontSize: fs, color: NAVY }}>{valor}%</Text>
      </View>
    </View>
  );
}

/** Vídeo de Vimeo 16:9 sobre fondo azul; avisa del avance (0–1). */
export function Reproductor({ leccion, onProgreso }: { leccion: { id: string; vimeoId: string | null; titulo?: string }; onProgreso: (f: number) => void }) {
  const [ancho, setAncho] = useState(0);
  const alto = (ancho * 9) / 16;
  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={[{ width: '100%', aspectRatio: 16 / 9, backgroundColor: NAVY, overflow: 'hidden' }, sombraHero]}
      accessibilityLabel={leccion.titulo}>
      {ancho > 0 && leccion.vimeoId ? <VimeoPlayer key={leccion.id} vimeoId={String(leccion.vimeoId)} width={ancho} height={alto} onProgress={onProgreso} /> : null}
    </View>
  );
}

/** Imagen de portada con degradado oscuro abajo. */
export function Portada({
  src,
  alto = 260,
  pos = 'center',
  brillo = false,
  escala,
}: {
  src: number;
  alto?: number;
  pos?: 'center' | 'bottom' | 'left bottom';
  brillo?: boolean | number;
  escala?: number;
}) {
  const contentPosition = pos === 'bottom' ? 'bottom' : pos === 'left bottom' ? { left: 0, bottom: 0 } : 'center';
  const origen = pos === 'bottom' ? 'center bottom' : pos === 'left bottom' ? 'left bottom' : 'center';
  const factor = brillo ? (typeof brillo === 'number' ? brillo : 1.25) : null;
  return (
    <View style={{ width: '100%', height: alto, overflow: 'hidden' }}>
      <View style={[{ width: '100%', height: '100%' }, factor ? { filter: [{ brightness: factor }] } : null, escala ? { transform: [{ scale: escala }], transformOrigin: origen } : null]}>
        <Image source={src} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition={contentPosition} />
      </View>
      <LinearGradient colors={['transparent', 'rgba(15,29,56,0.45)']} locations={[0.4, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    </View>
  );
}

/** «← Formación», «← Salir al curso»… */
export function Volver({ children, onPress, color = NAVY, style }: { children: ReactNode; onPress: () => void; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={({ pressed }) => [{ alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 }, style]}>
      <Text style={tb(14, color, 600)}>{children}</Text>
    </Pressable>
  );
}

/** Fondo azul degradado (heroFondo) con sombra. */
export function FondoHero({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[sombraHero, { backgroundColor: NAVY }, style]}>
      <LinearGradient colors={heroColores} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
        {children}
      </LinearGradient>
    </View>
  );
}

/** Tarjeta azul «Continúa donde lo dejaste / Empieza aquí» con botón de play. */
export function Continuar({ etiqueta, titulo, subtitulo, onPress, style }: { etiqueta: string; titulo: string; subtitulo: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <FondoHero style={style}>
      <Text style={[eyebrow, { color: GOLD_REF_LT, marginBottom: 8 }]}>{etiqueta}</Text>
      <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', gap: 14, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <IconoPlay size={22} color={PAPER} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...fuente.slab(600), fontSize: 19, lineHeight: 23, color: PAPER }}>{titulo}</Text>
          <Text style={tb(12, PAPER, 400, { opacity: 0.72, marginTop: 4 })}>{subtitulo}</Text>
        </View>
      </Pressable>
    </FondoHero>
  );
}
