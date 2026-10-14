import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { characterStage, VIRTUES, type Virtue } from '@virtus/method';
import type { VlCharacterTest } from '@virtus/content';

import { Body, Caption } from '@/components/ui';
import { color, radius, space, type, virtueColor } from '@/theme';

const TEXT_KEY: Record<Virtue, string> = {
  prudencia: '1-prudence.html',
  fortaleza: '2-courage.html',
  dominio: '3-selfmastery.html',
  justicia: '4-justice.html',
  magnanimidad: '5-magnanimity.html',
  humildad: '6-humility.html',
};
const LABEL: Record<Virtue, [string, string]> = {
  prudencia: ['chResultP1', 'chResultP2'],
  fortaleza: ['chResultC1', 'chResultC2'],
  dominio: ['chResultS1', 'chResultS2'],
  justicia: ['chResultJ1', 'chResultJ2'],
  magnanimidad: ['chResultM1', 'chResultM2'],
  humildad: ['chResultH1', 'chResultH2'],
};
const STAGE_KEY = { bajo: 'chResultVirtueStage0', moderado: 'chResultVirtueStage1', alto: 'chResultVirtueStage2' } as const;

function Bar({ value, tint }: { value: number; tint: string }) {
  return (
    <View style={{ height: 6, backgroundColor: color.bruma, borderRadius: 3 }}>
      <View style={{ height: 6, width: `${Math.max(2, value)}%`, backgroundColor: tint, borderRadius: 3 }} />
    </View>
  );
}

/** Resultado del test de carácter: global + aspecto pasivo/activo y el texto oficial de cada virtud. */
export function CharacterReport({
  self,
  facets,
  test,
}: {
  self: Record<Virtue, number>;
  facets?: Record<Virtue, { passive: number; active: number }>;
  test: VlCharacterTest;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<Virtue | null>(null);
  return (
    <View style={{ gap: space.m }}>
      {VIRTUES.map((v) => {
        const tint = virtueColor[v];
        const stage = characterStage(self[v]);
        return (
          <Pressable
            key={v}
            accessibilityRole="button"
            onPress={() => setOpen(open === v ? null : v)}
            style={{ borderWidth: 1, borderColor: color.bruma, borderRadius: radius.l, padding: space.m, gap: space.s, backgroundColor: color.blanco }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={[type.h3, { color: color.azulProfundo }]}>{t(`virtudes.${v}`)}</Text>
              <Text style={[type.h3, { color: color.doradoVirtud }]}>{self[v]} %</Text>
            </View>
            <Bar value={self[v]} tint={tint} />
            <Caption>
              {test.labels[STAGE_KEY[stage]]} {t(`virtudes.${v}`).toLowerCase()}
            </Caption>
            {facets ? (
              <View style={{ flexDirection: 'row', gap: space.m }}>
                {(['passive', 'active'] as const).map((k, i) => (
                  <View key={k} style={{ flex: 1, gap: 4 }}>
                    <Text style={[type.caption, { color: color.pizarra }]} numberOfLines={2}>
                      {test.labels[LABEL[v][i]]} · {Math.round(facets[v][k])} %
                    </Text>
                    <Bar value={facets[v][k]} tint={color.plomo} />
                  </View>
                ))}
              </View>
            ) : null}
            {open === v ? <Body>{test.texts[TEXT_KEY[v]]}</Body> : <Caption>{t('caracter.verConsejos')}</Caption>}
          </Pressable>
        );
      })}
    </View>
  );
}
