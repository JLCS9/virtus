// Onboarding del portal («Bienvenida», /app/bienvenida): una sucesión de pantallas que presentan al
// usuario su resultado, los temperamentos, su virtud-desafío, el carácter, el liderazgo virtuoso y el
// portal. Va «súper limpio»: AppShell oculta la cabecera y la burbuja en esta ruta; aquí solo hay
// barra de progreso, contenido y botones. Será obligatorio la primera vez (pendiente: marca en BD);
// desde Perfil → Configuración se vuelve a abrir para pruebas.
//
// Orden: Bienvenida → Eres… → Tu punto fuerte → Tu punto débil → «¿Conoces los temperamentos?»
//   No → Tu temperamento principal → Tu temperamento secundario → Los otros temperamentos →
//        Cada temperamento tiene su virtud-desafío → tu virtud-desafío
//   Sí → tu virtud-desafío
// → Liderar es una cuestión de carácter → «¿Sabes lo que es el carácter?»
//   No → Tu carácter lo construyes tú → Las virtudes
// → La promesa → Tu día a día: hora del reto, hora de la reflexión, día y hora de la formación
//   (las preguntas y el guardado son los de Horarios.jsx de Jose; aquí solo cambia el diseño).
//   Al terminar se guardan en preferencias_notificaciones y se entra al portal.
//
// Pantallas por tema, rápidas y con poco texto, todo centrado (horizontal y vertical). Sin columnas
// largas, ejemplos plegados ni diagramas. Estilos del portal (Curso 1). Solo barra de progreso, sin
// contador «X de Y».
// Datos de temperamentos y virtudes: guías del perfil (i18n result.profiles) y el paso m1-13c del
// Curso 1 («Los retos de mi temperamento»).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalPath, useT } from '../i18n';
import { useSession } from '../account/useSession';
import { fetchLatestTemperament, fetchNombreYSexo, saludoBienvenida } from '../account/account';
import { CHALLENGE_VIRTUE } from '../account/challengeVirtues';
import { claveTemperamento, VIRTUDES } from '../lib/virtudes.js';
import curso1 from '../data/curso1.json';
import { guardarPreferencias } from '../account/preferencias';
import { DIAS_SEMANA, HORAS_SUGERIDAS, horaValida, normalizar, textoZona, zonaDelDispositivo } from '../lib/preferencias.js';
import { PASOS_HORARIOS, usePreferencias } from './Horarios';
import { GOLD_REF, GOLD_REF_DK, INK, LINE, MUTED, NAVY, PAPER, TEMP_COLORS, FONT_BODY, FONT_SLAB } from '../theme';
import { botonPrimario, eyebrow } from './estilos';

// Escala tipográfica única del onboarding: solo dos pesos. Roboto Slab 700 para títulos (h2 34px,
// títulos de caja y énfasis 20px) y Roboto 400 para todo lo demás (texto 20px, cajas 18px, notas
// 16px, etiquetas 12–13px). El eyebrow y los botones son los del portal.
const h2 = { fontFamily: FONT_SLAB, fontSize: 34, fontWeight: 700, color: NAVY, lineHeight: 1.2, margin: '10px 0 24px', textWrap: 'balance' };
const texto = { fontFamily: FONT_BODY, fontSize: 20, fontWeight: 400, lineHeight: 1.75, color: INK, margin: '0 0 22px' };
const separados = { ...texto, margin: '0 0 12px' };
const intro = { ...texto, color: MUTED, margin: '0 0 30px' };
const tituloCaja = { fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, lineHeight: 1.3 };
const enfasis = { ...texto, ...tituloCaja, lineHeight: 1.6 };
const parrafoCaja = { fontFamily: FONT_BODY, fontSize: 18, fontWeight: 400, lineHeight: 1.65, color: INK, margin: 0 };
const nota = { fontFamily: FONT_BODY, fontSize: 16, fontWeight: 400, color: MUTED };
const mini = { fontFamily: FONT_BODY, fontSize: 12, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED };

const TEMP_NOMBRE = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };
const TEMP_FOCO = { COL: 'La acción', MEL: 'Las ideas', SAN: 'Las personas', FLE: 'La paz' };

// Definiciones de los cuatro temperamentos: las del ejercicio «Define» del Curso 1 (sin «Orientado a…»,
// que ya va como subtítulo).
const TEMP_DEF = {
  COL: 'Manager nacido, enérgico y decidido, con confianza natural en sí mismo.',
  MEL: 'Contemplativo, perfeccionista, independiente y creador por naturaleza.',
  SAN: 'Comunicador nacido, con los sentidos despiertos y pasión por la aventura.',
  FLE: 'Desapasionado y científico, con una voluntad de hierro oculta bajo su calma exterior.',
};

// «Los retos de mi temperamento» (Curso 1, m1-13c): qué virtud facilita y cuál dificulta cada
// temperamento, con sus ejemplos, y cómo compensa el secundario.
const RETOS = curso1.pasos.find((x) => x.id === 'm1-13c') ?? {};

// Intro breve de cada uno de los 12 perfiles. Redactadas a partir de la «fortaleza» de cada guía.
// Sin adjetivos con género. PENDIENTE de revisión por Formación.
const INTRO_PERFIL = {
  COL: 'Tu temperamento te orienta a la acción. Te mueven los retos y los resultados, y tienes un don natural para organizar y dirigir.',
  'COL-MEL': 'Unes la energía para actuar con una sensibilidad profunda. Te mueven los resultados, pero quieres alcanzarlos bien y con sentido.',
  'COL-SAN': 'Unes el impulso de la acción con el cariño por las personas. Consigues resultados y, a la vez, sabes cuidar las relaciones.',
  MEL: 'Tu temperamento te orienta a las ideas. Tienes un mundo interior rico, un espíritu creativo y el deseo de hacer las cosas de forma perfecta.',
  'MEL-COL': 'Tu sensibilidad te permite soñar en grande y tu energía te empuja a convertir esos sueños en realidad.',
  'MEL-FLE': 'Tienes sensibilidad, creatividad y deseo de perfección, y a la vez una mirada serena y práctica que te mantiene con los pies en la tierra.',
  SAN: 'Tu temperamento te orienta a las personas. Tienes facilidad para comunicarte y transmites calidez y alegría de vivir.',
  'SAN-COL': 'Te importan las personas y quieres hacerlas felices, y a la vez tienes empuje para actuar y lograr resultados.',
  'SAN-FLE': 'Te importan las personas y quieres hacerlas felices, y a la vez tienes una mirada serena y racional que da equilibrio a tu vida.',
  FLE: 'Tu temperamento te orienta a la paz. Tienes serenidad, sentido práctico y una mirada objetiva que te ayuda a resolver problemas y a unir a los demás.',
  'FLE-MEL': 'Tienes serenidad y sentido práctico, y a la vez una sensibilidad profunda que te impulsa a soñar en grande.',
  'FLE-SAN': 'Tienes serenidad y sentido práctico, y a la vez un gran cariño por las personas que te ayuda a crear buenas relaciones.',
};

// Nombre del perfil en femenino (las guías solo lo dan en masculino).
const PERFIL_FEMENINO = {
  COL: 'La ejecutora', 'COL-MEL': 'La ejecutora contemplativa', 'COL-SAN': 'La ejecutora amable',
  MEL: 'La soñadora', 'MEL-COL': 'La soñadora ejecutora', 'MEL-FLE': 'La soñadora pragmática',
  SAN: 'La comunicadora', 'SAN-COL': 'La comunicadora atenta', 'SAN-FLE': 'La comunicadora reservada',
  FLE: 'La mediadora', 'FLE-MEL': 'La mediadora contemplativa', 'FLE-SAN': 'La mediadora amable',
};

// Punto fuerte y punto débil de cada perfil en una frase corta (pantalla «Eres…»). Resumidos de la
// «fortaleza» y la «debilidad» de cada guía. PENDIENTE de revisión por Formación.
const PUNTOS = {
  COL: ['Tienes energía y entusiasmo, te mueven la acción y los logros, y se te da bien gestionar.', 'Te centras tanto en la actividad y los resultados que descuidas a las personas y tu propio crecimiento.'],
  'COL-MEL': ['Abordas las tareas con energía y, a la vez, con sensibilidad y una mente creativa.', 'Puedes servirte de las personas en lugar de servirles, y tu lado introspectivo puede hacer que te olvides de ellas.'],
  'COL-SAN': ['Haces las cosas con eficacia y, a la vez, construyes buenas relaciones con los demás.', 'Tu impulso puede llevarte al activismo sin rumbo, y te ocupas más de los demás que de conocerte.'],
  MEL: ['Tienes un espíritu contemplativo, original y creativo, y buscas la perfección en todo.', 'Te dan miedo la acción, la incertidumbre y el riesgo.'],
  'MEL-COL': ['Sueñas en grande y tienes la energía para convertir esos sueños en una misión.', 'Tiendes a encerrarte en ti y a olvidarte de los demás, o a utilizarlos en lugar de servirles.'],
  'MEL-FLE': ['Unes sensibilidad, creatividad y deseo de perfección con sentido práctico.', 'Te da miedo actuar y equivocarte, así que te cuesta tomar la iniciativa.'],
  SAN: ['Te comunicas con facilidad y transmites calidez y alegría de vivir.', 'Empiezas muchas cosas y te cuesta terminarlas: siempre buscas algo nuevo.'],
  'SAN-COL': ['Te importan las personas y sabes cuidar las relaciones, y además tienes empuje para lograr resultados.', 'Conoces mejor a los demás que a ti, y tu impulso puede llevarte a un activismo ciego.'],
  'SAN-FLE': ['Creas buenas relaciones con facilidad, y tu lado sereno y racional da coherencia a tu vida.', 'Vives mucho en el presente y te cuesta soñar con posibilidades más grandes.'],
  FLE: ['Tienes serenidad, sentido práctico y precisión: resuelves problemas y unes a las personas.', 'Buscas la seguridad y nunca vas a contracorriente.'],
  'FLE-MEL': ['Tienes los pies en la tierra y, a la vez, una sensibilidad que te impulsa a soñar en grande.', 'El miedo a equivocarte y a la imperfección te frena a la hora de actuar.'],
  'FLE-SAN': ['Tu serenidad da coherencia a tu vida y se te dan bien las relaciones con los demás.', 'Te cuesta soñar y vives tanto en el presente que pierdes la visión a largo plazo.'],
};

// Rasgos del punto fuerte y del punto débil de cada perfil (2–3 palabras clave), sacados de la
// «fortaleza» y la «debilidad» de cada guía. Dan estructura sin añadir texto. PENDIENTE de revisión.
const RASGOS = {
  COL: [['Energía y entusiasmo', 'Orientación a la acción', 'Capacidad de gestión'], ['Activismo', 'Descuidar a las personas', 'Descuidar tu crecimiento']],
  'COL-MEL': [['Energía para actuar', 'Sensibilidad profunda', 'Mente creativa'], ['Servirte de las personas', 'Encerrarte en ti']],
  'COL-SAN': [['Eficacia', 'Cariño por las personas', 'Buenas relaciones'], ['Activismo sin rumbo', 'Poco autoconocimiento']],
  MEL: [['Contemplación', 'Creatividad', 'Búsqueda de la perfección'], ['Miedo a la acción', 'Miedo a la incertidumbre', 'Aversión al riesgo']],
  'MEL-COL': [['Soñar en grande', 'Sensibilidad', 'Fuerza para lograrlo'], ['Ensimismamiento', 'Utilizar a los demás']],
  'MEL-FLE': [['Sensibilidad', 'Creatividad', 'Sentido práctico'], ['Miedo a la acción', 'Falta de iniciativa']],
  SAN: [['Comunicación', 'Calidez', 'Alegría de vivir'], ['Poca constancia', 'Dejar las cosas a medias']],
  'SAN-COL': [['Amor por las personas', 'Buenas relaciones', 'Empuje para actuar'], ['Poco autoconocimiento', 'Activismo ciego']],
  'SAN-FLE': [['Amor por las personas', 'Serenidad', 'Coherencia'], ['Vivir solo el presente', 'Miedo a soñar']],
  FLE: [['Serenidad', 'Sentido práctico', 'Mediación'], ['Buscar la seguridad', 'No arriesgar']],
  'FLE-MEL': [['Realismo', 'Precisión', 'Soñar en grande'], ['Miedo a equivocarte', 'Miedo a la imperfección']],
  'FLE-SAN': [['Serenidad', 'Coherencia', 'Buenas relaciones'], ['Miedo a soñar', 'Poca visión a largo plazo']],
};

// Virtudes: las cuatro fundamentales y las dos que son la esencia del liderazgo (Curso 4).
const FUNDAMENTALES = ['prudencia', 'fortaleza', 'dominio', 'justicia'];
const ESENCIA = ['magnanimidad', 'humildad'];
const nombreVirtud = (k) => VIRTUDES.find((v) => v.clave === k)?.nombre ?? k;

// «EL COMUNICADOR ATENTO» → «El comunicador atento».
const capitalizar = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '');
const nombrePerfil = (d) => (d.sexo === 'mujer' && PERFIL_FEMENINO[d.clave]) || capitalizar(d.perfil?.name);

/* ─── Piezas ─── */

const fondoChip = 'rgba(27,42,74,0.06)';

// Etiqueta pequeña de temperamento: «TEMPERAMENTO PRINCIPAL ● Colérico».
function EtiquetaTemp({ temp, rol }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 17, fontWeight: 400, color: NAVY, padding: '8px 14px', background: fondoChip }}>
      <span style={mini}>{rol}</span>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: TEMP_COLORS[temp] }} />
      {TEMP_NOMBRE[temp]}
    </span>
  );
}

// Fila de etiquetas centradas (rasgos, virtudes).
function Chips({ items, marca }) {
  return (
    <div className="vl-onb-serie" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
      {items.map((t) => (
        <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 17, fontWeight: 400, color: NAVY, padding: '8px 14px', background: fondoChip }}>
          {marca && <span style={{ ...tituloCaja, fontSize: 17, color: GOLD_REF_DK }}>{marca}</span>}
          {t}
        </span>
      ))}
    </div>
  );
}

// Acento superior: raya corta (45px), centrada sobre la caja o, si el texto va a la izquierda,
// a 20px del borde izquierdo.
const Acento = ({ color = GOLD_REF, izquierda = false }) => (
  <span aria-hidden style={{ position: 'absolute', top: 0, width: 45, height: 3, background: color, ...(izquierda ? { left: 20 } : { left: '50%', transform: 'translateX(-50%)' }) }} />
);

// Caja de un temperamento en «Los otros temperamentos»: nombre, foco y definición.
function CajaTemperamento({ temp }) {
  return (
    <div style={{ position: 'relative', background: PAPER, padding: '22px 20px 20px', minWidth: 0, textAlign: 'left' }}>
      <Acento color={TEMP_COLORS[temp]} izquierda />
      <div style={tituloCaja}>{TEMP_NOMBRE[temp]}</div>
      <div style={nota}>Orientado a {TEMP_FOCO[temp].toLowerCase()}</div>
      <p style={{ ...parrafoCaja, margin: '10px 0 0' }}>{TEMP_DEF[temp]}</p>
    </div>
  );
}

// Pantalla de un temperamento propio (principal o secundario): todo lo suyo, ordenado.
function FichaPropia({ temp }) {
  const fd = RETOS.facilita_dificulta?.[temp];
  return (
    <>
      <div className="vl-onb-serie" style={{ display: 'flex', justifyContent: 'center', margin: '0 0 28px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...nota, color: NAVY, padding: '6px 12px', background: fondoChip }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: TEMP_COLORS[temp] }} />
          Orientado a {TEMP_FOCO[temp].toLowerCase()}
        </span>
      </div>
      <p style={{ ...texto, margin: '0 0 32px' }}>{TEMP_DEF[temp]}</p>
      {fd && (
        <div className="vl-onb-serie vl-onb-rejilla" style={{ display: 'grid', gap: 18, maxWidth: 640, width: '100%', margin: '0 auto' }}>
          {[['+', 'Te resulta fácil', fd.facilita], ['−', 'Te cuesta', fd.dificulta]].map(([sg, t, v]) => (
            <div key={t} style={{ position: 'relative', background: PAPER, padding: '20px 20px 16px' }}>
              <Acento />
              <div style={mini}>{sg} {t}</div>
              <div style={{ ...tituloCaja, marginTop: 4 }}>{v.charAt(0).toUpperCase() + v.slice(1)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Sí sin color (borde LINE) y No con el estilo de «Continuar» (dorado), los dos del mismo tamaño.
const botonAnterior = { fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: MUTED, background: 'none', border: `1px solid ${LINE}`, borderRadius: 0, padding: '14px 24px', cursor: 'pointer' };
const botonSiguiente = { ...botonPrimario, fontSize: 19, padding: '18px 40px' };

function BotonesSiNo({ responder }) {
  return (
    <div className="vl-onb-serie" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 36 }}>
      <button type="button" onClick={() => responder(true)} className="vl-onb-opcion" style={{ ...botonAnterior, fontSize: 19, padding: '18px 40px', minWidth: 120 }}>Sí</button>
      <button type="button" onClick={() => responder(false)} className="vl-onb-cta" style={{ ...botonSiguiente, border: `1px solid ${GOLD_REF}`, minWidth: 120, justifyContent: 'center' }}>No</button>
    </div>
  );
}

// Botón de opción (horas, días): sin color y, elegido, en dorado como «Continuar».
function OpcionHorario({ activa, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activa} className="vl-onb-opcion" style={{
      fontFamily: FONT_BODY, fontSize: 18, fontWeight: 400, minWidth: 92, padding: '12px 18px', cursor: 'pointer', borderRadius: 0,
      color: activa ? '#fff' : NAVY, background: activa ? GOLD_REF : 'none', border: `1px solid ${activa ? GOLD_REF : LINE}`,
    }}>{children}</button>
  );
}

// Una pregunta de «Tu día a día»: horas sugeridas, otra hora a mano y, en la formación, el día.
function PasoHorario({ paso, prefs, setPrefs }) {
  const cambiar = (campo, v) => setPrefs((x) => ({ ...x, [campo]: v }));
  return (
    <>
      {paso.conDia && (
        <>
          <div style={{ ...mini, marginBottom: 12 }}>El día</div>
          <div className="vl-onb-serie" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 30 }}>
            {DIAS_SEMANA.map((nombre, i) => (
              <OpcionHorario key={nombre} activa={prefs.dia_formacion === i + 1} onClick={() => cambiar('dia_formacion', i + 1)}>{nombre}</OpcionHorario>
            ))}
          </div>
          <div style={{ ...mini, marginBottom: 12 }}>A las</div>
        </>
      )}
      <div className="vl-onb-serie" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {HORAS_SUGERIDAS[paso.campo].map((h) => (
          <OpcionHorario key={h} activa={prefs[paso.campo] === h} onClick={() => cambiar(paso.campo, h)}>{h}</OpcionHorario>
        ))}
      </div>
      <label htmlFor={`onb-${paso.campo}`} style={{ ...mini, display: 'block', margin: '24px 0 10px' }}>O elige otra hora</label>
      <div>
        <input id={`onb-${paso.campo}`} type="time" step={300} value={prefs[paso.campo]}
               onChange={(e) => { if (horaValida(e.target.value)) cambiar(paso.campo, e.target.value); }}
               style={{ fontFamily: FONT_BODY, fontSize: 20, padding: '10px 14px', borderRadius: 0, border: `1px solid ${LINE}`, color: INK, background: PAPER, textAlign: 'center' }} />
      </div>
      <p style={{ ...nota, margin: '24px 0 0' }}>Hora de {textoZona(prefs.zona_horaria)}. Podrás cambiarlo cuando quieras desde tu perfil.</p>
    </>
  );
}

/* ─── Datos ─── */

function useDatos() {
  const session = useSession();
  const { t } = useT();
  const [nombre, setNombre] = useState('');
  const [sexo, setSexo] = useState(null);
  const [fila, setFila] = useState(undefined);
  const user = session?.user;

  useEffect(() => {
    if (!user) return undefined;
    let vivo = true;
    fetchNombreYSexo(user).then((x) => { if (vivo) { setNombre(x.nombre); setSexo(x.sexo); } }).catch(() => {});
    fetchLatestTemperament().then((r) => { if (vivo) setFila(r ?? null); }).catch(() => { if (vivo) setFila(null); });
    return () => { vivo = false; };
  }, [user]);

  const r = fila?.result;
  const clave = claveTemperamento(r) ?? ([r?.primario, r?.secundario].filter(Boolean).join('-') || null);
  const [primario = null, secundario = null] = clave ? clave.split('-') : [];
  const perfil = clave ? t(`result.profiles.${clave}`) : null;
  const desafio = clave ? t(`result.challenge_defs.${CHALLENGE_VIRTUE[clave]}`) : null;
  return {
    cargando: fila === undefined,
    nombre, sexo, clave, primario, secundario,
    perfil: perfil && typeof perfil === 'object' ? perfil : null,
    desafio: desafio && typeof desafio === 'object' ? desafio : null,
  };
}

/* ─── Pantallas ─── */

// r: respuestas a las preguntas { temperamentos, caracter }: null (sin responder) · true · false.
// responder(clave, bool) guarda la respuesta y avanza.
// h: horarios { prefs, setPrefs } (null mientras se cargan).
function pantallas(d, r, responder, h) {
  const conoce = r.temperamentos;
  const lista = [];

  lista.push({
    id: 'bienvenida', eyebrow: 'Bienvenida',
    cuerpo: (
      <>
        <h2 style={h2}>{saludoBienvenida(d.nombre, d.sexo)}</h2>
        <p style={separados}>Acabas de empezar tu camino: conocerte mejor para crecer en virtud.</p>
        <p style={separados}>Al hacer el test diste el primer paso.</p>
        <p style={separados}>Ahora vas a entender lo que dice de ti y lo que puedes llegar a ser.</p>
      </>
    ),
  });

  if (!d.primario) {
    lista.push({
      id: 'sin-resultado', eyebrow: 'Tu resultado',
      cuerpo: (
        <>
          <h2 style={h2}>Aún no tenemos tu resultado</h2>
          <p style={texto}>No encontramos tu test de temperamento. Podrás hacerlo desde el portal cuando quieras.</p>
        </>
      ),
    });
  } else {
    const p = d.primario;
    const s = d.secundario;
    const otros = ['COL', 'MEL', 'SAN', 'FLE'].filter((k) => k !== p && k !== s);

    lista.push({
      id: 'resultado', eyebrow: 'Eres',
      cuerpo: (
        <>
          <h2 style={{ ...h2, margin: '10px 0 28px' }}>{nombrePerfil(d)}</h2>
          <div className="vl-onb-serie" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            <EtiquetaTemp temp={p} rol="Temperamento principal" />
            {s && <EtiquetaTemp temp={s} rol="Temperamento secundario" />}
          </div>
          {INTRO_PERFIL[d.clave] && <p style={{ ...texto, margin: '34px 0 0' }}>{INTRO_PERFIL[d.clave]}</p>}
        </>
      ),
    });

    if (PUNTOS[d.clave]) {
      lista.push({
        id: 'punto-fuerte', eyebrow: 'Tu punto fuerte',
        cuerpo: (
          <>
            <h2 style={h2}>{PUNTOS[d.clave][0]}</h2>
            {RASGOS[d.clave] && <Chips items={RASGOS[d.clave][0]} marca="+" />}
          </>
        ),
      });
      lista.push({
        id: 'punto-debil', eyebrow: 'Tu punto débil',
        cuerpo: (
          <>
            <h2 style={h2}>{PUNTOS[d.clave][1]}</h2>
            {RASGOS[d.clave] && <Chips items={RASGOS[d.clave][1]} marca="−" />}
          </>
        ),
      });
    }

    lista.push({
      id: 'pregunta', eyebrow: 'Antes de seguir', pregunta: true,
      cuerpo: (
        <>
          <h2 style={{ ...h2, margin: '10px 0 16px' }}>¿Conoces los temperamentos?</h2>
          <p style={{ ...texto, color: MUTED, margin: 0 }}>Todos nacemos con un temperamento. Hay cuatro.</p>
          <BotonesSiNo responder={(v) => responder('temperamentos', v)} />
        </>
      ),
    });

    if (conoce === false) {
      lista.push({
        id: 'temp-principal', eyebrow: 'Tu temperamento principal',
        cuerpo: (
          <>
            <h2 style={{ ...h2, margin: '8px 0 14px' }}>{TEMP_NOMBRE[p]}</h2>
            <FichaPropia temp={p} />
          </>
        ),
      });

      if (s) {
        lista.push({
          id: 'temp-secundario', eyebrow: 'Tu temperamento secundario',
          cuerpo: (
            <>
              <h2 style={{ ...h2, margin: '8px 0 14px' }}>{TEMP_NOMBRE[s]}</h2>
              <FichaPropia temp={s} />
            </>
          ),
        });
      }

      lista.push({
        id: 'otros-temperamentos', eyebrow: 'Los temperamentos',
        cuerpo: (
          <>
            <h2 style={{ ...h2, margin: '10px 0 14px' }}>Los otros temperamentos</h2>
            <p style={intro}>Así reaccionan, de forma natural, otras personas.</p>
            <div className="vl-onb-serie vl-onb-rejilla" style={{ display: 'grid', gap: 18 }}>
              {otros.map((k) => <CajaTemperamento key={k} temp={k} />)}
            </div>
          </>
        ),
      });

      lista.push({
        id: 'que-es-desafio', eyebrow: 'La virtud-desafío',
        cuerpo: (
          <>
            <h2 style={h2}>Cada temperamento tiene su virtud-desafío</h2>
            <p style={intro}>Es la virtud que más te cuesta por tu forma de ser.</p>
            <div className="vl-onb-serie" style={{ display: 'grid', gap: 14, marginBottom: 32 }}>
              {['COL', 'MEL', 'SAN', 'FLE'].map((k) => (
                <p key={k} style={{ ...parrafoCaja, margin: 0 }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: TEMP_COLORS[k], marginRight: 8 }} />
                  <span style={tituloCaja}>{TEMP_NOMBRE[k]}</span>: le cuesta {RETOS.facilita_dificulta?.[k]?.dificulta}
                </p>
              ))}
            </div>
            <p style={texto}>Tu temperamento secundario puede ayudarte o no. Por eso tu virtud-desafío depende de tu combinación.</p>
            {d.desafio?.name && <p style={{ ...enfasis, marginTop: 8 }}>Tu virtud-desafío es la {d.desafio.name.toLowerCase()}.</p>}
          </>
        ),
      });
    }

    if (conoce !== null && d.desafio?.name) {
      lista.push({
        id: 'desafio', eyebrow: 'Tu virtud-desafío',
        cuerpo: (
          <>
            <h2 style={h2}>{d.desafio.name}</h2>
            <p style={texto}>{d.desafio.def}</p>
          </>
        ),
      });
    }
  }

  // Hasta que responda la pregunta no se sabe qué viene después: se corta aquí.
  if (d.primario && conoce === null) return lista;

  lista.push({
    id: 'liderazgo', eyebrow: 'Liderazgo virtuoso',
    cuerpo: (
      <>
        <h2 style={h2}>Liderar es una cuestión de carácter</h2>
        <p style={texto}>No depende de tu temperamento, sino de tus virtudes. Y las virtudes se aprenden.</p>
        <p style={enfasis}>Tu temperamento es tu punto de partida. Tu carácter decide hasta dónde llegas.</p>
      </>
    ),
  });

  lista.push({
    id: 'pregunta-caracter', eyebrow: 'Antes de seguir', pregunta: true,
    cuerpo: (
      <>
        <h2 style={{ ...h2, margin: '10px 0 16px' }}>¿Sabes lo que es el carácter?</h2>
        <p style={{ ...texto, color: MUTED, margin: 0 }}>El carácter es el conjunto de virtudes que vas forjando con tus actos.</p>
        <BotonesSiNo responder={(v) => responder('caracter', v)} />
      </>
    ),
  });

  if (r.caracter === null) return lista;

  if (r.caracter === false) {
    lista.push({
      id: 'caracter', eyebrow: 'El carácter',
      cuerpo: (
        <>
          <h2 style={h2}>Tu carácter lo construyes tú</h2>
          <p style={texto}>No naces con él. Se forma con virtudes.</p>
          <p style={texto}>Las virtudes son hábitos: fortalezas que adquieres y desarrollas con la práctica.</p>
        </>
      ),
    });

    lista.push({
      id: 'virtudes', eyebrow: 'Las virtudes',
      cuerpo: (
        <>
          <h2 style={h2}>Las virtudes del liderazgo</h2>
          <div style={{ ...mini, marginBottom: 14 }}>Fundamentales</div>
          <Chips items={FUNDAMENTALES.map(nombreVirtud)} />
          <div style={{ ...mini, margin: '32px 0 14px' }}>La esencia del liderazgo</div>
          <Chips items={ESENCIA.map(nombreVirtud)} />
          <p style={{ ...enfasis, marginTop: 36 }}>Las construyes con tus actos, día a día.</p>
        </>
      ),
    });
  }

  // La promesa: un método para forjar el carácter, no un catálogo de secciones.
  // PENDIENTE de revisión (textos propios).
  lista.push({
    id: 'promesa', eyebrow: 'Lo que vas a encontrar aquí',
    cuerpo: (
      <>
        <h2 style={h2}>Un camino para forjar tu carácter</h2>
        <div className="vl-onb-serie" style={{ display: 'grid', gap: 16, marginTop: 8 }}>
          {[
            ['Entender', 'Conoce tu temperamento y tus virtudes.'],
            ['Contemplar', 'Mírate con verdad y descubre qué te falta.'],
            ['Practicar', 'Retos diarios en tu vida real.'],
            ['Convertirlo en hábito', 'La virtud crece con la repetición.'],
          ].map(([t, x], i) => (
            <div key={t} style={{ position: 'relative', background: PAPER, padding: '20px 22px 16px' }}>
              <Acento />
              <div style={tituloCaja}><span style={{ color: GOLD_REF_DK }}>{i + 1}.</span> {t}</div>
              <p style={{ ...parrafoCaja, margin: '4px 0 0' }}>{x}</p>
            </div>
          ))}
        </div>
        <p style={{ ...enfasis, marginTop: 34 }}>Tu temperamento no cambia. Tu carácter, sí.</p>
      </>
    ),
  });

  // Tu día a día (configuración de horarios de Jose): una pregunta por pantalla.
  if (h.prefs) {
    PASOS_HORARIOS.forEach((paso, n) => {
      lista.push({
        id: `horario-${paso.campo}`, eyebrow: 'Tu día a día',
        final: n === PASOS_HORARIOS.length - 1,
        cuerpo: (
          <>
            <h2 style={{ ...h2, margin: '10px 0 14px' }}>{paso.pregunta}</h2>
            <p style={intro}>{paso.apoyo}</p>
            <PasoHorario paso={paso} prefs={h.prefs} setPrefs={h.setPrefs} />
          </>
        ),
      });
    });
  }

  return lista;
}

/* ─── Componente ─── */

export default function Bienvenida() {
  const d = useDatos();
  const lp = useLocalPath();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState('der'); // hacia dónde entra la pantalla: 'der' al avanzar, 'izq' al volver
  // Respuestas a «¿Conoces los temperamentos?» y «¿Sabes lo que es el carácter?»: null · true · false.
  const [r, setR] = useState({ temperamentos: null, caracter: null });
  const avanzar = () => { setDir('der'); setIdx((i) => i + 1); };
  const volver = () => { setDir('izq'); setIdx((i) => i - 1); };
  const responder = (clave, v) => { setR((x) => ({ ...x, [clave]: v })); setDir('der'); setIdx((i) => i + 1); };
  // Horarios: los guardados o, si aún no hay, los de por defecto con la zona del dispositivo.
  const session = useSession();
  const estadoPrefs = usePreferencias(session?.user?.id);
  const [prefs, setPrefs] = useState(null);
  useEffect(() => {
    if (prefs || estadoPrefs.cargando) return;
    setPrefs(estadoPrefs.preferencias ?? normalizar(null, zonaDelDispositivo()));
  }, [estadoPrefs, prefs]);
  const [guardado, setGuardado] = useState(null); // null · 'guardando' · 'error'
  const h = { prefs, setPrefs };
  const lista = pantallas(d, r, responder, h);
  // Mientras falte alguna respuesta, el total cuenta con la rama más larga.
  const total = pantallas(d, { temperamentos: r.temperamentos ?? false, caracter: r.caracter ?? false }, responder, h).length;
  const p = lista[Math.min(idx, lista.length - 1)];

  useEffect(() => { window.scrollTo(0, 0); }, [idx]);

  // Al terminar se guardan los horarios y se entra al portal.
  // Pendiente: guardar también en BD que ya ha hecho el onboarding.
  async function terminar() {
    if (prefs && session?.user) {
      setGuardado('guardando');
      try { await guardarPreferencias(session.user.id, prefs); } catch { setGuardado('error'); return; }
    }
    navigate(lp('/app'), { replace: true });
  }

  if (d.cargando) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0 40px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)', boxSizing: 'border-box' }}>
      <style>{`
        /* Cada pantalla entra con la transición del portal (izq/der) y su contenido aparece en cascada. */
        @keyframes vl-onb-sube { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes vl-onb-pop  { 0% { opacity: 0; transform: scale(.92); } 70% { opacity: 1; transform: scale(1.02); } 100% { transform: none; } }
        @keyframes vl-onb-abre { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .vl-onb-paso > * { animation: vl-onb-sube 560ms cubic-bezier(.22,.61,.36,1) backwards; }
        ${Array.from({ length: 10 }, (_, i) => `.vl-onb-paso > :nth-child(${i + 1}) { animation-delay: ${120 + i * 130}ms; }`).join('\n')}
        .vl-onb-serie > * { animation: vl-onb-pop 480ms cubic-bezier(.22,.61,.36,1) backwards; }
        ${Array.from({ length: 8 }, (_, i) => `.vl-onb-serie > :nth-child(${i + 1}) { animation-delay: ${480 + i * 110}ms; }`).join('\n')}
        .vl-onb-rejilla { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 720px) { .vl-onb-rejilla { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .vl-onb-despliega { animation: vl-onb-abre 260ms ease both; }
        .vl-onb-cta .vl-onb-flecha { display: inline-block; transition: transform 220ms cubic-bezier(.22,.61,.36,1); }
        .vl-onb-cta:hover .vl-onb-flecha { transform: translateX(5px); }
        .vl-onb-cta:hover { background: ${GOLD_REF_DK} !important; }
        .vl-onb-anterior:hover { opacity: 1 !important; }
        .vl-onb-opcion { transition: background 180ms ease, color 180ms ease, transform 180ms ease; }
        .vl-onb-opcion:hover { color: ${NAVY} !important; border-color: ${NAVY} !important; }
        @media (prefers-reduced-motion: reduce) { .vl-onb-paso > *, .vl-onb-serie > *, .vl-onb-despliega { animation: none; } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: `${LINE}55`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((idx + 1) / total) * 100}%`, background: GOLD_REF, transition: 'width 600ms cubic-bezier(.22,.61,.36,1)' }} />
        </div>
      </div>

      {/* Contenido centrado (en horizontal y en vertical) entre la barra de progreso y los botones. */}
      <section key={p.id} className={`vl-onb-paso vl-entra-${dir}`} style={{ flex: 1, padding: '40px 0 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
        {p.eyebrow && <div style={eyebrow}>{p.eyebrow}</div>}
        {p.cuerpo}
        {/* El botón de avanzar va centrado y junto al texto, no abajo. En las preguntas se avanza respondiendo. */}
        {!p.pregunta && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <button type="button" className="vl-onb-cta" onClick={p.final ? terminar : avanzar} disabled={guardado === 'guardando'} style={botonSiguiente}>
              {p.final ? (guardado === 'guardando' ? 'Guardando…' : 'Guardar y entrar al portal') : idx === 0 ? 'Empezar camino' : 'Continuar'} <span className="vl-onb-flecha" aria-hidden>→</span>
            </button>
          </div>
        )}
        {p.final && guardado === 'error' && (
          <p role="alert" style={{ ...nota, color: '#9C3A3A', margin: '14px 0 0' }}>No he podido guardar tus horarios. Inténtalo de nuevo.</p>
        )}
        {/* «← Anterior» debajo del botón de avanzar (o de Sí/No): pequeño y sin borde. */}
        {idx > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
            <button type="button" onClick={volver} className="vl-onb-anterior" style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 400, color: MUTED, opacity: 0.45, background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', transition: 'opacity 180ms ease' }}>
              ← Anterior
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
