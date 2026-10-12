import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { averageProfiles } from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Card, Divider, Eyebrow, H2, H3, Row, Screen, Stack, Titular } from '@/components/ui';
import { CharacterBars } from '@/components/CharacterBars';
import { deleteEverything, exportLocal } from '@/features/account';
import { useContent } from '@/features/content';
import { typeName } from '@/features/labels';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 48, justifyContent: 'center' }}>
      <BodyStrong>{label} →</BodyStrong>
    </Pressable>
  );
}

export default function Yo() {
  const { t } = useTranslation();
  const s = useVirtus();
  const copy = useContent().temperaments;
  const [confirm, setConfirm] = useState(false);
  const last = s.character[s.character.length - 1];
  const others = last ? averageProfiles(last.others) : null;

  return (
    <Screen>
      <Titular eyebrow={t('yo.eyebrow')}>{typeName(t, s.temperament ?? { dominant: 'COL', secondary: null })}</Titular>

      <View style={{ gap: space.l }}>
        <Card>
          <Eyebrow>{t('yo.natural')}</Eyebrow>
          <H3>{t('yo.temperamento')}</H3>
          <Caption>{t('yo.temperamentoNota')}</Caption>
          {s.temperament ? (
            <>
              <Body>{copy[s.temperament.dominant].rasgos}</Body>
              <Row gap={space.m}>
                {copy[s.temperament.dominant].fortalezas.map((f) => (
                  <BodyStrong key={f}>{f}</BodyStrong>
                ))}
              </Row>
            </>
          ) : null}
          <Button variant="secondary" label={t('yo.verTipo')} onPress={() => router.push('/revelacion')} />
        </Card>

        <Card accent>
          <Eyebrow>{t('yo.conquistado')}</Eyebrow>
          <H3>{t('yo.caracter')}</H3>
          <Caption>{t('yo.caracterNota')}</Caption>
          {last ? (
            <>
              <CharacterBars self={last.self} others={others} />
              <Caption>
                {t('yo.autoevaluacion')}
                {others ? ` · ${t('yo.miradaOtros')}` : ''}
              </Caption>
              {!others ? <Caption>{t('yo.otrosPendiente')}</Caption> : null}
            </>
          ) : (
            <Body>{t('yo.caracterVacio')}</Body>
          )}
          <Button variant="secondary" label={t('yo.hacerCaracter')} onPress={() => router.push('/caracter')} />
        </Card>
      </View>

      <Divider />
      <Stack gap={0}>
        <H2>{t('yo.misionRoles')}</H2>
        <LinkRow label={t('mision.campo')} onPress={() => router.push('/mision')} />
        <LinkRow label={t('rolesPantalla.eyebrow')} onPress={() => router.push('/roles')} />
        <LinkRow label={t('yo.diario')} onPress={() => router.push('/diario')} />
        <LinkRow label={t('yo.plan')} onPress={() => router.push('/plan')} />
        <LinkRow label={t('yo.repetirTest')} onPress={() => router.push('/test')} />
        <LinkRow label={t('yo.cuenta')} onPress={() => router.push('/cuenta')} />
      </Stack>

      <Divider />
      <Stack gap={space.s}>
        <H2>{t('yo.privacidad')}</H2>
        <Button variant="secondary" label={t('yo.exportar')} onPress={exportLocal} />
        {!confirm ? (
          <Button variant="ghost" label={t('yo.borrar')} onPress={() => setConfirm(true)} />
        ) : (
          <Card>
            <Body>{t('yo.borrarConfirm')}</Body>
            <Button
              label={t('yo.borrar')}
              onPress={async () => {
                await deleteEverything();
                router.replace('/bienvenida');
              }}
            />
            <Button variant="ghost" label={t('comun.volver')} onPress={() => setConfirm(false)} />
          </Card>
        )}
      </Stack>
    </Screen>
  );
}
