/**
 * La sesión de un día del camino, siempre en tres pasos: Recuerda (la frase y el reto de la semana),
 * Juega (la interacción del día) y Elige (con quién vas a hacer hoy el reto).
 */
import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { findLesson } from '@virtus/content';

import { Button, Field } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { VimeoPlayer } from '@/components/VimeoPlayer';
import { EJEMPLO_CUATRO, LEMA, PUNTO_PARTIDA, RETO_PRESENTACION, VERDAD_MITO, conPunto, infoDia, semanaDe, tieneExamen, type LineaBase, type Temp } from '@/lib/camino';
import { sugerenciaDelDia } from '@/lib/personas';
import { guardarLineaBase, guardarSesion, type EstadoCamino } from '@/features/camino';
import type { EstadoPersonas } from '@/features/personas';
import { useContent } from '@/features/content';
import { WATCHED_AT } from '@/features/courses';
import { useTemperamento } from '@/features/temperamento';
import { EligeQuien } from '@/components/personas/EligeQuien';
import { Dia12, DiaFicha } from '@/components/personas/DiasPersonas';
import { useVirtus } from '@/store/virtus';
import { color, fontFamily, space, type } from '@/theme';
import { Cierre14, Cierre7 } from './Cierres';
import { Arrastra, DeslizaTemperamentoCaracter, DeslizaTemperamentos, EligeReaccion, EligeVirtud, type FinJuego } from './Juegos';
import { Rueda } from './Rueda';
import { Continuar, Hecho, NOMBRES, Opcion, Opciones, Pantalla, Puntos, ROJO, TEMP_COLORS, VERDE, fraseGrande, nota, parrafo, textoError, titular } from './ui';

// ───────────── Juegos de la sesión ─────────────

function DiaVideo({ dia, onFin }: { dia: number; onFin: FinJuego }) {
  const content = useContent();
  const { width } = useWindowDimensions();
  const temp = useTemperamento();
  const info = infoDia(dia)!;
  const leccion = info.leccion!;
  const visto = useVirtus((s) => !!s.watched[leccion]);
  const markWatched = useVirtus((s) => s.markWatched);
  const [fase, setFase] = useState<'video' | 'resultado' | 'cuatro' | 'reto'>('video');

  const encontrada = findLesson(content, leccion);
  const fases = dia === 1 ? (['video', 'resultado', 'cuatro', 'reto'] as const) : (['video', 'reto'] as const);
  const avanzar = () => {
    const i = fases.indexOf(fase as never);
    if (i + 1 < fases.length) setFase(fases[i + 1]);
    else onFin({ video_visto: !!useVirtus.getState().watched[leccion] });
  };
  const etiqueta = `Día ${dia} · ${info.titulo}`;

  if (fase === 'video') {
    const w = Math.min(width, 640) - space.l * 2;
    return (
      <Pantalla
        etiqueta={etiqueta}
        pie={
          <>
            <Continuar
              label={visto ? 'Continuar' : 'Ya lo he visto'}
              onPress={() => {
                markWatched(leccion);
                avanzar();
              }}
            />
            {!visto ? <Button variant="ghost" label="Lo veré después" onPress={avanzar} /> : null}
          </>
        }>
        <Text style={fraseGrande}>{dia === 1 ? 'Hoy empieza tu camino. Primero, cinco minutos para entender qué es tu temperamento.' : 'Nueva semana, nuevo vídeo.'}</Text>
        {encontrada ? (
          <>
            <View style={{ borderRadius: 12, overflow: 'hidden' }}>
              <VimeoPlayer vimeoId={encontrada.lesson.vimeoId} width={w} height={(w * 9) / 16} onProgress={(f) => f >= WATCHED_AT && markWatched(leccion)} />
            </View>
            <Text style={nota}>
              Vídeo {encontrada.lesson.id} · {encontrada.lesson.titulo}
            </Text>
          </>
        ) : (
          <Text style={parrafo}>No he encontrado el vídeo {leccion} ahora mismo.</Text>
        )}
      </Pantalla>
    );
  }

  if (fase === 'resultado') {
    if (temp === undefined) return <Pantalla etiqueta={etiqueta}><Text style={parrafo}>Un momento…</Text></Pantalla>;
    if (!temp) {
      return (
        <Pantalla etiqueta={etiqueta} pie={<Continuar onPress={avanzar} />}>
          <Text style={fraseGrande}>Aún no tenemos el resultado de tu test de temperamento en tu cuenta.</Text>
          <Text style={parrafo}>Hazlo con tu sesión iniciada y aquí verás tu posición en la rueda.</Text>
        </Pantalla>
      );
    }
    const fila = (k: Temp, cual: string) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: color.bruma }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: TEMP_COLORS[k] }} />
        <View>
          <Text style={nota}>Tu temperamento {cual}</Text>
          <Text style={{ fontFamily: fontFamily.slab700, fontSize: 21, lineHeight: 28, color: color.azulProfundo }}>
            {NOMBRES[k]} <Text style={{ fontFamily: fontFamily.sans400Italic, fontSize: 17, color: color.plomo }}>· {LEMA[k]}</Text>
          </Text>
        </View>
      </View>
    );
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar onPress={avanzar} />}>
        <Text style={titular}>Tu punto de partida</Text>
        <Rueda primario={temp.primario} secundario={temp.secundario} />
        <View>
          {fila(temp.primario, 'primario')}
          {temp.secundario ? fila(temp.secundario, 'secundario') : null}
        </View>
      </Pantalla>
    );
  }

  if (fase === 'cuatro') {
    const primario = temp?.primario;
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar onPress={avanzar} />}>
        <Text style={fraseGrande}>¿Te parece que tienes los cuatro? Es un error con una vertiente positiva: significa que has estado desarrollando tu carácter.</Text>
        {primario ? (
          <View style={{ borderLeftWidth: 3, borderLeftColor: color.doradoVirtud, paddingLeft: 14 }}>
            <Text style={[type.cita, { color: color.pizarra }]}>{EJEMPLO_CUATRO[primario]}</Text>
          </View>
        ) : null}
      </Pantalla>
    );
  }

  return (
    <Pantalla etiqueta={`Reto de la semana ${semanaDe(dia).numero}`} pie={<Continuar onPress={avanzar} />}>
      <Text style={[titular, { fontSize: 26, lineHeight: 33 }]}>{semanaDe(dia).reto}</Text>
      <Text style={[parrafo, { fontSize: 17, lineHeight: 26 }]}>{RETO_PRESENTACION[dia]}</Text>
    </Pantalla>
  );
}

function VerdadMito({ dia, onFin }: { dia: number; onFin: FinJuego }) {
  const lista = VERDAD_MITO[dia];
  const [i, setI] = useState(0);
  const [respuestas, setRespuestas] = useState<boolean[]>([]);
  const respondida = respuestas.length > i;
  const aciertos = respuestas.filter((r, k) => r === lista[k][1]).length;
  const etiqueta = `Día ${dia} · Verdad o mito`;

  if (i >= lista.length) {
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar onPress={() => onFin({ respuestas, aciertos })} />}>
        <Text style={[titular, { fontSize: 28, lineHeight: 36 }]}>
          Has acertado {aciertos} de {lista.length}.
        </Text>
      </Pantalla>
    );
  }

  const [afirmacion, verdad, explicacion] = lista[i];
  const elegida = respuestas[i];
  const acierto = respondida && elegida === verdad;
  return (
    <Pantalla etiqueta={etiqueta} pie={respondida ? <Continuar label={i + 1 < lista.length ? 'Siguiente' : 'Ver resultado'} onPress={() => setI((n) => n + 1)} /> : undefined}>
      <Puntos total={lista.length} actual={i} />
      <Text style={[fraseGrande, { fontSize: 25, lineHeight: 33, minHeight: 70, marginVertical: space.m }]}>«{afirmacion}»</Text>
      <Opciones columnas={2}>
        {(
          [
            [true, 'Verdad'],
            [false, 'Mito'],
          ] as const
        ).map(([v, texto]) => (
          <Opcion key={texto} compacta activa={respondida && elegida === v} disabled={respondida} onPress={() => setRespuestas((r) => [...r, v])}>
            {texto}
          </Opcion>
        ))}
      </Opciones>
      {respondida ? (
        <View style={{ gap: space.xs }}>
          <Text style={[type.bodyStrong, { color: acierto ? VERDE : ROJO }]}>
            {acierto ? '¡Bien!' : 'No exactamente.'} Es {verdad ? 'verdad' : 'un mito'}.
          </Text>
          <Text style={parrafo}>{explicacion}.</Text>
        </View>
      ) : null}
    </Pantalla>
  );
}

function PuntoPartida({ dia, lineaBase, onFin }: { dia: number; lineaBase: LineaBase | null; onFin: FinJuego }) {
  const [paso, setPaso] = useState(0);
  const [r, setR] = useState({
    fallo: lineaBase?.fallo ?? null,
    me_ven: lineaBase?.me_ven ?? [],
    me_gustaria: lineaBase?.me_gustaria ?? [],
    linea: lineaBase?.linea ?? '',
  });
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const etiqueta = `Día ${dia} · Mi punto de partida`;

  async function guardar() {
    setOcupado(true);
    setError(false);
    try {
      await guardarLineaBase({ ...r, linea: r.linea.trim() || null });
      onFin({ hecho: true });
    } catch {
      setError(true);
      setOcupado(false);
    }
  }

  if (paso === 0) {
    const q = PUNTO_PARTIDA.fallo;
    return (
      <Pantalla etiqueta={etiqueta}>
        <Puntos total={4} actual={0} />
        <Text style={titular}>{q.pregunta}</Text>
        <Opciones>
          {q.opciones.map(([v, texto]) => (
            <Opcion
              key={v}
              activa={r.fallo === v}
              onPress={() => {
                setR((x) => ({ ...x, fallo: v }));
                setTimeout(() => setPaso(1), 180);
              }}>
              {texto}
            </Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }

  if (paso === 1 || paso === 2) {
    const campo = paso === 1 ? 'me_ven' : 'me_gustaria';
    const q = PUNTO_PARTIDA[campo];
    const elegidos = r[campo];
    const cambiar = (v: string) =>
      setR((x) => {
        const e = x[campo];
        return { ...x, [campo]: e.includes(v) ? e.filter((y) => y !== v) : e.length < 3 ? [...e, v] : e };
      });
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar disabled={!elegidos.length} onPress={() => setPaso(paso + 1)} />}>
        <Puntos total={4} actual={paso} />
        <Text style={titular}>{q.pregunta}</Text>
        <Text style={nota}>Elige hasta 3.</Text>
        <Opciones columnas={3}>
          {q.opciones.map((v) => (
            <Opcion key={v} compacta activa={elegidos.includes(v)} onPress={() => cambiar(v)}>
              {v}
            </Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }

  return (
    <Pantalla
      etiqueta={etiqueta}
      pie={
        <>
          {error ? textoError('No he podido guardarlo. Inténtalo de nuevo.') : null}
          <Continuar label={ocupado ? 'Guardando…' : r.linea.trim() ? 'Guardar' : 'Seguir sin escribir'} disabled={ocupado} onPress={guardar} />
        </>
      }>
      <Puntos total={4} actual={3} />
      <Text style={titular}>{PUNTO_PARTIDA.linea}</Text>
      <Text style={nota}>Es opcional. Solo lo ves tú; lo releerás al final de la semana 1.</Text>
      <Field label="Tu línea" value={r.linea} maxLength={280} multiline onChangeText={(linea) => setR((x) => ({ ...x, linea }))} />
    </Pantalla>
  );
}

// ───────────── La sesión ─────────────

export function Sesion({
  dia,
  camino,
  personas,
  onCerrar,
  onExamen,
}: {
  dia: number;
  camino: EstadoCamino;
  personas: EstadoPersonas;
  onCerrar: () => void;
  onExamen: () => void;
}) {
  const info = infoDia(dia)!;
  const semana = semanaDe(dia);
  const hecha = !!camino.porDia[dia]?.sesion_en;
  const [paso, setPaso] = useState<'recuerda' | 'juega' | 'elige' | 'fin'>('recuerda');
  // Los cierres no tienen «¿con quién?»: sin sugerencia.
  const sugerencia = info.cierre ? null : sugerenciaDelDia(personas.lista, camino.porDia, dia);
  const [juego, setJuego] = useState<Record<string, unknown> | null>(null);
  const [conQuien, setConQuien] = useState<string | null>(camino.porDia[dia]?.con_quien ?? null);
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function guardar(j: Record<string, unknown> | null, quien: string | null) {
    setOcupado(true);
    setError(false);
    try {
      await guardarSesion(dia, { juego: j, conQuien: quien });
      void camino.recargar();
      setPaso('fin');
    } catch {
      setError(true);
      // Los cierres guardan sin pasar por «Elige»: el error se ve en esa pantalla.
      if (info.cierre) setPaso('elige');
    }
    setOcupado(false);
  }

  const finJuego: FinJuego = (j) => {
    setJuego(j);
    if (info.cierre) void guardar(j, null);
    else setPaso('elige');
  };

  if (paso === 'recuerda') {
    return (
      <Pantalla onVolver={onCerrar}>
        <Hero>
          <Text style={[type.eyebrow, { color: color.doradoClaro }]}>
            Día {dia} · Semana {semana.numero}
          </Text>
          <Text style={{ fontFamily: fontFamily.slab500, fontSize: 24, lineHeight: 32, color: color.blanco, fontStyle: 'italic' }}>«{semana.frase}»</Text>
          <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)', paddingTop: 14, gap: 4 }}>
            <Text style={[type.caption, { color: color.piedra }]}>Tu reto de la semana</Text>
            <Text style={[type.bodyStrong, { color: color.blanco }]}>{semana.reto}</Text>
            {sugerencia ? (
              <Text style={[type.body, { color: color.crema, marginTop: 6 }]}>
                Hoy podrías hacerlo con <Text style={{ fontFamily: fontFamily.sans700 }}>{sugerencia.persona.nombre}</Text>
                {sugerencia.consejo ? `: ${sugerencia.consejo.charAt(0).toLowerCase()}${sugerencia.consejo.slice(1)}.` : '.'}
              </Text>
            ) : null}
          </View>
          {hecha ? <Text style={[type.caption, { color: color.piedra }]}>Ya hiciste esta sesión. Puedes repetirla.</Text> : null}
          <Button label={`${info.titulo} · ${info.tiempo}  →`} onPress={() => setPaso('juega')} />
        </Hero>
      </Pantalla>
    );
  }

  if (paso === 'juega') {
    if (info.tipo === 'video') return <DiaVideo dia={dia} onFin={finJuego} />;
    if (info.tipo === 'verdad_mito') return <VerdadMito dia={dia} onFin={finJuego} />;
    if (info.tipo === 'punto_partida') return <PuntoPartida dia={dia} lineaBase={camino.lineaBase} onFin={finJuego} />;
    if (info.tipo === 'desliza') return dia <= 7 ? <DeslizaTemperamentos dia={dia} onFin={finJuego} /> : <DeslizaTemperamentoCaracter dia={dia} onFin={finJuego} />;
    if (info.tipo === 'elige') return dia <= 7 ? <EligeReaccion dia={dia} onFin={finJuego} /> : <EligeVirtud dia={dia} momentos={camino.perfil?.momentos} onFin={finJuego} />;
    if (info.tipo === 'arrastra') return <Arrastra dia={dia} onFin={finJuego} />;
    if (info.tipo === 'cierre') {
      if (ocupado) return <Pantalla etiqueta={`Día ${dia}`}><Text style={parrafo}>Guardando…</Text></Pantalla>;
      return dia === 7 ? <Cierre7 camino={camino} personas={personas} onFin={finJuego} /> : <Cierre14 camino={camino} personas={personas} onFin={finJuego} />;
    }
    if (info.tipo === 'ficha') return <DiaFicha dia={dia} personas={personas} estadoVida={camino.perfil?.estado_vida} onFin={finJuego} />;
    return <Dia12 dia={dia} camino={camino} personas={personas} onFin={finJuego} />;
  }

  if (paso === 'elige') {
    return (
      <Pantalla
        etiqueta="Elige"
        pregunta={info.cierre ? undefined : dia === 8 ? '¿A quién se lo contarás primero?' : '¿Con quién vas a hacer hoy el reto?'}
        pie={
          <>
            {error ? textoError('No he podido guardar tu sesión. Inténtalo de nuevo.') : null}
            <Continuar label={ocupado ? 'Guardando…' : 'Terminar la sesión'} disabled={ocupado} onPress={() => guardar(juego, info.cierre ? null : conQuien)} />
            {!conQuien && !info.cierre ? <Text style={[nota, { textAlign: 'center' }]}>No es obligatorio.</Text> : null}
          </>
        }>
        {info.cierre ? null : <EligeQuien personas={personas.lista} valor={conQuien} onElegir={setConQuien} conmutar sugerida={sugerencia?.persona.id} />}
      </Pantalla>
    );
  }

  const siguiente = infoDia(dia + 1);
  const conExamen = tieneExamen(dia) && !camino.porDia[dia]?.examen_en;
  return (
    <Pantalla
      etiqueta={`Día ${dia} · Hecho`}
      pie={
        <>
          {conExamen ? <Button label="Hacer el examen ahora" onPress={onExamen} /> : null}
          <Button variant={conExamen ? 'secondary' : 'primary'} label="Volver a mi camino" onPress={onCerrar} />
        </>
      }>
      <Hecho titulo="Sesión hecha" />
      {tieneExamen(dia) ? <Text style={parrafo}>Esta noche, 45 segundos para mirar tu día.</Text> : null}
      <Text style={parrafo}>{siguiente ? `Mañana: ${conPunto(siguiente.titulo)}` : 'Has completado tus dos primeras semanas.'}</Text>
    </Pantalla>
  );
}
