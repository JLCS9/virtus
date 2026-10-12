import { Linking, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Screen, Titular } from '@/components/ui';
import { useContent } from '@/features/content';
import { goBackOrHome } from '@/features/nav';
import { color, space, type } from '@/theme';

/** Lista de obras recomendadas por Alex. Música y películas abren una búsqueda en YouTube. */
export default function EntornoScreen() {
  const { t } = useTranslation();
  const { seccion } = useLocalSearchParams<{ seccion: string }>();
  const env = useContent().environment;
  const s = env.secciones.find((x) => x.id === seccion);
  if (!s) return null;
  const searchable = s.id === 'musica' || s.id === 'peliculas';
  const destacado = env.destacados[s.id];
  return (
    <Screen footer={<Button variant="secondary" label={t('comun.volver')} onPress={goBackOrHome} />}>
      <Titular eyebrow={t('biblioteca.entorno')}>{s.titulo}</Titular>
      <Body>{env.intro}</Body>
      <View>
        {s.items.map((item) => {
          const [autor, obra] = item.split(' · ');
          const star = item === destacado;
          return (
            <Pressable
              key={item}
              disabled={!searchable}
              accessibilityRole={searchable ? 'link' : 'text'}
              onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${autor} ${obra}`)}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: space.m, borderBottomWidth: 1, borderBottomColor: color.bruma }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.bodyStrong, { color: color.azulProfundo }]}>{obra ?? item}</Text>
                <Text style={[type.caption, { color: color.pizarra }]}>
                  {autor}
                  {star ? ` · ${t('biblioteca.favoritaAlex')}` : ''}
                </Text>
              </View>
              {searchable ? <SymbolView name={{ ios: 'play.circle', android: 'play_circle', web: 'play_circle' }} size={26} tintColor={color.doradoVirtud} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Caption>{env.fuente}</Caption>
    </Screen>
  );
}
