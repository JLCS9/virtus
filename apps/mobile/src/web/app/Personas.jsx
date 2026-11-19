import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalLink as Link, useLocalPath } from '../i18n';
import { actualizarPersona, borrarPersona, leerPersona } from '../account/personas';
import { AVATARES, GRUPOS, RELACIONES, TEXTO_GRUPO, TEXTO_SITUACION, textoSinResultado } from '../lib/personas.js';
import { INK, LINE, MUTED, NAVY, PAPER, TEMP_COLORS, FONT_BODY, FONT_SLAB } from '../theme';
import { botonContorno, botonSobreClaro, eyebrow, parrafo, tarjeta, titulo } from './estilos';
import { usePersonas } from './usePersonas';
import { useTemperamento } from './camino/Juegos';
import { useSession } from '../account/useSession';
import CrearFicha from './personas/CrearFicha';
import { Avatar, EtiquetaEstado, FichaContenido, MapaPersonas, Verificado, estaVerificada } from './personas/comun';
import CompartirTest from './personas/CompartirTest';

const Lapiz = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M11.5 1.5a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L5.5 13.5 1 15l1.5-4.5z" />
    <path d="M10 3.5l2.5 2.5" />
  </svg>
);

function ModalEditar({ persona, onGuardar, onEliminar, onCerrar }) {
  const [d, setD] = useState({
    nombre: persona.nombre,
    grupo: persona.grupo,
    relacion: persona.relacion ?? null,
    avatar: persona.avatar ?? null,
  });
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const valido = d.nombre.trim().length > 0 && d.grupo;

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    try {
      await actualizarPersona(persona.id, { nombre: d.nombre.trim(), grupo: d.grupo, relacion: d.relacion, avatar: d.avatar });
      onGuardar();
    } catch {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a ${persona.nombre}? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    try {
      await borrarPersona(persona.id);
      onEliminar();
    } catch {
      setEliminando(false);
    }
  }

  const chip = (activo) => ({
    fontFamily: FONT_BODY, fontSize: 14, padding: '8px 13px', cursor: 'pointer',
    border: `1px solid ${activo ? NAVY : LINE}`, background: activo ? NAVY : PAPER, color: activo ? PAPER : INK,
  });
  const label = { display: 'block', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: INK, margin: '16px 0 8px' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'grid', placeItems: 'center', background: 'rgba(15,29,56,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div style={{ background: PAPER, maxWidth: 440, width: '90vw', maxHeight: '85vh', overflow: 'auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={eyebrow}>Editar persona</div>
          <button type="button" onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 20, color: MUTED, padding: '4px 8px' }}>✕</button>
        </div>

        <label htmlFor="edit-nombre" style={label}>Nombre o apodo</label>
        <input id="edit-nombre" value={d.nombre} maxLength={40} autoComplete="off" onChange={(e) => setD({ ...d, nombre: e.target.value })}
          style={{ width: '100%', fontFamily: FONT_BODY, fontSize: 17, padding: '12px 14px', border: `1px solid ${LINE}`, color: INK, background: '#fff' }} />

        <span style={label}>Grupo</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {GRUPOS.map(([g, texto]) => (
            <button key={g} type="button" style={chip(d.grupo === g)} onClick={() => setD({ ...d, grupo: g })}>{texto}</button>
          ))}
        </div>

        <span style={label}>Relación <span style={{ fontWeight: 400, color: MUTED }}>(opcional)</span></span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {RELACIONES.map((r) => (
            <button key={r} type="button" style={chip(d.relacion === r)} onClick={() => setD({ ...d, relacion: d.relacion === r ? null : r })}>{r}</button>
          ))}
        </div>

        <span style={label}>Avatar <span style={{ fontWeight: 400, color: MUTED }}>(opcional; si no, su inicial)</span></span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {AVATARES.map((a) => (
            <button key={a} type="button" aria-label={`Avatar ${a}`} style={{ ...chip(d.avatar === a), fontSize: 20, padding: '6px 10px' }}
              onClick={() => setD({ ...d, avatar: d.avatar === a ? null : a })}>{a}</button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" disabled={!valido || guardando} onClick={guardar} style={{ ...botonSobreClaro, opacity: valido ? 1 : 0.5 }}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={onCerrar} style={{ ...botonContorno }}>Cancelar</button>
          </div>
          <button type="button" disabled={eliminando} onClick={eliminar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: '#C92A2A', padding: '8px 4px' }}>
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonaDetalle({ personaId }) {
  const navigate = useNavigate();
  const lp = useLocalPath();
  const temp = useTemperamento();
  const session = useSession();
  const [estado, setEstado] = useState({ cargando: true });
  const [editando, setEditando] = useState(false);

  const cargar = useCallback(() => {
    leerPersona(personaId).then((d) => setEstado({ ...d })).catch(() => setEstado({ error: true }));
  }, [personaId]);
  useEffect(cargar, [cargar]);

  if (estado.cargando) return <section style={tarjeta}><p style={parrafo}>Cargando la ficha…</p></section>;
  if (estado.error || !estado.persona) {
    return (
      <div style={{ maxWidth: 900 }}>
        <Link to="/app/personas" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>← Personas</Link>
        <section style={{ ...tarjeta, marginTop: 14 }}>
          <p style={parrafo}>No he encontrado esta ficha.</p>
        </section>
      </div>
    );
  }

  const { persona: p, observaciones } = estado;

  return (
    <div style={{ maxWidth: 900 }}>
      <Link to="/app/personas" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>← Personas</Link>

      <section style={{ ...tarjeta, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Avatar persona={p} tam={60} />
          <div style={{ flex: 1 }}>
            <h1 style={{ ...titulo(28), margin: 0 }}>{p.nombre}</h1>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: MUTED, margin: '2px 0' }}>
              {TEXTO_GRUPO[p.grupo]}{p.relacion ? ` · ${p.relacion}` : ''}
            </div>
            <EtiquetaEstado persona={p} />
          </div>
          <button type="button" onClick={() => setEditando(true)} aria-label={`Editar ${p.nombre}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', opacity: 0.5 }}>
            <Lapiz />
          </button>
        </div>

        {estaVerificada(p) ? (
          <p style={{ ...parrafo, color: INK, fontSize: 16, borderTop: `1px solid ${LINE}`, padding: '14px 0', margin: 0 }}>
            <Verificado tam={18} /> <strong>Temperamento verificado por {p.nombre}</strong>
            {p.verificado_en ? ` · ${new Date(p.verificado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
          </p>
        ) : (
          session?.user && <CompartirTest user={session.user} persona={p} />
        )}

        {p.primario ? (
          <FichaContenido persona={p} miPrimario={temp?.primario} />
        ) : (
          <p style={{ ...parrafo, color: INK, borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>{textoSinResultado(p.nombre)}</p>
        )}

        {observaciones.length > 0 && (
          <div style={{ borderTop: `1px solid ${LINE}`, padding: '14px 0 4px' }}>
            <div style={{ ...eyebrow, color: MUTED, marginBottom: 8 }}>Lo que he visto de {p.nombre}</div>
            {observaciones.map((o) => (
              <div key={o.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '8px 0', borderTop: `1px dashed ${LINE}` }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: MUTED, minWidth: 64 }}>
                  {new Date(o.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
                <span style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 14.5, color: INK }}>
                  {o.palabra ? <>{TEXTO_SITUACION[o.situacion]}: <strong>{o.palabra.toLowerCase()}</strong></> : null}
                  {o.linea && <span style={{ display: 'block', fontFamily: FONT_SLAB, fontStyle: 'italic', fontSize: 16, color: MUTED }}>«{o.linea}»</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {editando && (
        <ModalEditar
          key={p.id}
          persona={p}
          onGuardar={() => { setEditando(false); cargar(); }}
          onEliminar={() => { setEditando(false); navigate(lp('/app/personas')); }}
          onCerrar={() => setEditando(false)}
        />
      )}
    </div>
  );
}

function ListaPersonas() {
  const lp = useLocalPath();
  const navigate = useNavigate();
  const { cargando, lista, recargar } = usePersonas();
  const [editando, setEditando] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const irANueva = () => navigate(lp('/app/personas/nueva'));

  if (cargando) return <section style={tarjeta}><p style={parrafo}>Cargando…</p></section>;

  return (
    <div>
      <Link to="/app" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>← Hoy</Link>

      <section style={{ ...tarjeta, marginTop: 14 }}>
        <div style={eyebrow}>Tu entorno</div>
        <h1 style={{ ...titulo(30), margin: '10px 0 6px' }}>{lista.length} {lista.length === 1 ? 'persona' : 'personas'}</h1>
        <p style={{ ...parrafo, marginBottom: 16 }}>Las personas con las que practicas las virtudes. Solo tú ves estas fichas.</p>

        <style>{`
          .vl-personas-layout { display: flex; flex-direction: column; gap: 20px; }
          @media (min-width: 760px) {
            .vl-personas-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
            .vl-personas-mapa { position: sticky; top: 80px; }
          }
        `}</style>

        <div className="vl-personas-layout">
          {lista.length > 0 && (
            <div className="vl-personas-mapa">
              <MapaPersonas personas={lista} hoverId={hoverId} onHoverPersona={setHoverId} />
            </div>
          )}

          <div>
            {GRUPOS.map(([g]) => {
              const delGrupo = lista.filter((p) => p.grupo === g);
              if (!delGrupo.length) return null;
              return (
                <div key={g} style={{ marginTop: 12 }}>
                  <div style={{ ...eyebrow, color: MUTED, marginBottom: 6 }}>{TEXTO_GRUPO[g]}</div>
                  <div style={{ display: 'grid', gap: 2 }}>
                    {delGrupo.map((p) => {
                      const activa = hoverId === p.id;
                      const dimmed = hoverId && hoverId !== p.id;
                      return (
                        <div key={p.id}
                          onMouseEnter={() => setHoverId(p.id)}
                          onMouseLeave={() => setHoverId(null)}
                          onClick={() => navigate(lp(`/app/personas/${p.id}`))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px',
                            borderTop: `1px solid ${LINE}`, cursor: 'pointer',
                            opacity: dimmed ? 0.25 : 1,
                            background: activa ? 'rgba(27,42,74,0.04)' : 'transparent',
                            transition: 'opacity 200ms ease, background 200ms ease',
                          }}>
                          <Avatar persona={p} tam={42} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontFamily: FONT_BODY, fontSize: 15.5, fontWeight: 600, color: INK }}>
                              {p.nombre}{p.relacion ? <span style={{ fontWeight: 400, color: MUTED }}> · {p.relacion}</span> : null}
                            </span>
                            <EtiquetaEstado persona={p} />
                          </span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditando(p); }} aria-label={`Editar ${p.nombre}`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', opacity: 0.5 }}>
                            <Lapiz />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 22 }}>
              <button type="button" onClick={irANueva} style={botonSobreClaro}>+ Añadir persona</button>
            </div>
          </div>
        </div>
      </section>

      {editando && (
        <ModalEditar
          key={editando.id}
          persona={editando}
          onGuardar={() => { setEditando(null); recargar(); }}
          onEliminar={() => { setEditando(null); recargar(); }}
          onCerrar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

// Crear una ficha desde el portal (el Camino, donde vivía antes, está bloqueado).
function NuevaPersona() {
  const navigate = useNavigate();
  const lp = useLocalPath();
  const session = useSession();
  const { cargando, menor } = usePersonas();
  if (!session?.user || cargando) return <section style={tarjeta}><p style={parrafo}>Cargando…</p></section>;
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <CrearFicha user={session.user} todosLosGrupos menor={menor} corto compartir
                  onSalir={() => navigate(lp('/app/personas'))}
                  onHecho={(p) => navigate(lp(`/app/personas/${p.id}`), { replace: true })} />
    </div>
  );
}

export default function Personas() {
  const { personaId } = useParams();
  if (personaId === 'nueva') return <NuevaPersona />;
  if (personaId) return <PersonaDetalle personaId={personaId} />;
  return <ListaPersonas />;
}
