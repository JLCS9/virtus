/** «Camino» de las cuentas con suscripción: tu asistente, la siguiente lección y tus virtudes. */
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { VIRTUES, type Virtue } from '@virtus/method';

import { Body, Button, Caption, Card, Eyebrow, H2, H3, Screen, Titular } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { LessonThumb } from '@/components/CourseCard';
import { CharacterBars } from '@/components/CharacterBars';
import { VirtudesRadar } from '@/components/VirtudesRadar';
import { useContent } from '@/features/content';
import { formatDuration, nextLessonOverall } from '@/features/courses';
import { useToday } from '@/features/today';
import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';
import { color, space, type } from '@/theme';

/** Última medición del test de carácter: la del dispositivo o, si no hay, la guardada en la cuenta (web). */
function useCaracter(): Record<Virtue, number> | null {
  const local = useVirtus((s) => s.character[s.character.length - 1]?.self ?? null);
  const [remoto, setRemoto] = useState<Record<Virtue, number> | null>(null);
  useEffect(() => {
    if (local || !supabase) return;
    let vivo = true;
    void supabase
      .from('test_results')
      .select('result')
      .eq('kind', 'character')
      .order('taken_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const self = (data?.result as { self?: Record<string, unknown> } | null)?.self;
        if (!self || !vivo) return;
        const valores = {} as Record<Virtue, number>;
        for (const v of VIRTUES) {
          const n = Number(self[v]);
          if (!Number.isFinite(n)) return;
          valores[v] = Math.min(100, Math.max(0, n));
        }
        setRemoto(valores);
      });
    return () => {
      vivo = false;
    };
  }, [local]);
  return local ?? remoto;
}

export function CaminoRetos() {
  const { t } = useTranslation();
  const content = useContent();
  const today = useToday();
  const watched = useVirtus((s) => s.watched);
  const lastLesson = useVirtus((s) => s.lastLesson);
  const caracter = useCaracter();

  const configurado = today.estado === 'servidor';
  const siguiente = nextLessonOverall(content.courses, watched, lastLesson);
  const ordenadas = caracter ? [...VIRTUES].sort((a, b) => caracter[b] - caracter[a]) : [];

  return (
    <Screen>
      <Titular eyebrow={t('camino.eyebrow')}>{t('caminoRetos.titulo')}</Titular>

      <Card accent>
        <Eyebrow>{t('caminoRetos.asistente')}</Eyebrow>
        <H3>{configurado ? t('caminoRetos.conversaNoche') : t('caminoRetos.conoceAsistente')}</H3>
        <Body>{configurado ? t('caminoRetos.textoNoche') : t('caminoRetos.textoOnboarding')}</Body>
        <Button
          label={configurado ? t('caminoRetos.hacerNoche') : t('caminoRetos.empezar')}
          onPress={() => router.push((configurado ? '/ritual/noche' : '/retos/onboarding') as never)}
        />
      </Card>

      {siguiente ? (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/leccion/[id]', params: { id: siguiente.lesson.id } })}>
          {({ pressed }) => (
            <Hero style={{ opacity: pressed ? 0.9 : 1 }}>
              <Text style={[type.eyebrow, { color: color.doradoClaro }]}>{t('caminoRetos.siguienteLeccion')}</Text>
              <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
                <LessonThumb lesson={siguiente.lesson} width={128} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.bodyStrong, { color: color.blanco }]} numberOfLines={3}>
                    {siguiente.lesson.id} · {siguiente.lesson.titulo}
                  </Text>
                  <Text style={[type.caption, { color: color.piedra }]} numberOfLines={2}>
                    {t('cursos.curso', { n: siguiente.course.numero })} · {siguiente.course.titulo} · {formatDuration(t, siguiente.lesson.duracion)}
                  </Text>
                </View>
              </View>
            </Hero>
          )}
        </Pressable>
      ) : null}

      <Card>
        <Eyebrow>{t('caminoRetos.virtudes')}</Eyebrow>
        {caracter ? (
          <>
            <H2>{t('caminoRetos.mapa')}</H2>
            <VirtudesRadar valores={caracter} />
            <Body>
              {t('caminoRetos.resumen', {
                mayor: t(`virtudes.${ordenadas[0]}`),
                pMayor: Math.round(caracter[ordenadas[0]]),
                menor: t(`virtudes.${ordenadas[ordenadas.length - 1]}`),
                pMenor: Math.round(caracter[ordenadas[ordenadas.length - 1]]),
              })}
            </Body>
            <CharacterBars self={caracter} others={null} />
          </>
        ) : (
          <>
            <H2>{t('caminoRetos.sinTestTitulo')}</H2>
            <Caption>{t('caminoRetos.sinTestTexto')}</Caption>
            <Button label={t('caminoRetos.hacerTest')} onPress={() => router.push('/caracter' as never)} />
          </>
        )}
      </Card>
    </Screen>
  );
}
