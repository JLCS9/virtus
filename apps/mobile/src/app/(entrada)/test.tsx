import { router } from 'expo-router';

import { TbpTest } from '@/components/TbpTest';
import { track } from '@/features/analytics';
import { useContent } from '@/features/content';
import { useVirtus } from '@/store/virtus';

export default function TestTemperamento() {
  const test = useContent().vlTests.temperament;
  const setTemperament = useVirtus((s) => s.setTemperament);
  return (
    <TbpTest
      test={test}
      onDone={(r) => {
        track('test_completed', { kind: 'temperament', repeat: useVirtus.getState().temperamentHistory.length > 0 });
        setTemperament(r);
        router.replace('/revelacion');
      }}
    />
  );
}
