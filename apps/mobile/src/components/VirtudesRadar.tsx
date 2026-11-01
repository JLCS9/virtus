import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { VIRTUES, type Virtue } from '@virtus/method';

import { color, fontFamily } from '@/theme';

/** Gráfica de las seis virtudes (0–100): el primer eje apunta arriba y sigue el sentido del reloj. */
export function VirtudesRadar({ valores, size = 300 }: { valores: Record<Virtue, number>; size?: number }) {
  const { t } = useTranslation();
  const c = size / 2;
  const radio = c - 64;
  const punto = (i: number, f: number): [number, number] => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / VIRTUES.length;
    return [c + radio * f * Math.cos(ang), c + radio * f * Math.sin(ang)];
  };
  const poly = (f: (i: number) => number) => VIRTUES.map((_, i) => punto(i, f(i)).join(',')).join(' ');
  return (
    <View style={{ alignItems: 'center' }} accessibilityLabel={VIRTUES.map((v) => `${t(`virtudes.${v}`)} ${Math.round(valores[v])}`).join(', ')}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <Polygon key={f} points={poly(() => f)} fill="none" stroke={color.bruma} strokeWidth={1} />
        ))}
        {VIRTUES.map((v, i) => {
          const [x, y] = punto(i, 1);
          return <Line key={v} x1={c} y1={c} x2={x} y2={y} stroke={color.bruma} strokeWidth={1} />;
        })}
        <Polygon points={poly((i) => Math.min(1, Math.max(0, valores[VIRTUES[i]] / 100)))} fill={color.doradoVirtud} fillOpacity={0.28} stroke={color.doradoVirtud} strokeWidth={2} />
        {VIRTUES.map((v, i) => {
          const [x, y] = punto(i, Math.min(1, Math.max(0, valores[v] / 100)));
          return <Circle key={v} cx={x} cy={y} r={3.5} fill={color.azulProfundo} />;
        })}
        {VIRTUES.map((v, i) => {
          const [x, y] = punto(i, 1.2);
          return (
            <SvgText key={v} x={x} y={y} fontSize={12} fontFamily={fontFamily.sans500} fill={color.azulProfundo} textAnchor="middle">
              {t(`virtudes.${v}`)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
