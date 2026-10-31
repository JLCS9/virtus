/**
 * Analítica de producto con PostHog (UE). Solo con consentimiento expreso (opt-in),
 * solo eventos de esta lista blanca y nunca contenido del diario, misión, roles,
 * colaboradores ni resultados de tests.
 */
import PostHog from 'posthog-react-native';

import { useVirtus } from '@/store/virtus';

type Events = {
  onboarding_completed: { roles: number; habits: number };
  test_completed: { kind: 'temperament' | 'character'; repeat: boolean };
  challenge_accepted: { rerolls: number; adapted: boolean; source?: 'servidor' };
  challenge_rerolled: Record<string, never>;
  exam_completed: { format: 'breve' | 'completo' | 'guiado'; prisa?: boolean };
  weekly_opened: Record<string, never>;
  cycle_closed: { with_external_view: boolean; next_is_challenge: boolean };
  invite_created: { kind: 'temperament' | 'character_view' };
  paywall_viewed: Record<string, never>;
  purchase_completed: { package: string };
};

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
let client: PostHog | null = null;

function get(): PostHog | null {
  if (!KEY || !useVirtus.getState().plan.analytics) return null;
  client ??= new PostHog(KEY, {
    host: 'https://eu.i.posthog.com',
    captureAppLifecycleEvents: false,
    personProfiles: 'never',
    disableGeoip: true,
  });
  return client;
}

export function track<E extends keyof Events>(event: E, props: Events[E]): void {
  try {
    get()?.capture(event, props as Record<string, string | number | boolean>);
  } catch {
    // La analítica nunca debe romper la app.
  }
}

/** Al retirar el consentimiento se borran la cola local y el identificador anónimo. */
export async function setAnalyticsConsent(enabled: boolean): Promise<void> {
  useVirtus.getState().setPlan({ analytics: enabled });
  if (!enabled && client) {
    await client.reset();
    await client.optOut();
    client = null;
  }
}
