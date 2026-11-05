// TemperamentoPerfil, RetosTemperamento, ConclusionModulo, ReflexionGuiada y Sintesis
// (src/formacion/Actividad.jsx de la web).
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { BEIGE, GOLD_REF, GOLD_REF_DK, LINE, MUTED, NAVY, PAPER, TEMP_COLORS, eyebrow } from '../../tema';
import { DIAGRAMA_TEMP, RETRATO_TEMP } from '../assets';
import {
  AMBAR,
  AreaTexto,
  BotonBorde,
  BotonDorado,
  CajaBorde,
  Caratula,
  EnlaceLupa,
  Lightbox,
  Medalla,
  ROJO,
  TEMP_NOMBRE,
  TEMP_SUBTITULO,
  Tarjeta,
  VERDE,
  cursiva,
  lh,
  tb,
  ts,
  useSubir,
  versalita,
} from '../comun';

type Temp = { primary: string; secondary: string | null } | null;

/** Aparición con fundido y desplazamiento (transition opacity/transform de la web). */
export function Fundido({ visible, children, style }: { visible: boolean; children: ReactNode; style?: object }) {
  const [v] = useState(() => new Animated.Value(visible ? 1 : 0));
  useEffect(() => {
    Animated.timing(v, { toValue: visible ? 1 : 0, duration: 300, useNativeDriver: true }).start();
  }, [visible, v]);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }, style]}>{children}</Animated.View>
  );
}

/** Barra fina de páginas (3 px) de la intro y la reflexión guiada. */
export function BarraPaginas({ actual, total }: { actual: number; total: number }) {
  return (
    <View style={{ marginBottom: 10, height: 3, backgroundColor: `${LINE}55`, borderRadius: 2 }}>
      <View style={{ height: 3, backgroundColor: GOLD_REF, borderRadius: 2, width: `${(actual / total) * 100}%` }} />
    </View>
  );
}

function Retrato({ src, tam, radio }: { src: number; tam: number; radio: number }) {
  return (
    <View style={{ mixBlendMode: 'multiply', flexShrink: 0 }}>
      <Image source={src} style={{ width: tam, height: tam, borderRadius: radio }} contentFit="cover" />
    </View>
  );
}

/* ─── CIERRE / SÍNTESIS ─── */

function TempCard({ codigo, tipo, onVerDiagrama }: { codigo: string; tipo: string; onVerDiagrama: (src: number) => void }) {
  return (
    <CajaBorde color={TEMP_COLORS[codigo] ?? LINE} pad={[16, 16]} style={{ flex: 1 }}>
      <Text style={versalita(12)}>Temperamento {tipo}</Text>
      <Text style={ts(22, NAVY, { marginTop: 4 })}>{TEMP_NOMBRE[codigo] ?? '—'}</Text>
      {TEMP_SUBTITULO[codigo] ? <Text style={cursiva(13, MUTED, { marginTop: 2 })}>{TEMP_SUBTITULO[codigo]}</Text> : null}
      {DIAGRAMA_TEMP[codigo] ? (
        <EnlaceLupa onPress={() => onVerDiagrama(DIAGRAMA_TEMP[codigo])} style={{ marginTop: 10 }}>
          Ver diagrama del temperamento
        </EnlaceLupa>
      ) : null}
    </CajaBorde>
  );
}

export function TemperamentoPerfil({ temperamento, onComplete }: { paso: any; temperamento: Temp; onComplete: (r: any) => void }) {
  const [lbSrc, setLbSrc] = useState<number | null>(null);
  const p = temperamento?.primary ?? '';
  const s = temperamento?.secondary;

  return (
    <Tarjeta>
      <Text style={ts(26, NAVY, { marginBottom: 8 })}>Tu temperamento</Text>
      <Text style={tb(15, MUTED, 400, { lineHeight: lh(15, 1.6), marginBottom: 22 })}>Según los resultados de tu test, esta es tu combinación de temperamentos.</Text>

      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 24 }}>
        <TempCard codigo={p} tipo="primario" onVerDiagrama={setLbSrc} />
        {s ? <TempCard codigo={s} tipo="secundario" onVerDiagrama={setLbSrc} /> : null}
      </View>

      {lbSrc != null && <Lightbox src={lbSrc} alt="Diagrama de temperamento" onClose={() => setLbSrc(null)} />}

      <View style={{ borderTopWidth: 1.5, borderTopColor: GOLD_REF, paddingTop: 18, marginBottom: 22 }}>
        <Text style={ts(18, NAVY, { marginBottom: 14 })}>Cómo leer los diagramas:</Text>
        {[
          { signo: '+', texto: 'tu temperamento te facilita este aspecto de la virtud.' },
          { signo: '−', texto: 'tu temperamento te lo dificulta.' },
          { signo: '+/−', texto: 'te facilita una parte y te dificulta otra: lee el texto de la casilla.' },
        ].map((item) => (
          <View key={item.signo} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: LINE }}>
            <Text style={ts(22, NAVY, { width: 48, textAlign: 'center' })}>{item.signo}</Text>
            <Text style={tb(15, NAVY, 400, { lineHeight: lh(15, 1.5), flex: 1 })}>{item.texto}</Text>
          </View>
        ))}
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <BotonDorado onPress={() => onComplete({ visto: true })} size={18} padV={16} padH={38}>
          Siguiente →
        </BotonDorado>
      </View>
    </Tarjeta>
  );
}

function EjemploColapsable({ texto, abierto, onToggle }: { texto?: string; abierto?: boolean; onToggle: () => void }) {
  if (!texto) return null;
  return (
    <View style={{ marginTop: 6 }}>
      <EnlaceLupa onPress={onToggle}>Ver ejemplo</EnlaceLupa>
      {abierto && (
        <View style={{ marginTop: 6, paddingLeft: 16, borderLeftWidth: 2, borderLeftColor: LINE }}>
          <Text style={cursiva(14, MUTED, { lineHeight: lh(14, 1.6) })}>{texto}</Text>
        </View>
      )}
    </View>
  );
}

/** Etiqueta (label) + textarea de 15 px de los retos. */
function CampoRetos({ etiqueta, value, onChangeText, placeholder, filas = 3 }: { etiqueta: ReactNode; value: string; onChangeText: (t: string) => void; placeholder: string; filas?: number }) {
  return (
    <>
      <Text style={tb(14, NAVY, 600, { marginBottom: 6 })}>{etiqueta}</Text>
      <AreaTexto value={value} onChangeText={onChangeText} placeholder={placeholder} size={15} pad={[12, 14]} minHeight={Math.round(15 * 1.55 * filas + 24)} style={{ lineHeight: lh(15, 1.55) }} />
    </>
  );
}

/* ─── RETOS DEL TEMPERAMENTO (cuaderno sección 4) ─── */

const VIRTUD_DESAFIO_DESC: Record<string, string> = {
  Humildad: 'La virtud de la humildad en su conjunto: cuidar de los demás, servirles y vivir en la verdad sobre ti mismo. Tendrás que mejorar esta virtud durante toda tu vida.',
  'Humildad fraterna': 'El aspecto de la virtud de la humildad que te insta a cuidar de los demás y a servirles, en lugar de servirte de ellos.',
  'Humildad fundamental': 'El aspecto de la virtud de la humildad relacionado con el autoconocimiento: vivir en la verdad sobre ti mismo, sobre tus talentos y tus límites.',
  Audacia: 'El aspecto activo de la virtud de la fortaleza: atreverte a actuar, a correr riesgos y a convertir tus sueños en realidad superando el miedo a equivocarte.',
  'Resistencia y persistencia': 'El aspecto pasivo de la virtud de la fortaleza: la perseverancia, la constancia y la fidelidad necesarias para terminar lo que comienzas.',
  Magnanimidad: 'La virtud de la grandeza: aspirar a cosas grandes, soñar en grande y convertir el sueño en una misión que da sentido a tu vida.',
};

export function RetosTemperamento({ paso, temperamento, onComplete }: { paso: any; temperamento: Temp; onComplete: (r: any) => void }) {
  const [fase, setFase] = useState(-1);
  const [textoFacilita, setTextoFacilita] = useState('');
  const [textoDificulta, setTextoDificulta] = useState('');
  const [textoDefectos, setTextoDefectos] = useState('');
  const [lbSrc, setLbSrc] = useState<number | null>(null);
  const [ejemploAbierto, setEjemploAbierto] = useState<Record<string, boolean>>({});
  const subir = useSubir();

  const p = temperamento?.primary ?? '';
  const s = temperamento?.secondary ?? '';
  const perfil = s ? `${p}-${s}` : p;
  const virtudDesafio: string = paso.virtud_desafio_map?.[perfil] ?? paso.virtud_desafio_map?.[p] ?? '—';
  const fd = paso.facilita_dificulta?.[p];
  const compensa = paso.secundario_compensa?.[perfil];
  const ir = (f: number) => {
    setFase(f);
    subir();
  };
  const caja = lbSrc != null ? <Lightbox src={lbSrc} alt="Diagrama de temperamento" onClose={() => setLbSrc(null)} /> : null;

  if (fase === -1) return <Caratula paso={paso} tipo="retos_temperamento" onEmpezar={() => ir(0)} />;

  if (fase === 0) {
    return (
      <Tarjeta>
        <View style={{ flexDirection: 'row', gap: 22, alignItems: 'center', marginBottom: 18 }}>
          {RETRATO_TEMP[p] ? <Retrato src={RETRATO_TEMP[p]} tam={140} radio={6} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={eyebrow}>Paso 1</Text>
            <Text style={ts(24, NAVY, { marginTop: 8, marginBottom: 10 })}>Tu temperamento primario y las virtudes</Text>
            <Text style={tb(15, NAVY, 400, { lineHeight: lh(15, 1.65) })}>
              Tu temperamento primario favorece la práctica de aspectos concretos de cada virtud y dificulta la práctica de otros aspectos.
            </Text>
          </View>
        </View>

        {fd && (
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <CajaBorde fondo={VERDE.bg} color={VERDE.borde} pad={[16, 18]} style={{ flex: 1 }}>
              <Text style={[versalita(12, VERDE.texto, 700, 0.05), { marginBottom: 6 }]}>Favorece</Text>
              <Text style={tb(15, VERDE.texto, 400, { lineHeight: lh(15, 1.5) })}>{fd.facilita}</Text>
            </CajaBorde>
            <CajaBorde fondo={ROJO.bg} color={ROJO.borde} pad={[16, 18]} style={{ flex: 1 }}>
              <Text style={[versalita(12, ROJO.texto, 700, 0.05), { marginBottom: 6 }]}>Dificulta</Text>
              <Text style={tb(15, ROJO.texto, 400, { lineHeight: lh(15, 1.5) })}>{fd.dificulta}</Text>
            </CajaBorde>
          </View>
        )}

        {DIAGRAMA_TEMP[p] ? (
          <View style={{ marginBottom: 20 }}>
            <EnlaceLupa onPress={() => setLbSrc(DIAGRAMA_TEMP[p])}>Ver diagrama de {TEMP_NOMBRE[p]}</EnlaceLupa>
          </View>
        ) : null}

        {caja}

        <View style={{ marginBottom: 20 }}>
          <CampoRetos
            etiqueta="Lo que mi temperamento me facilita"
            value={textoFacilita}
            onChangeText={setTextoFacilita}
            placeholder="Escribe los aspectos de las virtudes que tu temperamento te facilita…"
          />
          <EjemploColapsable texto={paso.ejemplos_facilita?.[p]} abierto={ejemploAbierto.facilita} onToggle={() => setEjemploAbierto((prev) => ({ ...prev, facilita: !prev.facilita }))} />
        </View>

        <View style={{ marginBottom: 24 }}>
          <CampoRetos
            etiqueta="Lo que mi temperamento me dificulta"
            value={textoDificulta}
            onChangeText={setTextoDificulta}
            placeholder="Escribe los aspectos de las virtudes que tu temperamento te dificulta…"
          />
          <EjemploColapsable texto={paso.ejemplos_dificulta?.[p]} abierto={ejemploAbierto.dificulta} onToggle={() => setEjemploAbierto((prev) => ({ ...prev, dificulta: !prev.dificulta }))} />
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <BotonDorado
            onPress={() => {
              setLbSrc(null);
              ir(1);
            }}
            size={18}
            padV={16}
            padH={38}>
            Siguiente →
          </BotonDorado>
        </View>
      </Tarjeta>
    );
  }

  if (fase === 1) {
    return (
      <Tarjeta>
        <Text style={ts(26, NAVY, { marginBottom: 14, textAlign: 'center' })}>Tu virtud-desafío</Text>
        <Text style={tb(15, MUTED, 400, { lineHeight: lh(15, 1.65), marginBottom: 24, textAlign: 'center' })}>
          Cada temperamento tiene una virtud-desafío: la virtud que más necesitas trabajar a lo largo de tu vida.
        </Text>
        <CajaBorde color={TEMP_COLORS[p] ?? GOLD_REF} ancho={4} pad={[24, 28]} style={{ marginBottom: 16 }}>
          <Text style={[versalita(12, MUTED, 700), { marginBottom: 6 }]}>Tu virtud-desafío</Text>
          <Text style={ts(28, NAVY)}>{virtudDesafio}</Text>
        </CajaBorde>
        <Text style={tb(15, NAVY, 400, { lineHeight: lh(15, 1.65), marginBottom: 28 })}>
          {VIRTUD_DESAFIO_DESC[virtudDesafio] ?? 'Si trabajas en ella, te será más fácil trabajar las demás virtudes.'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          <BotonBorde onPress={() => ir(0)} size={16} color={NAVY} padH={28}>
            ← Paso 1
          </BotonBorde>
          <BotonDorado onPress={() => ir(2)} size={18} padV={16} padH={38}>
            Paso 2 →
          </BotonDorado>
        </View>
      </Tarjeta>
    );
  }

  const tarjetaTemp = (codigo: string, etiqueta: string) => (
    <CajaBorde color={TEMP_COLORS[codigo] ?? LINE} pad={[14, 16]} style={{ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      {RETRATO_TEMP[codigo] ? <Retrato src={RETRATO_TEMP[codigo]} tam={70} radio={4} /> : null}
      <View style={{ flexShrink: 1 }}>
        <Text style={versalita(11)}>{etiqueta}</Text>
        <Text style={ts(20, NAVY, { marginTop: 4 })} numberOfLines={1} adjustsFontSizeToFit>
          {TEMP_NOMBRE[codigo]}
        </Text>
      </View>
    </CajaBorde>
  );

  return (
    <Tarjeta>
      <Text style={eyebrow}>Paso 2</Text>
      <Text style={ts(24, NAVY, { marginTop: 8, marginBottom: 14 })}>Tu temperamento secundario</Text>
      <Text style={tb(15, NAVY, 400, { lineHeight: lh(15, 1.65), marginBottom: 18 })}>
        Tu temperamento secundario puede compensar algunos defectos de tu temperamento primario.
      </Text>

      {s ? (
        <View style={{ gap: 12, marginBottom: 20 }}>
          {tarjetaTemp(p, 'Primario')}
          {tarjetaTemp(s, 'Secundario')}
        </View>
      ) : null}

      {compensa ? (
        <CajaBorde fondo="#f0fdf4" color={VERDE.borde} pad={[16, 20]} style={{ marginBottom: 20 }}>
          <Text style={tb(15, VERDE.texto, 400, { lineHeight: lh(15, 1.6) })}>
            Como {TEMP_NOMBRE[p]}/{TEMP_NOMBRE[s]}, {compensa}.
          </Text>
        </CajaBorde>
      ) : null}

      {DIAGRAMA_TEMP[s] ? (
        <View style={{ marginBottom: 20 }}>
          <EnlaceLupa onPress={() => setLbSrc(DIAGRAMA_TEMP[s])}>Ver diagrama de {TEMP_NOMBRE[s]}</EnlaceLupa>
        </View>
      ) : null}

      {caja}

      <View style={{ marginBottom: 24 }}>
        <CampoRetos
          etiqueta="¿Qué defectos de tu temperamento primario pueden ser superados con la ayuda de tu temperamento secundario?"
          value={textoDefectos}
          onChangeText={setTextoDefectos}
          placeholder="Escribe tu reflexión…"
          filas={4}
        />
        <EjemploColapsable texto={paso.ejemplos_defectos?.[perfil]} abierto={ejemploAbierto.defectos} onToggle={() => setEjemploAbierto((prev) => ({ ...prev, defectos: !prev.defectos }))} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 10 }}>
        <BotonBorde
          onPress={() => {
            setLbSrc(null);
            ir(1);
          }}
          size={16}
          color={NAVY}
          padH={28}>
          ← Atrás
        </BotonBorde>
        <BotonDorado onPress={() => onComplete({ visto: true, textoFacilita, textoDificulta, textoDefectos })} size={18} padV={16} padH={38}>
          Siguiente →
        </BotonDorado>
      </View>
    </Tarjeta>
  );
}

/* ─── CONCLUSIÓN DE MÓDULO ─── */

export function ConclusionModulo({ paso, completados, onContinuar, onVolver }: { paso: any; completados: Record<string, any>; onContinuar: (r: any) => void; onVolver: () => void }) {
  const aprendizajes: string[] = paso.aprendizajes ?? [];
  const ejercicios: any[] = paso.ejercicios_evaluables ?? [];

  const scores = ejercicios
    .map((e) => {
      const id = typeof e === 'string' ? e : e.id;
      const label = typeof e === 'string' ? '' : (e.label ?? '');
      const c = completados[id];
      if (!c || typeof c.aciertos !== 'number') return null;
      return { id, label, aciertos: c.aciertos as number, total: c.total as number };
    })
    .filter((x): x is { id: string; label: string; aciertos: number; total: number } => Boolean(x));

  const hayEvaluables = scores.length > 0;
  const bloqueado = hayEvaluables && scores.every((s) => s.aciertos === 0);
  const tono = bloqueado ? ROJO : VERDE;

  return (
    <Tarjeta>
      <View style={{ paddingTop: 20, paddingBottom: 10 }}>
        <Medalla tam={72} fondo={tono.bg} borde={tono.borde} color={tono.texto} size={32}>
          {bloqueado ? '✗' : '✓'}
        </Medalla>
      </View>
      <Text style={ts(26, NAVY, { marginTop: 14, marginBottom: 6, textAlign: 'center', lineHeight: lh(26, 1.3) })}>
        {bloqueado ? 'Módulo no superado' : `Módulo ${paso.modulo_numero} completado`}
      </Text>
      <Text style={tb(15, MUTED, 400, { textAlign: 'center', marginBottom: 20 })}>{paso.modulo_titulo}</Text>

      {hayEvaluables && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          {scores.map((s) => {
            const pct = s.total > 0 ? Math.round((s.aciertos / s.total) * 100) : 0;
            const ok = pct > 0;
            return (
              <View
                key={s.id}
                style={{ flexBasis: scores.length > 1 ? '45%' : '100%', flexGrow: 1, paddingVertical: 18, paddingHorizontal: 20, backgroundColor: PAPER, borderWidth: 1, borderColor: LINE, alignItems: 'center' }}>
                <Text style={ts(28, ok ? (pct >= 70 ? VERDE.texto : AMBAR.texto) : ROJO.texto)}>
                  {s.aciertos} de {s.total}
                </Text>
                {s.label ? <Text style={tb(14, MUTED, 400, { marginTop: 4, textAlign: 'center' })}>{s.label}</Text> : null}
              </View>
            );
          })}
        </View>
      )}

      {!bloqueado && aprendizajes.length > 0 && (
        <CajaBorde style={{ marginBottom: 20 }}>
          <Text style={[versalita(13, MUTED, 700, 0.05), { marginBottom: 10 }]}>En este módulo has aprendido</Text>
          {aprendizajes.map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6, paddingLeft: 6 }}>
              <Text style={tb(16, NAVY, 400, { lineHeight: lh(16, 1.6) })}>•</Text>
              <Text style={tb(16, NAVY, 400, { lineHeight: lh(16, 1.6), flex: 1 })}>{a}</Text>
            </View>
          ))}
        </CajaBorde>
      )}

      {bloqueado && (
        <Text style={tb(15, ROJO.texto, 400, { textAlign: 'center', marginBottom: 8, lineHeight: lh(15, 1.5) })}>
          Necesitas aprobar los cuestionarios para avanzar al siguiente módulo.
        </Text>
      )}

      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
        {bloqueado ? (
          <BotonBorde onPress={onVolver} size={17} color={NAVY} fondo={BEIGE} padV={16} padH={32}>
            Volver al módulo
          </BotonBorde>
        ) : (
          <BotonDorado onPress={() => onContinuar({ completado: true })} padV={18} padH={40}>
            Siguiente módulo →
          </BotonDorado>
        )}
      </View>
    </Tarjeta>
  );
}

/* ─── REFLEXIÓN GUIADA ─── */

export function ReflexionGuiada({ paso, temperamento, onComplete }: { paso: any; temperamento: Temp; onComplete: (r: any) => void }) {
  const raw: any[] = paso.parrafos ?? [];
  const parrafos = raw.reduce<string[]>((acc, p) => {
    if (p.tipo === 'generico') acc.push(p.texto);
    else if (p.tipo === 'condicional' && p.variantes) {
      const texto = p.variantes[temperamento?.primary ?? ''];
      if (texto) acc.push(texto);
    }
    return acc;
  }, []);

  const paginas = parrafos.length <= 2 ? parrafos.map((t) => [t]) : [[parrafos[0], parrafos[1]], parrafos.slice(2)];

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const subir = useSubir();
  const vacio = paginas.length === 0;

  useEffect(() => {
    if (vacio) onComplete({});
  }, [vacio]); // eslint-disable-line react-hooks/exhaustive-deps

  function siguiente() {
    setVisible(false);
    setTimeout(() => {
      if (idx < paginas.length - 1) {
        setIdx(idx + 1);
        setVisible(true);
        subir();
      } else {
        onComplete({});
      }
    }, 300);
  }

  if (vacio) return null;

  const pag = paginas[idx];
  const esUltima = idx === paginas.length - 1;

  return (
    <View>
      <Text style={eyebrow}>Reflexión</Text>
      <Tarjeta style={{ marginTop: 12 }}>
        <Text style={ts(30, NAVY, { marginBottom: 8 })}>Reflexión guiada</Text>
        <Text style={tb(14, MUTED, 400, { marginBottom: 20 })}>
          {idx + 1} de {paginas.length}
        </Text>
        <BarraPaginas actual={idx + 1} total={paginas.length} />
        <Fundido visible={visible} style={{ paddingVertical: 24, gap: 14 }}>
          {pag.map((texto, i) => (
            <Text key={i} style={tb(20, NAVY, 400, { lineHeight: lh(20, 1.75) })}>
              {texto}
            </Text>
          ))}
        </Fundido>
        <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
          <BotonDorado onPress={siguiente} size={18} padV={14} padH={36}>
            {esUltima ? 'Continuar →' : 'Siguiente →'}
          </BotonDorado>
        </View>
      </Tarjeta>
    </View>
  );
}

/* ─── SÍNTESIS (cierre del curso 1) ─── */

function CampoSintesis({ etiqueta, value, onChangeText, placeholder, multilinea }: { etiqueta: string; value: string; onChangeText: (t: string) => void; placeholder: string; multilinea?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={tb(18, NAVY, 600)}>{etiqueta}</Text>
      {multilinea ? (
        <AreaTexto value={value} onChangeText={onChangeText} placeholder={placeholder} minHeight={100} pad={[16, 18]} />
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9a9a9a"
          style={[tb(18, NAVY), { paddingVertical: 16, paddingHorizontal: 18, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff' }]}
        />
      )}
    </View>
  );
}

export function Sintesis({ paso, temperamento, onComplete }: { paso: any; temperamento: Temp; onComplete: (r: any) => void }) {
  const map: Record<string, string> = paso.sintesis?.virtud_desafio_map ?? {};
  const p = temperamento?.primary ?? '';
  const s = temperamento?.secondary;
  const perfilSintesis = s ? `${p}-${s}` : p;
  const virtudDesafio = map[perfilSintesis] ?? map[p] ?? '';
  const [datos, setDatos] = useState({ lo_que_facilita: '', lo_que_cuesta: '', proposito: '' });

  function guardar() {
    onComplete({
      temperamento_primario: temperamento?.primary,
      temperamento_secundario: temperamento?.secondary,
      virtud_desafio: virtudDesafio,
      ...datos,
    });
  }

  const listo = Boolean(datos.lo_que_facilita.trim() && datos.lo_que_cuesta.trim() && datos.proposito.trim());

  return (
    <View>
      <Text style={eyebrow}>Mi Síntesis</Text>
      <Tarjeta style={{ marginTop: 12 }}>
        <Text style={ts(26, NAVY, { marginBottom: 20 })}>Conclusiones del Curso 1</Text>

        <View style={{ flexDirection: 'row', gap: 14, marginBottom: 20 }}>
          <CajaBorde color={TEMP_COLORS[p] ?? LINE} pad={[16, 16]} style={{ flex: 1 }}>
            <Text style={versalita(12)}>Temperamento primario</Text>
            <Text style={ts(22, NAVY, { marginTop: 4 })} numberOfLines={1} adjustsFontSizeToFit>
              {TEMP_NOMBRE[p] ?? '—'}
            </Text>
          </CajaBorde>
          <CajaBorde color={(s && TEMP_COLORS[s]) || LINE} pad={[16, 16]} style={{ flex: 1 }}>
            <Text style={versalita(12)}>Temperamento secundario</Text>
            <Text style={ts(22, NAVY, { marginTop: 4 })} numberOfLines={1} adjustsFontSizeToFit>
              {(s && TEMP_NOMBRE[s]) ?? '—'}
            </Text>
          </CajaBorde>
        </View>

        <LinearGradient
          colors={[BEIGE, 'rgba(165,139,38,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16, borderLeftWidth: 3, borderLeftColor: GOLD_REF, marginBottom: 20 }}>
          <Text style={versalita(12)}>Tu virtud-desafío</Text>
          <Text style={ts(24, GOLD_REF_DK, { marginTop: 4 })}>{virtudDesafio || '—'}</Text>
        </LinearGradient>

        <View style={{ gap: 16 }}>
          <CampoSintesis
            etiqueta="Lo que mi temperamento me facilita"
            value={datos.lo_que_facilita}
            onChangeText={(t) => setDatos((d) => ({ ...d, lo_que_facilita: t }))}
            placeholder="Una frase..."
          />
          <CampoSintesis etiqueta="Lo que más me cuesta" value={datos.lo_que_cuesta} onChangeText={(t) => setDatos((d) => ({ ...d, lo_que_cuesta: t }))} placeholder="Una frase..." />
          <CampoSintesis
            etiqueta="Mi propósito para las próximas semanas"
            value={datos.proposito}
            onChangeText={(t) => setDatos((d) => ({ ...d, proposito: t }))}
            placeholder="Escribe tu propósito..."
            multilinea
          />
        </View>

        <View style={{ marginTop: 22, alignItems: 'flex-end' }}>
          <BotonDorado onPress={guardar} disabled={!listo} padV={16} padH={38}>
            Pasar al siguiente curso →
          </BotonDorado>
        </View>
      </Tarjeta>
    </View>
  );
}
