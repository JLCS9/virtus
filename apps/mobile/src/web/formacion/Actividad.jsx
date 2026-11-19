// Componentes interactivos para las actividades entre vídeos del módulo.
// Quiz, Define, Desliza, Identifica — todos comparten el mismo shell (título + barra progreso).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NAVY, MUTED, GOLD_REF, GOLD_REF_DK, GOLD_REF_LT, LINE, PAPER, FONT_SLAB, FONT_BODY, BEIGE, TEMP_COLORS, SUCCESS_BG, SUCCESS, SUCCESS_DK, ERROR_BG, ERROR, ERROR_DK, WARNING_BG, WARNING, WARNING_DK } from '../theme';
import { barraFondo, eyebrow, tarjeta, tarjetaCentrada } from '../app/estilos';
import { IconoCheck } from '../app/Iconos';
import { supabase } from '../account/supabase';
import diagramaVirtudesImg from './diagrama-virtudes.png';
import diagramaCOL from './diagrama-COL.png';
import diagramaMEL from './diagrama-MEL.png';
import diagramaSAN from './diagrama-SAN.png';
import diagramaFLE from './diagrama-FLE.png';
import diagramaTemperamentosImg from './diagrama-magnanimidad-temperamentos.jpg';
import piramideHumildadImg from './piramide-humildad.png';
import piramideLVCompletaImg from './piramide-lv-completa.png';
import retratoCOL from './assets/retrato-COL.jpg';
import retratoMEL from './assets/retrato-MEL.jpg';
import retratoSAN from './assets/retrato-SAN.jpg';
import retratoFLE from './assets/retrato-FLE.jpg';
import retratoTEMP from './assets/retrato-TEMP.jpg';
import retratoCaracter from './assets/retrato-caracter.jpg';
import retratoPrudencia from './assets/retrato-prudencia.jpg';
import retratoFortaleza from './assets/retrato-fortaleza.jpg';
import retratoDominio from './assets/retrato-dominio.jpg';
import retratoJusticia from './assets/retrato-justicia.jpg';
import retratoMagnanimidad from './assets/retrato-magnanimidad.jpg';
import piramidaImg from '../assets/piramida ES.webp';
import piramideViciosImg from './piramide-virtudes-vicios.png';
import piramideLVImg from './piramide-liderazgo-virtuoso.png';
import diagramaMotivacionImg from '../assets/formacion/c3-diagrama-motivacion.webp';
import diagramaHumildadTempImg from './diagrama-humildad-temperamentos.webp';
import { PREGUNTAS, TEMPS, NO_SE, GRUPOS as GRUPOS_PERSONA } from '../lib/personas';
import CHARACTER_TEST from '../data/character-test.json';
import CHARACTER_SUPPORT from '../data/character-support-text.json';
import { scoreCharacter } from '../lib/characterScoring';
import curso2Data from '../data/curso2.json';
import HEART_TEST from '../data/heart-test.json';
import HEART_SUPPORT from '../data/heart-support-text.json';
import { scoreHeart, HEART_DISORDER_CODES } from '../lib/heartScoring';
import { saveCharacterResultIfLoggedIn, saveHeartResultIfLoggedIn } from '../account/account';
import heartFaceR from '../assets/heart-disorder-R.webp';
import heartFaceVR from '../assets/heart-disorder-VR.webp';
import heartFaceVM from '../assets/heart-disorder-VM.webp';
import heartFaceVI from '../assets/heart-disorder-VI.webp';
import heartFaceVC from '../assets/heart-disorder-VC.webp';
import heartFaceSV from '../assets/heart-disorder-SV.webp';
import heartFaceSI from '../assets/heart-disorder-SI.webp';
import heartFaceSC from '../assets/heart-disorder-SC.webp';
import c5CuerpoAlmaImg from '../assets/formacion/c5-cuerpo-alma-espiritu-v2.webp';
import c5TrianguloImg from '../assets/formacion/c5-triangulo-blanco-v2.webp';
import c5RuedaImg from '../assets/formacion/c5-rueda-temperamentos.webp';
import c5IdeologicoImg from '../assets/formacion/c5-ideologico-estatua.webp';
import faceP from '../assets/Pastorelle.webp';
import faceC from '../assets/Courage.webp';
import faceS from '../assets/Judith.webp';
import faceJ from '../assets/Judith.webp';
import faceM from '../assets/Paul.webp';
import faceH from '../assets/Jean.webp';

const DIAGRAMA_TEMP = { COL: diagramaCOL, MEL: diagramaMEL, SAN: diagramaSAN, FLE: diagramaFLE };

const IconoLupa = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="10.5" cy="10.5" r="7" /><path d="m21 21-5.2-5.2" />
  </svg>
);
const TEMP_SUBTITULO = { COL: 'la acción', MEL: 'las ideas', SAN: 'las personas', FLE: 'la paz' };
const RETRATO_TEMP = { COL: retratoCOL, MEL: retratoMEL, SAN: retratoSAN, FLE: retratoFLE };
const CONCEPTO_A_RETRATO = { 'Temperamento': retratoTEMP, 'Temperamento colérico': retratoCOL, 'Temperamento melancólico': retratoMEL, 'Temperamento sanguíneo': retratoSAN, 'Temperamento flemático': retratoFLE, 'Carácter': retratoCaracter, 'Prudencia': retratoPrudencia, 'Fortaleza': retratoFortaleza, 'Dominio de sí': retratoDominio, 'Justicia': retratoJusticia, 'Magnanimidad': retratoMagnanimidad };

const TEMP_NOMBRE = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };

if (typeof document !== 'undefined' && !document.getElementById('autoguardado-css')) {
  const s = document.createElement('style');
  s.id = 'autoguardado-css';
  s.textContent = '@keyframes fadeInCheck{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}@keyframes vlChipIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.vl-chip-anim{animation:vlChipIn 450ms ease both}';
  document.head.appendChild(s);
}

// Cajas informativas: hasta 2 en columna; 3 o más se muestran en slider para no alargar la página.
function CajaInfo({ c }) {
  if (c.nodo) return c.nodo; // contenido propio (p. ej. ficha de temperamento con retrato)
  return (
    <div style={{ padding: '16px 18px', background: c.fondo, borderLeft: c.borde }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: c.colorEtiqueta, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{c.etiqueta}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: c.color, lineHeight: 1.6 }}>{c.texto}</div>
    </div>
  );
}

function BloqueCajas({ cajas, slider = false }) {
  const lista = cajas.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const refs = useRef([]);
  const [alto, setAlto] = useState(null);
  const actual = Math.min(idx, Math.max(0, lista.length - 1));
  useEffect(() => {
    const el = refs.current[actual];
    if (!el) return;
    const medir = () => setAlto(el.offsetHeight);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [actual, lista.length]);
  if (lista.length === 0) return null;
  if (lista.length < (slider ? 2 : 3)) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>{lista.map((c, i) => <CajaInfo key={i} c={c} />)}</div>;
  }
  const flecha = (dir, disabled, onClick) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={dir < 0 ? 'Anterior' : 'Siguiente'} style={{ background: 'none', border: 'none', padding: 4, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2"><polyline points={dir < 0 ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} /></svg>
    </button>
  );
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {lista.map((c, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)} style={{
              fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 20, padding: '6px 14px',
              border: `1px solid ${i === actual ? NAVY : LINE}`, background: i === actual ? NAVY : 'transparent', color: i === actual ? '#fff' : NAVY,
            }}>{c.etiqueta}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED }}>{actual + 1}/{lista.length}</span>
          {flecha(-1, actual === 0, () => setIdx(actual - 1))}
          {flecha(1, actual === lista.length - 1, () => setIdx(actual + 1))}
        </div>
      </div>
      <div className="vl-slider-ventana" style={{ overflow: 'hidden', height: alto ?? 'auto', transition: 'height 350ms cubic-bezier(.4,0,.2,1)' }}>
        <div className="vl-slider-pista" style={{ display: 'flex', alignItems: 'flex-start', transform: `translateX(-${actual * 100}%)`, transition: 'transform 450ms cubic-bezier(.4,0,.2,1)' }}>
          {lista.map((c, i) => (
            <div key={i} ref={el => { refs.current[i] = el; }} aria-hidden={i !== actual || undefined} style={{ flex: '0 0 100%', minWidth: 0 }}>
              <CajaInfo c={c} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hueco invisible (antes de los botones) = enunciado más largo del ejercicio − enunciado actual.
// Así el texto va pegado a su respuesta y el botón no cambia de sitio entre preguntas.
// Con `nodos` se miden bloques completos (p. ej. título + preguntas guía) en lugar de textos sueltos.
function EspacioIgualado({ textos, actual, style, nodos }) {
  const ref = useRef(null);
  const [alturas, setAlturas] = useState([]);
  const clave = textos.join('\u0001');
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setAlturas([...el.children].map(c => c.offsetHeight));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [clave]);
  const max = alturas.length ? Math.max(...alturas) : 0;
  const extra = Math.max(0, max - (alturas[actual] ?? max));
  return (
    <>
      <div ref={ref} aria-hidden style={{ position: 'absolute', left: 22, right: 22, top: 0, visibility: 'hidden', pointerEvents: 'none' }}>
        {nodos ? nodos.map((n, i) => <div key={i}>{n}</div>) : textos.map((t, i) => <p key={i} style={{ ...style, margin: 0 }}>{t}</p>)}
      </div>
      <div aria-hidden style={{ height: extra, flexShrink: 0 }} />
    </>
  );
}

// Sincroniza las respuestas a medias con la BD (vía onBorrador) y las recupera al volver.
function useBorrador({ valor, borrador, onBorrador, estaVacio, hidratar }) {
  const hidratado = useRef(false);
  const clave = JSON.stringify(valor);
  const ultimaEnviada = useRef(clave);
  useEffect(() => {
    if (hidratado.current || !borrador) return;
    hidratado.current = true;
    if (estaVacio()) hidratar(borrador);
  }, [borrador]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (clave === ultimaEnviada.current) return;
    ultimaEnviada.current = clave;
    onBorrador?.(valor);
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
}

function useAutoguardado(guardarFn, datos, delay = 500) {
  const [guardados, setGuardados] = useState({});
  const timerRef = useRef(null);
  const guardarRef = useRef(guardarFn);
  guardarRef.current = guardarFn;
  const datosRef = useRef(datos);
  datosRef.current = datos;
  const savedStrRef = useRef(JSON.stringify(datos));

  const datosStr = useMemo(() => JSON.stringify(datos), [datos]);

  useEffect(() => {
    if (datosStr === savedStrRef.current) return;
    let prev;
    try { prev = JSON.parse(savedStrRef.current); } catch { prev = null; }
    const cambiados = [];
    if (typeof datos === 'object' && datos !== null && !Array.isArray(datos)) {
      for (const k of Object.keys(datos)) {
        if (JSON.stringify(datos[k]) !== JSON.stringify(prev?.[k])) cambiados.push(k);
      }
    } else if (Array.isArray(datos)) {
      datos.forEach((v, i) => { if (v !== prev?.[i]) cambiados.push(String(i)); });
    }
    if (cambiados.length === 0) return;
    cambiados.forEach(k => setGuardados(g => { const n = { ...g }; delete n[k]; return n; }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      guardarRef.current(datosRef.current);
      savedStrRef.current = JSON.stringify(datosRef.current);
      cambiados.forEach(k => setGuardados(g => ({ ...g, [k]: Date.now() })));
      timerRef.current = null;
    }, delay);
  }, [datosStr, delay]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return guardados;
}

function CheckGuardado({ campo, guardados }) {
  const ts = guardados[campo];
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ts) { setVisible(false); return; }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [ts]);
  if (!visible) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: FONT_BODY, fontSize: 12, color: MUTED, fontWeight: 600,
      animation: 'fadeInCheck 300ms ease forwards',
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Guardado
    </span>
  );
}

// `accion` (opcional): enlace en la misma línea que el título, con su mismo estilo y subrayado.
export function Shell({ titulo, actual, total, children, accion }) {
  const pct = total > 0 ? Math.round(((actual) / total) * 100) : 0;
  return (
    <div>
      {accion ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ ...eyebrow, fontSize: 13 }}>{titulo}</div>
          <button type="button" onClick={accion.onClick} style={{
            ...eyebrow, fontSize: 13, lineHeight: 'normal', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            textDecoration: 'underline', textDecorationThickness: 1, textUnderlineOffset: 2,
          }}>{accion.texto}</button>
        </div>
      ) : (
        <div style={{ ...eyebrow, fontSize: 13 }}>{titulo}</div>
      )}
      <div style={{ ...barraFondo, margin: '12px 0 8px', height: 7 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: GOLD_REF_DK, transition: 'width 400ms ease' }} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, marginBottom: 28 }}>{actual} de {total}</div>
      {children}
    </div>
  );
}

function BotonOpcion({ texto, seleccionada, correcta, revelada, onClick }) {
  let bg = PAPER;
  let border = `1.5px solid ${LINE}`;
  let color = NAVY;
  if (revelada && correcta) { bg = SUCCESS_BG; border = `1.5px solid ${SUCCESS}`; color = SUCCESS_DK; }
  else if (revelada && seleccionada && !correcta) { bg = ERROR_BG; border = `1.5px solid ${ERROR}`; color = ERROR_DK; }
  else if (seleccionada) { bg = 'rgba(165,139,38,0.10)'; border = `1.5px solid ${GOLD_REF}`; }

  return (
    <button type="button" onClick={onClick} disabled={revelada} style={{
      fontFamily: FONT_BODY, fontSize: 20, lineHeight: 1.55, color, background: bg,
      border, borderRadius: 0, padding: '20px 26px', cursor: revelada ? 'default' : 'pointer',
      width: '100%', textAlign: 'left', transition: 'all 150ms ease',
    }}>
      {texto}
    </button>
  );
}

/* ─── QUIZ ─── */

// Orden aleatorio de las respuestas. Para que se note el cambio entre intentos, se recuerda el orden
// anterior de cada pregunta y se busca uno en el que NINGUNA respuesta repita posición (si hay al menos
// 2 respuestas que mover). «Todas las respuestas…» va siempre al final.
function shuffleIndices(n, opciones, clave) {
  const todasIdx = opciones ? opciones.findIndex(o => typeof o === 'string' && o.startsWith('Todas las respuestas')) : -1;
  const base = Array.from({ length: n }, (_, i) => i).filter(i => i !== todasIdx);
  let previo = null;
  try { previo = clave ? JSON.parse(localStorage.getItem(`vl-orden:${clave}`)) : null; } catch {}
  // Primera vez: se evita el orden original del cuestionario.
  const referencia = Array.isArray(previo) && previo.length === n ? previo : Array.from({ length: n }, (_, i) => i);
  const barajar = () => {
    const a = [...base];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    if (todasIdx >= 0) a.push(todasIdx);
    return a;
  };
  let mejor = barajar();
  if (base.length >= 2) {
    const repetidas = (a) => a.filter((v, k) => v !== todasIdx && referencia[k] === v).length;
    for (let intento = 0; intento < 60 && repetidas(mejor) > 0; intento++) {
      const cand = barajar();
      if (repetidas(cand) < repetidas(mejor)) mejor = cand;
    }
  }
  try { if (clave) localStorage.setItem(`vl-orden:${clave}`, JSON.stringify(mejor)); } catch {}
  return mejor;
}

const CARATULA_TEXTOS = {
  quiz: { icono: '?', tipo: 'Cuestionario', desc: 'Responde a unas preguntas para poner a prueba lo que has aprendido en este módulo y afianzar los conceptos clave.' },
  define: { icono: '✦', tipo: 'Definiciones y conceptos', desc: 'Selecciona todas las palabras que definen cada concepto. Para conseguir la máxima puntuación, debes escoger todas las palabras correctas.' },
  desliza: { icono: '↔', tipo: 'Identifica temperamentos', desc: 'Lee cada escena y asocia el temperamento que mejor encaja.' },
  identifica: { icono: '◉', tipo: 'Diagrama de virtudes', desc: 'Reflexiona sobre las virtudes y cómo se manifiestan en tu vida.' },
  test_profundo: { icono: '◇', tipo: 'Autoexamen profundo', desc: 'Reflexiona con sinceridad sobre estas preguntas. No hay respuestas correctas ni incorrectas: este ejercicio es para tu crecimiento personal.' },
  retos_temperamento: { icono: '✶', tipo: 'Los retos de mi temperamento', desc: 'Descubre qué aspectos de las virtudes te facilita y te dificulta tu temperamento, y cuál es tu virtud-desafío: la virtud que más necesitas trabajar a lo largo de tu vida.' },
  test_caracter: { icono: '◈', tipo: 'Test de carácter', desc: 'Evalúa tu nivel actual en las seis virtudes del liderazgo: prudencia, valor, autocontrol, justicia, magnanimidad y humildad.' },
  test_corazon: { icono: '♡', tipo: 'Test del corazón', desc: 'Evalúa la libertad de tu corazón. 32 preguntas sobre las ocho enfermedades espirituales que pueden afectar a la razón, la voluntad y el corazón.' },
  reflexion_piramide: { icono: '△', tipo: 'Reflexión', desc: 'Observa el diagrama y reflexiona sobre las relaciones entre las virtudes.' },
  temperamento_magnanimidad: { icono: '✶', tipo: 'Tu temperamento', desc: 'Descubre cómo tu temperamento puede ayudarte a practicar esta virtud.' },
  armonia_temperamento: { icono: '✶', tipo: 'Armonía espiritual y temperamento', desc: 'Descubre hacia qué facultad te inclina tu temperamento y cuál prevalece en tu vida.' },
  circulo_personas: { icono: '?', tipo: '¿Conoces a alguien así?', desc: 'Mientras escuchabas la formación o hacías el examen de autoconciencia, ¿te venía alguien a la cabeza?\n\nEste ejercicio te invita a observar el temperamento de las personas que te rodean. Podrás anotar tus impresiones y crear un pequeño perfil para cada una.' },
  objetivos_corazon: { icono: '♡', tipo: 'Tu perfil del corazón', desc: 'Proyecto final del curso. A partir de tu Test del corazón, fija tus objetivos prácticos para las dos enfermedades espirituales en las que más puntúas.' },
  proyecto_mision: { icono: '✦', tipo: 'Plan para descubrir tu misión', desc: 'Este es el ejercicio más importante del curso. Reserva una o dos horas tranquilas: vas a escribir tu historia, reconocer tus talentos y formular tu misión. Todo se guarda: puedes parar y volver cuando quieras. Este trabajo puede durar años. Empieza hoy.' },
};

function Caratula({ paso, tipo, onEmpezar, modulo }) {
  const txt = CARATULA_TEXTOS[tipo] ?? { icono: '●', tipo: 'Ejercicio', desc: '' };
  const desc = paso.caratula_desc || txt.desc;
  return (
    <div>
      <div style={tarjetaCentrada}>
        <div style={{ textAlign: 'center', padding: '0 0 10px' }}>
          <span style={{
            display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
            background: BEIGE, border: `2px solid ${GOLD_REF}`,
            fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: GOLD_REF_DK,
          }}>{txt.icono}</span>
        </div>
        {modulo != null && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ ...eyebrow, display: 'inline-block' }}>Módulo {modulo}</div>
          </div>
        )}
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: '12px 0 14px', textAlign: 'center', lineHeight: 1.3, textWrap: 'balance' }}>
          {paso.caratula_titulo || txt.tipo}
        </h2>
        <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.7, textAlign: 'center', maxWidth: 560, margin: '0 auto 8px', textWrap: 'pretty' }}>
          {desc.split('\n\n').map((p, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '12px 0 0' }}>{p}</p>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28, marginBottom: 0 }}>
          <button type="button" onClick={onEmpezar} style={{
            fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
          }}>
            Empezar →
          </button>
        </div>
      </div>
    </div>
  );
}

function Conclusion({ titulo, aciertos, total, onReintentar, onContinuar, nota, requiereAprobado }) {
  const pct = total > 0 ? Math.round((aciertos / total) * 100) : 0;
  const perfecto = pct === 100;
  const bueno = pct >= 70;
  const aprobado = pct >= 70;
  const bloqueado = requiereAprobado && !aprobado;

  return (
    <div>
      <div style={tarjetaCentrada}>
        <div style={{ textAlign: 'center', padding: '0 0 8px' }}>
          <span style={{
            display: 'inline-grid', placeItems: 'center', width: 72, height: 72, borderRadius: '50%',
            background: perfecto ? SUCCESS_BG : bueno ? WARNING_BG : ERROR_BG,
            border: `2px solid ${perfecto ? SUCCESS : bueno ? WARNING : ERROR}`,
            fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700,
            color: perfecto ? SUCCESS_DK : bueno ? WARNING_DK : ERROR_DK,
          }}>
            {pct}%
          </span>
        </div>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '14px 0 8px', textAlign: 'center', lineHeight: 1.3 }}>
          {perfecto ? 'Perfecto' : bueno ? 'Buen trabajo' : 'Sigue practicando'}
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.6, textAlign: 'center', margin: '0 auto 6px', maxWidth: 480 }}>
          Has acertado <strong style={{ color: NAVY }}>{aciertos} de {total}</strong> en {titulo}.
        </p>
        {bloqueado && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: ERROR_DK, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.5 }}>
            Necesitas al menos un 70% de aciertos para continuar. Inténtalo de nuevo.
          </p>
        )}
        {!perfecto && !bloqueado && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: MUTED, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.5 }}>
            Puedes volver a intentarlo para mejorar tu puntuación.
          </p>
        )}
        {nota && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textAlign: 'center', margin: '8px 0 0', fontStyle: 'italic' }}>
            {nota}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 28, marginBottom: 8, flexWrap: 'wrap' }}>
          {!perfecto && (
            <button type="button" onClick={onReintentar} style={{
              fontFamily: FONT_BODY, fontSize: 17, fontWeight: 600, color: bloqueado ? '#fff' : NAVY,
              background: bloqueado ? GOLD_REF : BEIGE, border: bloqueado ? 'none' : `1.5px solid ${LINE}`, borderRadius: 0,
              padding: bloqueado ? '18px 40px' : '16px 32px', cursor: 'pointer',
            }}>
              Reintentar
            </button>
          )}
          {!bloqueado && (
            <button type="button" onClick={onContinuar} style={{
              fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
            }}>
              Continuar →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Quiz({ paso, onComplete, modulo }) {
  const { preguntas } = paso;
  const [fase, setFase] = useState('caratula');
  const [idx, setIdx] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [revelada, setRevelada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [verRueda, setVerRueda] = useState(false);
  const ordenRef = useRef({});
  const respuestasRef = useRef([]);

  if (fase === 'caratula') return <Caratula paso={paso} tipo="quiz" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  if (fase === 'conclusion') return <Conclusion
    titulo="cuestionario" aciertos={aciertos} total={preguntas.length} requiereAprobado
    onReintentar={() => { setFase('ejercicio'); setIdx(0); setSeleccion(null); setRevelada(false); setAciertos(0); ordenRef.current = {}; respuestasRef.current = []; }}
    onContinuar={() => onComplete({ aciertos, total: preguntas.length })}
  />;

  const preg = preguntas[idx];
  if (!ordenRef.current[idx]) ordenRef.current[idx] = shuffleIndices(preg.opciones.length, preg.opciones, `${paso.id}:${idx}`);
  const orden = ordenRef.current[idx];

  function elegir(originalIdx) {
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
      <div className="vl-pag-pregunta vl-pag-pregunta--quiz" style={tarjeta}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: '0 0 16px', lineHeight: 1.5 }}>
          Responde las siguientes preguntas del cuestionario.
        </p>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 ' + (preg.contexto ? '10px' : '24px'), lineHeight: 1.4 }}>
          {preg.texto}
        </p>
        {preg.contexto && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.55, margin: '0 0 24px', fontStyle: 'italic' }}>
            {preg.contexto}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orden.map((origIdx) => (
            <BotonOpcion key={origIdx} texto={preg.opciones[origIdx]} seleccionada={seleccion === origIdx}
              correcta={origIdx === preg.correcta} revelada={revelada} onClick={() => elegir(origIdx)} />
          ))}
        </div>
        {paso.diagrama_temperamentos && (
          <div style={{ marginTop: 20 }}>
            <button type="button" onClick={() => setVerRueda(v => !v)} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
              display: 'flex', alignItems: 'center', gap: 5,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              <IconoLupa />
              {verRueda ? 'Ocultar rueda de temperamentos' : 'Ver rueda de los temperamentos'}
            </button>
            {verRueda && (
              <div style={{ marginTop: 14, textAlign: 'center' }}>
                <img src={diagramaTemperamentosImg} alt="Diagrama de los 4 temperamentos" style={{ width: '100%', maxWidth: 360, height: 'auto' }} />
              </div>
            )}
          </div>
        )}
        {revelada && (
          <div className="vl-pag-nav" style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {idx > 0 ? (
              <button type="button" onClick={retroceder} style={{
                fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
                background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
              }}>
                ← Anterior
              </button>
            ) : <span />}
            <button type="button" onClick={avanzar} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              {idx + 1 < preguntas.length ? 'Siguiente →' : 'Completar →'}
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ─── DEFINE (word pools) ─── */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function Define({ paso, onComplete, modulo }) {
  const { conceptos } = paso;
  const totalPalabras = conceptos.reduce((sum, c) => sum + c.correctas.length, 0);
  const [fase, setFase] = useState('caratula');
  const [idx, setIdx] = useState(0);
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [revelado, setRevelado] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const poolRef = useRef(null);
  const historialRef = useRef([]);
  const [viendo, setViendo] = useState(null);

  if (fase === 'caratula') return <Caratula paso={paso} tipo="define" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  if (fase === 'conclusion') return <Conclusion
    titulo="definiciones" aciertos={aciertos} total={totalPalabras} requiereAprobado
    nota="Para conseguir la máxima puntuación en cada concepto, debes seleccionar todas las palabras correctas."
    onReintentar={() => { setFase('ejercicio'); setIdx(0); setSeleccionadas(new Set()); setRevelado(false); setAciertos(0); poolRef.current = null; historialRef.current = []; setViendo(null); }}
    onContinuar={() => onComplete({ aciertos, total: totalPalabras })}
  />;

  if (viendo !== null) {
    const h = historialRef.current[viendo];
    const cpt = conceptos[viendo];
    const correctasH = new Set(cpt.correctas);
    const bien = [...h.seleccionadas].filter((p) => correctasH.has(p)).length;
    const mal = [...h.seleccionadas].filter((p) => !correctasH.has(p)).length;
    const perfecto = bien === cpt.correctas.length && mal === 0;
    const faltantesH = cpt.correctas.filter(p => !h.seleccionadas.has(p));
    return (
      <Shell titulo="Definiciones y conceptos" actual={viendo + 1} total={conceptos.length}>
        <div style={tarjeta}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: MUTED, margin: '0 0 4px' }}>
            Selecciona todas las palabras que definen el siguiente concepto:
          </p>
          <p style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 22px' }}>
            {cpt.concepto}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {h.pool.map((p) => {
              const sel = h.seleccionadas.has(p);
              const esCorrecta = correctasH.has(p);
              let bg = BEIGE; let border = `1.5px solid ${LINE}`; let color = NAVY;
              if (esCorrecta && sel) { bg = SUCCESS_BG; border = `1.5px solid ${SUCCESS}`; color = SUCCESS_DK; }
              else if (esCorrecta && !sel) { bg = WARNING_BG; border = `1.5px dashed ${WARNING}`; color = WARNING_DK; }
              else if (sel && !esCorrecta) { bg = ERROR_BG; border = `1.5px solid ${ERROR}`; color = ERROR_DK; }
              return (
                <button key={p} type="button" disabled style={{
                  fontFamily: FONT_BODY, fontSize: 20, fontWeight: 500, color, background: bg,
                  border, borderRadius: 0, padding: '14px 22px', cursor: 'default', transition: 'all 150ms ease',
                }}>{p}</button>
              );
            })}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, margin: '18px 0 8px', color: perfecto ? SUCCESS_DK : WARNING_DK }}>
            {perfecto ? 'Correcto.' : faltantesH.length > 0
              ? <>Te ha faltado: <strong>{faltantesH.join(', ')}</strong>.</>
              : 'Has marcado alguna palabra de más.'}
          </p>
          {cpt.definicion && (
            <div style={{ padding: '16px 20px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}`, lineHeight: 1.6 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Definición</div>
              <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: NAVY, margin: 0 }}><strong>{cpt.concepto}:</strong> {cpt.definicion}</p>
            </div>
          )}
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {viendo > 0 ? (
              <button type="button" onClick={() => setViendo(viendo - 1)} style={{
                background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
                fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
              }}>← Anterior</button>
            ) : <span />}
            <button type="button" onClick={() => setViendo(null)} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              Volver a la pregunta actual
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const concepto = conceptos[idx];
  if (!poolRef.current || poolRef.current._idx !== idx) {
    poolRef.current = shuffle([...concepto.correctas, ...concepto.distractores]);
    poolRef.current._idx = idx;
  }
  const pool = poolRef.current;
  const correctasSet = new Set(concepto.correctas);

  function toggle(palabra) {
    if (revelado) return;
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      next.has(palabra) ? next.delete(palabra) : next.add(palabra);
      return next;
    });
  }

  function comprobar() {
    setRevelado(true);
    const bien = [...seleccionadas].filter((p) => correctasSet.has(p)).length;
    const mal = [...seleccionadas].filter((p) => !correctasSet.has(p)).length;
    setAciertos((a) => a + Math.max(0, bien - mal));
    historialRef.current[idx] = { seleccionadas: new Set(seleccionadas), pool: [...pool] };
  }

  function avanzar() {
    if (idx + 1 < conceptos.length) {
      setIdx((i) => i + 1);
      setSeleccionadas(new Set());
      setRevelado(false);
      poolRef.current = null;
    } else {
      setFase('conclusion');
    }
  }

  const feedbackActual = revelado ? (() => {
    const bien = [...seleccionadas].filter((p) => correctasSet.has(p)).length;
    const mal = [...seleccionadas].filter((p) => !correctasSet.has(p)).length;
    const perfecto = bien === concepto.correctas.length && mal === 0;
    const faltantes = concepto.correctas.filter(p => !seleccionadas.has(p));
    const erroneas = [...seleccionadas].filter(p => !correctasSet.has(p));
    return { perfecto, faltantes, erroneas };
  })() : null;

  return (
    <Shell titulo="Definiciones y conceptos" actual={idx + 1} total={conceptos.length}>
      <div style={tarjeta}>
        {(() => {
          const ret = CONCEPTO_A_RETRATO[concepto.concepto];
          return (
            <div style={{ display: 'flex', gap: 22, alignItems: 'center', marginBottom: 22 }}>
              {ret && <img src={ret} alt={concepto.concepto} style={{ width: 150, height: 150, objectFit: 'cover', mixBlendMode: 'multiply', flexShrink: 0, borderRadius: 6 }} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: MUTED, margin: '0 0 4px' }}>
                  Selecciona todas las palabras que definen el siguiente concepto:
                </p>
                <p style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: 0 }}>
                  {concepto.concepto}
                </p>
              </div>
            </div>
          );
        })()}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {pool.map((p) => {
            const sel = seleccionadas.has(p);
            const esCorrecta = correctasSet.has(p);
            let bg = sel ? 'rgba(165,139,38,0.15)' : BEIGE;
            let border = sel ? `1.5px solid ${GOLD_REF}` : `1.5px solid ${LINE}`;
            let color = NAVY;
            if (revelado && esCorrecta && sel) { bg = SUCCESS_BG; border = `1.5px solid ${SUCCESS}`; color = SUCCESS_DK; }
            else if (revelado && esCorrecta && !sel) { bg = WARNING_BG; border = `1.5px dashed ${WARNING}`; color = WARNING_DK; }
            else if (revelado && sel && !esCorrecta) { bg = ERROR_BG; border = `1.5px solid ${ERROR}`; color = ERROR_DK; }
            return (
              <button key={p} type="button" onClick={() => toggle(p)} disabled={revelado} style={{
                fontFamily: FONT_BODY, fontSize: 20, fontWeight: 500, color, background: bg,
                border, borderRadius: 0, padding: '14px 22px', cursor: revelado ? 'default' : 'pointer',
                transition: 'all 150ms ease',
              }}>
                {p}
              </button>
            );
          })}
        </div>
        {feedbackActual && (
          <div style={{ margin: '18px 0 8px' }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: feedbackActual.perfecto ? SUCCESS_DK : WARNING_DK }}>
              {feedbackActual.perfecto ? 'Correcto.' : feedbackActual.faltantes.length > 0
                ? <>Te ha faltado: <strong>{feedbackActual.faltantes.join(', ')}</strong>.</>
                : null}
            </p>
            {feedbackActual.erroneas.length > 0 && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, margin: 0, color: ERROR_DK }}>
                Te has equivocado en: {feedbackActual.erroneas.map((e, i) => (
                  <span key={e}>{i > 0 && ', '}<strong>{e}</strong></span>
                ))}
                {' — '}no {feedbackActual.erroneas.length === 1 ? 'es una definición' : 'son definiciones'} de {concepto.concepto}.
              </p>
            )}
          </div>
        )}
        {revelado && concepto.definicion && (
          <div style={{ padding: '16px 20px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}`, lineHeight: 1.6, marginTop: 14 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Definición</div>
            <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: NAVY, margin: 0 }}><strong>{concepto.concepto}:</strong> {concepto.definicion}</p>
          </div>
        )}
        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          {!revelado && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: 0, fontStyle: 'italic', flex: 1 }}>
              Para conseguir la máxima puntuación, debes escoger todas las palabras correctas.
            </p>
          )}
          {revelado && idx > 0 ? (
            <button type="button" onClick={() => setViendo(idx - 1)} style={{
              background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
            }}>← Anterior</button>
          ) : revelado ? <span /> : null}
          {!revelado && (
            <button type="button" onClick={comprobar} disabled={seleccionadas.size === 0} style={{
              fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
              background: seleccionadas.size > 0 ? GOLD_REF : LINE, border: 'none', borderRadius: 0,
              padding: '17px 38px', cursor: seleccionadas.size > 0 ? 'pointer' : 'default',
              flexShrink: 0,
            }}>
              Comprobar
            </button>
          )}
          {revelado && (
            <button type="button" onClick={avanzar} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              {idx + 1 < conceptos.length ? 'Siguiente →' : 'Completar →'}
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ─── DESLIZA (swipe) ─── */

export function Desliza({ paso, onComplete, modulo }) {
  const { escenas } = paso;
  const [fase, setFase] = useState('caratula');
  const [idx, setIdx] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [revelada, setRevelada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [ordenEscenas] = useState(() => escenas.map(e => shuffle([...e.opciones])));

  if (fase === 'caratula') return <Caratula paso={paso} tipo="desliza" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  if (fase === 'conclusion') return <Conclusion
    titulo={paso.titulo} aciertos={aciertos} total={escenas.length}
    onReintentar={() => { setFase('ejercicio'); setIdx(0); setSeleccion(null); setRevelada(false); setAciertos(0); }}
    onContinuar={() => onComplete({ aciertos, total: escenas.length })}
  />;

  const escena = escenas[idx];

  function elegir(temp) {
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
      <div className="vl-pag" style={{ ...tarjeta, position: 'relative', minHeight: 'clamp(340px, calc(100vh - 470px), 430px)' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 22, color: NAVY, lineHeight: 1.6, margin: '0 0 24px', fontStyle: 'italic' }}>
          «{escena.texto}»
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: MUTED, margin: '0 0 16px' }}>
          ¿Qué temperamento describe esta escena?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {ordenEscenas[idx].map((t) => {
            const sel = seleccion === t;
            const esCorrecto = t === escena.respuesta;
            let bg = BEIGE;
            let borderColor = LINE;
            let color = NAVY;
            if (revelada && esCorrecto) { bg = SUCCESS_BG; borderColor = SUCCESS; color = SUCCESS_DK; }
            else if (revelada && sel && !esCorrecto) { bg = ERROR_BG; borderColor = ERROR; color = ERROR_DK; }
            else if (sel) { bg = 'rgba(165,139,38,0.10)'; borderColor = GOLD_REF; }
            return (
              <button key={t} type="button" onClick={() => elegir(t)} disabled={revelada} style={{
                fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color, background: bg,
                borderTop: `1.5px solid ${borderColor}`, borderRight: `1.5px solid ${borderColor}`,
                borderBottom: `1.5px solid ${borderColor}`, borderLeft: `4px solid ${TEMP_COLORS[t] ?? LINE}`,
                borderRadius: 0, padding: '24px 20px', cursor: revelada ? 'default' : 'pointer',
                textAlign: 'center', transition: 'all 150ms ease',
              }}>
                {TEMP_NOMBRE[t]}
              </button>
            );
          })}
        </div>
        {/* Escena más larga reservada: el botón no se mueve entre escenas; siempre visible, activo tras responder. */}
        <EspacioIgualado textos={escenas.map(e => `«${e.texto}»`)} actual={idx} style={{ fontFamily: FONT_BODY, fontSize: 22, lineHeight: 1.6, fontStyle: 'italic' }} />
        <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={avanzar} disabled={!revelada} style={{
            ...ESTILO_BTN_SIG, background: revelada ? GOLD_REF : LINE, cursor: revelada ? 'pointer' : 'default',
          }}>
            {idx + 1 < escenas.length ? 'Siguiente →' : 'Completar →'}
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ─── IDENTIFICA (diagrama + reflexión virtudes) ─── */

export function Lightbox({ src, alt, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'grid', placeItems: 'center',
      background: zoomed ? 'rgba(15,29,56,0.92)' : 'rgba(15,29,56,0.55)',
      transition: 'background 300ms ease',
    }} onClick={e => { if (e.target === e.currentTarget) { zoomed ? setZoomed(false) : onClose(); } }}>
      <div style={{
        position: 'relative',
        maxWidth: zoomed ? '98vw' : 'min(1400px, 95vw)',
        maxHeight: zoomed ? '98vh' : '95vh',
        overflow: zoomed ? 'auto' : 'visible',
        transition: 'max-width 300ms ease, max-height 300ms ease',
      }}>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{
          position: zoomed ? 'fixed' : 'absolute', top: zoomed ? 12 : -44, right: zoomed ? 16 : 0,
          background: zoomed ? NAVY : 'none', border: 'none', borderRadius: 0,
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: PAPER,
          cursor: 'pointer', padding: '8px 16px', lineHeight: 1, letterSpacing: '0.06em',
          textTransform: 'uppercase', zIndex: 10000,
        }}>Cerrar</button>
        <img src={src} alt={alt} onClick={() => setZoomed(!zoomed)} style={{
          width: zoomed ? 'max(1600px, 95vw)' : '100%',
          maxWidth: zoomed ? 'none' : '100%',
          maxHeight: zoomed ? 'none' : '95vh',
          display: 'block', cursor: zoomed ? 'zoom-out' : 'zoom-in',
          boxShadow: zoomed ? 'none' : '0 12px 40px rgba(15,29,56,0.30)',
          transition: 'width 300ms ease',
          background: '#fff',
        }} />
      </div>
    </div>,
    document.body,
  );
}

export function Identifica({ paso, onComplete, modulo, guardado, borrador, onBorrador }) {
  const { virtudes, enunciado, enunciadoCorto } = paso;
  const total = virtudes.length + 1;
  const [fase, setFase] = useState('caratula');
  const [slide, setSlide] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  // Recupera lo ya contestado (guardado completo) para poder repasarlo y editarlo.
  const [respuestas, setRespuestas] = useState(() =>
    virtudes.map((v, i) => {
      const g = guardado?.respuestas?.[i];
      if (!g) return { facil: null, ejemploFacil: '', ejemploDificil: '' };
      return { facil: g.facil === v.pasivo ? 'pasivo' : g.facil === v.activo ? 'activo' : null, ejemploFacil: g.ejemploFacil ?? '', ejemploDificil: g.ejemploDificil ?? '' };
    })
  );
  const [ejemploAbierto, setEjemploAbierto] = useState({});
  useBorrador({
    valor: { respuestas },
    borrador, onBorrador,
    estaVacio: () => !respuestas.some(r => r.facil || r.ejemploFacil.trim() || r.ejemploDificil.trim()),
    hidratar: (b) => { if (Array.isArray(b.respuestas) && b.respuestas.length === virtudes.length && b.respuestas[0] && 'ejemploFacil' in b.respuestas[0]) setRespuestas(b.respuestas); },
  });

  if (fase === 'caratula') return <Caratula paso={paso} tipo="identifica" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  function elegirFacil(vIdx, aspecto) {
    setRespuestas((prev) => {
      const n = [...prev];
      n[vIdx] = { ...n[vIdx], facil: aspecto };
      return n;
    });
  }

  function escribir(vIdx, campo, valor) {
    setRespuestas((prev) => {
      const n = [...prev];
      n[vIdx] = { ...n[vIdx], [campo]: valor };
      return n;
    });
  }

  function retroceder() {
    setSlide((s) => Math.max(0, s - 1));
    setEjemploAbierto({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function avanzar() {
    if (slide < total - 1) {
      setSlide((s) => s + 1);
      setEjemploAbierto({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete({ respuestas: respuestas.map((r, i) => ({
        virtud: virtudes[i].nombre,
        facil: r.facil === 'pasivo' ? virtudes[i].pasivo : virtudes[i].activo,
        dificil: r.facil === 'pasivo' ? virtudes[i].activo : virtudes[i].pasivo,
        ejemploFacil: r.ejemploFacil,
        ejemploDificil: r.ejemploDificil,
      })) });
    }
  }

  if (slide === 0) {
    return (
      <Shell titulo={paso.titulo} actual={1} total={total}>
        <div className="vl-pag" style={tarjeta}>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 14px', lineHeight: 1.3 }}>
            Analiza la foto y entiende el diagrama de virtudes
          </h2>
          <div style={{ marginBottom: 18, textAlign: 'center' }}>
            <div style={{ cursor: 'zoom-in' }} onClick={() => setLightbox(true)}>
              <img src={diagramaVirtudesImg} alt="Diagrama de las 6 virtudes del líder" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <button type="button" onClick={() => setLightbox(true)} style={{ ...ESTILO_LINK_DIAGRAMA, marginTop: 10 }}>
              <IconoLupa /> Ver diagrama
            </button>
          </div>
          {lightbox && <Lightbox src={diagramaVirtudesImg} alt="Diagrama de las 6 virtudes del líder" onClose={() => setLightbox(false)} />}
          <div style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.7 }}>
            {enunciado.split('\n\n').map((p, i) => (
              <p key={i} style={{ margin: i === 0 ? '0 0 14px' : '14px 0 0' }}>{p}</p>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={avanzar} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              Siguiente →
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const vIdx = slide - 1;
  const v = virtudes[vIdx];
  const r = respuestas[vIdx];
  const dificil = r.facil ? (r.facil === 'pasivo' ? 'activo' : 'pasivo') : null;
  const listo = r.facil && r.ejemploFacil.trim() && r.ejemploDificil.trim();

  function aspBtn(aspecto, label) {
    const esFacil = r.facil === aspecto;
    const esDificil = dificil === aspecto;
    let bg = PAPER;
    let border = `1.5px solid ${LINE}`;
    let badge = null;
    if (esFacil) { bg = SUCCESS_BG; border = `1.5px solid ${SUCCESS}`; badge = '+'; }
    else if (esDificil) { bg = WARNING_BG; border = `1.5px solid ${WARNING}`; badge = '−'; }
    return (
      <button type="button" onClick={() => elegirFacil(vIdx, aspecto)} style={{
        fontFamily: FONT_BODY, fontSize: 19, lineHeight: 1.5, color: NAVY, background: bg,
        border, borderRadius: 0, padding: '18px 22px', cursor: 'pointer',
        width: '100%', textAlign: 'left', transition: 'all 150ms ease', position: 'relative',
      }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
          {aspecto === 'pasivo' ? 'Aspecto pasivo' : 'Aspecto activo'}
        </span>
        {label}
        {badge && (
          <span style={{
            position: 'absolute', top: 8, right: 12,
            fontFamily: FONT_SLAB, fontSize: 18, fontWeight: 700,
            color: esFacil ? SUCCESS : WARNING,
          }}>{badge}</span>
        )}
      </button>
    );
  }

  return (
    <Shell titulo={paso.titulo} actual={slide + 1} total={total}>
      <div className="vl-pag" style={{ ...tarjeta, minHeight: 'clamp(340px, calc(100vh - 260px), 640px)' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 19, color: NAVY, margin: '0 0 10px', lineHeight: 1.6 }}>
          {enunciadoCorto}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <h3 style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: GOLD_REF_DK, margin: 0 }}>
            {v.nombre}
          </h3>
          <button type="button" onClick={() => setLightbox(true)} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
            display: 'flex', alignItems: 'center', gap: 5,
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            <IconoLupa />
            Ver diagrama
          </button>
        </div>
        {lightbox && <Lightbox src={diagramaVirtudesImg} alt="Diagrama de las 6 virtudes del líder" onClose={() => setLightbox(false)} />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          <div>
            {aspBtn('pasivo', v.pasivo)}
            {v.ejemploPasivo && (
              <button type="button" onClick={() => setEjemploAbierto(prev => ({ ...prev, pasivo: !prev.pasivo }))} style={{
                background: 'none', border: 'none', padding: '8px 0 0', cursor: 'pointer',
                fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
                display: 'flex', alignItems: 'center', gap: 5,
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                <IconoLupa />
                Ver ejemplo
              </button>
            )}
            {ejemploAbierto.pasivo && v.ejemploPasivo && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.6, margin: '6px 0 0', padding: '10px 14px', background: BEIGE, borderLeft: `2px solid ${GOLD_REF}` }}>
                {v.ejemploPasivo}
              </p>
            )}
          </div>
          <div>
            {aspBtn('activo', v.activo)}
            {v.ejemploActivo && (
              <button type="button" onClick={() => setEjemploAbierto(prev => ({ ...prev, activo: !prev.activo }))} style={{
                background: 'none', border: 'none', padding: '8px 0 0', cursor: 'pointer',
                fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
                display: 'flex', alignItems: 'center', gap: 5,
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                <IconoLupa />
                Ver ejemplo
              </button>
            )}
            {ejemploAbierto.activo && v.ejemploActivo && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.6, margin: '6px 0 0', padding: '10px 14px', background: BEIGE, borderLeft: `2px solid ${GOLD_REF}` }}>
                {v.ejemploActivo}
              </p>
            )}
          </div>
        </div>
        {/* Las dos respuestas están siempre visibles (no cambia la altura al elegir); se activan al marcar el aspecto fácil. */}
        {(
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: r.facil ? 1 : 0.55, transition: 'opacity 200ms ease' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ ...ESTILO_ENUNCIADO, fontSize: 19, margin: 0, color: SUCCESS_DK }}>
                Me resulta fácil (+){r.facil ? `: ${r.facil === 'pasivo' ? v.pasivo : v.activo}` : ''}
              </span>
              <textarea value={r.ejemploFacil} onChange={(e) => escribir(vIdx, 'ejemploFacil', e.target.value)} disabled={!r.facil}
                placeholder={r.facil ? 'Escribe un ejemplo de tu vida…' : 'Primero elige el aspecto que te resulta más fácil'} style={{ ...ESTILO_RESPUESTA, minHeight: 90 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ ...ESTILO_ENUNCIADO, fontSize: 19, margin: 0, color: WARNING_DK }}>
                Me resulta difícil (−){dificil ? `: ${dificil === 'pasivo' ? v.pasivo : v.activo}` : ''}
              </span>
              <textarea value={r.ejemploDificil} onChange={(e) => escribir(vIdx, 'ejemploDificil', e.target.value)} disabled={!r.facil}
                placeholder={r.facil ? 'Escribe un ejemplo de tu vida…' : 'Primero elige el aspecto que te resulta más fácil'} style={{ ...ESTILO_RESPUESTA, minHeight: 90 }} />
            </label>
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={retroceder} style={ESTILO_BTN_ANT}>← Anterior</button>
          <button type="button" onClick={avanzar} disabled={!listo} style={{
            fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
            background: listo ? GOLD_REF : LINE, border: 'none', borderRadius: 0,
            padding: '14px 36px', cursor: listo ? 'pointer' : 'default',
          }}>
            {slide < total - 1 ? 'Siguiente →' : 'Completar →'}
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ─── TEST PROFUNDO (preguntas abiertas) ─── */

const TEST_PROF_KEY = (pasoId) => `vl-test-profundo:${pasoId}`;
function leerTestProf(pasoId, total) {
  try { const d = JSON.parse(localStorage.getItem(TEST_PROF_KEY(pasoId))); return Array.isArray(d) && d.length === total ? d : Array(total).fill(''); } catch { return Array(total).fill(''); }
}

function SelectorCirculoOro({ user, seleccionados, onToggle, onExplicar, preguntaRazon }) {
  const [personas, setPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [anadiendo, setAnadiendo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoGrupo, setNuevoGrupo] = useState(null);
  const [editando, setEditando] = useState(null);
  useEffect(() => {
    if (!user?.id) { setCargando(false); return; }
    import('../account/personas').then(m => m.listarPersonas()).then(p => setPersonas(p ?? [])).catch(() => {}).finally(() => setCargando(false));
  }, [user?.id]);

  if (cargando) return <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED }}>Cargando tu círculo...</p>;

  async function agregarNuevo() {
    const n = nuevoNombre.trim();
    if (!n || !nuevoGrupo) return;
    setNuevoNombre('');
    setNuevoGrupo(null);
    setAnadiendo(false);
    // La ficha se crea primero para seleccionar ya con su id real (si no, el círculo guardaría un id
    // provisional que no corresponde a ninguna persona).
    let persona = null;
    if (user?.id) {
      try {
        const m = await import('../account/personas');
        persona = await m.crearPersona(user.id, { nombre: n, grupo: nuevoGrupo }, null);
      } catch { /* sin conexión: se queda solo en este ejercicio */ }
    }
    const id = persona?.id ?? `nuevo_${Date.now()}`;
    setPersonas(prev => [...prev, persona ?? { id, nombre: n, primario: null, estado: 'sin_estimar' }]);
    onToggle(id, n);
  }

  function aceptarRazon(id, valor) {
    onExplicar(id, valor);
    setEditando(null);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: NAVY, margin: '0 0 10px', lineHeight: 1.5 }}>
        Selecciona o añade a aquellas <strong>personas que admiras de <span style={SUBRAYADO_ORO}>tu entorno o tu círculo</span></strong>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {personas.map(p => {
          const entry = seleccionados[p.id];
          const activo = entry?.activo;
          return (
            <button key={p.id} type="button" onClick={() => {
              if (activo && entry?.razon) { setEditando(p.id); return; }
              onToggle(p.id, p.nombre);
            }} style={{
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600,
              color: activo ? PAPER : NAVY, background: activo ? NAVY : BEIGE,
              border: `1.5px solid ${activo ? NAVY : LINE}`, borderRadius: 0,
              padding: '9px 16px', cursor: 'pointer', transition: 'all 150ms',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              {p.nombre}
              {activo && entry?.razon && <span style={{ color: PAPER, opacity: 0.7, display: 'inline-flex' }}><IconoLapiz /></span>}
            </button>
          );
        })}
        {anadiendo ? (
          <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <input
              autoFocus
              type="text"
              value={nuevoNombre}
              maxLength={40}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') agregarNuevo(); if (e.key === 'Escape') { setAnadiendo(false); setNuevoNombre(''); setNuevoGrupo(null); } }}
              placeholder="Nombre..."
              style={{
                fontFamily: FONT_BODY, fontSize: 16, color: NAVY, background: PAPER,
                border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '9px 12px',
                width: 140, outline: 'none',
              }}
            />
            {GRUPOS_PERSONA.map(([g, texto]) => (
              <button key={g} type="button" onClick={() => setNuevoGrupo(g)} style={{
                fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600,
                color: nuevoGrupo === g ? PAPER : NAVY, background: nuevoGrupo === g ? NAVY : 'transparent',
                border: `1.5px solid ${nuevoGrupo === g ? NAVY : LINE}`, borderRadius: 0, padding: '8px 12px', cursor: 'pointer',
              }}>
                {texto}
              </button>
            ))}
            <button type="button" onClick={agregarNuevo} disabled={!nuevoNombre.trim() || !nuevoGrupo} style={{
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600,
              color: PAPER, background: nuevoNombre.trim() && nuevoGrupo ? GOLD_REF : LINE,
              border: 'none', borderRadius: 0, padding: '9px 14px', cursor: nuevoNombre.trim() && nuevoGrupo ? 'pointer' : 'default',
            }}>
              Añadir
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setAnadiendo(true)} style={{
            fontFamily: FONT_BODY, fontSize: 20, fontWeight: 400,
            color: MUTED, background: 'transparent',
            border: `1.5px dashed ${LINE}`, borderRadius: 0,
            padding: '6px 16px', cursor: 'pointer', lineHeight: 1,
          }}>
            +
          </button>
        )}
      </div>
      {Object.entries(seleccionados).filter(([id, v]) => v.activo && (!v.razon || editando === id)).map(([id, v]) => (
        <div key={id} style={{ marginTop: 8, padding: '12px 14px', background: BEIGE, border: `1px solid ${LINE}`, borderRadius: 0 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: NAVY, margin: '0 0 8px', fontWeight: 600 }}>
            {(preguntaRazon ?? '¿Por qué consideras a {nombre} magnánimo/a?').replace('{nombre}', v.nombre)}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              type="text"
              defaultValue={v.razon || ''}
              placeholder="Escribe brevemente..."
              onKeyDown={(e) => { if (e.key === 'Enter') aceptarRazon(id, e.target.value); }}
              ref={el => { if (el) el._ref = id; }}
              style={{
                fontFamily: FONT_BODY, fontSize: 16, color: NAVY, background: PAPER,
                border: `1px solid ${LINE}`, borderRadius: 0, padding: '10px 14px',
                flex: 1, outline: 'none',
              }}
            />
            <button type="button" onClick={(e) => {
              const input = e.currentTarget.previousElementSibling;
              aceptarRazon(id, input?.value || '');
            }} style={{
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600,
              color: PAPER, background: GOLD_REF, border: 'none', borderRadius: 0,
              padding: '10px 18px', cursor: 'pointer',
            }}>
              Aceptar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const SUBRAYADO_ORO = { textDecoration: 'underline', textDecorationColor: GOLD_REF, textDecorationThickness: 2, textUnderlineOffset: 3 };

function RenderTextoRico(texto) {
  const partes = texto.split(/(\*\*__[^_]+__\*\*|\*\*[^*]+\*\*|__[^_]+__)/g);
  return partes.flatMap((parte, i) => {
    if (parte.startsWith('**__') && parte.endsWith('__**')) return [<strong key={i} style={{ fontWeight: 700, textDecoration: 'underline', textDecorationColor: GOLD_REF, textDecorationThickness: 2, textUnderlineOffset: 3 }}>{parte.slice(4, -4)}</strong>];
    if (parte.startsWith('**') && parte.endsWith('**')) return [<strong key={i} style={{ fontWeight: 700 }}>{parte.slice(2, -2)}</strong>];
    if (parte.startsWith('__') && parte.endsWith('__')) return [<span key={i} style={{ textDecoration: 'underline', textDecorationColor: GOLD_REF, textDecorationThickness: 2, textUnderlineOffset: 3 }}>{parte.slice(2, -2)}</span>];
    const lineas = parte.split('\n');
    if (lineas.length === 1) return [parte];
    return lineas.flatMap((l, li) => li === 0 ? [l] : [<br key={`${i}-br${li}`} />, l]);
  });
}

function CarruselCitas({ items }) {
  const [idx, setIdx] = useState(0);
  const trackRef = useRef(null);
  return (
    <div>
      <div style={{ overflow: 'hidden' }}>
        <div ref={trackRef} style={{
          display: 'flex', transition: 'transform 400ms cubic-bezier(.4,0,.2,1)',
          transform: `translateX(-${idx * 100}%)`,
        }}>
          {items.map((it, i) => (
            <div key={i} style={{ minWidth: '100%', flexShrink: 0 }}>
              <div style={{
                display: 'flex', gap: 14, padding: '16px 20px', background: BEIGE,
                borderLeft: `3px solid ${GOLD_REF}`,
              }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 40, lineHeight: 1, color: GOLD_REF, flexShrink: 0, marginTop: -4 }}>"</span>
                <p style={{ fontFamily: FONT_BODY, fontSize: 20, fontStyle: 'italic', color: NAVY, lineHeight: 1.65, margin: 0 }}>
                  {RenderTextoRico(it.cita)}
                </p>
              </div>
              {it.etiqueta && (
                <div style={{ textAlign: 'center', marginTop: 10, fontFamily: FONT_SLAB, fontSize: 15, fontWeight: 700, color: GOLD_REF_DK, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {it.etiqueta}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <button type="button" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{
          background: 'none', border: 'none', padding: '4px 8px', cursor: idx === 0 ? 'default' : 'pointer',
          fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: idx === 0 ? LINE : GOLD_REF_DK,
        }}>‹</button>
        {items.map((_, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)} style={{
            width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
            background: i === idx ? GOLD_REF : LINE,
            border: 'none', padding: 0, cursor: 'pointer',
            transition: 'all 300ms ease',
          }} />
        ))}
        <button type="button" onClick={() => setIdx(i => Math.min(items.length - 1, i + 1))} disabled={idx === items.length - 1} style={{
          background: 'none', border: 'none', padding: '4px 8px', cursor: idx === items.length - 1 ? 'default' : 'pointer',
          fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: idx === items.length - 1 ? LINE : GOLD_REF_DK,
        }}>›</button>
      </div>
    </div>
  );
}

export function renderElementoSlide(item, i, { setLightboxSrc }) {
  if (typeof item === 'string') {
    return <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: 0 }}>{RenderTextoRico(item)}</p>;
  }
  if (item.cita) {
    return (
      <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 20px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}` }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 40, lineHeight: 1, color: GOLD_REF, flexShrink: 0, marginTop: -4 }}>"</span>
        <p style={{ fontFamily: FONT_BODY, fontSize: 20, fontStyle: 'italic', color: NAVY, lineHeight: 1.65, margin: 0 }}>{RenderTextoRico(item.cita)}</p>
      </div>
    );
  }
  if (item.enfasis) {
    return <p key={i} style={{ fontFamily: FONT_SLAB, fontSize: item.grande ? 24 : 20, fontWeight: 700, color: NAVY, lineHeight: item.grande ? 1.4 : 1.6, margin: 0, textWrap: 'balance' }}>{RenderTextoRico(item.enfasis)}</p>;
  }
  if (item.titulo_pagina || item.subtitulo_pagina) return null;
  if (item.etiqueta) {
    return <div key={i} style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: GOLD_REF_DK, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '6px 0 -6px' }}>{item.etiqueta}</div>;
  }
  if (item.checks) {
    return (
      <ul key={i} style={{ listStyle: 'none', margin: '4px 0 10px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {item.checks.map((t, ci) => (
          <li key={ci} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75 }}>
            <IconoCheck width={20} height={20} style={{ color: GOLD_REF, flex: '0 0 20px', marginTop: 7 }} />
            <span>{RenderTextoRico(t)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (item.destacado) {
    return <p key={i} style={{ fontFamily: FONT_SLAB, fontSize: 'clamp(26px, 3vw, 34px)', fontWeight: 700, color: NAVY, lineHeight: 1.3, margin: '8px 0 12px', textWrap: 'balance' }}>{RenderTextoRico(item.destacado)}</p>;
  }
  if (item.carrusel) {
    return <CarruselCitas key={i} items={item.carrusel} />;
  }
  if (item.chips) {
    return (
      <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '4px 0 8px' }}>
        {item.chips.map((t, ci) => (
          <span key={t} className="vl-chip-anim" style={{
            animationDelay: `${ci * 160}ms`,
            fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
            background: 'rgba(165,139,38,0.08)', borderRadius: 20,
            padding: '8px 18px', display: 'inline-block',
            letterSpacing: '0.01em',
          }}>
            {t}
          </span>
        ))}
      </div>
    );
  }
  if (item.caja) {
    return (
      <div key={i} style={{ padding: '20px 24px', background: BEIGE, border: `1.5px solid ${LINE}`, borderLeft: `3px solid ${GOLD_REF}` }}>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, lineHeight: 1.55, margin: 0 }}>{RenderTextoRico(item.caja)}</p>
      </div>
    );
  }
  // Imagen a la izquierda y texto a la derecha, centrado en vertical respecto a la imagen (se apilan en móvil).
  if (item.columnas) {
    const c = item.columnas;
    const src = REFLEXION_IMAGENES[c.imagen];
    const imgSrc = Array.isArray(src) ? src[0] : src;
    return (
      <div key={i} className="vl-columnas" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28, alignItems: 'center', margin: '20px 0 30px' }}>
        {imgSrc && (
          // «Ver diagrama» va colgado bajo la imagen (absoluto) para que el centro de la imagen y el del texto coincidan.
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <img src={imgSrc} alt={c.imagen} style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block', margin: '0 auto' }} />
            <button type="button" onClick={() => setLightboxSrc(imgSrc)} style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: GOLD_REF_DK,
              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              <IconoLupa /> Ver diagrama
            </button>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {(c.textos ?? []).map((t, ti) => renderElementoSlide(t, ti, { setLightboxSrc }))}
        </div>
      </div>
    );
  }
  if (item.imagen) {
    const src = REFLEXION_IMAGENES[item.imagen];
    const imgSrc = Array.isArray(src) ? src[0] : src;
    if (!imgSrc) return null;
    if (item.pie) {
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={imgSrc} alt={item.pie} style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, fontStyle: 'italic', lineHeight: 1.5 }}>{item.pie}</span>
        </div>
      );
    }
    return (
      <div key={i} style={{ textAlign: 'center', margin: '16px 0 4px' }}>
        <img src={imgSrc} alt={item.imagen} style={{ maxWidth: '100%', maxHeight: 360, height: 'auto', display: 'block', margin: '0 auto' }} />
        <button type="button" onClick={() => setLightboxSrc(imgSrc)} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: GOLD_REF_DK,
          display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>
          <IconoLupa /> Ver diagrama
        </button>
      </div>
    );
  }
  return null;
}

export { REFLEXION_IMAGENES };

function SlideLectura({ slide, actual, total, onSiguiente, onAnterior, visible = true, titulo, todas }) {
  const todosItems = Array.isArray(slide) ? slide : [slide];
  // Página de un personaje (imagen con pie como primer elemento): foto a la izquierda, título y personaje a la derecha.
  const esRetrato = (it) => Boolean(it?.imagen && it?.pie);
  const retrato = esRetrato(todosItems[0]) ? todosItems[0] : null;
  const items = retrato ? todosItems.slice(1) : todosItems;
  const esUltima = actual === total;
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const tituloPagina = items.find(i => i?.titulo_pagina)?.titulo_pagina;
  // Mide todas las páginas de la lectura (ocultas) para reservar la altura de la más larga:
  // el botón no se mueve entre páginas y el contenido corto queda centrado.
  const medidorRef = useRef(null);
  const [altoCuerpo, setAltoCuerpo] = useState(0);
  const subRef = useRef(null);
  const [altoSub, setAltoSub] = useState(0);
  useEffect(() => {
    const el = subRef.current;
    if (!el) { setAltoSub(0); return; }
    const cs = getComputedStyle(el);
    setAltoSub(el.offsetHeight + parseFloat(cs.marginBottom) - 6);
  }, [slide]);
  const paginas = todas ?? [slide];
  useEffect(() => {
    const el = medidorRef.current;
    if (!el) return;
    const medir = () => setAltoCuerpo(Math.max(0, ...[...el.children].map(c => c.offsetHeight)));
    medir();
    const ro = new ResizeObserver(medir);
    [...el.children].forEach(c => ro.observe(c));
    return () => ro.disconnect();
  }, [paginas]);
  const subtituloPagina = items.find(i => i?.subtitulo_pagina)?.subtitulo_pagina;
  return (
    <Shell titulo="Lectura" actual={actual} total={total}>
      <div className="vl-pag" style={{ ...tarjeta, position: 'relative' }}>
        <div ref={medidorRef} aria-hidden style={{ position: 'absolute', left: 22, right: 22, top: 0, visibility: 'hidden', pointerEvents: 'none' }}>
          {paginas.map((pg, n) => (
            <div key={n} style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(Array.isArray(pg) ? pg : [pg]).filter((it, k) => !(k === 0 && esRetrato(it))).map((item, i) => renderElementoSlide(item, i, { setLightboxSrc: () => {} }))}
            </div>
          ))}
        </div>
        {retrato ? (() => {
          const src = REFLEXION_IMAGENES[retrato.imagen];
          const imgSrc = Array.isArray(src) ? src[0] : src;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 170px) minmax(0, 1fr)', gap: 10, alignItems: 'center', marginBottom: 20 }}>
              {imgSrc ? <img src={imgSrc} alt={retrato.pie} style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'multiply' }} /> : <span />}
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 10px', textWrap: 'balance' }}>
                  {tituloPagina || titulo || 'Lectura del cuaderno'}
                </h2>
                <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: GOLD_REF_DK, fontWeight: 600, lineHeight: 1.5, margin: 0, textWrap: 'balance' }}>{retrato.pie}</p>
              </div>
            </div>
          );
        })() : (
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: subtituloPagina ? '0 0 6px' : '0 0 12px', textWrap: 'balance' }}>
            {tituloPagina || titulo || 'Lectura del cuaderno'}
          </h2>
        )}
        {subtituloPagina && (
          <p ref={subRef} style={{ fontFamily: FONT_BODY, fontSize: 18, color: MUTED, lineHeight: 1.5, margin: '0 0 16px' }}>{RenderTextoRico(subtituloPagina)}</p>
        )}

        <div className="vl-pag-cuerpo" style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          display: 'flex', flexDirection: 'column', gap: 14, minHeight: altoCuerpo ? Math.max(0, altoCuerpo - altoSub) : undefined,
        }}>
          {items.map((item, i) => renderElementoSlide(item, i, { setLightboxSrc }))}
        </div>

        {lightboxSrc && <Lightbox src={lightboxSrc} alt="Diagrama" onClose={() => setLightboxSrc(null)} />}

        <div style={{ display: 'flex', justifyContent: actual > 1 ? 'space-between' : 'flex-end', marginTop: 32 }}>
          {actual > 1 && (
            <button type="button" onClick={onAnterior} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
              background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>← Anterior</button>
          )}
          <button type="button" onClick={onSiguiente} style={{
            fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
          }}>{esUltima ? 'Continuar →' : 'Siguiente →'}</button>
        </div>
      </div>
    </Shell>
  );
}

export function Lectura({ paso, onComplete }) {
  const lecturas = paso.lecturas ?? [];
  const total = lecturas.length;
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  function siguiente() {
    if (idx >= total - 1) {
      onComplete({});
    } else {
      setVisible(false);
      setTimeout(() => { setIdx(i => i + 1); setVisible(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 300);
    }
  }
  function anterior() {
    setVisible(false);
    setTimeout(() => { setIdx(i => Math.max(0, i - 1)); setVisible(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 300);
  }

  return (
    <div>
      {/* «Tu tendencia» se muestra ahora bajo el vídeo del módulo (PasoVideo). */}
      <SlideLectura
        slide={lecturas[idx]}
        todas={lecturas}
        actual={idx + 1}
        total={total}
        onSiguiente={siguiente}
        onAnterior={anterior}
        visible={visible}
        titulo={paso.titulo}
      />
    </div>
  );
}

const DISORDER_ORDER = ['R', 'VR', 'VM', 'VI', 'VC', 'SV', 'SI', 'SC'];

export function ObjetivosCorazon({ paso, onComplete, completados, guardado, irA }) {
  // Resultado del Test del corazón: el del paso del test o, si no está, el último guardado en la cuenta.
  const [resultadoCuenta, setResultadoCuenta] = useState(null);
  const [buscando, setBuscando] = useState(!completados?.[paso.paso_test]?.scoreResult);
  useEffect(() => {
    if (completados?.[paso.paso_test]?.scoreResult) return;
    let vivo = true;
    (async () => {
      try {
        const { data } = await supabase.from('test_results').select('result')
          .eq('kind', 'heart').order('taken_at', { ascending: false }).limit(1).maybeSingle();
        if (vivo) setResultadoCuenta(resultadoCorazonGuardado(data?.result));
      } catch {}
      if (vivo) setBuscando(false);
    })();
    return () => { vivo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const testResult = completados?.[paso.paso_test]?.scoreResult ?? resultadoCuenta;
  const disorders = testResult?.disorders;
  const cuantas = paso.cuantas || 2;
  // Ya hecho → resumen con sus respuestas y «Editar» (como el plan de misión); si no, carátula.
  const yaHecho = Boolean(guardado?.completado || Array.isArray(guardado?.codigos));
  const [fase, setFase] = useState(yaHecho ? 'indice' : -1);
  const [pantalla, setPantalla] = useState(0);
  const [objetivos, setObjetivos] = useState(() => ({ ...(guardado?.objetivos || {}) }));
  const [ejemploAbierto, setEjemploAbierto] = useState({});

  const topCodes = (() => {
    if (!disorders) return [];
    return Object.entries(disorders)
      .sort((a, b) => {
        const diff = (b[1].pct ?? 0) - (a[1].pct ?? 0);
        if (diff !== 0) return diff;
        return DISORDER_ORDER.indexOf(a[0]) - DISORDER_ORDER.indexOf(b[0]);
      })
      .slice(0, cuantas)
      .map(([code]) => code);
  })();

  function ir(n) { setPantalla(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function terminar() {
    const obj = {};
    topCodes.forEach(c => { obj[c] = objetivos[c] ?? ''; });
    const datos = { codigos: topCodes, objetivos: obj, completado: true, scoreResult: testResult };
    if (yaHecho) {
      onComplete(datos, { avanzar: false });
      setFase('indice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    onComplete(datos);
  }

  if (buscando) return null;

  const tarjetaFija = { ...tarjeta, minHeight: 'clamp(340px, calc(100vh - 140px), 760px)' };
  const h2 = { fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 16px', textWrap: 'balance' };
  const btnAnt = { fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY, background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer' };
  const btnSig = (ok = true) => ({ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff', background: ok ? GOLD_REF : LINE, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: ok ? 'pointer' : 'default' });
  const nav = (anterior, siguiente, textoSig = 'Siguiente →', ok = true) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 28 }}>
      {anterior ? <button type="button" onClick={anterior} style={btnAnt}>← Anterior</button> : <span />}
      <button type="button" onClick={siguiente} disabled={!ok} style={btnSig(ok)}>{textoSig}</button>
    </div>
  );

  if (!disorders) {
    return (
      <div style={tarjetaCentrada}>
        <h2 style={{ ...h2, textAlign: 'center' }}>Haz primero el Test del corazón</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: MUTED, lineHeight: 1.6, textAlign: 'center', margin: '0 auto 24px', maxWidth: 520 }}>Necesitas completar el Test del corazón para fijar tus objetivos prácticos.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={() => {
            const lang = window.__vlRuta().split('/')[1] || 'es';
            window.__vlAbrirWeb(`/${lang}/tests/corazon-libre?volver=${encodeURIComponent(window.__vlRuta())}`);
          }} style={{ ...btnSig(), fontSize: 19, padding: '18px 48px' }}>Hacer el Test del corazón →</button>
        </div>
      </div>
    );
  }

  if (fase === -1) {
    return <Caratula paso={paso} tipo="objetivos_corazon" onEmpezar={() => { setFase(0); ir(0); }} />;
  }

  if (fase === 'indice') {
    const codigos = Array.isArray(guardado?.codigos) && guardado.codigos.length ? guardado.codigos : topCodes;
    return (
      <div style={tarjetaCentrada}>
        <div style={{ textAlign: 'center', padding: '0 0 10px' }}>
          <span style={{
            display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
            background: SUCCESS_BG, border: `2px solid ${SUCCESS}`,
            fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: SUCCESS_DK,
          }}>✓</span>
        </div>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '16px 0 8px', textAlign: 'center' }}>Proyecto completado</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.6, textAlign: 'center', maxWidth: 480, margin: '0 auto 24px' }}>
          Estos son tus objetivos prácticos. Puedes editarlos cuando quieras.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {codigos.map((code, k) => {
            const ficha = paso.fichas?.[code];
            const nombre = ficha?.nombre_test || ficha?.nombre || code;
            const texto = (objetivos[code] ?? '').trim();
            return (
              <div key={code} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0', borderTop: k > 0 ? `1px solid ${LINE}` : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_SLAB, fontSize: 17, fontWeight: 700, color: NAVY }}>Tus objetivos prácticos para el {nombre.toLowerCase()}</div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: texto ? NAVY : MUTED, fontStyle: texto ? 'normal' : 'italic', lineHeight: 1.6, margin: '6px 0 0', whiteSpace: 'pre-line' }}>
                    {texto || 'Sin objetivos todavía.'}
                  </p>
                </div>
                <button type="button" onClick={() => { setFase(0); ir(topCodes.indexOf(code) + 1 || k + 1); }} style={{
                  flexShrink: 0, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: GOLD_REF_DK,
                  background: 'none', border: `1px solid ${GOLD_REF}`, borderRadius: 0, padding: '6px 16px', cursor: 'pointer',
                }}>Editar</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const total = 1 + topCodes.length;
  // Cabecera de cada enfermedad: retrato a la izquierda; nombre, personaje y resultado a la derecha (como en las lecturas).
  const cabecera = (code) => {
    const ficha = paso.fichas?.[code];
    const src = REFLEXION_IMAGENES[ficha?.imagen];
    const imgSrc = Array.isArray(src) ? src[0] : src;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 140px) minmax(0, 1fr)', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        {imgSrc ? <img src={imgSrc} alt={ficha?.pie || ''} style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'multiply' }} /> : <span />}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ ...h2, fontSize: 28, margin: '0 0 8px' }}>{ficha?.nombre_test || ficha?.nombre}</h2>
          {ficha?.pie && <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: GOLD_REF_DK, fontWeight: 600, lineHeight: 1.5, margin: '0 0 10px', textWrap: 'balance' }}>{ficha.pie}</p>}
          <span style={{ display: 'inline-block', fontFamily: FONT_BODY, fontSize: 16, color: NAVY, background: BEIGE, padding: '6px 14px', borderLeft: `3px solid ${GOLD_REF}` }}>
            Tu resultado: <strong>{Math.round(disorders[code]?.pct ?? 0)} %</strong>
          </span>
        </div>
      </div>
    );
  };

  let contenido;
  if (pantalla === 0) {
    contenido = (
      <div className="vl-pag" style={tarjetaFija}>
        <h2 style={h2}>Tus objetivos prácticos</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: '0 0 20px' }}>{paso.texto_intro}</p>
        {paso.ayuda_objetivos && <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.65, margin: '0 0 20px', padding: '14px 18px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}` }}>{paso.ayuda_objetivos}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topCodes.map(code => {
            const ficha = paso.fichas?.[code];
            const src = REFLEXION_IMAGENES[ficha?.imagen];
            const imgSrc = Array.isArray(src) ? src[0] : src;
            return (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}` }}>
                {imgSrc && <img src={imgSrc} alt="" style={{ width: 56, height: 56, objectFit: 'cover', mixBlendMode: 'multiply', flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0, fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY }}>{ficha?.nombre_test || ficha?.nombre}</div>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: GOLD_REF_DK }}>{Math.round(disorders[code]?.pct ?? 0)} %</div>
              </div>
            );
          })}
        </div>
        {nav(null, () => ir(1))}
      </div>
    );
  } else {
    const code = topCodes[pantalla - 1];
    const ficha = paso.fichas?.[code];
    const textoObj = objetivos[code] ?? '';
    const esUltima = pantalla === topCodes.length;
    contenido = (
      <div className="vl-pag" style={tarjetaFija}>
        {cabecera(code)}
        {ficha?.havard && <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.65, margin: '0 0 14px' }}>{ficha.havard}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ enfasis: 'Síntoma' }, { cita: ficha?.sintoma }].map((it, k) => renderElementoSlide(it, k, { setLightboxSrc: () => {} }))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ enfasis: 'Remedio' }, `**${ficha?.remedio ?? ''}**`].map((it, k) => renderElementoSlide(it, k, { setLightboxSrc: () => {} }))}
          </div>
        </div>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, margin: '22px 0 10px' }}>Mis objetivos prácticos</p>
        <textarea
          key={code}
          value={textoObj}
          onChange={e => setObjetivos(prev => ({ ...prev, [code]: e.target.value }))}
          placeholder={paso.placeholder}
          style={{
            fontFamily: FONT_BODY, fontSize: 18, color: NAVY, width: '100%', minHeight: 110,
            padding: '16px 18px', border: `1px solid ${LINE}`, borderRadius: 0,
            background: BEIGE, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', outline: 'none',
          }}
        />
        {ficha?.ejemplos?.length > 0 && (
          <>
            <button type="button" onClick={() => setEjemploAbierto(prev => ({ ...prev, [code]: !prev[code] }))} style={{
              alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, marginTop: 8, cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
              display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              <IconoLupa />
              {ejemploAbierto[code] ? 'Ocultar ejemplos' : 'Ver ejemplos'}
            </button>
            {ejemploAbierto[code] && (
              <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: '12px 16px', background: BEIGE, borderLeft: `2px solid ${GOLD_REF}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ficha.ejemplos.map((e, k) => (
                  <li key={k} style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.6 }}>«{e}»</li>
                ))}
              </ul>
            )}
          </>
        )}
        {nav(() => ir(pantalla - 1), esUltima ? terminar : () => ir(pantalla + 1), esUltima ? (yaHecho ? 'Guardar cambios' : 'Continuar →') : 'Siguiente →', Boolean(textoObj.trim()))}
      </div>
    );
  }

  return (
    <Shell titulo={paso.titulo} actual={pantalla + 1} total={total}>
      {contenido}
    </Shell>
  );
}

export function ArmoniaTemperamento({ paso, temperamento, onComplete, guardado }) {
  // Siempre arranca en la carátula, también si ya se hizo (se puede repasar y cambiar la respuesta).
  const [fase, setFase] = useState(-1);
  const [activo, setActivo] = useState(temperamento?.primary || null);
  const [elegido, setElegido] = useState(guardado?.facultad ?? null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const temps = paso.temperamentos || {};
  const p = temperamento?.primary;
  const s = temperamento?.secondary;
  const ruedaImg = REFLEXION_IMAGENES[paso.rueda];
  // Pantallas: 0 rueda · 1 tu temperamento (solo si hay test) · 2 pregunta
  const pantallas = p ? [0, 1, 2] : [0, 2];
  const total = pantallas.length;
  const actual = Math.max(0, pantallas.indexOf(fase)) + 1;

  function ir(f) { setFase(f); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function terminar() { onComplete({ facultad: elegido, temperamento: p }); }

  if (fase === -1) {
    return <Caratula paso={paso} tipo="armonia_temperamento" onEmpezar={() => ir(0)} />;
  }

  const tarjetaFija = { ...tarjeta, minHeight: 'clamp(340px, calc(100vh - 300px), 600px)' };
  const h2 = { fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 16px', textWrap: 'balance' };
  const btnAnt = { fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY, background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer' };
  const btnSig = (ok = true) => ({ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff', background: ok ? GOLD_REF : LINE, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: ok ? 'pointer' : 'default' });
  const nav = (anterior, siguiente, textoSig = 'Siguiente →', ok = true) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 28 }}>
      {anterior ? <button type="button" onClick={anterior} style={btnAnt}>← Anterior</button> : <span />}
      <button type="button" onClick={siguiente} disabled={!ok} style={btnSig(ok)}>{textoSig}</button>
    </div>
  );

  let contenido = null;
  if (fase === 0) {
    const info = activo ? temps[activo] : null;
    contenido = (
      <div className="vl-pag" style={tarjetaFija}>
        <h2 style={h2}>Los cuatro temperamentos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, alignItems: 'center', margin: '28px 0 44px' }}>
          <div style={{ position: 'relative' }}>
            {/* Rueda «de pizza»: cada cuarto es una capa recortada; el temperamento activo se separa del círculo
                y crece un poco con sombra, los demás se quedan en su sitio (sin oscurecerlos). */}
            <div style={{ position: 'relative', maxWidth: 380, margin: '0 auto', aspectRatio: '1 / 1' }}>
              {[['COL', '0 0, 50% 0, 50% 50%, 0 50%', -1, -1], ['MEL', '50% 0, 100% 0, 100% 50%, 50% 50%', 1, -1], ['SAN', '0 50%, 50% 50%, 50% 100%, 0 100%', -1, 1], ['FLE', '50% 50%, 100% 50%, 100% 100%, 50% 100%', 1, 1]].map(([code, poly, dx, dy]) => {
                const on = activo === code;
                return (
                  <div key={code} style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    transform: on ? `translate(${dx * 3}%, ${dy * 3}%) scale(1.03)` : 'scale(0.97)',
                    filter: on ? 'drop-shadow(0 10px 18px rgba(0,0,0,0.28))' : 'none',
                    transition: 'transform 450ms cubic-bezier(.34,1.4,.64,1), filter 450ms ease',
                    zIndex: on ? 2 : 1,
                  }}>
                    <img src={ruedaImg} alt="" style={{ width: '100%', height: '100%', display: 'block', clipPath: `polygon(${poly})` }} />
                  </div>
                );
              })}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', zIndex: 3 }}>
                {['COL', 'MEL', 'SAN', 'FLE'].map(code => (
                  <button key={code} type="button" aria-label={temps[code]?.nombre || code}
                    onMouseEnter={() => setActivo(code)} onFocus={() => setActivo(code)} onClick={() => setActivo(code)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 0, position: 'relative' }}>
                    {code === p && <span style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: activo === code ? `translate(calc(-50% + ${code === 'COL' || code === 'SAN' ? -8 : 8}px), calc(-50% + ${code === 'COL' || code === 'MEL' ? -8 : 8}px))` : 'translate(-50%, -50%)',
                      transition: 'transform 450ms cubic-bezier(.34,1.4,.64,1)',
                      fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: '#fff',
                      background: TEMP_COLORS[code] || GOLD_REF, borderRadius: 12, padding: '3px 10px',
                      textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none',
                    }}>Tú</span>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, textAlign: 'center', marginTop: 24 }}>
              <button type="button" onClick={() => setLightboxSrc(ruedaImg)} style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: GOLD_REF_DK,
                display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'underline', textUnderlineOffset: 3,
              }}><IconoLupa /> Ampliar imagen</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            {paso.texto_inicial?.map((t, k) => (
              <p key={k} style={{ fontFamily: FONT_BODY, fontSize: 19, color: NAVY, lineHeight: 1.65, margin: 0 }}>{t}</p>
            ))}
            {info ? (
              <div style={{ padding: '14px 18px', background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[activo] || GOLD_REF}` }}>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 21, fontWeight: 700, color: TEMP_COLORS[activo] || NAVY }}>{info.nombre}</div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 17, fontStyle: 'italic', color: NAVY, lineHeight: 1.6, margin: '6px 0' }}>«{info.frase}»</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: 0 }}>Tendencia: <strong style={{ color: NAVY }}>{info.tendencia}</strong></p>
              </div>
            ) : (
              <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: 0 }}>{paso.instruccion_rueda}</p>
            )}
          </div>
        </div>
        {lightboxSrc && <Lightbox src={lightboxSrc} alt="Rueda de temperamentos" onClose={() => setLightboxSrc(null)} />}
        {nav(null, () => ir(p ? 1 : 2))}
      </div>
    );
  } else if (fase === 1 && p) {
    contenido = (
      <div className="vl-pag" style={tarjetaFija}>
        <h2 style={h2}>Tu temperamento</h2>
        <BloqueCajas slider cajas={[[p, 'Temperamento primario'], [s, 'Temperamento secundario']].filter(([t]) => t && temps[t]).map(([t, rol]) => {
          const it = temps[t];
          return {
            etiqueta: `${rol.replace('Temperamento ', '').replace(/^./, m => m.toUpperCase())}: ${it.nombre}`,
            nodo: (
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '18px 20px', background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[t] ?? LINE}` }}>
                {RETRATO_TEMP[t] && <img src={RETRATO_TEMP[t]} alt={it.nombre} style={{ width: 96, height: 96, objectFit: 'cover', mixBlendMode: 'multiply', borderRadius: 4, flexShrink: 0 }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rol}</div>
                  <div style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, marginTop: 4 }}>{it.nombre}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 19, color: NAVY, marginTop: 6, lineHeight: 1.45 }}>{it.criatura}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, marginTop: 6 }}>Tendencia: <strong style={{ color: NAVY }}>{it.tendencia}</strong></div>
                </div>
              </div>
            ),
          };
        })} />
        {paso.cita_tendencia && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 19, fontStyle: 'italic', color: NAVY, lineHeight: 1.6, margin: '0 0 14px' }}>«{paso.cita_tendencia}»</p>
        )}
        {paso.texto_cultura && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 19, color: NAVY, lineHeight: 1.7, margin: 0 }}>{paso.texto_cultura}</p>
        )}
        {nav(() => ir(0), () => ir(2))}
      </div>
    );
  } else {
    contenido = (
      <div className="vl-pag" style={tarjetaFija}>
        <h2 style={h2}>{paso.pregunta}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(paso.opciones || []).map(op => (
            <BotonOpcion key={op.valor} texto={op.texto} seleccionada={elegido === op.valor} onClick={() => setElegido(op.valor)} />
          ))}
        </div>
        {nav(() => ir(p ? 1 : 0), terminar, 'Continuar →', Boolean(elegido))}
      </div>
    );
  }

  return (
    <Shell titulo={paso.titulo} actual={actual} total={total}>
      {contenido}
    </Shell>
  );
}

export function TestProfundo({ paso, onComplete, modulo, user, borrador, onBorrador }) {
  const rawPreguntas = paso.preguntas ?? [];
  const preguntas = rawPreguntas.map(p => typeof p === 'string' ? { texto: p } : p);
  const total = preguntas.length || paso.num_preguntas;
  const lecturas = paso.lecturas ?? [];
  const [fase, setFase] = useState(lecturas.length > 0 ? 'lectura' : 'caratula');
  const [lecturaIdx, setLecturaIdx] = useState(0);
  const [lecturaVisible, setLecturaVisible] = useState(true);
  const [idx, setIdx] = useState(0);
  const [respuestas, setRespuestas] = useState(() => leerTestProf(paso.id, total));
  const [circuloData, setCirculoData] = useState({});
  useBorrador({
    valor: { respuestas, circulo: circuloData },
    borrador, onBorrador,
    estaVacio: () => !respuestas.some(t => typeof t === 'string' && t.trim()) && Object.keys(circuloData).length === 0,
    hidratar: (b) => {
      if (Array.isArray(b.respuestas) && b.respuestas.length === total) setRespuestas(b.respuestas);
      if (b.circulo && typeof b.circulo === 'object') setCirculoData(b.circulo);
    },
  });
  const [ejemploAbierto, setEjemploAbierto] = useState({});
  const guardarTestCb = useCallback((d) => { try { localStorage.setItem(TEST_PROF_KEY(paso.id), JSON.stringify(d)); } catch {} }, [paso.id]);
  const guardados = useAutoguardado(guardarTestCb, respuestas);

  if (fase === 'caratula') return <Caratula paso={paso} tipo="test_profundo" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  if (fase === 'lectura') {
    return (
      <SlideLectura
        slide={lecturas[lecturaIdx]}
        todas={lecturas}
        actual={lecturaIdx + 1}
        total={lecturas.length}
        visible={lecturaVisible}
        titulo={paso.titulo_lectura || paso.titulo}
        onSiguiente={() => {
          setLecturaVisible(false);
          setTimeout(() => {
            if (lecturaIdx + 1 < lecturas.length) {
              setLecturaIdx(i => i + 1);
            } else {
              setFase('ejercicio');
            }
            setLecturaVisible(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 300);
        }}
        onAnterior={() => {
          if (lecturaIdx > 0) {
            setLecturaVisible(false);
            setTimeout(() => {
              setLecturaIdx(i => i - 1);
              setLecturaVisible(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
          }
        }}
      />
    );
  }

  const preg = preguntas[idx];

  function avanzar() {
    if (idx + 1 < total) {
      setIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFase('cierre');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function togglePersona(id, nombre) {
    setCirculoData(prev => {
      const entry = prev[`${idx}:${id}`];
      return { ...prev, [`${idx}:${id}`]: entry?.activo ? { ...entry, activo: false } : { activo: true, nombre, razon: '' } };
    });
  }

  function explicarPersona(id, razon) {
    setCirculoData(prev => ({ ...prev, [`${idx}:${id}`]: { ...prev[`${idx}:${id}`], razon } }));
  }

  const seleccionadosIdx = {};
  for (const [k, v] of Object.entries(circuloData)) {
    if (k.startsWith(`${idx}:`)) seleccionadosIdx[k.split(':')[1]] = v;
  }

  if (fase === 'cierre') {
    return (
      <div>
        <div style={tarjetaCentrada}>
          <div style={{ textAlign: 'center', padding: '0 0 10px' }}>
            <span style={{
              display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
              background: SUCCESS_BG, border: `2px solid ${SUCCESS}`,
              fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: SUCCESS_DK,
            }}>✓</span>
          </div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '16px 0 12px', textAlign: 'center' }}>
            Autoexamen completado
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.7, textAlign: 'center', maxWidth: 480, margin: '0 auto 28px' }}>
            Gracias por tomarte el tiempo de reflexionar con profundidad. Este ejercicio de autoconocimiento es uno de los más valiosos del curso.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="button" onClick={() => onComplete({ respuestas, circulo: circuloData })} style={{
              fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
            }}>
              Continuar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Shell titulo={paso.titulo} actual={idx + 1} total={total}>
      <div className="vl-pag-pregunta" style={{ ...tarjeta, position: 'relative' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, margin: '0 0 12px', lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
          {paso.titulo_lectura || paso.titulo}
        </p>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: '0 0 20px', lineHeight: 1.45 }}>{preg.texto ?? `Pregunta ${idx + 1}`}</p>
        {preg.circulo_oro && user && (
          <SelectorCirculoOro user={user} seleccionados={seleccionadosIdx} onToggle={togglePersona} onExplicar={explicarPersona} preguntaRazon={preg.circulo_pregunta} />
        )}
        {preg.circulo_oro && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: NAVY, margin: '0 0 8px', lineHeight: 1.5 }}>
            Añade a aquellas <strong>personas que admiras <span style={SUBRAYADO_ORO}>y no son de tu círculo</span></strong>
          </p>
        )}
        {paso.sub_enunciado && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.6, margin: '-8px 0 16px' }}>
            {paso.sub_enunciado}
          </p>
        )}
        <textarea
          key={idx}
          autoFocus
          value={respuestas[idx]}
          onChange={(e) => setRespuestas((prev) => { const n = [...prev]; n[idx] = e.target.value; return n; })}
          placeholder={preg.placeholder_texto ?? preg.placeholder ?? 'Escribe tu reflexión...'}
          style={{
            fontFamily: FONT_BODY, fontSize: 18, color: NAVY, background: BEIGE,
            border: `1px solid ${LINE}`, borderRadius: 0, padding: '16px 18px',
            width: '100%', minHeight: 160, resize: 'vertical', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 20, marginTop: 6 }}>
          <CheckGuardado campo={String(idx)} guardados={guardados} />
        </div>
        {!preg.ejemplo && preguntas.some(q => q.ejemplo) && (
          <div aria-hidden style={{ visibility: 'hidden', fontFamily: FONT_BODY, fontSize: 16, padding: '0 0 8px', lineHeight: 'normal' }}>Ver ejemplo</div>
        )}
        {preg.ejemplo && (
          <>
            <button type="button" onClick={() => setEjemploAbierto(prev => ({ ...prev, [idx]: !prev[idx] }))} style={{
              background: 'none', border: 'none', padding: '0 0 8px', cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
              display: 'flex', alignItems: 'center', gap: 5,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              <IconoLupa />
              Ver ejemplo
            </button>
            {ejemploAbierto[idx] && (
              <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.6, margin: '0 0 12px', padding: '10px 14px', background: BEIGE, borderLeft: `2px solid ${GOLD_REF}` }}>
                {preg.ejemplo}
              </p>
            )}
          </>
        )}
        <EspacioIgualado textos={preguntas.map((q, i) => q.texto ?? `Pregunta ${i + 1}`)} actual={idx} style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: '0 0 20px', lineHeight: 1.45 }} />
        <div className="vl-pag-nav" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {idx > 0 ? (
            <button type="button" onClick={() => { setIdx(i => i - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
              background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0,
              padding: '14px 36px', cursor: 'pointer',
            }}>
              ← Anterior
            </button>
          ) : <span />}
          {(() => {
            const hayTexto = !!respuestas[idx]?.trim();
            const hayCirculo = preg.circulo_oro && Object.values(seleccionadosIdx).some(v => v.activo);
            const puede = hayTexto || hayCirculo;
            return (
              <button type="button" onClick={avanzar} disabled={!puede} style={{
                fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
                background: puede ? GOLD_REF : LINE, border: 'none', borderRadius: 0,
                padding: '14px 36px', cursor: puede ? 'pointer' : 'default',
              }}>
                {idx + 1 < total ? 'Siguiente →' : 'Completar →'}
              </button>
            );
          })()}
        </div>
      </div>
    </Shell>
  );
}

/* ─── REFLEXIÓN PIRÁMIDE (imagen + preguntas abiertas) ─── */

const REFLEXION_IMAGENES = {
  'piramide-lv': [piramideViciosImg, piramideLVImg],
  'piramide-humildad': [piramideHumildadImg, piramideLVCompletaImg],
  'magnanimidad-temperamentos': diagramaTemperamentosImg,
  'humildad-temperamentos': diagramaHumildadTempImg,
  'diagrama-motivacion': diagramaMotivacionImg,
  'c5-cuerpo-alma-espiritu': c5CuerpoAlmaImg,
  'c5-triangulo-blanco': c5TrianguloImg,
  'c5-rueda-temperamentos': c5RuedaImg,
  'c5-R': heartFaceR,
  'c5-VR': heartFaceVR,
  'c5-VM': heartFaceVM,
  'c5-VC': heartFaceVC,
  'c5-SV': heartFaceSV,
  'c5-SI': heartFaceSI,
  'c5-SC': heartFaceSC,
  'c5-VI': c5IdeologicoImg,
};

const REFLEXION_KEY = (pasoId) => `vl-reflexion:${pasoId}`;
function leerReflexion(pasoId, total) {
  try { const d = JSON.parse(localStorage.getItem(REFLEXION_KEY(pasoId))); return Array.isArray(d) && d.length === total ? d : Array(total).fill(''); } catch { return Array(total).fill(''); }
}

export function ReflexionPiramide({ paso, onComplete, modulo, borrador, onBorrador }) {
  const preguntas = paso.preguntas ?? [];
  const totalSlides = preguntas.length + 1;
  const [fase, setFase] = useState('caratula');
  const [slide, setSlide] = useState(0);
  const [respuestas, setRespuestas] = useState(() => leerReflexion(paso.id, preguntas.length));
  useBorrador({
    valor: { respuestas },
    borrador, onBorrador,
    estaVacio: () => !respuestas.some(t => typeof t === 'string' && t.trim()),
    hidratar: (b) => { if (Array.isArray(b.respuestas) && b.respuestas.length === preguntas.length) setRespuestas(b.respuestas); },
  });
  const guardarReflCb = useCallback((d) => { try { localStorage.setItem(REFLEXION_KEY(paso.id), JSON.stringify(d)); } catch {} }, [paso.id]);
  const guardados = useAutoguardado(guardarReflCb, respuestas);
  const [lbSrc, setLbSrc] = useState(null);
  const [ejemploAb, setEjemploAb] = useState({});

  const imgEntry = REFLEXION_IMAGENES[paso.imagen] ?? null;
  const imgs = Array.isArray(imgEntry) ? imgEntry : imgEntry ? [imgEntry] : [];

  if (fase === 'caratula') return <Caratula paso={paso} tipo="reflexion_piramide" modulo={modulo} onEmpezar={() => setFase('ejercicio')} />;

  function avanzar() {
    if (slide + 1 < totalSlides) {
      setSlide((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFase('cierre');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (fase === 'cierre') {
    return (
      <div>
        <div style={tarjetaCentrada}>
          <div style={{ textAlign: 'center', padding: '0 0 10px' }}>
            <span style={{
              display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
              background: SUCCESS_BG, border: `2px solid ${SUCCESS}`,
              fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: SUCCESS_DK,
            }}>✓</span>
          </div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '16px 0 12px', textAlign: 'center' }}>
            Reflexión completada
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.7, textAlign: 'center', maxWidth: 480, margin: '0 auto 28px' }}>
            Has completado esta reflexión. Tus respuestas quedan guardadas en tu cuaderno personal.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="button" onClick={() => onComplete({ respuestas })} style={{
              fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
            }}>
              Continuar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (slide === 0) {
    return (
      <Shell titulo={paso.titulo} actual={1} total={totalSlides}>
        <div className="vl-pag" style={tarjeta}>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 12px', textWrap: 'balance' }}>
            {paso.enunciado}
          </h2>
          <div className="vl-pag-cuerpo" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {imgs.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                {imgs.map((src, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                    <div style={{ cursor: 'zoom-in' }} onClick={() => setLbSrc(src)}>
                      <img src={src} alt={paso.enunciado} style={{ width: '100%', height: 'auto', mixBlendMode: 'multiply' }} />
                    </div>
                    <button type="button" onClick={() => setLbSrc(src)} style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 8,
                      fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: GOLD_REF_DK,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      textDecoration: 'underline', textUnderlineOffset: 3,
                    }}>
                      <IconoLupa />
                      Ampliar diagrama
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {paso.descripcion && paso.descripcion.split('\n\n').map((p, i) => (
            <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: 0, textWrap: 'pretty' }}>{RenderTextoRico(p)}</p>
          ))}
          </div>
          {lbSrc && <Lightbox src={lbSrc} alt={paso.enunciado} onClose={() => setLbSrc(null)} />}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={avanzar} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              Siguiente →
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const qIdx = slide - 1;
  return (
    <Shell titulo={paso.titulo} actual={slide + 1} total={totalSlides}>
      <div className="vl-pag-pregunta" style={{ ...tarjeta, position: 'relative' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: '0 0 16px', lineHeight: 1.5 }}>
          Tómate un momento para reflexionar y responde con tus propias palabras.
        </p>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, margin: '0 0 20px', lineHeight: 1.45 }}>{preguntas[qIdx]}</p>
        <textarea
          key={qIdx}
          autoFocus
          value={respuestas[qIdx]}
          onChange={(e) => setRespuestas((prev) => { const n = [...prev]; n[qIdx] = e.target.value; return n; })}
          placeholder="Escribe tu reflexión..."
          style={{
            fontFamily: FONT_BODY, fontSize: 18, color: NAVY, background: BEIGE,
            border: `1px solid ${LINE}`, borderRadius: 0, padding: '16px 18px',
            width: '100%', boxSizing: 'border-box', minHeight: 140, resize: 'vertical', outline: 'none',
          }}
        />
        {paso.ejemplos?.[qIdx] ? (
          <EjemploColapsable texto={paso.ejemplos[qIdx]} abierto={ejemploAb[qIdx]} onToggle={() => setEjemploAb(prev => ({ ...prev, [qIdx]: !prev[qIdx] }))} />
        ) : (paso.ejemplos?.some(Boolean) && <div aria-hidden style={{ visibility: 'hidden' }}><EjemploColapsable texto="·" abierto={false} onToggle={() => {}} /></div>)}
        <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 20, marginTop: 6 }}>
          <CheckGuardado campo={String(qIdx)} guardados={guardados} />
        </div>
        <EspacioIgualado textos={preguntas} actual={qIdx} style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, margin: '0 0 20px', lineHeight: 1.45 }} />
        <div className="vl-pag-nav" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={() => { setSlide(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{
            fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
            background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0,
            padding: '14px 36px', cursor: 'pointer',
          }}>
            ← Anterior
          </button>
          <button type="button" onClick={avanzar} disabled={!respuestas[qIdx]?.trim()} style={{
            fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
            background: respuestas[qIdx]?.trim() ? GOLD_REF : LINE, border: 'none', borderRadius: 0,
            padding: '14px 36px', cursor: respuestas[qIdx]?.trim() ? 'pointer' : 'default',
          }}>
            {slide + 1 < totalSlides ? 'Siguiente →' : 'Completar →'}
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ─── TEMPERAMENTO × MAGNANIMIDAD ─── */

export function TemperamentoMagnanimidad({ paso, temperamento, onComplete, guardado, borrador, onBorrador }) {
  const yaHecho = Boolean(guardado);
  const [fase, setFase] = useState(-1);
  const [textoFuerte, setTextoFuerte] = useState(guardado?.textoFuerte ?? '');
  const [textoDebil, setTextoDebil] = useState(guardado?.textoDebil ?? '');
  const [textoFuerteSec, setTextoFuerteSec] = useState(guardado?.textoFuerteSec ?? '');
  const [textoDebilSec, setTextoDebilSec] = useState(guardado?.textoDebilSec ?? '');
  useBorrador({
    valor: { textoFuerte, textoDebil, textoFuerteSec, textoDebilSec },
    borrador, onBorrador,
    estaVacio: () => !guardado && ![textoFuerte, textoDebil, textoFuerteSec, textoDebilSec].some(t => t.trim()),
    hidratar: (b) => {
      setTextoFuerte(b.textoFuerte ?? ''); setTextoDebil(b.textoDebil ?? '');
      setTextoFuerteSec(b.textoFuerteSec ?? ''); setTextoDebilSec(b.textoDebilSec ?? '');
    },
  });
  const [lbSrc, setLbSrc] = useState(null);
  const [ejemploAb, setEjemploAb] = useState({});

  const p = temperamento?.primary;
  const s = temperamento?.secondary;
  const perfil = s ? `${p}-${s}` : p;
  const img = REFLEXION_IMAGENES[paso.imagen] ?? null;
  const obstaculo = paso.obstaculos?.[p];
  const sinergia = paso.sinergias_secundario?.[perfil];
  const reto = paso.reto_por_temperamento?.[p];

  if (fase === -1) {
    return <Caratula paso={paso} tipo="temperamento_magnanimidad" onEmpezar={() => { setFase(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />;
  }

  if (fase === 0) {
    return (
      <div>
        <div style={tarjeta}>
          <div style={eyebrow}>Paso 1 — Tu temperamento dominante</div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: '8px 0 14px' }}>
            {paso.enunciado}
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.65, margin: '0 0 20px' }}>
            {paso.descripcion}
          </p>

          {img && (
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <button type="button" onClick={() => setLbSrc(img)} style={{
                display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              }}>
                <img src={img} alt={paso.enunciado} style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'multiply' }} />
              </button>
              <div style={{ marginTop: 8 }}>
                <button type="button" onClick={() => setLbSrc(img)} style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}>
                  <IconoLupa />
                  Ampliar diagrama
                </button>
              </div>
            </div>
          )}

          {lbSrc && <Lightbox src={lbSrc} alt={paso.enunciado} onClose={() => setLbSrc(null)} />}

          {p && RETRATO_TEMP[p] && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, padding: '14px 16px', background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[p] ?? LINE}` }}>
              <img src={RETRATO_TEMP[p]} alt={TEMP_NOMBRE[p]} style={{ width: 60, height: 60, objectFit: 'cover', mixBlendMode: 'multiply', borderRadius: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tu temperamento dominante</div>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, marginTop: 4 }}>{TEMP_NOMBRE[p]}</div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={ESTILO_ENUNCIADO}>
              {paso.pregunta_fuerte}
            </label>
            <textarea
              value={textoFuerte}
              onChange={(e) => setTextoFuerte(e.target.value)}
              placeholder="Escribe los puntos fuertes que identificas…"
              rows={3}
              style={ESTILO_RESPUESTA}
            />
            <EjemploColapsable texto={paso.ejemplos_fuerte?.[p]} abierto={ejemploAb.fuerte} onToggle={() => setEjemploAb(prev => ({ ...prev, fuerte: !prev.fuerte }))} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={ESTILO_ENUNCIADO}>
              {paso.pregunta_debil}
            </label>
            <textarea
              value={textoDebil}
              onChange={(e) => setTextoDebil(e.target.value)}
              placeholder="Escribe los puntos débiles que identificas…"
              rows={3}
              style={ESTILO_RESPUESTA}
            />
            <EjemploColapsable texto={paso.ejemplos_debil?.[p]} abierto={ejemploAb.debil} onToggle={() => setEjemploAb(prev => ({ ...prev, debil: !prev.debil }))} />
          </div>

          <BloqueCajas cajas={[
            obstaculo && { etiqueta: 'Obstáculo', texto: obstaculo, fondo: ERROR_BG, borde: `3px solid ${ERROR}`, colorEtiqueta: ERROR_DK, color: ERROR_DK },
          ]} />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setLbSrc(null); setFase(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fase === 1) {
    return (
      <div>
        <div style={tarjeta}>
          <div style={eyebrow}>Paso 2 — Tu temperamento secundario</div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: '8px 0 14px' }}>
            Temperamento secundario y {paso.titulo?.toLowerCase().includes('humildad') ? 'humildad' : 'magnanimidad'}
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.65, margin: '0 0 20px' }}>
            {paso.descripcion}
          </p>

          {img && (
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <button type="button" onClick={() => setLbSrc(img)} style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <img src={img} alt={paso.enunciado} style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'multiply' }} />
              </button>
              <div style={{ marginTop: 8 }}>
                <button type="button" onClick={() => setLbSrc(img)} style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}>
                  <IconoLupa />
                  Ampliar diagrama
                </button>
              </div>
            </div>
          )}

          {lbSrc && <Lightbox src={lbSrc} alt={paso.enunciado} onClose={() => setLbSrc(null)} />}

          {s && RETRATO_TEMP[s] && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18, padding: '14px 16px', background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[s] ?? LINE}` }}>
              <img src={RETRATO_TEMP[s]} alt={TEMP_NOMBRE[s]} style={{ width: 60, height: 60, objectFit: 'cover', mixBlendMode: 'multiply', borderRadius: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tu temperamento secundario</div>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, marginTop: 4 }}>{TEMP_NOMBRE[s]}</div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={ESTILO_ENUNCIADO}>
              {paso.pregunta_fuerte_sec}
            </label>
            <textarea
              value={textoFuerteSec}
              onChange={(e) => setTextoFuerteSec(e.target.value)}
              placeholder="Escribe los puntos fuertes de tu secundario…"
              rows={3}
              style={ESTILO_RESPUESTA}
            />
            <EjemploColapsable texto={paso.ejemplos_fuerte?.[s]} abierto={ejemploAb.fuerteSec} onToggle={() => setEjemploAb(prev => ({ ...prev, fuerteSec: !prev.fuerteSec }))} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={ESTILO_ENUNCIADO}>
              {paso.pregunta_debil_sec}
            </label>
            <textarea
              value={textoDebilSec}
              onChange={(e) => setTextoDebilSec(e.target.value)}
              placeholder="Escribe los puntos débiles de tu secundario…"
              rows={3}
              style={ESTILO_RESPUESTA}
            />
            <EjemploColapsable texto={paso.ejemplos_debil?.[s]} abierto={ejemploAb.debilSec} onToggle={() => setEjemploAb(prev => ({ ...prev, debilSec: !prev.debilSec }))} />
          </div>

          <BloqueCajas cajas={[
            paso.obstaculos?.[s] && { etiqueta: 'Obstáculo', texto: paso.obstaculos[s], fondo: ERROR_BG, borde: `3px solid ${ERROR}`, colorEtiqueta: ERROR_DK, color: ERROR_DK },
            sinergia && { etiqueta: 'Sinergia', texto: sinergia, fondo: SUCCESS_BG, borde: `3px solid ${SUCCESS}`, colorEtiqueta: SUCCESS_DK, color: SUCCESS_DK },
            reto && { etiqueta: 'Tu reto personal', texto: reto, fondo: BEIGE, borde: `4px solid ${TEMP_COLORS[p] ?? GOLD_REF}`, colorEtiqueta: MUTED, color: NAVY },
          ]} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button type="button" onClick={() => { setFase(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
              background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              ← Anterior
            </button>
            <button type="button" onClick={() => onComplete({ visto: true, textoFuerte, textoDebil, textoFuerteSec, textoDebilSec })} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── CIERRE / SÍNTESIS ─── */

function TempCard({ codigo, tipo, onVerDiagrama }) {
  return (
    <div style={{ padding: 16, background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[codigo] ?? LINE}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Temperamento {tipo}</div>
      <div style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, marginTop: 4 }}>
        {TEMP_NOMBRE[codigo] ?? '—'}
      </div>
      {TEMP_SUBTITULO[codigo] && <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, marginTop: 2, fontStyle: 'italic' }}>{TEMP_SUBTITULO[codigo]}</div>}
      {DIAGRAMA_TEMP[codigo] && (
        <button type="button" onClick={() => onVerDiagrama(DIAGRAMA_TEMP[codigo])} style={{
          background: 'none', border: 'none', padding: 0, marginTop: 10, cursor: 'pointer',
          fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
          display: 'flex', alignItems: 'center', gap: 5,
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>
          <IconoLupa />
          Ver diagrama del temperamento
        </button>
      )}
    </div>
  );
}

export function TemperamentoPerfil({ paso, temperamento, onComplete }) {
  const [lbSrc, setLbSrc] = useState(null);
  const p = temperamento?.primary;
  const s = temperamento?.secondary;

  return (
    <Shell titulo={paso.titulo || 'Tu temperamento'} actual={1} total={1}>
      <div className="vl-pag" style={tarjeta}>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>Tu combinación de temperamentos</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.65, margin: '0 0 20px' }}>
          Según los resultados de tu test, esta es tu combinación de temperamentos.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: s ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr', gap: 12, marginBottom: 12 }}>
          <FichaTemperamento codigo={p} etiqueta="Temperamento primario" grande />
          {s && <FichaTemperamento codigo={s} etiqueta="Temperamento secundario" grande />}
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          {[p, s].filter(c => c && DIAGRAMA_TEMP[c]).map(c => (
            <button key={c} type="button" onClick={() => setLbSrc(DIAGRAMA_TEMP[c])} style={ESTILO_LINK_DIAGRAMA}>
              <IconoLupa /> Ver diagrama de {TEMP_NOMBRE[c]}
            </button>
          ))}
        </div>
        {lbSrc && <Lightbox src={lbSrc} alt="Diagrama de temperamento" onClose={() => setLbSrc(null)} />}

        <p style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>Cómo leer los diagramas</p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            { signo: '+', texto: 'tu temperamento te facilita este aspecto de la virtud.' },
            { signo: '−', texto: 'tu temperamento te lo dificulta.' },
            { signo: '+/−', texto: 'te facilita una parte y te dificulta otra: lee el texto de la casilla.' },
          ].map((item) => (
            <div key={item.signo} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '10px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, flex: '0 0 48px', textAlign: 'center' }}>{item.signo}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.5 }}>{item.texto}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 28 }}>
          <button type="button" onClick={() => onComplete({ visto: true })} style={ESTILO_BTN_SIG}>Continuar →</button>
        </div>
      </div>
    </Shell>
  );
}

function EjemploColapsable({ texto, abierto, onToggle }) {
  if (!texto) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <button type="button" onClick={onToggle} style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
        display: 'flex', alignItems: 'center', gap: 5,
        textDecoration: 'underline', textUnderlineOffset: 3,
      }}>
        <IconoLupa />
        Ver ejemplo
      </button>
      {abierto && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.6, margin: '6px 0 0', paddingLeft: 16, borderLeft: `2px solid ${LINE}`, fontStyle: 'italic' }}>
          {texto}
        </p>
      )}
    </div>
  );
}

/* ─── RETOS DEL TEMPERAMENTO (cuaderno sección 4) ─── */

const VIRTUD_DESAFIO_DESC = {
  'Humildad': 'La virtud de la humildad en su conjunto: cuidar de los demás, servirles y vivir en la verdad sobre ti mismo. Tendrás que mejorar esta virtud durante toda tu vida.',
  'Humildad fraterna': 'El aspecto de la virtud de la humildad que te insta a cuidar de los demás y a servirles, en lugar de servirte de ellos.',
  'Humildad fundamental': 'El aspecto de la virtud de la humildad relacionado con el autoconocimiento: vivir en la verdad sobre ti mismo, sobre tus talentos y tus límites.',
  'Audacia': 'El aspecto activo de la virtud de la fortaleza: atreverte a actuar, a correr riesgos y a convertir tus sueños en realidad superando el miedo a equivocarte.',
  'Resistencia y persistencia': 'El aspecto pasivo de la virtud de la fortaleza: la perseverancia, la constancia y la fidelidad necesarias para terminar lo que comienzas.',
  'Magnanimidad': 'La virtud de la grandeza: aspirar a cosas grandes, soñar en grande y convertir el sueño en una misión que da sentido a tu vida.',
};

// Estilos comunes de los ejercicios de escritura (curso 1): enunciado 20px, respuesta 18px, ayudas ≥16px.
const ESTILO_ENUNCIADO = { fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, display: 'block', margin: '0 0 10px', lineHeight: 1.45 };
const ESTILO_RESPUESTA = {
  width: '100%', padding: '16px 18px', boxSizing: 'border-box', border: `1px solid ${LINE}`, borderRadius: 0, outline: 'none',
  fontFamily: FONT_BODY, fontSize: 18, color: NAVY, background: BEIGE, resize: 'vertical', lineHeight: 1.6, minHeight: 120,
};
const ESTILO_BTN_ANT = { fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY, background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer' };
const ESTILO_BTN_SIG = { fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff', background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer' };
const ESTILO_LINK_DIAGRAMA = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
  display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'underline', textUnderlineOffset: 3,
};

function FichaTemperamento({ codigo, etiqueta, grande = false }) {
  if (!codigo) return null;
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 18px', background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[codigo] ?? LINE}` }}>
      {RETRATO_TEMP[codigo] && <img src={RETRATO_TEMP[codigo]} alt={TEMP_NOMBRE[codigo]} style={{ width: grande ? 88 : 64, height: grande ? 88 : 64, objectFit: 'cover', mixBlendMode: 'multiply', borderRadius: 4, flexShrink: 0 }} />}
      <div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{etiqueta}</div>
        <div style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, marginTop: 4 }}>{TEMP_NOMBRE[codigo]}</div>
      </div>
    </div>
  );
}

export function RetosTemperamento({ paso, temperamento, onComplete, guardado, borrador, onBorrador }) {
  const [fase, setFase] = useState(-1);
  const [textoFacilita, setTextoFacilita] = useState(guardado?.textoFacilita ?? '');
  const [textoDificulta, setTextoDificulta] = useState(guardado?.textoDificulta ?? '');
  const [textoDefectos, setTextoDefectos] = useState(guardado?.textoDefectos ?? '');
  const [lbSrc, setLbSrc] = useState(null);
  const [ejemploAbierto, setEjemploAbierto] = useState({});
  useBorrador({
    valor: { textoFacilita, textoDificulta, textoDefectos },
    borrador, onBorrador,
    estaVacio: () => ![textoFacilita, textoDificulta, textoDefectos].some(t => t.trim()),
    hidratar: (b) => {
      if (b.textoFacilita) setTextoFacilita(b.textoFacilita);
      if (b.textoDificulta) setTextoDificulta(b.textoDificulta);
      if (b.textoDefectos) setTextoDefectos(b.textoDefectos);
    },
  });

  const p = temperamento?.primary;
  const s = temperamento?.secondary;
  const perfil = s ? `${p}-${s}` : p;
  const virtudDesafio = paso.virtud_desafio_map?.[perfil] ?? paso.virtud_desafio_map?.[p] ?? '—';
  const fd = paso.facilita_dificulta?.[p];
  const compensa = paso.secundario_compensa?.[perfil];

  function ir(f) { setLbSrc(null); setFase(f); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  if (fase === -1) {
    return <Caratula paso={paso} tipo="retos_temperamento" onEmpezar={() => ir(0)} />;
  }

  const tarjetaFija = { ...tarjeta, minHeight: 'clamp(340px, calc(100vh - 215px), 685px)' };
  const h2 = { fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 12px', textWrap: 'balance' };
  const intro = { fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.65, margin: '0 0 18px' };
  const nav = (anterior, siguiente, texto = 'Siguiente →') => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 28 }}>
      {anterior ? <button type="button" onClick={anterior} style={ESTILO_BTN_ANT}>← Anterior</button> : <span />}
      <button type="button" onClick={siguiente} style={ESTILO_BTN_SIG}>{texto}</button>
    </div>
  );
  const linkDiagrama = (codigo) => DIAGRAMA_TEMP[codigo] && (
    <div style={{ margin: '0 0 20px' }}>
      <button type="button" onClick={() => setLbSrc(DIAGRAMA_TEMP[codigo])} style={ESTILO_LINK_DIAGRAMA}>
        <IconoLupa /> Ver diagrama de {TEMP_NOMBRE[codigo]}
      </button>
    </div>
  );

  let contenido;
  const cajaFD = (tipo) => tipo === 'facilita' ? (
    <div style={{ padding: '16px 18px', background: SUCCESS_BG, borderLeft: `3px solid ${SUCCESS}`, marginBottom: 14 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: SUCCESS_DK, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Favorece</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 18, color: SUCCESS_DK, lineHeight: 1.55 }}>{fd.facilita}</div>
    </div>
  ) : (
    <div style={{ padding: '16px 18px', background: ERROR_BG, borderLeft: `3px solid ${ERROR}`, marginBottom: 14 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: ERROR_DK, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Dificulta</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 18, color: ERROR_DK, lineHeight: 1.55 }}>{fd.dificulta}</div>
    </div>
  );
  if (fase === 0 || fase === 1) {
    const facilita = fase === 0;
    contenido = (
      <div className="vl-pag" style={tarjetaFija}>
        <h2 style={h2}>{facilita ? 'Lo que tu temperamento te facilita' : 'Lo que tu temperamento te dificulta'}</h2>
        <p style={intro}>Tu temperamento primario favorece la práctica de aspectos concretos de cada virtud y dificulta la práctica de otros aspectos.</p>
        <div style={{ marginBottom: 14 }}><FichaTemperamento codigo={p} etiqueta="Tu temperamento primario" /></div>
        {fd && cajaFD(facilita ? 'facilita' : 'dificulta')}
        {linkDiagrama(p)}
        <div>
          <label style={ESTILO_ENUNCIADO}>{facilita ? 'Lo que mi temperamento me facilita' : 'Lo que mi temperamento me dificulta'}</label>
          {facilita ? (
            <textarea key="f" value={textoFacilita} onChange={(e) => setTextoFacilita(e.target.value)} placeholder="Reflexiona…" style={ESTILO_RESPUESTA} />
          ) : (
            <textarea key="d" value={textoDificulta} onChange={(e) => setTextoDificulta(e.target.value)} placeholder="Reflexiona…" style={ESTILO_RESPUESTA} />
          )}
          <EjemploColapsable
            texto={facilita ? paso.ejemplos_facilita?.[p] : paso.ejemplos_dificulta?.[p]}
            abierto={ejemploAbierto[facilita ? 'facilita' : 'dificulta']}
            onToggle={() => setEjemploAbierto(prev => ({ ...prev, [facilita ? 'facilita' : 'dificulta']: !prev[facilita ? 'facilita' : 'dificulta'] }))}
          />
        </div>
        {nav(facilita ? null : () => ir(0), () => ir(fase + 1))}
      </div>
    );
  } else if (fase === 2) {
    contenido = (
      <div className="vl-pag" style={tarjetaFija}>
        <h2 style={h2}>Tu virtud-desafío</h2>
        <p style={intro}>Cada temperamento tiene una virtud-desafío: la virtud que más necesitas trabajar a lo largo de tu vida.</p>
        <div className="vl-pag-cuerpo" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '24px 28px', background: BEIGE, borderLeft: `4px solid ${TEMP_COLORS[p] ?? GOLD_REF}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Tu virtud-desafío</div>
            <div style={{ fontFamily: FONT_SLAB, fontSize: 30, fontWeight: 700, color: NAVY }}>{virtudDesafio}</div>
          </div>
          <p style={{ ...intro, margin: 0 }}>
            {VIRTUD_DESAFIO_DESC[virtudDesafio] ?? 'Si trabajas en ella, te será más fácil trabajar las demás virtudes.'}
          </p>
        </div>
        {nav(() => ir(1), () => ir(3))}
      </div>
    );
  } else {
    contenido = (
      <div className="vl-pag" style={tarjetaFija}>
        <h2 style={h2}>Tu temperamento secundario</h2>
        <p style={intro}>Tu temperamento secundario puede compensar algunos defectos de tu temperamento primario.</p>
        {s && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 16 }}>
            <FichaTemperamento codigo={p} etiqueta="Primario" />
            <FichaTemperamento codigo={s} etiqueta="Secundario" />
          </div>
        )}
        {compensa && (
          <div style={{ padding: '16px 20px', background: SUCCESS_BG, borderLeft: `3px solid ${SUCCESS}`, marginBottom: 16 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: SUCCESS_DK, lineHeight: 1.6, margin: 0 }}>
              Como {TEMP_NOMBRE[p]}/{TEMP_NOMBRE[s]}, {compensa}.
            </p>
          </div>
        )}
        {linkDiagrama(s)}
        <div>
          <label style={ESTILO_ENUNCIADO}>¿Qué defectos de tu temperamento primario pueden ser superados con la ayuda de tu temperamento secundario?</label>
          <textarea value={textoDefectos} onChange={(e) => setTextoDefectos(e.target.value)} placeholder="Reflexiona…" style={ESTILO_RESPUESTA} />
          <EjemploColapsable texto={paso.ejemplos_defectos?.[perfil]} abierto={ejemploAbierto.defectos} onToggle={() => setEjemploAbierto(prev => ({ ...prev, defectos: !prev.defectos }))} />
        </div>
        {nav(() => ir(2), () => onComplete({ visto: true, textoFacilita, textoDificulta, textoDefectos }), 'Continuar →')}
      </div>
    );
  }

  return (
    <Shell titulo={paso.titulo} actual={fase + 1} total={4}>
      {contenido}
      {lbSrc && <Lightbox src={lbSrc} alt="Diagrama de temperamento" onClose={() => setLbSrc(null)} />}
    </Shell>
  );
}

/* ─── CÍRCULO DE PERSONAS ─── */

const GRUPOS_SIMPLE = [
  ['familia', 'Familia'],
  ['amigos', 'Amigos'],
  ['trabajo', 'Trabajo / estudios'],
  ['otros', 'Otros'],
];

const MINI_PREGUNTAS_IDX = [0, 1, 2, 3, 5, 7];

const DIAG_IMPOSIBLE = new Set(['COL-FLE', 'FLE-COL', 'MEL-SAN', 'SAN-MEL']);

export function CirculoPersonas({ paso, user, onComplete }) {
  const [fase, setFase] = useState('intro');
  const [nombre, setNombre] = useState('');
  const [grupo, setGrupo] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [preguntaIdx, setPreguntaIdx] = useState(0);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [copiado, setCopiado] = useState(false);
  const temp = paso.temperamento_tema;

  const [ordenOpciones] = useState(() =>
    MINI_PREGUNTAS_IDX.map(() => {
      const o = [...TEMPS];
      for (let i = o.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [o[i], o[j]] = [o[j], o[i]];
      }
      return o;
    })
  );

  if (fase === 'intro') {
    return <Caratula paso={paso} tipo="circulo_personas" onEmpezar={() => setFase('datos')} />;
  }

  function calcularResultado() {
    const puntos = { COL: 0, MEL: 0, SAN: 0, FLE: 0 };
    for (const r of respuestas) if (puntos[r] !== undefined) puntos[r] += 1;
    const resto = TEMPS.filter(k => k !== temp).sort((a, b) => puntos[b] - puntos[a]);
    let secundario = puntos[resto[0]] >= 2 ? resto[0] : null;
    const noSe = respuestas.filter(r => r === NO_SE).length;
    const confianza = noSe <= 1 ? 'media' : 'baja';
    const imposible = secundario && DIAG_IMPOSIBLE.has(`${temp}-${secundario}`);
    if (imposible) secundario = null;
    return { puntos, secundario, confianza, imposible, indeterminado: !secundario && !imposible };
  }

  function responder(tempCode) {
    const nuevas = [...respuestas, tempCode];
    setRespuestas(nuevas);
    if (preguntaIdx < MINI_PREGUNTAS_IDX.length - 1) {
      setPreguntaIdx(preguntaIdx + 1);
    } else {
      setFase('resumen');
    }
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
      const { crearPersona, anotarObservacion } = await import('../account/personas');
      const estimacion = { primario: temp, secundario, confianza, puntos, respuestas };
      const persona = await crearPersona(user.id, { nombre: n, grupo }, estimacion);
      if (notas.trim() && persona?.id) {
        // 'otro': la tabla solo admite las situaciones de la ficha (no hay una propia de la formación).
        await anotarObservacion(user.id, persona.id, {
          situacion: 'otro', palabra: null, temperamento: null, linea: notas.trim().slice(0, 280),
        });
      }
      setPersonas(prev => [...prev, { nombre: n, grupo, primario: temp, secundario }]);
      setNombre('');
      setGrupo(null);
      setRespuestas([]);
      setPreguntaIdx(0);
      setNotas('');
      setFase('datos');
    } catch (err) {
      console.error('Error al guardar persona:', err);
    } finally {
      setGuardando(false);
    }
  }

  const preguntaActual = fase === 'test' ? PREGUNTAS[MINI_PREGUNTAS_IDX[preguntaIdx]] : null;
  const resultado = fase === 'resumen' ? calcularResultado() : null;

  const pasoShell = fase === 'datos' || fase === 'listado' ? 1 : fase === 'test' ? 2 : 3;
  return (
    <Shell titulo={paso.titulo} actual={pasoShell} total={3}>
      <div className="vl-pag" style={{ ...tarjeta, minHeight: 'clamp(340px, calc(100vh - 210px), 690px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          {RETRATO_TEMP[temp] && <img src={RETRATO_TEMP[temp]} alt={TEMP_NOMBRE[temp]} style={{ width: 64, height: 64, objectFit: 'cover', mixBlendMode: 'multiply', borderRadius: 4, flexShrink: 0 }} />}
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: 0 }}>
            {fase === 'test' ? `¿Cómo reacciona ${nombre.trim()}?` : fase === 'resumen' ? `Resultado estimado para ${nombre.trim()}` : `¿Conoces a algún ${(TEMP_NOMBRE[temp] || '').toLowerCase()}?`}
          </h2>
        </div>

        {/* ── FASE DATOS ── */}
        {fase === 'datos' && <>
          <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: MUTED, lineHeight: 1.65, margin: '0 0 8px' }}>
            {paso.pregunta}
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: NAVY, lineHeight: 1.5, margin: '0 0 22px', fontStyle: 'italic' }}>
            {TEMP_NOMBRE[temp]}: {paso.descripcion_temp}
          </p>

          {personas.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Personas añadidas
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {personas.map((p, i) => {
                  const pendiente = p.grupo === 'pendiente';
                  return (
                    <span key={i} style={{
                      fontFamily: FONT_BODY, fontSize: 17, padding: '6px 14px',
                      background: pendiente ? BEIGE : SUCCESS_BG,
                      border: `1px solid ${pendiente ? GOLD_REF : SUCCESS}`,
                      color: pendiente ? NAVY : SUCCESS_DK,
                    }}>
                      {p.nombre}{p.secundario ? ` · ${TEMP_NOMBRE[p.secundario]}` : ''}
                      {pendiente && <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginLeft: 6 }}>· pendiente</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={ESTILO_ENUNCIADO}>
              Nombre o apodo
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: María, mi jefe, el abuelo…"
              maxLength={40}
              autoComplete="off"
              style={{
                width: '100%', padding: '14px 18px', boxSizing: 'border-box', outline: 'none',
                border: `1px solid ${LINE}`, fontFamily: FONT_BODY, fontSize: 18, color: NAVY,
                background: BEIGE,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={ESTILO_ENUNCIADO}>
              ¿De qué entorno?
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GRUPOS_SIMPLE.map(([key, label]) => (
                <button key={key} type="button" onClick={() => setGrupo(grupo === key ? null : key)} style={{
                  fontFamily: FONT_BODY, fontSize: 17, padding: '8px 16px',
                  border: `1.5px solid ${grupo === key ? NAVY : LINE}`,
                  background: grupo === key ? NAVY : PAPER,
                  color: grupo === key ? PAPER : NAVY,
                  borderRadius: 0, cursor: 'pointer', transition: 'all 150ms ease',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.6, margin: '0 0 6px', fontStyle: 'italic' }}>
            A continuación harás un breve test (6 preguntas) para estimar qué temperamento secundario tiene {nombre.trim() || 'esa persona'}.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 'auto', paddingTop: 24 }}>
            <button type="button" onClick={() => onComplete({ personas: personas.length })} style={ESTILO_BTN_ANT}>
              {personas.length > 0 ? 'Terminar' : 'Saltar este paso'}
            </button>
            <button type="button" onClick={() => { setFase('test'); setPreguntaIdx(0); setRespuestas([]); }} disabled={!nombre.trim() || !grupo} style={{
              ...ESTILO_BTN_SIG,
              background: nombre.trim() && grupo ? GOLD_REF : LINE,
              cursor: nombre.trim() && grupo ? 'pointer' : 'default',
            }}>
              Siguiente →
            </button>
          </div>
        </>}

        {/* ── FASE LISTADO ── */}
        {fase === 'listado' && <>
          <h3 style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, margin: '0 0 6px', textAlign: 'center' }}>
            Personas añadidas
          </h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, textAlign: 'center', margin: '0 0 20px' }}>
            {personas.length === 1 ? '1 persona' : `${personas.length} personas`}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {personas.map((p, i) => {
              const grupoLabel = GRUPOS_SIMPLE.find(([k]) => k === p.grupo)?.[1] ?? p.grupo;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', background: PAPER,
                  borderLeft: `4px solid ${TEMP_COLORS[p.primario] ?? GOLD_REF}`,
                  border: `1px solid ${LINE}`, borderLeftWidth: 4, borderLeftColor: TEMP_COLORS[p.primario] ?? GOLD_REF,
                }}>
                  <span style={{
                    display: 'inline-grid', placeItems: 'center', width: 38, height: 38, borderRadius: '50%',
                    background: TEMP_COLORS[p.primario] ? `${TEMP_COLORS[p.primario]}22` : BEIGE,
                    fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: TEMP_COLORS[p.primario] ?? NAVY,
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: NAVY }}>
                      {p.nombre}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, marginTop: 2 }}>
                      {grupoLabel} · {TEMP_NOMBRE[p.primario]}{p.secundario ? ` / ${TEMP_NOMBRE[p.secundario]}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setFase('datos')} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
              background: PAPER, border: `1.5px solid ${LINE}`, borderRadius: 0,
              padding: '14px 24px', cursor: 'pointer', flex: 1, minWidth: 160,
            }}>
              + Añadir otra persona
            </button>
            <button type="button" onClick={() => onComplete({ personas: personas.length })} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0,
              padding: '14px 36px', cursor: 'pointer', flex: 1, minWidth: 160,
            }}>
              Continuar →
            </button>
          </div>
        </>}

        {/* ── FASE TEST (6 preguntas) ── */}
        {fase === 'test' && preguntaActual && <>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: '0 0 6px' }}>
            Piensa en cómo reacciona {nombre.trim()}, no en cómo es por fuera.
          </p>
          <div style={{ ...barraFondo, margin: '12px 0 8px', height: 6 }}>
            <div style={{ height: '100%', width: `${Math.round(((preguntaIdx + 1) / MINI_PREGUNTAS_IDX.length) * 100)}%`, background: GOLD_REF_DK, transition: 'width 400ms ease' }} />
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, marginBottom: 22 }}>
            Pregunta {preguntaIdx + 1} de {MINI_PREGUNTAS_IDX.length}
          </div>

          <p style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, margin: '0 0 18px', lineHeight: 1.45 }}>
            {preguntaActual[0]}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {ordenOpciones[preguntaIdx].map(tKey => (
              <button key={tKey} type="button" onClick={() => responder(tKey)} style={{
                fontFamily: FONT_BODY, fontSize: 18, padding: '14px 18px', textAlign: 'left',
                border: `1.5px solid ${LINE}`, background: PAPER, color: NAVY,
                borderRadius: 0, cursor: 'pointer', transition: 'all 150ms ease', lineHeight: 1.45,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_REF; e.currentTarget.style.background = '#fffbf0'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.background = PAPER; }}
              >
                {preguntaActual[1][tKey]}
              </button>
            ))}
            <button type="button" onClick={() => responder(NO_SE)} style={{
              fontFamily: FONT_BODY, fontSize: 17, padding: '10px 18px', textAlign: 'center',
              border: `1px dashed ${LINE}`, background: 'transparent', color: MUTED,
              borderRadius: 0, cursor: 'pointer', fontStyle: 'italic',
            }}>
              No lo sé
            </button>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            <button type="button" onClick={retrocederPregunta} style={ESTILO_BTN_ANT}>← Anterior</button>
          </div>
        </>}

        {/* ── FASE RESUMEN + NOTAS ── */}
        {fase === 'resumen' && resultado && (() => {
          const sinResultado = resultado.imposible || !resultado.secundario;
          const urlTest = 'https://virtuousleadership.com/es/tests/temperamento?utm_source=portal&utm_medium=referral&utm_campaign=conoces_alguien';
          const textoWa = `Hola, te invito a hacer este test de temperamento para conocerte mejor: ${urlTest}`;
          const urlWa = `https://wa.me/?text=${encodeURIComponent(textoWa)}`;
          return <>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 14 }}>
            <FichaTemperamento codigo={temp} etiqueta="Primario" />
            {resultado.secundario ? <FichaTemperamento codigo={resultado.secundario} etiqueta="Secundario (estimado)" /> : (
              <div style={{ padding: '14px 18px', background: BEIGE, borderLeft: `3px solid ${LINE}` }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Secundario</div>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: MUTED, marginTop: 4 }}>No determinado</div>
              </div>
            )}
          </div>

          {sinResultado ? (
            <div style={{ padding: '16px 20px', background: WARNING_BG, border: `1px solid ${GOLD_REF_LT}`, marginBottom: 20 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: NAVY, margin: '0 0 6px', lineHeight: 1.6 }}>
                {resultado.imposible
                  ? `La combinación ${TEMP_NOMBRE[temp]} con el secundario estimado no es posible según el modelo de temperamentos.`
                  : 'Las respuestas no son suficientes para determinar un temperamento secundario.'}
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: 0, lineHeight: 1.5 }}>
                Lo mejor es que {nombre.trim()} haga el test de temperamento completo.
              </p>
            </div>
          ) : (
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, fontStyle: 'italic', margin: '0 0 18px' }}>
              Es una estimación tuya — solo {nombre.trim()} puede confirmarlo haciendo el test.
            </p>
          )}

          {/* ── COMPARTIR TEST ── */}
          <div style={{ borderTop: `1px solid ${LINE}`, margin: '0 0 20px', paddingTop: 16 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 17, fontWeight: 600, color: NAVY, margin: '0 0 10px' }}>
              Invita a {nombre.trim()} a hacer el test completo
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => { navigator.clipboard.writeText(urlTest).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); }); }} style={{
                fontFamily: FONT_BODY, fontSize: 17, fontWeight: 600, padding: '10px 20px',
                border: `1.5px solid ${NAVY}`, background: copiado ? NAVY : PAPER,
                color: copiado ? PAPER : NAVY, borderRadius: 0, cursor: 'pointer',
                transition: 'all 150ms ease', minWidth: 140,
              }}>
                {copiado ? 'Enlace copiado' : 'Copiar enlace'}
              </button>
              <a href={urlWa} target="_blank" rel="noopener noreferrer" style={{
                fontFamily: FONT_BODY, fontSize: 17, fontWeight: 600, padding: '10px 20px',
                border: `1.5px solid #25d366`, background: '#25d366', color: '#fff',
                borderRadius: 0, textDecoration: 'none', textAlign: 'center', minWidth: 140,
                display: 'inline-block',
              }}>
                Compartir por WhatsApp
              </a>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={ESTILO_ENUNCIADO}>
              Notas sobre {nombre.trim()} <span style={{ fontWeight: 400, color: MUTED }}>(opcional)</span>
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones, cómo le tratas, lo que te llama la atención…"
              rows={3}
              style={{
                width: '100%', padding: '16px 18px', boxSizing: 'border-box', outline: 'none',
                border: `1px solid ${LINE}`, fontFamily: FONT_BODY, fontSize: 18, color: NAVY,
                background: BEIGE, resize: 'vertical', minHeight: 100, lineHeight: 1.6,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="button" onClick={() => { setFase('test'); setRespuestas(respuestas.slice(0, -1)); setPreguntaIdx(MINI_PREGUNTAS_IDX.length - 1); }} style={ESTILO_BTN_ANT}>
              ← Anterior
            </button>
            <button type="button" onClick={guardar} disabled={guardando} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600,
              color: '#fff', background: GOLD_REF,
              border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
              transition: 'all 150ms ease', marginLeft: 'auto',
            }}>
              {guardando ? 'Guardando…' : 'Guardar persona'}
            </button>
          </div>
        </>;
        })()}
      </div>
    </Shell>
  );
}

/* ─── CONCLUSIÓN DE MÓDULO ─── */

export function ConclusionModulo({ paso, completados, pendientes = [], onContinuar, onVolver, irA }) {
  const aprendizajes = paso.aprendizajes ?? [];
  const ejercicios = paso.ejercicios_evaluables ?? [];
  const hayPendientes = pendientes.length > 0;

  const scores = ejercicios.map(e => {
    const id = typeof e === 'string' ? e : e.id;
    const label = typeof e === 'string' ? '' : (e.label ?? '');
    const c = completados[id];
    if (!c || typeof c.aciertos !== 'number') return null;
    return { id, label, aciertos: c.aciertos, total: c.total };
  }).filter(Boolean);

  const hayEvaluables = scores.length > 0;
  const todosACero = hayEvaluables && scores.every(s => s.aciertos === 0);
  const bloqueado = todosACero || hayPendientes;

  const ETIQUETAS = {
    video: 'Vídeo', quiz: 'Cuestionario', define: 'Definiciones', desliza: 'Desliza',
    identifica: 'Identifica', test_profundo: 'Test', reflexion_piramide: 'Reflexión',
    temperamento_magnanimidad: 'Temperamento', temperamento_perfil: 'Tu perfil',
    retos_temperamento: 'Retos', circulo_personas: 'Círculo de personas',
    reflexion_guiada: 'Reflexión', plan_crecimiento: 'Plan de crecimiento',
    test_caracter: 'Test de carácter', test_corazon: 'Test del corazón',
  };

  return (
    <div>
      <div style={tarjetaCentrada}>
        <div style={{ textAlign: 'center', padding: '0 0 10px' }}>
          <span style={{
            display: 'inline-grid', placeItems: 'center', width: 72, height: 72, borderRadius: '50%',
            background: bloqueado ? ERROR_BG : SUCCESS_BG,
            border: `2px solid ${bloqueado ? ERROR : SUCCESS}`,
            fontFamily: FONT_SLAB, fontSize: 32, fontWeight: 700,
            color: bloqueado ? ERROR_DK : SUCCESS_DK,
          }}>
            {bloqueado ? '✗' : '✓'}
          </span>
        </div>

        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '14px 0 6px', textAlign: 'center', lineHeight: 1.3 }}>
          {hayPendientes
            ? 'Todavía no has completado todos los pasos'
            : todosACero ? 'Módulo no superado' : (paso.modulo_completado || `Módulo ${paso.modulo_numero + 1} completado`)}
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, textAlign: 'center', margin: '0 0 20px' }}>
          {paso.modulo_titulo}
        </p>

        {hayPendientes && (
          <div style={{ padding: '16px 20px', background: ERROR_BG, borderLeft: `3px solid ${ERROR}`, marginBottom: 20, lineHeight: 1.6 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: ERROR_DK, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              Debes finalizar los siguientes pasos
            </div>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {pendientes.map((p) => (
                <li key={p.id} style={{ marginBottom: 8 }}>
                  <button type="button" onClick={() => irA && irA(p.id)} style={{
                    background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
                    fontFamily: FONT_BODY, fontSize: 16, color: GOLD_REF_DK, fontWeight: 600,
                    textDecoration: 'underline', textAlign: 'left',
                  }}>
                    {ETIQUETAS[p.tipo] ?? p.tipo}: {p.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hayPendientes && (() => {
          const items = [];
          scores.forEach(s => {
            const pct = s.total > 0 ? Math.round((s.aciertos / s.total) * 100) : 0;
            const ok = pct > 0;
            items.push(
              <div key={s.id} style={{ padding: '18px 20px', background: PAPER, border: `1px solid ${LINE}`, textAlign: 'center' }}>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: ok ? (pct >= 70 ? SUCCESS_DK : WARNING_DK) : ERROR_DK }}>
                  {s.aciertos} de {s.total}
                </div>
                {s.label && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, marginTop: 4 }}>
                    {s.label}
                  </div>
                )}
              </div>
            );
          });
          ejercicios.forEach(e => {
            const id = typeof e === 'string' ? e : e.id;
            const label = typeof e === 'string' ? '' : (e.label ?? '');
            const c = completados[id];
            if (!c || typeof c.aciertos === 'number') return;
            items.push(
              <div key={id} style={{ padding: '18px 20px', background: PAPER, border: `1px solid ${LINE}`, textAlign: 'center' }}>
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 36, height: 36, borderRadius: '50%', background: SUCCESS_BG, border: `2px solid ${SUCCESS}`, fontFamily: FONT_SLAB, fontSize: 18, fontWeight: 700, color: SUCCESS_DK }}>✓</span>
                {label && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, marginTop: 8 }}>{label}</div>
                )}
              </div>
            );
          });
          if (items.length === 0) return null;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
              {items}
            </div>
          );
        })()}

        {!hayPendientes && !bloqueado && aprendizajes.length > 0 && (
          <div style={{ padding: '16px 20px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}`, marginBottom: 20, lineHeight: 1.6 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              En este módulo has aprendido
            </div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {aprendizajes.map((a, i) => (
                <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 16, color: NAVY, marginBottom: 6 }}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {!hayPendientes && todosACero && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: ERROR_DK, textAlign: 'center', margin: '0 0 8px', lineHeight: 1.5 }}>
            Necesitas aprobar los cuestionarios para avanzar al siguiente módulo.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 24, marginBottom: 8, flexWrap: 'wrap' }}>
          {bloqueado ? (
            <button type="button" onClick={onVolver} style={{
              fontFamily: FONT_BODY, fontSize: 17, fontWeight: 600, color: NAVY,
              background: BEIGE, border: `1.5px solid ${LINE}`, borderRadius: 0,
              padding: '16px 32px', cursor: 'pointer',
            }}>
              Volver al módulo
            </button>
          ) : (
            <button type="button" onClick={() => onContinuar({ completado: true })} style={{
              fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
            }}>
              Siguiente módulo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReflexionGuiada({ paso, temperamento, onComplete }) {
  const raw = paso.parrafos ?? [];
  const parrafos = raw.reduce((acc, p) => {
    if (p.tipo === 'generico') {
      acc.push(p.texto);
    } else if (p.tipo === 'condicional' && p.variantes) {
      const texto = p.variantes[temperamento?.primary];
      if (texto) acc.push(texto);
    }
    return acc;
  }, []);

  const paginas = parrafos.length <= 2
    ? parrafos.map(t => [t])
    : [[parrafos[0], parrafos[1]], parrafos.slice(2)];

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  function siguiente() {
    setVisible(false);
    setTimeout(() => {
      if (idx < paginas.length - 1) {
        setIdx(idx + 1);
        setVisible(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        onComplete({});
      }
    }, 300);
  }

  if (!paginas.length) {
    onComplete({});
    return null;
  }

  const pag = paginas[idx];
  const esUltima = idx === paginas.length - 1;

  return (
    <Shell titulo="Reflexión" actual={idx + 1} total={paginas.length}>
      <div className="vl-pag" style={tarjeta}>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>
          Reflexión guiada
        </h2>

        <div className="vl-pag-cuerpo" style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {pag.map((texto, i) => (
            <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: 0 }}>
              {texto}
            </p>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
          <button type="button" onClick={siguiente} style={{
            fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0,
            padding: '14px 36px', cursor: 'pointer',
          }}>
            {esUltima ? 'Continuar →' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ─── TEST DE CARÁCTER (E2) — embebido en formación ─── */

const CHAR_VIRTUE_ORDER = ['P', 'C', 'S', 'J', 'M', 'H'];
const CHAR_FACES = { P: faceP, C: faceC, S: faceS, J: faceJ, M: faceM, H: faceH };
const CHAR_COLORS = {
  P: { color: '#5B8C5A' }, C: { color: '#C0392B' }, S: { color: '#2980B9' },
  J: { color: '#8E44AD' }, M: { color: '#D4A017' }, H: { color: '#16A085' },
};

const { order: CHAR_CANONICAL, groups: CHAR_GROUPS } = (() => {
  const groups = Object.fromEntries(CHAR_VIRTUE_ORDER.map(v => [v, []]));
  CHARACTER_TEST.questions.forEach((q, i) => {
    const v = q.code && q.code[0];
    if (groups[v]) groups[v].push(i);
    else groups[CHAR_VIRTUE_ORDER[0]].push(i);
  });
  const order = [];
  for (const v of CHAR_VIRTUE_ORDER) order.push(...groups[v]);
  return { order, groups };
})();

const CHAR_CUMULATIVE = (() => {
  const cum = [];
  let acc = 0;
  for (const v of CHAR_VIRTUE_ORDER) {
    acc += CHAR_GROUPS[v].length;
    cum.push(acc);
  }
  return cum;
})();

function resolveCharSupport(supportObj, key) {
  const entry = supportObj?.[key];
  if (!entry) return '';
  return entry.es || entry.en || '';
}

function CharMilestoneModal({ virtueCode, pct, onContinue }) {
  const face = CHAR_FACES[virtueCode];
  const c = CHAR_COLORS[virtueCode];
  const virtueName = resolveCharSupport(CHARACTER_SUPPORT.labels, `chResult${virtueCode}`);

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(27, 42, 74, 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: PAPER, maxWidth: 440, width: '100%', borderRadius: 4,
        borderTop: `4px solid ${c.color}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        padding: '32px 28px', textAlign: 'center',
      }}>
        <div style={{ ...eyebrow, marginBottom: 4 }}>Virtud completada</div>
        <div style={{
          margin: '4px auto 20px', width: 120, height: 120, borderRadius: '50%',
          border: `3px solid ${c.color}`, overflow: 'hidden', background: BEIGE,
        }}>
          <img src={face} alt={virtueName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h3 style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>
          {virtueName}
        </h3>
        <div style={{ fontFamily: FONT_SLAB, fontSize: 48, fontWeight: 600, color: c.color, lineHeight: 1, margin: '12px 0 20px' }}>
          {Math.round(pct)}%
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.5, margin: '0 0 24px' }}>
          Esta puntuación refleja tu estado actual en esta virtud. Las virtudes se desarrollan con la práctica.
        </p>
        <button onClick={onContinue} style={{
          fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
          background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px',
          cursor: 'pointer', width: '100%',
        }}>
          Continuar
        </button>
      </div>
    </div>
  );
}

function CharResultSummary({ scoreResult, onContinue }) {
  return (
    <div>
      <div style={tarjetaCentrada}>
        <div style={{ textAlign: 'center', padding: '0 0 8px' }}>
          <span style={{
            display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
            background: BEIGE, border: `2px solid ${GOLD_REF}`,
            fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: GOLD_REF_DK,
          }}>&#x2726;</span>
        </div>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '14px 0 8px', textAlign: 'center' }}>
          Tu perfil de carácter
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
          Aquí tienes tu resultado en las seis virtudes del liderazgo. Podrás consultarlo en tu panel.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {CHAR_VIRTUE_ORDER.map(code => {
            const s = scoreResult[code];
            const c = CHAR_COLORS[code];
            const virtueName = resolveCharSupport(CHARACTER_SUPPORT.labels, s.virtue_label_key);
            return (
              <div key={code} style={{
                background: PAPER, border: `1px solid ${LINE}`, borderTop: `3px solid ${c.color}`,
                padding: '18px 14px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 32, fontWeight: 600, color: c.color, lineHeight: 1 }}>
                  {Math.round(s.global ?? 0)}%
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8, fontWeight: 600 }}>
                  {virtueName}
                </div>
              </div>
            );
          })}
        </div>

        {CHAR_VIRTUE_ORDER.map(code => {
          const s = scoreResult[code];
          const c = CHAR_COLORS[code];
          const face = CHAR_FACES[code];
          const virtueName = resolveCharSupport(CHARACTER_SUPPORT.labels, s.virtue_label_key);
          const passiveName = resolveCharSupport(CHARACTER_SUPPORT.labels, s.passive_facet_key);
          const activeName = resolveCharSupport(CHARACTER_SUPPORT.labels, s.active_facet_key);
          return (
            <div key={code} style={{
              background: PAPER, border: `1px solid ${LINE}`, borderLeft: `4px solid ${c.color}`,
              marginBottom: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: `2px solid ${c.color}`, background: BEIGE,
              }}>
                <img src={face} alt={virtueName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: '1 1 140px', minWidth: 120 }}>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY }}>{virtueName}</div>
              </div>
              <div style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 600, color: c.color }}>
                {Math.round(s.global ?? 0)}%
              </div>
              <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: '8px 12px', background: BEIGE }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aspecto pasivo</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, fontWeight: 500 }}>{passiveName} — {Math.round(s.passive ?? 0)}%</div>
                </div>
                <div style={{ padding: '8px 12px', background: BEIGE }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aspecto activo</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, fontWeight: 500 }}>{activeName} — {Math.round(s.active ?? 0)}%</div>
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 0 }}>
          <button type="button" onClick={onContinue} style={{
            fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
          }}>
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}

export function TestCaracterFormacion({ paso, onComplete }) {
  const [fase, setFase] = useState('caratula');
  const [answers, setAnswers] = useState([]);
  const [idx, setIdx] = useState(0);
  const [milestone, setMilestone] = useState(null);

  const scoreResult = useMemo(() => {
    if (fase !== 'resultado') return null;
    const canonical = new Array(CHARACTER_TEST.questions.length).fill(0);
    for (let i = 0; i < CHAR_CANONICAL.length; i++) {
      canonical[CHAR_CANONICAL[i]] = answers[i] ?? 0;
    }
    return scoreCharacter(canonical, CHARACTER_TEST);
  }, [fase, answers]);

  function handleStart() {
    setAnswers([]);
    setIdx(0);
    setMilestone(null);
    setFase('preguntas');
  }

  function handleAnswer(value) {
    const next = [...answers];
    next[idx] = value;
    setAnswers(next);

    const total = CHAR_CANONICAL.length;
    const nextIdx = idx + 1;

    const cutoffIdx = CHAR_CUMULATIVE.indexOf(nextIdx);
    if (cutoffIdx >= 0 && cutoffIdx < CHAR_CUMULATIVE.length - 1) {
      const virtueCode = CHAR_VIRTUE_ORDER[cutoffIdx];
      const canonical = new Array(CHARACTER_TEST.questions.length).fill(0);
      for (let i = 0; i < next.length; i++) {
        canonical[CHAR_CANONICAL[i]] = next[i] ?? 0;
      }
      const res = scoreCharacter(canonical, CHARACTER_TEST);
      const pct = res?.[virtueCode]?.global ?? 0;
      setMilestone({ virtueCode, pct });
      return;
    }

    if (nextIdx < total) {
      setIdx(nextIdx);
    } else {
      setFase('resultado');
      const canonical = new Array(CHARACTER_TEST.questions.length).fill(0);
      for (let i = 0; i < next.length; i++) {
        canonical[CHAR_CANONICAL[i]] = next[i] ?? 0;
      }
      const result = scoreCharacter(canonical, CHARACTER_TEST);
      void saveCharacterResultIfLoggedIn(result);
    }
  }

  function handleMilestoneContinue() {
    setMilestone(null);
    setIdx(idx + 1);
  }

  function handleBack() {
    if (idx > 0 && !milestone) setIdx(idx - 1);
  }

  if (fase === 'caratula') {
    return (
      <Caratula
        paso={{ ...paso, descripcion: paso.descripcion }}
        tipo="test_caracter"
        modulo={null}
        onEmpezar={handleStart}
      />
    );
  }

  if (fase === 'resultado' && scoreResult) {
    return <CharResultSummary scoreResult={scoreResult} onContinue={() => onComplete({ scoreResult })} />;
  }

  const itemIdx = CHAR_CANONICAL[idx];
  const item = CHARACTER_TEST.questions[itemIdx];
  const text = item.text?.es || item.text?.en || '';
  const total = CHAR_CANONICAL.length;
  const pct = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;

  const LIKERT = [
    { key: 'sa', value: 1, label: 'Totalmente de acuerdo' },
    { key: 'a', value: 0.5, label: 'De acuerdo' },
    { key: 'n', value: 0, label: 'Neutral' },
    { key: 'd', value: -0.5, label: 'En desacuerdo' },
    { key: 'sd', value: -1, label: 'Totalmente en desacuerdo' },
  ];

  return (
    <>
      <Shell titulo="Test de carácter" actual={idx + 1} total={total}>
        <div style={tarjeta}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED }}>{idx + 1} de {total}</span>
            <button
              type="button"
              disabled={idx === 0 || !!milestone}
              onClick={handleBack}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
                cursor: idx > 0 && !milestone ? 'pointer' : 'default',
                opacity: idx > 0 && !milestone ? 1 : 0.3,
              }}
            >
              ← Anterior
            </button>
          </div>

          <p style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 500, color: NAVY, margin: '20px 0 24px', lineHeight: 1.45 }}>
            {text}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LIKERT.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleAnswer(opt.value)}
                style={{
                  fontFamily: FONT_BODY, fontSize: 17, lineHeight: 1.5,
                  padding: '16px 20px', border: `1.5px solid ${LINE}`,
                  background: PAPER, color: NAVY, borderRadius: 0,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 160ms ease',
                }}
                onMouseOver={e => { e.currentTarget.style.background = GOLD_REF; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = GOLD_REF; }}
                onMouseOut={e => { e.currentTarget.style.background = PAPER; e.currentTarget.style.color = NAVY; e.currentTarget.style.borderColor = LINE; }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Shell>
      {milestone && (
        <CharMilestoneModal
          virtueCode={milestone.virtueCode}
          pct={milestone.pct}
          onContinue={handleMilestoneContinue}
        />
      )}
    </>
  );
}

export function Sintesis({ paso, temperamento, onComplete, cursoNum = 1, user, borrador, onBorrador }) {
  const map = paso.sintesis?.virtud_desafio_map ?? {};
  const p = temperamento?.primary;
  const s = temperamento?.secondary;
  const perfilSintesis = s ? `${p}-${s}` : p;
  const virtudDesafio = map[perfilSintesis] ?? map[p] ?? '';
  const [datos, setDatos] = useState({
    lo_que_facilita: '',
    lo_que_cuesta: '',
    proposito: '',
  });
  const [faseSintesis, setFaseSintesis] = useState('form');

  const [faseC3, setFaseC3] = useState('reflexion');
  const [pagRefl, setPagRefl] = useState(0);
  const [areaCrecimiento, setAreaCrecimiento] = useState(null);
  const [compromisoTexto, setCompromisoTexto] = useState('');
  useBorrador({
    valor: { datos, areaCrecimiento, compromisoTexto },
    borrador, onBorrador,
    estaVacio: () => !Object.values(datos).some(t => t.trim()) && !areaCrecimiento && !compromisoTexto.trim(),
    hidratar: (b) => {
      if (b.datos) setDatos(prev => ({ ...prev, ...b.datos }));
      // Síntesis ya completada: los campos vienen al primer nivel (no dentro de «datos»).
      else if (['lo_que_facilita', 'lo_que_cuesta', 'proposito'].some(k => typeof b[k] === 'string')) {
        setDatos(prev => ({ ...prev, lo_que_facilita: b.lo_que_facilita ?? prev.lo_que_facilita, lo_que_cuesta: b.lo_que_cuesta ?? prev.lo_que_cuesta, proposito: b.proposito ?? prev.proposito }));
      }
      if (b.areaCrecimiento) setAreaCrecimiento(b.areaCrecimiento);
      if (b.compromisoTexto) setCompromisoTexto(b.compromisoTexto);
    },
  });

  function guardar() {
    onComplete({
      temperamento_primario: temperamento?.primary,
      temperamento_secundario: temperamento?.secondary,
      virtud_desafio: virtudDesafio,
      ...datos,
    });
  }

  const TEMP_NOMBRE_LOCAL = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };

  const [verEjemploC, setVerEjemploC] = useState(false);

  /* ─── Curso 3: cierre con reflexión guiada ─── */
  if (paso.reflexion_cierre) {
    const rc = paso.reflexion_cierre;
    const nombre = user?.user_metadata?.first_name || '';
    const paginas = rc.paginas;
    const totalPags = paginas.length;

    const reemplazaNombre = (txt) => txt.replace(/\{nombre\}/g, nombre);

    const renderElemento = (elem, i) => {
      if (typeof elem === 'string') {
        const txt = reemplazaNombre(elem);
        return (
          <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: '0 0 12px' }}>
            {RenderTextoRico(txt)}
          </p>
        );
      }
      if (elem.lista) {
        return (
          <ul key={i} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: '4px 0 12px', paddingLeft: 28 }}>
            {elem.lista.map((li, j) => <li key={j} style={{ marginBottom: 6 }}>{RenderTextoRico(reemplazaNombre(li))}</li>)}
          </ul>
        );
      }
      if (elem.por_temperamento) {
        const raw = elem.por_temperamento[temperamento?.primary] ?? '';
        const txt = reemplazaNombre(raw);
        const lineas = txt.split('\n').filter(Boolean);
        return (
          <div key={i}>
            {lineas.map((linea, j) => (
              <p key={j} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: '0 0 14px' }}>
                {RenderTextoRico(linea)}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    // Un solo bloque «Reflexión final y tu compromiso»: misma tarjeta y misma altura en todas sus páginas.
    const tarjetaCierre = { ...tarjeta, minHeight: 'clamp(340px, calc(100vh - 440px), 460px)' };
    const h2Cierre = { fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 14px' };

    const btnAtras = (onClick) => (
      <button type="button" onClick={onClick} style={{
        fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
        background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
      }}>
        ← Anterior
      </button>
    );

    const btnSiguiente = (onClick, disabled) => (
      <button type="button" disabled={disabled} onClick={onClick} style={{
        fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
        background: disabled ? LINE : GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px',
        cursor: disabled ? 'default' : 'pointer',
      }}>
        Siguiente →
      </button>
    );

    if (faseC3 === 'reflexion') {
      return (
        <Shell titulo="Reflexión final y tu compromiso" actual={pagRefl + 1} total={totalPags + 2}>
          <div className="vl-pag" style={tarjetaCierre}>
            <h2 style={h2Cierre}>Reflexión final</h2>
            <div className="vl-pag-cuerpo" style={{ display: 'flex', flexDirection: 'column' }}>
              {paginas[pagRefl].map((elem, i) => renderElemento(elem, i))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', justifyContent: pagRefl > 0 ? 'space-between' : 'flex-end', alignItems: 'center' }}>
              {pagRefl > 0 && btnAtras(() => setPagRefl(pagRefl - 1))}
              {btnSiguiente(() => {
                if (pagRefl < totalPags - 1) setPagRefl(pagRefl + 1);
                else setFaseC3('choice');
              })}
            </div>
          </div>
        </Shell>
      );
    }

    if (faseC3 === 'choice') {
      return (
        <Shell titulo="Reflexión final y tu compromiso" actual={totalPags + 1} total={totalPags + 2}>
          <div className="vl-pag" style={tarjetaCierre}>
            <h2 style={h2Cierre}>Tu compromiso</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.6, margin: '0 0 18px' }}>
              {rc.pregunta_choice.enunciado}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rc.pregunta_choice.opciones.map((op) => (
                <button key={op.key} type="button"
                  onClick={() => setAreaCrecimiento(op.key)}
                  style={{
                    fontFamily: FONT_BODY, fontSize: 18, color: areaCrecimiento === op.key ? '#fff' : NAVY,
                    background: areaCrecimiento === op.key ? NAVY : PAPER,
                    border: `1px solid ${areaCrecimiento === op.key ? NAVY : LINE}`,
                    borderRadius: 0, padding: '14px 20px', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 200ms ease',
                  }}>
                  {op.texto}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {btnAtras(() => { setFaseC3('reflexion'); setPagRefl(totalPags - 1); })}
              {btnSiguiente(() => setFaseC3('compromiso'), !areaCrecimiento)}
            </div>
          </div>
        </Shell>
      );
    }

    if (faseC3 === 'compromiso') {
      const promptTexto = rc.pregunta_compromiso[areaCrecimiento] ?? '';
      const ejemploTexto = rc.ejemplo_compromiso?.[areaCrecimiento] ?? '';
      return (
        <Shell titulo="Reflexión final y tu compromiso" actual={totalPags + 2} total={totalPags + 2}>
          <div className="vl-pag" style={tarjetaCierre}>
            <h2 style={h2Cierre}>Tu compromiso</h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.6, margin: '0 0 18px' }}>
              {promptTexto}
            </p>
            <textarea value={compromisoTexto} onChange={(e) => setCompromisoTexto(e.target.value)}
              placeholder="Escribe tu compromiso…"
              style={{
                fontFamily: FONT_BODY, fontSize: 18, padding: '16px 18px', border: `1px solid ${LINE}`,
                borderRadius: 0, outline: 'none', width: '100%', minHeight: 120, resize: 'vertical', background: '#fff',
              }} />
            {ejemploTexto && (
              <div style={{ marginTop: 16 }}>
                <button type="button" onClick={() => setVerEjemploC(!verEjemploC)} style={{
                  fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <IconoLupa />
                  {verEjemploC ? 'Ocultar ejemplo' : 'Ver ejemplo'}
                </button>
                {verEjemploC && (
                  <div style={{
                    marginTop: 10, padding: '14px 18px', background: BEIGE,
                    borderLeft: `3px solid ${GOLD_REF}`, fontSize: 17, fontFamily: FONT_BODY,
                    color: MUTED, lineHeight: 1.6, fontStyle: 'italic',
                  }}>
                    {reemplazaNombre(ejemploTexto)}
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {btnAtras(() => setFaseC3('choice'))}
              {btnSiguiente(() => setFaseC3('felicitacion'), !compromisoTexto.trim())}
            </div>
          </div>
        </Shell>
      );
    }

    return (
      <div>
        <div style={{ ...tarjetaCentrada, textAlign: 'center', alignItems: 'center' }}>
          <div style={{
            display: 'inline-grid', placeItems: 'center', width: 72, height: 72, borderRadius: '50%',
            background: BEIGE, border: `2px solid ${GOLD_REF}`, marginBottom: 20,
          }}>
            <span style={{ fontFamily: FONT_SLAB, fontSize: 32, fontWeight: 700, color: GOLD_REF_DK, lineHeight: 1 }}>&#10003;</span>
          </div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>
            {reemplazaNombre(rc.felicitacion)}
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.6, margin: '0 0 32px' }}>
            Tu reflexión y compromiso han quedado guardados.
          </p>
          <button type="button" onClick={() => onComplete({
            area_crecimiento_humildad: areaCrecimiento,
            compromiso: compromisoTexto,
          })} style={{
            fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
          }}>
            Marcar como completado
          </button>
        </div>
      </div>
    );
  }

  if (faseSintesis === 'felicitacion') {
    return (
      <div>
        <div style={{ ...tarjetaCentrada, textAlign: 'center', alignItems: 'center' }}>
          <div style={{
            display: 'inline-grid', placeItems: 'center', width: 72, height: 72, borderRadius: '50%',
            background: BEIGE, border: `2px solid ${GOLD_REF}`, marginBottom: 20,
          }}>
            <span style={{ fontFamily: FONT_SLAB, fontSize: 32, fontWeight: 700, color: GOLD_REF_DK, lineHeight: 1 }}>&#10003;</span>
          </div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>
            {user?.user_metadata?.first_name
              ? `¡Felicidades, ${user.user_metadata.first_name}!`
              : '¡Felicidades!'}
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.6, margin: '0 0 32px' }}>
            Has completado el Curso {cursoNum}. Tu reflexión y compromiso han quedado guardados.
          </p>
          <button type="button" onClick={guardar} style={{
            fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
          }}>
            Marcar como completado
          </button>
        </div>
      </div>
    );
  }

  const campoLinea = { ...ESTILO_RESPUESTA, minHeight: 0, resize: 'none' };
  const listoSintesis = datos.lo_que_facilita.trim() && datos.lo_que_cuesta.trim() && datos.proposito.trim();
  return (
    <Shell titulo="Mi síntesis" actual={1} total={1}>
      <div className="vl-pag" style={tarjeta}>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 18px' }}>
          Conclusiones del Curso {cursoNum}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 12 }}>
          <FichaTemperamento codigo={temperamento?.primary} etiqueta="Temperamento primario" />
          <FichaTemperamento codigo={temperamento?.secondary} etiqueta="Temperamento secundario" />
        </div>

        <div style={{ padding: '16px 18px', background: `linear-gradient(135deg, ${BEIGE}, rgba(165,139,38,0.08))`, borderLeft: `3px solid ${GOLD_REF}`, marginBottom: 22 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tu virtud-desafío</div>
          <div style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: GOLD_REF_DK, marginTop: 4 }}>
            {virtudDesafio || '—'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={ESTILO_ENUNCIADO}>Lo que mi temperamento me facilita</span>
            <input type="text" value={datos.lo_que_facilita} onChange={(e) => setDatos((d) => ({ ...d, lo_que_facilita: e.target.value }))}
              placeholder="Una frase…" style={campoLinea} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={ESTILO_ENUNCIADO}>Lo que más me cuesta</span>
            <input type="text" value={datos.lo_que_cuesta} onChange={(e) => setDatos((d) => ({ ...d, lo_que_cuesta: e.target.value }))}
              placeholder="Una frase…" style={campoLinea} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={ESTILO_ENUNCIADO}>Mi propósito para las próximas semanas</span>
            <textarea value={datos.proposito} onChange={(e) => setDatos((d) => ({ ...d, proposito: e.target.value }))}
              placeholder="Reflexiona…" style={{ ...ESTILO_RESPUESTA, minHeight: 100 }} />
          </label>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setFaseSintesis('felicitacion')} disabled={!listoSintesis}
            style={{ ...ESTILO_BTN_SIG, background: listoSintesis ? GOLD_REF : LINE, cursor: listoSintesis ? 'pointer' : 'default' }}>
            Siguiente →
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ─── TEST DEL CORAZÓN (inline en formación, curso 5) ─── */

const HEART_FACES = { R: heartFaceR, VR: heartFaceVR, VM: heartFaceVM, VI: heartFaceVI, VC: heartFaceVC, SV: heartFaceSV, SI: heartFaceSI, SC: heartFaceSC };
const HEART_STAGE_COLORS = { none: SUCCESS, stage1: WARNING, stage2: ERROR };
const HEART_STAGE_LABELS = { none: 'Sin inclinación', stage1: 'Cierta inclinación', stage2: 'Fuerte inclinación' };

function resolveHeartLabel(key) {
  const entry = HEART_SUPPORT?.labels?.[key];
  if (!entry) return '';
  return entry.es || entry.en || '';
}

function HeartMilestoneModal({ disorderCode, pct, onContinue }) {
  const face = HEART_FACES[disorderCode];
  const name = resolveHeartLabel(`hResult${disorderCode}`);
  const stageColor = pct >= 66 ? HEART_STAGE_COLORS.stage2 : pct >= 33 ? HEART_STAGE_COLORS.stage1 : HEART_STAGE_COLORS.none;

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(27, 42, 74, 0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: PAPER, maxWidth: 440, width: '100%', borderRadius: 4,
        borderTop: `4px solid ${stageColor}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        padding: '32px 28px', textAlign: 'center',
      }}>
        <div style={{ ...eyebrow, marginBottom: 4 }}>Bloque completado</div>
        <div style={{
          margin: '4px auto 20px', width: 120, height: 120, borderRadius: '50%',
          border: `3px solid ${stageColor}`, overflow: 'hidden', background: BEIGE,
        }}>
          <img src={face} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h3 style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>
          {name}
        </h3>
        <div style={{ fontFamily: FONT_SLAB, fontSize: 48, fontWeight: 600, color: stageColor, lineHeight: 1, margin: '12px 0 20px' }}>
          {Math.round(pct)}%
        </div>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.5, margin: '0 0 24px' }}>
          Al finalizar el test podrás ver el diagnóstico y remedio de cada enfermedad.
        </p>
        <button type="button" onClick={onContinue} style={{
          fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
          background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px',
          cursor: 'pointer', width: '100%',
        }}>
          Continuar
        </button>
      </div>
    </div>
  );
}

function HeartResultSummary({ scoreResult, onContinue }) {
  const balanced = scoreResult.verdict === 'balanced';

  return (
    <div>
      <div style={tarjetaCentrada}>
        <div style={{ textAlign: 'center', padding: '0 0 8px' }}>
          <span style={{
            display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
            background: balanced ? SUCCESS_BG : BEIGE, border: `2px solid ${balanced ? SUCCESS : GOLD_REF}`,
            fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: balanced ? SUCCESS_DK : GOLD_REF_DK,
          }}>♡</span>
        </div>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '14px 0 8px', textAlign: 'center' }}>
          {balanced ? 'Corazón equilibrado' : 'Tu perfil del corazón'}
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
          {balanced
            ? 'No se detectan inclinaciones marcadas hacia ninguna enfermedad espiritual. Podrás consultarlo en tu panel.'
            : 'Aquí tienes tu resultado en las ocho enfermedades espirituales. Podrás consultarlo en tu panel.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {HEART_DISORDER_CODES.map(code => {
            const d = scoreResult.disorders[code];
            const stageColor = HEART_STAGE_COLORS[d.stage];
            const name = resolveHeartLabel(d.label_key);
            return (
              <div key={code} style={{
                background: PAPER, border: `1px solid ${LINE}`, borderTop: `3px solid ${stageColor}`,
                padding: '18px 14px', textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 10px',
                  border: `2px solid ${stageColor}`, background: BEIGE,
                }}>
                  <img src={HEART_FACES[code]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 600, color: stageColor, lineHeight: 1 }}>
                  {Math.round(d.pct)}%
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 8, fontWeight: 600 }}>
                  {name}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, marginTop: 4 }}>
                  {HEART_STAGE_LABELS[d.stage]}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 0 }}>
          <button type="button" onClick={onContinue} style={{
            fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
          }}>
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}

// El Test del corazón se hace en la página pública del test (con los datos de la cuenta ya rellenos).
// Al volver aquí, se lee el último resultado guardado en test_results y se usa en «Mis objetivos prácticos».
function resultadoCorazonGuardado(result) {
  if (!result || typeof result !== 'object') return null;
  const disorders = {};
  for (const d of HEART_TEST.disorders) {
    const r = result[d.code];
    if (!r) return null;
    disorders[d.code] = { ...r, label_key: d.label_key };
  }
  return { disorders, verdict: result.verdict };
}

export function TestCorazonEnlace({ paso, onComplete }) {
  const [estado, setEstado] = useState({ cargando: true, resultado: null, fecha: null });
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { data } = await supabase.from('test_results').select('result, taken_at')
          .eq('kind', 'heart').order('taken_at', { ascending: false }).limit(1).maybeSingle();
        if (vivo) setEstado({ cargando: false, resultado: resultadoCorazonGuardado(data?.result), fecha: data?.taken_at ?? null });
      } catch {
        if (vivo) setEstado({ cargando: false, resultado: null, fecha: null });
      }
    })();
    return () => { vivo = false; };
  }, []);

  function irAlTest() {
    const lang = (window.__vlRuta().split('/')[1]) || 'es';
    const volver = `${window.__vlRuta()}#${paso.id}`;
    window.__vlAbrirWeb(`/${lang}/tests/corazon-libre?volver=${encodeURIComponent(volver)}`);
  }

  if (estado.cargando) return null;

  if (estado.resultado) {
    const fecha = estado.fecha ? new Date(estado.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    return (
      <div>
        <HeartResultSummary scoreResult={estado.resultado} onContinue={() => onComplete({ scoreResult: estado.resultado })} />
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, textAlign: 'center', margin: '14px 0 0' }}>
          {fecha ? `Resultado del ${fecha}. ` : ''}
          <button type="button" onClick={irAlTest} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600,
            color: GOLD_REF_DK, textDecoration: 'underline', textUnderlineOffset: 3,
          }}>Repetir el test</button>
        </p>
      </div>
    );
  }

  return <Caratula paso={paso} tipo="test_corazon" onEmpezar={irAlTest} />;
}

export function TestCorazonFormacion({ paso, onComplete }) {
  const [fase, setFase] = useState('caratula');
  const [answers, setAnswers] = useState([]);
  const [idx, setIdx] = useState(0);
  const [milestone, setMilestone] = useState(null);

  const questions = HEART_TEST.questions;
  const total = questions.length;

  const scoreResult = useMemo(() => {
    if (fase !== 'resultado') return null;
    return scoreHeart(answers, HEART_TEST);
  }, [fase, answers]);

  function handleStart() {
    setAnswers([]);
    setIdx(0);
    setMilestone(null);
    setFase('preguntas');
  }

  function handleAnswer(value) {
    const next = [...answers];
    next[idx] = value;
    setAnswers(next);

    const nextIdx = idx + 1;

    if (nextIdx % 4 === 0 && nextIdx < total) {
      const disorderIdx = Math.floor(idx / 4);
      const disorder = HEART_TEST.disorders[disorderIdx];
      if (disorder) {
        let score = 0;
        for (let i = disorderIdx * 4; i < disorderIdx * 4 + 4; i++) {
          score += next[i] ?? 0;
        }
        const pct = Math.round((score / 16) * 100);
        setMilestone({ disorderCode: disorder.code, pct });
        return;
      }
    }

    if (nextIdx < total) {
      setIdx(nextIdx);
    } else {
      setFase('resultado');
      const result = scoreHeart(next, HEART_TEST);
      void saveHeartResultIfLoggedIn(result);
    }
  }

  function handleMilestoneContinue() {
    setMilestone(null);
    const nextIdx = idx + 1;
    if (nextIdx < total) {
      setIdx(nextIdx);
    } else {
      const result = scoreHeart(answers, HEART_TEST);
      void saveHeartResultIfLoggedIn(result);
      setFase('resultado');
    }
  }

  function handleBack() {
    if (idx > 0 && !milestone) setIdx(idx - 1);
  }

  if (fase === 'caratula') {
    return (
      <Caratula
        paso={{ ...paso, descripcion: paso.descripcion }}
        tipo="test_corazon"
        modulo={null}
        onEmpezar={handleStart}
      />
    );
  }

  if (fase === 'resultado' && scoreResult) {
    return <HeartResultSummary scoreResult={scoreResult} onContinue={() => onComplete({ scoreResult })} />;
  }

  const item = questions[idx];
  const text = item.text?.es || item.text?.en || '';

  const LIKERT = [
    { key: 'sa', value: 4, label: 'Totalmente de acuerdo' },
    { key: 'a', value: 3, label: 'De acuerdo' },
    { key: 'n', value: 2, label: 'Neutral' },
    { key: 'd', value: 1, label: 'En desacuerdo' },
    { key: 'sd', value: 0, label: 'Totalmente en desacuerdo' },
  ];

  return (
    <>
      <Shell titulo="Test del corazón" actual={idx + 1} total={total}>
        <div style={tarjeta}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED }}>{idx + 1} de {total}</span>
            <button
              type="button"
              disabled={idx === 0 || !!milestone}
              onClick={handleBack}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: GOLD_REF_DK,
                cursor: idx > 0 && !milestone ? 'pointer' : 'default',
                opacity: idx > 0 && !milestone ? 1 : 0.3,
              }}
            >
              ← Anterior
            </button>
          </div>

          <p style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 500, color: NAVY, margin: '20px 0 24px', lineHeight: 1.45 }}>
            {text}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LIKERT.map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleAnswer(opt.value)}
                style={{
                  fontFamily: FONT_BODY, fontSize: 17, lineHeight: 1.5,
                  padding: '16px 20px', border: `1.5px solid ${LINE}`,
                  background: PAPER, color: NAVY, borderRadius: 0,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 160ms ease',
                }}
                onMouseOver={e => { e.currentTarget.style.background = GOLD_REF; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = GOLD_REF; }}
                onMouseOut={e => { e.currentTarget.style.background = PAPER; e.currentTarget.style.color = NAVY; e.currentTarget.style.borderColor = LINE; }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Shell>
      {milestone && (
        <HeartMilestoneModal
          disorderCode={milestone.disorderCode}
          pct={milestone.pct}
          onContinue={handleMilestoneContinue}
        />
      )}
    </>
  );
}

/* ─── PLAN DE CRECIMIENTO EN MAGNANIMIDAD ─── */

const IconoEnlace = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconoMas = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconoBorrar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function renderTextoFormateado(texto) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function RecursoLink({ recurso }) {
  if (!recurso) return null;
  return (
    <div style={{ marginTop: 8, marginBottom: 14 }}>
      <a href={recurso.url} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
        textDecoration: 'underline', textUnderlineOffset: 3,
      }}>
        <IconoLupa /> {recurso.label}
      </a>
    </div>
  );
}

export function PantallaTablaDinamica({ pantalla, datos, onChange }) {
  const filas = datos ?? [];
  const cols = pantalla.columnas ?? [];
  function addRow() { onChange([...filas, Object.fromEntries(cols.map(c => [c.key, '']))]); }
  function updateCell(i, key, val) {
    const next = filas.map((f, j) => j === i ? { ...f, [key]: val } : f);
    onChange(next);
  }
  function removeRow(i) { onChange(filas.filter((_, j) => j !== i)); }

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        {pantalla.explicacion.split('\n\n').map((p, i) => (
          <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: i === 0 ? '0 0 8px' : '8px 0 0' }}>
            {renderTextoFormateado(p)}
          </p>
        ))}
      </div>
      <RecursoLink recurso={pantalla.recurso} />
      {filas.map((fila, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
          {cols.map(col => (
            <div key={col.key} style={{ flex: 1, minWidth: 0 }}>
              {i === 0 && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col.label}</div>}
              <input type="text" value={fila[col.key] ?? ''} onChange={e => updateCell(i, col.key, e.target.value)}
                placeholder={col.placeholder} style={{
                  width: '100%', boxSizing: 'border-box', fontFamily: FONT_BODY, fontSize: 18, color: NAVY,
                  border: `1px solid ${LINE}`, background: '#fff', padding: '10px 12px', borderRadius: 0,
                }} />
            </div>
          ))}
          <button type="button" onClick={() => removeRow(i)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 6, marginTop: i === 0 ? 20 : 0,
          }} aria-label="Eliminar"><IconoBorrar /></button>
        </div>
      ))}
      <button type="button" onClick={addRow} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
        background: 'none', border: `1px dashed ${GOLD_REF}`, padding: '10px 18px', cursor: 'pointer', borderRadius: 0,
      }}>
        <IconoMas /> Añadir persona
      </button>
    </>
  );
}

export function PantallaChecklist({ pantalla, datos, onChange }) {
  const items = datos ?? [];
  function addItem() { onChange([...items, '']); }
  function updateItem(i, val) { onChange(items.map((it, j) => j === i ? val : it)); }
  function removeItem(i) { onChange(items.filter((_, j) => j !== i)); }

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        {pantalla.explicacion.split('\n\n').map((p, i) => (
          <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: i === 0 ? '0 0 8px' : '8px 0 0' }}>
            {renderTextoFormateado(p)}
          </p>
        ))}
      </div>
      <RecursoLink recurso={pantalla.recurso} />
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 18, color: MUTED, width: 20, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</span>
          <input type="text" value={item} onChange={e => updateItem(i, e.target.value)}
            placeholder={pantalla.placeholder} style={{
              flex: 1, fontFamily: FONT_BODY, fontSize: 18, color: NAVY,
              border: `1px solid ${LINE}`, background: '#fff', padding: '10px 12px', borderRadius: 0,
            }} />
          <button type="button" onClick={() => removeItem(i)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 6,
          }} aria-label="Eliminar"><IconoBorrar /></button>
        </div>
      ))}
      <button type="button" onClick={addItem} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
        background: 'none', border: `1px dashed ${GOLD_REF}`, padding: '10px 18px', cursor: 'pointer', borderRadius: 0,
      }}>
        <IconoMas /> {pantalla.boton_anadir ?? 'Añadir elemento'}
      </button>
    </>
  );
}

export function PantallaChecklistCategorias({ pantalla, datos, onChange }) {
  const items = datos ?? [];
  const cats = pantalla.categorias ?? [];
  function addItem() { onChange([...items, { text: '', categoria: cats[0] || '' }]); }
  function updateItem(i, field, val) {
    onChange(items.map((it, j) => j === i ? { ...it, [field]: val } : it));
  }
  function removeItem(i) { onChange(items.filter((_, j) => j !== i)); }

  return (
    <>
      <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: '0 0 18px' }}>
        {pantalla.explicacion}
      </p>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={item.categoria || cats[0] || ''} onChange={e => updateItem(i, 'categoria', e.target.value)}
            style={{
              fontFamily: FONT_BODY, fontSize: 14, color: GOLD_REF_DK, fontWeight: 600,
              border: `1px solid ${GOLD_REF}`, background: BEIGE, padding: '8px 10px', borderRadius: 0,
              textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
              appearance: 'auto',
            }}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" value={item.text || ''} onChange={e => updateItem(i, 'text', e.target.value)}
            placeholder={pantalla.placeholder} style={{
              flex: 1, minWidth: 150, fontFamily: FONT_BODY, fontSize: 18, color: NAVY,
              border: `1px solid ${LINE}`, background: '#fff', padding: '10px 12px', borderRadius: 0,
            }} />
          <button type="button" onClick={() => removeItem(i)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 6,
          }} aria-label="Eliminar"><IconoBorrar /></button>
        </div>
      ))}
      <button type="button" onClick={addItem} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
        background: 'none', border: `1px dashed ${GOLD_REF}`, padding: '10px 18px', cursor: 'pointer', borderRadius: 0,
      }}>
        <IconoMas /> Añadir objetivo
      </button>
    </>
  );
}

export function PantallaReflexionDoble({ pantalla, datos, onChange }) {
  const vals = datos ?? {};
  return (
    <>
      <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: '0 0 18px' }}>
        {pantalla.explicacion}
      </p>
      {(pantalla.preguntas ?? []).map(preg => (
        <div key={preg.key} style={{ marginBottom: 18 }}>
          <label style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY, display: 'block', marginBottom: 6 }}>
            {preg.label}
          </label>
          <textarea value={vals[preg.key] ?? ''} onChange={e => onChange({ ...vals, [preg.key]: e.target.value })}
            placeholder={preg.placeholder} rows={4} style={{
              width: '100%', boxSizing: 'border-box', fontFamily: FONT_BODY, fontSize: 18, color: NAVY,
              border: `1px solid ${LINE}`, background: '#fff', padding: '12px', borderRadius: 0, resize: 'vertical',
            }} />
        </div>
      ))}
    </>
  );
}

function EjemploSlider({ slides }) {
  const [idx, setIdx] = useState(0);
  if (!slides.length) return null;
  const cur = slides[idx];
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {slides.length > 1 && (
          <button type="button" onClick={() => setIdx(i => (i - 1 + slides.length) % slides.length)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: MUTED, fontSize: 22, lineHeight: 1, flexShrink: 0 }}
            aria-label="Anterior">{'‹'}</button>
        )}
        <div style={{ flex: 1, background: BEIGE, padding: '14px 18px', borderLeft: `3px solid ${cur.border}` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Ejemplo — {cur.label}
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: NAVY, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            {cur.text}
          </p>
        </div>
        {slides.length > 1 && (
          <button type="button" onClick={() => setIdx(i => (i + 1) % slides.length)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: MUTED, fontSize: 22, lineHeight: 1, flexShrink: 0 }}
            aria-label="Siguiente">{'›'}</button>
        )}
      </div>
      {slides.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {slides.map((_, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              style={{
                width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                background: i === idx ? GOLD_REF : LINE,
              }} aria-label={`Ejemplo ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PantallaReflexionTemperamento({ pantalla, temperamento, datos, onChange }) {
  const vals = datos ?? {};
  const primary = temperamento?.primary;
  const secondary = temperamento?.secondary;
  const TEMP_LABELS = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };
  const debilidadPri = primary && pantalla.debilidades?.[primary];
  const debilidadSec = secondary && pantalla.debilidades?.[secondary];

  return (
    <>
      {(primary || secondary) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          {primary && (
            <div style={{ padding: '8px 14px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}`, flex: '1 1 auto', minWidth: 120 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primario</div>
              <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, marginTop: 2 }}>{TEMP_LABELS[primary] || primary}</div>
            </div>
          )}
          {secondary && (
            <div style={{ padding: '8px 14px', background: BEIGE, borderLeft: `3px solid ${LINE}`, flex: '1 1 auto', minWidth: 120 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secundario</div>
              <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, marginTop: 2 }}>{TEMP_LABELS[secondary] || secondary}</div>
            </div>
          )}
        </div>
      )}
      <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: '0 0 14px' }}>
        {pantalla.explicacion}
      </p>
      <EjemploSlider slides={[
        debilidadPri && { label: TEMP_LABELS[primary] || primary, text: debilidadPri, border: GOLD_REF },
        debilidadSec && { label: TEMP_LABELS[secondary] || secondary, text: debilidadSec, border: LINE },
      ].filter(Boolean)} />
      <label style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY, display: 'block', marginBottom: 6 }}>
        {pantalla.pregunta_refuerzo}
      </label>
      <textarea value={vals.refuerzo ?? ''} onChange={e => onChange({ ...vals, refuerzo: e.target.value })}
        placeholder="Escribe los puntos que más necesitas trabajar..." rows={4} style={{
          width: '100%', boxSizing: 'border-box', fontFamily: FONT_BODY, fontSize: 18, color: NAVY,
          border: `1px solid ${LINE}`, background: '#fff', padding: '12px', borderRadius: 0, resize: 'vertical',
        }} />
    </>
  );
}

export function PantallaProposito({ pantalla, datos, onChange }) {
  return (
    <>
      <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: '0 0 18px' }}>
        {pantalla.explicacion}
      </p>
      <textarea value={datos ?? ''} onChange={e => onChange(e.target.value)}
        placeholder={pantalla.placeholder} rows={6} style={{
          width: '100%', boxSizing: 'border-box', fontFamily: FONT_BODY, fontSize: 18, color: NAVY,
          border: `1px solid ${LINE}`, background: '#fff', padding: '16px', borderRadius: 0, resize: 'vertical',
          lineHeight: 1.7,
        }} />
      {pantalla.ejemplo && (
        <div style={{ marginTop: 14, padding: '12px 16px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Ejemplo
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: NAVY, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            {pantalla.ejemplo}
          </p>
        </div>
      )}
    </>
  );
}

function IconoLapiz() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 3.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function tieneContenido(dato) {
  if (!dato) return false;
  if (Array.isArray(dato)) return dato.some(d => typeof d === 'string' ? d : d?.nombre || d?.text);
  if (typeof dato === 'object') return Object.values(dato).some(v => v);
  if (typeof dato === 'string') return dato.trim().length > 0;
  return false;
}

export function PantallaResumen({ paso, plan, onEditar }) {
  const pantallas = paso.pantallas ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: NAVY, lineHeight: 1.6, margin: 0 }}>
        Este es el resumen de tu Plan de Crecimiento en Magnanimidad. Revisa que refleja tus intenciones para este año.
      </p>
      {pantallas.filter(p => p.tipo !== 'texto' && p.tipo !== 'resumen').map((pant) => {
        const dato = plan[pant.id];
        const vacio = !tieneContenido(dato);
        const pantIdx = pantallas.indexOf(pant);
        return (
          <div key={pant.id} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>
                {pant.titulo}
              </h3>
              {onEditar && (
                <button type="button" onClick={() => onEditar(pantIdx)} title="Editar" style={{
                  background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: MUTED, flexShrink: 0,
                }}>
                  <IconoLapiz />
                </button>
              )}
            </div>
            {vacio ? (
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                Sin completar
              </p>
            ) : (
              <>
                {pant.tipo === 'tabla_dinamica' && Array.isArray(dato) && (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {dato.filter(f => f.nombre).map((f, i) => (
                      <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.6, marginBottom: 4 }}>
                        <strong>{f.nombre}</strong>{f.motivo ? ` — ${f.motivo}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {pant.tipo === 'checklist' && Array.isArray(dato) && (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {dato.filter(Boolean).map((item, i) => (
                      <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.6, marginBottom: 4 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {pant.tipo === 'checklist_categorias' && Array.isArray(dato) && (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {dato.filter(d => d.text).map((item, i) => (
                      <li key={i} style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.6, marginBottom: 4 }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD_REF_DK, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 6 }}>{item.categoria}</span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )}
                {pant.tipo === 'reflexion_doble' && typeof dato === 'object' && (
                  <div>
                    {Object.entries(dato).filter(([, v]) => v).map(([k, v]) => (
                      <p key={k} style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.6, margin: '0 0 4px' }}>{v}</p>
                    ))}
                  </div>
                )}
                {pant.tipo === 'reflexion_temperamento' && typeof dato === 'object' && dato.refuerzo && (
                  <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.6, margin: 0 }}>{dato.refuerzo}</p>
                )}
                {pant.tipo === 'proposito' && typeof dato === 'string' && (
                  <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>{dato}</p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

const PLAN_STORAGE_KEY = (userId) => `vl-plan:${userId}`;

export function leerPlan(userId) {
  try { return JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY(userId))) ?? {}; } catch { return {}; }
}
export function guardarPlan(userId, data) {
  try { localStorage.setItem(PLAN_STORAGE_KEY(userId), JSON.stringify(data)); } catch {}
}

export function PlanCrecimiento({ paso, temperamento, onComplete, userId: userIdProp, guardado, user, cursoNum = 2 }) {
  const userId = userIdProp ?? 'anon';
  const pantallas = paso.pantallas ?? [];
  // Plan ya completado: se abre directamente en el resumen con sus respuestas (no en la carátula).
  const iResumen = pantallas.findIndex((s) => s.tipo === 'resumen');
  const yaHecho = iResumen >= 0 && Boolean(guardado?.plan && Object.keys(guardado.plan).length > 0);
  const [idx, setIdx] = useState(yaHecho ? iResumen : 0);
  const [fase, setFase] = useState(yaHecho ? 'ejercicio' : 'caratula');
  const [visible, setVisible] = useState(true);
  const [plan, setPlan] = useState(() => {
    if (guardado && typeof guardado === 'object') {
      // onComplete guarda { plan }; las pantallas leen las claves sueltas (personas, libros…).
      const { fecha, aprobado, plan: anidado, ...sueltas } = guardado;
      const rest = anidado && typeof anidado === 'object' ? { ...sueltas, ...anidado } : sueltas;
      if (Object.keys(rest).length > 0) {
        guardarPlan(userId, rest);
        return rest;
      }
    }
    let data = leerPlan(userId);
    if (userId !== 'anon' && (!data || Object.keys(data).length === 0)) {
      const legacy = leerPlan('anon');
      if (legacy && Object.keys(legacy).length > 0) {
        guardarPlan(userId, legacy);
        data = legacy;
      }
    }
    return data;
  });
  const guardarCb = useCallback((d) => guardarPlan(userId, d), [userId]);
  const guardados = useAutoguardado(guardarCb, plan);

  function actualizarPantalla(pantallaId, valor) {
    const next = { ...plan, [pantallaId]: valor };
    setPlan(next);
  }

  function siguiente() {
    guardarPlan(userId, plan);
    setVisible(false);
    setTimeout(() => {
      if (idx < pantallas.length - 1) {
        setIdx(idx + 1);
        setVisible(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFase('felicitacion');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 300);
  }

  function anterior() {
    if (idx > 0) {
      setVisible(false);
      setTimeout(() => { setIdx(idx - 1); setVisible(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 300);
    }
  }

  if (fase === 'felicitacion') {
    const nombre = user?.user_metadata?.first_name || '';
    return (
      <div>
        <div style={{ ...tarjetaCentrada, textAlign: 'center', alignItems: 'center' }}>
          <div style={{
            display: 'inline-grid', placeItems: 'center', width: 72, height: 72, borderRadius: '50%',
            background: BEIGE, border: `2px solid ${GOLD_REF}`, marginBottom: 20,
          }}>
            <span style={{ fontFamily: FONT_SLAB, fontSize: 32, fontWeight: 700, color: GOLD_REF_DK, lineHeight: 1 }}>&#10003;</span>
          </div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: '0 0 12px' }}>
            {nombre ? `¡Felicidades, ${nombre}!` : '¡Felicidades!'}
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.6, margin: '0 0 32px' }}>
            Has completado el Curso {cursoNum}. Tu plan de crecimiento ha quedado guardado.
          </p>
          <button type="button" onClick={() => onComplete({ plan })} style={{
            fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 40px', cursor: 'pointer',
          }}>
            Marcar como completado
          </button>
        </div>
      </div>
    );
  }

  if (fase === 'caratula') {
    return (
      <div>
        <div style={tarjetaCentrada}>
          <div style={{ textAlign: 'center', padding: '0 0 10px' }}>
            <span style={{
              display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
              background: BEIGE, border: `2px solid ${GOLD_REF}`,
              fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: GOLD_REF_DK,
            }}>✦</span>
          </div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: '12px 0 14px', textAlign: 'center', lineHeight: 1.3, textWrap: 'balance' }}>
            Desarrolla tu Plan de Crecimiento en Magnanimidad
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.7, textAlign: 'center', maxWidth: 560, margin: '0 auto 12px', textWrap: 'pretty' }}>
            {paso.descripcion}
          </p>
          {paso.nota_anual && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: GOLD_REF_DK, lineHeight: 1.6, textAlign: 'center', maxWidth: 480, margin: '0 auto 8px', fontStyle: 'italic' }}>
              {paso.nota_anual}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28, marginBottom: 0 }}>
            <button type="button" onClick={() => setFase('ejercicio')} style={{
              fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
            }}>
              Empezar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pant = pantallas[idx];
  if (!pant) { onComplete({ plan }); return null; }

  let contenido = null;
  if (pant.tipo === 'texto') {
    contenido = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {pant.contenido.split('\n\n').map((parrafo, i) => (
          <p key={i} style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: 0, textWrap: 'pretty' }}>
            {renderTextoFormateado(parrafo)}
          </p>
        ))}
      </div>
    );
  } else if (pant.tipo === 'tabla_dinamica') {
    contenido = <PantallaTablaDinamica pantalla={pant} datos={plan[pant.id]} onChange={v => actualizarPantalla(pant.id, v)} />;
  } else if (pant.tipo === 'checklist') {
    contenido = <PantallaChecklist pantalla={pant} datos={plan[pant.id]} onChange={v => actualizarPantalla(pant.id, v)} />;
  } else if (pant.tipo === 'reflexion_doble') {
    contenido = <PantallaReflexionDoble pantalla={pant} datos={plan[pant.id]} onChange={v => actualizarPantalla(pant.id, v)} />;
  } else if (pant.tipo === 'reflexion_temperamento') {
    contenido = <PantallaReflexionTemperamento pantalla={pant} temperamento={temperamento} datos={plan[pant.id]} onChange={v => actualizarPantalla(pant.id, v)} />;
  } else if (pant.tipo === 'proposito') {
    contenido = <PantallaProposito pantalla={pant} datos={plan[pant.id]} onChange={v => actualizarPantalla(pant.id, v)} />;
  } else if (pant.tipo === 'checklist_categorias') {
    contenido = <PantallaChecklistCategorias pantalla={pant} datos={plan[pant.id]} onChange={v => actualizarPantalla(pant.id, v)} />;
  } else if (pant.tipo === 'resumen') {
    contenido = <PantallaResumen paso={paso} plan={plan} onEditar={(pantIdx) => { setIdx(pantIdx); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />;
  }

  const esUltima = idx === pantallas.length - 1;

  return (
    <Shell titulo="Plan de crecimiento" actual={idx + 1} total={pantallas.length}>
      <div className="vl-pag" style={{ ...tarjeta, minHeight: 'clamp(340px, calc(100vh - 400px), 470px)' }}>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 12px', textWrap: 'balance' }}>
          {pant.titulo}
        </h2>

        <div className="vl-pag-cuerpo" style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          padding: pant.tipo === 'texto' ? 0 : '12px 0 24px',
          display: pant.tipo === 'texto' ? 'flex' : 'block', flexDirection: 'column',
        }}>
          {contenido}
        </div>

        {pant.tipo !== 'texto' && pant.tipo !== 'resumen' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 20, marginTop: 4 }}>
            <CheckGuardado campo={pant.id} guardados={guardados} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: pant.tipo === 'texto' ? 32 : 12 }}>
          {idx > 0 ? (
            <button type="button" onClick={anterior} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
              background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0,
              padding: '14px 36px', cursor: 'pointer',
            }}>
              ← Anterior
            </button>
          ) : <span />}
          <button type="button" onClick={siguiente} style={{
            fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', borderRadius: 0,
            padding: '14px 36px', cursor: 'pointer',
          }}>
            {esUltima ? 'Finalizar plan →' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ─── PROYECTO MISIÓN (Curso 6) ─── */

const PROY_KEY = (pasoId) => `vl-proyecto-mision:${pasoId}`;

function leerProyecto(pasoId, secciones) {
  const vacio = {};
  for (const sec of secciones) vacio[sec.id] = Array(sec.preguntas.length).fill('');
  try {
    const d = JSON.parse(localStorage.getItem(PROY_KEY(pasoId)));
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      for (const sec of secciones) {
        if (!Array.isArray(d[sec.id]) || d[sec.id].length !== sec.preguntas.length) {
          d[sec.id] = vacio[sec.id];
        }
      }
      return d;
    }
  } catch {}
  return vacio;
}

function contarPalabras(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function ProyectoMision({ paso, onComplete, temperamento, completados, guardado, volver }) {
  const secciones = paso.secciones ?? [];

  const yaCompletado = Boolean(guardado?.completado);

  const [fase, setFase] = useState(() => {
    if (yaCompletado) return 'indice';
    return 'caratula';
  });
  const [pos, setPos] = useState(0);
  const [ejemploAbierto, setEjemploAbierto] = useState({});
  const [lbProy, setLbProy] = useState(null);
  // Respuestas del Curso 2 para el recuerdo: el progreso que llega aquí es solo el de este curso.
  const [respOrigen, setRespOrigen] = useState(null);
  useEffect(() => {
    const origen = paso.recuerdo_curso2?.paso;
    if (!origen || completados?.[origen] || !supabase) return;
    let vivo = true;
    supabase.from('respuestas').select('respuesta').eq('contenido_id', origen).eq('completado', true).limit(1).maybeSingle()
      .then(({ data }) => { if (vivo && data?.respuesta) setRespOrigen(data.respuesta); });
    return () => { vivo = false; };
  }, [paso.recuerdo_curso2?.paso]); // eslint-disable-line react-hooks/exhaustive-deps

  const [respuestas, setRespuestas] = useState(() => {
    if (guardado?.respuestas && typeof guardado.respuestas === 'object') {
      const r = { ...guardado.respuestas };
      for (const sec of secciones) {
        if (!Array.isArray(r[sec.id]) || r[sec.id].length !== sec.preguntas.length) {
          r[sec.id] = Array(sec.preguntas.length).fill('');
        }
      }
      return r;
    }
    return leerProyecto(paso.id, secciones);
  });

  const guardarLocalCb = useCallback((d) => {
    try { localStorage.setItem(PROY_KEY(paso.id), JSON.stringify(d)); } catch {}
  }, [paso.id]);
  const guardados = useAutoguardado(guardarLocalCb, respuestas);

  const guardarSupabaseRef = useRef(null);
  guardarSupabaseRef.current = () => {
    onComplete({ respuestas, completado: yaCompletado }, { avanzar: false });
  };

  useEffect(() => {
    if (fase === 'caratula') {
      const hayDatos = secciones.some(s => respuestas[s.id]?.some(r => r && r.trim()));
      if (hayDatos) {
        const primera = primeraObligatoriaVacia();
        if (primera) {
          setPos(posDe(primera.secIdx, primera.pregIdx));
          setFase('flujo');
        } else {
          setFase('cierre');
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function primeraObligatoriaVacia() {
    for (let si = 0; si < secciones.length; si++) {
      for (let pi = 0; pi < secciones[si].preguntas.length; pi++) {
        if (secciones[si].preguntas[pi].obligatoria && !(respuestas[secciones[si].id]?.[pi]?.trim())) {
          return { secIdx: si, pregIdx: pi };
        }
      }
    }
    return null;
  }

  function todasObligatoriasLlenas() {
    for (const sec of secciones) {
      for (let pi = 0; pi < sec.preguntas.length; pi++) {
        if (sec.preguntas[pi].obligatoria && !(respuestas[sec.id]?.[pi]?.trim())) return false;
      }
    }
    return true;
  }

  function guardarYSalir() {
    onComplete({ respuestas, completado: yaCompletado }, { avanzar: false });
    volver();
  }

  function guardarAlCambiarSeccion() {
    onComplete({ respuestas, completado: yaCompletado }, { avanzar: false });
  }

  const tempPrimario = temperamento?.primary;

  // Recorrido único: lecturas de cada sección, recuerdo del Curso 2 (dentro de «Mi historia») y preguntas.
  const rec = paso.recuerdo_curso2;
  const recuerdoItems = (() => {
    if (!rec) return [];
    let resps = completados?.[rec.paso]?.respuestas ?? respOrigen?.respuestas;
    if (!resps) { try { resps = JSON.parse(localStorage.getItem(`vl-test-profundo:${rec.paso}`)); } catch {} }
    const pasoOrigen = curso2Data.pasos?.find(p => p.id === rec.paso);
    return (rec.indices ?? [])
      .filter(i => typeof resps?.[i] === 'string' && resps[i].trim())
      .map(i => ({ idx: i, resp: resps[i].trim(), enunciado: pasoOrigen?.preguntas?.[i]?.texto || '' }));
  })();
  const paginas = [];
  secciones.forEach((sec, si) => {
    (sec.lecturas ?? []).forEach((_, li) => paginas.push({ tipo: 'lectura', si, li }));
    if (sec.id === 'historia' && recuerdoItems.length > 0) paginas.push({ tipo: 'recuerdo', si });
    sec.preguntas.forEach((_, pi) => paginas.push({ tipo: 'pregunta', si, pi }));
  });
  function posDe(si, pi) { return Math.max(0, paginas.findIndex(p => p.tipo === 'pregunta' && p.si === si && p.pi === pi)); }
  function inicioSeccion(si) { return Math.max(0, paginas.findIndex(p => p.si === si)); }

  // --- Carátula ---
  if (fase === 'caratula') {
    return <Caratula paso={paso} tipo="proyecto_mision" onEmpezar={() => {
      setPos(0);
      setFase('flujo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }} />;
  }

  // --- Índice post-completado (editar secciones) ---
  if (fase === 'indice') {
    return (
      <div>
        <div style={tarjetaCentrada}>
          <div style={{ textAlign: 'center', padding: '0 0 10px' }}>
            <span style={{
              display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
              background: SUCCESS_BG, border: `2px solid ${SUCCESS}`,
              fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: SUCCESS_DK,
            }}>✓</span>
          </div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '16px 0 8px', textAlign: 'center' }}>
            Proyecto completado
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: MUTED, lineHeight: 1.6, textAlign: 'center', maxWidth: 480, margin: '0 auto 24px' }}>
            Puedes editar cualquier sección cuando quieras.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {secciones.map((sec, si) => {
              const tieneResp = respuestas[sec.id]?.some(r => r?.trim());
              return (
                <div key={sec.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderTop: si > 0 ? `1px solid ${LINE}` : 'none' }}>
                  <span style={{ flex: 1, fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: NAVY }}>{sec.titulo}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: tieneResp ? GOLD_REF_DK : MUTED, fontWeight: 600 }}>
                      {respuestas[sec.id].filter(r => r?.trim()).length} de {sec.preguntas.length} respondida{sec.preguntas.length !== 1 ? 's' : ''}
                    </span>
                    <button type="button" onClick={() => {
                      setPos(inicioSeccion(si));
                      setFase('flujo');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} style={{
                      fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: GOLD_REF_DK,
                      background: 'none', border: `1px solid ${GOLD_REF}`, borderRadius: 0,
                      padding: '6px 16px', cursor: 'pointer',
                    }}>
                      Editar
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Cierre ---
  if (fase === 'cierre') {
    const declaracionSec = secciones.find(s => s.id === 'declaracion');
    const declaracion = declaracionSec ? respuestas.declaracion?.[0] : '';
    return (
      <div>
        <div style={tarjetaCentrada}>
          <div style={{ textAlign: 'center', padding: '0 0 10px' }}>
            <span style={{
              display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%',
              background: SUCCESS_BG, border: `2px solid ${SUCCESS}`,
              fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: SUCCESS_DK,
            }}>✦</span>
          </div>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, margin: '16px 0 20px', textAlign: 'center' }}>
            {paso.cierre?.titulo ?? 'Tu misión'}
          </h2>
          {declaracion?.trim() && (
            <p style={{
              fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: NAVY, lineHeight: 1.4,
              textAlign: 'center', maxWidth: 540, margin: '0 auto 24px',
            }}>
              «{declaracion.trim()}»
            </p>
          )}
          {paso.cierre?.texto && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.7, textAlign: 'center', maxWidth: 480, margin: '0 auto 28px' }}>
              {paso.cierre.texto}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => {
              setPos(paginas.length - 1);
              setFase('flujo');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} style={{
              fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: NAVY,
              background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '18px 36px', cursor: 'pointer',
            }}>
              ← Revisar el plan
            </button>
            <button type="button" onClick={() => {
              // Si el plan ya estaba terminado, solo se guardan los cambios y se vuelve al resumen (no salta de paso).
              if (yaCompletado) {
                onComplete({ respuestas, completado: true }, { avanzar: false });
                setFase('indice');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
              }
              onComplete({ respuestas, completado: true });
            }} style={{
              fontFamily: FONT_BODY, fontSize: 19, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '18px 48px', cursor: 'pointer',
            }}>
              {yaCompletado ? 'Guardar cambios' : 'Completar el curso'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Recorrido ---
  if (fase !== 'flujo' || paginas.length === 0) return null;

  const actual = Math.min(pos, paginas.length - 1);
  const pag = paginas[actual];
  const seccion = secciones[pag.si];
  const esUltima = actual === paginas.length - 1;
  const preg = pag.tipo === 'pregunta' ? seccion.preguntas[pag.pi] : null;
  const valor = preg ? (respuestas[seccion.id]?.[pag.pi] ?? '') : '';
  const puede = !preg || !preg.obligatoria || valor.trim();

  function irA(nuevo) {
    if (paginas[nuevo] && paginas[nuevo].si !== pag.si) guardarAlCambiarSeccion();
    setPos(nuevo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function siguiente() {
    if (!esUltima) { irA(actual + 1); return; }
    if (todasObligatoriasLlenas()) { setFase('cierre'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const p = primeraObligatoriaVacia();
    if (p) irA(posDe(p.secIdx, p.pregIdx));
  }
  function saltarSeccion() {
    const sig = paginas.findIndex(p => p.si > pag.si);
    if (sig >= 0) irA(sig);
    else if (todasObligatoriasLlenas()) { setFase('cierre'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  const btnAnterior = {
    fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
    background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
  };
  const navegacion = (enPregunta) => (
    <div className={enPregunta ? 'vl-pag-nav' : undefined} style={{ marginTop: enPregunta ? 16 : 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {actual > 0 ? <button type="button" onClick={() => irA(actual - 1)} style={btnAnterior}>← Anterior</button> : <span />}
        {seccion.opcional && pag.tipo !== 'pregunta' || (seccion.opcional && pag.pi === 0) ? (
          <button type="button" onClick={saltarSeccion} style={{ ...btnAnterior, color: MUTED, padding: '14px 28px' }}>Saltar este paso</button>
        ) : null}
      </div>
      <button type="button" onClick={siguiente} disabled={!puede} style={{
        fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
        background: puede ? GOLD_REF : LINE, border: 'none', borderRadius: 0,
        padding: '14px 36px', cursor: puede ? 'pointer' : 'default',
      }}>
        {esUltima && todasObligatoriasLlenas() ? 'Ver mi misión →' : 'Siguiente →'}
      </button>
    </div>
  );

  let tarjetaPagina;
  if (pag.tipo === 'lectura') {
    const items = seccion.lecturas[pag.li];
    const lista = Array.isArray(items) ? items : [items];
    const tituloPagina = lista.find(i => i?.titulo_pagina)?.titulo_pagina;
    tarjetaPagina = (
      <div className="vl-pag" style={tarjeta}>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 12px', textWrap: 'balance' }}>{tituloPagina || seccion.titulo}</h2>
        <div className="vl-pag-cuerpo" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {lista.map((item, i) => renderElementoSlide(item, i, { setLightboxSrc: setLbProy }))}
        </div>
        {lbProy && <Lightbox src={lbProy} alt="Diagrama" onClose={() => setLbProy(null)} />}
        {navegacion(false)}
      </div>
    );
  } else if (pag.tipo === 'recuerdo') {
    tarjetaPagina = (
      <div className="vl-pag" style={tarjeta}>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 12px', textWrap: 'balance' }}>{rec.titulo}</h2>
        <div className="vl-pag-cuerpo" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 20, color: NAVY, lineHeight: 1.75, margin: 0 }}>{rec.texto}</p>
          {recuerdoItems.map(({ idx: qi, resp, enunciado }) => (
            <div key={qi} style={{ padding: '14px 18px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}` }}>
              {enunciado && <p style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: NAVY, margin: '0 0 6px', lineHeight: 1.45 }}>{enunciado}</p>}
              <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>«{resp}»</p>
            </div>
          ))}
        </div>
        {navegacion(false)}
      </div>
    );
  } else {
    const claveEj = `${pag.si}:${pag.pi}`;
    const estiloTitulo = { fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.45 };
    // Enunciado de la sección + tema + preguntas guía (el placeholder queda en un simple «Reflexiona…»).
    const cabecera = (q) => (
      <div style={{ marginBottom: 20 }}>
        {seccion.enunciado && <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, margin: '0 0 6px', lineHeight: 1.5 }}>{seccion.enunciado}</p>}
        <p style={estiloTitulo}>{q.texto}</p>
        {q.guia && <p style={{ fontFamily: FONT_BODY, fontSize: 18, color: NAVY, margin: '10px 0 0', lineHeight: 1.6 }}>{q.guia}</p>}
      </div>
    );
    let cajasSlider = null;
    if (preg.slider === 'temperamento' && tempPrimario) {
      cajasSlider = [tempPrimario, temperamento?.secondary].filter(t => t && seccion.temperamentos?.[t]).map((t, i) => ({
        etiqueta: `${i === 0 ? 'Primario' : 'Secundario'}: ${TEMP_NOMBRE[t]}`, texto: seccion.temperamentos[t],
        fondo: BEIGE, borde: `3px solid ${TEMP_COLORS[t] ?? LINE}`, colorEtiqueta: MUTED, color: NAVY,
      }));
    } else if (preg.slider === 'virtudes' && seccion.virtudes?.length) {
      cajasSlider = seccion.virtudes.map(v => ({
        etiqueta: v.nombre, texto: v.texto, fondo: BEIGE, borde: `3px solid ${GOLD_REF}`, colorEtiqueta: GOLD_REF_DK, color: NAVY,
      }));
    }
    tarjetaPagina = (
      <div className="vl-pag-pregunta" style={{ ...tarjeta, position: 'relative', minHeight: cajasSlider ? undefined : 'clamp(340px, calc(100vh - 400px), 470px)' }}>
        {cabecera(preg)}

        {cajasSlider && <BloqueCajas key={`cajas-${claveEj}`} cajas={cajasSlider} slider />}

        <textarea
          key={claveEj}
          autoFocus
          value={valor}
          onChange={(e) => {
            const v = e.target.value;
            setRespuestas(prev => {
              const arr = [...(prev[seccion.id] ?? [])];
              arr[pag.pi] = v;
              return { ...prev, [seccion.id]: arr };
            });
          }}
          placeholder={preg.placeholder ?? 'Reflexiona…'}
          style={{
            fontFamily: FONT_BODY, fontSize: 18, color: NAVY, background: BEIGE,
            border: `1px solid ${LINE}`, borderRadius: 0, padding: '16px 18px',
            width: '100%', minHeight: 130, resize: 'vertical', outline: 'none',
          }}
        />

        {/* Ver ejemplo pegado a la caja, en la misma fila que el contador y el «Guardado» */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 24, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {preg.ejemplo && (
              <button type="button" onClick={() => setEjemploAbierto(prev => ({ ...prev, [claveEj]: !prev[claveEj] }))} style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: GOLD_REF_DK,
                display: 'flex', alignItems: 'center', gap: 5,
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                <IconoLupa />
                {ejemploAbierto[claveEj] ? 'Ocultar ejemplo' : 'Ver ejemplo'}
              </button>
            )}
            {preg.contador_palabras && (() => {
              const n = contarPalabras(valor);
              const enRango = n >= preg.contador_palabras.min && n <= preg.contador_palabras.max;
              return (
                <span style={{ fontFamily: FONT_BODY, fontSize: 15, color: enRango ? SUCCESS_DK : MUTED }}>
                  {n} palabra{n !== 1 ? 's' : ''} · {preg.contador_palabras.texto}
                </span>
              );
            })()}
          </div>
          <CheckGuardado campo={`${seccion.id}:${pag.pi}`} guardados={guardados} />
        </div>
        {preg.ejemplo && ejemploAbierto[claveEj] && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.6, margin: '10px 0 0', padding: '10px 14px', background: BEIGE, borderLeft: `2px solid ${GOLD_REF}` }}>
            {preg.ejemplo}
          </p>
        )}

        <EspacioIgualado textos={seccion.preguntas.map(q => `${q.texto}${q.guia ?? ''}`)} nodos={seccion.preguntas.map(cabecera)} actual={pag.pi} />
        {navegacion(true)}
      </div>
    );
  }

  return (
    <Shell titulo={`Plan · ${seccion.titulo}`} actual={actual + 1} total={paginas.length} accion={{ texto: 'Guardar y salir', onClick: guardarYSalir }}>
      {tarjetaPagina}
    </Shell>
  );
}
