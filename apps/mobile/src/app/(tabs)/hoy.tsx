import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Card, Eyebrow, H1, H2, Lectura, Screen, Stack, Wordmark, useSurface } from '@/components/ui';
import { useToday } from '@/features/today';
import { useVirtus } from '@/store/virtus';
import { color, radius, space, type } from '@/theme';
import { Text } from 'react-native';

function Check({ done }: { done: boolean }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: radius.s,
        borderWidth: 2,
        borderColor: done ? color.azulProfundo : color.piedra,
        backgroundColor: done ? color.azulProfundo : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {done ? <Text style={{ color: color.blanco, fontSize: 13, lineHeight: 15 }}>✓</Text> : null}
    </View>
  );
}

function MomentCard({ eyebrow, title, done, doneLabel, onPress }: { eyebrow: string; title: string; done: boolean; doneLabel: string; onPress: () => void }) {
  const s = useSurface();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card accent={!done}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <Check done={done} />
          <Text style={[type.h3, { color: s.titular, flex: 1 }]}>{done ? doneLabel : title}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function Hoy() {
  const { t, i18n } = useTranslation();
  const s = useVirtus();
  const today = useToday();
  const date = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
  const isSunday = new Date().getDay() === 0;

  return (
    <Screen>
      <Wordmark height={26} />
      <Stack gap={space.xs} style={{ marginTop: space.m }}>
        <Eyebrow>{date}</Eyebrow>
        <H1>{t('hoy.ciclo', { virtud: t(`virtudes.${today.virtue}`) })}</H1>
      </Stack>

      <Pressable accessibilityRole="button" onPress={() => router.push('/mision')}>
        <View style={{ borderLeftWidth: 3, borderLeftColor: color.doradoVirtud, paddingLeft: space.m, gap: space.xs }}>
          <Eyebrow>{t('hoy.mision')}</Eyebrow>
          {s.mission ? <Lectura>{s.mission}</Lectura> : <Body>{t('hoy.sinMision')}</Body>}
        </View>
      </Pressable>

      {!today.practiceDay ? <Caption>{t('hoy.descanso')}</Caption> : null}

      <MomentCard
        eyebrow={t('hoy.manana')}
        title={t('hoy.mananaPendiente')}
        done={!!today.record?.challenge?.acceptedAt}
        doneLabel={today.record?.challenge?.text ?? t('hoy.mananaHecho')}
        onPress={() => router.push('/ritual/manana')}
      />
      <MomentCard
        eyebrow={t('hoy.noche')}
        title={t('hoy.nochePendiente')}
        done={!!today.record?.exam}
        doneLabel={t('hoy.nocheHecho')}
        onPress={() => router.push('/ritual/noche')}
      />

      {s.plan.habits.length > 0 ? (
        <Stack gap={space.s} style={{ marginTop: space.s }}>
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

      {isSunday ? (
        <Card style={{ marginTop: space.s }}>
          <H2>{t('hoy.semana')}</H2>
          <Body>{t('hoy.semanaTexto')}</Body>
          <Button variant="secondary" label={t('hoy.abrir')} onPress={() => router.push('/ritual/semana')} />
        </Card>
      ) : (
        <Button variant="ghost" label={t('hoy.semana')} onPress={() => router.push('/ritual/semana')} />
      )}
    </Screen>
  );
}
