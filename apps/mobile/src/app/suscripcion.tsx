/**
 * Suscripción. Sin urgencia, sin descuentos, sin «oferta»: expone qué es Virtus y su precio.
 * Los precios vienen de la tienda (RevenueCat), nunca escritos en el código.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Card, H3, Screen, Stack, Titular } from '@/components/ui';
import { track } from '@/features/analytics';
import { goBackOrHome } from '@/features/nav';
import { purchase, restore, subscriptionsAvailable, useOffering } from '@/features/subscription';
import { space } from '@/theme';

export default function Suscripcion() {
  const { t } = useTranslation();
  const { offering, loading } = useOffering();
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => track('paywall_viewed', {}), []);

  const incluye = t('suscripcion.incluye', { returnObjects: true }) as string[];

  return (
    <Screen footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
      <Titular eyebrow={t('suscripcion.eyebrow')}>{t('suscripcion.titulo')}</Titular>
      <Body>{t('suscripcion.intro')}</Body>
      <Stack gap={space.xs}>
        {incluye.map((x) => (
          <Body key={x}>· {x}</Body>
        ))}
      </Stack>

      {!subscriptionsAvailable() ? <Caption>{t('suscripcion.noDisponible')}</Caption> : null}
      {loading ? <Caption>…</Caption> : null}
      {offering?.availablePackages.map((p) => (
        <Card key={p.identifier}>
          <H3>{p.product.title}</H3>
          <Body>{p.product.priceString}</Body>
          {p.product.description ? <Caption>{p.product.description}</Caption> : null}
          <Button
            label={t('suscripcion.suscribirme')}
            onPress={async () => {
              const ok = await purchase(p);
              if (ok) track('purchase_completed', { package: p.identifier });
              setMsg(ok ? t('suscripcion.activa') : t('suscripcion.noCompletada'));
            }}
          />
        </Card>
      ))}
      {subscriptionsAvailable() ? (
        <Button variant="ghost" label={t('suscripcion.restaurar')} onPress={async () => setMsg((await restore()) ? t('suscripcion.activa') : t('suscripcion.sinCompras'))} />
      ) : null}
      {msg ? <Caption>{msg}</Caption> : null}
      <Caption>{t('suscripcion.legal')}</Caption>
    </Screen>
  );
}
