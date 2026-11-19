// Piezas comunes de las pantallas del Camino: todo se responde con toques.
import { INK, LINE, MUTED, NAVY, PAPER, FONT_BODY, GOLD_REF } from '../../theme';
import { eyebrow, tarjeta, titulo } from '../estilos';

export function Pantalla({ etiqueta, pregunta, children, pie, onVolver }) {
  return (
    <section className="vl-entra" style={{ ...tarjeta, padding: '24px 20px 22px' }}>
      {(onVolver || etiqueta) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          {etiqueta ? <div style={eyebrow}>{etiqueta}</div> : <span />}
          {onVolver && (
            <button type="button" onClick={onVolver} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13.5, color: MUTED, padding: 4 }}>
              Salir
            </button>
          )}
        </div>
      )}
      {pregunta && <h2 style={{ ...titulo(26), margin: '12px 0 18px' }}>{pregunta}</h2>}
      {children}
      {pie && <div style={{ marginTop: 22 }}>{pie}</div>}
    </section>
  );
}

export function Opciones({ children, columnas = 1 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`, gap: 10 }}>{children}</div>;
}

export function Opcion({ activa = false, onClick, children, disabled = false, compacta = false }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} aria-pressed={activa}
      style={{
        fontFamily: FONT_BODY, fontSize: compacta ? 14 : 15.5, fontWeight: 500, textAlign: compacta ? 'center' : 'left',
        color: activa ? PAPER : INK, background: activa ? NAVY : PAPER,
        border: `1px solid ${activa ? NAVY : LINE}`, borderRadius: 0,
        padding: compacta ? '11px 10px' : '15px 16px', cursor: disabled ? 'default' : 'pointer',
        transition: 'background 140ms ease, color 140ms ease', minHeight: 48,
        opacity: disabled && !activa ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Puntos({ total, actual }) {
  return (
    <div aria-label={`Paso ${actual + 1} de ${total}`} style={{ display: 'flex', gap: 6, margin: '0 0 4px' }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ height: 4, flex: 1, borderRadius: 0, background: i <= actual ? GOLD_REF : 'rgba(27,42,74,0.12)', transition: 'background 200ms ease' }} />
      ))}
    </div>
  );
}
