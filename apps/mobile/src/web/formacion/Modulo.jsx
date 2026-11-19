import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext, useParams, useLocation, Link } from 'react-router-dom';
import { pasosDelUsuario, pasosVisibles, progresoModulo, progresoActividad, continuarModulo, siguientePaso, pasoAnterior, moduloDelPaso, videoAnterior, modulosCompletados, TIPOS_NO_CONTABLES } from './flujoModulo';
import { useModuloProgreso } from './useModulo';
import { Reproductor } from './Formacion';
import { Quiz, Define, Desliza, Identifica, TestProfundo, TemperamentoPerfil, RetosTemperamento, CirculoPersonas, ConclusionModulo, ReflexionGuiada, Sintesis, TestCaracterFormacion, TestCorazonFormacion, TestCorazonEnlace, ReflexionPiramide, TemperamentoMagnanimidad, PlanCrecimiento, PantallaResumen, leerPlan, guardarPlan, PantallaTablaDinamica, PantallaChecklist, PantallaChecklistCategorias, PantallaReflexionDoble, PantallaReflexionTemperamento, PantallaProposito, renderElementoSlide, REFLEXION_IMAGENES, Lightbox, Lectura, ArmoniaTemperamento, ObjetivosCorazon, ProyectoMision, Shell } from './Actividad';
import { supabase } from '../account/supabase';
import { BlocDeNotas, NotasLateral } from './BlocDeNotas';
import { useNotas } from './useNotas';
import { CuadernoPersonal } from './CuadernoPersonal';
import { fetchLatestTemperament } from '../account/account';
import { NAVY, MUTED, PAPER, LINE, GOLD_REF, GOLD_REF_DK, GOLD_REF_LT, FONT_SLAB, FONT_BODY, TEMP_COLORS, BEIGE, SUCCESS_DK } from '../theme';
import { notaAHtml } from './NotaTexto';
import { barraFondo, botonPrimario, botonSobreClaro, eyebrow, heroFondo, parrafo, tarjeta, titulo } from '../app/estilos';
import { IconoCheck, IconoFlecha, IconoPlay, IconoChevron, IconoVideo, IconoEjercicio, IconoCuestionario } from '../app/Iconos';
import { UMBRAL_VISTA } from './cursos';

import { useCatalogo } from './useFormacion';

const MODULOS = {
  'curso-1': () => import('../data/curso1.json'),
  'curso-2': () => import('../data/curso2.json'),
  'curso-3': () => import('../data/curso3.json'),
  'curso-4': () => import('../data/curso4.json'),
  'curso-5': () => import('../data/curso5.json'),
  'curso-6': () => import('../data/curso6.json'),
  'curso-7': () => import('../data/curso7.json'),
};

function catalogoAModulo(curso) {
  const pasos = curso.lecciones.map((l, i) => ({
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

  return {
    id: `curso${curso.numero}`,
    titulo: curso.titulo,
    curso: curso.numero,
    descripcion: `${pasos.length} módulos`,
    pasos,
  };
}

const TEMP_NOMBRE = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };

const VIRTUDES_CARDS = [
  { nombre: 'Prudencia', def: 'Tomar decisiones buenas', a1: 'Deliberación', a1d: 'Mira la realidad cara a cara · Pide consejo', a2: 'Decisión', a2d: 'Supera el miedo a equivocarte · Actúa sin demora' },
  { nombre: 'Fortaleza', def: 'Asumir riesgos y mantener el rumbo', a1: 'Resistencia', a1d: 'Persevera con fundamento, no por obstinación', a2: 'Audacia', a2d: 'Asume riesgos con medios y objetivos morales' },
  { nombre: 'Dominio de sí', def: 'Gestionar nuestras emociones', a1: 'Someter las malas emociones', a1d: 'Las que empujan a obrar mal', a2: 'Estimular las buenas', a2d: 'Las que empujan a hacer el bien' },
  { nombre: 'Justicia', def: 'Dar a cada uno lo que le corresponde', a1: 'Comunión', a1d: 'Verdad, empatía, amistad, misericordia', a2: 'Bien común', a2d: 'Laboriosidad, vida del hogar, ciudadanía' },
];

const INTEGRA_CARDS = [
  { virtud: 'Prudencia', accion: 'Respeta la realidad objetiva y toma decisiones de acuerdo con esa realidad.' },
  { virtud: 'Fortaleza', accion: 'Asume riesgos cuando es necesario y mantiene el rumbo.', nota: 'Audacia y resistencia' },
  { virtud: 'Dominio de sí', accion: 'Dice «sí» a lo que la ennoblece y «no» a lo que le envilece.' },
  { virtud: 'Justicia', accion: 'Da a cada persona lo suyo, cumpliendo fielmente sus obligaciones profesionales, sociales y familiares.' },
];

function mapTemp(result) {
  if (!result) return null;
  const p = result.primario ?? result.primary;
  const s = result.secundario ?? result.secondary ?? null;
  if (!TEMP_COLORS[p]) return null;
  return { primary: p, secondary: s };
}

function agruparIntro(parrafos) {
  if (!parrafos || !parrafos.length) return [];
  return parrafos.map(p => Array.isArray(p) ? p : [p]);
}

function renderIntroTexto(text) {
  const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('__') && part.endsWith('__')) return <u key={i}>{part.slice(2, -2)}</u>;
    return part;
  });
}

// Publica en el split la altura de esta columna sin las notas pasadas: es el mínimo del contenido.
function ColumnaNotas({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const col = ref.current;
    const split = col?.parentElement;
    if (!col || !split) return;
    function medir() {
      const pasadas = col.querySelector('.vl-notas-pasadas');
      const extra = pasadas ? pasadas.offsetHeight + parseFloat(getComputedStyle(pasadas).marginTop) : 0;
      split.style.setProperty('--vl-lado-base', `${col.scrollHeight - extra}px`);
    }
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(col);
    for (const c of col.children) ro.observe(c);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="vl-split-notas-col">{children}</div>;
}

function PasoVideo({ paso, pasos, progreso, avanzar, retroceder, volver, cursoNum = 1, notasProps, temperamento }) {
  const completado = Boolean(progreso.completados[paso.id]);
  const lec = moduloDelPaso(pasos, paso.id);
  const paginas = agruparIntro(paso.intro);
  const [introIdx, setIntroIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [modoCine, setModoCine] = useState(false);
  // Al salir del modo cine, el vídeo sigue por encima del velo mientras este se desvanece (1,8 s):
  // así no se ve un instante toda la pantalla en gris.
  const [cineElevado, setCineElevado] = useState(false);
  useEffect(() => {
    if (modoCine) { setCineElevado(true); return; }
    const t = setTimeout(() => setCineElevado(false), 1800);
    return () => clearTimeout(t);
  }, [modoCine]);
  const enIntro = paginas.length > 0 && introIdx < paginas.length;
  // Altura de la página más larga de la introducción: el botón no se mueve entre páginas.
  const medidorIntroRef = useRef(null);
  const [altoIntro, setAltoIntro] = useState(0);
  useEffect(() => {
    const el = medidorIntroRef.current;
    if (!el) { setAltoIntro(0); return; }
    const medir = () => setAltoIntro(Math.max(0, ...[...el.children].map(c => c.offsetHeight)));
    medir();
    const ro = new ResizeObserver(medir);
    [...el.children].forEach(c => ro.observe(c));
    return () => ro.disconnect();
  }, [paso.id, enIntro]);

  useEffect(() => {
    document.body.classList.toggle('vl-cine-activo', modoCine);
    return () => document.body.classList.remove('vl-cine-activo');
  }, [modoCine]);

  function onProgreso(frac) {
    if (frac >= UMBRAL_VISTA && !completado) {
      progreso.completar(paso.id, undefined, { tipo: 'video', modulo: paso.modulo ?? 0 });
    }
    if (frac >= 1 && modoCine) setModoCine(false);
  }

  function avanzarYMarcar() {
    if (!completado) progreso.completar(paso.id, undefined, { tipo: 'video', modulo: paso.modulo ?? 0 });
    avanzar();
  }

  function avanzarIntro() {
    setVisible(false);
    setTimeout(() => {
      setIntroIdx(i => i + 1);
      setVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }

  function retrocederIntro() {
    setVisible(false);
    setTimeout(() => {
      setIntroIdx(i => Math.max(0, i - 1));
      setVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  }

  if (enIntro) {
    const pags = paginas[introIdx];
    const esUltima = introIdx === paginas.length - 1;
    return (
      <div className="vl-ejercicio-split" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{`@media (min-width: 1100px) { .vl-ejercicio-split { display: grid !important; grid-template-columns: minmax(0, 2.2fr) minmax(300px, 1fr); gap: 24px !important; align-items: start; } .vl-ejercicio-split > .vl-split-back { grid-column: 1 / -1; } .vl-ejercicio-split > .vl-split-notas-col { position: sticky; top: 60px; } }`}</style>
        <button type="button" className="vl-split-back" onClick={volver} style={{
          justifySelf: 'start', alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: NAVY, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, marginBottom: -10,
        }}>← Salir al curso</button>
        <div className="vl-split-contenido" style={{ minWidth: 0 }}>
        <Shell titulo="Introducción" actual={introIdx + 1} total={paginas.length}>
        <div className="vl-pag" style={{ ...tarjeta, position: 'relative' }}>
          {paso.id !== 'm4-01' && paso.id !== 'm4-02' && (
            <div ref={medidorIntroRef} aria-hidden style={{ position: 'absolute', left: 22, right: 22, top: 0, visibility: 'hidden', pointerEvents: 'none' }}>
              {paginas.map((pg, n) => (
                <div key={n} style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(Array.isArray(pg) ? pg : [pg]).map((item, i) => renderElementoSlide(item, i, { setLightboxSrc: () => {} }))}
                </div>
              ))}
            </div>
          )}
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '0 0 20px' }}>
            {(Array.isArray(pags) ? pags : [pags]).find(i => i?.titulo_pagina)?.titulo_pagina || paso.titulo}
          </h2>
          <div className="vl-pag-cuerpo" style={{
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 300ms ease, transform 300ms ease',
            display: 'flex', flexDirection: 'column', gap: 14, minHeight: altoIntro || undefined,
          }}>
            <style>{`
              @keyframes vlChipIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
              .vl-chip-anim { animation: vlChipIn 450ms ease both; }
            `}</style>
            {(Array.isArray(pags) ? pags : [pags]).some(it => it?.tarjetas_virtudes) ? (
              <>
                {pags.filter(it => !it?.tarjetas_virtudes).map((item, i) => renderElementoSlide(item, i, { setLightboxSrc }))}
                <style>{`
                  .vl-vc { background: rgba(165,139,38,0.06); border: 1.5px solid rgba(165,139,38,0.12); border-radius: 12px; padding: 14px 20px; cursor: default; transition: all 350ms cubic-bezier(.4,0,.2,1); animation: vlChipIn 450ms ease both; }
                  .vl-vc:hover { background: rgba(165,139,38,0.13); border-color: ${GOLD_REF}88; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.09); }
                  .vl-vc-det { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 400ms cubic-bezier(.4,0,.2,1), opacity 300ms ease, margin 300ms ease; margin-top: 0; }
                  .vl-vc:hover .vl-vc-det { max-height: 260px; opacity: 1; margin-top: 10px; }
                  .vl-vc-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                  @media (max-width: 600px) { .vl-vc-grid { grid-template-columns: 1fr; } }
                  .vl-vc-pill { display: inline-block; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; background: ${GOLD_REF}18; color: ${GOLD_REF_DK}; }
                `}</style>
                {/* alignItems start: al pasar el ratón solo se despliega la tarjeta activa; las demás se quedan plegadas. */}
                {/* minHeight reserva el sitio de una tarjeta desplegada: al pasar el ratón no se mueve el botón. */}
                <div className="vl-vc-grid" style={{ display: 'grid', gap: 12, alignItems: 'start', alignContent: 'start', marginTop: 2, minHeight: 310 }}>
                  {VIRTUDES_CARDS.map((v, i) => {
                    const ic = paso.id === 'm4-02' ? INTEGRA_CARDS[i] : null;
                    return (
                      <div key={v.nombre} className="vl-vc" style={{ animationDelay: `${i * 120}ms` }}>
                        <div style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY }}>{v.nombre}</div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
                          {ic ? ic.accion : v.def}
                        </div>
                        {ic && ic.nota && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: GOLD_REF_DK, fontWeight: 600, marginTop: 4 }}>{ic.nota}</div>}
                        <div className="vl-vc-det">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[[v.a1, v.a1d], [v.a2, v.a2d]].map(([eje, texto]) => (
                              <div key={eje} style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.45 }}>
                                <span className="vl-vc-pill" style={{ fontFamily: FONT_BODY, marginRight: 8 }}>{eje}</span>{texto}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              pags.map((item, i) => renderElementoSlide(item, i, { setLightboxSrc }))
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            {introIdx > 0 ? (
              <button type="button" onClick={retrocederIntro} style={{
                fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: NAVY,
                background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
              }}>
                ← Anterior
              </button>
            ) : <span />}
            <button type="button" onClick={avanzarIntro} style={{
              fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff',
              background: GOLD_REF, border: 'none', borderRadius: 0, padding: '14px 36px', cursor: 'pointer',
            }}>
              {esUltima ? 'Ver vídeo →' : 'Siguiente →'}
            </button>
          </div>
          {lightboxSrc && <Lightbox src={lightboxSrc} alt="Diagrama" onClose={() => setLightboxSrc(null)} />}
        </div>
        </Shell>
        </div>
        <ColumnaNotas>
          <section style={tarjeta}>
            <div style={eyebrow}>{lec && !lec.introduccion ? `Módulo ${lec.numero}` : 'Introducción'}</div>
            <h2 style={{ ...titulo(26), margin: '8px 0 6px' }}>{paso.titulo}</h2>
            {!lec?.introduccion && <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: GOLD_REF_DK, fontWeight: 600, marginTop: 6 }}>Introducción</div>}
          </section>
          {notasProps && <BlocDeNotas {...notasProps} pasoActualId={paso.id} />}
        </ColumnaNotas>
      </div>
    );
  }

  return (
    <div className="vl-leccion" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @media (min-width: 1100px) { .vl-leccion { display: grid !important; grid-template-columns: minmax(0, 2.2fr) minmax(300px, 1fr); gap: 24px !important; align-items: start; } .vl-leccion > .vl-back { grid-column: 1; grid-row: 1; } .vl-leccion > .vl-video-col { grid-column: 1; grid-row: 2; position: sticky; top: 60px; } .vl-leccion > .vl-video-lado { grid-column: 2; grid-row: 2; position: sticky; top: 60px; } }
        .vl-cine-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(90,90,95,0.45); z-index: 900; pointer-events: none; opacity: 0; transition: opacity 1.8s ease; }
        .vl-cine-overlay--on { opacity: 1; pointer-events: auto; }
        .vl-cine-elevated { position: relative; z-index: 910; }
        .vl-cine-bloc { transition: opacity 1.8s ease, visibility 0s linear 0s; }
        .vl-cine-bloc--oculto { opacity: 0; visibility: hidden; transition: opacity 1.8s ease, visibility 0s linear 1.8s; }
        nav[aria-label="Navegación principal"] { transition: opacity 1.8s ease, visibility 0s linear 0s; }
        body.vl-cine-activo nav[aria-label="Navegación principal"] { opacity: 0; visibility: hidden; transition: opacity 1.8s ease, visibility 0s linear 1.8s; }
        .vl-cine-toggle { display: none; }
        @media (min-width: 1100px) { .vl-cine-toggle { display: flex; } }
      `}</style>
      {createPortal(
        <div className={`vl-cine-overlay${modoCine ? ' vl-cine-overlay--on' : ''}`}
          onClick={() => setModoCine(false)} />,
        document.body
      )}
      <div className="vl-back" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: -10 }}>
        <button type="button" onClick={volver} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: NAVY, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600 }}>← Salir al curso</button>
        <button type="button" className={`vl-cine-toggle${cineElevado ? ' vl-cine-elevated' : ''}`} onClick={() => setModoCine(c => !c)} style={{
          alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: MUTED, transition: 'color 1.8s ease' }}>Modo cine</span>
          <span style={{
            width: 36, height: 20, borderRadius: 10, background: modoCine ? GOLD_REF : `${LINE}`, position: 'relative',
            display: 'inline-block', transition: 'background 1s ease', flexShrink: 0,
          }}>
            <span style={{
              position: 'absolute', top: 2, left: modoCine ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left 400ms cubic-bezier(.4,0,.2,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }} />
          </span>
        </button>
      </div>
      <div className={`vl-video-col${cineElevado ? ' vl-cine-elevated' : ''}`}>
        <Reproductor leccion={{ id: paso.id, vimeoId: paso.vimeoId, titulo: paso.titulo }} onProgreso={onProgreso} />
        {(() => {
          // «Tu tendencia»: si el temperamento del usuario inclina a la tendencia de este módulo, se avisa bajo el vídeo.
          const tp = temperamento?.primary;
          const fuente = (pasos ?? []).find(p => p.modulo === paso.modulo && p.aviso_temperamento?.[tp]);
          const texto = tp && fuente ? fuente.aviso_temperamento[tp] : null;
          if (!texto) return null;
          return (
            // En modo cine se desvanece igual que el bloc de notas: solo el vídeo queda a la vista.
            <div className={`vl-cine-bloc${modoCine ? ' vl-cine-bloc--oculto' : ''}`} aria-hidden={modoCine || undefined} style={{ marginTop: 16, padding: '20px 24px', background: BEIGE, borderLeft: `4px solid ${TEMP_COLORS[tp] || GOLD_REF}` }}>
              <div style={{ ...eyebrow, fontSize: 13, color: TEMP_COLORS[tp] || GOLD_REF_DK, marginBottom: 8 }}>Tu tendencia · {TEMP_NOMBRE[tp]}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 19, color: NAVY, lineHeight: 1.65 }}>{texto}</div>
            </div>
          );
        })()}
      </div>
      <div className="vl-video-lado">
        <section style={tarjeta}>
          <div style={eyebrow}>
            {lec?.introduccion ? 'Introducción' : lec ? `Módulo ${lec.numero}` : 'Vídeo'}
          </div>
          <h2 style={{ ...titulo(26), margin: '8px 0 6px' }}>{paso.titulo}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            {retroceder && (
              <button type="button" onClick={retroceder} style={botonSobreClaro}>← Anterior</button>
            )}
            <button type="button" onClick={avanzarYMarcar} style={botonPrimario}>
              {completado ? 'Siguiente' : 'Marcar como visto y seguir'} <IconoFlecha width={16} height={16} />
            </button>
          </div>
        </section>
        {notasProps && (
          <div className={`vl-cine-bloc${modoCine ? ' vl-cine-bloc--oculto' : ''}`} aria-hidden={modoCine || undefined}>
            <BlocDeNotas {...notasProps} pasoActualId={paso.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function PasoActividad({ paso, pasos, temperamento, progreso, avanzar, volver, user, irA, cursoNum = 1 }) {
  const _vidCtx = videoAnterior(pasos, paso.id);
  const _mod = _vidCtx ? moduloDelPaso(pasos, _vidCtx.id) : null;
  const moduloNum = _mod?.numero ?? 1;

  function completar(resultado) {
    progreso.completar(paso.id, resultado, { tipo: paso.tipo, modulo: paso.modulo ?? 0 });
    avanzar();
  }
  // Si el paso ya está completado, sus respuestas guardadas sirven para rellenar el ejercicio al volver.
  const borrador = progreso.borradores?.[paso.id] ?? progreso.completados?.[paso.id];
  const onBorrador = (datos) => progreso.guardarBorrador?.(paso.id, datos, paso);

  switch (paso.tipo) {
    case 'quiz': return <Quiz paso={paso} onComplete={completar} modulo={moduloNum} />;
    case 'define': return <Define paso={paso} onComplete={completar} modulo={moduloNum} />;
    case 'desliza': return <Desliza paso={paso} onComplete={completar} modulo={moduloNum} />;
    case 'identifica': return <Identifica paso={paso} onComplete={completar} modulo={moduloNum} guardado={progreso.completados[paso.id]} borrador={borrador} onBorrador={onBorrador} />;
    case 'test_profundo': return <TestProfundo paso={paso} onComplete={completar} modulo={moduloNum} user={user} borrador={borrador} onBorrador={onBorrador} />;
    case 'reflexion_piramide': return <ReflexionPiramide paso={paso} onComplete={completar} modulo={moduloNum} borrador={borrador} onBorrador={onBorrador} />;
    case 'temperamento_magnanimidad': return <TemperamentoMagnanimidad paso={paso} temperamento={temperamento} onComplete={completar} guardado={progreso.completados[paso.id]} borrador={borrador} onBorrador={onBorrador} />;
    case 'temperamento_perfil': return <TemperamentoPerfil paso={paso} temperamento={temperamento} onComplete={completar} />;
    case 'retos_temperamento': return <RetosTemperamento paso={paso} temperamento={temperamento} onComplete={completar} guardado={progreso.completados[paso.id]} borrador={borrador} onBorrador={onBorrador} />;
    case 'circulo_personas': return <CirculoPersonas paso={paso} user={user} onComplete={completar} />;
    case 'conclusion_modulo': {
      const idxConcl = pasos.indexOf(paso);
      let idxVideo = -1;
      for (let i = idxConcl - 1; i >= 0; i--) {
        if (pasos[i].tipo === 'video' && !pasos[i].continua_modulo) { idxVideo = i; break; }
      }
      const pendientes = idxVideo >= 0
        ? pasos.slice(idxVideo, idxConcl).filter(p => p.tipo !== 'noop' && !progreso.completados[p.id])
        : [];
      return <ConclusionModulo paso={paso} completados={progreso.completados} pendientes={pendientes} onContinuar={completar} onVolver={volver} irA={irA} />;
    }
    case 'reflexion_guiada': return <ReflexionGuiada paso={paso} temperamento={temperamento} onComplete={completar} />;
    case 'plan_crecimiento': return <PlanCrecimiento paso={paso} temperamento={temperamento} onComplete={completar} userId={user.id} guardado={progreso.completados[paso.id]} user={user} cursoNum={cursoNum} />;
    case 'test_caracter': return <TestCaracterFormacion paso={paso} onComplete={completar} />;
    case 'test_corazon': return <TestCorazonEnlace paso={paso} onComplete={completar} />;
    case 'lectura': return <Lectura paso={paso} onComplete={completar} temperamento={temperamento} />;
    case 'armonia_temperamento': return <ArmoniaTemperamento paso={paso} temperamento={temperamento} onComplete={completar} guardado={progreso.completados[paso.id]} />;
    case 'objetivos_corazon': return <ObjetivosCorazon paso={paso} onComplete={(r, opts) => { progreso.completar(paso.id, r, { tipo: paso.tipo, modulo: paso.modulo ?? 0 }); if (opts?.avanzar !== false) avanzar(); }} completados={progreso.completados} guardado={progreso.completados[paso.id]} irA={irA} />;
    case 'cierre': return <Sintesis paso={paso} temperamento={temperamento} onComplete={completar} cursoNum={cursoNum} user={user} borrador={borrador} onBorrador={onBorrador} />;
    case 'proyecto_mision': return <ProyectoMision paso={paso} onComplete={(r, opts) => { progreso.completar(paso.id, r, { tipo: paso.tipo, modulo: paso.modulo ?? 0 }); if (r.completado && opts?.avanzar !== false) avanzar(); }} temperamento={temperamento} completados={progreso.completados} guardado={progreso.completados[paso.id]} volver={volver} />;
    default: return <p>Tipo desconocido: {paso.tipo}</p>;
  }
}

function agruparModulos(pasos) {
  const modulos = [];
  let actual = null;
  for (const p of pasos) {
    if (p.proyecto_final) continue;
    if (p.tipo === 'video') {
      if (p.continua_modulo && actual) {
        actual.actividades.push(p);
      } else {
        actual = { video: p, actividades: [] };
        modulos.push(actual);
      }
    } else if (actual && !TIPOS_NO_CONTABLES.has(p.tipo)) {
      actual.actividades.push(p);
    }
  }
  return modulos;
}

function puntuacionActividad(completado) {
  if (!completado) return null;
  if (typeof completado.aciertos === 'number' && typeof completado.total === 'number') {
    return `${completado.aciertos}/${completado.total}`;
  }
  return null;
}

function tituloActividad(act) {
  if (act.tipo === 'define') return act.titulo.replace(/^Define\b/, 'Definiciones');
  if (act.tipo === 'quiz') return act.titulo.replace(/^Quiz\b/, 'Cuestionario');
  return act.titulo;
}

function etiquetaPaso(paso) {
  if (paso.tipo === 'quiz') return 'Cuestionario';
  if (paso.tipo === 'define') return 'Definiciones';
  if (paso.tipo === 'test_profundo') return /^test\b/i.test(paso.titulo ?? '') ? 'Test' : 'Reflexión';
  if (paso.tipo === 'reflexion_piramide') return 'Reflexión';
  if (paso.tipo === 'temperamento_magnanimidad') return 'Temperamento';
  if (paso.tipo === 'temperamento_perfil') return 'Tu perfil';
  if (paso.tipo === 'retos_temperamento') return 'Retos';
  if (paso.tipo === 'reflexion_guiada') return 'Reflexión';
  if (paso.tipo === 'plan_crecimiento') return 'Plan de crecimiento';
  if (paso.tipo === 'cierre') return 'Síntesis';
  if (paso.tipo === 'conclusion_modulo') return 'Resumen';
  if (paso.tipo === 'test_caracter') return 'Test de carácter';
  if (paso.tipo === 'test_corazon') return 'Test del corazón';
  if (paso.tipo === 'armonia_temperamento') return 'Temperamento';
  if (paso.tipo === 'objetivos_corazon') return 'Proyecto final';
  if (paso.tipo === 'proyecto_mision') return 'Plan';
  return paso.titulo;
}

function EmojiShortcut({ emoji, hecho, onClick, title }) {
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={title}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') { e.stopPropagation(); onClick(); } } : undefined}
      style={{
        fontSize: 10, cursor: onClick ? 'pointer' : 'default',
        opacity: hecho ? 0.6 : 0.2,
        filter: 'grayscale(1)',
        transition: 'opacity 150ms ease',
        lineHeight: 1,
      }}
    >
      {emoji}
    </span>
  );
}

function ListaLecciones({ pasos, completados, irA, temperamento }) {
  const [abierto, setAbierto] = useState(null);
  const modulos = agruparModulos(Array.from(pasos || []));
  const tempPrimario = temperamento?.primary;
  const proyectosFinal = (pasos || []).filter(p => p.proyecto_final);
  // Proyectos finales que dependen del Test del corazón: bloqueados hasta que haya un resultado guardado.
  const necesitaCorazon = proyectosFinal.some(p => p.requiere_test_corazon);
  const [tieneCorazon, setTieneCorazon] = useState(null);
  const [avisoCorazon, setAvisoCorazon] = useState(false);
  useEffect(() => {
    if (!necesitaCorazon || !supabase) return;
    let vivo = true;
    supabase.from('test_results').select('id', { count: 'exact', head: true }).eq('kind', 'heart')
      .then(({ count }) => { if (vivo) setTieneCorazon((count ?? 0) > 0); });
    return () => { vivo = false; };
  }, [necesitaCorazon]);
  function irAlTestCorazon() {
    const lang = window.__vlRuta().split('/')[1] || 'es';
    window.__vlAbrirWeb(`/${lang}/tests/corazon-libre?volver=${encodeURIComponent(window.__vlRuta())}`);
  }

  return (
    <>
    <div style={{ ...tarjeta, padding: 0, overflow: 'hidden' }}>
      {modulos.map((mod, i) => {
        const isOpen = abierto === i;
        // Con introducción, el primer bloque no lleva número y los demás empiezan en el Módulo 1.
        const conIntro = Boolean(modulos[0]?.video?.es_introduccion);
        const esIntro = conIntro && i === 0;
        const numMod = conIntro ? i : i + 1;
        const videoHecho = Boolean(completados[mod.video.id]);
        const actsDone = mod.actividades.filter((a) => completados[a.id]).length;
        const allActsDone = mod.actividades.length > 0 && actsDone === mod.actividades.length;
        const todoHecho = videoHecho && (mod.actividades.length === 0 || allActsDone);

        return (
          <div key={mod.video.id} style={{ borderBottom: i < modulos.length - 1 ? `1px solid ${LINE}` : 'none' }}>
            <button type="button" onClick={() => setAbierto(isOpen ? null : i)} style={{
              all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            }}>
              <span style={{
                flex: '0 0 28px', height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
                border: todoHecho ? 'none' : `1.5px solid ${LINE}`,
                background: todoHecho ? GOLD_REF : 'transparent', color: todoHecho ? '#fff' : NAVY,
                fontFamily: FONT_SLAB, fontSize: 13, fontWeight: 700,
              }}>
                {todoHecho ? <IconoCheck width={14} height={14} /> : esIntro ? '·' : numMod}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontFamily: FONT_BODY, fontSize: 14.5, color: NAVY, fontWeight: 500 }}>
                {esIntro ? 'Introducción' : `Módulo ${numMod}`}: {mod.video.titulo}
                {tempPrimario && mod.video.tendencia_temperamentos?.includes(tempPrimario) && (
                  <span style={{
                    marginLeft: 8, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
                    color: TEMP_COLORS[tempPrimario] || GOLD_REF_DK, textTransform: 'uppercase',
                    letterSpacing: '0.06em', background: `${TEMP_COLORS[tempPrimario] || GOLD_REF}14`,
                    padding: '2px 8px', borderRadius: 10, verticalAlign: 'middle',
                  }}>Tu tendencia</span>
                )}
              </span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center', flex: '0 0 auto' }}></span>
              <IconoChevron width={16} height={16} style={{
                color: MUTED, flex: '0 0 16px',
                transition: 'transform 200ms ease',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 18px 14px 58px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {mod.actividades.some(a => puntuacionActividad(completados[a.id])) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0 2px' }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resultado</span>
                  </div>
                )}

                <button type="button" onClick={() => irA(mod.video.id)} style={{
                  all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: mod.actividades.length > 0 ? `1px solid ${LINE}` : 'none',
                }}>
                  <span style={{ width: 14, display: 'inline-flex' }}>{videoHecho && <IconoCheck width={14} height={14} style={{ color: GOLD_REF }} />}</span>
                  <IconoVideo width={15} height={15} style={{ color: MUTED, opacity: 0.5 }} />
                  <span style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 14, color: NAVY }}>{mod.video.titulo}</span>
                </button>

                {mod.actividades.map((act, j) => {
                  const actHecho = completados[act.id];
                  const score = puntuacionActividad(actHecho);
                  return (
                    <button key={act.id} type="button" onClick={() => irA(act.id)} style={{
                      all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                      borderBottom: j < mod.actividades.length - 1 ? `1px solid ${LINE}` : 'none',
                    }}>
                      <span style={{ width: 14, display: 'inline-flex' }}>{actHecho && <IconoCheck width={14} height={14} style={{ color: GOLD_REF }} />}</span>
                      {act.tipo === 'video' ? <IconoVideo width={15} height={15} style={{ color: MUTED, opacity: 0.5 }} /> : act.tipo === 'quiz' ? <IconoCuestionario width={15} height={15} style={{ color: MUTED, opacity: 0.5 }} /> : <IconoEjercicio width={15} height={15} style={{ color: MUTED, opacity: 0.5 }} />}
                      <span style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 14, color: NAVY }}>{act.tipo === 'video' ? act.titulo : tituloActividad(act)}</span>
                      {score && <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: GOLD_REF_DK }}>{score}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
    {proyectosFinal.map(pf => {
      const pfData = completados[pf.id];
      const pfCompletado = pfData?.completado || (pf.tipo === 'objetivos_corazon' && Array.isArray(pfData?.codigos));
      const pfAMedias = pfData && !pfCompletado;
      const bloqueado = pf.requiere_test_corazon && tieneCorazon === false && !pfCompletado;
      return (
        <section key={pf.id} style={{ marginTop: 18 }}>
          <button type="button" onClick={() => (bloqueado ? setAvisoCorazon(true) : irA(pf.id))} style={{
            all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
            ...tarjeta, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{
              flex: '0 0 32px', height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
              border: pfCompletado ? 'none' : `1.5px solid ${LINE}`,
              background: pfCompletado ? GOLD_REF : 'transparent',
              color: pfCompletado ? '#fff' : bloqueado ? MUTED : NAVY,
              fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700,
            }}>
              {pfCompletado ? <IconoCheck width={16} height={16} /> : bloqueado ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              ) : '✦'}
            </span>
            <div>
              {pf.subtitulo_proyecto && <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: GOLD_REF_DK, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{pf.subtitulo_proyecto}</div>}
              <div style={{ fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: bloqueado ? MUTED : NAVY }}>{pf.titulo}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: pfCompletado ? SUCCESS_DK : bloqueado ? MUTED : pfAMedias ? GOLD_REF_DK : MUTED, marginTop: 2 }}>
                {pfCompletado ? 'Completado' : bloqueado ? 'Bloqueado · Necesitas hacer el Test del corazón' : pfAMedias ? 'En progreso' : 'Pendiente'}
              </div>
            </div>
          </button>
        </section>
      );
    })}
    {avisoCorazon && createPortal(
      <div role="dialog" aria-modal="true" onClick={() => setAvisoCorazon(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(20,28,48,0.45)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 16 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ ...tarjeta, maxWidth: 480, width: '100%', padding: '36px 32px', textAlign: 'center' }}>
          <span style={{ display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%', background: BEIGE, border: `2px solid ${GOLD_REF}`, fontFamily: FONT_SLAB, fontSize: 28, fontWeight: 700, color: GOLD_REF_DK }}>♡</span>
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: NAVY, margin: '16px 0 10px' }}>Haz primero el Test del corazón</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: MUTED, lineHeight: 1.6, margin: '0 0 24px' }}>
            Tu perfil del corazón se construye con el resultado del test: verás las dos enfermedades espirituales en las que más puntúas y fijarás tus objetivos prácticos para cada una.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button type="button" onClick={irAlTestCorazon} style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 600, color: '#fff', background: GOLD_REF, border: 'none', borderRadius: 0, padding: '16px 36px', cursor: 'pointer' }}>Hacer el Test del corazón →</button>
            <button type="button" onClick={() => setAvisoCorazon(false)} style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>Ahora no</button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

// `paso.ficha` elige qué respuestas van a "Mis reflexiones": [{ respuesta: índice } | { campo: 'textoFuerte' }, titulo?]. [] lo excluye.
function itemsFicha(paso, datos) {
  const out = [];
  for (const f of paso.ficha) {
    let texto;
    let titulo = f.titulo;
    if (typeof f.respuesta === 'number') {
      texto = datos.respuestas?.[f.respuesta];
      if (!titulo) {
        const q = paso.preguntas?.[f.respuesta];
        titulo = typeof q === 'string' ? q : q?.texto;
      }
    } else if (f.campo) {
      texto = datos[f.campo];
    }
    if (typeof texto === 'string' && texto.trim()) out.push({ titulo: titulo || paso.titulo, texto: texto.trim() });
  }
  return out;
}

function extraerReflexiones(pasos, completados) {
  const items = [];
  for (const paso of pasos) {
    const datos = completados[paso.id];
    if (!datos) continue;
    const titulo = paso.resumen_ficha || paso.titulo;
    const prio = paso.prioridad_ficha ?? 5;
    if (Array.isArray(paso.ficha)) {
      itemsFicha(paso, datos).forEach((it, j) => items.push({ ...it, id: `${paso.id}-${j}`, prio }));
      continue;
    }
    if (paso.tipo === 'test_profundo' || paso.tipo === 'reflexion_piramide') {
      const textos = (datos.respuestas ?? []).filter(t => typeof t === 'string' && t.trim());
      if (textos.length > 0) items.push({ id: paso.id, titulo, texto: textos[0], prio });
    } else if (paso.tipo === 'temperamento_magnanimidad') {
      const t = datos.textoFuerte || datos.textoDebil;
      if (t) items.push({ id: paso.id, titulo, texto: datos.textoFuerte ? `Puntos fuertes: ${datos.textoFuerte}` : `Puntos débiles: ${datos.textoDebil}`, prio });
    } else if (paso.tipo === 'cierre' && (datos.lo_que_facilita || datos.compromiso)) {
      const texto = datos.proposito || datos.lo_que_facilita || datos.compromiso || '';
      items.push({ id: paso.id, titulo, texto, prio });
    } else if (paso.tipo === 'plan_crecimiento' && datos.plan) {
      const planData = datos.plan;
      const texto = planData.proposito_final || planData.ambiente || '';
      if (texto) items.push({ id: paso.id, titulo, texto: typeof texto === 'string' ? texto : JSON.stringify(texto), prio });
    } else if (paso.tipo === 'proyecto_mision' && datos.respuestas?.declaracion?.[0]?.trim()) {
      items.push({ id: paso.id, titulo, texto: `Mi misión: «${datos.respuestas.declaracion[0].trim()}»`, prio });
    }
  }
  items.sort((a, b) => a.prio - b.prio);
  return items.slice(0, 8);
}

function FichaSlider({ r, cita, activo }) {
  const [expandido, setExpandido] = useState(false);
  const [largo, setLargo] = useState(false);
  const textoRef = useRef(null);
  useEffect(() => { if (!activo) setExpandido(false); }, [activo]);
  useEffect(() => {
    const el = textoRef.current;
    if (el && !expandido) setLargo(el.scrollHeight > el.clientHeight + 1);
  }, [r.texto, expandido]);
  if (cita) {
    return (
      <div style={{ padding: '12px 14px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}` }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 17, color: NAVY, lineHeight: 1.55, textWrap: 'pretty' }}>{r.texto}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '12px 14px', background: BEIGE, borderLeft: `2px solid ${LINE}` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 700, color: NAVY, lineHeight: 1.4, marginBottom: 6 }}>{r.titulo}</div>
      <div ref={textoRef} style={{
        fontFamily: FONT_BODY, fontSize: 17, color: NAVY, lineHeight: 1.55,
        ...(!expandido ? { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } : {}),
      }}>{r.texto}</div>
      {largo && (
        <button type="button" tabIndex={activo ? 0 : -1} onClick={() => setExpandido(e => !e)} style={{
          fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: GOLD_REF_DK,
          background: 'none', border: 'none', padding: '6px 0 0', cursor: 'pointer',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>{expandido ? 'Ver menos' : 'Ver más'}</button>
      )}
    </div>
  );
}

function SliderReflexiones({ reflexiones, onVerCuaderno, etiqueta = 'Mis reflexiones', cita = false }) {
  const total = reflexiones.length;
  const [idx, setIdx] = useState(0);
  const actual = Math.min(idx, total - 1);
  const slideRefs = useRef([]);
  const [alto, setAlto] = useState(null);
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(total - 1, i + 1));

  useEffect(() => {
    const el = slideRefs.current[actual];
    if (!el) return;
    const medir = () => setAlto(el.offsetHeight);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [actual, total]);

  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{etiqueta}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED }}>{actual + 1}/{total}</span>
          <button type="button" onClick={prev} disabled={actual === 0} aria-label="Anterior" style={{ background: 'none', border: 'none', padding: 2, cursor: actual === 0 ? 'default' : 'pointer', opacity: actual === 0 ? 0.3 : 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button type="button" onClick={next} disabled={actual === total - 1} aria-label="Siguiente" style={{ background: 'none', border: 'none', padding: 2, cursor: actual === total - 1 ? 'default' : 'pointer', opacity: actual === total - 1 ? 0.3 : 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>
      <div className="vl-slider-ventana" style={{ overflow: 'hidden', height: alto ?? 'auto', transition: 'height 350ms cubic-bezier(.4,0,.2,1)' }}>
        <div className="vl-slider-pista" style={{
          display: 'flex', alignItems: 'flex-start',
          transform: `translateX(-${actual * 100}%)`,
          transition: 'transform 450ms cubic-bezier(.4,0,.2,1)',
        }}>
          {reflexiones.map((r, i) => (
            <div key={r.id ?? i} ref={el => { slideRefs.current[i] = el; }} aria-hidden={i !== actual || undefined} style={{ flex: '0 0 100%', minWidth: 0 }}>
              <FichaSlider r={r} cita={cita} activo={i === actual} />
            </div>
          ))}
        </div>
      </div>
      {onVerCuaderno && (
        <button type="button" onClick={onVerCuaderno} style={{
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: GOLD_REF_DK,
          background: 'none', border: 'none', padding: '6px 0 0', cursor: 'pointer',
        }}>Ver todas en el cuaderno →</button>
      )}
    </div>
  );
}

function ResumenPersonal({ temperamento, pasos, completados, onVerCuaderno, ideasClave = [] }) {
  if (!temperamento) return null;
  const p = temperamento.primary;
  const s = temperamento.secondary;
  const perfil = s ? `${p}-${s}` : p;

  const retosStep = pasos.find(paso => paso.tipo === 'retos_temperamento');
  const retosHecho = retosStep && completados[retosStep.id];
  const fd = retosStep?.facilita_dificulta?.[p];
  const virtudDesafio = retosStep?.virtud_desafio_map?.[perfil] ?? retosStep?.virtud_desafio_map?.[p];

  const reflexiones = extraerReflexiones(pasos, completados);
  const ideas = ideasClave.filter(i => i.paso && completados[i.paso]).map((i, n) => ({ id: `idea-${n}`, texto: i.texto }));

  const proyectoStep = pasos.find(x => x.tipo === 'proyecto_mision');
  const proyectoData = proyectoStep && completados[proyectoStep.id];
  const declaracionMision = proyectoData?.respuestas?.declaracion?.[0]?.trim();
  const desafioMision = proyectoData?.respuestas?.desafio?.[0]?.trim();
  const talentoEsp = proyectoData?.respuestas?.talentos?.[6]?.trim();

  return (
    <div style={{ ...tarjeta, marginTop: 18 }}>
      <div style={eyebrow}>Mi perfil</div>

      {proyectoStep && (
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          {declaracionMision ? (
            <>
              <div style={{ padding: '14px 16px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}`, marginBottom: 8 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Mi misión</div>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, lineHeight: 1.4 }}>«{declaracionMision}»</div>
              </div>
              {desafioMision && (
                <div style={{ padding: '8px 16px', background: BEIGE, borderLeft: `2px solid ${GOLD_REF}`, marginBottom: 4 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Mi desafío</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY, lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{desafioMision}</div>
                </div>
              )}
              {talentoEsp && (
                <div style={{ padding: '8px 16px', background: BEIGE, borderLeft: `2px solid ${GOLD_REF}` }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Mi talento específico</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY, lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{talentoEsp}</div>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
              Tu misión aparecerá aquí cuando completes el plan.
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1, padding: '10px 12px', background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[p] ?? LINE}` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Primario</div>
          <div style={{ fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: NAVY, marginTop: 2 }}>{TEMP_NOMBRE[p]}</div>
        </div>
        {s && (
          <div style={{ flex: 1, padding: '10px 12px', background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[s] ?? LINE}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Secundario</div>
            <div style={{ fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: NAVY, marginTop: 2 }}>{TEMP_NOMBRE[s]}</div>
          </div>
        )}
      </div>

      {retosHecho && fd && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <div style={{ padding: '8px 10px', background: '#ecfdf5', borderLeft: '2px solid #10b981' }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Facilita</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: '#065f46', lineHeight: 1.4, marginTop: 2 }}>{fd.facilita}</div>
            </div>
            <div style={{ padding: '8px 10px', background: '#fef2f2', borderLeft: '2px solid #ef4444' }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dificulta</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: '#991b1b', lineHeight: 1.4, marginTop: 2 }}>{fd.dificulta}</div>
            </div>
          </div>

          {virtudDesafio && (
            <div style={{ padding: '10px 12px', background: BEIGE, borderLeft: `3px solid ${GOLD_REF}`, marginTop: 12 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mi virtud-desafío</div>
              <div style={{ fontFamily: FONT_SLAB, fontSize: 18, fontWeight: 700, color: NAVY, marginTop: 2 }}>{virtudDesafio}</div>
            </div>
          )}
        </>
      )}

      {(() => {
        const armoniaStep = pasos.find(x => x.tipo === 'armonia_temperamento');
        const armoniaData = armoniaStep?.temperamentos?.[p];
        const armoniaHecho = armoniaStep && completados[armoniaStep.id];
        const testCorazonStep = pasos.find(x => x.tipo === 'test_corazon');
        const testCorazonHecho = testCorazonStep && completados[testCorazonStep.id];
        const objStep = pasos.find(x => x.tipo === 'objetivos_corazon');
        const objHecho = objStep && completados[objStep.id];
        if (!armoniaData) return null;

        const disorderOrder = ['R', 'VR', 'VM', 'VI', 'VC', 'SV', 'SI', 'SC'];
        // El resultado del test viene del paso del test (cursos antiguos) o del proyecto final «Tu perfil del corazón».
        const resultadoCorazon = testCorazonHecho?.scoreResult ?? objHecho?.scoreResult;
        const topDisorders = resultadoCorazon?.disorders
          ? Object.entries(resultadoCorazon.disorders)
              .sort((a, b) => {
                const diff = (b[1].pct ?? 0) - (a[1].pct ?? 0);
                return diff !== 0 ? diff : disorderOrder.indexOf(a[0]) - disorderOrder.indexOf(b[0]);
              })
              .slice(0, 2)
          : [];

        return (
          <div style={{ marginTop: 16, borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
            <div style={{ padding: '10px 12px', background: BEIGE, borderLeft: `3px solid ${TEMP_COLORS[p] ?? LINE}`, marginBottom: 10 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mi tendencia</div>
              <div style={{ fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: NAVY, marginTop: 2 }}>{armoniaData.criatura}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginTop: 2 }}>Riesgo: {armoniaData.tendencia}</div>
            </div>
            {armoniaHecho && (
              <div style={{ padding: '8px 10px', background: BEIGE, borderLeft: `2px solid ${GOLD_REF}`, marginBottom: 10 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>La facultad que prevalece en mi vida</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY, lineHeight: 1.45 }}>
                  {armoniaStep.opciones?.find(o => o.valor === armoniaHecho.facultad)?.texto || armoniaHecho.facultad}
                </div>
              </div>
            )}
            {topDisorders.length > 0 && (
              <div style={{ padding: '8px 10px', background: BEIGE, borderLeft: `2px solid ${LINE}`, marginBottom: 10 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Mi Test del corazón</div>
                {topDisorders.map(([code, data]) => {
                  const fichaName = objStep?.fichas?.[code]?.nombre_test || code;
                  return (
                    <div key={code} style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY, lineHeight: 1.45 }}>{fichaName}: {data.pct ?? 0} %</div>
                  );
                })}
              </div>
            )}
            {objHecho && objHecho.objetivos && (
              <div style={{ padding: '8px 10px', background: BEIGE, borderLeft: `2px solid ${LINE}`, marginBottom: 10 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Mis objetivos prácticos</div>
                {Object.entries(objHecho.objetivos).map(([code, txt]) => {
                  const fichaName = objStep?.fichas?.[code]?.nombre_test || code;
                  return (
                    <div key={code} style={{ marginBottom: 4 }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: MUTED }}>{fichaName}</div>
                      <div style={{
                        fontFamily: FONT_BODY, fontSize: 13, color: NAVY, lineHeight: 1.45,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{txt}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {reflexiones.length > 0 && <SliderReflexiones reflexiones={reflexiones} onVerCuaderno={onVerCuaderno} />}
      {ideas.length > 0 && <SliderReflexiones reflexiones={ideas} etiqueta="Ideas clave del curso" cita />}
    </div>
  );
}

function ModalEditarPlan({ pantalla, datos, onGuardar, onCerrar }) {
  const [valor, setValor] = useState(datos);
  let editor = null;
  if (pantalla.tipo === 'tabla_dinamica') editor = <PantallaTablaDinamica pantalla={pantalla} datos={valor} onChange={setValor} />;
  else if (pantalla.tipo === 'checklist') editor = <PantallaChecklist pantalla={pantalla} datos={valor} onChange={setValor} />;
  else if (pantalla.tipo === 'checklist_categorias') editor = <PantallaChecklistCategorias pantalla={pantalla} datos={valor} onChange={setValor} />;
  else if (pantalla.tipo === 'reflexion_doble') editor = <PantallaReflexionDoble pantalla={pantalla} datos={valor} onChange={setValor} />;
  else if (pantalla.tipo === 'reflexion_temperamento') editor = <PantallaReflexionTemperamento pantalla={pantalla} datos={valor} onChange={setValor} />;
  else if (pantalla.tipo === 'proposito') editor = <PantallaProposito pantalla={pantalla} datos={valor} onChange={setValor} />;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'grid', placeItems: 'center',
      background: 'rgba(15,29,56,0.55)', backdropFilter: 'blur(4px)',
    }} onClick={onCerrar}>
      <div style={{
        background: PAPER, borderRadius: 0, maxWidth: 600, width: '92vw',
        maxHeight: '85vh', overflow: 'auto', padding: '28px 24px 20px',
        boxShadow: '0 12px 48px rgba(15,29,56,0.22)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>
          {pantalla.titulo}
        </h3>
        {editor}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={onCerrar} style={{
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: MUTED,
            background: 'none', border: `1px solid ${LINE}`, padding: '10px 20px', cursor: 'pointer',
          }}>Cancelar</button>
          <button type="button" onClick={() => onGuardar(valor)} style={{
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: '#fff',
            background: GOLD_REF, border: 'none', padding: '10px 24px', cursor: 'pointer',
          }}>Guardar</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function VistaResumenPlan({ paso, userId, onVolver, completados, cursoNum }) {
  const [plan, setPlan] = useState(() => {
    const bd = completados?.[paso.id];
    if (bd && typeof bd === 'object') {
      // Se guarda como { plan: {...} }; versiones antiguas, con las claves sueltas.
      const { fecha, aprobado, plan: anidado, ...sueltas } = bd;
      const rest = anidado && typeof anidado === 'object' ? { ...sueltas, ...anidado } : sueltas;
      if (Object.keys(rest).length > 0) return rest;
    }
    let data = leerPlan(userId);
    if (userId !== 'anon' && (!data || Object.keys(data).length === 0)) {
      data = leerPlan('anon');
    }
    return data;
  });
  const [editIdx, setEditIdx] = useState(null);
  const pantallas = paso.pantallas ?? [];
  const hayDatos = pantallas.some(p => p.tipo !== 'texto' && p.tipo !== 'resumen' && plan[p.id]);

  function handleGuardar(valor) {
    const pant = pantallas[editIdx];
    const next = { ...plan, [pant.id]: valor };
    setPlan(next);
    guardarPlan(userId, next);
    if (userId !== 'anon' && cursoNum != null) {
      supabase.from('respuestas').upsert({
        user_id: userId,
        contenido_id: paso.id,
        curso: cursoNum,
        modulo: paso.modulo ?? 0,
        respuesta: { plan: next }, // mismo formato que al completarlo (Mi perfil lee datos.plan)
        aprobado: true,
        completado: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, contenido_id' }).then(({ error }) => {
        if (error) console.warn('[plan] Error guardando edición:', error.message);
      });
    }
    setEditIdx(null);
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <button type="button" onClick={onVolver} style={{
        fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: GOLD_REF_DK,
        background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 16,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        ← Volver al curso
      </button>
      <div style={tarjeta}>
        <h2 style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>
          Tu Plan de Crecimiento
        </h2>
        {hayDatos
          ? <PantallaResumen paso={paso} plan={plan} onEditar={setEditIdx} />
          : <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, lineHeight: 1.6 }}>Aún no has completado el plan de crecimiento. Complétalo primero en el curso.</p>
        }
      </div>
      {editIdx != null && pantallas[editIdx] && (
        <ModalEditarPlan
          pantalla={pantallas[editIdx]}
          datos={plan[pantallas[editIdx].id]}
          onGuardar={handleGuardar}
          onCerrar={() => setEditIdx(null)}
        />
      )}
    </div>
  );
}

const TIPOS_EXCLUIR_CUADERNO = new Set(['video', 'quiz', 'conclusion_modulo', 'noop', 'plan_crecimiento', 'test_caracter', 'temperamento_perfil', 'reflexion_guiada', 'circulo_personas', 'lectura']);

function tieneDatos(datos) {
  if (!datos) return false;
  const keys = Object.keys(datos).filter(k => k !== 'fecha' && k !== 'aprobado');
  if (keys.length === 0) return false;
  if (keys.length === 1 && (datos.completado || datos.visto)) return false;
  if (keys.every(k => k === 'visto' || datos[k] === '' || datos[k] === null || datos[k] === undefined)) return false;
  return true;
}

function resumenEjercicio(paso) {
  switch (paso.tipo) {
    case 'define': return 'Asocia cada concepto con su definición correcta.';
    case 'desliza': return 'Identifica el temperamento que mejor encaja con cada situación.';
    case 'identifica': return 'Reflexiona sobre qué virtudes te resultan fáciles y cuáles te cuestan.';
    case 'test_profundo': return 'Responde a las señales concretas de este temperamento en tu vida.';
    case 'retos_temperamento': return 'Reflexión sobre lo que tu temperamento facilita y dificulta.';
    case 'temperamento_magnanimidad': return 'Cómo tu temperamento influye en la práctica de la magnanimidad.';
    case 'armonia_temperamento': return 'Tu temperamento y la facultad que prevalece en tu vida.';
    case 'objetivos_corazon': return 'Tus objetivos prácticos según el Test del corazón.';
    case 'test_corazon': return 'Tu resultado del Test del corazón.';
    case 'cierre': return 'Síntesis del curso: tu virtud desafío y tu propósito.';
    case 'reflexion_piramide': return 'Reflexión guiada sobre los conceptos del módulo.';
    case 'proyecto_mision': return 'Tu plan: tu historia, tus talentos y tu misión.';
    default: return 'Ejercicio completado.';
  }
}

function resumenCorto(paso, datos) {
  if (paso.tipo === 'define') return `${datos.aciertos} de ${datos.total} aciertos`;
  if (paso.tipo === 'desliza') return `${datos.aciertos} de ${datos.total} aciertos`;
  if (paso.tipo === 'test_profundo') { const r = datos.respuestas ?? []; const n = r.filter(x => x && x.trim()).length; return `${n} respuesta${n !== 1 ? 's' : ''}`; }
  if (paso.tipo === 'identifica') { const r = datos.respuestas ?? []; const n = r.filter(x => x && (x.facil || x.dificil)).length; return `${n} virtud${n !== 1 ? 'es' : ''} valorada${n !== 1 ? 's' : ''}`; }
  if (paso.tipo === 'proyecto_mision') { const r = datos.respuestas ?? {}; const n = Object.values(r).flat().filter(x => x && x.trim()).length; return `${n} respuesta${n !== 1 ? 's' : ''}`; }
  return null;
}

function moduloDeEjercicio(pasos, pasoId) {
  const idx = pasos.findIndex(p => p.id === pasoId);
  const modHeaders = pasos.filter(p => p.tipo === 'video' && !p.continua_modulo);
  for (let i = idx - 1; i >= 0; i--) {
    if (pasos[i].tipo === 'video' && !pasos[i].continua_modulo) {
      return modHeaders.indexOf(pasos[i]) + 1;
    }
  }
  return null;
}

function CuadernoDetails({ children, ...props }) {
  return (
    <>
      <style>{`
        .vl-cuad-det { border-top: 1px solid ${LINE}; }
        .vl-cuad-det .vl-cuad-chev { transform: rotate(0deg); }
        .vl-cuad-det[open] .vl-cuad-chev { transform: rotate(180deg); }
      `}</style>
      <details className="vl-cuad-det" {...props}>{children}</details>
    </>
  );
}

const ETIQUETA_TIPO_CUADERNO = { video: 'Vídeo', quiz: 'Cuestionario', define: 'Definiciones', desliza: 'Identifica temperamentos', identifica: 'Diagrama', reflexion_piramide: 'Reflexión', test_profundo: 'Autoexamen', retos_temperamento: 'Retos', temperamento_magnanimidad: 'Temperamento', test_caracter: 'Test de carácter', test_corazon: 'Test del corazón', armonia_temperamento: 'Armonía', objetivos_corazon: 'Objetivos', proyecto_mision: 'Proyecto', intro: 'Introducción', conclusion_modulo: 'Conclusión', lectura: 'Lectura' };

function formatFechaNota(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function VistaCuaderno({ pasos, completados, onVolver, onIrA, onEditar, userId, moduloId, temperamento }) {
  const entradas = pasos.filter(p => !TIPOS_EXCLUIR_CUADERNO.has(p.tipo));
  const [tab, setTab] = useState('ejercicios');
  const notasHook = useNotas(userId, moduloId);

  const pasosMap = {};
  for (const p of pasos) pasosMap[p.id] = p;

  const modHeaders = pasos.filter(p => p.tipo === 'video' && !p.continua_modulo);

  function modNumDePaso(pasoId) {
    const idx = pasos.findIndex(p => p.id === pasoId);
    for (let i = idx - 1; i >= 0; i--) {
      if (pasos[i].tipo === 'video' && !pasos[i].continua_modulo) {
        return modHeaders.indexOf(pasos[i]) + 1;
      }
    }
    const p = pasosMap[pasoId];
    if (p && p.tipo === 'video' && !p.continua_modulo) return modHeaders.indexOf(p) + 1;
    return null;
  }

  const notasAgrupadas = (() => {
    const grupos = {};
    for (const [pasoId, lista] of Object.entries(notasHook.notas)) {
      const mn = modNumDePaso(pasoId) ?? 0;
      if (!grupos[mn]) grupos[mn] = [];
      for (const nota of lista) {
        grupos[mn].push({ ...nota, _pasoId: pasoId });
      }
    }
    const sorted = Object.entries(grupos).sort((a, b) => Number(a[0]) - Number(b[0]));
    return sorted.map(([mn, notas]) => ({
      modulo: Number(mn),
      titulo: mn > 0 ? modHeaders[Number(mn) - 1]?.nombre || `Módulo ${mn}` : 'General',
      notas: notas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
    }));
  })();

  const totalNotas = Object.values(notasHook.notas).reduce((s, arr) => s + arr.length, 0);

  const tabStyle = (active) => ({
    fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
    color: active ? NAVY : MUTED, background: 'none',
    border: 'none', borderBottom: active ? `2px solid ${GOLD_REF}` : '2px solid transparent',
    padding: '10px 20px', cursor: 'pointer',
    transition: 'color 200ms, border-color 200ms',
  });

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {onVolver && (
        <button type="button" onClick={onVolver} style={{
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: GOLD_REF_DK,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 16,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          ← Volver al curso
        </button>
      )}
      <div style={tarjeta}>
        {onVolver && (
          <h2 style={{ fontFamily: FONT_SLAB, fontSize: 24, fontWeight: 700, color: NAVY, margin: '0 0 0' }}>
            Tu cuaderno personal
          </h2>
        )}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${LINE}`, marginBottom: 16, marginTop: 8 }}>
          <button type="button" onClick={() => setTab('ejercicios')} style={tabStyle(tab === 'ejercicios')}>Ejercicios</button>
          <button type="button" onClick={() => setTab('notas')} style={tabStyle(tab === 'notas')}>
            Bloc de notas
          </button>
        </div>

        {tab === 'ejercicios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {entradas.map(paso => {
              const datos = completados[paso.id];
              const hecho = datos && tieneDatos(datos);
              const modNum = moduloDeEjercicio(pasos, paso.id);

              if (hecho) {
                const corto = resumenCorto(paso, datos);
                return (
                  <CuadernoDetails key={paso.id}>
                    <summary style={{ padding: '14px 0', cursor: 'pointer', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IconoChevron width={14} height={14} className="vl-cuad-chev" style={{ color: MUTED, flexShrink: 0, transition: 'transform 200ms ease' }} />
                        <span style={{ fontFamily: FONT_SLAB, fontSize: 15, fontWeight: 700, color: NAVY, flex: 1, minWidth: 0 }}>{paso.titulo || paso.tipo}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <IconoCheck width={12} height={12} style={{ color: GOLD_REF }} />
                            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD_REF_DK, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completado</span>
                          </span>
                          {onEditar && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); onEditar(paso.id); }} title="Editar" style={{
                              background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: MUTED, flexShrink: 0,
                            }}>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
                                <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M9.5 3.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                              </svg>
                            </button>
                          )}
                        </span>
                      </div>
                      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, lineHeight: 1.4, margin: 0 }}>
                        {modNum && <span>Módulo {modNum}</span>}
                        {modNum && corto && <span> · </span>}
                        {corto && <span>{corto}</span>}
                      </p>
                      <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, lineHeight: 1.4, margin: 0 }}>{resumenEjercicio(paso)}</p>
                    </summary>
                    <div style={{ padding: '0 0 16px 0' }}>
                      <RespuestasCuaderno paso={paso} datos={datos} />
                    </div>
                  </CuadernoDetails>
                );
              }

              return (
                <div key={paso.id} style={{ borderTop: `1px solid ${LINE}`, padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 4, opacity: 0.55 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: FONT_SLAB, fontSize: 15, fontWeight: 700, color: NAVY, flex: 1, minWidth: 0 }}>{paso.titulo || paso.tipo}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pendiente</span>
                      {onIrA && <button type="button" onClick={() => onIrA(paso.id)} style={{
                        fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: GOLD_REF_DK,
                        background: 'none', border: `1px solid ${GOLD_REF}`, borderRadius: 0,
                        padding: '4px 12px', cursor: 'pointer', opacity: 1,
                      }}>Ir al ejercicio</button>}
                    </span>
                  </div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, lineHeight: 1.4, margin: 0 }}>
                    {modNum && <span>Módulo {modNum}</span>}
                  </p>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, lineHeight: 1.4, margin: 0 }}>{resumenEjercicio(paso)}</p>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'notas' && (
          <div>
            {totalNotas === 0 ? (
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                Aún no has escrito ninguna nota. Puedes añadir notas mientras ves los vídeos o realizas los ejercicios.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {notasAgrupadas.map(grupo => (
                  <div key={grupo.modulo}>
                    <div style={{ fontFamily: FONT_SLAB, fontSize: 13, fontWeight: 700, color: GOLD_REF_DK, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 0 8px', borderTop: `1px solid ${LINE}` }}>
                      {grupo.modulo > 0 ? `Módulo ${grupo.modulo}` : 'General'}
                    </div>
                    {grupo.notas.map(nota => {
                      const paso = pasosMap[nota._pasoId];
                      const tipoLabel = paso ? (ETIQUETA_TIPO_CUADERNO[paso.tipo] ?? 'Ejercicio') : 'Nota';
                      return (
                        <div key={nota.id} style={{ padding: '10px 0', borderTop: `1px solid ${LINE}20`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700, color: GOLD_REF_DK, textTransform: 'uppercase', letterSpacing: '0.06em', background: `${GOLD_REF}18`, padding: '2px 8px' }}>
                              {tipoLabel}
                            </span>
                            <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY, flex: 1, minWidth: 0 }}>
                              {paso?.titulo || paso?.nombre || ''}
                            </span>
                            {onIrA && paso && (
                              <button type="button" onClick={() => onIrA(nota._pasoId)} style={{
                                fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: GOLD_REF_DK,
                                background: 'none', border: `1px solid ${GOLD_REF}`, borderRadius: 0,
                                padding: '3px 10px', cursor: 'pointer', flexShrink: 0,
                              }}>Ir →</button>
                            )}
                          </div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: notaAHtml(nota.texto) }} />
                          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: MUTED }}>
                            {nota.fecha ? formatFechaNota(nota.fecha) : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {onVolver && (
        <div style={{ marginTop: 18 }}>
          <CuadernoPersonal userId={userId} pasos={pasos} temperamento={temperamento} moduloId={moduloId} />
        </div>
      )}
    </div>
  );
}

function RespuestasCuaderno({ paso, datos }) {
  if (!datos) return null;

  if (paso.tipo === 'define') {
    const conceptos = paso.conceptos ?? [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, margin: 0 }}>
          Resultado: <strong>{datos.aciertos}</strong> de {datos.total} aciertos
        </p>
        {conceptos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {conceptos.map((c, i) => (
              <div key={i} style={{ paddingLeft: 16 }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY, margin: '0 0 2px' }}>{c.concepto}</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, lineHeight: 1.5, margin: 0 }}>{c.definicion}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (paso.tipo === 'test_profundo') {
    const preguntas = paso.preguntas ?? paso.senales ?? [];
    const respuestas = datos.respuestas ?? [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {preguntas.map((pregunta, i) => (
          <div key={i}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY, margin: '0 0 2px' }}>
              {i + 1}. {pregunta.texto ?? pregunta}
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: respuestas[i] ? NAVY : MUTED, lineHeight: 1.6, margin: 0, paddingLeft: 16, fontStyle: respuestas[i] ? 'normal' : 'italic' }}>
              {respuestas[i] || 'Sin respuesta'}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (paso.tipo === 'identifica') {
    const virtudes = paso.virtudes ?? [];
    const respuestas = datos.respuestas ?? [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {virtudes.map((v, i) => {
          const r = respuestas[i];
          if (!r) return null;
          return (
            <div key={i}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY, margin: '0 0 4px' }}>{v.nombre}</p>
              {r.facil && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: '0 0 2px', paddingLeft: 16 }}><span style={{ color: MUTED, fontSize: 12 }}>Lo que me resulta fácil:</span> {r.facil}</p>}
              {r.ejemploFacil && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: '0 0 2px', paddingLeft: 16 }}><span style={{ color: MUTED, fontSize: 12 }}>Ejemplo:</span> {r.ejemploFacil}</p>}
              {r.dificil && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: '0 0 2px', paddingLeft: 16 }}><span style={{ color: MUTED, fontSize: 12 }}>Lo que me cuesta:</span> {r.dificil}</p>}
              {r.ejemploDificil && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: '0 0 2px', paddingLeft: 16 }}><span style={{ color: MUTED, fontSize: 12 }}>Ejemplo:</span> {r.ejemploDificil}</p>}
            </div>
          );
        })}
      </div>
    );
  }

  if (paso.tipo === 'retos_temperamento') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {datos.textoFacilita && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Lo que mi temperamento facilita:</span> {datos.textoFacilita}</p>}
        {datos.textoDificulta && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Lo que mi temperamento dificulta:</span> {datos.textoDificulta}</p>}
        {datos.textoDefectos && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Mis defectos dominantes:</span> {datos.textoDefectos}</p>}
      </div>
    );
  }

  if (paso.tipo === 'temperamento_magnanimidad') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {datos.textoFuerte && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Lo que mi temperamento facilita:</span> {datos.textoFuerte}</p>}
        {datos.textoDebil && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Lo que me cuesta más:</span> {datos.textoDebil}</p>}
        {datos.textoFuerteSec && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Mi temperamento secundario facilita:</span> {datos.textoFuerteSec}</p>}
        {datos.textoDebilSec && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Mi temperamento secundario dificulta:</span> {datos.textoDebilSec}</p>}
      </div>
    );
  }

  if (paso.tipo === 'armonia_temperamento') {
    const opciones = paso.opciones ?? [];
    const elegida = opciones.find(o => o.valor === datos.facultad);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {elegida && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>La facultad que prevalece en mi vida:</span> {elegida.texto}</p>}
      </div>
    );
  }

  if (paso.tipo === 'objetivos_corazon') {
    const codigos = datos.codigos ?? [];
    const objetivos = datos.objetivos ?? {};
    const fichas = paso.fichas ?? {};
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {codigos.map(cod => (
          <div key={cod}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY, margin: '0 0 2px' }}>{fichas[cod]?.nombre_test ?? cod}</p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0, paddingLeft: 16, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {objetivos[cod] || <span style={{ color: MUTED, fontStyle: 'italic' }}>Sin objetivos</span>}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (paso.tipo === 'test_corazon') {
    const disorders = datos.scoreResult?.disorders ?? {};
    const ORDER = ['R', 'VR', 'VM', 'VI', 'VC', 'SV', 'SI', 'SC'];
    const NOMBRES = { R: 'Racionalismo', VR: 'Vol. religioso', VM: 'Vol. machista', VI: 'Vol. ideológico', VC: 'Vol. conformista', SV: 'Sent. voluptuoso', SI: 'Sent. demente', SC: 'Sent. cobarde' };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ORDER.map(cod => {
          const d = disorders[cod];
          if (!d) return null;
          return (
            <div key={cod} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY }}>{NOMBRES[cod]}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY }}>{d.pct} %</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (paso.tipo === 'cierre') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {datos.lo_que_facilita && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Lo que facilita mi temperamento:</span> {datos.lo_que_facilita}</p>}
        {datos.lo_que_cuesta && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Lo que me cuesta:</span> {datos.lo_que_cuesta}</p>}
        {datos.virtud_desafio && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Mi virtud desafío:</span> {datos.virtud_desafio}</p>}
        {datos.proposito && <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}><span style={{ color: MUTED, fontSize: 12 }}>Mi propósito:</span> {datos.proposito}</p>}
      </div>
    );
  }

  if (paso.tipo === 'reflexion_piramide') {
    const preguntas = paso.preguntas ?? [];
    const respuestas = datos.respuestas ?? [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {preguntas.map((pregunta, i) => (
          <div key={i}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY, margin: '0 0 2px' }}>
              {i + 1}. {pregunta.texto ?? pregunta}
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: respuestas[i] ? NAVY : MUTED, lineHeight: 1.6, margin: 0, paddingLeft: 16, fontStyle: respuestas[i] ? 'normal' : 'italic' }}>
              {respuestas[i] || 'Sin respuesta'}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (paso.tipo === 'desliza') {
    const NOMBRE_TEMP = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };
    const escenas = paso.escenas ?? [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, margin: 0 }}>
          Resultado: <strong>{datos.aciertos}</strong> de {datos.total} aciertos
        </p>
        {escenas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {escenas.map((e, i) => (
              <div key={i} style={{ paddingLeft: 16 }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY, lineHeight: 1.5, margin: 0 }}>
                  {e.texto?.substring(0, 120)}{e.texto?.length > 120 ? '…' : ''}
                </p>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: MUTED, margin: '2px 0 0' }}>Respuesta: {NOMBRE_TEMP[e.respuesta] ?? e.respuesta}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (paso.tipo === 'proyecto_mision') {
    const secciones = paso.secciones ?? [];
    const respuestas = datos.respuestas ?? {};
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {secciones.map(sec => {
          const resps = respuestas[sec.id] ?? [];
          const hayResp = resps.some(r => r?.trim());
          if (!hayResp) return null;
          return (
            <div key={sec.id}>
              <p style={{ fontFamily: FONT_SLAB, fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>{sec.titulo}</p>
              {sec.preguntas.map((preg, pi) => {
                if (!resps[pi]?.trim()) return null;
                return (
                  <div key={pi} style={{ marginBottom: 8, paddingLeft: 16 }}>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY, margin: '0 0 2px' }}>{preg.texto}</p>
                    <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.6, margin: 0 }}>{resps[pi]}</p>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  const keys = Object.keys(datos).filter(k => k !== 'fecha' && k !== 'aprobado' && k !== 'completado' && k !== 'visto');
  if (keys.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {keys.map(k => {
          const v = datos[k];
          if (v === null || v === undefined || v === '' || v === true || v === false) return null;
          const label = k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
          return (
            <p key={k} style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, margin: 0 }}>
              <span style={{ color: MUTED, fontSize: 12 }}>{label}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </p>
          );
        })}
      </div>
    );
  }

  return null;
}

function VistaListado({ modulo, pasos, visibles, completados, irA, cursoNum = 1, userId, temperamento }) {
  const [verPlan, setVerPlan] = useState(false);
  const [verCuaderno, setVerCuaderno] = useState(false);
  const progAll = progresoModulo(pasos, completados);
  const progMods = modulosCompletados(pasos, completados);
  const vidsHechos = progMods.hechos;
  const vidsPct = progMods.porcentaje;
  const cont = continuarModulo(pasos, completados);

  const planStep = pasos.find(p => p.tipo === 'plan_crecimiento');
  const planHecho = planStep ? Boolean(completados[planStep.id]) : false;
  const cierreStep = pasos.find(p => p.tipo === 'cierre' && p.visible !== false);
  const cierreHecho = cierreStep ? Boolean(completados[cierreStep.id]) : false;

  if (verPlan && planStep) {
    return <VistaResumenPlan paso={planStep} userId={userId} onVolver={() => setVerPlan(false)} completados={completados} cursoNum={cursoNum} />;
  }

  if (verCuaderno) {
    return <VistaCuaderno pasos={pasos} completados={completados} onVolver={() => setVerCuaderno(false)} onIrA={(pasoId) => { setVerCuaderno(false); irA(pasoId); }} onEditar={(pasoId) => { setVerCuaderno(false); irA(pasoId); }} userId={userId} moduloId={modulo.id} temperamento={temperamento} />;
  }

  return (
    <div className="vl-listado" style={{ margin: '0 auto' }}>
      <style>{`
        .vl-listado { display: grid; grid-template-columns: 1fr; gap: 0; max-width: 860px; }
        @media (min-width: 768px) {
          .vl-listado { grid-template-columns: 2fr 3fr; gap: 36px; max-width: none; }
          .vl-listado-izq, .vl-listado-der { position: sticky; top: 60px; align-self: start; min-width: 0; }
        }
      `}</style>

      <div className="vl-listado-izq">
        <Link to="/app/formacion" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: GOLD_REF_DK, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          ← Toda la formación
        </Link>
        <div style={eyebrow}>Curso {cursoNum}</div>
        <h1 style={{ ...titulo(28), margin: '8px 0 10px' }}>{modulo.titulo}</h1>
        <p style={{ ...parrafo, marginBottom: 24 }}>{modulo.descripcion}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 8 }}>
          <svg width={72} height={72} viewBox="0 0 72 72" role="img" aria-label={`${vidsPct}% completado`}>
            <circle cx={36} cy={36} r={28} fill="none" stroke="rgba(27,42,74,0.10)" strokeWidth="5" />
            <circle cx={36} cy={36} r={28} fill="none" stroke={GOLD_REF_DK} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(2 * Math.PI * 28 * vidsPct) / 100} ${2 * Math.PI * 28}`}
                    transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 600ms ease' }} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontFamily={FONT_SLAB} fontSize="18" fontWeight="700" fill={NAVY}>{vidsPct}%</text>
          </svg>
          <div>
            <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY }}>{vidsHechos} de {progMods.total} módulos</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED, marginTop: 2 }}>
              {progAll.completo ? 'Curso completado' : 'En progreso'}
            </div>
          </div>
        </div>

        {temperamento && (
          <ResumenPersonal temperamento={temperamento} pasos={pasos} completados={completados} onVerCuaderno={() => setVerCuaderno(true)} ideasClave={modulo?.ideas_clave} />
        )}

        {userId && (
          <div style={{ marginTop: 18 }}>
            <button type="button" onClick={() => setVerCuaderno(true)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
                color: GOLD_REF_DK, background: 'none',
                border: `1.5px solid ${GOLD_REF}`, borderRadius: 0,
                padding: '10px 20px', cursor: 'pointer',
                transition: 'border-color 200ms ease, color 200ms ease',
                letterSpacing: '0.02em', width: '100%', justifyContent: 'center',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Ver cuaderno personal
            </button>
            {planStep && (
              <button type="button" onClick={() => setVerPlan(true)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
                color: GOLD_REF_DK, background: 'none',
                border: `1.5px solid ${GOLD_REF}`, borderRadius: 0,
                padding: '10px 20px', cursor: 'pointer',
                transition: 'border-color 200ms ease, color 200ms ease',
                letterSpacing: '0.02em', width: '100%', justifyContent: 'center', marginTop: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Ver plan de crecimiento
              </button>
            )}
          </div>
        )}
      </div>

      <div className="vl-listado-der">
        {(progAll.completo || !cont) && (
          <section style={{ background: heroFondo, color: PAPER, borderRadius: 0, padding: 18, marginBottom: 18, boxShadow: '0 8px 24px rgba(15,29,56,0.22)' }}>
            <div style={{ ...eyebrow, color: GOLD_REF_LT, marginBottom: 8 }}>
              Has finalizado este curso
            </div>
            <Link to={cursoNum < 7 ? `/app/formacion/curso-${cursoNum + 1}` : '/app/formacion'} style={{
              boxSizing: 'border-box', width: '100%', cursor: 'pointer', textDecoration: 'none', color: PAPER,
              display: 'flex', gap: 14, alignItems: 'center',
            }}>
              <span style={{
                flex: '0 0 48px', height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: 'rgba(255,255,255,0.15)',
              }}>
                <IconoCheck width={22} height={22} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 19, fontWeight: 600, lineHeight: 1.2 }}>
                  {cursoNum < 7 ? `Continúa con el Curso ${cursoNum + 1}` : 'Volver a la formación'}
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, opacity: 0.72, marginTop: 4 }}>Curso {cursoNum} completado</div>
              </div>
            </Link>
          </section>
        )}
        {cont && !progAll.completo && (
          <section style={{ background: heroFondo, color: PAPER, borderRadius: 0, padding: 18, marginBottom: 18, boxShadow: '0 8px 24px rgba(15,29,56,0.22)' }}>
            <div style={{ ...eyebrow, color: GOLD_REF_LT, marginBottom: 8 }}>
              {vidsHechos > 0 ? 'Continúa donde lo dejaste' : 'Empieza aquí'}
            </div>
            <button type="button" onClick={() => irA(cont.id)} style={{
              all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
              display: 'flex', gap: 14, alignItems: 'center',
            }}>
              <span style={{
                flex: '0 0 48px', height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: 'rgba(255,255,255,0.15)',
              }}>
                <IconoPlay width={22} height={22} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 19, fontWeight: 600, lineHeight: 1.2 }}>{cont.titulo}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, opacity: 0.72, marginTop: 4 }}>{cont.tipo === 'video' ? 'Vídeo' : cont.tipo === 'cierre' ? 'Conclusiones' : cont.tipo === 'conclusion_modulo' ? 'Resumen del módulo' : cont.tipo === 'reflexion_guiada' ? 'Reflexión' : cont.tipo === 'plan_crecimiento' ? 'Plan de crecimiento' : 'Actividad'}</div>
              </div>
            </button>
          </section>
        )}

        <ListaLecciones pasos={pasos} completados={completados} irA={irA} temperamento={temperamento} />

        {planStep && (
          <section style={{ marginTop: 18 }}>
            <button type="button" onClick={() => irA(planStep.id)} style={{
              all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
              ...tarjeta, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{
                flex: '0 0 32px', height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: planHecho ? GOLD_REF : 'transparent',
                border: planHecho ? 'none' : `1.5px solid ${LINE}`,
                color: planHecho ? '#fff' : NAVY,
                fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700,
              }}>
                {planHecho ? <IconoCheck width={16} height={16} /> : '✦'}
              </span>
              <div>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: NAVY }}>{planStep.titulo}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 }}>
                  {planHecho ? 'Completado' : 'Plan de crecimiento'}
                </div>
              </div>
            </button>
          </section>
        )}

        {cierreStep && (
          <section style={{ marginTop: 18 }}>
            <button type="button" onClick={() => irA(cierreStep.id)} style={{
              all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer',
              ...tarjeta, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{
                flex: '0 0 32px', height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: cierreHecho ? GOLD_REF : 'transparent',
                border: cierreHecho ? 'none' : `1.5px solid ${LINE}`,
                color: cierreHecho ? '#fff' : NAVY,
                fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700,
              }}>
                {cierreHecho ? <IconoCheck width={16} height={16} /> : '✦'}
              </span>
              <div>
                <div style={{ fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: NAVY }}>{cierreStep.titulo}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: MUTED, marginTop: 2 }}>
                  {cierreHecho ? 'Completado' : 'Síntesis del curso'}
                </div>
              </div>
            </button>
          </section>
        )}

      </div>
    </div>
  );
}

export default function Modulo() {
  const { user } = useOutletContext();
  const { cursoId = 'curso-1' } = useParams();
  const [moduloData, setModuloData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const cat = useCatalogo();

  useEffect(() => {
    const loader = MODULOS[cursoId];
    if (loader) {
      setCargando(true);
      loader().then((m) => { setModuloData(m.default ?? m); setCargando(false); });
      return;
    }
    if (cat.cargando) return;
    const num = parseInt(cursoId.replace('curso-', ''), 10);
    const curso = cat.cursos?.find((c) => c.numero === num);
    if (curso) {
      setModuloData(catalogoAModulo(curso));
    } else {
      setModuloData(null);
    }
    setCargando(false);
  }, [cursoId, cat.cargando, cat.cursos]);

  if (cargando || cat.cargando) {
    return (
      <section style={tarjeta}>
        <div style={eyebrow}>Curso</div>
        <p style={{ ...parrafo, marginTop: 10 }}>Cargando…</p>
      </section>
    );
  }

  if (!moduloData) {
    return (
      <section style={tarjeta}>
        <div style={eyebrow}>Curso no encontrado</div>
        <p style={{ ...parrafo, marginTop: 10 }}>Este curso aún no está disponible.</p>
        <Link to="/app/formacion" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: GOLD_REF_DK, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>← Toda la formación</Link>
      </section>
    );
  }

  return <ModuloContenido moduloData={moduloData} user={user} cursoId={cursoId} />;
}

function ModuloContenido({ moduloData, user, cursoId }) {
  const cursoNum = moduloData.curso != null ? moduloData.curso : (parseInt(cursoId.replace('curso-', ''), 10) || 1);
  const progreso = useModuloProgreso(user.id, moduloData.id, cursoNum);
  const notasHook = useNotas(user.id, moduloData.id);
  const [temp, setTemp] = useState(undefined);
  const location = useLocation();

  useEffect(() => {
    let vivo = true;
    fetchLatestTemperament()
      .then((f) => { if (vivo) setTemp(mapTemp(f?.result)); })
      .catch(() => { if (vivo) setTemp(null); });
    return () => { vivo = false; };
  }, []);

  const temperamento = temp ?? null;
  const pasos = pasosDelUsuario(moduloData, temperamento);
  const visibles = pasosVisibles(pasos);
  const pasoActualId = progreso.pasoActual;
  const pasoActual = pasoActualId ? pasos.find((p) => p.id === pasoActualId) : null;

  useEffect(() => {
    const hash = location.hash?.replace('#', '');
    if (hash && pasos.some(p => p.id === hash)) {
      progreso.irA(hash, pasos.length);
      window.history.replaceState(null, '', location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function irA(pasoId) {
    progreso.irA(pasoId, pasos.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function avanzar() {
    if (!pasoActual) return;
    const sig = siguientePaso(pasos, pasoActual.id);
    if (sig) {
      irA(sig.id);
    } else {
      progreso.irA(null, pasos.length);
    }
  }

  function retroceder() {
    if (!pasoActual) return;
    const ant = pasoAnterior(pasos, pasoActual.id);
    if (ant) irA(ant.id);
  }

  function volver() {
    progreso.irA(null, pasos.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function rewind() {
    if (!pasoActual) return volver();
    if (pasoActual.tipo === 'video') return volver();
    const vid = videoAnterior(pasos, pasoActual.id);
    if (vid) {
      irA(vid.id);
    } else {
      volver();
    }
  }

  if (temp === undefined) {
    return (
      <section style={tarjeta}>
        <div style={eyebrow}>Curso {cursoNum}</div>
        <p style={{ ...parrafo, marginTop: 10 }}>Cargando…</p>
      </section>
    );
  }

  if (pasoActual) {
    if (pasoActual.tipo === 'video') {
      const videosPasos = pasos.filter((p) => p.tipo === 'video');
      return <PasoVideo paso={pasoActual} pasos={pasos} progreso={progreso} temperamento={temperamento} avanzar={avanzar} retroceder={pasoAnterior(pasos, pasoActual.id) ? retroceder : null} volver={volver} cursoNum={cursoNum} notasProps={{ videos: videosPasos, completados: progreso.completados, notas: notasHook.notas, onAgregar: notasHook.agregar, onEliminar: notasHook.eliminar, onEditar: notasHook.editar, pasos }} />;
    }
    const esProyectoFinal = pasoActual.proyecto_final;
    const videoCtx = esProyectoFinal ? null : videoAnterior(pasos, pasoActual.id);
    const videoCtxMod = videoCtx ? moduloDelPaso(pasos, videoCtx.id) : null;
    const videosPasos = pasos.filter((p) => p.tipo === 'video');

    return (
      <div className="vl-ejercicio-split" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{`@media (min-width: 1100px) { .vl-ejercicio-split { display: grid !important; grid-template-columns: minmax(0, 2.2fr) minmax(300px, 1fr); gap: 24px !important; align-items: start; } .vl-ejercicio-split > .vl-split-back { grid-column: 1 / -1; } .vl-ejercicio-split > .vl-split-notas-col { position: sticky; top: 60px; } }`}</style>
        <button type="button" className="vl-split-back" onClick={esProyectoFinal ? volver : rewind} style={{
          justifySelf: 'start', alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: NAVY, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, marginBottom: -10,
        }}>
          ← {esProyectoFinal ? 'Salir al curso' : (videoCtx ? 'Atrás' : 'Salir al curso')}
        </button>
        <div className="vl-split-contenido" style={{ minWidth: 0 }}>
          <PasoActividad paso={pasoActual} pasos={pasos} temperamento={temperamento} progreso={progreso} avanzar={avanzar} volver={esProyectoFinal ? volver : rewind} user={user} irA={irA} cursoNum={cursoNum} />
        </div>
        <ColumnaNotas>
          {videoCtx && (
            <section style={tarjeta}>
              <div style={eyebrow}>{videoCtxMod?.introduccion ? 'Introducción' : `Módulo ${videoCtxMod?.numero ?? 1}`}</div>
              <h2 style={{ ...titulo(26), margin: '8px 0 6px' }}>{videoCtx.titulo}</h2>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: GOLD_REF_DK, fontWeight: 600, marginTop: 6 }}>
                {etiquetaPaso(pasoActual)}
              </div>
            </section>
          )}
          <BlocDeNotas videos={videosPasos} completados={progreso.completados} pasoActualId={pasoActual.id} notas={notasHook.notas} onAgregar={notasHook.agregar} onEliminar={notasHook.eliminar} onEditar={notasHook.editar} pasos={pasos} />
        </ColumnaNotas>
      </div>
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

export { VistaCuaderno, RespuestasCuaderno, TIPOS_EXCLUIR_CUADERNO, tieneDatos, resumenEjercicio, resumenCorto, moduloDeEjercicio };
