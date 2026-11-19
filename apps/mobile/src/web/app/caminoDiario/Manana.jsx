// La mañana: la cita de hoy y UNA propuesta de reto cada vez. El usuario la acepta o pide otra, hasta
// que acepte; aceptar la guarda y es su compromiso del día. «Otra» recorre primero las tres formas del
// mismo reto (con una persona, como hábito, en una situación) y después pasa a otro reto.
import { useEffect, useRef, useState } from 'react';
import { guardarDia } from '../../account/caminoDiario';
import { useT } from '../../i18n';
import { opcionesDelReto } from '../../lib/retos.js';
import { INK, MUTED, NAVY, FONT_BODY, FONT_SLAB, GOLD_REF, GOLD_REF_DK } from '../../theme';
import { botonContorno, botonSobreClaro, eyebrow, fechaLarga, parrafo, tarjeta, titulo } from '../estilos';

/**
 * `proponerOtro()` devuelve el siguiente reto distinto de los ya propuestos hoy, o null. Lo calcula quien
 * monta el componente porque conoce los retos válidos, el temperamento y el historial.
 */
export default function Manana({ reto, cita, valores, defectos, diaDeHoy, hoy, userId, proponerOtro, onGuardado, sinCita = false }) {
  const { t } = useT();
  const [error, setError] = useState(false);
  const [indice, setIndice] = useState(0);
  const fijado = useRef(false);

  // Al abrir la mañana se fijan el reto y la cita del día, para no perderlos si se recarga.
  useEffect(() => {
    if (diaDeHoy?.reto_id || fijado.current) return;
    fijado.current = true;
    guardarDia(userId, hoy, { reto_id: reto.id, cita_id: cita?.id ?? null, temperamento: reto.temperamento })
      .then(onGuardado)
      .catch(() => { fijado.current = false; setError(true); });
  }, [diaDeHoy, reto, cita, hoy, userId, onGuardado]);

  const opciones = opcionesDelReto(reto, valores, defectos);
  const aceptada = Boolean(diaDeHoy?.opcion);
  const propuesta = opciones[indice];

  async function aceptar() {
    setError(false);
    try {
      await guardarDia(userId, hoy, {
        reto_id: reto.id, cita_id: cita?.id ?? null, temperamento: reto.temperamento,
        opcion: propuesta.clave, texto: propuesta.texto, elegido_en: new Date().toISOString(),
      });
      onGuardado();
    } catch {
      setError(true);
    }
  }

  async function otra() {
    setError(false);
    if (indice < opciones.length - 1) { setIndice(indice + 1); return; }
    const siguiente = proponerOtro();
    if (!siguiente || siguiente.id === reto.id) { setIndice(0); return; }
    try {
      await guardarDia(userId, hoy, { reto_id: siguiente.id, temperamento: siguiente.temperamento });
      onGuardado(); // quien monta el componente lo vuelve a montar con el reto nuevo
    } catch {
      setError(true);
    }
  }

  const etiqueta = (clave) => t(`camino.manana.opciones.${clave}`);
  const mostrada = aceptada ? { clave: diaDeHoy.opcion, texto: diaDeHoy.texto } : propuesta;

  return (
    <section style={{ ...tarjeta, gridColumn: '1 / -1' }} aria-label={t('camino.manana.eyebrow')}>
      <div style={eyebrow}>{t('camino.manana.eyebrow')}</div>

      {cita && !sinCita && (
        <figure style={{ margin: '16px 0 0', padding: '0 0 0 14px', borderLeft: `2px solid ${GOLD_REF}` }}>
          <blockquote style={{ margin: 0, fontFamily: FONT_SLAB, fontSize: 18, lineHeight: 1.45, fontWeight: 500, color: NAVY }}>«{cita.texto}»</blockquote>
          <figcaption style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, marginTop: 8 }}>
            {cita.origen === 'citado' ? t('camino.manana.cita_citado', { autor: cita.autor }) : cita.autor}
          </figcaption>
        </figure>
      )}

      <h2 style={{ ...titulo(30), margin: '20px 0 4px' }}>{reto.consigna}</h2>
      <p style={{ ...parrafo, marginBottom: 14 }}>{aceptada ? t('camino.manana.elegida') : t('camino.manana.propuesta')}</p>

      <div
        aria-live="polite"
        style={{
          padding: '14px 16px', display: 'grid', gap: 3, fontFamily: FONT_BODY, borderRadius: 16, color: INK,
          border: aceptada ? '1px solid rgba(165,139,38,0.35)' : '1px solid transparent',
          background: aceptada ? 'rgba(165,139,38,0.10)' : 'rgba(27,42,74,0.04)',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: aceptada ? GOLD_REF_DK : MUTED }}>{etiqueta(mostrada.clave)}</span>
        <span style={{ fontSize: 17, lineHeight: 1.5 }}>{mostrada.texto}</span>
      </div>

      {aceptada ? (
        <p style={{ ...parrafo, fontSize: 15, marginTop: 14 }}>{t('camino.manana.noche')}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={aceptar} style={botonSobreClaro}>{t('camino.manana.aceptar')}</button>
          <button type="button" onClick={otra} style={botonContorno}>{t('camino.manana.otro')}</button>
        </div>
      )}
      {error && <p role="alert" style={{ ...parrafo, fontSize: 16, color: '#9b1c1c', marginTop: 14 }}>{t('camino.error_guardar')}</p>}
    </section>
  );
}
