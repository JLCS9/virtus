import { goBackOrHome } from '@/features/nav';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Body, BodyStrong, Button, Caption, Card, Eyebrow, Screen, Titular } from '@/components/ui';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

export default function Diario() {
  const { t, i18n } = useTranslation();
  const records = useVirtus((s) => s.records);
  const days = Object.values(records)
    .filter((r) => r.exam || r.challenge)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
      <Titular eyebrow={t('yo.eyebrow')}>{t('yo.diario')}</Titular>
      {days.length === 0 ? <Body>{t('yo.diarioVacio')}</Body> : null}
      {days.map((r) => (
        <Card key={r.date}>
          <Eyebrow>{new Date(`${r.date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}</Eyebrow>
          {r.challenge ? <BodyStrong>{r.challenge.text}</BodyStrong> : null}
          {r.exam ? (
            <View style={{ gap: space.xs }}>
              {r.exam.situation ? <Body>{r.exam.situation}</Body> : null}
              {r.exam.firstReaction ? <Caption>1ª · {r.exam.firstReaction}</Caption> : null}
              {r.exam.secondReaction ? <Caption>2ª · {r.exam.secondReaction}</Caption> : null}
              {r.exam.good ? <Body>{r.exam.good}</Body> : null}
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
