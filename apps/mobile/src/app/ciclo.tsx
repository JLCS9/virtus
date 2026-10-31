/**
 * Cierre de ciclo: lo vivido, el test de carácter con la mirada de al menos una persona
 * de confianza, la evolución (con sobriedad) y la elección del siguiente ciclo.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { WORK_VIRTUES, averageProfiles, characterDelta, summarizeCycle, VIRTUES, type WorkVirtue } from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Card, Chip, Divider, Eyebrow, H2, Row, Screen, Stack, Titular } from '@/components/ui';
import { CharacterBars } from '@/components/CharacterBars';
import { backendEnabled, invite } from '@/features/account';
import { track } from '@/features/analytics';
import { pullInvitationResults } from '@/features/invitations';
import { goBackOrHome } from '@/features/nav';
import { useVirtus } from '@/store/virtus';
import { color, space, type } from '@/theme';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, gap: space.xs }}>
      <Text style={[type.h1, { color: color.doradoVirtud }]}>{value}</Text>
      <Caption>{label}</Caption>
    </View>
  );
}

export default function CierreCiclo() {
  const { t } = useTranslation();
  const s = useVirtus();
  const [next, setNext] = useState<WorkVirtue>(s.temperament?.challengeVirtue ?? 'humildad');
  const [note, setNote] = useState<string | null>(null);
  if (!s.cycle) return null;

  const summary = summarizeCycle(s.records, s.cycle.startedAt, new Date());
  const current = [...s.character].reverse().find((c) => c.takenAt >= s.cycle!.startedAt) ?? null;
  const previous = current ? [...s.character].reverse().find((c) => c.takenAt < current.takenAt) ?? null : null;
  const others = current ? averageProfiles(current.others) : null;
  const delta = current ? characterDelta(previous?.self ?? null, current.self) : null;

  const askView = async () => {
    const ok = await invite('character_view');
    setNote(ok ? t('ciclo.invitacionCreada') : t('circulo.sinCuenta'));
  };
  const check = async () => {
    const n = await pullInvitationResults();
    setNote(n > 0 ? t('ciclo.miradasNuevas', { n }) : t('ciclo.sinMiradas'));
  };
  const close = () => {
    s.closeCycle(next);
    track('cycle_closed', { with_external_view: !!others, next_is_challenge: next === s.temperament?.challengeVirtue });
    router.replace('/hoy');
  };

  return (
    <Screen footer={<Button label={t('ciclo.cerrar', { virtud: t(`virtudes.${next}`) })} onPress={close} />}>
      <Titular eyebrow={t('ciclo.eyebrow', { virtud: t(`virtudes.${s.cycle.virtue}`) })}>{t('ciclo.titulo')}</Titular>

      <Stack gap={space.s}>
        <Eyebrow>1 · {t('ciclo.vivido')}</Eyebrow>
        <View style={{ flexDirection: 'row', gap: space.m }}>
          <Stat value={summary.days} label={t('ciclo.dias')} />
          <Stat value={summary.accepted} label={t('ciclo.aceptados')} />
          <Stat value={summary.done} label={t('ciclo.cumplidos')} />
        </View>
        <Body>{t('ciclo.reacciones', { segunda: summary.secondPrevailed, primera: summary.firstPrevailed })}</Body>
      </Stack>
      <Divider />

      <Stack gap={space.s}>
        <Eyebrow>2 · {t('ciclo.autoevaluacion')}</Eyebrow>
        {current ? <Body>{t('ciclo.autoHecha')}</Body> : <Body>{t('ciclo.autoPendiente')}</Body>}
        <Button variant={current ? 'ghost' : 'secondary'} label={current ? t('ciclo.repetirAuto') : t('yo.hacerCaracter')} onPress={() => router.push('/caracter')} />
      </Stack>
      <Divider />

      <Stack gap={space.s}>
        <Eyebrow>3 · {t('ciclo.mirada')}</Eyebrow>
        <Body>{t('ciclo.miradaTexto')}</Body>
        {backendEnabled() ? (
          <Row>
            <Button variant="secondary" label={t('ciclo.pedirMirada')} onPress={askView} />
            <Button variant="ghost" label={t('ciclo.comprobar')} onPress={check} />
          </Row>
        ) : (
          <Caption>{t('circulo.sinCuenta')}</Caption>
        )}
        {note ? <Caption>{note}</Caption> : null}
      </Stack>
      <Divider />

      {current ? (
        <Card>
          <Eyebrow>4 · {t('ciclo.evolucion')}</Eyebrow>
          <CharacterBars self={current.self} others={others} />
          {!others ? <Caption>{t('yo.otrosPendiente')}</Caption> : null}
          {delta ? (
            <Stack gap={space.xs}>
              <BodyStrong>{t('ciclo.respectoAnterior')}</BodyStrong>
              {VIRTUES.map((v) => (
                <View key={v} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Body>{t(`virtudes.${v}`)}</Body>
                  <Body>{delta[v] > 0 ? `+${delta[v]}` : String(delta[v])}</Body>
                </View>
              ))}
              <Caption>{t('ciclo.humildadNota')}</Caption>
            </Stack>
          ) : null}
        </Card>
      ) : null}

      <Stack gap={space.s}>
        <H2>{t('ciclo.siguiente')}</H2>
        <Caption>{t('ciclo.siguienteNota')}</Caption>
        <Row>
          {WORK_VIRTUES.map((v) => (
            <Chip key={v} label={t(`virtudes.${v}`)} selected={next === v} onPress={() => setNext(v)} />
          ))}
        </Row>
      </Stack>
      <Button variant="ghost" label={t('comun.volver')} onPress={goBackOrHome} />
    </Screen>
  );
}
