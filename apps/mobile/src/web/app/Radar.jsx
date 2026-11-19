// Gráfica de las seis virtudes a partir del test de carácter: radar + barras. SVG, sin librerías.
import { GOLD_DEEP, INK, LINE, MUTED, FONT_BODY } from '../theme';
import { VIRTUDES, etapa, geometriaRadar } from '../lib/virtudes.js';

const TAMANO = 400;

/**
 * Gráfica de las seis virtudes.
 *  · `destacada` (clave de virtud): la que se está trabajando. Se resalta con un sector iluminado, un destello
 *    que late en su vértice y su etiqueta en dorado; las demás etiquetas quedan en segundo plano.
 *  · `sinDatos`: aún no hay test de carácter. Se dibujan solo los ejes y, si hay `destacada`, su sector.
 *  · `ancho`: ancho máximo en px. `letra`: tamaño de las etiquetas, en unidades del dibujo.
 * La gráfica entra creciendo desde el centro y la virtud destacada late; con «reducir movimiento», quieta.
 */
export function VirtudesRadar({ valores, destacada = null, sinDatos = false, ancho = 400, letra = 13 }) {
  const g = geometriaRadar(valores ?? {}, { tamano: TAMANO, margen: 94 });
  const puntos = g.poligono.map((p) => p.join(',')).join(' ');
  const iD = destacada ? VIRTUDES.findIndex((v) => v.clave === destacada) : -1;
  const resumen = sinDatos ? '' : VIRTUDES.map((v) => `${v.nombre} ${Math.round(valores[v.clave])} %`).join(', ');
  const nombreD = iD >= 0 ? VIRTUDES[iD].nombre : '';

  // El sector de la virtud destacada: del centro a la mitad de los dos lados que salen de su vértice.
  const cuna = (() => {
    if (iD < 0) return null;
    const n = VIRTUDES.length;
    const fin = (k) => g.ejes[(k + n) % n].fin;
    const medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return [[g.centro, g.centro], medio(fin(iD - 1), fin(iD)), fin(iD), medio(fin(iD), fin(iD + 1))].map((p) => p.join(',')).join(' ');
  })();
  const vertice = iD < 0 ? null : (sinDatos ? g.ejes[iD].fin : g.poligono[iD]);

  return (
    <svg viewBox={`0 0 ${TAMANO} ${TAMANO}`} role="img"
         aria-label={`Gráfica de tus virtudes${resumen ? `: ${resumen}` : ''}.${nombreD ? ` Estás trabajando ${nombreD}.` : ''}`}
         style={{ width: '100%', maxWidth: ancho, display: 'block', margin: '0 auto' }}>
      <style>{`
        .vl-radar-crece { transform-origin: ${g.centro}px ${g.centro}px; animation: vl-radar-crece 900ms cubic-bezier(.22,.61,.36,1) backwards; }
        @keyframes vl-radar-crece { from { transform: scale(0.15); opacity: 0; } to { transform: none; opacity: 1; } }
        .vl-radar-cuna { animation: vl-radar-respira 3.2s ease-in-out infinite; }
        @keyframes vl-radar-respira { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        .vl-radar-pulso { transform-box: fill-box; transform-origin: center; animation: vl-radar-pulso 2.2s ease-out infinite; }
        @keyframes vl-radar-pulso { 0% { transform: scale(0.6); opacity: 0.7; } 100% { transform: scale(2.4); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .vl-radar-crece, .vl-radar-cuna, .vl-radar-pulso { animation: none; } }
      `}</style>
      {cuna && <polygon className="vl-radar-cuna" points={cuna} fill="rgba(197,165,90,0.20)" />}
      {g.anillos.map((anillo, i) => (
        <polygon key={i} points={anillo.map((p) => p.join(',')).join(' ')} fill="none" stroke={LINE} strokeWidth={i === 3 ? 1.4 : 1} />
      ))}
      {g.ejes.map((e, i) => (
        <line key={e.clave} x1={g.centro} y1={g.centro} x2={e.fin[0]} y2={e.fin[1]}
              stroke={i === iD ? GOLD_DEEP : LINE} strokeWidth={i === iD ? 2.4 : 1} strokeLinecap="round" />
      ))}
      {!sinDatos && (
        <g className="vl-radar-crece">
          <polygon points={puntos} fill="rgba(197,165,90,0.30)" stroke={GOLD_DEEP} strokeWidth="2.2" strokeLinejoin="round" />
          {g.poligono.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === iD ? 5.5 : 4.2} fill={GOLD_DEEP} stroke="#FBF8F1" strokeWidth="1.5" />)}
        </g>
      )}
      {vertice && (
        <g aria-hidden>
          <circle className="vl-radar-pulso" cx={vertice[0]} cy={vertice[1]} r="9" fill="none" stroke={GOLD_DEEP} strokeWidth="2.5" />
          <circle cx={vertice[0]} cy={vertice[1]} r="6.5" fill={GOLD_DEEP} stroke="#fff" strokeWidth="2" />
        </g>
      )}
      {g.ejes.map((e, i) => {
        const [x, y] = e.etiqueta;
        const ancla = x < g.centro - 8 ? 'end' : x > g.centro + 8 ? 'start' : 'middle';
        const v = VIRTUDES[i];
        const esD = i === iD;
        return (
          <text key={e.clave} x={x} y={y} textAnchor={ancla} fontFamily={FONT_BODY} fill={esD ? GOLD_DEEP : INK} opacity={iD >= 0 && !esD ? 0.55 : 1}>
            <tspan x={x} dy="-0.2em" fontSize={esD ? letra + 2 : letra} fontWeight={esD ? 800 : 600}>{v.corta}</tspan>
            {!sinDatos && <tspan x={x} dy="1.35em" fontSize={letra - 1} fill={esD ? GOLD_DEEP : MUTED}>{Math.round(valores[v.clave])} %</tspan>}
          </text>
        );
      })}
    </svg>
  );
}

export function VirtudesBarras({ valores }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {VIRTUDES.map((v) => {
        const valor = Math.round(valores[v.clave]);
        const e = etapa(valor);
        return (
          <div key={v.clave}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: FONT_BODY, fontSize: 14, color: INK, marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>{v.nombre}</span>
              <span style={{ color: MUTED, fontSize: 13 }}>{e.texto} · {valor} %</span>
            </div>
            <div style={{ height: 8, borderRadius: 0, background: 'rgba(27,42,74,0.09)', overflow: 'hidden' }} role="presentation">
              <div style={{ width: `${valor}%`, height: '100%', borderRadius: 0, background: v.color, transition: 'width 600ms ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
