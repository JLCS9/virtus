// Marcadores de posición suaves mientras llegan los datos, para que la pantalla no salte cuando aparece el
// contenido (el brillo está en el CSS del portal, en AppShell). Con la caché solo se ven la primera vez.
import { tarjeta } from './estilos';

export function Esqueleto({ alto = 120, ancho = '100%', style }) {
  return <div aria-hidden className="vl-esqueleto" style={{ height: alto, width: ancho, ...style }} />;
}

/** Una tarjeta vacía con unas líneas: ocupa el sitio de una tarjeta real. */
export function EsqueletoTarjeta({ alto = 260, ancho, style }) {
  return (
    <section aria-busy="true" aria-label="Cargando" style={{ ...tarjeta, minHeight: alto, display: 'grid', gap: 14, alignContent: 'start', ...style }}>
      <Esqueleto alto={14} ancho="30%" />
      <Esqueleto alto={30} ancho={ancho ?? '65%'} />
      <Esqueleto alto={14} ancho="90%" />
      <Esqueleto alto={14} ancho="75%" />
    </section>
  );
}

/** El hueco de una página entera mientras carga su código o sus datos. */
export function EsqueletoPagina() {
  return (
    <div className="vl-cols" role="status" aria-label="Cargando">
      <EsqueletoTarjeta alto={300} />
      <EsqueletoTarjeta alto={300} />
    </div>
  );
}
