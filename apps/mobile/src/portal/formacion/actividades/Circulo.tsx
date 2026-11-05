// CirculoPersonas: «¿Conoces a alguien así?» (src/formacion/Actividad.jsx de la web).
// Guarda la ficha en Supabase (personas + persona_estimaciones + persona_observaciones), como la web.
import { useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { BEIGE, GOLD_REF, GOLD_REF_DK, GOLD_REF_LT, LINE, MUTED, NAVY, PAPER, TEMP_COLORS, barraFondo } from '../../tema';
import { NO_SE, PREGUNTAS, TEMPS } from '../../web/lib/personas.js';
import { AreaTexto, BotonDorado, Medalla, TEMP_NOMBRE, Tarjeta, VERDE, cursiva, lh, tb, ts, versalita } from '../comun';
import { anotarObservacion, crearPersona } from '../datos';

const GRUPOS_SIMPLE: [string, string][] = [
  ['familia', 'Familia'],
  ['amigos', 'Amigos'],
  ['trabajo', 'Trabajo / estudios'],
  ['otros', 'Otros'],
];

const MINI_PREGUNTAS_IDX = [0, 1, 2, 3, 5, 7];

const DIAG_IMPOSIBLE = new Set(['COL-FLE', 'FLE-COL', 'MEL-SAN', 'SAN-MEL']);

type Persona = { nombre: string; grupo: string; primario: string; secundario: string | null };

function OpcionTest({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderWidth: 1.5,
        borderColor: pressed ? GOLD_REF : LINE,
        backgroundColor: pressed ? '#fffbf0' : PAPER,
      })}>
      <Text style={tb(15, NAVY, 400, { lineHeight: lh(15, 1.45) })}>{texto}</Text>
    </Pressable>
  );
}

export function CirculoPersonas({ paso, user, onComplete }: { paso: any; user: { id: string } | null; onComplete: (r: any) => void }) {
  const [fase, setFase] = useState('intro');
  const [nombre, setNombre] = useState('');
  const [grupo, setGrupo] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [preguntaIdx, setPreguntaIdx] = useState(0);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [copiado, setCopiado] = useState(false);
  const temp: string = paso.temperamento_tema;

  const [ordenOpciones] = useState<string[][]>(() =>
    MINI_PREGUNTAS_IDX.map(() => {
      const o = [...(TEMPS as string[])];
      for (let i = o.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [o[i], o[j]] = [o[j], o[i]];
      }
      return o;
    }),
  );

  if (fase === 'intro') {
    return (
      <Tarjeta>
        <View style={{ paddingTop: 20, paddingBottom: 10 }}>
          <Medalla tam={72} color={NAVY} size={32}>
            ?
          </Medalla>
        </View>
        <Text style={ts(26, NAVY, { marginTop: 16, marginBottom: 12, textAlign: 'center' })}>¿Conoces a alguien así?</Text>
        <Text style={tb(16, MUTED, 400, { lineHeight: lh(16, 1.7), textAlign: 'center', marginBottom: 12 })}>
          Mientras escuchabas la formación o hacías el examen de autoconciencia, ¿te venía alguien a la cabeza?
        </Text>
        <Text style={tb(16, MUTED, 400, { lineHeight: lh(16, 1.7), textAlign: 'center', marginBottom: 28 })}>
          Este ejercicio te invita a observar el temperamento de las personas que te rodean. Podrás anotar tus impresiones y crear un pequeño perfil para cada una.
        </Text>
        <View style={{ alignItems: 'center' }}>
          <BotonDorado onPress={() => setFase('datos')} padV={18} padH={48}>
            Empezar →
          </BotonDorado>
        </View>
      </Tarjeta>
    );
  }

  function calcularResultado() {
    const puntos: Record<string, number> = { COL: 0, MEL: 0, SAN: 0, FLE: 0 };
    for (const r of respuestas) if (puntos[r] !== undefined) puntos[r] += 1;
    const resto = (TEMPS as string[]).filter((k) => k !== temp).sort((a, b) => puntos[b] - puntos[a]);
    let secundario: string | null = puntos[resto[0]] >= 2 ? resto[0] : null;
    const noSe = respuestas.filter((r) => r === NO_SE).length;
    const confianza = noSe <= 1 ? 'media' : 'baja';
    const imposible = Boolean(secundario && DIAG_IMPOSIBLE.has(`${temp}-${secundario}`));
    if (imposible) secundario = null;
    return { puntos, secundario, confianza, imposible, indeterminado: !secundario && !imposible };
  }

  function responder(tempCode: string) {
    const nuevas = [...respuestas, tempCode];
    setRespuestas(nuevas);
    if (preguntaIdx < MINI_PREGUNTAS_IDX.length - 1) setPreguntaIdx(preguntaIdx + 1);
    else setFase('resumen');
  }

  function retrocederPregunta() {
    if (preguntaIdx > 0) {
      setRespuestas(respuestas.slice(0, -1));
      setPreguntaIdx(preguntaIdx - 1);
    } else {
      setFase('datos');
      setRespuestas([]);
      setPreguntaIdx(0);
    }
  }

  async function guardar() {
    const n = nombre.trim();
    if (!n || !grupo || !user?.id) return;
    setGuardando(true);
    try {
      const { puntos, secundario, confianza } = calcularResultado();
      const estimacion = { primario: temp, secundario, confianza, puntos, respuestas };
      const persona = await crearPersona(user.id, { nombre: n, grupo }, estimacion);
      if (notas.trim() && persona?.id) {
        await anotarObservacion(user.id, persona.id, { situacion: 'nota_formacion', palabra: null, temperamento: null, linea: notas.trim() });
      }
      setPersonas((prev) => [...prev, { nombre: n, grupo, primario: temp, secundario }]);
      setNombre('');
      setGrupo(null);
      setRespuestas([]);
      setPreguntaIdx(0);
      setNotas('');
      setFase('listado');
    } catch (err) {
      console.error('Error al guardar persona:', err);
    } finally {
      setGuardando(false);
    }
  }

  const preguntaActual = fase === 'test' ? (PREGUNTAS as [string, Record<string, string>][])[MINI_PREGUNTAS_IDX[preguntaIdx]] : null;
  const resultado = fase === 'resumen' ? calcularResultado() : null;
  const listoDatos = Boolean(nombre.trim() && grupo);

  return (
    <Tarjeta>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: TEMP_COLORS[temp] ?? BEIGE,
            borderWidth: 2,
            borderColor: TEMP_COLORS[temp] ?? GOLD_REF,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={ts(22, '#fff')}>{TEMP_NOMBRE[temp]?.[0] ?? '?'}</Text>
        </View>
      </View>

      <Text style={ts(24, NAVY, { marginBottom: 8, textAlign: 'center' })}>{paso.titulo}</Text>

      {/* ── FASE DATOS ── */}
      {fase === 'datos' && (
        <>
          <Text style={tb(15, MUTED, 400, { lineHeight: lh(15, 1.65), marginBottom: 8, textAlign: 'center' })}>{paso.pregunta}</Text>
          <Text style={cursiva(14, NAVY, { lineHeight: lh(14, 1.5), marginBottom: 22, textAlign: 'center' })}>
            {TEMP_NOMBRE[temp]}: {paso.descripcion_temp}
          </Text>

          {personas.length > 0 && (
            <View style={{ marginBottom: 18 }}>
              <Text style={[versalita(12, MUTED, 700, 0.05), { marginBottom: 8 }]}>Personas añadidas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {personas.map((p, i) => (
                  <View key={i} style={{ paddingVertical: 6, paddingHorizontal: 14, backgroundColor: VERDE.bg, borderWidth: 1, borderColor: VERDE.borde }}>
                    <Text style={tb(14, VERDE.texto)}>
                      {p.nombre}
                      {p.secundario ? ` · ${TEMP_NOMBRE[p.secundario]}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ marginBottom: 14 }}>
            <Text style={tb(14, NAVY, 600, { marginBottom: 6 })}>Nombre o apodo</Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: María, mi jefe, el abuelo…"
              placeholderTextColor="#9a9a9a"
              maxLength={40}
              autoComplete="off"
              autoCorrect={false}
              style={[tb(15, NAVY), { paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff' }]}
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={tb(14, NAVY, 600, { marginBottom: 8 })}>¿De qué entorno?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GRUPOS_SIMPLE.map(([key, label]) => {
                const activo = grupo === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setGrupo(activo ? null : key)}
                    style={{ paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1.5, borderColor: activo ? NAVY : LINE, backgroundColor: activo ? NAVY : PAPER }}>
                    <Text style={tb(14, activo ? PAPER : NAVY)}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {listoDatos && (
            <Text style={cursiva(14, MUTED, { lineHeight: lh(14, 1.6), marginBottom: 14 })}>
              A continuación harás un breve test (6 preguntas) para estimar qué temperamento secundario tiene {nombre.trim()}.
            </Text>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            <BotonDorado
              onPress={() => {
                setFase('test');
                setPreguntaIdx(0);
                setRespuestas([]);
              }}
              disabled={!listoDatos}
              size={16}
              padV={14}
              padH={28}
              textStyle={listoDatos ? undefined : { color: MUTED }}>
              Siguiente →
            </BotonDorado>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: LINE, marginTop: 20, paddingTop: 18, alignItems: 'flex-end' }}>
            <BotonDorado onPress={() => onComplete({ personas: personas.length })} size={18} padV={16} padH={38}>
              {personas.length > 0 ? 'Continuar →' : 'Saltar →'}
            </BotonDorado>
          </View>
        </>
      )}

      {/* ── FASE LISTADO ── */}
      {fase === 'listado' && (
        <>
          <Text style={ts(22, NAVY, { marginBottom: 6, textAlign: 'center' })}>Personas añadidas</Text>
          <Text style={tb(14, MUTED, 400, { textAlign: 'center', marginBottom: 20 })}>{personas.length === 1 ? '1 persona' : `${personas.length} personas`}</Text>

          <View style={{ gap: 10, marginBottom: 24 }}>
            {personas.map((p, i) => {
              const grupoLabel = GRUPOS_SIMPLE.find(([k]) => k === p.grupo)?.[1] ?? p.grupo;
              const c = TEMP_COLORS[p.primario];
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                    backgroundColor: PAPER,
                    borderWidth: 1,
                    borderColor: LINE,
                    borderLeftWidth: 4,
                    borderLeftColor: c ?? GOLD_REF,
                  }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c ? `${c}22` : BEIGE, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={ts(16, c ?? NAVY)}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={tb(16, NAVY, 600)}>{p.nombre}</Text>
                    <Text style={tb(13, MUTED, 400, { marginTop: 2 })}>
                      {grupoLabel} · {TEMP_NOMBRE[p.primario]}
                      {p.secundario ? ` / ${TEMP_NOMBRE[p.secundario]}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            <Pressable
              onPress={() => setFase('datos')}
              style={({ pressed }) => ({ flex: 1, minWidth: 160, backgroundColor: PAPER, borderWidth: 1.5, borderColor: LINE, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Text style={tb(15, NAVY, 600)}>+ Añadir otra persona</Text>
            </Pressable>
            <BotonDorado onPress={() => onComplete({ personas: personas.length })} size={15} padV={14} padH={24} style={{ flex: 1, minWidth: 160 }}>
              Continuar →
            </BotonDorado>
          </View>
        </>
      )}

      {/* ── FASE TEST (6 preguntas) ── */}
      {fase === 'test' && preguntaActual && (
        <>
          <Text style={tb(13, MUTED, 400, { textAlign: 'center', marginBottom: 6 })}>Piensa en cómo reacciona {nombre.trim()}, no en cómo es por fuera.</Text>
          <View style={{ ...barraFondo, marginTop: 12, marginBottom: 8 }}>
            <View style={{ height: '100%', width: `${Math.round(((preguntaIdx + 1) / MINI_PREGUNTAS_IDX.length) * 100)}%`, backgroundColor: GOLD_REF_DK }} />
          </View>
          <Text style={tb(14, MUTED, 400, { marginBottom: 22, textAlign: 'center' })}>
            Pregunta {preguntaIdx + 1} de {MINI_PREGUNTAS_IDX.length}
          </Text>

          <Text style={ts(20, NAVY, { marginBottom: 18, textAlign: 'center' })}>{preguntaActual[0]}</Text>

          <View style={{ gap: 10, marginBottom: 16 }}>
            {ordenOpciones[preguntaIdx].map((tKey) => (
              <OpcionTest key={tKey} texto={preguntaActual[1][tKey]} onPress={() => responder(tKey)} />
            ))}
            <Pressable
              onPress={() => responder(NO_SE)}
              style={({ pressed }) => ({ paddingVertical: 10, paddingHorizontal: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: LINE, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Text style={cursiva(14, MUTED)}>No lo sé</Text>
            </Pressable>
          </View>

          <Pressable onPress={retrocederPregunta} hitSlop={8} style={{ paddingVertical: 4, alignSelf: 'flex-start' }}>
            <Text style={tb(14, MUTED)}>← {preguntaIdx === 0 ? 'Volver' : 'Pregunta anterior'}</Text>
          </Pressable>
        </>
      )}

      {/* ── FASE RESUMEN + NOTAS ── */}
      {fase === 'resumen' &&
        resultado &&
        (() => {
          const sinResultado = resultado.imposible || !resultado.secundario;
          const urlTest = 'https://virtuousleadership.com/es/tests/temperamento?utm_source=portal&utm_medium=referral&utm_campaign=conoces_alguien';
          const textoWa = `Hola, te invito a hacer este test de temperamento para conocerte mejor: ${urlTest}`;
          const urlWa = `https://wa.me/?text=${encodeURIComponent(textoWa)}`;
          const sec = resultado.secundario;
          return (
            <>
              <Text style={tb(15, MUTED, 400, { textAlign: 'center', marginBottom: 20, lineHeight: lh(15, 1.6) })}>
                Resultado estimado para <Text style={tb(15, NAVY, 700)}>{nombre.trim()}</Text>
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <View style={{ alignItems: 'center', paddingVertical: 14, paddingHorizontal: 22, backgroundColor: TEMP_COLORS[temp] ? `${TEMP_COLORS[temp]}18` : '#f5f0e8', borderWidth: 1.5, borderColor: TEMP_COLORS[temp] ?? LINE }}>
                  <Text style={[versalita(11, MUTED, 700), { marginBottom: 4 }]}>Primario</Text>
                  <Text style={ts(18, NAVY)}>{TEMP_NOMBRE[temp]}</Text>
                </View>
                <View style={{ alignItems: 'center', paddingVertical: 14, paddingHorizontal: 22, backgroundColor: sec ? `${TEMP_COLORS[sec]}18` : '#f9f9f9', borderWidth: 1.5, borderColor: sec ? TEMP_COLORS[sec] : LINE }}>
                  <Text style={[versalita(11, MUTED, 700), { marginBottom: 4 }]}>Secundario</Text>
                  <Text style={ts(18, sec ? NAVY : MUTED)}>{sec ? TEMP_NOMBRE[sec] : 'No determinado'}</Text>
                </View>
              </View>

              {sinResultado ? (
                <View style={{ alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#fef9ee', borderWidth: 1, borderColor: GOLD_REF_LT, marginBottom: 20 }}>
                  <Text style={tb(14, NAVY, 400, { marginBottom: 6, lineHeight: lh(14, 1.6), textAlign: 'center' })}>
                    {resultado.imposible
                      ? `La combinación ${TEMP_NOMBRE[temp]} con el secundario estimado no es posible según el modelo de temperamentos.`
                      : 'Las respuestas no son suficientes para determinar un temperamento secundario.'}
                  </Text>
                  <Text style={tb(13, MUTED, 400, { lineHeight: lh(13, 1.5), textAlign: 'center' })}>Lo mejor es que {nombre.trim()} haga el test de temperamento completo.</Text>
                </View>
              ) : (
                <Text style={cursiva(12, MUTED, { textAlign: 'center', marginBottom: 20 })}>Es una estimación tuya — solo {nombre.trim()} puede confirmarlo haciendo el test.</Text>
              )}

              {/* ── COMPARTIR TEST ── */}
              <View style={{ borderTopWidth: 1, borderTopColor: LINE, marginBottom: 20, paddingTop: 16 }}>
                <Text style={tb(14, NAVY, 600, { marginBottom: 10, textAlign: 'center' })}>Invita a {nombre.trim()} a hacer el test completo</Text>
                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Pressable
                    onPress={() => {
                      Clipboard.setStringAsync(urlTest).then(() => {
                        setCopiado(true);
                        setTimeout(() => setCopiado(false), 2000);
                      });
                    }}
                    style={{ paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1.5, borderColor: NAVY, backgroundColor: copiado ? NAVY : PAPER, minWidth: 140, alignItems: 'center' }}>
                    <Text style={tb(14, copiado ? PAPER : NAVY, 600)}>{copiado ? 'Enlace copiado' : 'Copiar enlace'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL(urlWa)}
                    style={({ pressed }) => ({ paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1.5, borderColor: '#25d366', backgroundColor: '#25d366', minWidth: 140, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
                    <Text style={tb(14, '#fff', 600)}>Compartir por WhatsApp</Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={tb(14, NAVY, 600, { marginBottom: 6 })}>
                  Notas sobre {nombre.trim()} <Text style={tb(14, MUTED, 400)}>(opcional)</Text>
                </Text>
                <AreaTexto
                  value={notas}
                  onChangeText={setNotas}
                  placeholder="Observaciones, cómo le tratas, lo que te llama la atención…"
                  size={15}
                  pad={[12, 14]}
                  minHeight={70}
                  style={{ lineHeight: lh(15, 1.5) }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Pressable
                  onPress={() => {
                    setFase('test');
                    setRespuestas(respuestas.slice(0, -1));
                    setPreguntaIdx(MINI_PREGUNTAS_IDX.length - 1);
                  }}
                  hitSlop={8}
                  style={{ paddingVertical: 4 }}>
                  <Text style={tb(14, MUTED)}>← Volver</Text>
                </Pressable>
                <BotonDorado onPress={guardar} disabled={guardando} size={16} padV={14} padH={28} style={[{ flex: 1 }, guardando ? { backgroundColor: GOLD_REF } : null]}>
                  {guardando ? 'Guardando…' : 'Guardar persona'}
                </BotonDorado>
              </View>
            </>
          );
        })()}
    </Tarjeta>
  );
}
