import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Card, Field, H3, Screen, Stack, Titular } from '@/components/ui';
import { useVirtus } from '@/store/virtus';
import { space } from '@/theme';

export default function Mision() {
  const { t } = useTranslation();
  const s = useVirtus();
  const [mission, setMission] = useState(s.mission);
  const [notes, setNotes] = useState(s.missionNotes);
  const [itinerary, setItinerary] = useState(!!(s.missionNotes.historia || s.missionNotes.talento || s.missionNotes.desafio));

  const save = () => {
    s.setMission(mission.trim(), notes);
    if (s.onboardedAt) router.back();
    else router.push('/plan');
  };

  return (
    <Screen footer={<Button label={t('comun.continuar')} onPress={save} />}>
      <Titular eyebrow={t('mision.eyebrow')}>{t('mision.titulo')}</Titular>
      <Body>{t('mision.intro')}</Body>
      <Field label={t('mision.campo')} placeholder={t('mision.placeholder')} value={mission} onChangeText={setMission} maxLength={140} multiline />
      <Caption>{t('mision.distincion')}</Caption>

      {!itinerary ? (
        <Button variant="secondary" label={t('mision.noLaTengo')} onPress={() => setItinerary(true)} />
      ) : (
        <Card accent>
          <H3>{t('mision.itinerarioTitulo')}</H3>
          <Body>{t('mision.itinerarioIntro')}</Body>
          <Stack gap={space.m} style={{ marginTop: space.s }}>
            <Field label={t('mision.q1')} value={notes.historia} onChangeText={(historia) => setNotes((n) => ({ ...n, historia }))} multiline />
            <Field label={t('mision.q2')} value={notes.talento} onChangeText={(talento) => setNotes((n) => ({ ...n, talento }))} multiline />
            <Field label={t('mision.q3')} value={notes.desafio} onChangeText={(desafio) => setNotes((n) => ({ ...n, desafio }))} multiline />
          </Stack>
        </Card>
      )}
    </Screen>
  );
}
