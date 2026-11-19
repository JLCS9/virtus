import { useState, useRef, useEffect, useCallback } from 'react';
import { NAVY, MUTED, LINE, GOLD_REF, GOLD_REF_DK, FONT_BODY, PAPER, SUCCESS_DK } from '../theme';
import { tarjeta, eyebrow } from '../app/estilos';
import { notaAHtml } from './NotaTexto';

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

const IconoLupa = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="10.5" cy="10.5" r="7" /><path d="m21 21-5.2-5.2" />
  </svg>
);

const IconoLapiz = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const DRAFT_PREFIX = 'vl-nota-draft:';

function leccionesDesbloqueadas(videos, completados) {
  const result = [];
  for (const v of videos) {
    result.push(v);
    if (!completados[v.id]) break;
  }
  return result;
}

function moduloVisual(v, videos) {
  const headers = videos.filter(x => !x.continua_modulo);
  if (!v.continua_modulo) return headers.indexOf(v) + 1;
  const idx = videos.indexOf(v);
  for (let i = idx - 1; i >= 0; i--) {
    if (!videos[i].continua_modulo) return headers.indexOf(videos[i]) + 1;
  }
  return 1;
}

const IconoNegrita = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 4h7a4 4 0 0 1 2.7 7A4.2 4.2 0 0 1 14 18H6V4zm2 7h5a2 2 0 1 0 0-4H8v4zm0 2v3h6a2 2 0 1 0 0-4H8z"/>
  </svg>
);
const IconoCursiva = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M10 5h6v2h-2.21l-3.42 10H13v2H7v-2h2.21l3.42-10H10V5z"/>
  </svg>
);
const IconoSubrayado = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 21v-2h12v2H6zm6-4a5 5 0 0 1-5-5V3h2v9a3 3 0 0 0 6 0V3h2v9a5 5 0 0 1-5 5z"/>
  </svg>
);

function BotonesFormato({ editorRef }) {
  function aplicar(cmd) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, null);
  }

  const btnBase = {
    background: 'transparent', border: `1px solid transparent`, borderRadius: 4,
    padding: '4px 6px', cursor: 'pointer', color: MUTED, lineHeight: 1,
    display: 'inline-grid', placeItems: 'center',
    transition: 'border-color 150ms ease, color 150ms ease',
  };

  function hover(e) { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.color = NAVY; }
  function unhover(e) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = MUTED; }

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <button type="button" onClick={() => aplicar('bold')} onMouseEnter={hover} onMouseLeave={unhover} style={btnBase} title="Negrita (⌘B)"><IconoNegrita /></button>
      <button type="button" onClick={() => aplicar('italic')} onMouseEnter={hover} onMouseLeave={unhover} style={btnBase} title="Cursiva (⌘I)"><IconoCursiva /></button>
      <button type="button" onClick={() => aplicar('underline')} onMouseEnter={hover} onMouseLeave={unhover} style={btnBase} title="Subrayado (⌘U)"><IconoSubrayado /></button>
    </div>
  );
}

export function NotasLateral({ pasoActualId, notas, onAgregar, onEliminar, onEditar }) {
  const editorRef = useRef(null);
  const [guardado, setGuardado] = useState(false);
  const [verNotas, setVerNotas] = useState(false);
  const notaActualRef = useRef(null);
  const autoSaveTimer = useRef(null);

  const notasDelPaso = (notas[pasoActualId] ?? []).slice().reverse();

  useEffect(() => {
    if (!editorRef.current) return;
    try {
      const draft = localStorage.getItem(DRAFT_PREFIX + pasoActualId);
      if (draft) editorRef.current.innerHTML = draft;
    } catch {}
  }, [pasoActualId]);

  useEffect(() => {
    notaActualRef.current = null;
    if (editorRef.current) editorRef.current.innerHTML = '';
    try {
      const draft = localStorage.getItem(DRAFT_PREFIX + pasoActualId);
      if (draft && editorRef.current) editorRef.current.innerHTML = draft;
    } catch {}
  }, [pasoActualId]);

  function getTexto() {
    if (!editorRef.current) return '';
    return editorRef.current.innerHTML.replace(/<br\s*\/?>\s*$/i, '').trim();
  }
  function getTextoPlano() {
    if (!editorRef.current) return '';
    return editorRef.current.innerText.trim();
  }

  const guardarNota = useCallback(() => {
    const html = getTexto();
    const plano = getTextoPlano();
    if (!plano || !pasoActualId) return;
    if (notaActualRef.current && onEditar) {
      onEditar(pasoActualId, notaActualRef.current, html);
    } else {
      onAgregar(pasoActualId, html);
      const lista = notas[pasoActualId] ?? [];
      const nueva = lista[lista.length - 1];
      if (nueva) notaActualRef.current = nueva.id;
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
    try { localStorage.removeItem(DRAFT_PREFIX + pasoActualId); } catch {}
  }, [pasoActualId, onAgregar, onEditar, notas]);

  function handleInput() {
    try { localStorage.setItem(DRAFT_PREFIX + pasoActualId, getTexto()); } catch {}
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => { guardarNota(); }, 3000);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      guardarNota();
    }
  }

  function clickGuardar() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    guardarNota();
  }

  return (
    <div style={{ position: 'sticky', top: 60, alignSelf: 'start' }}>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, padding: 16 }}>
        <div style={{ ...eyebrow, fontSize: 11, marginBottom: 10 }}>Mis notas</div>

        <div style={{ background: '#fff', border: `1px solid ${LINE}`, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)' }}>
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            data-placeholder="Escribe una reflexión…"
            className="vl-notas-lateral"
            style={{
              width: '100%', padding: '10px 12px',
              border: 'none', outline: 'none',
              fontFamily: FONT_BODY, fontSize: 14, color: NAVY,
              boxSizing: 'border-box',
              minHeight: 100, background: 'transparent',
              lineHeight: 1.5, overflowY: 'auto',
            }}
          />
          <style>{`.vl-notas-lateral[contenteditable]:empty::before { content: attr(data-placeholder); color: ${MUTED}; pointer-events: none; }`}</style>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BotonesFormato editorRef={editorRef} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: guardado ? SUCCESS_DK : MUTED, transition: 'color 300ms ease', marginLeft: 4 }}>
              {guardado ? '✓ Guardado' : ''}
            </span>
          </div>
          <button type="button" onClick={clickGuardar} style={{
            fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
            color: PAPER, background: GOLD_REF,
            border: 'none', borderRadius: 0, padding: '8px 16px',
            cursor: 'pointer', letterSpacing: '0.02em',
          }}>
            Guardar
          </button>
        </div>

        {notasDelPaso.length > 0 && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>
            <button type="button" onClick={() => setVerNotas(!verNotas)} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600,
              color: GOLD_REF_DK, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <IconoLupa />
              {verNotas ? 'Ocultar' : 'Ver notas'}
            </button>

            {verNotas && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {notasDelPaso.map((nota) => (
                  <div key={nota.id} style={{
                    padding: '10px 12px',
                    borderLeft: `3px solid ${GOLD_REF}`,
                    background: 'rgba(165,139,38,0.04)',
                    position: 'relative',
                  }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
                      {formatFecha(nota.fecha)}
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, lineHeight: 1.5, paddingRight: 24 }} dangerouslySetInnerHTML={{ __html: notaAHtml(nota.texto) }} />
                    <button type="button" onClick={() => onEliminar(pasoActualId, nota.id)} style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'none', border: 'none', color: MUTED, cursor: 'pointer',
                      fontSize: 13, padding: '2px 4px', lineHeight: 1,
                      opacity: 0.3, transition: 'opacity 150ms ease',
                    }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.3'; }} aria-label="Eliminar">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ETIQUETA_TIPO = { video: 'Vídeo', quiz: 'Cuestionario', define: 'Definiciones', desliza: 'Identifica temperamentos', identifica: 'Diagrama', reflexion_piramide: 'Reflexión', test_profundo: 'Autoexamen', retos_temperamento: 'Retos', temperamento_magnanimidad: 'Temperamento', test_caracter: 'Test de carácter', test_corazon: 'Test del corazón', armonia_temperamento: 'Armonía', objetivos_corazon: 'Objetivos', proyecto_mision: 'Proyecto' };

export function BlocDeNotas({ videos, completados, pasoActualId, notas, onAgregar, onEliminar, onEditar, pasos }) {
  const desbloqueadas = leccionesDesbloqueadas(videos, completados);

  if (!desbloqueadas.find((v) => v.id === pasoActualId)) {
    const actual = videos.find((v) => v.id === pasoActualId);
    if (actual && !desbloqueadas.includes(actual)) desbloqueadas.push(actual);
  }

  const moduloGrupos = {};
  for (const v of desbloqueadas) {
    const mv = moduloVisual(v, videos);
    if (!moduloGrupos[mv]) moduloGrupos[mv] = [];
    moduloGrupos[mv].push(v.id);
  }
  if (pasos) {
    const ejercicios = pasos.filter(p => p.tipo !== 'video' && p.tipo !== 'intro' && p.tipo !== 'conclusion_modulo');
    for (const ej of ejercicios) {
      const vidAnterior = (() => { const idx = pasos.indexOf(ej); for (let i = idx - 1; i >= 0; i--) { if (pasos[i].tipo === 'video') return pasos[i]; } return null; })();
      const mv = vidAnterior ? moduloVisual(vidAnterior, videos) : 1;
      if (!moduloGrupos[mv]) moduloGrupos[mv] = [];
      if (!moduloGrupos[mv].includes(ej.id)) moduloGrupos[mv].push(ej.id);
    }
  }
  const headerVideos = desbloqueadas.filter(v => !v.continua_modulo);

  const pasosMap = {};
  if (pasos) for (const p of pasos) pasosMap[p.id] = p;
  for (const v of videos) if (!pasosMap[v.id]) pasosMap[v.id] = v;

  const editorRef = useRef(null);
  const [verPasadas, setVerPasadas] = useState(false);
  const [filtro, setFiltro] = useState(headerVideos[0]?.id ?? pasoActualId);
  const [guardado, setGuardado] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const notaActualRef = useRef(null);
  const autoSaveTimer = useRef(null);

  const totalNotas = Object.values(notas).reduce((s, arr) => s + arr.length, 0);
  const filtroMV = (() => {
    const fv = videos.find(v => v.id === filtro);
    return fv ? moduloVisual(fv, videos) : 0;
  })();
  const idsDelModulo = moduloGrupos[filtroMV] ?? [filtro];
  const notasDelFiltro = idsDelModulo.flatMap(id => (notas[id] ?? []).map(n => ({ ...n, _pasoId: id }))).slice().reverse();

  useEffect(() => {
    if (!editorRef.current) return;
    try {
      const draft = localStorage.getItem(DRAFT_PREFIX + pasoActualId);
      if (draft) editorRef.current.innerHTML = draft;
    } catch {}
  }, [pasoActualId]);

  function getTexto() {
    if (!editorRef.current) return '';
    return editorRef.current.innerHTML.replace(/<br\s*\/?>\s*$/i, '').trim();
  }

  function getTextoPlano() {
    if (!editorRef.current) return '';
    return editorRef.current.innerText.trim();
  }

  const guardarNota = useCallback(() => {
    const html = getTexto();
    const plano = getTextoPlano();
    if (!plano || !pasoActualId) return;

    if (notaActualRef.current && onEditar) {
      onEditar(pasoActualId, notaActualRef.current, html);
    } else {
      onAgregar(pasoActualId, html);
      const lista = notas[pasoActualId] ?? [];
      const nueva = lista[lista.length - 1];
      if (nueva) notaActualRef.current = nueva.id;
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
    try { localStorage.removeItem(DRAFT_PREFIX + pasoActualId); } catch {}
  }, [pasoActualId, onAgregar, onEditar, notas]);

  function handleInput() {
    try { localStorage.setItem(DRAFT_PREFIX + pasoActualId, getTexto()); } catch {}
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      guardarNota();
    }, 3000);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      guardarNota();
    }
  }

  function clickGuardar() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    guardarNota();
  }

  function iniciarEdicion(nota) {
    setEditandoId(nota.id);
    setTextoEdicion(nota.texto);
  }

  function guardarEdicion(pasoId, notaId) {
    const t = textoEdicion.trim();
    if (!t) return;
    if (onEditar) onEditar(pasoId, notaId, t);
    setEditandoId(null);
    setTextoEdicion('');
  }

  const hayTexto = typeof window !== 'undefined' && editorRef.current?.innerText?.trim();

  return (
    <section className="vl-notas-editor" style={{ ...tarjeta, marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={eyebrow}>Bloc de notas</div>
        {totalNotas > 0 && (
          <button
            type="button"
            onClick={() => setVerPasadas(!verPasadas)}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
              color: GOLD_REF_DK, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >
            <IconoLupa />
            {verPasadas ? 'Ocultar notas pasadas' : 'Ver notas pasadas'}
          </button>
        )}
      </div>

      <div style={{
        background: '#fff',
        border: `1px solid ${LINE}`,
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder="Escribe una reflexión…"
          style={{
            width: '100%', padding: '14px 16px',
            border: 'none', outline: 'none',
            fontFamily: FONT_BODY, fontSize: 15, color: NAVY,
            boxSizing: 'border-box',
            minHeight: 140, background: 'transparent',
            lineHeight: 1.55,
            overflowY: 'auto',
          }}
        />
        <style>{`.vl-notas-editor [contenteditable]:empty::before { content: attr(data-placeholder); color: ${MUTED}; pointer-events: none; }`}</style>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BotonesFormato editorRef={editorRef} />
          {guardado && (
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: SUCCESS_DK }}>✓ Guardado</span>
          )}
        </div>
        <button
          type="button"
          onClick={clickGuardar}
          style={{
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600,
            color: PAPER,
            background: GOLD_REF,
            border: 'none', borderRadius: 0, padding: '10px 22px',
            cursor: 'pointer',
            transition: 'background 200ms ease, color 200ms ease',
            letterSpacing: '0.02em',
          }}
        >
          Guardar nota
        </button>
      </div>

      {verPasadas && (
        <div className="vl-notas-pasadas" style={{ marginTop: 18, borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{
              width: '100%', padding: '12px 40px 12px 16px',
              border: `1px solid ${LINE}`,
              borderRadius: 0, fontFamily: FONT_BODY, fontSize: 15, fontWeight: 500,
              color: NAVY, background: '#fff',
              marginBottom: 14, cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a8599' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center',
            }}
          >
            {headerVideos.map((v) => (
              <option key={v.id} value={v.id}>
                Módulo {moduloVisual(v, videos)} — {v.titulo}
              </option>
            ))}
          </select>

          {notasDelFiltro.length === 0 && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, fontStyle: 'italic', margin: 0 }}>
              Sin notas en esta lección.
            </p>
          )}

          {notasDelFiltro.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notasDelFiltro.map((nota) => (
                <div key={nota.id} style={{
                  padding: '14px 18px 14px 16px',
                  borderLeft: `3px solid ${GOLD_REF}`,
                  background: 'rgba(165,139,38,0.04)',
                  position: 'relative',
                }}>
                  {pasosMap[nota._pasoId] && (
                    <div style={{
                      fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: GOLD_REF_DK,
                      marginBottom: 4,
                    }}>
                      {ETIQUETA_TIPO[pasosMap[nota._pasoId].tipo] ?? 'Ejercicio'}: {pasosMap[nota._pasoId].titulo}
                    </div>
                  )}
                  <div style={{
                    fontFamily: FONT_BODY, fontSize: 11, color: MUTED,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>
                    {formatFecha(nota.fecha)}
                  </div>

                  {editandoId === nota.id ? (
                    <div>
                      <textarea
                        value={textoEdicion}
                        onChange={(e) => setTextoEdicion(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px',
                          border: `1px solid ${LINE}`, outline: 'none',
                          fontFamily: FONT_BODY, fontSize: 15, color: NAVY,
                          resize: 'vertical', boxSizing: 'border-box',
                          minHeight: 80, background: '#fff', lineHeight: 1.55,
                        }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button type="button" onClick={() => guardarEdicion(nota._pasoId ?? filtro, nota.id)} style={{
                          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
                          color: PAPER, background: GOLD_REF, border: 'none',
                          padding: '6px 16px', cursor: 'pointer',
                        }}>
                          Guardar
                        </button>
                        <button type="button" onClick={() => setEditandoId(null)} style={{
                          fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600,
                          color: MUTED, background: 'none', border: `1px solid ${LINE}`,
                          padding: '6px 16px', cursor: 'pointer',
                        }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontFamily: FONT_BODY, fontSize: 16, color: NAVY, margin: 0,
                        lineHeight: 1.65, paddingRight: 50,
                      }}
                      dangerouslySetInnerHTML={{ __html: notaAHtml(nota.texto) }}
                    />
                  )}

                  {editandoId !== nota.id && (
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(nota)}
                        style={{
                          background: 'none', border: 'none',
                          color: MUTED, cursor: 'pointer', fontSize: 13,
                          padding: '4px 6px', lineHeight: 1,
                          opacity: 0.4, transition: 'opacity 150ms ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; }}
                        aria-label="Editar nota"
                      >
                        <IconoLapiz />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(nota._pasoId ?? filtro, nota.id)}
                        style={{
                          background: 'none', border: 'none',
                          color: MUTED, cursor: 'pointer', fontSize: 15,
                          padding: '4px 6px', lineHeight: 1,
                          opacity: 0.4, transition: 'opacity 150ms ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; }}
                        aria-label="Eliminar nota"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
