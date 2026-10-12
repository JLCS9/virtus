import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { color, type } from '@/theme';

/** Progreso sobrio (sin celebraciones): un arco dorado y el número en el centro. */
export function ProgressRing({
  value,
  size = 64,
  label,
  onDark = false,
}: {
  value: number;
  size?: number;
  label: string;
  onDark?: boolean;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={onDark ? color.plomo : color.bruma} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={onDark ? color.doradoClaro : color.doradoVirtud}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ * v} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[type.bodyStrong, { color: onDark ? color.blanco : color.azulProfundo, fontSize: size * 0.24 }]}>{label}</Text>
    </View>
  );
}
