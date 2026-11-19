// Tarjeta «Tu entorno»: el mapa de las personas y las primeras fichas, con el acceso a añadir más.
// Se usa en Hoy y en la pestaña Camino.
import { useNavigate } from 'react-router-dom';
import { useLocalPath } from '../../i18n';
import { NAVY, FONT_BODY } from '../../theme';
import { botonContorno, botonSobreClaro, eyebrow, parrafo, tarjeta, titulo } from '../estilos';
import { usePersonas } from '../usePersonas';
import { EsqueletoTarjeta } from '../Esqueleto';
import { Avatar, EtiquetaEstado, MapaPersonas } from './comun';

export default function TuEntorno({ miPrimario }) {
  const { cargando, lista } = usePersonas();
  const navigate = useNavigate();
  const lp = useLocalPath();

  const irAPersona = (p) => navigate(lp(`/app/personas/${p.id}`));
  const irAPersonas = () => navigate(lp('/app/personas'));
  const irANueva = () => navigate(lp('/app/personas/nueva'));

  if (cargando) return <EsqueletoTarjeta alto={420} />;

  const MAX_VISIBLES = 5;
  const visibles = lista.slice(0, MAX_VISIBLES);

  if (!lista.length) {
    return (
      <section style={tarjeta} aria-label="Tu entorno">
        <div style={eyebrow}>Tu entorno</div>
        <h2 style={{ ...titulo(24), margin: '10px 0 8px' }}>Las personas a tu alrededor</h2>
        <p style={{ ...parrafo, marginBottom: 16 }}>
          Crea fichas de las personas de tu familia, tus amigos, tu trabajo y tu comunidad, y descubre
          cómo relacionarte mejor con cada temperamento.
        </p>
        <button type="button" onClick={irANueva} style={botonSobreClaro}>Añadir persona</button>
      </section>
    );
  }

  return (
    <section style={tarjeta} aria-label="Tu entorno">
      <div style={eyebrow}>Tu entorno</div>

      <div className="vl-mapa-personas-wrap" style={{ margin: '8px 0 0' }}>
        <MapaPersonas personas={lista} miPrimario={miPrimario} onElegirPersona={irAPersona} />
      </div>

      <div style={{ marginTop: 10, display: 'grid', gap: 2 }}>
        {visibles.map((p) => (
          <button key={p.id} type="button" className="vl-fila-persona" onClick={() => irAPersona(p)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px',
            background: 'none', border: 'none', borderRadius: 12,
            cursor: 'pointer', textAlign: 'left', width: '100%',
          }}>
            <Avatar persona={p} tam={36} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: FONT_BODY, fontSize: 14.5, fontWeight: 600, color: NAVY }}>{p.nombre}</span>
              <EtiquetaEstado persona={p} />
            </span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={irANueva} style={{ ...botonContorno, fontSize: 13.5 }}>+ Añadir persona</button>
        <button type="button" onClick={irAPersonas} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13.5, color: NAVY, fontWeight: 600, padding: 0 }}>Ver más →</button>
      </div>
    </section>
  );
}
