import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ALL_TYPES, ROLES, parseType, type Role, type TypeCode } from '@virtus/method';

import { Body, BodyStrong, Button, Caption, Card, Chip, Field, H3, Row, Screen, Stack, Titular } from '@/components/ui';
import { backendEnabled, invite } from '@/features/account';
import { typeName } from '@/features/labels';
import { useVirtus, type CollaboratorBox } from '@/store/virtus';
import { space } from '@/theme';

const blank = (): CollaboratorBox => ({ id: `c-${Date.now()}`, alias: '', relation: '', role: 'trabajo', estimated: null, invitedAt: null });

export default function Circulo() {
  const { t } = useTranslation();
  const s = useVirtus();
  const [draft, setDraft] = useState<CollaboratorBox | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const userRoles = s.roles.length > 0 ? s.roles.map((r) => r.role) : [...ROLES];

  const doInvite = async (c: CollaboratorBox) => {
    const ok = await invite('temperament', c.alias);
    if (ok) s.upsertCollaborator({ ...c, invitedAt: new Date().toISOString() });
    else setNote(t('circulo.sinCuenta'));
  };

  return (
    <Screen>
      <Titular eyebrow={t('circulo.eyebrow')}>{t('circulo.titulo')}</Titular>
      <Body>{t('circulo.intro')}</Body>

      {s.collaborators.length === 0 && !draft ? <Caption>{t('circulo.vacio')}</Caption> : null}
      {s.collaborators.map((c) => (
        <Card key={c.id}>
          <H3>{c.alias}</H3>
          <Body>
            {c.relation ? `${c.relation} · ` : ''}
            {t(`roles.${c.role}`)}
          </Body>
          {c.estimated ? <Caption>{typeName(t, parseType(c.estimated))} · {t('circulo.estimadoCorto')}</Caption> : null}
          <Row>
            <Button variant="secondary" label={t('comun.editar')} onPress={() => setDraft(c)} />
            {backendEnabled() ? <Button variant="secondary" label={t('circulo.invitar')} onPress={() => doInvite(c)} /> : null}
          </Row>
        </Card>
      ))}
      {note ? <Caption>{note}</Caption> : null}

      {draft ? (
        <Card accent>
          <Stack gap={space.m}>
            <Field label={t('circulo.alias')} value={draft.alias} onChangeText={(alias) => setDraft({ ...draft, alias })} maxLength={40} />
            <Field label={t('circulo.relacion')} value={draft.relation} onChangeText={(relation) => setDraft({ ...draft, relation })} maxLength={60} />
            <View style={{ gap: space.s }}>
              <BodyStrong>{t('circulo.rol')}</BodyStrong>
              <Row>
                {userRoles.map((r) => (
                  <Chip key={r} label={t(`roles.${r}`)} selected={draft.role === r} onPress={() => setDraft({ ...draft, role: r as Role })} />
                ))}
              </Row>
            </View>
            <View style={{ gap: space.s }}>
              <BodyStrong>{t('circulo.estimado')}</BodyStrong>
              <Caption>{t('circulo.privacidad')}</Caption>
              <Row>
                {ALL_TYPES.map((code: TypeCode) => (
                  <Chip
                    key={code}
                    label={typeName(t, parseType(code))}
                    selected={draft.estimated === code}
                    onPress={() => setDraft({ ...draft, estimated: draft.estimated === code ? null : code })}
                  />
                ))}
              </Row>
            </View>
            <Button
              label={t('comun.guardar')}
              disabled={draft.alias.trim().length === 0}
              onPress={() => {
                s.upsertCollaborator({ ...draft, alias: draft.alias.trim() });
                setDraft(null);
              }}
            />
            {s.collaborators.some((c) => c.id === draft.id) ? (
              <Button
                variant="ghost"
                label={t('circulo.quitar')}
                onPress={() => {
                  s.removeCollaborator(draft.id);
                  setDraft(null);
                }}
              />
            ) : (
              <Button variant="ghost" label={t('comun.volver')} onPress={() => setDraft(null)} />
            )}
          </Stack>
        </Card>
      ) : (
        <Button variant="secondary" label={t('circulo.anadir')} onPress={() => setDraft(blank())} />
      )}
    </Screen>
  );
}
