// Todos tus hábitos: los de la lista (con su avance), los adquiridos y los retirados, y el campo para
// escribir uno propio. Solo pinta y guarda; las reglas (límite, estados) están en lib/habitos.js.
import { useState } from 'react';
import { actualizarHabito, crearHabito } from '../../account/caminoDiario';
import { useT } from '../../i18n';
import { VIRTUDES_HABITO, avance, decision, fechasDe, puedeAnadir, tieneCasilla } from '../../lib/habitos.js';
import { INK, LINE, MUTED, FONT_BODY } from '../../theme';
import { botonContorno, botonSobreClaro, eyebrow, parrafo, tarjeta, titulo } from '../estilos';
import { resumenDeHabito } from './HabitosHoy';

const campo = { fontFamily: FONT_BODY, fontSize: 16, color: INK, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 0, padding: '12px 14px', minHeight: 48, width: '100%', boxSizing: 'border-box' };

export default function ListaHabitos({ habitos, marcas, hoy, userId, config, onCambio }) {
  const { t } = useT();
  const [error, setError] = useState(false);
  const [texto, setTexto] = useState('');
  const [virtud, setVirtud] = useState(VIRTUDES_HABITO[0]);

  const enMarcha = habitos.filter(tieneCasilla);
  const adquiridos = habitos.filter((h) => h.estado === 'consolidado');
  const retirados = habitos.filter((h) => h.estado === 'retirado');
  const cabe = puedeAnadir(habitos, config);

  async function guardar(accion) {
    setError(false);
    try { await accion(); onCambio(); } catch { setError(true); }
  }
  const anadir = () => guardar(async () => {
    await crearHabito(userId, { texto, virtud, hoy });
    setTexto('');
  });

  const fila = (h, boton) => (
    <li key={h.id} style={{ borderTop: `1px solid ${LINE}`, padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.45, color: INK }}>{h.texto}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED }}>
          {t(`camino.habitos.virtudes.${h.virtud}`)} · {resumenDeHabito(t, h, avance(h, fechasDe(marcas, h.id), hoy, config))}
        </div>
      </div>
      {boton}
    </li>
  );
  const lista = (items, boton) => (
    <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>{items.map((h) => fila(h, boton?.(h)))}</ul>
  );

  return (
    <section style={tarjeta} aria-label={t('camino.pagina.habitos.titulo')}>
      <div style={eyebrow}>{t('camino.pagina.habitos.titulo')}</div>

      {enMarcha.length === 0 && adquiridos.length === 0 && retirados.length === 0 && (
        <p style={{ ...parrafo, margin: '12px 0 0' }}>{t('camino.pagina.habitos.vacio')}</p>
      )}

      {enMarcha.length > 0 && lista(enMarcha, (h) => (
        <button type="button" onClick={() => guardar(() => actualizarHabito(h.id, decision('dejar', hoy)))} style={botonContorno}>
          {t('camino.pagina.habitos.dejar')}
        </button>
      ))}

      {adquiridos.length > 0 && (
        <>
          <h3 style={{ ...titulo(22), margin: '22px 0 0' }}>{t('camino.pagina.habitos.adquiridos')}</h3>
          {lista(adquiridos)}
        </>
      )}

      {retirados.length > 0 && (
        <>
          <h3 style={{ ...titulo(22), margin: '22px 0 0' }}>{t('camino.pagina.habitos.retirados')}</h3>
          {lista(retirados, (h) => (
            <button type="button" disabled={!cabe} onClick={() => guardar(() => actualizarHabito(h.id, decision('recuperar', hoy)))}
                    style={{ ...botonContorno, opacity: cabe ? 1 : 0.5, cursor: cabe ? 'pointer' : 'default' }}>
              {t('camino.pagina.habitos.recuperar')}
            </button>
          ))}
        </>
      )}

      <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 22, paddingTop: 18 }}>
        <h3 style={{ ...titulo(22), marginBottom: 12 }}>{t('camino.pagina.habitos.nuevo')}</h3>
        {cabe ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <input type="text" maxLength={200} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label={t('camino.pagina.habitos.nuevo_texto')}
                   placeholder={t('camino.pagina.habitos.nuevo_texto')} style={campo} />
            <label style={{ display: 'grid', gap: 6, fontFamily: FONT_BODY, fontSize: 16, color: MUTED }}>
              {t('camino.pagina.habitos.nuevo_virtud')}
              <select value={virtud} onChange={(e) => setVirtud(e.target.value)} style={campo}>
                {VIRTUDES_HABITO.map((v) => <option key={v} value={v}>{t(`camino.habitos.virtudes.${v}`)}</option>)}
              </select>
            </label>
            <div>
              <button type="button" disabled={!texto.trim()} onClick={anadir}
                      style={{ ...botonSobreClaro, opacity: texto.trim() ? 1 : 0.5, cursor: texto.trim() ? 'pointer' : 'default' }}>
                {t('camino.pagina.habitos.anadir')}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ ...parrafo, fontSize: 16 }}>{t('camino.pagina.habitos.maximo', { max: config.max_activos })}</p>
        )}
        {error && <p role="alert" style={{ ...parrafo, fontSize: 16, color: '#9b1c1c', marginTop: 12 }}>{t('camino.error_guardar')}</p>}
      </div>
    </section>
  );
}
