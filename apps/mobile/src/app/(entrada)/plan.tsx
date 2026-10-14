import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, Titular } from '@/components/ui';
import { PlanForm, isValidPlan } from '@/components/PlanForm';
import { track } from '@/features/analytics';
import { scheduleRitual } from '@/features/notifications';
import { useVirtus } from '@/store/virtus';

export default function PlanScreen() {
  const { t } = useTranslation();
  const s = useVirtus();
  const [plan, setPlan] = useState(s.plan);
  const [virtue, setVirtue] = useState(s.cycle?.virtue ?? s.temperament?.challengeVirtue ?? 'humildad');

  const finish = async () => {
    s.setPlan(plan);
    if (virtue !== s.cycle?.virtue) s.setCycle(virtue);
    await scheduleRitual(plan).catch(() => false);
    if (s.onboardedAt) {
      router.back();
    } else {
      s.completeOnboarding();
      track('onboarding_completed', { roles: s.roles.length, habits: plan.habits.length });
      router.replace('/hoy');
    }
  };

  return (
    <Screen
      footer={<Button label={s.onboardedAt ? t('comun.guardar') : t('plan.terminar')} disabled={!isValidPlan(plan)} onPress={finish} />}>
      <Titular eyebrow={t('plan.eyebrow')}>{t('plan.titulo')}</Titular>
      <PlanForm plan={plan} onChange={setPlan} virtue={virtue} onVirtue={setVirtue} />
    </Screen>
  );
}
