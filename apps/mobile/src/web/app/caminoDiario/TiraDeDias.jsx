// La tira de días: tu racha, qué día es hoy y siempre los dos días anteriores y los cinco siguientes.
// Un día con reto aceptado va marcado. Solo pinta: la racha y los días vienen de lib/rachaDias.js.
import { useT } from '../../i18n';
import { fechaCorta } from '../../lib/camino.js';
import { INK, LINE, MUTED, NAVY, PAPER, FONT_BODY, FONT_SLAB, GOLD_REF, GOLD_REF_DK } from '../../theme';
import { IconoCheck } from '../Iconos';

const primeraMayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function TiraDeDias({ tira, racha, hoy }) {
  const { t } = useT();
  const textoRacha = racha === 0 ? t('camino.tira.racha_cero') : racha === 1 ? t('camino.tira.racha_uno') : t('camino.tira.racha', { n: racha });

  return (
    <div style={{ margin: '10px 0 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontFamily: FONT_SLAB, fontSize: 18, fontWeight: 700, color: NAVY }}>
          <span aria-hidden style={{ marginRight: 6 }}>🔥</span>{textoRacha}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED }}>{t('camino.tira.hoy_es', { fecha: fechaCorta(hoy) })}</div>
      </div>

      <ol aria-label={t('camino.tira.aria')} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: `repeat(${tira.length}, minmax(0, 1fr))`, gap: 2 }}>
        {tira.map((d) => {
          const esHoy = d.posicion === 'hoy';
          const futuro = d.posicion === 'futuro';
          const fecha = primeraMayuscula(fechaCorta(d.fecha));
          return (
            <li
              key={d.fecha} aria-current={esHoy ? 'date' : undefined}
              aria-label={esHoy ? t('camino.tira.aria_hoy', { fecha: fechaCorta(d.fecha) }) : t(d.hecho ? 'camino.tira.aria_hecho' : 'camino.tira.aria_sin', { fecha })}
              style={{ display: 'grid', justifyItems: 'center', gap: 4, padding: '6px 0', background: esHoy ? 'rgba(197,165,90,0.16)' : 'transparent', borderBottom: esHoy ? `3px solid ${GOLD_REF}` : '3px solid transparent' }}
            >
              <span aria-hidden style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: esHoy ? GOLD_REF_DK : MUTED }}>{t(`camino.tira.dias.${d.diaSemana}`)}</span>
              <span
                aria-hidden
                style={{
                  width: '100%', maxWidth: 32, aspectRatio: '1 / 1', borderRadius: '50%', display: 'grid', placeItems: 'center', boxSizing: 'border-box',
                  fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
                  background: d.hecho ? GOLD_REF : esHoy ? NAVY : 'transparent',
                  color: d.hecho || esHoy ? PAPER : futuro ? 'rgba(107,107,107,0.6)' : INK,
                  border: d.hecho || esHoy ? 'none' : `1.5px ${futuro ? 'dashed' : 'solid'} ${LINE}`,
                }}
              >
                {d.hecho ? <IconoCheck width={16} height={16} /> : d.dia}
              </span>
              <span aria-hidden style={{ fontFamily: FONT_BODY, fontSize: 12, color: esHoy && d.hecho ? NAVY : 'transparent', fontWeight: 700, lineHeight: 1 }}>{esHoy && d.hecho ? d.dia : '·'}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
