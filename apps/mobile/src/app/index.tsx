import { Redirect } from 'expo-router';

import { useVirtus } from '@/store/virtus';

export default function Index() {
  const onboarded = useVirtus((s) => s.onboardedAt);
  return <Redirect href={onboarded ? '/hoy' : '/bienvenida'} />;
}
