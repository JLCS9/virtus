// Formación (src/formacion/Formacion.jsx de la web): listado de cursos y, con ?curso= / ?leccion=,
// la vista de un curso del catálogo y la de una lección (como la web).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ESPACIO_BURBUJA } from '@/portal/Shell';
import { IconoCheck, IconoFlecha } from '@/portal/Iconos';
import { Boton, Cargando } from '@/portal/ui';
import { useSession } from '@/portal/hooks';
import { BEIGE, GOLD_REF, GOLD_REF_DK, GOLD_REF_LT, LINE, MUTED, NAVY, PAPER, barraFondo, eyebrow, fuente, heroColores, parrafo, tarjeta, titulo } from '@/portal/tema';
import { UMBRAL_VISTA, buscarLeccion, duracionCurso, formatoDuracion, progresoCurso, resumenGlobal } from '@/portal/web/formacion/cursos.js';
import { pasosDelUsuario } from '@/portal/web/formacion/flujoModulo.js';
import moduloData from '@/portal/web/data/modulo1.json';
import { cuadro01, cuadro03, cuadro05, cuadro07, cuadro08, cuadro09, cuadro10, img01 } from '@/portal/formacion/assets';
import { lh, tb } from '@/portal/formacion/comun';
import { Anillo, Continuar, Portada, Reproductor, Volver } from '@/portal/formacion/piezas';
import { useCatalogo, useProgreso } from '@/portal/formacion/useFormacion';
import { leerCompletados, type Completados } from '@/portal/formacion/useModulo';

// Portadas de la web (PORTADAS_B, PORTADA_POS_B, PORTADA_ESCALA_B, PORTADA_BRILLO_B, PORTADA_NOBRILLO_B).
const PORTADAS_B: Record<number, number> = { 1: cuadro09, 2: cuadro10, 3: cuadro03, 4: cuadro08, 5: cuadro05, 6: cuadro07, 7: cuadro01 };
const PORTADA_POS_B: Record<number, 'bottom' | 'left bottom'> = { 1: 'bottom', 2: 'bottom', 4: 'left bottom' };
const PORTADA_ESCALA_B: Record<number, number> = { 1: 1.5, 3: 1.1, 4: 1.3 };
const PORTADA_BRILLO_B: Record<number, number> = { 4: 1.12, 5: 0.92 };
const PORTADA_NOBRILLO_B = new Set([6]);

type Progreso = ReturnType<typeof useProgreso>;

const irACurso = (numero: number) => router.push({ pathname: '/portal/formacion/[cursoId]', params: { cursoId: `curso-${numero}` } });

/* ─── VISTA LECCIÓN (?leccion=) ─── */

function VistaLeccion({ cursos, encontrada, progreso, volver, ir }: { cursos: any[]; encontrada: { curso: any; leccion: any }; progreso: Progreso; volver: () => void; ir: (id: string) => void }) {
  const { curso, leccion } = encontrada;
  const vista = Boolean(progreso.vistas[leccion.id]);
  useEffect(() => {
    progreso.abrir(leccion.id);
  }, [leccion.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const i = curso.lecciones.findIndex((l: any) => l.id === leccion.id);
  const siguienteDelCurso = curso.lecciones[i + 1];
  const siguienteCurso = cursos[cursos.findIndex((c) => c.id === curso.id) + 1];
  const siguiente = siguienteDelCurso ?? siguienteCurso?.lecciones[0] ?? null;
  const cursoAnterior = cursos[cursos.findIndex((c) => c.id === curso.id) - 1];
  const anterior = curso.lecciones[i - 1] ?? (cursoAnterior ? cursoAnterior.lecciones[cursoAnterior.lecciones.length - 1] : null);

  function avanzar() {
    if (!vista) progreso.marcarVista(leccion.id);
    if (siguiente) ir(siguiente.id);
  }

  return (
    <View style={{ gap: 16 }}>
      <Volver onPress={volver}>← Formación</Volver>
      <Reproductor
        leccion={leccion}
        onProgreso={(f) => {
          if (f >= UMBRAL_VISTA) progreso.marcarVista(leccion.id);
        }}
      />
      <View style={tarjeta}>
        <Text style={eyebrow}>
          Curso {curso.numero} · {curso.titulo}
        </Text>
        <Text style={[titulo(28), { marginTop: 10, marginBottom: 6 }]}>{leccion.titulo}</Text>
        <Text style={[parrafo, { fontSize: 14, lineHeight: lh(14, 1.65) }]}>{formatoDuracion(leccion.duracion)}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          {anterior && (
            <Boton variante="sobreClaro" onPress={() => ir(anterior.id)}>
              ← Anterior
            </Boton>
          )}
          {siguiente ? (
            <Boton onPress={avanzar} flecha>
              {vista ? 'Siguiente módulo' : 'Marcar como vista y seguir'}
            </Boton>
          ) : (
            <Boton
              variante={vista ? 'contorno' : 'primario'}
              onPress={() => {
                if (!vista) progreso.marcarVista(leccion.id);
              }}>
              {vista ? 'Completada ✓' : 'Marcar como vista'}
            </Boton>
          )}
        </View>
      </View>
    </View>
  );
}

/* ─── VISTA CURSO (?curso=) ─── */

function VistaCurso({ curso, progreso, volver, irALeccion }: { curso: any; progreso: Progreso; volver: () => void; irALeccion: (id: string) => void }) {
  const p = progresoCurso(curso, progreso.vistas);
  const sig = curso.lecciones.find((l: any) => !progreso.vistas[l.id]) ?? curso.lecciones[0];

  return (
    <View>
      <Volver onPress={volver} style={{ marginBottom: 14 }}>
        ← Formación
      </Volver>
      <Text style={eyebrow}>Curso {curso.numero}</Text>
      <Text style={[titulo(30), { marginTop: 8, marginBottom: 6 }]}>{curso.titulo}</Text>
      <Text style={[parrafo, { marginBottom: 20 }]}>
        {curso.lecciones.length} módulos · {formatoDuracion(duracionCurso(curso))}
      </Text>

      <View accessibilityLabel="Progreso" style={[tarjeta, { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 18 }]}>
        <Anillo valor={p.porcentaje} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...fuente.slab(700), fontSize: 20, color: NAVY }}>
            {p.hechas} de {p.total} vistas
          </Text>
          <Text style={tb(13, MUTED, 400, { marginTop: 2 })}>{p.completo ? 'Curso completado' : 'En progreso'}</Text>
        </View>
      </View>

      {sig && (
        <Continuar
          etiqueta={p.hechas > 0 ? 'Continúa donde lo dejaste' : 'Empieza aquí'}
          titulo={sig.titulo}
          subtitulo={formatoDuracion(sig.duracion)}
          onPress={() => irALeccion(sig.id)}
          style={{ marginBottom: 18 }}
        />
      )}

      <View style={[tarjeta, { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' }]}>
        {curso.lecciones.map((l: any, idx: number) => {
          const vista = Boolean(progreso.vistas[l.id]);
          return (
            <Pressable
              key={l.id}
              onPress={() => irALeccion(l.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderBottomWidth: idx < curso.lecciones.length - 1 ? 1 : 0,
                borderBottomColor: LINE,
                backgroundColor: pressed ? 'rgba(27,42,74,0.04)' : 'transparent',
              })}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: vista ? 0 : 1.5,
                  borderColor: LINE,
                  backgroundColor: vista ? GOLD_REF : 'transparent',
                }}>
                {vista ? <IconoCheck size={14} color="#fff" /> : <Text style={{ ...fuente.slab(700), fontSize: 13, color: NAVY }}>{idx + 1}</Text>}
              </View>
              <Text style={tb(14.5, NAVY, vista ? 400 : 500, { flex: 1 })}>{l.titulo}</Text>
              <Text style={tb(12, MUTED)}>{formatoDuracion(l.duracion)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ─── LISTADO ─── */

function CabeceraCurso({ completo, numero, titulo: t, sub }: { completo: boolean; numero: number | string; titulo: string; sub: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: completo ? GOLD_REF : 'rgba(27,42,74,0.08)' }}>
        {completo ? <IconoCheck size={18} color={NAVY} /> : <Text style={{ ...fuente.slab(700), fontSize: 17, color: NAVY }}>{numero}</Text>}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ ...fuente.slab(700), fontSize: 19, lineHeight: 23, color: NAVY }}>{t}</Text>
        <Text style={tb(12.5, MUTED, 400, { marginTop: 3 })}>{sub}</Text>
      </View>
      <IconoFlecha color={MUTED} size={24} />
    </View>
  );
}

function BarraProgreso({ porcentaje }: { porcentaje: number }) {
  return (
    <View style={[barraFondo, { marginTop: 14 }]}>
      <View style={{ width: `${porcentaje}%`, height: '100%', backgroundColor: GOLD_REF_DK }} />
    </View>
  );
}

function CursoCard({ curso, vistas }: { curso: any; vistas: Record<string, string> }) {
  const p = progresoCurso(curso, vistas);
  const n: number = curso.numero;
  const img = PORTADAS_B[n] ?? img01;
  const brillo = PORTADA_BRILLO_B[n] ?? !PORTADA_NOBRILLO_B.has(n);
  return (
    <Pressable onPress={() => irACurso(n)} style={({ pressed }) => [tarjeta, { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden', opacity: pressed ? 0.92 : 1 }]}>
      <Portada src={img} pos={PORTADA_POS_B[n]} brillo={brillo} escala={PORTADA_ESCALA_B[n]} />
      <View style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <CabeceraCurso completo={p.completo} numero={n} titulo={curso.titulo} sub={`${curso.lecciones.length} módulos · ${formatoDuracion(duracionCurso(curso))}`} />
        <BarraProgreso porcentaje={p.porcentaje} />
        <Text style={tb(12, MUTED, 400, { marginTop: 6 })}>
          {p.hechas} de {p.total} vistas
        </Text>
      </View>
    </Pressable>
  );
}

type ProgVid = { hechos: number; total: number; porcentaje: number; completo: boolean };

function CtaFormacion({ prog }: { prog: ProgVid }) {
  const completo = prog.completo;
  const empezado = prog.hechos > 0;
  const ctaTitulo = completo ? 'Curso 1 completado' : empezado ? 'Continúa donde lo dejaste' : 'Comienza tu formación';
  const ctaTexto = completo
    ? 'Has completado el Curso 1. Continúa con el siguiente curso de la formación.'
    : empezado
      ? `Llevas ${prog.hechos} de ${prog.total} módulos completados. Sigue avanzando.`
      : 'Descubre tu temperamento, trabaja tus virtudes y construye tu carácter.';
  const ctaBoton = completo ? 'Siguiente curso' : empezado ? 'Continuar' : 'Empezar ahora';

  return (
    <Pressable onPress={() => irACurso(1)} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      <LinearGradient colors={heroColores} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 28, paddingHorizontal: 24, paddingBottom: 26, gap: 12, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: 24, width: 56, height: 3, backgroundColor: GOLD_REF }} />
        <Text style={[eyebrow, { color: GOLD_REF_LT }]}>Curso 1</Text>
        <Text style={{ ...fuente.slab(600), fontSize: 26, lineHeight: lh(26, 1.22), color: PAPER }}>{ctaTitulo}</Text>
        <Text style={tb(14.5, 'rgba(255,255,255,0.80)', 400, { lineHeight: lh(14.5, 1.5) })}>{ctaTexto}</Text>
        {!completo && empezado && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', height: 6, marginTop: 2 }}>
            <View style={{ width: `${prog.porcentaje}%`, height: '100%', backgroundColor: GOLD_REF }} />
          </View>
        )}
        <View style={{ alignSelf: 'flex-start', marginTop: 4, backgroundColor: GOLD_REF, paddingVertical: 16, paddingHorizontal: 28 }}>
          <Text style={tb(16, PAPER, 600)}>{ctaBoton} →</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function Modulo1Card({ prog }: { prog: ProgVid }) {
  return (
    <Pressable onPress={() => irACurso(1)} style={({ pressed }) => [tarjeta, { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden', opacity: pressed ? 0.92 : 1 }]}>
      <Portada src={PORTADAS_B[1]} pos={PORTADA_POS_B[1]} brillo escala={PORTADA_ESCALA_B[1]} />
      <View style={{ paddingVertical: 16, paddingHorizontal: 20 }}>
        <CabeceraCurso completo={prog.completo} numero="1" titulo="Del temperamento al carácter" sub={`${prog.hechos} de ${prog.total} módulos`} />
        <BarraProgreso porcentaje={prog.porcentaje} />
      </View>
    </Pressable>
  );
}

function Listado({ cursos: todosLosCursos, progreso, m1Prog }: { cursos: any[]; progreso: Progreso; m1Prog: Completados }) {
  const cursos = todosLosCursos.filter((c) => c.numero !== 1);

  const m1Pasos = pasosDelUsuario(moduloData, null);
  const m1Videos = m1Pasos.filter((p: any) => p.tipo === 'video');
  const m1VideosHechos = m1Videos.filter((p: any) => m1Prog[p.id]).length;
  const m1VideosPct = m1Videos.length ? Math.round((m1VideosHechos / m1Videos.length) * 100) : 0;
  const m1ProgVid = { hechos: m1VideosHechos, total: m1Videos.length, porcentaje: m1VideosPct, completo: m1VideosHechos === m1Videos.length };

  const resumenCursos = resumenGlobal(cursos, progreso.vistas);
  const totalLecciones = resumenCursos.total + m1Videos.length;
  const hechasLecciones = resumenCursos.hechas + m1VideosHechos;
  const porcentaje = totalLecciones ? Math.round((hechasLecciones / totalLecciones) * 100) : 0;

  const m1SegundosVistos = m1Videos.filter((p: any) => m1Prog[p.id]).reduce((s: number, p: any) => s + (p.duracion || 0), 0);
  const segundosTotales = resumenCursos.segundosVistos + m1SegundosVistos;

  return (
    <View style={{ gap: 18 }}>
      <View>
        <Text style={eyebrow}>Formación</Text>
        <Text style={[titulo(32), { marginTop: 8, marginBottom: 4 }]}>Liderazgo virtuoso</Text>
        <Text style={[parrafo, { color: MUTED }]}>Conócete, crece y lidera desde tus virtudes.</Text>
      </View>

      <View accessibilityLabel="Tu progreso" style={tarjeta}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 16 }}>
          <Anillo valor={porcentaje} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...fuente.slab(700), fontSize: 24, lineHeight: lh(24, 1.15), color: NAVY }}>
              {hechasLecciones} de {totalLecciones} módulos
            </Text>
            {segundosTotales > 0 && <Text style={tb(14, MUTED, 400, { marginTop: 4 })}>Tiempo invertido en trabajo personal: {formatoDuracion(segundosTotales)}</Text>}
          </View>
        </View>
      </View>

      <View style={{ gap: 16 }}>
        <CtaFormacion prog={m1ProgVid} />
        <Modulo1Card prog={m1ProgVid} />
      </View>
      {cursos.map((c) => (
        <CursoCard key={`b-${c.id}`} curso={c} vistas={progreso.vistas} />
      ))}
    </View>
  );
}

export default function Formacion() {
  const session = useSession();
  const userId = session?.user.id ?? '';
  const cat = useCatalogo();
  const progreso = useProgreso(userId);
  const [m1Prog, setM1Prog] = useState<Completados>({});
  const params = useLocalSearchParams<{ leccion?: string; curso?: string }>();
  const scroll = useRef<ScrollView>(null);
  const idLeccion = params.leccion || null;
  const idCurso = params.curso || null;

  // La web lee el progreso del curso 1 en cada render; aquí, cada vez que se vuelve a la pantalla.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      leerCompletados(userId, 'modulo1').then(setM1Prog);
    }, [userId]),
  );

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [idLeccion, idCurso]);

  const abrirLeccion = (id: string) => router.setParams({ leccion: id, curso: undefined });
  const volver = () => router.setParams({ leccion: undefined, curso: undefined });
  const volverACurso = (cursoId: string) => router.setParams({ curso: cursoId, leccion: undefined });

  if (!session || !progreso.listo) return <Cargando />;

  let contenido;
  if (cat.cargando) {
    contenido = (
      <View style={tarjeta}>
        <Text style={eyebrow}>Formación</Text>
        <Text style={[parrafo, { marginTop: 10 }]}>Cargando tu formación…</Text>
      </View>
    );
  } else if (cat.error || !cat.cursos) {
    contenido = (
      <View style={tarjeta}>
        <Text style={eyebrow}>Formación</Text>
        <Text style={[titulo(26), { marginTop: 10, marginBottom: 8 }]}>No he podido cargar la formación</Text>
        <Text style={[parrafo, { marginBottom: 16 }]}>
          Inténtalo de nuevo en unos minutos.{cat.error?.detalle ? ` [${cat.error.detalle}]` : ''}
        </Text>
        <Boton variante="sobreClaro" onPress={cat.reintentar}>
          Reintentar
        </Boton>
      </View>
    );
  } else {
    const encontrada = idLeccion ? buscarLeccion(cat.cursos, idLeccion) : null;
    const curso = !encontrada && idCurso ? cat.cursos.find((c) => c.id === idCurso) : null;
    if (encontrada) contenido = <VistaLeccion cursos={cat.cursos} encontrada={encontrada} progreso={progreso} volver={() => volverACurso(encontrada.curso.id)} ir={abrirLeccion} />;
    else if (curso) contenido = <VistaCurso curso={curso} progreso={progreso} volver={volver} irALeccion={abrirLeccion} />;
    else contenido = <Listado cursos={cat.cursos} progreso={progreso} m1Prog={m1Prog} />;
  }

  return (
    <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: BEIGE }} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: ESPACIO_BURBUJA }}>
      {contenido}
    </ScrollView>
  );
}
