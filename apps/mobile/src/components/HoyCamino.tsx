/**
 * «Hoy» de las cuentas con suscripción (igual que la web): el reto de la semana del Camino con tu
 * siguiente paso, tu mapa de carácter y tu resultado del test. Sustituye al reto diario de la IA.
 */
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';

import { Button, Caption, Screen, Wordmark } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { MapaCaracter } from '@/components/MapaCaracter';
import { MiResultado } from '@/components/MiResultado';
import { rutaExamen, rutaSesion } from '@/components/CaminoRetos';
import { textoConQuien } from '@/components/personas/EligeQuien';
import { TOTAL_DIAS, fechaCorta, infoDia, semanaDe, siguientePaso } from '@/lib/camino';
import { idDeClave, sugerenciaDelDia } from '@/lib/personas';
import { useCamino } from '@/features/camino';
import { usePersonas } from '@/features/personas';
import { color, fontFamily, space, type } from '@/theme';

// El reto de la semana (uno por semana; cada día cambia solo con quién) y el siguiente paso.
function RetoDeLaSemana() {
  const camino = useCamino();
  const personas = usePersonas();
  const etiqueta = (t: string) => <Text style={[type.eyebrow, { color: color.doradoClaro }]}>{t}</Text>;
  const titulo = (t: string) => <Text style={{ fontFamily: fontFamily.slab700, fontSize: 26, lineHeight: 32, color: color.blanco }}>{t}</Text>;
  const texto = (t: string) => <Text style={[type.body, { color: color.crema }]}>{t}</Text>;

  if (camino.cargando) {
    return (
      <Hero>
        {etiqueta('Tu reto de la semana')}
        {texto('Preparando tu camino…')}
      </Hero>
    );
  }
  if (camino.error) {
    return (
      <Hero>
        {etiqueta('Tu reto de la semana')}
        {texto('No he podido cargar tu camino ahora mismo.')}
        <Button label="Reintentar" onPress={() => void camino.recargar()} />
      </Hero>
    );
  }
  if (!camino.perfil) {
    return (
      <Hero>
        {etiqueta('Antes de empezar')}
        {titulo('Personaliza tu camino.')}
        {texto('Tu temperamento ya lo conocemos. Ahora cuéntanos un poco de tu vida para que el camino sea tuyo. Son dos minutos.')}
        <Button label="Empezar  →" onPress={() => router.push('/camino/onboarding')} />
      </Hero>
    );
  }

  const diaHoy = camino.diaHoy ?? 0;
  if (diaHoy > TOTAL_DIAS) {
    return (
      <Hero>
        {etiqueta('Tu camino')}
        {titulo('Has completado tus dos primeras semanas.')}
        {texto('La semana 2 llega muy pronto.')}
      </Hero>
    );
  }

  const empezado = diaHoy >= 1;
  const semana = semanaDe(empezado ? diaHoy : 1);
  const paso = siguientePaso(camino);
  const conQuien = empezado ? camino.porDia[diaHoy]?.con_quien : null;
  const sugerencia = empezado && !infoDia(diaHoy)?.cierre ? sugerenciaDelDia(personas.lista, camino.porDia, diaHoy) : null;
  return (
    <Hero>
      {etiqueta(empezado ? `Día ${diaHoy} · Tu reto de la semana` : `Empieza el ${fechaCorta(camino.perfil.inicio)}`)}
      {titulo(semana.reto)}
      {texto(semana.retoTexto)}
      <Text style={[type.cita, { color: color.piedra }]}>«{semana.frase}»</Text>
      {conQuien ? (
        <Text style={[type.body, { color: color.crema }]}>
          Hoy, con:{' '}
          <Text style={{ fontFamily: fontFamily.sans700 }}>
            {idDeClave(conQuien) ? textoConQuien(conQuien, personas.porId) : textoConQuien(conQuien).toLowerCase()}
          </Text>
        </Text>
      ) : sugerencia ? (
        <Text style={[type.body, { color: color.crema }]}>
          Hoy podrías hacerlo con <Text style={{ fontFamily: fontFamily.sans700 }}>{sugerencia.persona.nombre}</Text>
          {sugerencia.consejo ? `: ${sugerencia.consejo.charAt(0).toLowerCase()}${sugerencia.consejo.slice(1)}.` : '.'}
        </Text>
      ) : null}
      {paso && paso.tipo !== 'hecho' ? (
        <Button
          label={`${paso.tipo === 'examen' ? 'Hacer el examen de la noche' : paso.atrasada ? `Hacer el día ${paso.dia}` : 'Tu sesión de hoy'}  →`}
          onPress={() => router.push(paso.tipo === 'examen' ? rutaExamen(paso.dia) : rutaSesion(paso.dia))}
        />
      ) : empezado ? (
        <Text style={[type.bodyStrong, { color: color.doradoClaro }]}>✓ Hoy está hecho</Text>
      ) : null}
    </Hero>
  );
}

export function HoyCamino() {
  const { t, i18n } = useTranslation();
  const fecha = new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark height={24} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.yo')}
          onPress={() => router.push('/yo' as never)}
          hitSlop={12}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <Caption>{fecha}</Caption>
          <SymbolView name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} size={24} tintColor={color.azulProfundo} />
        </Pressable>
      </View>
      <RetoDeLaSemana />
      <MapaCaracter />
      <MiResultado />
    </Screen>
  );
}
