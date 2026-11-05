// Quiz, Define, Desliza, Identifica y TestProfundo (src/formacion/Actividad.jsx de la web).
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { BEIGE, GOLD_REF, GOLD_REF_DK, LINE, MUTED, NAVY, PAPER, TEMP_COLORS } from '../../tema';
import { CONCEPTO_A_RETRATO, diagramaTemperamentosImg, diagramaVirtudesImg } from '../assets';
import {
  AMBAR,
  AreaTexto,
  BotonBorde,
  BotonDorado,
  BotonOpcion,
  CajaBorde,
  Caratula,
  Conclusion,
  EnlaceLupa,
  EnlaceTexto,
  Lightbox,
  Medalla,
  ROJO,
  Shell,
  TEMP_NOMBRE,
  Tarjeta,
  VERDE,
  cursiva,
  lh,
  shuffle,
  shuffleIndices,
  tb,
  ts,
  useSubir,
  versalita,
} from '../comun';

type Props = { paso: any; onComplete: (r?: any) => void; modulo?: number };

/* ─── QUIZ ─── */

export function Quiz({ paso, onComplete, modulo }: Props) {
  const { preguntas } = paso;
  const [fase, setFase] = useState('caratula');
  const [idx, setIdx] = useState(0);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [revelada, setRevelada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [verRueda, setVerRueda] = useState(false);
  const [ordenes, setOrdenes] = useState<number[][]>(() => preguntas.map((p: any) => shuffleIndices(p.opciones.length)));
  const respuestasRef = useRef<number[]>([]);

  if (fase === 'caratula') return <Caratula paso={paso} tipo="quiz" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  if (fase === 'conclusion')
    return (
      <Conclusion
        titulo="cuestionario"
        aciertos={aciertos}
        total={preguntas.length}
        requiereAprobado
        onReintentar={() => {
          setFase('ejercicio');
          setIdx(0);
          setSeleccion(null);
          setRevelada(false);
          setAciertos(0);
          setOrdenes(preguntas.map((p: any) => shuffleIndices(p.opciones.length)));
          respuestasRef.current = [];
        }}
        onContinuar={() => onComplete({ aciertos, total: preguntas.length })}
      />
    );

  const preg = preguntas[idx];
  const orden = ordenes[idx];

  function elegir(originalIdx: number) {
    if (revelada) return;
    setSeleccion(originalIdx);
    setRevelada(true);
    respuestasRef.current[idx] = originalIdx;
    if (originalIdx === preg.correcta) setAciertos((a) => a + 1);
  }

  function avanzar() {
    if (idx + 1 < preguntas.length) {
      const next = idx + 1;
      setIdx(next);
      const prev = respuestasRef.current[next];
      if (prev != null) {
        setSeleccion(prev);
        setRevelada(true);
      } else {
        setSeleccion(null);
        setRevelada(false);
      }
    } else {
      setFase('conclusion');
    }
  }

  function retroceder() {
    const prev = idx - 1;
    setIdx(prev);
    setSeleccion(respuestasRef.current[prev]);
    setRevelada(true);
  }

  return (
    <Shell titulo="Cuestionario" actual={idx + 1} total={preguntas.length}>
      <Tarjeta>
        <Text style={tb(15, MUTED, 400, { marginBottom: 16, lineHeight: lh(15, 1.5) })}>Responde las siguientes preguntas del cuestionario.</Text>
        <Text style={ts(26, NAVY, { marginBottom: 24, lineHeight: lh(26, 1.4) })}>{preg.texto}</Text>
        <View style={{ gap: 14 }}>
          {orden.map((origIdx) => (
            <BotonOpcion
              key={origIdx}
              texto={preg.opciones[origIdx]}
              seleccionada={seleccion === origIdx}
              correcta={origIdx === preg.correcta}
              revelada={revelada}
              onPress={() => elegir(origIdx)}
            />
          ))}
        </View>
        {paso.diagrama_temperamentos && (
          <View style={{ marginTop: 20 }}>
            <EnlaceLupa onPress={() => setVerRueda((v) => !v)}>{verRueda ? 'Ocultar rueda de temperamentos' : 'Ver rueda de los temperamentos'}</EnlaceLupa>
            {verRueda && (
              <View style={{ marginTop: 14, alignItems: 'center' }}>
                <Image source={diagramaTemperamentosImg} accessibilityLabel="Diagrama de los 4 temperamentos" style={{ width: '100%', maxWidth: 360, aspectRatio: 1 }} contentFit="contain" />
              </View>
            )}
          </View>
        )}
        {revelada && (
          <View style={{ marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            {idx > 0 ? <BotonBorde onPress={retroceder}>← Anterior</BotonBorde> : <View />}
            <BotonDorado onPress={avanzar}>{idx + 1 < preguntas.length ? 'Siguiente' : 'Completar'}</BotonDorado>
          </View>
        )}
      </Tarjeta>
    </Shell>
  );
}

/* ─── DEFINE (word pools) ─── */

function Palabra({ texto, bg, borde, color, dashed, onPress, disabled }: { texto: string; bg: string; borde: string; color: string; dashed?: boolean; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({ backgroundColor: bg, borderWidth: 1.5, borderColor: borde, borderStyle: dashed ? 'dashed' : 'solid', paddingVertical: 14, paddingHorizontal: 22, opacity: pressed ? 0.8 : 1 })}>
      <Text style={tb(20, color, 500)}>{texto}</Text>
    </Pressable>
  );
}

function Definicion({ concepto, definicion, style }: { concepto: string; definicion: string; style?: object }) {
  return (
    <CajaBorde style={style}>
      <Text style={versalita(13, MUTED, 700, 0.05)}>Definición</Text>
      <Text style={tb(17, NAVY, 400, { marginTop: 6, lineHeight: lh(17, 1.6) })}>
        <Text style={tb(17, NAVY, 700)}>{concepto}:</Text> {definicion}
      </Text>
    </CajaBorde>
  );
}

export function Define({ paso, onComplete, modulo }: Props) {
  const conceptos: any[] = paso.conceptos;
  const totalPalabras = conceptos.reduce((sum, c) => sum + c.correctas.length, 0);
  const [fase, setFase] = useState('caratula');
  const [idx, setIdx] = useState(0);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [revelado, setRevelado] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const barajar = () => conceptos.map((c) => shuffle<string>([...c.correctas, ...c.distractores]));
  const [pools, setPools] = useState<string[][]>(barajar);
  const [historial, setHistorial] = useState<{ seleccionadas: Set<string>; pool: string[] }[]>([]);
  const [viendo, setViendo] = useState<number | null>(null);

  if (fase === 'caratula') return <Caratula paso={paso} tipo="define" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  if (fase === 'conclusion')
    return (
      <Conclusion
        titulo="definiciones"
        aciertos={aciertos}
        total={totalPalabras}
        requiereAprobado
        nota="Para conseguir la máxima puntuación en cada concepto, debes seleccionar todas las palabras correctas."
        onReintentar={() => {
          setFase('ejercicio');
          setIdx(0);
          setSeleccionadas(new Set());
          setRevelado(false);
          setAciertos(0);
          setPools(barajar());
          setHistorial([]);
          setViendo(null);
        }}
        onContinuar={() => onComplete({ aciertos, total: totalPalabras })}
      />
    );

  if (viendo !== null) {
    const h = historial[viendo];
    const cpt = conceptos[viendo];
    const correctasH = new Set<string>(cpt.correctas);
    const bien = [...h.seleccionadas].filter((p) => correctasH.has(p)).length;
    const mal = [...h.seleccionadas].filter((p) => !correctasH.has(p)).length;
    const perfecto = bien === cpt.correctas.length && mal === 0;
    const faltantesH = cpt.correctas.filter((p: string) => !h.seleccionadas.has(p));
    return (
      <Shell titulo="Definiciones y conceptos" actual={viendo + 1} total={conceptos.length}>
        <Tarjeta>
          <Text style={tb(18, MUTED, 400, { marginBottom: 4 })}>Selecciona todas las palabras que definen el siguiente concepto:</Text>
          <Text style={ts(28, NAVY, { marginBottom: 22 })}>{cpt.concepto}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {h.pool.map((p) => {
              const sel = h.seleccionadas.has(p);
              const esCorrecta = correctasH.has(p);
              let bg = BEIGE;
              let borde = LINE;
              let color = NAVY;
              let dashed = false;
              if (esCorrecta && sel) [bg, borde, color] = [VERDE.bg, VERDE.borde, VERDE.texto];
              else if (esCorrecta && !sel) [bg, borde, color, dashed] = [AMBAR.bg, AMBAR.borde, AMBAR.texto, true];
              else if (sel && !esCorrecta) [bg, borde, color] = [ROJO.bg, ROJO.borde, ROJO.texto];
              return <Palabra key={p} texto={p} bg={bg} borde={borde} color={color} dashed={dashed} disabled />;
            })}
          </View>
          <Text style={tb(15, perfecto ? VERDE.texto : AMBAR.texto, 600, { marginTop: 18, marginBottom: 8 })}>
            {perfecto ? (
              'Correcto.'
            ) : faltantesH.length > 0 ? (
              <>
                Te ha faltado: <Text style={tb(15, AMBAR.texto, 700)}>{faltantesH.join(', ')}</Text>.
              </>
            ) : (
              'Has marcado alguna palabra de más.'
            )}
          </Text>
          {cpt.definicion ? <Definicion concepto={cpt.concepto} definicion={cpt.definicion} /> : null}
          <View style={{ marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            {viendo > 0 ? <EnlaceTexto onPress={() => setViendo(viendo - 1)}>← Anterior</EnlaceTexto> : <View />}
            <BotonDorado onPress={() => setViendo(null)} style={{ flexShrink: 1 }}>
              Volver a la pregunta actual
            </BotonDorado>
          </View>
        </Tarjeta>
      </Shell>
    );
  }

  const concepto = conceptos[idx];
  const pool = pools[idx];
  const correctasSet = new Set<string>(concepto.correctas);

  function toggle(palabra: string) {
    if (revelado) return;
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(palabra)) next.delete(palabra);
      else next.add(palabra);
      return next;
    });
  }

  function comprobar() {
    setRevelado(true);
    const bien = [...seleccionadas].filter((p) => correctasSet.has(p)).length;
    const mal = [...seleccionadas].filter((p) => !correctasSet.has(p)).length;
    setAciertos((a) => a + Math.max(0, bien - mal));
    setHistorial((h) => {
      const n = [...h];
      n[idx] = { seleccionadas: new Set(seleccionadas), pool: [...pool] };
      return n;
    });
  }

  function avanzar() {
    if (idx + 1 < conceptos.length) {
      setIdx((i) => i + 1);
      setSeleccionadas(new Set());
      setRevelado(false);
    } else {
      setFase('conclusion');
    }
  }

  const feedbackActual = revelado
    ? (() => {
        const bien = [...seleccionadas].filter((p) => correctasSet.has(p)).length;
        const mal = [...seleccionadas].filter((p) => !correctasSet.has(p)).length;
        const perfecto = bien === concepto.correctas.length && mal === 0;
        const faltantes: string[] = concepto.correctas.filter((p: string) => !seleccionadas.has(p));
        const erroneas = [...seleccionadas].filter((p) => !correctasSet.has(p));
        return { perfecto, faltantes, erroneas };
      })()
    : null;

  const ret = CONCEPTO_A_RETRATO[concepto.concepto];

  return (
    <Shell titulo="Definiciones y conceptos" actual={idx + 1} total={conceptos.length}>
      <Tarjeta>
        <View style={{ flexDirection: 'row', gap: 22, alignItems: 'center', marginBottom: 22 }}>
          {ret ? (
            <View style={{ mixBlendMode: 'multiply', flexShrink: 0 }}>
              <Image source={ret} accessibilityLabel={concepto.concepto} style={{ width: 150, height: 150, borderRadius: 6 }} contentFit="cover" />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={tb(18, MUTED, 400, { marginBottom: 4 })}>Selecciona todas las palabras que definen el siguiente concepto:</Text>
            <Text style={ts(28, NAVY)}>{concepto.concepto}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {pool.map((p) => {
            const sel = seleccionadas.has(p);
            const esCorrecta = correctasSet.has(p);
            let bg = sel ? 'rgba(165,139,38,0.15)' : BEIGE;
            let borde = sel ? GOLD_REF : LINE;
            let color = NAVY;
            let dashed = false;
            if (revelado && esCorrecta && sel) [bg, borde, color] = [VERDE.bg, VERDE.borde, VERDE.texto];
            else if (revelado && esCorrecta && !sel) [bg, borde, color, dashed] = [AMBAR.bg, AMBAR.borde, AMBAR.texto, true];
            else if (revelado && sel && !esCorrecta) [bg, borde, color] = [ROJO.bg, ROJO.borde, ROJO.texto];
            return <Palabra key={p} texto={p} bg={bg} borde={borde} color={color} dashed={dashed} onPress={() => toggle(p)} disabled={revelado} />;
          })}
        </View>
        {feedbackActual && (
          <View style={{ marginTop: 18, marginBottom: 8 }}>
            {feedbackActual.perfecto || feedbackActual.faltantes.length > 0 ? (
              <Text style={tb(15, feedbackActual.perfecto ? VERDE.texto : AMBAR.texto, 600, { marginBottom: 6 })}>
                {feedbackActual.perfecto ? (
                  'Correcto.'
                ) : (
                  <>
                    Te ha faltado: <Text style={tb(15, AMBAR.texto, 700)}>{feedbackActual.faltantes.join(', ')}</Text>.
                  </>
                )}
              </Text>
            ) : null}
            {feedbackActual.erroneas.length > 0 && (
              <Text style={tb(15, ROJO.texto, 600)}>
                Te has equivocado en:{' '}
                {feedbackActual.erroneas.map((e, i) => (
                  <Text key={e}>
                    {i > 0 && ', '}
                    <Text style={tb(15, ROJO.texto, 700)}>{e}</Text>
                  </Text>
                ))}
                {' — '}no {feedbackActual.erroneas.length === 1 ? 'es una definición' : 'son definiciones'} de {concepto.concepto}.
              </Text>
            )}
          </View>
        )}
        {revelado && concepto.definicion ? <Definicion concepto={concepto.concepto} definicion={concepto.definicion} style={{ marginTop: 14 }} /> : null}
        <View style={{ marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          {!revelado && <Text style={cursiva(13, MUTED, { flex: 1 })}>Para conseguir la máxima puntuación, debes escoger todas las palabras correctas.</Text>}
          {revelado && idx > 0 ? <EnlaceTexto onPress={() => setViendo(idx - 1)}>← Anterior</EnlaceTexto> : revelado ? <View /> : null}
          {!revelado && (
            <BotonDorado onPress={comprobar} disabled={seleccionadas.size === 0} style={{ flexShrink: 0 }}>
              Comprobar
            </BotonDorado>
          )}
          {revelado && <BotonDorado onPress={avanzar}>{idx + 1 < conceptos.length ? 'Siguiente' : 'Completar'}</BotonDorado>}
        </View>
      </Tarjeta>
    </Shell>
  );
}

/* ─── DESLIZA (swipe) ─── */

export function Desliza({ paso, onComplete, modulo }: Props) {
  const escenas: any[] = paso.escenas;
  const [fase, setFase] = useState('caratula');
  const [idx, setIdx] = useState(0);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [revelada, setRevelada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [ordenEscenas] = useState<string[][]>(() => escenas.map((e) => shuffle<string>([...e.opciones])));

  if (fase === 'caratula') return <Caratula paso={paso} tipo="desliza" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  if (fase === 'conclusion')
    return (
      <Conclusion
        titulo={paso.titulo}
        aciertos={aciertos}
        total={escenas.length}
        onReintentar={() => {
          setFase('ejercicio');
          setIdx(0);
          setSeleccion(null);
          setRevelada(false);
          setAciertos(0);
        }}
        onContinuar={() => onComplete({ aciertos, total: escenas.length })}
      />
    );

  const escena = escenas[idx];

  function elegir(temp: string) {
    if (revelada) return;
    setSeleccion(temp);
    setRevelada(true);
    if (temp === escena.respuesta) setAciertos((a) => a + 1);
  }

  function avanzar() {
    if (idx + 1 < escenas.length) {
      setIdx((i) => i + 1);
      setSeleccion(null);
      setRevelada(false);
    } else {
      setFase('conclusion');
    }
  }

  return (
    <Shell titulo="Identifica temperamentos" actual={idx + 1} total={escenas.length}>
      <Tarjeta>
        <Text style={cursiva(22, NAVY, { lineHeight: lh(22, 1.6), marginBottom: 24 })}>«{escena.texto}»</Text>
        <Text style={tb(18, MUTED, 400, { marginBottom: 16 })}>¿Qué temperamento describe esta escena?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {ordenEscenas[idx].map((t) => {
            const sel = seleccion === t;
            const esCorrecto = t === escena.respuesta;
            let bg = BEIGE;
            let borde = LINE;
            let color = NAVY;
            if (revelada && esCorrecto) [bg, borde, color] = [VERDE.bg, VERDE.borde, VERDE.texto];
            else if (revelada && sel && !esCorrecto) [bg, borde, color] = [ROJO.bg, ROJO.borde, ROJO.texto];
            else if (sel) [bg, borde] = ['rgba(165,139,38,0.10)', GOLD_REF];
            return (
              <Pressable
                key={t}
                onPress={() => elegir(t)}
                disabled={revelada}
                style={({ pressed }) => ({
                  flexBasis: '47%',
                  flexGrow: 1,
                  backgroundColor: bg,
                  borderWidth: 1.5,
                  borderColor: borde,
                  borderLeftWidth: 4,
                  borderLeftColor: TEMP_COLORS[t] ?? LINE,
                  paddingVertical: 24,
                  paddingHorizontal: 10,
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : 1,
                })}>
                <Text style={ts(20, color, { textAlign: 'center' })} numberOfLines={1} adjustsFontSizeToFit>
                  {TEMP_NOMBRE[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {revelada && (
          <View style={{ marginTop: 22, alignItems: 'flex-end' }}>
            <BotonDorado onPress={avanzar}>{idx + 1 < escenas.length ? 'Siguiente' : 'Completar'}</BotonDorado>
          </View>
        )}
      </Tarjeta>
    </Shell>
  );
}

/* ─── IDENTIFICA (diagrama + reflexión virtudes) ─── */

type Resp = { facil: 'pasivo' | 'activo' | null; ejemploFacil: string; ejemploDificil: string };

export function Identifica({ paso, onComplete, modulo }: Props) {
  const { virtudes, enunciado, enunciadoCorto } = paso as { virtudes: any[]; enunciado: string; enunciadoCorto: string };
  const total = virtudes.length + 1;
  const [fase, setFase] = useState('caratula');
  const [slide, setSlide] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [respuestas, setRespuestas] = useState<Resp[]>(() => virtudes.map(() => ({ facil: null, ejemploFacil: '', ejemploDificil: '' })));
  const [ejemploAbierto, setEjemploAbierto] = useState<{ pasivo?: boolean; activo?: boolean }>({});
  const subir = useSubir();

  if (fase === 'caratula') return <Caratula paso={paso} tipo="identifica" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  function elegirFacil(vIdx: number, aspecto: 'pasivo' | 'activo') {
    setRespuestas((prev) => {
      const n = [...prev];
      n[vIdx] = { ...n[vIdx], facil: aspecto };
      return n;
    });
  }

  function escribir(vIdx: number, campo: 'ejemploFacil' | 'ejemploDificil', valor: string) {
    setRespuestas((prev) => {
      const n = [...prev];
      n[vIdx] = { ...n[vIdx], [campo]: valor };
      return n;
    });
  }

  function avanzar() {
    if (slide < total - 1) {
      setSlide((s) => s + 1);
      setEjemploAbierto({});
      subir();
    } else {
      onComplete({
        respuestas: respuestas.map((r, i) => ({
          virtud: virtudes[i].nombre,
          facil: r.facil === 'pasivo' ? virtudes[i].pasivo : virtudes[i].activo,
          dificil: r.facil === 'pasivo' ? virtudes[i].activo : virtudes[i].pasivo,
          ejemploFacil: r.ejemploFacil,
          ejemploDificil: r.ejemploDificil,
        })),
      });
    }
  }

  const caja = lightbox ? <Lightbox src={diagramaVirtudesImg} alt="Diagrama de las 6 virtudes del líder" onClose={() => setLightbox(false)} /> : null;

  if (slide === 0) {
    return (
      <Shell titulo={paso.titulo} actual={1} total={total}>
        <Tarjeta>
          <Text style={tb(20, NAVY, 700, { marginBottom: 14, lineHeight: lh(20, 1.4) })}>Analiza la foto y entiende el diagrama de virtudes</Text>
          <Pressable onPress={() => setLightbox(true)} style={{ marginBottom: 18 }}>
            <Image source={diagramaVirtudesImg} accessibilityLabel="Diagrama de las 6 virtudes del líder" style={{ width: '100%', aspectRatio: 800 / 449 }} contentFit="contain" />
          </Pressable>
          {caja}
          {enunciado.split('\n\n').map((p, i) => (
            <Text key={i} style={tb(18, NAVY, 400, { lineHeight: lh(18, 1.7), marginTop: i === 0 ? 0 : 14, marginBottom: i === 0 ? 14 : 0 })}>
              {p}
            </Text>
          ))}
          <View style={{ marginTop: 22, alignItems: 'flex-end' }}>
            <BotonDorado onPress={avanzar} padV={18} padH={40}>
              Empezar
            </BotonDorado>
          </View>
        </Tarjeta>
      </Shell>
    );
  }

  const vIdx = slide - 1;
  const v = virtudes[vIdx];
  const r = respuestas[vIdx];
  const dificil = r.facil ? (r.facil === 'pasivo' ? 'activo' : 'pasivo') : null;
  const listo = Boolean(r.facil && r.ejemploFacil.trim() && r.ejemploDificil.trim());

  function aspBtn(aspecto: 'pasivo' | 'activo', label: string) {
    const esFacil = r.facil === aspecto;
    const esDificil = dificil === aspecto;
    let bg = PAPER;
    let borde = LINE;
    let badge: string | null = null;
    if (esFacil) [bg, borde, badge] = [VERDE.bg, VERDE.borde, '+'];
    else if (esDificil) [bg, borde, badge] = [AMBAR.bg, AMBAR.borde, '−'];
    return (
      <Pressable
        onPress={() => elegirFacil(vIdx, aspecto)}
        style={({ pressed }) => ({ backgroundColor: bg, borderWidth: 1.5, borderColor: borde, paddingVertical: 18, paddingHorizontal: 16, opacity: pressed ? 0.85 : 1 })}>
        <Text style={[versalita(13), { marginBottom: 4 }]}>{aspecto === 'pasivo' ? 'Aspecto pasivo' : 'Aspecto activo'}</Text>
        <Text style={tb(19, NAVY, 400, { lineHeight: lh(19, 1.5) })}>{label}</Text>
        {badge && <Text style={ts(18, esFacil ? VERDE.borde : AMBAR.borde, { position: 'absolute', top: 8, right: 12 })}>{badge}</Text>}
      </Pressable>
    );
  }

  function columna(aspecto: 'pasivo' | 'activo') {
    const ejemplo = aspecto === 'pasivo' ? v.ejemploPasivo : v.ejemploActivo;
    return (
      <View style={{ flex: 1 }}>
        {aspBtn(aspecto, aspecto === 'pasivo' ? v.pasivo : v.activo)}
        {ejemplo ? (
          <EnlaceLupa onPress={() => setEjemploAbierto((prev) => ({ ...prev, [aspecto]: !prev[aspecto] }))} style={{ paddingTop: 8 }}>
            Ver ejemplo
          </EnlaceLupa>
        ) : null}
        {ejemploAbierto[aspecto] && ejemplo ? (
          <CajaBorde ancho={2} pad={[10, 14]} style={{ marginTop: 6 }}>
            <Text style={tb(14, MUTED, 400, { lineHeight: lh(14, 1.6) })}>{ejemplo}</Text>
          </CajaBorde>
        ) : null}
      </View>
    );
  }

  return (
    <Shell titulo={paso.titulo} actual={slide + 1} total={total}>
      <Tarjeta>
        <Text style={tb(19, NAVY, 400, { marginBottom: 10, lineHeight: lh(19, 1.6) })}>{enunciadoCorto}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          <Text style={ts(24, GOLD_REF_DK)}>{v.nombre}</Text>
          <EnlaceLupa onPress={() => setLightbox(true)}>Ver diagrama</EnlaceLupa>
        </View>
        {caja}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {columna('pasivo')}
          {columna('activo')}
        </View>
        {r.facil && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 6 }}>
              <Text style={tb(16, VERDE.texto, 600)}>Me resulta fácil (+): {r.facil === 'pasivo' ? v.pasivo : v.activo}</Text>
              <AreaTexto value={r.ejemploFacil} onChangeText={(t) => escribir(vIdx, 'ejemploFacil', t)} placeholder="Escribe un ejemplo de tu vida…" />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={tb(16, AMBAR.texto, 600)}>Me resulta difícil (−): {dificil === 'pasivo' ? v.pasivo : v.activo}</Text>
              <AreaTexto value={r.ejemploDificil} onChangeText={(t) => escribir(vIdx, 'ejemploDificil', t)} placeholder="Escribe un ejemplo de tu vida…" />
            </View>
          </View>
        )}
        <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
          <BotonDorado onPress={avanzar} disabled={!listo} padV={18} padH={40}>
            {slide < total - 1 ? 'Siguiente' : 'Completar'}
          </BotonDorado>
        </View>
      </Tarjeta>
    </Shell>
  );
}

/* ─── TEST PROFUNDO (preguntas abiertas) ─── */

export function TestProfundo({ paso, onComplete, modulo }: Props) {
  const preguntas: string[] = paso.preguntas ?? [];
  const total: number = preguntas.length || paso.num_preguntas;
  const [fase, setFase] = useState('caratula');
  const [idx, setIdx] = useState(0);
  const [respuestas, setRespuestas] = useState<string[]>(() => Array(total).fill(''));
  const subir = useSubir();

  if (fase === 'caratula') return <Caratula paso={paso} tipo="test_profundo" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  function avanzar() {
    if (idx + 1 < total) setIdx((i) => i + 1);
    else setFase('cierre');
    subir();
  }

  if (fase === 'cierre') {
    return (
      <Tarjeta>
        <View style={{ paddingTop: 20, paddingBottom: 10 }}>
          <Medalla fondo={VERDE.bg} borde={VERDE.borde} color={VERDE.texto}>
            ✓
          </Medalla>
        </View>
        <Text style={ts(26, NAVY, { marginTop: 16, marginBottom: 12, textAlign: 'center' })}>Autoexamen completado</Text>
        <Text style={tb(16, MUTED, 400, { lineHeight: lh(16, 1.7), textAlign: 'center', marginBottom: 28 })}>
          Gracias por tomarte el tiempo de reflexionar con profundidad. Este ejercicio de autoconocimiento es uno de los más valiosos del curso.
        </Text>
        <View style={{ alignItems: 'center' }}>
          <BotonDorado onPress={() => onComplete({ respuestas })} padV={18} padH={48}>
            Continuar →
          </BotonDorado>
        </View>
      </Tarjeta>
    );
  }

  const lleno = Boolean(respuestas[idx]?.trim());
  return (
    <Shell titulo={paso.titulo} actual={idx + 1} total={total}>
      <Tarjeta>
        <Text style={ts(24, NAVY, { marginBottom: 20, lineHeight: lh(24, 1.45) })}>{preguntas[idx] ?? `Pregunta ${idx + 1}`}</Text>
        <AreaTexto
          value={respuestas[idx]}
          onChangeText={(t) =>
            setRespuestas((prev) => {
              const n = [...prev];
              n[idx] = t;
              return n;
            })
          }
          placeholder="Escribe tu reflexión..."
          fondo={BEIGE}
          minHeight={160}
          pad={[16, 18]}
        />
        <View style={{ marginTop: 22, alignItems: 'flex-end' }}>
          <BotonDorado onPress={avanzar} disabled={!lleno} padV={18} padH={40}>
            {idx + 1 < total ? 'Siguiente' : 'Completar'}
          </BotonDorado>
        </View>
      </Tarjeta>
    </Shell>
  );
}
