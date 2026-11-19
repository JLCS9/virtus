// Lo primero de la pestaña Camino: en qué ciclo de virtud estás («Ciclo de humildad»), tu racha y los días
// (dos anteriores, hoy y cinco siguientes), y tu gráfica de carácter con la virtud que estás trabajando
// resaltada y en movimiento. Sin plazos en pantalla. Solo pinta: los datos y la virtud ya vienen calculados.
import { LocalLink as Link, useT } from '../../i18n';
import { INK, MUTED, NAVY, FONT_BODY, GOLD_REF, GOLD_REF_DK } from '../../theme';
import { botonContorno, botonSobreClaro, eyebrow, parrafo, tarjeta, titulo } from '../estilos';
import { TEXTO_VIRTUD } from '../MapaCaracter';
import { VirtudesRadar } from '../Radar';
import TiraDeDias from './TiraDeDias';

export default function CicloDeVirtud({ virtud, estado, resultado, tira, racha, hoy }) {
  const { t } = useT();

  if (!virtud) {
    return (
      <section style={tarjeta} aria-label={t('camino.ciclo.eyebrow')}>
        <div style={eyebrow}>{t('camino.ciclo.eyebrow')}</div>
        <p style={{ ...parrafo, margin: '12px 0 16px' }}>{t('camino.ciclo.sin_temperamento')}</p>
        <Link to="/tests/temperamento" style={botonSobreClaro}>{t('camino.ciclo.hacer_temperamento')}</Link>
      </section>
    );
  }

  const clave = virtud === 'dominio_de_si' ? 'dominio' : virtud; // la gráfica llama «dominio» a dominio de sí
  const nombre = t(`camino.habitos.virtudes.${virtud}`);
  const completado = estado === 'completada';
  const valores = resultado?.valores;
  const valor = valores ? Math.round(valores[clave]) : null;

  return (
    <section style={{ ...tarjeta, minWidth: 0 }} aria-label={t('camino.ciclo.eyebrow')}>
      <style>{`
        .vl-ciclo { display: grid; gap: 14px; align-items: center; margin-top: 4px; }
        @media (min-width: 760px) { .vl-ciclo { grid-template-columns: minmax(0, 400px) minmax(0, 1fr); gap: 28px; } }
        .vl-ciclo-punto { animation: vl-ciclo-punto 1.8s ease-in-out infinite; }
        @keyframes vl-ciclo-punto { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.7); } }
        @media (prefers-reduced-motion: reduce) { .vl-ciclo-punto { animation: none; } }
      `}</style>
      <div style={eyebrow}>{t('camino.ciclo.eyebrow')}</div>
      <h2 style={{ ...titulo(30), margin: '8px 0 2px' }}>
        {t(completado ? 'camino.ciclo.titulo_completado' : 'camino.ciclo.titulo', { virtud: nombre.toLowerCase() })}
      </h2>
      <p style={{ ...parrafo, fontSize: 15 }}>{t('camino.ciclo.subtitulo')}</p>

      <TiraDeDias tira={tira} racha={racha} hoy={hoy} />

      <div className="vl-ciclo">
        <VirtudesRadar valores={valores} destacada={clave} sinDatos={!valores} ancho={400} letra={17} />

        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: GOLD_REF_DK, background: 'rgba(165,139,38,0.14)', borderRadius: 999, padding: '5px 12px' }}>
            <span className="vl-ciclo-punto" aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD_REF }} />
            {t(completado ? 'camino.ciclo.completado' : 'camino.ciclo.trabajando')}
          </span>
          <h3 style={{ ...titulo(32), margin: '12px 0 4px', color: NAVY }}>{nombre}</h3>
          {valor !== null && (
            <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: MUTED, margin: '0 0 10px' }}>
              <strong style={{ fontSize: 22, color: INK, marginRight: 6 }}>{valor} %</strong>{t('camino.ciclo.valor')}
            </p>
          )}
          <p style={{ ...parrafo, marginBottom: 16 }}>{TEXTO_VIRTUD[clave]?.cultivar}</p>
          {valores
            ? <Link to="/app/caracter" style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>{t('camino.ciclo.ver_test')}</Link>
            : (
              <>
                <p style={{ ...parrafo, fontSize: 15, marginBottom: 12 }}>{t('camino.ciclo.sin_test')}</p>
                <Link to="/tests/caracter" style={botonContorno}>{t('camino.ciclo.hacer_test')}</Link>
              </>
            )}
        </div>
      </div>
    </section>
  );
}
