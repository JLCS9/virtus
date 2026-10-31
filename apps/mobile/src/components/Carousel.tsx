import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { Eyebrow } from '@/components/ui';
import { space } from '@/theme';

/** Fila horizontal con título; sangra hasta el borde de la pantalla. */
export function Carousel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <View style={{ gap: space.s, marginHorizontal: -space.l }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.l }}>
        <Eyebrow>{title}</Eyebrow>
        {action}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.l, gap: space.m }}>
        {children}
      </ScrollView>
    </View>
  );
}
