/**
 * Rueda de los temperamentos, como el diagrama de «Crecer con tu temperamento»:
 * cuatro cuadrantes (C, M, S, F) y un anillo con las ocho combinaciones posibles.
 * Sin color por temperamento: se resalta la posición de la persona con azul y dorado.
 */
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import type { Temperament } from '@virtus/method';

import { color, fontFamily } from '@/theme';

const QUAD: Record<Temperament, { a0: number; a1: number; label: string }> = {
  // Ángulos en grados, 0 = derecha, sentido horario (y hacia abajo).
  MEL: { a0: 270, a1: 360, label: 'M' },
  FLE: { a0: 0, a1: 90, label: 'F' },
  SAN: { a0: 90, a1: 180, label: 'S' },
  COL: { a0: 180, a1: 270, label: 'C' },
};

/** Segmento del anillo exterior para cada combinación dominante-secundario. */
const RING: { code: string; a0: number; a1: number }[] = [
  { code: 'CM', a0: 225, a1: 270 },
  { code: 'MC', a0: 270, a1: 315 },
  { code: 'MF', a0: 315, a1: 360 },
  { code: 'FM', a0: 0, a1: 45 },
  { code: 'FS', a0: 45, a1: 90 },
  { code: 'SF', a0: 90, a1: 135 },
  { code: 'SC', a0: 135, a1: 180 },
  { code: 'CS', a0: 180, a1: 225 },
];

const LETTER: Record<Temperament, string> = { COL: 'C', MEL: 'M', SAN: 'S', FLE: 'F' };

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y} Z`;
}

export function TemperamentWheel({
  size = 240,
  dominant,
  secondary,
  onDark = false,
}: {
  size?: number;
  dominant?: Temperament | null;
  secondary?: Temperament | null;
  onDark?: boolean;
}) {
  const c = size / 2;
  const rOuter = size / 2 - 2;
  const rRing = rOuter * 0.78;
  const ink = onDark ? color.crema : color.azulProfundo;
  const faint = onDark ? color.plomo : color.piedra;
  const accent = onDark ? color.doradoClaro : color.doradoVirtud;
  const comboCode = dominant && secondary ? `${LETTER[dominant]}${LETTER[secondary]}` : null;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityRole="image">
      {(Object.keys(QUAD) as Temperament[]).map((t) => {
        const q = QUAD[t];
        const active = t === dominant;
        const mid = polar(c, c, rRing * 0.55, (q.a0 + q.a1) / 2);
        return (
          <G key={t}>
            <Path
              d={sector(c, c, 0, rRing, q.a0, q.a1)}
              fill={active ? (onDark ? color.crema : color.azulProfundo) : 'transparent'}
              stroke={faint}
              strokeWidth={1}
            />
            <SvgText
              x={mid.x}
              y={mid.y + rRing * 0.09}
              fontSize={rRing * 0.26}
              fontFamily={fontFamily.slab700}
              textAnchor="middle"
              fill={active ? (onDark ? color.azulNoche : color.blanco) : ink}>
              {q.label}
            </SvgText>
          </G>
        );
      })}
      {RING.map((s) => {
        const active = s.code === comboCode;
        const mid = polar(c, c, (rRing + rOuter) / 2, (s.a0 + s.a1) / 2);
        return (
          <G key={s.code}>
            <Path d={sector(c, c, rRing, rOuter, s.a0, s.a1)} fill={active ? accent : 'transparent'} stroke={faint} strokeWidth={1} />
            <SvgText
              x={mid.x}
              y={mid.y + rOuter * 0.035}
              fontSize={rOuter * 0.095}
              fontFamily={fontFamily.sans500}
              textAnchor="middle"
              fill={active ? (onDark ? color.azulNoche : color.blanco) : ink}>
              {s.code}
            </SvgText>
          </G>
        );
      })}
      <Line x1={c} y1={c - rRing} x2={c} y2={c + rRing} stroke={faint} strokeWidth={1} />
      <Line x1={c - rRing} y1={c} x2={c + rRing} y2={c} stroke={faint} strokeWidth={1} />
      <Circle cx={c} cy={c} r={rOuter} stroke={faint} strokeWidth={1} fill="none" />
    </Svg>
  );
}
