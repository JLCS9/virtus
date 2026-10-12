import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ROLES, type Role } from '@virtus/method';

import { Body, Button, Caption, Field, Screen, Titular } from '@/components/ui';
import { useVirtus, type RoleBox } from '@/store/virtus';
import { color, radius, space, type } from '@/theme';

function RoleRow({
  role,
  box,
  onToggle,
  onDetail,
}: {
  role: Role;
  box: RoleBox | undefined;
  onToggle: () => void;
  onDetail: (detail: string) => void;
}) {
  const { t } = useTranslation();
  const selected = !!box;
  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: radius.m,
        borderColor: selected ? color.azulProfundo : color.piedra,
        backgroundColor: selected ? color.niebla : color.blanco,
      }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, padding: space.m, minHeight: 56 }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: radius.s,
            borderWidth: 2,
            borderColor: selected ? color.azulProfundo : color.piedra,
            backgroundColor: selected ? color.azulProfundo : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {selected ? <Text style={{ color: color.blanco, fontSize: 13, lineHeight: 15 }}>✓</Text> : null}
        </View>
        <Text style={[type.bodyStrong, { color: color.azulProfundo, flex: 1 }]}>{t(`roles.${role}`)}</Text>
      </Pressable>
      {selected ? (
        <View style={{ paddingHorizontal: space.m, paddingBottom: space.m }}>
          <Field
            label={role === 'otro' ? t('rolesPantalla.cualOtro') : t('rolesPantalla.detalle')}
            placeholder={t(`rolesPantalla.ejemplos.${role}`)}
            value={box.detail}
            maxLength={120}
            onChangeText={onDetail}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function Roles() {
  const { t } = useTranslation();
  const stored = useVirtus((s) => s.roles);
  const setRoles = useVirtus((s) => s.setRoles);
  const onboarded = useVirtus((s) => s.onboardedAt);
  const [roles, setLocal] = useState<RoleBox[]>(stored);

  const toggle = (role: Role) =>
    setLocal((rs) => (rs.some((r) => r.role === role) ? rs.filter((r) => r.role !== role) : [...rs, { role, detail: '' }]));
  const otherMissing = roles.some((r) => r.role === 'otro' && r.detail.trim().length === 0);

  const save = () => {
    // Se guardan en el orden de la lista, no en el de selección.
    setRoles(ROLES.flatMap((r) => roles.filter((x) => x.role === r)).map((r) => ({ ...r, detail: r.detail.trim() })));
    if (onboarded) router.back();
    else router.push('/mision');
  };

  return (
    <Screen footer={<Button label={t('comun.continuar')} disabled={roles.length === 0 || otherMissing} onPress={save} />}>
      <Titular eyebrow={t('rolesPantalla.eyebrow')}>{t('rolesPantalla.titulo')}</Titular>
      <Body>{t('rolesPantalla.intro')}</Body>
      <View style={{ gap: space.s }}>
        {ROLES.map((r) => (
          <RoleRow
            key={r}
            role={r}
            box={roles.find((x) => x.role === r)}
            onToggle={() => toggle(r)}
            onDetail={(detail) => setLocal((rs) => rs.map((x) => (x.role === r ? { ...x, detail } : x)))}
          />
        ))}
      </View>
      <Caption>{t('rolesPantalla.privacidad')}</Caption>
    </Screen>
  );
}
