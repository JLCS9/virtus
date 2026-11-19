// Los hábitos de hoy: una casilla por hábito (un solo gesto) y, si alguno está «en revisión», la
// pregunta de qué hacer con él. Solo pinta y guarda las marcas; las reglas están en lib/habitos.js.
import { useState } from 'react';
import { actualizarHabito, desmarcarHabito, marcarHabito } from '../../account/caminoDiario';
import { useT } from '../../i18n';
import { avance, decision, fechasDe, tieneCasilla } from '../../lib/habitos.js';
import { INK, LINE, MUTED, NAVY, PAPER, FONT_BODY } from '../../theme';
import { botonContorno, botonSobreClaro, eyebrow, parrafo, tarjeta } from '../estilos';
import { IconoCheck } from '../Iconos';

/** «Activo · 3 esta semana», «En prueba · Prueba: 4 días más», «En revisión»… */
export function resumenDeHabito(t, habito, a) {
  const estado = t(`camino.habitos.estados.${habito.estado}`);
  if (habito.estado === 'en_prueba') return `${estado} · ${t('camino.habitos.prueba', { n: a.diasDePrueba })}`;
  if (habito.estado === 'activo') return `${estado} · ${t('camino.habitos.ventana', { n: a.ventana, total: a.objetivo })}`;
  return `${estado} · ${t('camino.habitos.semana', { n: a.semana })}`;
}

export default function HabitosHoy({ habitos, marcas, hoy, userId, config, onCambio }) {
  const { t } = useT();
  const [error, setError] = useState(false);
  const [ajustando, setAjustando] = useState(null); // { id, texto }
  const visibles = habitos.filter(tieneCasilla);
  if (!visibles.length) return null;

  async function guardar(accion) {
    setError(false);
    try { await accion(); onCambio(); } catch { setError(true); }
  }
  const alternar = (h, marcado) => guardar(() => (marcado ? desmarcarHabito(h.id, hoy) : marcarHabito(userId, h.id, hoy)));
  const decidir = (h, quehacer, texto) => guardar(async () => {
    await actualizarHabito(h.id, decision(quehacer, hoy, texto));
    setAjustando(null);
  });

  return (
    <section style={{ ...tarjeta, gridColumn: '1 / -1' }} aria-label={t('camino.habitos.eyebrow')}>
      <div style={eyebrow}>{t('camino.habitos.eyebrow')}</div>
      <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'grid', gap: 12 }}>
        {visibles.map((h) => {
          const fechas = fechasDe(marcas, h.id);
          const marcado = fechas.has(hoy);
          return (
            <li key={h.id} style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button" role="checkbox" aria-checked={marcado} aria-label={t('camino.habitos.marcar', { texto: h.texto })}
                  onClick={() => alternar(h, marcado)}
                  style={{
                    flex: '0 0 34px', width: 34, height: 34, borderRadius: 0, cursor: 'pointer', display: 'grid', placeItems: 'center',
                    border: `2px solid ${NAVY}`, background: marcado ? NAVY : PAPER, color: PAPER,
                  }}
                >
                  {marcado && <IconoCheck width={20} height={20} />}
                </button>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.45, color: INK }}>{h.texto}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED }}>
                    {t(`camino.habitos.virtudes.${h.virtud}`)} · {resumenDeHabito(t, h, avance(h, fechas, hoy, config))}
                  </div>
                </div>
              </div>

              {h.estado === 'en_revision' && (
                <div style={{ marginTop: 10, paddingLeft: 46 }}>
                  <p style={{ ...parrafo, fontSize: 16, color: INK, marginBottom: 10 }}>{t('camino.habitos.revision.pregunta')}</p>
                  {ajustando?.id === h.id ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <input
                        type="text" maxLength={200} value={ajustando.texto} aria-label={t('camino.habitos.revision.texto')}
                        onChange={(e) => setAjustando({ id: h.id, texto: e.target.value })}
                        style={{ fontFamily: FONT_BODY, fontSize: 16, color: INK, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 0, padding: '12px 14px', minHeight: 48 }}
                      />
                      <div>
                        <button type="button" disabled={!ajustando.texto.trim()} onClick={() => decidir(h, 'ajustar', ajustando.texto)} style={botonSobreClaro}>
                          {t('camino.habitos.revision.guardar')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      <button type="button" onClick={() => setAjustando({ id: h.id, texto: h.texto })} style={botonContorno}>{t('camino.habitos.revision.ajustar')}</button>
                      <button type="button" onClick={() => decidir(h, 'mantener')} style={botonContorno}>{t('camino.habitos.revision.mantener')}</button>
                      <button type="button" onClick={() => decidir(h, 'dejar')} style={botonContorno}>{t('camino.habitos.revision.dejar')}</button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" style={{ ...parrafo, fontSize: 16, color: '#9b1c1c', marginTop: 12 }}>{t('camino.error_guardar')}</p>}
    </section>
  );
}
