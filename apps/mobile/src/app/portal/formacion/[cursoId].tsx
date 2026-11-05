// Curso / módulo con sus pasos (src/formacion/Modulo.jsx de la web): curso-1 se lee del módulo
// local (modulo1.json); el resto, del catálogo. Progreso y notas en el dispositivo, como en la web.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { User } from '@supabase/supabase-js';

import { ESPACIO_BURBUJA } from '@/portal/Shell';
import { IconoCheck, IconoChevron, IconoCuestionario, IconoEjercicio, IconoVideo } from '@/portal/Iconos';
import { Boton, Cargando } from '@/portal/ui';
import { useSession } from '@/portal/hooks';
import { fetchLatestTemperament } from '@/portal/datos';
import { BEIGE, GOLD_REF, GOLD_REF_DK, LINE, MUTED, NAVY, TEMP_COLORS, em, eyebrow, fuente, parrafo, tarjeta, titulo } from '@/portal/tema';
import { UMBRAL_VISTA } from '@/portal/web/formacion/cursos.js';
import { continuarModulo, moduloDelPaso, pasoAnterior, pasosDelUsuario, pasosVisibles, progresoModulo, siguientePaso, videoAnterior } from '@/portal/web/formacion/flujoModulo.js';
import MODULO_1 from '@/portal/web/data/modulo1.json';
import {
  CirculoPersonas,
  ConclusionModulo,
  Define,
  Desliza,
  Identifica,
  Quiz,
  ReflexionGuiada,
  RetosTemperamento,
  Sintesis,
  TemperamentoPerfil,
  TestCaracterFormacion,
  TestCorazonFormacion,
  TestProfundo,
} from '@/portal/formacion/actividades';
import { BarraPaginas, Fundido } from '@/portal/formacion/actividades/Temperamento';
import { BlocDeNotas } from '@/portal/formacion/BlocDeNotas';
import { CuadernoPersonal } from '@/portal/formacion/CuadernoPersonal';
import { BotonDorado, CajaBorde, SubirContext, lh, tb, ts, versalita } from '@/portal/formacion/comun';
import { Anillo, Continuar, Reproductor, Volver } from '@/portal/formacion/piezas';
import { useCatalogo } from '@/portal/formacion/useFormacion';
import { useModuloProgreso, type Completados, type ModuloProgreso } from '@/portal/formacion/useModulo';
import { useNotas } from '@/portal/formacion/useNotas';

type Temp = { primary: string; secondary: string | null } | null;
type Paso = any;

const MODULOS: Record<string, any> = { 'curso-1': MODULO_1 };

function catalogoAModulo(curso: any) {
  const pasos: Paso[] = curso.lecciones.map((l: any, i: number) => ({
    id: l.id,
    num: i + 1,
    tipo: 'video',
    titulo: l.titulo,
    vimeoId: l.vimeoId,
    visible: true,
  }));

  if (curso.numero === 4) {
    pasos.push({
      id: 'curso4-test-caracter',
      num: pasos.length + 1,
      tipo: 'test_caracter',
      titulo: 'Test de carácter (comparativa)',
      descripcion: 'Repite el test de carácter para comparar tu progreso desde el inicio del curso 1.',
      visible: true,
    });
  }

  if (curso.numero === 5) {
    pasos.push({
      id: 'curso5-test-corazon',
      num: pasos.length + 1,
      tipo: 'test_corazon',
      titulo: 'Test del corazón',
      descripcion: 'Evalúa la libertad de tu corazón. 32 preguntas sobre las ocho enfermedades espirituales que pueden afectar a la razón, la voluntad y el corazón.',
      visible: true,
    });
  }

  return { id: `curso${curso.numero}`, titulo: curso.titulo, curso: curso.numero, descripcion: `${pasos.length} módulos`, pasos };
}

const TEMP_NOMBRE: Record<string, string> = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };

function mapTemp(result: any): Temp {
  if (!result) return null;
  const p = result.primario ?? result.primary;
  const s = result.secundario ?? result.secondary ?? null;
  if (!TEMP_COLORS[p]) return null;
  return { primary: p, secondary: s };
}

function agruparIntro(parrafos?: string[]) {
  if (!parrafos || !parrafos.length) return [];
  return parrafos.map((p) => [p]);
}

/* ─── INTRO DEL VÍDEO ─── */

/** Chip que entra con fundido y desplazamiento (animación vlChipIn de la web). */
function Chip({ children, i }: { children: ReactNode; i: number }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 450, delay: i * 160, useNativeDriver: true }).start();
  }, [v, i]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        backgroundColor: 'rgba(165,139,38,0.08)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 18,
      }}>
      <Text style={tb(16, GOLD_REF_DK, 600, { letterSpacing: em(0.01, 16) })}>{children}</Text>
    </Animated.View>
  );
}

const textoIntro = tb(20, NAVY, 400, { lineHeight: lh(20, 1.75) });
const B = ({ children }: { children: ReactNode }) => <Text style={tb(20, NAVY, 700)}>{children}</Text>;

function Chips({ lista }: { lista: string[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, marginBottom: 8 }}>
      {lista.map((t, i) => (
        <Chip key={t} i={i}>
          {t}
        </Chip>
      ))}
    </View>
  );
}

function PasoVideo({
  paso,
  pasos,
  progreso,
  avanzar,
  retroceder,
  volver,
  notasProps,
  subir,
}: {
  paso: Paso;
  pasos: Paso[];
  progreso: ModuloProgreso;
  avanzar: () => void;
  retroceder: (() => void) | null;
  volver: () => void;
  notasProps?: { videos: Paso[]; completados: Completados; notas: any; onAgregar: (p: string, t: string) => void; onEliminar: (p: string, n: string) => void };
  subir: () => void;
}) {
  const completado = Boolean(progreso.completados[paso.id]);
  const lec = moduloDelPaso(pasos, paso.id);
  const paginas = agruparIntro(paso.intro);
  const [introIdx, setIntroIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const enIntro = paginas.length > 0 && introIdx < paginas.length;

  function onProgreso(frac: number) {
    if (frac >= UMBRAL_VISTA && !completado) progreso.completar(paso.id);
  }

  function avanzarYMarcar() {
    if (!completado) progreso.completar(paso.id);
    avanzar();
  }

  function avanzarIntro() {
    setVisible(false);
    setTimeout(() => {
      setIntroIdx((i) => i + 1);
      setVisible(true);
      subir();
    }, 300);
  }

  if (enIntro) {
    const pags = paginas[introIdx];
    const esUltima = introIdx === paginas.length - 1;
    return (
      <View>
        <Volver onPress={volver} style={{ marginBottom: 14 }}>
          ← Salir al curso
        </Volver>
        <View style={tarjeta}>
          <Text style={eyebrow}>{lec ? `Módulo ${lec.numero}` : 'Introducción'}</Text>
          <Text style={ts(30, NAVY, { marginTop: 8, marginBottom: 8 })}>{paso.titulo}</Text>
          <Text style={tb(14, MUTED, 400, { marginBottom: 20 })}>
            {introIdx + 1} de {paginas.length}
          </Text>
          <BarraPaginas actual={introIdx + 1} total={paginas.length} />
          <Fundido visible={visible} style={{ paddingVertical: 24, gap: 14 }}>
            {paso.id === 'm1-01' && introIdx === 1 ? (
              <>
                <Text style={textoIntro}>El temperamento es una predisposición natural e innata a reaccionar de una determinada manera.</Text>
                <Text style={[textoIntro, { marginTop: 6 }]}>Puede ser:</Text>
                <Chips lista={['Colérico', 'Melancólico', 'Sanguíneo', 'Flemático']} />
                <Text style={textoIntro}>
                  Nacemos con nuestro temperamento y <B>no podemos cambiarlo</B>: morimos con las cualidades y defectos de nuestro temperamento.
                </Text>
              </>
            ) : paso.id === 'm1-01' && introIdx === 2 ? (
              <>
                <Text style={textoIntro}>Sobre la base de nuestro temperamento, construimos nuestro carácter.</Text>
                <Text style={[textoIntro, { marginTop: 14 }]}>El carácter se compone de virtudes como:</Text>
                <Chips lista={['Prudencia', 'Valor', 'Autocontrol', 'Justicia', 'Magnanimidad', 'Humildad']} />
                <Text style={textoIntro}>Las virtudes son hábitos morales, fortalezas espirituales que se adquieren y desarrollan con la práctica.</Text>
                <Text style={[textoIntro, { marginTop: 14 }]}>
                  <B>No nacemos con nuestro carácter, lo construimos.</B>
                </Text>
              </>
            ) : (
              pags.map((p, i) => (
                <Text key={i} style={textoIntro}>
                  {p}
                </Text>
              ))
            )}
          </Fundido>
          <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
            <BotonDorado onPress={avanzarIntro} size={18} padV={14} padH={36}>
              {esUltima ? 'Ver vídeo →' : 'Siguiente →'}
            </BotonDorado>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Volver onPress={volver} style={{ marginBottom: -10 }}>
        ← Salir al curso
      </Volver>
      <Reproductor leccion={{ id: paso.id, vimeoId: paso.vimeoId, titulo: paso.titulo }} onProgreso={onProgreso} />
      <View>
        <View style={tarjeta}>
          <Text style={eyebrow}>{lec ? `Módulo ${lec.numero}` : 'Vídeo'}</Text>
          <Text style={[titulo(26), { marginTop: 8, marginBottom: 6 }]}>{paso.titulo}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            {retroceder && (
              <Boton variante="sobreClaro" onPress={retroceder}>
                ← Anterior
              </Boton>
            )}
            <Boton onPress={avanzarYMarcar} flecha>
              {completado ? 'Siguiente' : 'Marcar como visto y seguir'}
            </Boton>
          </View>
        </View>
        {notasProps && <BlocDeNotas {...notasProps} pasoActualId={paso.id} />}
      </View>
    </View>
  );
}

function PasoActividad({ paso, pasos, temperamento, progreso, avanzar, volver, user }: { paso: Paso; pasos: Paso[]; temperamento: Temp; progreso: ModuloProgreso; avanzar: () => void; volver: () => void; user: User }) {
  const vidCtx = videoAnterior(pasos, paso.id);
  const mod = vidCtx ? moduloDelPaso(pasos, vidCtx.id) : null;
  const moduloNum = mod?.numero ?? 0;

  function completar(resultado?: any) {
    progreso.completar(paso.id, resultado);
    avanzar();
  }

  switch (paso.tipo) {
    case 'quiz':
      return <Quiz paso={paso} onComplete={completar} modulo={moduloNum} />;
    case 'define':
      return <Define paso={paso} onComplete={completar} modulo={moduloNum} />;
    case 'desliza':
      return <Desliza paso={paso} onComplete={completar} modulo={moduloNum} />;
    case 'identifica':
      return <Identifica paso={paso} onComplete={completar} modulo={moduloNum} />;
    case 'test_profundo':
      return <TestProfundo paso={paso} onComplete={completar} modulo={moduloNum} />;
    case 'temperamento_perfil':
      return <TemperamentoPerfil paso={paso} temperamento={temperamento} onComplete={completar} />;
    case 'retos_temperamento':
      return <RetosTemperamento paso={paso} temperamento={temperamento} onComplete={completar} />;
    case 'circulo_personas':
      return <CirculoPersonas paso={paso} user={user} onComplete={completar} />;
    case 'conclusion_modulo':
      return <ConclusionModulo paso={paso} completados={progreso.completados} onContinuar={completar} onVolver={volver} />;
    case 'reflexion_guiada':
      return <ReflexionGuiada paso={paso} temperamento={temperamento} onComplete={completar} />;
    case 'test_caracter':
      return <TestCaracterFormacion paso={paso} onComplete={completar} />;
    case 'test_corazon':
      return <TestCorazonFormacion paso={paso} onComplete={completar} />;
    case 'cierre':
      return <Sintesis paso={paso} temperamento={temperamento} onComplete={completar} />;
    default:
      return <Text style={tb(16, NAVY)}>Tipo desconocido: {paso.tipo}</Text>;
  }
}

function agruparModulos(pasos: Paso[]) {
  const modulos: { video: Paso; actividades: Paso[] }[] = [];
  let actual: { video: Paso; actividades: Paso[] } | null = null;
  for (const p of pasos) {
    if (p.tipo === 'video') {
      actual = { video: p, actividades: [] };
      modulos.push(actual);
    } else if (actual && p.tipo !== 'noop' && p.tipo !== 'cierre' && p.tipo !== 'conclusion_modulo' && p.tipo !== 'reflexion_guiada' && p.tipo !== 'test_caracter') {
      actual.actividades.push(p);
    }
  }
  return modulos;
}

function puntuacionActividad(completado: any) {
  if (!completado) return null;
  if (typeof completado.aciertos === 'number' && typeof completado.total === 'number') return `${completado.aciertos}/${completado.total}`;
  return null;
}

function tituloActividad(act: Paso): string {
  if (act.tipo === 'define') return act.titulo.replace(/^Define\b/, 'Definiciones');
  if (act.tipo === 'quiz') return act.titulo.replace(/^Quiz\b/, 'Cuestionario');
  return act.titulo;
}

function etiquetaPaso(paso: Paso): string {
  if (paso.tipo === 'quiz') return 'Cuestionario';
  if (paso.tipo === 'define') return 'Definiciones';
  if (paso.tipo === 'test_profundo') return 'Test';
  if (paso.tipo === 'temperamento_perfil') return 'Tu perfil';
  if (paso.tipo === 'retos_temperamento') return 'Retos';
  if (paso.tipo === 'reflexion_guiada') return 'Reflexión';
  if (paso.tipo === 'cierre') return 'Síntesis';
  if (paso.tipo === 'conclusion_modulo') return 'Resumen';
  if (paso.tipo === 'test_caracter') return 'Test de carácter';
  if (paso.tipo === 'test_corazon') return 'Test del corazón';
  return paso.titulo;
}

function Circulito({ hecho, children, tam = 28 }: { hecho: boolean; children: ReactNode; tam?: number }) {
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: tam / 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: hecho ? 0 : 1.5,
        borderColor: LINE,
        backgroundColor: hecho ? GOLD_REF : 'transparent',
      }}>
      {children}
    </View>
  );
}

function ListaLecciones({ pasos, completados, irA }: { pasos: Paso[]; completados: Completados; irA: (id: string) => void }) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const modulos = agruparModulos(Array.from(pasos || []));

  return (
    <View style={[tarjeta, { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' }]}>
      {modulos.map((mod, i) => {
        const isOpen = abierto === i;
        const videoHecho = Boolean(completados[mod.video.id]);
        const actsDone = mod.actividades.filter((a) => completados[a.id]).length;
        const allActsDone = mod.actividades.length > 0 && actsDone === mod.actividades.length;
        const todoHecho = videoHecho && (mod.actividades.length === 0 || allActsDone);

        return (
          <View key={mod.video.id} style={{ borderBottomWidth: i < modulos.length - 1 ? 1 : 0, borderBottomColor: LINE }}>
            <Pressable
              onPress={() => setAbierto(isOpen ? null : i)}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18, backgroundColor: pressed ? 'rgba(27,42,74,0.04)' : 'transparent' })}>
              <Circulito hecho={todoHecho}>{todoHecho ? <IconoCheck size={14} color="#fff" /> : <Text style={{ ...fuente.slab(700), fontSize: 13, color: NAVY }}>{i}</Text>}</Circulito>
              <Text style={tb(14.5, NAVY, 500, { flex: 1, minWidth: 0 })}>
                Módulo {i}: {mod.video.titulo}
              </Text>
              <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                <IconoChevron size={16} color={MUTED} />
              </View>
            </Pressable>

            {isOpen && (
              <View style={{ paddingRight: 18, paddingBottom: 14, paddingLeft: 58 }}>
                {mod.actividades.some((a) => puntuacionActividad(completados[a.id])) && (
                  <View style={{ alignItems: 'flex-end', paddingTop: 4, paddingBottom: 2 }}>
                    <Text style={versalita(10)}>Resultado</Text>
                  </View>
                )}

                <Pressable
                  onPress={() => irA(mod.video.id)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: mod.actividades.length > 0 ? 1 : 0, borderBottomColor: LINE, opacity: pressed ? 0.6 : 1 })}>
                  <View style={{ width: 14 }}>{videoHecho && <IconoCheck size={14} color={GOLD_REF} />}</View>
                  <View style={{ opacity: 0.5 }}>
                    <IconoVideo size={15} color={MUTED} />
                  </View>
                  <Text style={tb(14, NAVY, 400, { flex: 1 })}>Vídeo</Text>
                </Pressable>

                {mod.actividades.map((act, j) => {
                  const actHecho = completados[act.id];
                  const score = puntuacionActividad(actHecho);
                  return (
                    <Pressable
                      key={act.id}
                      onPress={() => irA(act.id)}
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: j < mod.actividades.length - 1 ? 1 : 0, borderBottomColor: LINE, opacity: pressed ? 0.6 : 1 })}>
                      <View style={{ width: 14 }}>{actHecho && <IconoCheck size={14} color={GOLD_REF} />}</View>
                      <View style={{ opacity: 0.5 }}>{act.tipo === 'quiz' ? <IconoCuestionario size={15} color={MUTED} /> : <IconoEjercicio size={15} color={MUTED} />}</View>
                      <Text style={tb(14, NAVY, 400, { flex: 1 })}>{tituloActividad(act)}</Text>
                      {score && <Text style={tb(12, GOLD_REF_DK, 600)}>{score}</Text>}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function ResumenPersonal({ temperamento, pasos, completados }: { temperamento: Temp; pasos: Paso[]; completados: Completados }) {
  if (!temperamento) return null;
  const p = temperamento.primary;
  const s = temperamento.secondary;
  const perfil = s ? `${p}-${s}` : p;

  const retosStep = pasos.find((paso) => paso.tipo === 'retos_temperamento');
  const retosHecho = retosStep && completados[retosStep.id];
  const fd = retosStep?.facilita_dificulta?.[p];
  const virtudDesafio = retosStep?.virtud_desafio_map?.[perfil] ?? retosStep?.virtud_desafio_map?.[p];

  return (
    <View style={[tarjeta, { marginTop: 18 }]}>
      <Text style={eyebrow}>Mi perfil</Text>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <CajaBorde color={TEMP_COLORS[p] ?? LINE} pad={[10, 12]} style={{ flex: 1 }}>
          <Text style={versalita(10)}>Primario</Text>
          <Text style={ts(16, NAVY, { marginTop: 2 })}>{TEMP_NOMBRE[p]}</Text>
        </CajaBorde>
        {s && (
          <CajaBorde color={TEMP_COLORS[s] ?? LINE} pad={[10, 12]} style={{ flex: 1 }}>
            <Text style={versalita(10)}>Secundario</Text>
            <Text style={ts(16, NAVY, { marginTop: 2 })}>{TEMP_NOMBRE[s]}</Text>
          </CajaBorde>
        )}
      </View>

      {retosHecho && fd && (
        <>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <CajaBorde fondo="#ecfdf5" color="#10b981" ancho={2} pad={[8, 10]} style={{ flex: 1 }}>
              <Text style={versalita(10, '#065f46', 700, 0.05)}>Facilita</Text>
              <Text style={tb(13, '#065f46', 400, { lineHeight: lh(13, 1.4), marginTop: 2 })}>{fd.facilita}</Text>
            </CajaBorde>
            <CajaBorde fondo="#fef2f2" color="#ef4444" ancho={2} pad={[8, 10]} style={{ flex: 1 }}>
              <Text style={versalita(10, '#991b1b', 700, 0.05)}>Dificulta</Text>
              <Text style={tb(13, '#991b1b', 400, { lineHeight: lh(13, 1.4), marginTop: 2 })}>{fd.dificulta}</Text>
            </CajaBorde>
          </View>

          {virtudDesafio && (
            <CajaBorde pad={[10, 12]} style={{ marginTop: 12 }}>
              <Text style={versalita(10, MUTED, 700)}>Mi virtud-desafío</Text>
              <Text style={ts(18, NAVY, { marginTop: 2 })}>{virtudDesafio}</Text>
            </CajaBorde>
          )}
        </>
      )}
    </View>
  );
}

function VistaListado({
  modulo,
  pasos,
  visibles,
  completados,
  irA,
  cursoNum,
  userId,
  temperamento,
}: {
  modulo: any;
  pasos: Paso[];
  visibles: Paso[];
  completados: Completados;
  irA: (id: string) => void;
  cursoNum: number;
  userId: string;
  temperamento: Temp;
}) {
  const progAll = progresoModulo(pasos, completados);
  const vids = pasos.filter((p) => p.tipo === 'video');
  const vidsHechos = vids.filter((p) => completados[p.id]).length;
  const vidsPct = vids.length ? Math.round((vidsHechos / vids.length) * 100) : 0;
  const cont = continuarModulo(pasos, completados);

  const cierre = visibles.find((p) => p.tipo === 'cierre');
  const cierreHecho = cierre ? Boolean(completados[cierre.id]) : false;

  return (
    <View>
      <View>
        <Volver onPress={() => router.navigate('/portal/formacion')} color={GOLD_REF_DK} style={{ marginBottom: 16 }}>
          ← Toda la formación
        </Volver>
        <Text style={eyebrow}>Curso {cursoNum}</Text>
        <Text style={[titulo(28), { marginTop: 8, marginBottom: 10 }]}>{modulo.titulo}</Text>
        {modulo.descripcion ? <Text style={[parrafo, { marginBottom: 24 }]}>{modulo.descripcion}</Text> : <View style={{ height: 24 }} />}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 8 }}>
          <Anillo valor={vidsPct} tam={72} sw={5} fs={18} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...fuente.slab(700), fontSize: 20, color: NAVY }}>
              {vidsHechos} de {vids.length} módulos
            </Text>
            <Text style={tb(13, MUTED, 400, { marginTop: 2 })}>{progAll.completo ? 'Curso completado' : 'En progreso'}</Text>
          </View>
        </View>

        {cursoNum === 1 && temperamento && <ResumenPersonal temperamento={temperamento} pasos={pasos} completados={completados} />}

        {cursoNum === 1 && userId ? (
          <View style={{ marginTop: 18 }}>
            <CuadernoPersonal userId={userId} pasos={modulo.pasos} temperamento={temperamento} />
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: 24 }}>
        {cont && (
          <Continuar
            etiqueta={vidsHechos > 0 ? 'Continúa donde lo dejaste' : 'Empieza aquí'}
            titulo={cont.titulo}
            subtitulo={
              cont.tipo === 'video'
                ? 'Vídeo'
                : cont.tipo === 'cierre'
                  ? 'Conclusiones'
                  : cont.tipo === 'conclusion_modulo'
                    ? 'Resumen del módulo'
                    : cont.tipo === 'reflexion_guiada'
                      ? 'Reflexión'
                      : 'Actividad'
            }
            onPress={() => irA(cont.id)}
            style={{ marginBottom: 18 }}
          />
        )}

        <ListaLecciones pasos={pasos} completados={completados} irA={irA} />

        {cierre && (
          <Pressable onPress={() => irA(cierre.id)} style={({ pressed }) => [tarjeta, { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.85 : 1 }]}>
            <Circulito hecho={cierreHecho} tam={32}>
              {cierreHecho ? <IconoCheck size={16} color="#fff" /> : <IconoChevron size={14} color={NAVY} />}
            </Circulito>
            <View style={{ flex: 1 }}>
              <Text style={ts(16, NAVY)}>{cierre.titulo}</Text>
              <Text style={tb(12, MUTED, 400, { marginTop: 2 })}>{cierreHecho ? 'Completado' : 'Síntesis del curso'}</Text>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Tarjeta de estado («Cargando…», «Curso no encontrado»). */
function Aviso({ eyebrowTexto, children }: { eyebrowTexto: string; children: ReactNode }) {
  return (
    <View style={tarjeta}>
      <Text style={eyebrow}>{eyebrowTexto}</Text>
      {children}
    </View>
  );
}

function ModuloContenido({ moduloData, user, cursoId, subir }: { moduloData: any; user: User; cursoId: string; subir: () => void }) {
  const cursoNum: number = moduloData.curso != null ? moduloData.curso : parseInt(cursoId.replace('curso-', ''), 10) || 1;
  const progreso = useModuloProgreso(user.id, moduloData.id);
  const notasHook = useNotas(user.id, moduloData.id);
  const [temp, setTemp] = useState<Temp | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    fetchLatestTemperament()
      .then((f) => {
        if (vivo) setTemp(mapTemp(f?.result));
      })
      .catch(() => {
        if (vivo) setTemp(null);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const temperamento = temp ?? null;
  const pasos: Paso[] = pasosDelUsuario(moduloData, temperamento);
  const visibles = pasosVisibles(pasos);
  const pasoActualId = progreso.pasoActual;
  const pasoActual = pasoActualId ? pasos.find((p) => p.id === pasoActualId) : null;

  function irA(pasoId: string) {
    progreso.irA(pasoId);
    subir();
  }

  function avanzar() {
    if (!pasoActual) return;
    const sig = siguientePaso(pasos, pasoActual.id);
    if (sig) irA(sig.id);
    else progreso.irA(null);
  }

  function retroceder() {
    if (!pasoActual) return;
    const ant = pasoAnterior(pasos, pasoActual.id);
    if (ant) irA(ant.id);
  }

  function volver() {
    progreso.irA(null);
    subir();
  }

  function rewind() {
    if (!pasoActual) return volver();
    if (pasoActual.tipo === 'video') return volver();
    const vid = videoAnterior(pasos, pasoActual.id);
    if (vid) irA(vid.id);
    else volver();
  }

  if (temp === undefined || !progreso.listo) {
    return (
      <Aviso eyebrowTexto={`Curso ${cursoNum}`}>
        <Text style={[parrafo, { marginTop: 10 }]}>Cargando…</Text>
      </Aviso>
    );
  }

  if (pasoActual) {
    if (pasoActual.tipo === 'video') {
      const videosPasos = pasos.filter((p) => p.tipo === 'video');
      return (
        <PasoVideo
          key={pasoActual.id}
          paso={pasoActual}
          pasos={pasos}
          progreso={progreso}
          avanzar={avanzar}
          retroceder={pasoAnterior(pasos, pasoActual.id) ? retroceder : null}
          volver={volver}
          subir={subir}
          notasProps={{ videos: videosPasos, completados: progreso.completados, notas: notasHook.notas, onAgregar: notasHook.agregar, onEliminar: notasHook.eliminar }}
        />
      );
    }
    const videoCtx = videoAnterior(pasos, pasoActual.id);
    const videoCtxMod = videoCtx ? moduloDelPaso(pasos, videoCtx.id) : null;
    return (
      <View>
        <Volver onPress={rewind} style={{ marginBottom: 14 }}>
          ← {videoCtx ? 'Atrás' : 'Salir al curso'}
        </Volver>
        {videoCtx && (
          <CajaBorde pad={[10, 14]} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <Text style={versalita(12, MUTED, 600, 0.05)}>Módulo {videoCtxMod?.numero ?? 0}</Text>
            <Text style={tb(14, LINE)}>|</Text>
            <Text style={tb(14, NAVY)}>{videoCtx.titulo}</Text>
            <Text style={tb(13, MUTED)}>/</Text>
            <Text style={tb(13, GOLD_REF_DK, 600)}>{etiquetaPaso(pasoActual)}</Text>
          </CajaBorde>
        )}
        <PasoActividad key={pasoActual.id} paso={pasoActual} pasos={pasos} temperamento={temperamento} progreso={progreso} avanzar={avanzar} volver={rewind} user={user} />
      </View>
    );
  }

  return (
    <VistaListado
      modulo={moduloData}
      pasos={pasos}
      visibles={visibles}
      completados={progreso.completados}
      irA={irA}
      cursoNum={cursoNum}
      userId={user.id}
      temperamento={temperamento}
    />
  );
}

export default function Modulo() {
  const session = useSession();
  const { cursoId = 'curso-1' } = useLocalSearchParams<{ cursoId: string }>();
  const cat = useCatalogo();
  const scroll = useRef<ScrollView>(null);
  const subir = useCallback(() => scroll.current?.scrollTo({ y: 0, animated: true }), []);

  const local = MODULOS[cursoId];
  let moduloData: any = local ?? null;
  if (!local && !cat.cargando) {
    const num = parseInt(cursoId.replace('curso-', ''), 10);
    const curso = cat.cursos?.find((c) => c.numero === num);
    moduloData = curso ? catalogoAModulo(curso) : null;
  }

  if (!session) return <Cargando />;

  let contenido;
  if (cat.cargando && !local) {
    contenido = (
      <Aviso eyebrowTexto="Curso">
        <Text style={[parrafo, { marginTop: 10 }]}>Cargando…</Text>
      </Aviso>
    );
  } else if (!moduloData) {
    contenido = (
      <Aviso eyebrowTexto="Curso no encontrado">
        <Text style={[parrafo, { marginTop: 10 }]}>Este curso aún no está disponible.</Text>
        <Volver onPress={() => router.navigate('/portal/formacion')} color={GOLD_REF_DK} style={{ marginTop: 12 }}>
          ← Toda la formación
        </Volver>
      </Aviso>
    );
  } else {
    contenido = <ModuloContenido key={moduloData.id} moduloData={moduloData} user={session.user} cursoId={cursoId} subir={subir} />;
  }

  return (
    <SubirContext.Provider value={subir}>
      <ScrollView
        ref={scroll}
        style={{ flex: 1, backgroundColor: BEIGE }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: ESPACIO_BURBUJA }}>
        {contenido}
      </ScrollView>
    </SubirContext.Provider>
  );
}
