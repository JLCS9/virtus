import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ROLES, type Role } from '@virtus/method';

import { Body, Button, Chip, Field, Row, Screen, Titular } from '@/components/ui';
import { useVirtus, type RoleBox } from '@/store/virtus';
import { space } from '@/theme';

export default function Roles() {
  const { t } = useTranslation();
  const stored = useVirtus((s) => s.roles);
  const setRoles = useVirtus((s) => s.setRoles);
  const onboarded = useVirtus((s) => s.onboardedAt);
  const [roles, setLocal] = useState<RoleBox[]>(stored);

  const toggle = (role: Role) =>
    setLocal((rs) => (rs.some((r) => r.role === role) ? rs.filter((r) => r.role !== role) : [...rs, { role, detail: '' }]));

  const save = () => {
    setRoles(roles);
    if (onboarded) router.back();
    else router.push('/mision');
  };

  return (
    <Screen footer={<Button label={t('comun.continuar')} disabled={roles.length === 0} onPress={save} />}>
      <Titular eyebrow={t('rolesPantalla.eyebrow')}>{t('rolesPantalla.titulo')}</Titular>
      <Body>{t('rolesPantalla.intro')}</Body>
      <Row>
        {ROLES.map((r) => (
          <Chip key={r} label={t(`roles.${r}`)} selected={roles.some((x) => x.role === r)} onPress={() => toggle(r)} />
        ))}
      </Row>
      {roles.map((r) => (
        <Field
          key={r.role}
          label={t(`roles.${r.role}`)}
          hint={t('rolesPantalla.detalle')}
          placeholder={t('rolesPantalla.detallePlaceholder')}
          value={r.detail}
          maxLength={120}
          onChangeText={(detail) => setLocal((rs) => rs.map((x) => (x.role === r.role ? { ...x, detail } : x)))}
          style={{ marginBottom: space.xs }}
        />
      ))}
    </Screen>
  );
}
