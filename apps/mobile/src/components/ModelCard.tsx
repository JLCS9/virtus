import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import type { Model } from '@virtus/content';

import { color, fontFamily, radius, space, type } from '@/theme';

export function initials(name: string) {
  return name
    .split(' ')
    .filter((w) => w[0] && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

/** Monograma sobre azul: la figura se distingue por su nombre, no por una foto sin derechos. */
export function Monogram({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color.azulProfundo,
        borderWidth: 2,
        borderColor: color.doradoClaro,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontFamily: fontFamily.slab700, fontSize: size * 0.36, color: color.blanco }}>{initials(name)}</Text>
    </View>
  );
}

export function ModelCard({ model, width = 200 }: { model: Model; width?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/modelo/[id]', params: { id: model.id } })}
      style={({ pressed }) => ({
        width,
        padding: space.m,
        gap: space.s,
        borderRadius: radius.l,
        borderWidth: 1,
        borderColor: color.bruma,
        backgroundColor: color.blanco,
        opacity: pressed ? 0.85 : 1,
      })}>
      <Monogram name={model.nombre} />
      <Text style={[type.h3, { color: color.azulProfundo }]} numberOfLines={2}>
        {model.nombre}
      </Text>
      <Text style={[type.caption, { color: color.pizarra }]}>
        {model.ambito} · {model.años}
      </Text>
      {model.lema ? (
        <Text style={[type.cita, { color: color.pizarra, fontSize: 15, lineHeight: 22 }]} numberOfLines={3}>
          «{model.lema}»
        </Text>
      ) : null}
    </Pressable>
  );
}
