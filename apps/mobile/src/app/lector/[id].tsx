import { goBackOrHome } from '@/features/nav';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Caption, Eyebrow, Filete, Lectura, Screen, Stack } from '@/components/ui';
import { useContent } from '@/features/content';
import { space } from '@/theme';

export default function Lector() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const f = useContent().fragments.find((x) => x.id === id);
  return (
    <Screen footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
      {f ? (
        <Stack gap={space.l} style={{ marginTop: space.xl }}>
          <Stack gap={space.s}>
            <Eyebrow>{f.author}</Eyebrow>
            <Filete />
          </Stack>
          <Lectura>«{f.text}»</Lectura>
          <Caption>{f.source}</Caption>
        </Stack>
      ) : null}
    </Screen>
  );
}
