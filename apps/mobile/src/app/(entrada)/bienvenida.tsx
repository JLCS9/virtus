import { useRef, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Display, Eyebrow, Filete, H1, SurfaceProvider } from '@/components/ui';
import { Sello } from '@/components/ui';
import { TemperamentWheel } from '@/components/TemperamentWheel';
import { VideoCard } from '@/components/VideoCard';
import { useContent } from '@/features/content';
import { TAGLINE, color, space, surface, type } from '@/theme';

export default function Bienvenida() {
  const { t } = useTranslation();
  const { width: screen } = useWindowDimensions();
  const width = Math.min(screen, 640);
  const [page, setPage] = useState(0);
  const [height, setHeight] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const videos = useContent().videos;
  const video = videos.find((v) => v.id === 'v-temperamento-caracter') ?? videos[0];
  const pages = 3;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  const next = () => {
    if (page < pages - 1) scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
    else router.push('/test');
  };

  const Slide = ({ children }: { children: React.ReactNode }) => (
    <View style={{ width, minHeight: height, paddingHorizontal: space.l, justifyContent: 'center', gap: space.l }}>{children}</View>
  );

  return (
    <SurfaceProvider value={surface.marca}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1, backgroundColor: color.azulProfundo, alignItems: 'center' }}>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          onScroll={onScroll}
          scrollEventThrottle={64}
          onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
          style={{ width, flex: 1 }}>
          <Slide>
            <Sello size={88} />
            <Eyebrow>{t('bienvenida.eyebrow')}</Eyebrow>
            <Display>{t('bienvenida.titulo')}</Display>
            <Filete />
            <Body>{t('bienvenida.s1')}</Body>
            <Text style={[type.cita, { color: color.doradoClaro }]}>{TAGLINE}</Text>
          </Slide>
          <Slide>
            <View style={{ alignItems: 'center' }}>
              <TemperamentWheel size={Math.min(width - space.l * 2, 260)} onDark />
            </View>
            <H1>{t('bienvenida.s2titulo')}</H1>
            <Body>{t('bienvenida.s2')}</Body>
          </Slide>
          <Slide>
            <H1>{t('bienvenida.s3titulo')}</H1>
            <Body>{t('bienvenida.s3')}</Body>
            <View style={{ backgroundColor: color.blanco, borderRadius: 12, padding: space.s, alignSelf: 'flex-start' }}>
              <VideoCard video={video} width={Math.min(width - space.l * 2 - space.s * 2, 320)} />
            </View>
            <Caption>{t('bienvenida.antropologiaCorta')}</Caption>
          </Slide>
        </ScrollView>
        <View style={{ width, paddingHorizontal: space.l, paddingBottom: space.l, gap: space.m }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.s }}>
            {Array.from({ length: pages }, (_, i) => (
              <View key={i} style={{ width: i === page ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === page ? color.doradoClaro : color.plomo }} />
            ))}
          </View>
          <Button label={page < pages - 1 ? t('comun.continuar') : t('bienvenida.empezar')} onPress={next} />
        </View>
      </SafeAreaView>
    </SurfaceProvider>
  );
}
