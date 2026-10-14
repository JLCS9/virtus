/**
 * Suscripciones con RevenueCat (App Store, Google Play y web con Stripe).
 * PAYWALL_ENABLED queda en false hasta decidir qué parte de Virtus es de pago:
 * mientras tanto nada se bloquea.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';

export const PAYWALL_ENABLED = false;
export const ENTITLEMENT = 'virtus';

const KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configured = false;

export function subscriptionsAvailable(): boolean {
  return Platform.OS !== 'web' && !!KEY;
}

export function configurePurchases(): void {
  if (configured || !subscriptionsAvailable()) return;
  Purchases.configure({ apiKey: KEY! });
  configured = true;
}

/** Vincula la compra a la cuenta de Supabase (el webhook usa este id). */
export async function linkPurchasesUser(userId: string): Promise<void> {
  if (!configured) return;
  await Purchases.logIn(userId).catch(() => null);
}

export async function hasEntitlement(): Promise<boolean> {
  if (!PAYWALL_ENABLED) return true;
  if (!configured) return false;
  const info = await Purchases.getCustomerInfo().catch(() => null);
  return !!info?.entitlements.active[ENTITLEMENT];
}

export function useOffering(): { offering: PurchasesOffering | null; loading: boolean } {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(configured);
  useEffect(() => {
    if (!configured) return;
    Purchases.getOfferings()
      .then((o) => setOffering(o.current))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);
  return { offering, loading };
}

export async function purchase(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return !!customerInfo.entitlements.active[ENTITLEMENT];
  } catch {
    return false;
  }
}

export async function restore(): Promise<boolean> {
  if (!configured) return false;
  const info = await Purchases.restorePurchases().catch(() => null);
  return !!info?.entitlements.active[ENTITLEMENT];
}
