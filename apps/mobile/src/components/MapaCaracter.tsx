/** «Tus virtudes»: el mapa del test de carácter (igual que en Hoy de la web). Antes vivía en Camino. */
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { VIRTUES, type Virtue } from '@virtus/method';

import { Body, Button, Caption, Card, Eyebrow, H2 } from '@/components/ui';
import { CharacterBars } from '@/components/CharacterBars';
import { VirtudesRadar } from '@/components/VirtudesRadar';
import { supabase } from '@/lib/supabase';
import { useVirtus } from '@/store/virtus';

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

export function MapaCaracter() {
  const { t } = useTranslation();
  const caracter = useCaracter();
  const ordenadas = caracter ? [...VIRTUES].sort((a, b) => caracter[b] - caracter[a]) : [];
  return (
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
  );
}
