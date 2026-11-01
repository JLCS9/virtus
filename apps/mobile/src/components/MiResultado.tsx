/** «Tu resultado» (igual que en la web): perfil de temperamento, virtud-desafío, fortaleza y punto débil. */
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { Temperament, TypeCode } from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Card, Eyebrow, H1, H3 } from '@/components/ui';
import { useContent } from '@/features/content';
import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';
import { color, radius, space } from '@/theme';

const COLORES: Record<string, string> = { COL: '#9C3A3A', MEL: '#5A3F8B', SAN: '#D67A2C', FLE: '#3F7A56' };
const NOMBRE: Record<string, Temperament> = { COL: 'colerico', MEL: 'melancolico', SAN: 'sanguineo', FLE: 'flematico' } as never;
const CLAVE = /^(COL|MEL|SAN|FLE)(-(COL|MEL|SAN|FLE))?$/;

/** El perfil del test de la cuenta (web o app): el del dispositivo o, si no hay, el último guardado. */
function usePerfil(): string | null {
  const local = useVirtus((s) => s.temperament?.type ?? null);
  const [remoto, setRemoto] = useState<string | null>(null);
  useEffect(() => {
    if (local || !supabase) return;
    let vivo = true;
    void supabase
      .from('test_results')
      .select('result')
      .eq('kind', 'temperament')
      .order('taken_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const r = data?.result as { profileKey?: string; type?: string } | null;
        const clave = r?.profileKey ?? r?.type;
        if (vivo && typeof clave === 'string' && CLAVE.test(clave)) setRemoto(clave);
      });
    return () => {
      vivo = false;
    };
  }, [local]);
  return local ?? remoto;
}

function Plegable({ titulo, texto }: { titulo: string; texto: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: color.bruma, paddingVertical: space.s, gap: space.xs }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: abierto }} onPress={() => setAbierto(!abierto)}>
        <BodyStrong>{titulo}</BodyStrong>
      </Pressable>
      {abierto ? <Body>{texto}</Body> : null}
    </View>
  );
}

export function MiResultado() {
  const { t } = useTranslation();
  const content = useContent();
  const perfil = usePerfil();

  if (!perfil) {
    return (
      <Card>
        <Eyebrow>{t('resultado.eyebrow')}</Eyebrow>
        <Caption>{t('resultado.sinTest')}</Caption>
        <Button variant="secondary" label={t('resultado.hacerTest')} onPress={() => router.push('/test' as never)} />
      </Card>
    );
  }

  const copia = content.types[perfil as TypeCode];
  const partes = perfil.split('-');
  if (!copia) return null;
  return (
    <Card>
      <Eyebrow>{t('resultado.eyebrow')}</Eyebrow>
      <H1>{copia.name}</H1>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
        {partes.map((p, i) => (
          <View
            key={p}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5, paddingLeft: 10, paddingRight: 12, borderRadius: radius.pill, backgroundColor: color.niebla }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: COLORES[p] }} />
            <Text style={{ color: color.azulProfundo, fontSize: 13, fontWeight: '600' }}>{content.temperaments[NOMBRE[p]]?.nombre ?? p}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', height: 4, maxWidth: 160, borderRadius: 2, overflow: 'hidden' }}>
        {partes.map((p) => (
          <View key={p} style={{ flex: 1, backgroundColor: COLORES[p] }} />
        ))}
      </View>
      {copia.challenge ? (
        <View style={{ borderLeftWidth: 3, borderLeftColor: color.doradoVirtud, paddingLeft: space.m, gap: 2 }}>
          <Eyebrow>{t('resultado.virtudDesafio')}</Eyebrow>
          <H3>{copia.label}</H3>
          <Body>{copia.challenge}</Body>
        </View>
      ) : null}
      {copia.fortaleza ? <Plegable titulo={t('resultado.fortaleza')} texto={copia.fortaleza} /> : null}
      {copia.debilidad ? <Plegable titulo={t('resultado.debilidad')} texto={copia.debilidad} /> : null}
    </Card>
  );
}
