import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { LocalLink as Link } from '../i18n';
import { leerPerfil, cambiarPassword, actualizarPerfil, borrarCuenta } from '../account/perfil';
import { claveTemperamento } from '../lib/virtudes.js';
import NotaTexto from '../formacion/NotaTexto';
import { supabase } from '../account/supabase';
import { olvidarAcceso } from '../account/useAcceso';
import { olvidarCatalogo } from '../formacion/useFormacion';
import { NAVY, MUTED, GOLD_REF, GOLD_REF_DK, FONT_SLAB, FONT_BODY, LINE, PAPER, BEIGE, ERROR_BG, ERROR, ERROR_DK, SUCCESS_DK } from '../theme';
import { tarjeta, eyebrow, parrafo } from './estilos';
import { usePreferencias } from './Horarios';
import { textoFormacion, textoReflexion, textoReto, textoZona } from '../lib/preferencias.js';
import curso1 from '../data/curso1.json';
import curso2 from '../data/curso2.json';
import curso3 from '../data/curso3.json';
import curso4 from '../data/curso4.json';
import curso5 from '../data/curso5.json';
import curso6 from '../data/curso6.json';
import curso7 from '../data/curso7.json';

const TEMP_NOMBRE = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };
const SEXO = { hombre: 'Hombre', mujer: 'Mujer' };
const GRUPO = { familia: 'Familia', trabajo: 'Trabajo', amigos: 'Amigos', comunidad: 'Comunidad' };
const ESTADO_PERSONA = { sin_estimar: 'Sin estimar', estimado: 'Estimado', confirmado: 'Confirmado', invitado: 'Invitado', registrado: 'Registrado' };
const IDIOMAS = { es: 'Español', en: 'English', fr: 'Français', ru: 'Русский' };

const TABS = [
  { key: 'config', label: 'Configuración' },
  { key: 'datos', label: 'Mis resultados' },
  { key: 'notas', label: 'Mis notas' },
];

/* ─── Primitivas ─── */

function Fila({ label, valor }) {
  if (valor == null || valor === '') return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: `1px solid ${LINE}` }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED }}>{label}</span>
      <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, textAlign: 'right', maxWidth: '60%' }}>{valor}</span>
    </div>
  );
}

function Lapiz({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Editar" style={{
      position: 'absolute', top: 18, right: 18, background: 'none', border: 'none',
      cursor: 'pointer', color: LINE, padding: 2, borderRadius: 0,
      transition: 'color 150ms ease', opacity: 0.7,
    }}
      onMouseEnter={e => { e.currentTarget.style.color = GOLD_REF; e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={e => { e.currentTarget.style.color = LINE; e.currentTarget.style.opacity = '0.7'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </button>
  );
}

function Seccion({ titulo, children, onEdit }) {
  return (
    <section style={{ ...tarjeta, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={eyebrow}>{titulo}</div>
      {onEdit && <Lapiz onClick={onEdit} />}
      <div style={{ marginTop: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>{children}</div>
    </section>
  );
}

function Campo({ label, tipo = 'text', value, onChange, opciones, placeholder }) {
  const base = { fontFamily: FONT_BODY, fontSize: 14, padding: '10px 12px', border: `1px solid ${LINE}`, borderRadius: 0, outline: 'none', width: '100%', background: '#fff' };
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: MUTED, fontWeight: 600 }}>{label}</span>
      {opciones ? (
        <select style={base} value={value ?? ''} onChange={e => onChange(e.target.value)}>
          {Object.entries(opciones).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      ) : (
        <input type={tipo} style={base} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

function CampoPwd({ label, value, onChange, visible, onToggle, placeholder }) {
  const base = { fontFamily: FONT_BODY, fontSize: 14, padding: '10px 40px 10px 12px', border: `1px solid ${LINE}`, borderRadius: 0, outline: 'none', width: '100%', background: '#fff' };
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: MUTED, fontWeight: 600 }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <input type={visible ? 'text' : 'password'} style={base} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        <button type="button" tabIndex={-1} onClick={onToggle} aria-label={visible ? 'Ocultar' : 'Mostrar'}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, display: 'flex' }}>
          {visible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}

/* ─── Modal overlay ─── */

function Modal({ titulo, children, onClose }) {
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center',
      background: 'rgba(15,29,56,0.22)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 24,
        padding: '28px 24px', width: 'min(440px, 92vw)',
        maxHeight: '85vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(15,29,56,0.22)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontFamily: FONT_SLAB, fontSize: 18, fontWeight: 700, color: NAVY, margin: 0 }}>{titulo}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', fontSize: 20, color: MUTED, cursor: 'pointer', padding: 4, lineHeight: 1 }}>&times;</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function BtnGuardar({ onClick, guardando }) {
  return (
    <button type="button" onClick={onClick} disabled={guardando} style={{
      fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: '#fff',
      background: GOLD_REF, border: 'none', borderRadius: 0, padding: '12px 24px',
      cursor: 'pointer', opacity: guardando ? 0.6 : 1, transition: 'opacity 150ms',
    }}>
      {guardando ? 'Guardando…' : 'Guardar'}
    </button>
  );
}

/* ─── Tab 1: Configuración ─── */

// Horarios del reto, la reflexión y la formación (preferencias_notificaciones). Se editan en
// /app/horarios; aquí solo el resumen.
function SeccionHorarios({ userId }) {
  const estado = usePreferencias(userId);
  const p = estado.preferencias;
  return (
    <section style={{ ...tarjeta, position: 'relative', gridColumn: '1 / -1' }}>
      <div style={eyebrow}>Tu día a día</div>
      <div style={{ marginTop: 10 }}>
        {estado.cargando && <p style={{ ...parrafo, margin: 0, fontSize: 16 }}>Cargando…</p>}
        {estado.error && <p style={{ ...parrafo, margin: 0, fontSize: 16 }}>No he podido cargar tus horarios.</p>}
        {p && estado.configurado && (
          <>
            <Fila label="Reto diario" valor={textoReto(p)} />
            <Fila label="Reflexión del día" valor={textoReflexion(p)} />
            <Fila label="Formación semanal" valor={textoFormacion(p)} />
            <Fila label="Zona horaria" valor={textoZona(p.zona_horaria)} />
          </>
        )}
        {p && !estado.configurado && (
          <p style={{ ...parrafo, margin: 0, fontSize: 16 }}>Aún no has elegido a qué hora quieres tu reto, tu reflexión y tu formación.</p>
        )}
        {p && (
          <Link to="/app/horarios" style={{ display: 'inline-block', marginTop: 14, fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: NAVY }}>
            {estado.configurado ? 'Cambiar mis horarios' : 'Elegir mis horarios'} →
          </Link>
        )}
      </div>
    </section>
  );
}

function TabConfig({ user, profile, consents, onRefresh }) {
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [draft, setDraft] = useState({});
  const [pwdState, setPwdState] = useState({ old: '', pwd: '', estado: 'idle', showOld: false, showNew: false });
  const [confirmBorrar, setConfirmBorrar] = useState(false);


  function abrir(seccion, datos) {
    setDraft(datos);
    setEditando(seccion);
    setGuardando(false);
  }

  async function guardar(campos) {
    setGuardando(true);
    try {
      await actualizarPerfil(user.id, campos);
      setEditando(null);
      onRefresh();
    } catch { setGuardando(false); }
  }

  async function guardarPwd() {
    if (!pwdState.old || pwdState.pwd.length < 6) return;
    setPwdState(s => ({ ...s, estado: 'guardando' }));
    try {
      await cambiarPassword(pwdState.old, pwdState.pwd);
      setPwdState({ old: '', pwd: '', estado: 'ok', showOld: false, showNew: false });
      setTimeout(() => { setPwdState({ old: '', pwd: '', estado: 'idle', showOld: false, showNew: false }); setEditando(null); }, 1800);
    } catch (err) {
      setPwdState(s => ({ ...s, estado: err.message === 'wrong_password' ? 'wrong' : 'error' }));
    }
  }

  async function salir() {
    olvidarAcceso();
    olvidarCatalogo();
    await supabase.auth.signOut({ scope: 'local' });
  }

  async function eliminar() {
    try {
      await borrarCuenta();
      olvidarAcceso();
      olvidarCatalogo();
    } catch { /* redirect will happen anyway from auth state change */ }
  }

  return (
    <>
      <div className="vl-cols">
        {/* Fila 1: las dos grandes — Config general + Datos personales */}
        <Seccion titulo="Configuración general" onEdit={() => abrir('general', { locale: profile.locale })}>
          <Fila label="Email" valor={user.email} />
          <Fila label="Idioma" valor={IDIOMAS[profile.locale]} />
          <Fila label="Contraseña" valor="••••••••" />
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={() => { setPwdState({ old: '', pwd: '', estado: 'idle', showOld: false, showNew: false }); setEditando('password'); }} style={{
              fontFamily: FONT_BODY, fontSize: 13, color: GOLD_REF_DK, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, textDecoration: 'underline',
            }}>Cambiar contraseña</button>
          </div>
        </Seccion>

        <Seccion titulo="Datos personales" onEdit={() => abrir('personal', {
          first_name: profile.first_name ?? '', last_name: profile.last_name ?? '',
          sex: profile.sex ?? '', birth_year: profile.birth_year ?? '', country: profile.country ?? '',
          spiritual: profile.spiritual ?? false,
        })}>
          <Fila label="Nombre" valor={[profile.first_name, profile.last_name].filter(Boolean).join(' ')} />
          <Fila label="Sexo" valor={SEXO[profile.sex]} />
          <Fila label="Año de nacimiento" valor={profile.birth_year} />
          <Fila label="País" valor={profile.country} />
          <Fila label="Vida espiritual" valor={profile.spiritual ? 'Sí' : 'No'} />
        </Seccion>

        <SeccionHorarios userId={user.id} />

        {/* Fila 2: las dos pequeñas — Consentimientos + Caché */}
        <Seccion titulo="Consentimientos">
          {consents.length > 0 ? consents.map((c, i) => (
            <Fila key={i}
              label={{ cuenta: 'Cuenta y resultados', newsletter: 'Boletín', tutor: 'Tutor' }[c.purpose] ?? c.purpose}
              valor={c.granted ? 'Aceptado' : 'Denegado'}
            />
          )) : <p style={{ ...parrafo, margin: 0, fontSize: 13 }}>Sin consentimientos registrados</p>}
        </Seccion>

        <Seccion titulo="Caché y datos locales">
          <p style={{ ...parrafo, margin: '0 0 12px', fontSize: 13 }}>
            Vacía los datos locales del navegador (progreso de módulos, catálogo, preferencias).
          </p>
          <button type="button" onClick={() => {
            try { localStorage.clear(); sessionStorage.clear(); } catch {}
            olvidarAcceso();
            olvidarCatalogo();
            window.location.reload();
          }} style={{
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY,
            background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0,
            padding: '10px 20px', cursor: 'pointer', width: '100%',
          }}>Vaciar caché y recargar</button>
        </Seccion>

        <Seccion titulo="Bienvenida">
          <p style={{ ...parrafo, margin: '0 0 12px', fontSize: 16 }}>
            Vuelve a ver las pantallas de bienvenida del portal.
          </p>
          <Link to="/app/bienvenida" style={{
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY, textAlign: 'center', textDecoration: 'none',
            background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0,
            padding: '10px 20px', cursor: 'pointer', display: 'block',
          }}>Comenzar onboarding</Link>
        </Seccion>

        {/* Fila 3: ancho completo — Sesión y cuenta */}
        <Seccion titulo="Sesión y cuenta">
          <button type="button" onClick={salir} style={{
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY,
            background: 'none', border: `1.5px solid ${LINE}`, borderRadius: 0,
            padding: '10px 20px', cursor: 'pointer', width: '100%', marginBottom: 12,
          }}>Cerrar sesión</button>
          {!confirmBorrar ? (
            <button type="button" onClick={() => setConfirmBorrar(true)} style={{
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: ERROR,
              background: 'none', border: `1.5px solid ${ERROR}`, borderRadius: 0,
              padding: '9px 18px', cursor: 'pointer', width: '100%',
              transition: 'background 150ms ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = ERROR_BG; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >Cancelar mi cuenta</button>
          ) : (
            <div style={{ background: ERROR_BG, border: `1px solid ${ERROR}`, borderRadius: 0, padding: 16 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: ERROR_DK, margin: '0 0 12px', lineHeight: 1.5 }}>
                <strong>¿Estás seguro?</strong> Se borrará tu cuenta y perderás todo tu progreso. Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={eliminar} style={{
                  fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: '#fff',
                  background: ERROR, border: 'none', borderRadius: 0, padding: '9px 18px', cursor: 'pointer',
                }}>Sí, borrar mi cuenta</button>
                <button type="button" onClick={() => setConfirmBorrar(false)} style={{
                  fontFamily: FONT_BODY, fontSize: 13, color: ERROR_DK, background: 'none',
                  border: `1px solid ${ERROR}`, borderRadius: 0, padding: '9px 14px', cursor: 'pointer',
                }}>Cancelar</button>
              </div>
            </div>
          )}
        </Seccion>
      </div>

      {/* ── Modales de edición ── */}
      {editando === 'general' && (
        <Modal titulo="Configuración general" onClose={() => setEditando(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Idioma" value={draft.locale} opciones={IDIOMAS} onChange={v => setDraft(d => ({ ...d, locale: v }))} />
            <BtnGuardar onClick={() => guardar({ locale: draft.locale })} guardando={guardando} />
          </div>
        </Modal>
      )}

      {editando === 'personal' && (
        <Modal titulo="Datos personales" onClose={() => setEditando(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Nombre" value={draft.first_name} onChange={v => setDraft(d => ({ ...d, first_name: v }))} />
            <Campo label="Apellidos" value={draft.last_name} onChange={v => setDraft(d => ({ ...d, last_name: v }))} />
            <Campo label="Sexo" value={draft.sex} opciones={{ hombre: 'Hombre', mujer: 'Mujer' }} onChange={v => setDraft(d => ({ ...d, sex: v }))} />
            <Campo label="Año de nacimiento" tipo="number" value={draft.birth_year} onChange={v => setDraft(d => ({ ...d, birth_year: v ? Number(v) : null }))} />
            <Campo label="País" value={draft.country} onChange={v => setDraft(d => ({ ...d, country: v }))} placeholder="ES, MX, AR…" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 13, color: NAVY, cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.spiritual ?? false} onChange={e => setDraft(d => ({ ...d, spiritual: e.target.checked }))} />
              Vida espiritual
            </label>
            <BtnGuardar onClick={() => guardar(draft)} guardando={guardando} />
          </div>
        </Modal>
      )}

      {editando === 'password' && (
        <Modal titulo="Cambiar contraseña" onClose={() => setEditando(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CampoPwd label="Contraseña actual" value={pwdState.old} onChange={v => setPwdState(s => ({ ...s, old: v }))}
              visible={pwdState.showOld} onToggle={() => setPwdState(s => ({ ...s, showOld: !s.showOld }))} />
            <CampoPwd label="Nueva contraseña" value={pwdState.pwd} onChange={v => setPwdState(s => ({ ...s, pwd: v }))}
              visible={pwdState.showNew} onToggle={() => setPwdState(s => ({ ...s, showNew: !s.showNew }))} placeholder="Mínimo 6 caracteres" />
            <BtnGuardar onClick={guardarPwd} guardando={pwdState.estado === 'guardando'} />
            {pwdState.estado === 'ok' && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: SUCCESS_DK, margin: 0 }}>Contraseña actualizada</p>}
            {pwdState.estado === 'wrong' && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: ERROR_DK, margin: 0 }}>La contraseña actual no es correcta</p>}
            {pwdState.estado === 'error' && <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: ERROR_DK, margin: 0 }}>Error al cambiar la contraseña</p>}
          </div>
        </Modal>
      )}
    </>
  );
}

/* ─── Tab 2: Mis resultados ─── */

function BarraVirtud({ nombre, pct }) {
  return (
    <div style={{ padding: '7px 0', borderBottom: `1px solid ${LINE}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: NAVY }}>{nombre}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: MUTED }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: LINE, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: GOLD_REF, borderRadius: 3, transition: 'width 600ms ease' }} />
      </div>
    </div>
  );
}

function SelectorHistorico({ items, idx, setIdx }) {
  if (items.length <= 1) return null;
  const fmt = d => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <select value={idx} onChange={e => setIdx(Number(e.target.value))} style={{
        fontFamily: FONT_BODY, fontSize: 12, color: NAVY, background: BEIGE,
        border: `1px solid ${LINE}`, borderRadius: 0, padding: '4px 8px', cursor: 'pointer',
      }}>
        {items.map((t, i) => (
          <option key={i} value={i}>{fmt(t.taken_at)}{i === 0 ? ' (último)' : ''}</option>
        ))}
      </select>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: MUTED }}>
        {items.length} {items.length === 1 ? 'vez' : 'veces'}
      </span>
    </div>
  );
}

function RetomarLink({ to, children }) {
  return (
    <Link to={to} style={{
      display: 'block', textAlign: 'center', marginTop: 14, fontFamily: FONT_BODY,
      fontSize: 13, fontWeight: 600, color: GOLD_REF_DK, textDecoration: 'none',
      padding: '8px 0', border: `1.5px solid ${LINE}`, borderRadius: 0,
      transition: 'background 150ms ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(165,139,38,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >{children}</Link>
  );
}

const RENAME_PROGRESO = { curso1: 'modulo1', curso2: 'modulo2', curso3: 'modulo3', curso4: 'modulo4', curso5: 'modulo5', curso7: 'modulo7' };
const RENAME_NOTAS = { ...RENAME_PROGRESO };

function migrarClave(prefix, userId, cursoId, map) {
  const viejo = map[cursoId];
  if (!viejo) return;
  try {
    const claveVieja = `${prefix}:${userId}:${viejo}`;
    const claveNueva = `${prefix}:${userId}:${cursoId}`;
    const datos = localStorage.getItem(claveVieja);
    if (datos && !localStorage.getItem(claveNueva)) {
      localStorage.setItem(claveNueva, datos);
      localStorage.removeItem(claveVieja);
    }
  } catch {}
}

function leerSintesis(userId, cursoId) {
  migrarClave('vl-modulo', userId, cursoId, RENAME_PROGRESO);
  try {
    const bruto = JSON.parse(localStorage.getItem(`vl-modulo:${userId}:${cursoId}`));
    const cierre = bruto?.completados?.['m1-27'];
    if (!cierre || !cierre.lo_que_facilita) return null;
    return cierre;
  } catch { return null; }
}

function SeccionFormacion({ userId }) {
  const sint = leerSintesis(userId, 'curso1');
  if (!sint) return null;
  const fmt = d => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <Seccion titulo="Formación · Curso 1">
      <Fila label="Temperamento primario" valor={TEMP_NOMBRE[sint.temperamento_primario] ?? sint.temperamento_primario} />
      {sint.temperamento_secundario && <Fila label="Temperamento secundario" valor={TEMP_NOMBRE[sint.temperamento_secundario] ?? sint.temperamento_secundario} />}
      {sint.virtud_desafio && <Fila label="Virtud-desafío" valor={sint.virtud_desafio} />}
      <Fila label="Lo que me facilita" valor={sint.lo_que_facilita} />
      <Fila label="Lo que más me cuesta" valor={sint.lo_que_cuesta} />
      <Fila label="Mi propósito" valor={sint.proposito} />
      {sint.fecha && <Fila label="Fecha" valor={fmt(sint.fecha)} />}
    </Seccion>
  );
}

function TabDatos({ tests, personas, camino, user }) {
  const tempTests = tests.filter(t => t.kind === 'temperament');
  const charTests = tests.filter(t => t.kind === 'character');
  const [tempIdx, setTempIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const tempTest = tempTests[tempIdx];
  const charTest = charTests[charIdx];
  // Formato actual de los tests: temperamento { profileKey | primario/secundario } y carácter
  // { self: { virtud: 0..100 } }. Se mantiene la lectura del formato antiguo ({ profile }, { virtues: { v: { global: 0..1 } } }).
  const r = tempTest?.result;
  const tempPerfil = claveTemperamento(r) ?? [r?.primario, r?.secundario].filter(Boolean).join('-');
  const tempPartes = tempPerfil ? tempPerfil.split('-') : [];
  const pctVirtud = (key) => {
    const res = charTest?.result;
    if (typeof res?.self?.[key] === 'number') return Math.round(res.self[key]);
    if (typeof res?.virtues?.[key]?.global === 'number') return Math.round(res.virtues[key].global * 100);
    return null;
  };
  const virtudes = charTest && ['prudencia', 'fortaleza', 'dominio', 'justicia', 'magnanimidad', 'humildad'].some((k) => pctVirtud(k) !== null);
  const nombresV = { prudencia: 'Prudencia', fortaleza: 'Fortaleza', dominio: 'Dominio de sí', justicia: 'Justicia', magnanimidad: 'Magnanimidad', humildad: 'Humildad' };

  const sinDatos = !tempTest && !charTest && personas.length === 0 && !camino;
  if (sinDatos) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>Aún no tienes resultados</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>
          Completa tu primer test para ver tus resultados aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="vl-cols">
      {/* Fila 1: Temperamento + Virtudes */}
      <Seccion titulo="Tu temperamento">
        {tempTest ? (
          <>
            <SelectorHistorico items={tempTests} idx={tempIdx} setIdx={setTempIdx} />
            <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, margin: '2px 0 10px' }}>
              {tempPartes.map(t => TEMP_NOMBRE[t.toUpperCase()] ?? t).join(' – ')}
            </div>
            {tempTest.result?.scores && (() => {
              // Solo el formato antiguo trae puntos por temperamento; el actual solo guarda el perfil
              // (los empates de la fase 1 los resuelven las fases siguientes, así que no se recalculan).
              const entries = Object.entries(tempTest.result.scores).sort((a, b) => b[1] - a[1]);
              const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
              return entries.map(([t, pts]) => (
                <BarraVirtud key={t} nombre={TEMP_NOMBRE[t] ?? t} pct={Math.round(pts / total * 100)} />
              ));
            })()}
            <Fila label="Fecha" valor={new Date(tempTest.taken_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <Fila label="Veces realizado" valor={tempTests.length} />
            {tempTests.length > 1 && (() => {
              const perfiles = tempTests.map(tt => claveTemperamento(tt.result)).filter(Boolean);
              const mismo = perfiles.filter(p => p === perfiles[0]).length;
              return <Fila label="Coincidencia" valor={`${Math.round(mismo / perfiles.length * 100)}%`} />;
            })()}
          </>
        ) : (
          <p style={{ ...parrafo, margin: 0, fontSize: 13 }}>Aún no has hecho el test.</p>
        )}
        <RetomarLink to="/tests/temperamento">Volver a hacer el test</RetomarLink>
      </Seccion>

      <Seccion titulo="Tus virtudes">
        {charTest && virtudes ? (
          <>
            <SelectorHistorico items={charTests} idx={charIdx} setIdx={setCharIdx} />
            {Object.entries(nombresV).map(([key, nom]) => {
              const pct = pctVirtud(key);
              if (pct === null) return null;
              return <BarraVirtud key={key} nombre={nom} pct={pct} />;
            })}
            <Fila label="Fecha" valor={new Date(charTest.taken_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <Fila label="Veces realizado" valor={charTests.length} />
          </>
        ) : (
          <p style={{ ...parrafo, margin: 0, fontSize: 13 }}>Aún no has hecho el test.</p>
        )}
        <RetomarLink to="/tests/caracter">Volver a hacer el test</RetomarLink>
      </Seccion>

      {/* Fila 2: Formación */}
      <SeccionFormacion userId={user?.id} />

      {/* Fila 3: Camino + Personas */}
      <Seccion titulo="Tu camino">
        {camino ? (
          <>
            <Fila label="Objetivo" valor={camino.objetivo} />
            <Fila label="Estado de vida" valor={camino.estado_vida} />
            <Fila label="Vida interior" valor={camino.vida_interior === 'si' ? 'Sí' : camino.vida_interior === 'no' ? 'No' : camino.vida_interior} />
            <Fila label="Inicio" valor={camino.inicio ? new Date(camino.inicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            <Fila label="Hora mañana" valor={camino.hora_manana?.slice(0, 5)} />
            <Fila label="Hora examen" valor={camino.hora_examen?.slice(0, 5)} />
          </>
        ) : (
          <p style={{ ...parrafo, margin: 0, fontSize: 13 }}>Aún no has configurado tu camino.</p>
        )}
      </Seccion>

      <Seccion titulo={`Tus personas (${personas.length})`}>
        {personas.length > 0 ? personas.map((p, i) => (
          <div key={i} style={{ padding: '9px 0', borderBottom: i < personas.length - 1 ? `1px solid ${LINE}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY }}>
                {p.nombre} {p.estrella && '★'} {p.me_cuesta && '⚡'}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: MUTED }}>
                {GRUPO[p.grupo]} {p.relacion && `· ${p.relacion}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {p.primario && (
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: NAVY }}>
                  {TEMP_NOMBRE[p.primario]}{p.secundario ? ` – ${TEMP_NOMBRE[p.secundario]}` : ''}
                </div>
              )}
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: MUTED }}>{ESTADO_PERSONA[p.estado]}</div>
            </div>
          </div>
        )) : (
          <p style={{ ...parrafo, margin: 0, fontSize: 13 }}>Aún no has añadido personas.</p>
        )}
      </Seccion>

    </div>
  );
}

/* ─── Tab 3: Mis notas ─── */

// Los 7 cursos; el título sale del propio JSON del curso.
const MODULOS = [curso1, curso2, curso3, curso4, curso5, curso6, curso7]
  .map((data, i) => ({ id: data.id, titulo: `Curso ${i + 1} — ${data.titulo}`, data }));

const TIPO_LABEL = {
  test_profundo: 'Autoexamen',
  reflexion_piramide: 'Reflexión',
  identifica: 'Diagrama',
  define: 'Define',
  desliza: 'Desliza',
  retos_temperamento: 'Reto',
  cuestionario: 'Cuestionario',
  reflexion_guiada: 'Reflexión guiada',
};

function titulosPasos(data) {
  const map = {};
  let modIdx = 0;
  let currentMod = '';
  for (const p of data.pasos) {
    if (p.tipo === 'video' && p.visible !== false) {
      currentMod = `Mód. ${modIdx} · ${p.titulo}`;
      map[p.id] = currentMod;
      modIdx++;
    } else if (p.tipo === 'video') {
      // Vídeo oculto en el temario (segundo vídeo de un módulo): su nota va con su propio título.
      map[p.id] = currentMod ? `${currentMod} › ${p.titulo}` : p.titulo;
    } else if (currentMod) {
      const label = TIPO_LABEL[p.tipo] ?? p.tipo;
      map[p.id] = `${currentMod} › ${label}`;
    }
  }
  return map;
}

function buildTitulosGlobal() {
  const global = {};
  for (const mod of MODULOS) {
    const titulos = titulosPasos(mod.data);
    for (const [pasoId, titulo] of Object.entries(titulos)) {
      global[pasoId] = { titulo, modId: mod.id, modTitulo: mod.titulo };
    }
  }
  return global;
}

function TabNotas({ userId }) {
  const [notasBD, setNotasBD] = useState(null);
  const [cargando, setCargando] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    supabase.from('notas_formacion')
      .select('id, contenido_id, texto, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.warn('[notas] Error:', error.message); setCargando(false); return; }
        const mapa = {};
        for (const r of data ?? []) {
          if (!mapa[r.contenido_id]) mapa[r.contenido_id] = [];
          mapa[r.contenido_id].push({ id: r.id, texto: r.texto, fecha: r.created_at });
        }
        setNotasBD(mapa);
        setCargando(false);
      });
  }, [userId]);

  const titulosGlobal = buildTitulosGlobal();
  const todas = [];

  if (supabase && notasBD) {
    const porCurso = {};
    for (const [pasoId, arr] of Object.entries(notasBD)) {
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const info = titulosGlobal[pasoId];
      // Si el paso ya no está en el temario, la nota no se pierde: va a su curso por el prefijo (m6-… → curso6).
      const modId = info?.modId ?? `curso${/^m(\d+)-/.exec(pasoId)?.[1] ?? '?'}`;
      if (!porCurso[modId]) porCurso[modId] = [];
      porCurso[modId].push({ pasoId, titulo: info?.titulo ?? pasoId, notas: arr.slice().reverse() });
    }
    for (const mod of MODULOS) {
      if (porCurso[mod.id]?.length > 0) todas.push({ mod, entradas: porCurso[mod.id] });
    }
  } else if (!supabase) {
    for (const mod of MODULOS) {
      migrarClave('vl-notas', userId, mod.id, RENAME_NOTAS);
      const key = `vl-notas:${userId}:${mod.id}`;
      let raw;
      try { raw = localStorage.getItem(key); } catch { continue; }
      if (!raw) continue;
      let parsed;
      try { parsed = JSON.parse(raw); } catch { continue; }
      const entradas = [];
      for (const [pasoId, arr] of Object.entries(parsed)) {
        if (!Array.isArray(arr) || arr.length === 0) continue;
        const info = titulosGlobal[pasoId];
        entradas.push({ pasoId, titulo: info?.titulo ?? pasoId, notas: arr.slice().reverse() });
      }
      if (entradas.length > 0) todas.push({ mod, entradas });
    }
  }

  if (cargando) {
    return <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, textAlign: 'center', padding: '48px 24px' }}>Cargando notas…</p>;
  }

  if (todas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 18, fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>Aún no tienes notas</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>
          Tus notas de la formación aparecerán aquí, organizadas por curso y módulo.
        </p>
      </div>
    );
  }

  return (
    <div>
      {todas.map(({ mod, entradas }) => (
        <div key={mod.id} style={{ marginBottom: 28 }}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>{mod.titulo}</div>
          {entradas.map(({ pasoId, titulo, notas }) => (
            <div key={pasoId} style={{ ...tarjeta, marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_SLAB, fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
                {titulo}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notas.map((n) => (
                  <div key={n.id} style={{ padding: '12px 16px', borderLeft: `3px solid ${GOLD_REF}`, background: 'rgba(165,139,38,0.04)' }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
                      {new Date(n.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <NotaTexto texto={n.texto} style={{ fontFamily: FONT_BODY, fontSize: 15, color: NAVY, margin: 0, lineHeight: 1.6 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Componente principal ─── */

export default function Perfil() {
  const { user } = useOutletContext();
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState('config');

  const cargar = useCallback(() => {
    setCargando(true);
    leerPerfil(user.id).then(d => { setData(d); setCargando(false); })
      .catch(() => setCargando(false));
  }, [user.id]);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando && !data) {
    return <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: MUTED, textAlign: 'center', padding: 40 }}>Cargando perfil…</p>;
  }
  if (!data?.profile) {
    return <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: MUTED, textAlign: 'center', padding: 40 }}>No se pudo cargar el perfil.</p>;
  }

  const { profile, tests, personas, camino, consents } = data;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${LINE}`, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={{
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? NAVY : MUTED, background: 'none', border: 'none',
            padding: '10px 20px', cursor: 'pointer', position: 'relative',
            borderBottom: tab === t.key ? `2px solid ${GOLD_REF}` : '2px solid transparent',
            marginBottom: -2, transition: 'color 200ms ease',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'config' && <TabConfig user={user} profile={profile} consents={consents} onRefresh={cargar} />}
      {tab === 'datos' && <TabDatos tests={tests} personas={personas} camino={camino} user={user} />}
      {tab === 'notas' && <TabNotas userId={user.id} />}
    </div>
  );
}
