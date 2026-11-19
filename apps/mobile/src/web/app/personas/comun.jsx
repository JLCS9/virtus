// Piezas comunes de las fichas de personas: avatar, etiqueta de estado, contenido de la ficha según
// el temperamento y el mapa de mis personas.
import { useState } from 'react';
import { useT } from '../../i18n';
import { FICHA, TEMPS, TEXTO_CONFIANZA, combinacion } from '../../lib/personas.js';
import { INK, LINE, MUTED, NAVY, PAPER, TEMP_COLORS, FONT_SLAB, FONT_BODY, GOLD_REF } from '../../theme';
import { eyebrow, parrafo } from '../estilos';

export function useNombresTemp() {
  const { t } = useT();
  return Object.fromEntries(TEMPS.map((k) => [k, t(`temperaments.${k}`)?.name ?? k]));
}

export function Avatar({ persona, tam = 44 }) {
  const color = TEMP_COLORS[persona.primario] ?? 'rgba(27,42,74,0.25)';
  const contenido = persona.avatar || persona.nombre.trim().charAt(0).toUpperCase();
  return (
    <span aria-hidden style={{
      width: tam, height: tam, flex: `0 0 ${tam}px`, borderRadius: '50%', display: 'grid', placeItems: 'center',
      background: PAPER, border: `3px solid ${color}`, fontFamily: FONT_BODY, fontWeight: 700, color: NAVY,
      fontSize: persona.avatar ? tam * 0.5 : tam * 0.4,
    }}>{contenido}</span>
  );
}

/** Insignia de ficha verificada: la persona hizo el test con el enlace que se le compartió. */
export function Verificado({ tam = 15 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" role="img" aria-label="Verificado" style={{ flex: `0 0 ${tam}px`, verticalAlign: '-2px' }}>
      <path fill="#1D9BF0" d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.7 1.8-1 3 1 3-2.7 1.8-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3-2.7-1.8 1-3-1-3 2.7-1.8 1-3 3.2.2z" />
      <path fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M7.8 12.2l2.8 2.8 5.6-5.8" />
    </svg>
  );
}

export const estaVerificada = (persona) => persona?.estado === 'confirmado';

export function EtiquetaEstado({ persona }) {
  const nombres = useNombresTemp();
  if (!persona.primario) return <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: MUTED }}>Sin estimar</span>;
  return (
    <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: MUTED }}>
      <strong style={{ color: TEMP_COLORS[persona.primario] }}>{nombres[persona.primario]}</strong>
      {persona.secundario && nombres[persona.secundario] && (
        <> y <strong style={{ color: TEMP_COLORS[persona.secundario] }}>{nombres[persona.secundario].toLowerCase()}</strong></>
      )}
      {' · '}
      {estaVerificada(persona)
        ? <span style={{ color: INK, fontWeight: 600 }}><Verificado /> Verificado por {persona.nombre}</span>
        : 'Pendiente de verificación'}
    </span>
  );
}

const fila = (titulo, contenido) => (
  <div style={{ borderTop: `1px solid ${LINE}`, padding: '12px 0' }}>
    <div style={{ ...eyebrow, color: MUTED, marginBottom: 6 }}>{titulo}</div>
    {contenido}
  </div>
);

/** Lema, lo que le sale fácil, lo que le cuesta, cómo tratarle, su virtud-desafío y «Tú y X». */
export function FichaContenido({ persona, miPrimario }) {
  const nombres = useNombresTemp();
  const f = FICHA[persona.primario];
  if (!f) return null;
  const combo = combinacion(miPrimario, persona.primario);
  return (
    <div>
      {fila('Lema', <p style={{ fontFamily: FONT_SLAB, fontSize: 22, color: NAVY, margin: 0 }}>{f.lema.charAt(0).toUpperCase() + f.lema.slice(1)}</p>)}
      {fila('Le sale fácil', <p style={{ ...parrafo, color: INK }}>{f.facil}</p>)}
      {fila('Le cuesta', <p style={{ ...parrafo, color: INK }}>{f.cuesta}</p>)}
      {fila('Cómo tratarle', <ul style={{ ...parrafo, color: INK, paddingLeft: 18, margin: 0 }}>{f.tratar.map((t) => <li key={t}>{t}</li>)}</ul>)}
      {fila('Su virtud-desafío', <p style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>{f.virtud}</p>)}
      {combo && fila(`Tú y ${persona.nombre}`, (
        <>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: MUTED, marginBottom: 4 }}>
            {nombres[miPrimario]} y {nombres[persona.primario].toLowerCase()}
          </div>
          <p style={{ ...parrafo, color: INK, borderLeft: `3px solid ${GOLD_REF}`, paddingLeft: 12 }}>{combo}</p>
        </>
      ))}
    </div>
  );
}

const ETIQUETA_MAPA = { familia: 'FAMILIA', amigos: 'AMIGOS', trabajo: 'TRABAJO', comunidad: 'COMUNIDAD' };
const NOMBRE_TEMP = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };

// `onElegirPersona(persona)`: si se pasa, cada avatar es un enlace (con ratón, toque o teclado) a su ficha.
export function MapaPersonas({ personas, nombreTu = 'Tú', miPrimario, hoverId: extHoverId, onHoverPersona, onElegirPersona }) {
  const [hoverTemp, setHoverTemp] = useState(null);
  const [localHoverId, setLocalHoverId] = useState(null);
  const hoverId = extHoverId !== undefined ? extHoverId : localHoverId;
  const setHoverId = onHoverPersona || setLocalHoverId;
  const T = 360;
  const C = T / 2;
  const RNodo = 26;
  const RCentro = 30;
  const grupos = ['familia', 'amigos', 'trabajo', 'comunidad'].filter((g) => personas.some((p) => p.grupo === g));
  const n = personas.length;
  if (!n) return null;

  const conteos = grupos.map((g) => personas.filter((p) => p.grupo === g).length);
  const pesos = conteos.map((c) => Math.max(c, 1.5));
  const totalPeso = pesos.reduce((a, b) => a + b, 0);
  const sectores = pesos.map((w) => (w / totalPeso) * 2 * Math.PI);
  let acum = -Math.PI / 2;
  const inicios = sectores.map((s) => { const prev = acum; acum += s; return prev; });

  const puntos = [];
  grupos.forEach((g, gi) => {
    const delGrupo = personas.filter((p) => p.grupo === g);
    const cnt = delGrupo.length;
    delGrupo.forEach((p, i) => {
      const usable = sectores[gi] * 0.88;
      const margin = (sectores[gi] - usable) / 2;
      const ang = inicios[gi] + margin + ((i + 1) / (cnt + 1)) * usable;
      const r = cnt === 1 ? 150 : (i % 2 === 0 ? 160 : 105);
      puntos.push({ p, x: C + r * Math.cos(ang), y: C + r * Math.sin(ang) });
    });
  });

  const etiquetas = grupos.length < 2 ? [] : grupos.map((g, gi) => {
    const ang = inicios[gi] + sectores[gi] / 2;
    const cos = Math.cos(ang);
    return { g, x: C + 205 * cos, y: C + 205 * Math.sin(ang), ancla: Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end' };
  });

  const miBase = miPrimario?.split('-')[0];
  const hayHover = hoverId || hoverTemp;
  const esDestacado = (p) => {
    if (hoverId) return p.id === hoverId;
    if (hoverTemp) return p.primario === hoverTemp;
    return true;
  };
  const centroOpacity = hoverId ? 0.5 : (!hoverTemp || hoverTemp === miBase ? 1 : 0.2);
  const trans = 'opacity 200ms ease, filter 200ms ease';
  const tempPresentes = [...new Set(personas.map((p) => p.primario).filter(Boolean))];

  const lineaDesde = (x, y) => {
    const dx = x - C, dy = y - C;
    const d = Math.sqrt(dx * dx + dy * dy);
    return { x1: C + (RCentro + 2) * dx / d, y1: C + (RCentro + 2) * dy / d, x2: x - (RNodo + 2) * dx / d, y2: y - (RNodo + 2) * dy / d };
  };

  return (
    <svg viewBox={`-80 -40 ${T + 160} ${T + 110}`} width="100%" style={{ maxWidth: 620, display: 'block', margin: '0 auto' }} role="img"
         aria-label={`Mapa de tus personas: ${personas.map((p) => p.nombre).join(', ')}`}>
      <defs>
        <filter id="nodo-glow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {grupos.length > 1 && inicios.map((ang, gi) => (
        <line key={grupos[gi]} x1={C} y1={C} x2={C + 195 * Math.cos(ang)} y2={C + 195 * Math.sin(ang)} stroke={LINE} strokeDasharray="3 4" />
      ))}

      {puntos.map(({ p, x, y }) => {
        const l = lineaDesde(x, y);
        return (
          <line key={`l${p.id}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={TEMP_COLORS[p.primario] ?? 'rgba(27,42,74,0.12)'}
            strokeWidth={esDestacado(p) && hayHover ? 2.5 : 1.2}
            strokeOpacity={hayHover && !esDestacado(p) ? 0.06 : 0.35}
            style={{ transition: 'stroke-opacity 200ms ease, stroke-width 200ms ease' }} />
        );
      })}

      <g style={{ opacity: centroOpacity, transition: trans }}>
        {miBase && TEMP_COLORS[miBase] && (
          <circle cx={C} cy={C} r={RCentro + 5} fill="none" stroke={TEMP_COLORS[miBase]} strokeWidth="3" strokeOpacity={centroOpacity > 0.5 ? 0.5 : 0.1} />
        )}
        <circle cx={C} cy={C} r={RCentro} fill={NAVY} />
        <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontFamily={FONT_BODY} fontSize="14" fontWeight="700" fill={PAPER}>{nombreTu}</text>
      </g>

      {puntos.map(({ p, x, y }) => {
        const contenido = p.avatar || p.nombre.trim().charAt(0).toUpperCase();
        const esEmoji = !!p.avatar;
        const destacado = esDestacado(p);
        return (
          <g key={p.id}
            onMouseEnter={() => { setHoverId(p.id); setHoverTemp(null); }}
            onMouseLeave={() => setHoverId(null)}
            {...(onElegirPersona ? {
              role: 'link', tabIndex: 0, 'aria-label': `Abrir la ficha de ${p.nombre}`,
              onClick: () => onElegirPersona(p),
              onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onElegirPersona(p); } },
              onFocus: () => setHoverId(p.id), onBlur: () => setHoverId(null),
              className: 'vl-nodo-persona',
            } : {})}
            style={{ cursor: 'pointer', opacity: destacado ? 1 : 0.15, transition: trans, outline: 'none' }}
            filter={destacado && hayHover ? 'url(#nodo-glow)' : undefined}>
            <circle cx={x} cy={y} r={RNodo} fill={TEMP_COLORS[p.primario] ?? '#B9B3A5'} stroke={PAPER} strokeWidth="2.5" />
            <text x={x} y={y + (esEmoji ? 1 : 0)} textAnchor="middle" dominantBaseline="central"
              fontFamily={esEmoji ? undefined : FONT_BODY} fontSize={esEmoji ? 19 : 15} fontWeight="700" fill={PAPER}>
              {contenido}
            </text>
            <text x={x} y={y + 40} textAnchor="middle" fontFamily={FONT_BODY} fontSize="12" fontWeight="500" fill={INK}
              style={{ opacity: destacado ? 1 : 0.4, transition: 'opacity 200ms ease' }}>
              {p.nombre.length > 12 ? `${p.nombre.slice(0, 11)}…` : p.nombre}
            </text>
          </g>
        );
      })}

      {etiquetas.map(({ g, x, y, ancla }) => (
        <text key={g} x={x} y={y} textAnchor={ancla} dominantBaseline="central" fontFamily={FONT_BODY} fontSize="11" fontWeight="700" letterSpacing="0.1em" fill={MUTED}>
          {ETIQUETA_MAPA[g] ?? g.toUpperCase()}
        </text>
      ))}

      {tempPresentes.length > 0 && (
        <g transform={`translate(${-60}, ${T + 42})`}>
          {tempPresentes.map((t, i) => (
            <g key={t} transform={`translate(${i * 115}, 0)`}
              onMouseEnter={() => { setHoverTemp(t); setHoverId(null); }}
              onMouseLeave={() => setHoverTemp(null)}
              style={{ cursor: 'pointer' }}>
              <circle cx="6" cy="0" r="5" fill={TEMP_COLORS[t]} />
              <text x="16" y="0" dominantBaseline="central" fontFamily={FONT_BODY} fontSize="11" fontWeight="600" fill={hoverTemp === t ? INK : MUTED}
                style={{ transition: 'fill 200ms ease' }}>
                {NOMBRE_TEMP[t] ?? t}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
