import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { cycleDay, isCycleDue, shouldConfirmTemperament } from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Card, Eyebrow, H2, Screen, Stack, Wordmark } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { ModelCard } from '@/components/ModelCard';
import { ProgressRing } from '@/components/ProgressRing';
import { VideoCard } from '@/components/VideoCard';
import { Carousel } from '@/components/Carousel';
import { pullInvitationResults } from '@/features/invitations';
import { useToday } from '@/features/today';
import { useVirtus } from '@/store/virtus';
import { color, radius, space, type } from '@/theme';

function Check({ done, onDark }: { done: boolean; onDark?: boolean }) {
  const on = onDark ? color.doradoClaro : color.azulProfundo;
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: radius.s,
        borderWidth: 2,
        borderColor: done ? on : onDark ? color.plomo : color.piedra,
        backgroundColor: done ? on : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {done ? <Text style={{ color: onDark ? color.azulNoche : color.blanco, fontSize: 13, lineHeight: 15 }}>✓</Text> : null}
    </View>
  );
}

function Tile({
  icon,
  title,
  subtitle,
  done,
  onPress,
  right,
}: {
  icon: Parameters<typeof SymbolView>[0]['name'];
  title: string;
  subtitle: string;
  done?: boolean;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 132,
        padding: space.m,
        gap: space.s,
        borderRadius: radius.l,
        borderWidth: 1,
        borderColor: color.bruma,
        backgroundColor: done ? color.niebla : color.blanco,
        opacity: pressed ? 0.85 : 1,
      })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <SymbolView name={icon} size={28} tintColor={color.azulProfundo} />
        {right ?? (done ? <Check done /> : null)}
      </View>
      <Text style={[type.h3, { color: color.azulProfundo }]}>{title}</Text>
      <Text style={[type.caption, { color: color.pizarra }]}>{subtitle}</Text>
    </Pressable>
  );
}

export default function Hoy() {
  const { t, i18n } = useTranslation();
  const s = useVirtus();
  const today = useToday();
  const [noMore, setNoMore] = useState(false);
  const now = new Date();
  const date = now.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
  const challenge = today.record?.challenge;
  const accepted = !!challenge?.acceptedAt;
  const cycleLen = s.plan.cycleWeeks * 7;
  const day = s.cycle ? cycleDay(s.cycle.startedAt, now) : 1;
  const cycleDue = !!s.cycle && isCycleDue(s.cycle.startedAt, s.plan.cycleWeeks, now);
  const confirmTemperament = shouldConfirmTemperament(s.temperamentHistory, s.temperamentConfirmDismissedAt, now);

  useEffect(() => {
    void pullInvitationResults();
  }, []);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark height={24} />
        <Pressable accessibilityRole="button" accessibilityLabel={t('tabs.yo')} onPress={() => router.push('/yo' as never)} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <Caption>{date}</Caption>
          <SymbolView name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} size={24} tintColor={color.azulProfundo} />
        </Pressable>
      </View>

      {s.mission ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/mision')}>
          <Text style={[type.cita, { color: color.pizarra }]} numberOfLines={2}>
            {s.mission}
          </Text>
        </Pressable>
      ) : null}

      <Hero>
        <Eyebrow>{t('hoy.retoDe', { virtud: t(`virtudes.${today.virtue}`) })}</Eyebrow>
        {!today.practiceDay ? <Body>{t('hoy.descanso')}</Body> : null}
        <H2>{challenge?.text ?? '…'}</H2>
        {challenge?.why ? <Caption>{challenge.why}</Caption> : challenge?.role ? <Caption>{t(`roles.${challenge.role}`)}</Caption> : null}
        {accepted ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
            <Check done onDark />
            <Body>{t('hoy.aceptadoNoche')}</Body>
          </View>
        ) : (
          <View style={{ gap: space.xs }}>
            <Button label={t('ritual.aceptar')} disabled={!challenge} onPress={today.accept} />
            {today.reroll ? <Button variant="ghost" label={t('ritual.otro')} onPress={() => setNoMore(!today.reroll!())} /> : null}
            {noMore ? <Caption>{t('ritual.sinRetos')}</Caption> : null}
          </View>
        )}
      </Hero>

      {today.estado === 'sin_perfil' ? (
        <Card accent>
          <BodyStrong>{t('retos.configurarTitulo')}</BodyStrong>
          <Caption>{t('retos.configurarTexto')}</Caption>
          <Button label={t('retos.configurar')} onPress={() => router.push('/retos/onboarding' as never)} />
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: space.m }}>
        <Tile
          icon={{ ios: 'moon.stars', android: 'bedtime', web: 'bedtime' }}
          title={t('hoy.noche')}
          subtitle={today.record?.exam ? t('hoy.nocheHecho') : t('hoy.nocheCorto')}
          done={!!today.record?.exam}
          onPress={() => router.push('/ritual/noche')}
        />
        <Tile
          icon={{ ios: 'map', android: 'map', web: 'map' }}
          title={t('hoy.cicloCorto')}
          subtitle={t('hoy.diaDe', { n: Math.min(day, cycleLen), total: cycleLen })}
          onPress={() => router.push(cycleDue ? '/ciclo' : '/camino')}
          right={<ProgressRing value={day / cycleLen} size={44} label={`${Math.min(day, cycleLen)}`} />}
        />
      </View>

      {cycleDue ? (
        <Card accent>
          <H2>{t('hoy.cicloCierre')}</H2>
          <Button label={t('hoy.abrir')} onPress={() => router.push('/ciclo')} />
        </Card>
      ) : null}
      {confirmTemperament ? (
        <Card>
          <BodyStrong>{t('hoy.confirmarTitulo')}</BodyStrong>
          <Caption>{t('hoy.confirmarTexto')}</Caption>
          <View style={{ flexDirection: 'row', gap: space.s }}>
            <Button variant="secondary" label={t('hoy.confirmar')} onPress={() => router.push('/test')} />
            <Button variant="ghost" label={t('comun.omitir')} onPress={s.dismissTemperamentConfirm} />
          </View>
        </Card>
      ) : null}

      {s.plan.habits.length > 0 ? (
        <Stack gap={space.xs}>
          <Eyebrow>{t('hoy.habitos')}</Eyebrow>
          {s.plan.habits.map((h) => {
            const done = !!today.record?.habitsDone.includes(h.id);
            return (
              <Pressable
                key={h.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done }}
                onPress={() => s.toggleHabit(today.key, h.id)}
                style={{ flexDirection: 'row', gap: space.m, alignItems: 'center', minHeight: 44 }}>
                <Check done={done} />
                <Body style={{ flex: 1 }}>{h.label}</Body>
              </Pressable>
            );
          })}
        </Stack>
      ) : null}

      <Carousel title={t('hoy.inspiracion')}>
        <ModelCard model={today.model} />
        <VideoCard video={today.video} width={240} />
      </Carousel>

      <Button variant="ghost" label={t('hoy.semana')} onPress={() => router.push('/ritual/semana')} />
    </Screen>
  );
}
