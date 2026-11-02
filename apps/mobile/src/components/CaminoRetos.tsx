/**
 * «Camino» de las cuentas con suscripción: tu siguiente paso. Los 14 primeros días (semanas 0 y 1): en
 * qué día estás, la sesión de hoy, el examen de la noche y la siguiente lección, y tus personas. Sin
 * perfil, «Personaliza tu camino». Igual que la pestaña Camino de la web (mismas tablas).
 */
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Body, Button, Caption, Card, Eyebrow, H2, Screen, Titular } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { LessonThumb } from '@/components/CourseCard';
import { TarjetaPersonas } from '@/components/personas/MisPersonas';
import { DIAS, TOTAL_DIAS, conPunto, fechaCorta, infoDia, semanaDe, siguientePaso } from '@/lib/camino';
import { useCamino, type EstadoCamino } from '@/features/camino';
import { useContent } from '@/features/content';
import { formatDuration, nextLessonOverall } from '@/features/courses';
import { usePersonas } from '@/features/personas';
import { useVirtus } from '@/store/virtus';
import { color, fontFamily, radius, space, type } from '@/theme';

export const rutaSesion = (dia: number) => ({ pathname: '/camino/sesion/[dia]' as const, params: { dia: String(dia) } });
export const rutaExamen = (dia: number) => ({ pathname: '/camino/examen/[dia]' as const, params: { dia: String(dia) } });

function Progreso({ camino }: { camino: EstadoCamino }) {
  const { racha, porDia } = camino;
  const diaHoy = Math.min(camino.diaHoy ?? 1, TOTAL_DIAS);
  const hechas = Object.values(porDia).filter((d) => d?.sesion_en).length;
  const semana = semanaDe(diaHoy);
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s }}>
        <Eyebrow style={{ flexShrink: 1 }}>
          Semana {semana.numero} · {semana.titulo}
        </Eyebrow>
        {racha > 0 ? (
          <Text style={[type.caption, { fontFamily: fontFamily.sans700, color: color.pizarra }]}>
            🔥 {racha} {racha === 1 ? 'día seguido' : 'días seguidos'}
          </Text>
        ) : null}
      </View>
      <Text style={[type.h1, { color: color.azulProfundo }]}>
        Día {diaHoy} de {TOTAL_DIAS}
      </Text>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: color.bruma, overflow: 'hidden' }}>
        <View style={{ width: `${(hechas / TOTAL_DIAS) * 100}%`, height: 6, backgroundColor: color.doradoVirtud }} />
      </View>
      <Caption>
        {hechas} de {TOTAL_DIAS} sesiones hechas
      </Caption>
      <Tira camino={camino} />
    </Card>
  );
}

function Tira({ camino }: { camino: EstadoCamino }) {
  const { porDia } = camino;
  const diaHoy = camino.diaHoy ?? 0;
  return (
    <View style={{ gap: space.m, marginTop: space.s }}>
      {[0, 1].map((s) => (
        <View key={s} style={{ gap: space.s }}>
          <Text style={[type.caption, { fontFamily: fontFamily.sans700, color: color.plomo }]}>Semana {s}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {DIAS.slice(s * 7, s * 7 + 7).map((d) => {
              const hecho = !!porDia[d.dia]?.sesion_en;
              const abierto = d.dia <= diaHoy;
              const esHoy = d.dia === diaHoy;
              return (
                <Pressable
                  key={d.dia}
                  accessibilityRole="button"
                  accessibilityLabel={`Día ${d.dia}: ${d.titulo}${hecho ? ' (hecho)' : ''}`}
                  accessibilityState={{ disabled: !abierto }}
                  disabled={!abierto}
                  onPress={() => router.push(rutaSesion(d.dia))}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: radius.l,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: hecho ? color.azulProfundo : esHoy ? 'rgba(165,139,38,0.14)' : 'transparent',
                    borderWidth: esHoy ? 2 : 1,
                    borderColor: esHoy ? color.doradoVirtud : hecho ? color.azulProfundo : color.bruma,
                  }}>
                  <Text style={{ fontFamily: fontFamily.sans700, fontSize: 14, color: hecho ? color.blanco : abierto ? color.azulProfundo : color.piedra }}>
                    {hecho ? '✓' : d.tipo === 'video' ? '▶' : d.cierre ? '★' : d.dia}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function SiguientePaso({ camino }: { camino: EstadoCamino }) {
  const paso = siguientePaso(camino);
  if (!paso) return null;
  const etiqueta = (t: string) => <Text style={[type.eyebrow, { color: color.doradoClaro }]}>{t}</Text>;

  if (paso.tipo === 'hecho') {
    const manana = infoDia(paso.dia + 1);
    return (
      <Hero>
        {etiqueta('Tu siguiente paso')}
        <Text style={[type.h1, { color: color.blanco }]}>Hoy está hecho.</Text>
        <Text style={[type.body, { color: color.crema }]}>
          {manana ? `Mañana, día ${manana.dia}: ${conPunto(manana.titulo)}` : 'Has llegado al final de tus dos primeras semanas.'}
        </Text>
      </Hero>
    );
  }

  const info = infoDia(paso.dia)!;
  const examen = paso.tipo === 'examen';
  const atrasada = paso.tipo === 'sesion' && paso.atrasada;
  return (
    <Hero>
      {etiqueta(atrasada ? 'Te quedó pendiente' : examen ? 'Esta noche' : 'Tu siguiente paso')}
      <Text style={[type.caption, { color: color.piedra }]}>
        Día {paso.dia}
        {examen ? '' : ` · ${info.tiempo}`}
      </Text>
      <Text style={[type.h1, { color: color.blanco }]}>{examen ? 'Examen de la noche' : info.titulo}</Text>
      <Button
        label={`${examen ? 'Mirar mi día · 45 s' : atrasada ? 'Hacerla ahora' : 'Empezar'}  →`}
        onPress={() => router.push(examen ? rutaExamen(paso.dia) : rutaSesion(paso.dia))}
      />
    </Hero>
  );
}

function SiguienteLeccion() {
  const { t } = useTranslation();
  const content = useContent();
  const watched = useVirtus((s) => s.watched);
  const lastLesson = useVirtus((s) => s.lastLesson);
  const siguiente = nextLessonOverall(content.courses, watched, lastLesson);
  if (!siguiente) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/leccion/[id]', params: { id: siguiente.lesson.id } })}>
      {({ pressed }) => (
        <Hero style={{ opacity: pressed ? 0.9 : 1 }}>
          <Text style={[type.eyebrow, { color: color.doradoClaro }]}>{t('caminoRetos.siguienteLeccion')}</Text>
          <View style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
            <LessonThumb lesson={siguiente.lesson} width={128} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.bodyStrong, { color: color.blanco }]} numberOfLines={3}>
                {siguiente.lesson.id} · {siguiente.lesson.titulo}
              </Text>
              <Text style={[type.caption, { color: color.piedra }]} numberOfLines={2}>
                {t('cursos.curso', { n: siguiente.course.numero })} · {siguiente.course.titulo} · {formatDuration(t, siguiente.lesson.duracion)}
              </Text>
            </View>
          </View>
        </Hero>
      )}
    </Pressable>
  );
}

export function CaminoRetos() {
  const camino = useCamino();
  const personas = usePersonas();

  if (camino.cargando) {
    return (
      <Screen>
        <Caption>Cargando tu camino…</Caption>
      </Screen>
    );
  }
  if (camino.error) {
    return (
      <Screen>
        <Body>No he podido cargar tu camino ahora mismo.</Body>
        <Button variant="secondary" label="Reintentar" onPress={() => void camino.recargar()} />
      </Screen>
    );
  }

  const { diaHoy, perfil } = camino;
  return (
    <Screen>
      <Titular eyebrow="Tu camino">Tu siguiente paso</Titular>
      <Caption>Cada semana, un vídeo. Cada día, cinco minutos. Cada noche, un momento para mirar tu día.</Caption>

      {!perfil ? (
        <Hero>
          <Text style={[type.eyebrow, { color: color.doradoClaro }]}>Antes de empezar</Text>
          <Text style={[type.h1, { color: color.blanco }]}>Personaliza tu camino.</Text>
          <Text style={[type.body, { color: color.crema }]}>Tu temperamento ya lo conocemos. Ahora cuéntanos un poco de tu vida para que el camino sea tuyo. Son dos minutos.</Text>
          <Button label="Empezar  →" onPress={() => router.push('/camino/onboarding')} />
        </Hero>
      ) : diaHoy !== null && diaHoy < 1 ? (
        <Card>
          <Eyebrow>Tu camino</Eyebrow>
          <H2>Empieza el {fechaCorta(perfil.inicio)}</H2>
          <Body>
            Ese día verás tu primer vídeo y empezará tu primer reto: <Text style={{ fontFamily: fontFamily.sans700 }}>{semanaDe(1).reto.toLowerCase()}</Text>.
          </Body>
          <Body>Cada semana, un vídeo. Cada día, cinco minutos. Cada noche, un momento para mirar tu día.</Body>
          <Button variant="secondary" label="Cambiar el día del vídeo" onPress={() => router.push('/camino/onboarding')} />
        </Card>
      ) : diaHoy !== null && diaHoy > TOTAL_DIAS ? (
        <Card>
          <Eyebrow>Tu camino</Eyebrow>
          <H2>Has completado tus dos primeras semanas</H2>
          <Body>Tu próximo vídeo: el carácter se construye sobre la base del temperamento. La semana 2 llega muy pronto.</Body>
        </Card>
      ) : (
        <>
          <SiguientePaso camino={camino} />
          <SiguienteLeccion />
        </>
      )}

      {perfil && diaHoy !== null && diaHoy >= 1 ? <Progreso camino={camino} /> : null}
      {!personas.cargando ? (
        <TarjetaPersonas
          personas={personas.lista}
          onCrear={() => router.push('/personas/nueva')}
          onVer={(id) => (id ? router.push({ pathname: '/personas/[id]', params: { id } }) : router.push('/personas'))}
        />
      ) : null}
    </Screen>
  );
}
