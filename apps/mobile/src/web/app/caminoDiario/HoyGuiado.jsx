// Hoy, de uno en uno: mientras te falte algo por hacer, enseña SOLO eso con un «Siguiente» (la frase de hoy,
// aceptar el reto y, cuando toca, el examen de la noche), y cuando estás al día sale la pantalla principal con
// un «Estás al día». Qué falta y en qué orden lo decide lib/hoyGuiado.js; aquí solo se monta.
import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { INK, MUTED, NAVY, FONT_BODY, FONT_SLAB, GOLD_REF, GOLD_REF_DK } from '../../theme';
import { botonSobreClaro, eyebrow, tarjeta } from '../estilos';
import { EsqueletoTarjeta } from '../Esqueleto';
import { IconoCheck } from '../Iconos';
import CaminoHoy from './CaminoHoy';
import Manana from './Manana';
import Noche from './Noche';
import PreguntasIniciales from './PreguntasIniciales';
import { DEFECTOS, VARIABLES, useHoy } from './useHoy';
import { pasoActual } from '../../lib/hoyGuiado.js';

function PasoFrase({ cita, onSiguiente }) {
  const { t } = useT();
  return (
    <section style={tarjeta} aria-label={t('camino.guiado.frase')}>
      <div style={eyebrow}>{t('camino.guiado.frase')}</div>
      <figure style={{ margin: '18px 0 22px', padding: '0 0 0 16px', borderLeft: `2px solid ${GOLD_REF}` }}>
        <blockquote style={{ margin: 0, fontFamily: FONT_SLAB, fontSize: 24, lineHeight: 1.4, fontWeight: 500, color: NAVY }}>«{cita.texto}»</blockquote>
        <figcaption style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, marginTop: 10 }}>
          {cita.origen === 'citado' ? t('camino.manana.cita_citado', { autor: cita.autor }) : cita.autor}
        </figcaption>
      </figure>
      <button type="button" onClick={onSiguiente} style={botonSobreClaro}>{t('camino.guiado.siguiente')}</button>
    </section>
  );
}

// El check de «estás al día». Si el examen de esta noche aún no toca, lo recuerda sin que cuente como pendiente.
function AlDia({ examenPendiente }) {
  const { t } = useT();
  return (
    <div
      role="status"
      style={{
        gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16,
        background: 'rgba(165,139,38,0.10)', border: '1px solid rgba(165,139,38,0.30)',
      }}
    >
      <style>{`
        .vl-aldia-check { animation: vl-aldia 480ms cubic-bezier(.34,1.56,.64,1) backwards; }
        @keyframes vl-aldia { from { transform: scale(0.4); opacity: 0; } to { transform: none; opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .vl-aldia-check { animation: none; } }
      `}</style>
      <span className="vl-aldia-check" aria-hidden style={{ flex: '0 0 30px', width: 30, height: 30, borderRadius: '50%', background: GOLD_REF, color: '#fff', display: 'grid', placeItems: 'center' }}>
        <IconoCheck width={18} height={18} />
      </span>
      <div style={{ fontFamily: FONT_BODY, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{t('camino.guiado.al_dia')}</div>
        <div style={{ fontSize: 14, color: GOLD_REF_DK }}>{t(examenPendiente ? 'camino.guiado.al_dia_noche' : 'camino.guiado.al_dia_todo')}</div>
      </div>
    </div>
  );
}

/**
 * `children` es una función que recibe `{ superior }` (el «Estás al día» y el reto, el examen y los hábitos de hoy)
 * y devuelve la pantalla principal; así Hoy decide cómo colocarla.
 */
export default function HoyGuiado({ tempClave, cargandoTemperamento, children }) {
  const hoy = useHoy(tempClave);
  const [fraseVista, setFraseVista] = useState(false);
  const [enExamen, setEnExamen] = useState(false); // el examen se abrió en esta visita y aún no se ha pulsado «Listo»
  const pasosDelInicio = useRef(null); // los pasos con los que se empezó, para «Paso 2 de 3»
  const { t } = useT();

  // Al terminar el examen se queda en su pantalla de cierre hasta pulsar «Listo»: en cuanto se guarda, el paso
  // ya no figura como pendiente y, sin esto, saltaría a la pantalla principal sin enseñar el cierre.
  const actual = enExamen ? 'examen' : pasoActual(hoy.pasos, { fraseVista });
  useEffect(() => { if (actual === 'examen' && !enExamen) setEnExamen(true); }, [actual, enExamen]);

  if (cargandoTemperamento || hoy.cargando) return <EsqueletoTarjeta alto={320} />;
  if (hoy.error || hoy.sinContenido) return children({ superior: <CaminoHoy hoy={hoy} /> });

  if (!pasosDelInicio.current) pasosDelInicio.current = hoy.pasos;

  if (!actual) {
    const examenPendiente = hoy.aceptado && !hoy.examenHecho;
    return children({ superior: <><AlDia examenPendiente={examenPendiente} /><CaminoHoy hoy={hoy} /></> });
  }

  const { camino, personas, reto, cita, valores, variable, habito } = hoy;
  const lista = pasosDelInicio.current;
  const n = lista.indexOf(actual) + 1;

  return (
    <div style={{ maxWidth: 680, margin: '3vh auto 0' }}>
      {lista.length > 1 && n > 0 && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: MUTED, margin: '0 4px 10px' }}>
          {t('camino.guiado.paso', { n, total: lista.length })}
        </p>
      )}

      {actual === 'iniciales' && (
        <PreguntasIniciales
          preguntas={hoy.pendientesIniciales} variables={VARIABLES} personas={personas.lista} userId={camino.userId} onTerminado={camino.recargar}
        />
      )}
      {actual === 'frase' && <PasoFrase cita={cita} onSiguiente={() => setFraseVista(true)} />}
      {actual === 'reto' && (
        <Manana
          key={reto.id} reto={reto} cita={cita} sinCita valores={valores} defectos={DEFECTOS}
          diaDeHoy={camino.diaDeHoy} hoy={camino.hoy} userId={camino.userId} onGuardado={camino.recargar}
          proponerOtro={hoy.proponerOtro}
        />
      )}
      {actual === 'examen' && (
        <Noche
          reto={reto} diaDeHoy={camino.diaDeHoy} hoy={camino.hoy} userId={camino.userId} variable={variable}
          filaVariable={camino.variables.find((v) => v.variable === variable.id)} valorActual={valores[variable.id]}
          personas={personas.lista} onGuardado={camino.recargar} habito={habito}
          directo alTerminar={() => setEnExamen(false)}
        />
      )}
    </div>
  );
}
