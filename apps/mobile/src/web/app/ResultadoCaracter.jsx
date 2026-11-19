import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LocalLink as Link } from '../i18n';
import { fetchLatestCharacter, fetchLatestTemperament } from '../account/account';
import { claveTemperamento, extremos, resultadoCaracter, VIRTUDES, etapa } from '../lib/virtudes.js';
import { INK, LINE, MUTED, NAVY, FONT_BODY, FONT_SLAB, GOLD_REF } from '../theme';
import { botonSobreClaro, eyebrow, parrafo, tarjeta, titulo } from './estilos';
import { VirtudesRadar, VirtudesBarras } from './Radar';
import { TEXTO_VIRTUD, notaTemperamento } from './MapaCaracter';

const DEMO = { self: { magnanimidad: 72, humildad: 55, prudencia: 63, fortaleza: 48, dominio: 60, justicia: 70 } };

export default function ResultadoCaracter() {
  const [params] = useSearchParams();
  const [fila, setFila] = useState(undefined);
  const [tempClave, setTempClave] = useState(null);

  useEffect(() => {
    let vivo = true;
    fetchLatestCharacter().then((r) => { if (vivo) setFila(r ?? null); }).catch(() => { if (vivo) setFila(null); });
    fetchLatestTemperament().then((r) => { if (vivo) setTempClave(claveTemperamento(r?.result)); }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  const demo = (process.env.NODE_ENV !== 'production') && params.has('demo');
  if (fila === undefined && !demo) return null;

  const resultado = resultadoCaracter(demo ? DEMO : fila?.result);

  if (!resultado) {
    return (
      <div style={{ maxWidth: 900 }}>
        <Link to="/app" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>← Hoy</Link>
        <section style={{ ...tarjeta, marginTop: 14 }}>
          <div style={eyebrow}>Tu mapa de carácter</div>
          <h1 style={{ ...titulo(28), margin: '10px 0 8px' }}>Aún no tienes resultados</h1>
          <p style={{ ...parrafo, marginBottom: 18 }}>El test de carácter mide las seis virtudes y dibuja tu punto de partida. Son 68 preguntas y se hace una sola vez.</p>
          <Link to="/tests/caracter" style={botonSobreClaro}>Hacer el test de carácter</Link>
        </section>
      </div>
    );
  }

  const { valores } = resultado;
  const { mayor, menor } = extremos(valores);
  const fecha = fila?.taken_at ? new Date(fila.taken_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : null;
  const textoMayor = TEXTO_VIRTUD[mayor.clave];
  const textoMenor = TEXTO_VIRTUD[menor.clave];
  const notaMayor = notaTemperamento(tempClave, mayor.clave, 'mayor');
  const notaMenor = notaTemperamento(tempClave, menor.clave, 'menor');

  return (
    <div style={{ maxWidth: 900 }}>
      <Link to="/app" style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: 'none' }}>← Hoy</Link>

      <section style={{ ...tarjeta, marginTop: 14 }}>
        <div style={eyebrow}>Tu mapa de carácter{fecha ? ` · ${fecha}` : ''}</div>
        <h1 style={{ ...titulo(30), margin: '10px 0 16px' }}>Tus seis virtudes</h1>

        <div className="vl-caracter-detalle-grid">
          <style>{`
            .vl-caracter-detalle-grid { }
            @media (min-width: 760px) {
              .vl-caracter-detalle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: start; }
            }
          `}</style>

          <div>
            <VirtudesRadar valores={valores} />
          </div>

          <div>
            <VirtudesBarras valores={valores} />
          </div>
        </div>
      </section>

      <section style={{ ...tarjeta, marginTop: 18 }}>
        <div style={eyebrow}>Resumen</div>

        <div style={{ marginTop: 14, borderLeft: `3px solid ${GOLD_REF}`, paddingLeft: 14 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK, margin: '0 0 4px', lineHeight: 1.5 }}>
            Tu virtud más fuerte es <strong style={{ color: NAVY }}>{mayor.nombre}</strong> ({Math.round(mayor.valor)}%)
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.5 }}>
            {notaMayor || textoMayor?.bien}
          </p>
        </div>

        <div style={{ marginTop: 18, borderLeft: `3px solid ${LINE}`, paddingLeft: 14 }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK, margin: '0 0 4px', lineHeight: 1.5 }}>
            Lo que más puedes cultivar ahora es <strong style={{ color: NAVY }}>{menor.nombre}</strong> ({Math.round(menor.valor)}%)
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.5 }}>
            {notaMenor || textoMenor?.cultivar}
          </p>
        </div>
      </section>

      <section style={{ ...tarjeta, marginTop: 18 }}>
        <div style={eyebrow}>Las seis virtudes en detalle</div>

        {VIRTUDES.map((v) => {
          const valor = Math.round(valores[v.clave]);
          const e = etapa(valor);
          const texto = TEXTO_VIRTUD[v.clave];
          const esMayor = v.clave === mayor.clave;
          const esMenor = v.clave === menor.clave;

          return (
            <div key={v.clave} style={{ borderTop: `1px solid ${LINE}`, padding: '18px 0 4px', marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                <h3 style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, margin: 0, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  {v.nombre}
                  {esMayor && <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: GOLD_REF, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tu punto fuerte</span>}
                  {esMenor && <span style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Para cultivar</span>}
                </h3>
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED }}>{e.texto} · {valor} %</span>
              </div>

              <div style={{ height: 6, borderRadius: 0, background: 'rgba(27,42,74,0.09)', overflow: 'hidden', marginTop: 10 }}>
                <div style={{ width: `${valor}%`, height: '100%', background: v.color, transition: 'width 600ms ease' }} />
              </div>

              <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: INK, lineHeight: 1.55, margin: '12px 0 0' }}>
                {valor >= 40 ? texto?.bien : texto?.cultivar}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
