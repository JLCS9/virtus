import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { VIRTUES, type Virtue } from '@virtus/method';

import { color, space, type, virtueColor } from '@/theme';

/** Perfil de las seis virtudes (0–100). Autoevaluación en trazo lleno; mirada de otros como marca. */
export function CharacterBars({ self, others }: { self: Record<Virtue, number>; others: Record<Virtue, number> | null }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: space.m }}>
      {VIRTUES.map((v) => (
        <View key={v} style={{ gap: space.xs }} accessibilityLabel={`${t(`virtudes.${v}`)} ${self[v]}${others ? ` / ${others[v]}` : ''}`}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[type.bodyStrong, { color: color.azulProfundo }]}>{t(`virtudes.${v}`)}</Text>
            <Text style={[type.body, { color: color.pizarra }]}>
              {self[v]}
              {others ? ` · ${others[v]}` : ''}
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: color.bruma }}>
            <View style={{ height: 6, width: `${self[v]}%`, backgroundColor: virtueColor[v] }} />
            {others ? (
              <View style={{ position: 'absolute', left: `${others[v]}%`, top: -3, width: 2, height: 12, backgroundColor: color.pizarra }} />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
