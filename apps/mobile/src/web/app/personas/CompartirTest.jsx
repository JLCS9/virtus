// «Comparte el test con X y verifica su temperamento». Crea (o recupera) la invitación de la ficha y
// ofrece el enlace por WhatsApp, correo, el menú de compartir del móvil o copiándolo. Nunca se
// contacta a nadie desde aquí: el enlace lo envía el usuario por su cuenta. Cuando esa persona hace
// el test con el enlace y acepta compartirlo, su ficha pasa a «verificada» (lo hace el servidor).
import { useCallback, useEffect, useRef, useState } from 'react';
import { invitacionDe } from '../../account/personas';
import { enlaceInvitacion, mensajeInvitacion } from '../../lib/personas.js';
import { INK, LINE, MUTED, NAVY, PAPER, FONT_BODY, FONT_SLAB, GOLD_REF } from '../../theme';

// El enlace que se comparte es siempre el del sitio real, también al probar el portal en local:
// quien lo recibe tiene que poder abrirlo. (VITE_SITE_URL solo para apuntarlo a otro dominio.)
const SITIO = (process.env.EXPO_PUBLIC_SITE_URL || 'https://virtuousleadership.com').replace(/\/+$/, '');

const boton = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
  fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, textDecoration: 'none', cursor: 'pointer',
  color: NAVY, background: PAPER, border: `1.5px solid ${NAVY}`, borderRadius: 0, padding: '11px 16px',
};

export default function CompartirTest({ user, persona }) {
  const [estado, setEstado] = useState({ cargando: true });
  const [copiado, setCopiado] = useState(false);

  // `vigente` evita pintar el enlace de otra ficha si la persona cambia mientras llega la respuesta.
  const vigente = useRef(null);
  const cargar = useCallback(() => {
    const id = persona.id;
    vigente.current = id;
    setEstado({ cargando: true });
    invitacionDe(user.id, id)
      .then((inv) => { if (vigente.current === id) setEstado({ token: inv.token }); })
      .catch(() => { if (vigente.current === id) setEstado({ error: true }); });
  }, [user.id, persona.id]);
  useEffect(() => { cargar(); return () => { vigente.current = null; }; }, [cargar]);

  const nombre = persona.nombre;
  const caja = { borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: '16px 0 18px', margin: '4px 0 14px' };
  const cabecera = (
    <>
      <div style={{ fontFamily: FONT_SLAB, fontSize: 22, fontWeight: 700, color: NAVY, lineHeight: 1.25 }}>
        Comparte el test con {nombre} y verifica su temperamento
      </div>
      <p style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.5, color: INK, margin: '8px 0 14px' }}>
        Esto es lo que tú ves de {nombre}. Solo {nombre} puede confirmarlo: envíale el enlace y, cuando haga
        el test, su ficha se actualizará con su resultado.
      </p>
    </>
  );

  if (estado.cargando) return <div style={caja}>{cabecera}<p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: 0 }}>Preparando el enlace…</p></div>;
  if (estado.error) {
    return (
      <div style={caja}>
        {cabecera}
        <p role="alert" style={{ fontFamily: FONT_BODY, fontSize: 16, color: '#9C3A3A', margin: '0 0 10px' }}>No he podido preparar el enlace.</p>
        <button type="button" onClick={cargar} style={boton}>Reintentar</button>
      </div>
    );
  }

  const url = (canal) => enlaceInvitacion(SITIO, estado.token, canal);
  // Solo en desarrollo: el mismo enlace contra este servidor, para probar el lado del invitado.
  const urlLocal = (process.env.NODE_ENV !== 'production') && window.location.origin !== SITIO ? enlaceInvitacion(window.location.origin, estado.token, 'enlace') : null;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(mensajeInvitacion(nombre, url('whatsapp')))}`;
  const correo = `mailto:?subject=${encodeURIComponent('¿Cuál es tu temperamento?')}&body=${encodeURIComponent(mensajeInvitacion(nombre, url('email')))}`;
  const puedeCompartir = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url('enlace'));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 4000);
    } catch { /* sin permiso de portapapeles: el enlace queda visible abajo para copiarlo a mano */ }
  }
  function compartir() {
    navigator.share({ text: mensajeInvitacion(nombre, url('compartir')) }).catch(() => {});
  }

  return (
    <div style={caja}>
      {cabecera}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{ ...boton, color: PAPER, background: NAVY }}>WhatsApp</a>
        <a href={correo} style={boton}>Correo</a>
        {puedeCompartir && <button type="button" onClick={compartir} style={boton}>Compartir…</button>}
        <button type="button" onClick={copiar} style={{ ...boton, borderColor: copiado ? GOLD_REF : NAVY }}>{copiado ? 'Enlace copiado ✓' : 'Copiar enlace'}</button>
      </div>
      <input readOnly value={url('enlace')} aria-label={`Enlace del test para ${nombre}`} onFocus={(e) => e.target.select()}
             style={{ width: '100%', marginTop: 12, fontFamily: FONT_BODY, fontSize: 18, color: MUTED, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 0, padding: '10px 12px' }} />
      {urlLocal && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: '8px 0 0' }}>
          Solo en desarrollo: <a href={urlLocal} style={{ color: NAVY }}>abrir el enlace en este servidor local</a>
        </p>
      )}
      <p style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.45, color: MUTED, margin: '10px 0 0' }}>
        {nombre} decide si comparte su resultado contigo. Solo verás su temperamento, nunca sus respuestas.
      </p>
    </div>
  );
}
