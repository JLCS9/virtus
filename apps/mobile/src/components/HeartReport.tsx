import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HEART_CODES } from '@virtus/method';

import { Body, Button, Caption } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { useContent } from '@/features/content';
import type { HeartRecord } from '@/store/virtus';
import { color, radius, space, type } from '@/theme';

/** Tendencias del corazón con su nombre descriptivo, intensidad y el diagnóstico y remedio oficiales. */
export function HeartReport({ record }: { record: HeartRecord }) {
  const { t } = useTranslation();
  const test = useContent().vlTests.heart;
  const [open, setOpen] = useState<string | null>(null);
  const ordered = [...HEART_CODES].sort((a, b) => (record.pct[b] ?? 0) - (record.pct[a] ?? 0));
  return (
    <View style={{ gap: space.m }}>
      {record.verdict === 'balanced' ? (
        <Hero>
          <Text style={[type.h3, { color: color.blanco }]}>{test.labels.hResultInBalance}</Text>
        </Hero>
      ) : null}
      {ordered.map((code) => {
        const stage = record.stage[code];
        const d = test.disorders.find((x) => x.code === code)!;
        const active = stage !== 'none';
        return (
          <Pressable
            key={code}
            accessibilityRole="button"
            onPress={() => setOpen(open === code ? null : code)}
            style={{
              borderWidth: 1,
              borderColor: active ? color.azulProfundo : color.bruma,
              borderRadius: radius.l,
              padding: space.m,
              gap: space.s,
              backgroundColor: color.blanco,
            }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.m }}>
              <Text style={[type.h3, { color: color.azulProfundo, flex: 1 }]}>{t(`corazon.tendencias.${code}`)}</Text>
              <Text style={[type.bodyStrong, { color: active ? color.doradoVirtud : color.pizarra }]}>{t(`corazon.stage.${stage}`)}</Text>
            </View>
            <View style={{ height: 6, backgroundColor: color.bruma, borderRadius: 3 }}>
              <View style={{ height: 6, width: `${Math.max(2, record.pct[code] ?? 0)}%`, backgroundColor: active ? color.azulProfundo : color.plomo, borderRadius: 3 }} />
            </View>
            <Caption>{t('corazon.enElLibro', { nombre: test.labels[d.label_key] })}</Caption>
            {open === code ? <Body>{test.texts[d.html_key]}</Body> : <Caption>{t('corazon.verRemedio')}</Caption>}
          </Pressable>
        );
      })}
      {test.bookUrl ? (
        <Button variant="ghost" label={t('corazon.libro')} onPress={() => Linking.openURL(test.bookUrl)} />
      ) : null}
    </View>
  );
}
