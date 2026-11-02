/**
 * La rueda de los cuatro temperamentos con tu posición (C, CM, MC, M…): se ilumina tu cuadrante y
 * aparece tu punto. Se usa en el día 1.
 */
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { RUEDA, type Temp } from '@/lib/camino';
import { color, fontFamily } from '@/theme';
import { NOMBRES, TEMP_COLORS } from './ui';

const T = 240;
const C = T / 2;
const R = 100;
const rad = (g: number) => (g * Math.PI) / 180;
const punto = (g: number, r: number): [number, number] => [C + r * Math.cos(rad(g)), C + r * Math.sin(rad(g))];

function sector(i: number) {
  const a0 = -90 + 90 * i;
  const [x0, y0] = punto(a0, R);
  const [x1, y1] = punto(a0 + 90, R);
  return `M${C},${C} L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z`;
}

/** Ángulo de tu posición: el centro del cuadrante del primario, desplazado hacia el secundario. */
function angulo(primario: Temp, secundario: Temp | null) {
  const i = RUEDA.indexOf(primario);
  const centro = -45 + 90 * i;
  const j = secundario ? RUEDA.indexOf(secundario) : -1;
  if (j === (i + 1) % 4) return centro + 28;
  if (j === (i + 3) % 4) return centro - 28;
  return centro;
}

export function Rueda({ primario, secundario }: { primario: Temp; secundario: Temp | null }) {
  const [aparece] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(aparece, { toValue: 1, duration: 900, delay: 300, useNativeDriver: true }).start();
  }, [aparece]);
  const [px, py] = punto(angulo(primario, secundario), R * 0.78);
  return (
    <View
      accessible
      accessibilityLabel={`Tu posición en la rueda: ${NOMBRES[primario]}${secundario ? ` y ${NOMBRES[secundario]}` : ''}`}
      style={{ width: '100%', maxWidth: 280, aspectRatio: 1, alignSelf: 'center' }}>
      <Svg viewBox={`0 0 ${T} ${T}`} width="100%" height="100%">
        {RUEDA.map((k, i) => {
          const activo = k === primario || k === secundario;
          const [lx, ly] = punto(-45 + 90 * i, R * 0.47);
          return (
            <G key={k}>
              <Path d={sector(i)} fill={TEMP_COLORS[k]} stroke={color.blanco} strokeWidth={2} opacity={activo ? (k === primario ? 1 : 0.7) : 0.18} />
              <SvgText x={lx} y={ly + 4} textAnchor="middle" fontFamily={fontFamily.sans700} fontSize={10.5} fontWeight="700" fill={activo ? color.blanco : TEMP_COLORS[k]}>
                {NOMBRES[k]}
              </SvgText>
            </G>
          );
        })}
        <Circle cx={C} cy={C} r={R * 0.22} fill={color.blanco} />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: `${((px - 11) / T) * 100}%`,
          top: `${((py - 11) / T) * 100}%`,
          width: `${(22 / T) * 100}%`,
          aspectRatio: 1,
          borderRadius: 999,
          backgroundColor: color.blanco,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: aparece,
          transform: [{ scale: aparece.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1.25, 1] }) }],
        }}>
        <View style={{ width: '55%', height: '55%', borderRadius: 999, backgroundColor: color.azulProfundo }} />
      </Animated.View>
    </View>
  );
}
