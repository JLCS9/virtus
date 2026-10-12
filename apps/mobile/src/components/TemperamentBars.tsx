import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TEMPERAMENTS, type TemperamentResult } from '@virtus/method';

import { useSurface } from '@/components/ui';
import { color, space, surface, type } from '@/theme';

/** Porcentajes por temperamento. Sin color por temperamento: solo el dominante lleva el acento. */
export function TemperamentBars({ result }: { result: TemperamentResult }) {
  const { t } = useTranslation();
  const s = useSurface();
  const onDark = s !== surface.claro;
  const ordered = [...TEMPERAMENTS].sort((a, b) => result.percent[b] - result.percent[a]);
  return (
    <View style={{ gap: space.s }}>
      {ordered.map((x) => {
        const main = x === result.dominant || x === result.secondary;
        return (
          <View key={x} style={{ gap: space.xs }} accessibilityLabel={`${t(`temperamentos.${x}`)} ${result.percent[x]} %`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[type.body, { color: main ? s.titular : s.texto, fontFamily: main ? type.bodyStrong.fontFamily : type.body.fontFamily }]}>
                {t(`temperamentos.${x}`)}
              </Text>
              <Text style={[type.body, { color: x === result.dominant ? s.acento : s.texto }]}>{result.percent[x]} %</Text>
            </View>
            <View style={{ height: 4, backgroundColor: onDark ? color.azulNoche : color.bruma }}>
              <View
                style={{
                  height: 4,
                  width: `${result.percent[x]}%`,
                  backgroundColor: x === result.dominant ? s.acento : onDark ? color.piedra : color.plomo,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
