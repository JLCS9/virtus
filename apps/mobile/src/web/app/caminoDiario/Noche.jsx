// El examen de la noche: ¿lo has hecho?, reflexión y la pregunta para nutrir. Se abre en cuanto se ha
// elegido opción por la mañana. Cada paso se guarda al momento: un día que se queda a medias conserva
// lo hecho, aunque no se pueda terminar al día siguiente. La respuesta de nutrir alimenta la variable.
import { useState } from 'react';
import { crearHabito, guardarDia, guardarVariable } from '../../account/caminoDiario';
import { useT } from '../../i18n';
import { CUMPLIDOS, camposDeNutrir, pasoDeNoche } from '../../lib/retos.js';
import { INK, LINE, NAVY, PAPER, FONT_BODY } from '../../theme';
import { botonContorno, botonSobreClaro, eyebrow, parrafo, tarjeta, titulo } from '../estilos';
import { IconoCheck } from '../Iconos';
import CampoVariable from './CampoVariable';

const seccion = { ...tarjeta, gridColumn: '1 / -1' };

export default function Noche({ reto, diaDeHoy, hoy, userId, variable, filaVariable, valorActual, personas, habito, onGuardado, directo = false, alTerminar }) {
  const { t } = useT();
  const paso = pasoDeNoche(diaDeHoy);
  const [abierta, setAbierta] = useState(directo);
  const [adelante, setAdelante] = useState(false); // ya pasó de «reflexión» en esta sesión
  const [reflexion, setReflexion] = useState(diaDeHoy?.reflexion ?? '');
  const [nutrir, setNutrir] = useState({ valor: valorActual ?? '', personaId: filaVariable?.persona_id ?? null });
  const [estado, setEstado] = useState(null); // null · 'guardando' · 'error'
  const [sinHabito, setSinHabito] = useState(false); // «Ahora no» (solo mientras dura la pantalla)

  if (!paso) return null;

  async function anadirHabito() {
    setEstado('guardando');
    try {
      await crearHabito(userId, { texto: habito.texto, virtud: habito.virtud, retoId: reto.id, hoy });
    } catch {
      setEstado('error');
      return;
    }
    setEstado(null);
    onGuardado();
  }

  if (paso === 'hecho') {
    return (
      <section style={seccion} aria-label={t('camino.noche.eyebrow')}>
        <div style={eyebrow}>{t('camino.noche.eyebrow')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 8px' }}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: NAVY, color: PAPER, display: 'grid', placeItems: 'center' }}><IconoCheck width={18} height={18} /></span>
          <h2 style={{ ...titulo(26) }}>{t('camino.noche.hecho_titulo')}</h2>
        </div>
        <p style={parrafo}>{t(`camino.noche.hecho_mensaje.${diaDeHoy.cumplido}`)}</p>
        {habito && !sinHabito && (
          <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 18, paddingTop: 16 }}>
            <h3 style={{ ...titulo(22), marginBottom: 8 }}>{t('camino.habitos.ofrecer.pregunta')}</h3>
            <p style={{ ...parrafo, color: INK, marginBottom: 6 }}>«{habito.texto}»</p>
            <p style={{ ...parrafo, fontSize: 16, marginBottom: 14 }}>{t('camino.habitos.ofrecer.ayuda')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button type="button" disabled={estado === 'guardando'} onClick={anadirHabito} style={botonSobreClaro}>{t('camino.habitos.ofrecer.si')}</button>
              <button type="button" onClick={() => setSinHabito(true)} style={botonContorno}>{t('camino.habitos.ofrecer.no')}</button>
            </div>
            {estado === 'error' && <p role="alert" style={{ ...parrafo, fontSize: 16, color: '#9b1c1c', marginTop: 12 }}>{t('camino.error_guardar')}</p>}
          </div>
        )}
        {alTerminar && <div style={{ marginTop: 18 }}><button type="button" onClick={alTerminar} style={botonSobreClaro}>{t('camino.guiado.listo')}</button></div>}
      </section>
    );
  }

  async function guardar(campos, despues) {
    setEstado('guardando');
    try {
      await despues?.();
      await guardarDia(userId, hoy, campos);
    } catch {
      setEstado('error');
      return false;
    }
    setEstado(null);
    onGuardado();
    return true;
  }

  const elegirCumplido = (cumplido) => guardar({ cumplido });
  const seguirReflexion = async (saltar) => {
    const texto = saltar ? '' : reflexion.trim();
    if (!texto || await guardar({ reflexion: texto })) setAdelante(true);
  };
  const terminar = (saltar) => {
    const campos = saltar ? {} : camposDeNutrir(reto, nutrir.valor);
    return guardar(
      { ...campos, examen_en: new Date().toISOString() },
      campos.nutrir_variable
        ? () => guardarVariable(userId, { variable: variable.id, valor: nutrir.valor, personaId: nutrir.personaId, origen: 'noche' })
        : undefined,
    );
  };

  const guardando = estado === 'guardando';
  const error = estado === 'error' && <p role="alert" style={{ ...parrafo, fontSize: 16, color: '#9b1c1c', marginTop: 14 }}>{t('camino.error_guardar')}</p>;

  if (paso === 'cumplido' && !abierta) {
    return (
      <section style={seccion} aria-label={t('camino.noche.eyebrow')}>
        <div style={eyebrow}>{t('camino.noche.eyebrow')}</div>
        <h2 style={{ ...titulo(26), margin: '10px 0 16px' }}>{t('camino.noche.empezar_titulo')}</h2>
        <button type="button" style={botonSobreClaro} onClick={() => setAbierta(true)}>{t('camino.noche.empezar')}</button>
      </section>
    );
  }

  return (
    <section style={seccion} aria-label={t('camino.noche.eyebrow')}>
      <div style={eyebrow}>{t('camino.noche.eyebrow')}</div>
      {diaDeHoy.texto && (
        <p style={{ ...parrafo, fontSize: 16, margin: '10px 0 0' }}>
          {t('camino.noche.tu_compromiso')} <span style={{ color: INK }}>{diaDeHoy.texto}</span>
        </p>
      )}

      {paso === 'cumplido' && (
        <>
          <h2 style={{ ...titulo(28), margin: '16px 0 16px' }}>{t('camino.noche.cumplido')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {CUMPLIDOS.map((c) => (
              <button
                key={c} type="button" disabled={guardando} onClick={() => elegirCumplido(c)}
                style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: INK, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 0, padding: '12px 12px', minHeight: 46, cursor: 'pointer' }}
              >
                {t(`camino.noche.cumplidos.${c}`)}
              </button>
            ))}
          </div>
          {error}
        </>
      )}

      {paso === 'reflexion' && !adelante && (
        <>
          <h2 style={{ ...titulo(28), margin: '16px 0 6px' }}>{reto.noche.reflexion}</h2>
          <p style={{ ...parrafo, fontSize: 16, marginBottom: 12 }}>{t('camino.noche.reflexion_ayuda')}</p>
          <textarea
            value={reflexion} onChange={(e) => setReflexion(e.target.value)} maxLength={500} rows={4} aria-label={reto.noche.reflexion}
            style={{ fontFamily: FONT_BODY, fontSize: 16, color: INK, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 0, padding: '14px 16px', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
            <button type="button" disabled={guardando || !reflexion.trim()} onClick={() => seguirReflexion(false)}
                    style={{ ...botonSobreClaro, opacity: reflexion.trim() ? 1 : 0.5, cursor: reflexion.trim() ? 'pointer' : 'default' }}>
              {guardando ? t('camino.noche.guardando') : t('camino.noche.siguiente')}
            </button>
            <button type="button" disabled={guardando} onClick={() => seguirReflexion(true)} style={botonContorno}>{t('camino.noche.saltar')}</button>
          </div>
          {error}
        </>
      )}

      {paso === 'reflexion' && adelante && (
        <>
          <h2 style={{ ...titulo(28), margin: '16px 0 6px' }}>{reto.noche.nutrir}</h2>
          <p style={{ ...parrafo, fontSize: 16, marginBottom: 14 }}>
            {t('camino.noche.nutrir_ayuda')}{valorActual ? ` ${t('camino.noche.nutrir_actual')}` : ''}
          </p>
          <CampoVariable
            variable={variable} personas={personas} etiqueta={reto.noche.nutrir}
            valor={nutrir.valor} personaId={nutrir.personaId} onCambiar={setNutrir}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
            <button type="button" disabled={guardando} onClick={() => terminar(false)} style={botonSobreClaro}>
              {guardando ? t('camino.noche.guardando') : t('camino.noche.terminar')}
            </button>
            <button type="button" disabled={guardando} onClick={() => terminar(true)} style={botonContorno}>{t('camino.noche.saltar')}</button>
          </div>
          {error}
        </>
      )}
    </section>
  );
}
