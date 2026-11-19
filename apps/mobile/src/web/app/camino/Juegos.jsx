// Juegos de la fase 2: desliza (días 3 y 10), elige tu reacción (días 4 y 11) y arrastra (día 13).
// Todo con el dedo: la tarjeta se puede arrastrar hacia su destino o tocar el destino.
import { useEffect, useRef, useState } from 'react';
import { useT } from '../../i18n';
import { fetchLatestTemperament } from '../../account/account';
import {
  CIERRE_11, DESLIZA_2, DESLIZA_4, ESCENAS_11, ESCENAS_3, RASGOS_13, TEXTO_13, textoElige3,
} from '../../lib/camino.js';
import { GOLD_REF, INK, LINE, MUTED, NAVY, PAPER, TEMP_COLORS, FONT_BODY, FONT_SLAB } from '../../theme';
import { botonSobreClaro, parrafo } from '../estilos';
import { IconoFlecha } from '../Iconos';
import { Opcion, Opciones, Pantalla, Puntos } from './ui';

const VERDE = '#3F7A56';
const ROJO = '#9C3A3A';
const TEMPS = ['COL', 'MEL', 'SAN', 'FLE'];

export const Continuar = ({ onClick, children = 'Continuar', disabled }) => (
  <button type="button" style={{ ...botonSobreClaro, opacity: disabled ? 0.45 : 1 }} disabled={disabled} onClick={onClick}>
    {children} <IconoFlecha width={18} height={18} />
  </button>
);

/** El resultado del test de temperamento de la persona: { primario, secundario } | null. */
export function useTemperamento() {
  const [temp, setTemp] = useState(undefined);
  useEffect(() => {
    let vivo = true;
    fetchLatestTemperament()
      .then((f) => { if (vivo) setTemp(TEMP_COLORS[f?.result?.primario] ? { primario: f.result.primario, secundario: f.result.secundario ?? null } : null); })
      .catch(() => { if (vivo) setTemp(null); });
    return () => { vivo = false; };
  }, []);
  return temp;
}

export function useNombres() {
  const { t } = useT();
  return Object.fromEntries(TEMPS.map((k) => [k, t(`temperaments.${k}`)?.name ?? k]));
}

/** Orden fijo pero distinto en cada escena, para que la reacción no esté siempre en el mismo sitio. */
const barajar = (lista, semilla) => lista.map((x, i) => [x, (i * 7 + semilla * 5) % 11]).sort((a, b) => a[1] - b[1]).map(([x]) => x);

const titular = { fontFamily: FONT_SLAB, fontSize: 26, fontWeight: 700, color: INK, margin: '16px 0 18px' };

// ───────────── Desliza ─────────────

// Posición de los destinos. Cuatro esquinas: las de la rueda (colérico arriba a la derecha…).
const ESQUINAS = { SAN: ['izq', 'arr'], COL: ['der', 'arr'], FLE: ['izq', 'aba'], MEL: ['der', 'aba'] };

function destinoPorGesto(dx, dy, destinos) {
  if (Math.hypot(dx, dy) < 70) return null;
  const h = dx < 0 ? 'izq' : 'der';
  const v = dy < 0 ? 'arr' : 'aba';
  return destinos.find((d) => d.pos[0] === h && (d.pos.length === 1 || d.pos[1] === v))?.clave ?? null;
}

function Desliza({ etiqueta, tarjetas, destinos, onFin }) {
  const [i, setI] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [arrastre, setArrastre] = useState(null); // { x0, y0, dx, dy }
  const tarjetaRef = useRef(null);
  const respondida = respuestas.length > i;
  const aciertos = respuestas.filter((r, k) => r === tarjetas[k][1]).length;

  if (i >= tarjetas.length) {
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar onClick={() => onFin({ respuestas, aciertos })} />}>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 30, fontWeight: 700, color: NAVY, margin: '16px 0 0' }}>Has acertado {aciertos} de {tarjetas.length}.</p>
      </Pantalla>
    );
  }

  const [texto, correcta, explicacion] = tarjetas[i];
  const elegida = respuestas[i];
  const responder = (clave) => { if (!respondida) setRespuestas((r) => [...r, clave]); };
  const destinoDe = (clave) => destinos.find((d) => d.clave === clave);

  function soltar() {
    if (!arrastre) return;
    const clave = destinoPorGesto(arrastre.dx, arrastre.dy, destinos);
    setArrastre(null);
    if (clave) responder(clave);
  }

  const apuntado = arrastre ? destinoPorGesto(arrastre.dx, arrastre.dy, destinos) : null;
  const boton = (d) => (
    <button key={d.clave} type="button" onClick={() => responder(d.clave)} disabled={respondida}
            style={{
              fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700, color: PAPER, background: d.color,
              border: 'none', borderRadius: 0, padding: '12px 8px', cursor: respondida ? 'default' : 'pointer',
              opacity: respondida && elegida !== d.clave && correcta !== d.clave ? 0.35 : 1,
              outline: apuntado === d.clave ? `3px solid ${GOLD_REF}` : 'none', outlineOffset: 2,
              transform: apuntado === d.clave ? 'scale(1.04)' : 'none', transition: 'transform 120ms ease, opacity 200ms ease',
            }}>
      {d.etiqueta}
    </button>
  );
  // Cada fila, izquierda primero: la misma posición que el gesto.
  const fila = (pos) => destinos.filter((d) => d.pos[1] === pos).sort((a, b) => (a.pos[0] === 'izq' ? -1 : 1) - (b.pos[0] === 'izq' ? -1 : 1));
  const cuatro = destinos.length === 4;

  return (
    <Pantalla etiqueta={etiqueta}>
      <Puntos total={tarjetas.length} actual={i} />
      <p style={{ ...parrafo, fontSize: 13.5, margin: '12px 0 12px' }}>
        {cuatro ? 'Desliza la tarjeta hacia su temperamento, o toca el color.' : 'Desliza a la izquierda o a la derecha, o toca un lado.'}
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {cuatro && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{fila('arr').map(boton)}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: cuatro ? '1fr' : '84px 1fr 84px', gap: 10, alignItems: 'stretch' }}>
          {!cuatro && boton(destinos[0])}
          <div
            ref={tarjetaRef}
            onPointerDown={(e) => { if (respondida) return; e.currentTarget.setPointerCapture(e.pointerId); setArrastre({ x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 }); }}
            onPointerMove={(e) => { if (arrastre) setArrastre((a) => ({ ...a, dx: e.clientX - a.x0, dy: e.clientY - a.y0 })); }}
            onPointerUp={soltar}
            onPointerCancel={() => setArrastre(null)}
            style={{
              background: PAPER, border: `1px solid ${respondida ? (elegida === correcta ? VERDE : ROJO) : LINE}`, borderRadius: 0,
              padding: '28px 20px', minHeight: 150, display: 'grid', placeItems: 'center', textAlign: 'center',
              boxShadow: '0 10px 28px rgba(27,42,74,0.12)', touchAction: 'none', userSelect: 'none',
              cursor: respondida ? 'default' : 'grab',
              transform: arrastre ? `translate(${arrastre.dx}px, ${arrastre.dy}px) rotate(${arrastre.dx / 18}deg)` : 'none',
              transition: arrastre ? 'none' : 'transform 220ms ease',
            }}>
            <p style={{ fontFamily: FONT_SLAB, fontSize: 23, lineHeight: 1.3, color: INK, margin: 0 }}>{texto}</p>
          </div>
          {!cuatro && boton(destinos[1])}
        </div>
        {cuatro && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{fila('aba').map(boton)}</div>}
      </div>
      {respondida && (
        <div className="vl-entra" style={{ marginTop: 18 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: elegida === correcta ? VERDE : ROJO, margin: '0 0 4px' }}>
            {elegida === correcta ? '¡Bien!' : `Era: ${destinoDe(correcta).etiqueta.toLowerCase()}.`}
          </p>
          <p style={{ ...parrafo, color: INK }}>{explicacion}.</p>
          <div style={{ marginTop: 18 }}><Continuar onClick={() => setI((n) => n + 1)}>{i + 1 < tarjetas.length ? 'Siguiente' : 'Ver resultado'}</Continuar></div>
        </div>
      )}
    </Pantalla>
  );
}

export function DeslizaTemperamentos({ dia, onFin }) {
  const nombres = useNombres();
  const destinos = TEMPS.map((k) => ({ clave: k, etiqueta: nombres[k], color: TEMP_COLORS[k], pos: ESQUINAS[k] }));
  return <Desliza etiqueta={`Día ${dia} · Los cuatro temperamentos`} tarjetas={DESLIZA_4} destinos={destinos} onFin={onFin} />;
}

export function DeslizaTemperamentoCaracter({ dia, onFin }) {
  const destinos = [
    { clave: 'T', etiqueta: 'Temperamento', color: '#6B7A90', pos: ['izq'] },
    { clave: 'C', etiqueta: 'Carácter', color: NAVY, pos: ['der'] },
  ];
  return <Desliza etiqueta={`Día ${dia} · ¿Temperamento o carácter?`} tarjetas={DESLIZA_2} destinos={destinos} onFin={onFin} />;
}

// ───────────── Elige tu reacción (día 4) ─────────────

export function EligeReaccion({ dia, onFin }) {
  const temp = useTemperamento();
  const nombres = useNombres();
  const [i, setI] = useState(0);
  const [elecciones, setElecciones] = useState([]);
  const etiqueta = `Día ${dia} · Elige tu reacción`;

  if (i < ESCENAS_3.length) {
    const [escena, opciones] = ESCENAS_3[i];
    return (
      <Pantalla etiqueta={etiqueta}>
        <Puntos total={ESCENAS_3.length} actual={i} />
        <h2 style={titular}>{escena}</h2>
        <p style={{ ...parrafo, fontSize: 14, margin: '-8px 0 16px' }}>¿Qué te sale primero?</p>
        <Opciones>
          {barajar(TEMPS, i).map((k) => (
            <Opcion key={k} onClick={() => { setElecciones((e) => [...e, k]); setTimeout(() => setI((n) => n + 1), 160); }}>{opciones[k]}</Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }

  if (temp === undefined) return <Pantalla etiqueta={etiqueta}><p style={parrafo}>Un momento…</p></Pantalla>;
  const primario = temp?.primario;
  const coincidencias = primario ? elecciones.filter((k) => k === primario).length : null;
  return (
    <Pantalla etiqueta={etiqueta} pie={<Continuar onClick={() => onFin({ elecciones, coincidencias })} />}>
      <h2 style={titular}>Lo que había detrás de cada reacción</h2>
      {ESCENAS_3.map(([escena, opciones], k) => (
        <div key={escena} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: `1px solid ${LINE}` }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: TEMP_COLORS[elecciones[k]], flex: '0 0 10px', marginTop: 6 }} />
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: MUTED }}>{escena}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK, margin: '2px 0' }}>{opciones[elecciones[k]]}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: TEMP_COLORS[elecciones[k]] }}>{nombres[elecciones[k]]}</div>
          </div>
        </div>
      ))}
      {primario && (
        <p style={{ fontFamily: FONT_SLAB, fontSize: 21, lineHeight: 1.35, color: NAVY, margin: '16px 0 0', borderLeft: `3px solid ${GOLD_REF}`, paddingLeft: 14 }}>
          {textoElige3(coincidencias, nombres[primario].toLowerCase())}
        </p>
      )}
    </Pantalla>
  );
}

// ───────────── Elige tu reacción: temperamento frente a carácter (día 11) ─────────────

export function EligeVirtud({ dia, momentos, onFin }) {
  const [i, setI] = useState(0);
  const [fase, setFase] = useState('sale'); // sale · virtud
  const [sale, setSale] = useState([]);
  const [virtud, setVirtud] = useState([]);
  const etiqueta = `Día ${dia} · Temperamento frente a carácter`;

  if (i >= ESCENAS_11.length) {
    const aciertos = virtud.filter(Boolean).length;
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar onClick={() => onFin({ sale, aciertos })} />}>
        <p style={{ fontFamily: FONT_SLAB, fontSize: 27, lineHeight: 1.3, color: NAVY, fontWeight: 600, margin: '14px 0 0' }}>{CIERRE_11}</p>
      </Pantalla>
    );
  }

  const e = ESCENAS_11[i];
  const escena = e.escena(momentos);
  if (fase === 'sale') {
    return (
      <Pantalla etiqueta={etiqueta}>
        <Puntos total={ESCENAS_11.length * 2} actual={i * 2} />
        <h2 style={titular}>{escena}</h2>
        <p style={{ ...parrafo, fontSize: 14, margin: '-8px 0 16px' }}>¿Qué te sale?</p>
        <Opciones>
          {barajar(TEMPS, i + 3).map((k) => (
            <Opcion key={k} onClick={() => { setSale((s) => [...s, k]); setTimeout(() => setFase('virtud'), 160); }}>{e.sale[k]}</Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }

  const respondida = virtud.length > i;
  const opciones = barajar([e.virtud, ...e.distractores], i);
  const elegida = respondida ? (virtud[i] ? e.virtud : null) : null;
  return (
    <Pantalla etiqueta={etiqueta}>
      <Puntos total={ESCENAS_11.length * 2} actual={i * 2 + 1} />
      <h2 style={titular}>{escena}</h2>
      <p style={{ ...parrafo, fontSize: 14, margin: '-8px 0 16px' }}>¿Y qué respondería la virtud?</p>
      <Opciones>
        {opciones.map((o) => (
          <Opcion key={o} disabled={respondida} activa={respondida && o === e.virtud}
                  onClick={() => setVirtud((v) => [...v, o === e.virtud])}>{o}</Opcion>
        ))}
      </Opciones>
      {respondida && (
        <div className="vl-entra" style={{ marginTop: 18 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 700, color: elegida ? VERDE : ROJO, margin: '0 0 4px' }}>
            {elegida ? '¡Bien!' : 'La virtud respondería lo que está marcado.'}
          </p>
          <p style={{ ...parrafo, color: INK }}>Virtud: <strong>{e.nombre}</strong>.</p>
          <div style={{ marginTop: 18 }}>
            <Continuar onClick={() => { setI((n) => n + 1); setFase('sale'); }}>{i + 1 < ESCENAS_11.length ? 'Siguiente escena' : 'Terminar'}</Continuar>
          </div>
        </div>
      )}
    </Pantalla>
  );
}

// ───────────── Arrastra: no lo elegí / lo he construido (día 13) ─────────────

export function Arrastra({ dia, onFin }) {
  const temp = useTemperamento();
  const [sitio, setSitio] = useState({}); // rasgo → 'no_elegi' | 'construido'
  const [visto, setVisto] = useState(false);
  const etiqueta = `Día ${dia} · No lo elegí / lo he construido`;
  const lista = (v) => RASGOS_13.filter(([r]) => sitio[r] === v).map(([r]) => r);

  if (visto) {
    const primario = temp?.primario;
    const construidos = RASGOS_13.filter(([r]) => sitio[r] === 'construido');
    const destacados = construidos.filter(([, , cuesta]) => cuesta.includes(primario)).map(([r]) => r);
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar onClick={() => onFin({ no_elegi: lista('no_elegi'), construido: lista('construido'), destacados })} />}>
        <h2 style={titular}>Lo has construido</h2>
        {construidos.length === 0 && <p style={parrafo}>No has puesto ningún rasgo en «Lo he construido».</p>}
        <div style={{ display: 'grid', gap: 8 }}>
          {construidos.map(([r]) => {
            const destacado = destacados.includes(r);
            return (
              <div key={r} style={{ padding: '12px 14px', borderRadius: 0, background: destacado ? 'rgba(197,165,90,0.16)' : 'transparent', border: `1px solid ${destacado ? GOLD_REF : LINE}` }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: destacado ? 700 : 500, color: INK }}>{r}</div>
                {destacado && <div style={{ fontFamily: FONT_SLAB, fontSize: 17, fontStyle: 'italic', color: NAVY, marginTop: 4 }}>{TEXTO_13}</div>}
              </div>
            );
          })}
        </div>
      </Pantalla>
    );
  }

  const colocados = Object.keys(sitio).length;
  const poner = (r, v) => setSitio((s) => {
    const n = { ...s };
    if (n[r] === v) delete n[r]; else n[r] = v;
    return n;
  });
  return (
    <Pantalla etiqueta={etiqueta} pie={<Continuar disabled={!colocados || temp === undefined} onClick={() => setVisto(true)}>Ver lo que has construido</Continuar>}>
      <p style={{ ...parrafo, color: INK, margin: '10px 0 4px' }}>Pon cada rasgo en su sitio. Si no te describe, déjalo fuera.</p>
      <p style={{ ...parrafo, fontSize: 13.5, marginBottom: 16 }}>No hay respuesta correcta.</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {RASGOS_13.map(([r]) => (
          <div key={r} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${LINE}` }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK }}>{r}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['no_elegi', 'No lo elegí'], ['construido', 'Lo he construido']].map(([v, texto]) => (
                <button key={v} type="button" aria-pressed={sitio[r] === v} onClick={() => poner(r, v)}
                        style={{
                          fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, borderRadius: 0, padding: '8px 11px', cursor: 'pointer',
                          border: `1px solid ${sitio[r] === v ? NAVY : LINE}`, background: sitio[r] === v ? NAVY : PAPER, color: sitio[r] === v ? PAPER : INK,
                        }}>
                  {texto}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Pantalla>
  );
}
