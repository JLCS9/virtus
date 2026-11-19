// Los días que has vivido: el reto, lo que elegiste, si lo cumpliste y lo que escribiste. Del más
// reciente al más antiguo. Un día sin examen se ve tal cual quedó: no se recupera.
import biblioteca from '../../data/camino-biblioteca.json';
import { useT } from '../../i18n';
import { fechaCorta } from '../../lib/camino.js';
import { INK, LINE, MUTED, FONT_BODY } from '../../theme';
import { eyebrow, parrafo, tarjeta } from '../estilos';

const RETOS = Object.fromEntries(biblioteca.retos.map((r) => [r.id, r]));
const primeraMayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Historial({ dias }) {
  const { t } = useT();
  const vividos = dias.filter((d) => d.reto_id).slice().reverse();

  return (
    <section style={tarjeta} aria-label={t('camino.pagina.historial.titulo')}>
      <div style={eyebrow}>{t('camino.pagina.historial.titulo')}</div>
      {vividos.length === 0 && <p style={{ ...parrafo, margin: '12px 0 0' }}>{t('camino.pagina.historial.vacio')}</p>}
      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
        {vividos.map((d) => (
          <li key={d.fecha} style={{ borderTop: `1px solid ${LINE}`, padding: '14px 0' }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED }}>{primeraMayuscula(fechaCorta(d.fecha))}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: INK, margin: '2px 0 4px' }}>{RETOS[d.reto_id]?.consigna ?? d.reto_id}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.5, color: INK }}>{d.texto ?? t('camino.pagina.historial.sin_opcion')}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, marginTop: 4 }}>
              {d.cumplido ? t(`camino.noche.cumplidos.${d.cumplido}`) : t('camino.pagina.historial.sin_examen')}
            </div>
            {d.reflexion && <div style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.5, color: MUTED, marginTop: 4 }}>«{d.reflexion}»</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
