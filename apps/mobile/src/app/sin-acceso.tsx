// Cuenta sin suscripción activa. En la web, el portal la manda a la página de su resultado
// (/tests/temperamento/gracias); en la app se le explica y se abre esa misma página.
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { salir } from '@/portal/datos';
import { olvidarAcceso } from '@/portal/hooks';
import { PAGINA_WEB, abrirWeb } from '@/portal/navegacion';
import { BEIGE } from '@/portal/tema';
import { Boton, Eyebrow, Parrafo, Tarjeta, Titulo } from '@/portal/ui';

export default function SinAcceso() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: BEIGE }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top + 48, paddingBottom: insets.bottom + 48, paddingHorizontal: 18 }}>
      <Tarjeta>
        <Eyebrow>Tu cuenta</Eyebrow>
        <Titulo tam={26} style={{ marginTop: 10, marginBottom: 10 }}>
          Tu acceso a la app aún no está activo
        </Titulo>
        <Parrafo style={{ marginBottom: 22 }}>Mientras tanto, puedes ver tu resultado del test de temperamento en la web.</Parrafo>
        <View style={{ gap: 12 }}>
          <Boton variante="sobreClaro" flecha ancho onPress={() => abrirWeb(PAGINA_WEB.resultadoTemperamento)}>
            Ver mi resultado
          </Boton>
          <Boton
            variante="contorno"
            ancho
            onPress={async () => {
              olvidarAcceso();
              await salir().catch(() => {});
              router.replace('/login');
            }}>
            Salir
          </Boton>
        </View>
      </Tarjeta>
    </ScrollView>
  );
}
