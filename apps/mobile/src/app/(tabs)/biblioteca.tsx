import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, Chip, Cita, Row, Screen, Titular } from '@/components/ui';
import { useContent } from '@/features/content';
import { useVirtus } from '@/store/virtus';

export default function Biblioteca() {
  const { t } = useTranslation();
  const content = useContent();
  const virtue = useVirtus((s) => s.cycle?.virtue ?? 'humildad');
  const [filter, setFilter] = useState<'ciclo' | 'todo'>('ciclo');
  const items = content.fragments.filter((f) => filter === 'todo' || f.virtues.length === 0 || f.virtues.includes(virtue));

  return (
    <Screen>
      <Titular eyebrow={t('biblioteca.eyebrow')}>{t('biblioteca.titulo')}</Titular>
      <Row>
        <Chip label={t(`virtudes.${virtue}`)} selected={filter === 'ciclo'} onPress={() => setFilter('ciclo')} />
        <Chip label={t('biblioteca.todos')} selected={filter === 'todo'} onPress={() => setFilter('todo')} />
      </Row>
      {items.map((f) => (
        <Pressable key={f.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/lector/[id]', params: { id: f.id } })}>
          <Card>
            <Cita author={f.author}>{f.text}</Cita>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
