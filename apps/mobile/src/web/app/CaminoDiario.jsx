// Pestaña «Camino»: lo primero, tu ciclo de virtud (racha, días y gráfica de carácter con lo que estás
// trabajando); debajo, tu entorno a un lado y tus hábitos y el historial al otro. Lo de cada día
// (la cita, el reto y el examen) vive en Hoy. Sin lógica propia: solo monta las secciones.
import { useSearchParams } from 'react-router-dom';
import { CHALLENGE_VIRTUE } from '../account/challengeVirtues';
import { useT } from '../i18n';
import { sumarDias } from '../lib/camino.js';
import { rachaDeCompromisos, tiraDeDias } from '../lib/rachaDias.js';
import { RUTA, bloquesDeLaRuta, inicioDeLaRuta, virtudDeDesafio } from '../lib/rutaVirtudes.js';
import { parrafo, tarjeta } from './estilos';
import { EsqueletoPagina } from './Esqueleto';
import { usePersonas } from './usePersonas';
import { useCaminoDiario } from './useCaminoDiario';
import { useCaracter } from './useCaracter';
import { useTemperamentoClave } from './useTemperamentoClave';
import Historial from './caminoDiario/Historial';
import ListaHabitos from './caminoDiario/ListaHabitos';
import CicloDeVirtud from './caminoDiario/CicloDeVirtud';
import TuEntorno from './personas/TuEntorno';

export default function CaminoDiario() {
  const { t } = useT();
  const camino = useCaminoDiario();
  const personas = usePersonas();
  const { fila, clave } = useTemperamentoClave();
  const caracter = useCaracter();
  const [params] = useSearchParams();

  if (camino.error) return <section style={tarjeta}><p role="alert" style={parrafo}>{t('camino.error_cargar')}</p></section>;
  if (camino.cargando || personas.cargando || fila === undefined || caracter.fila === undefined) return <EsqueletoPagina />;

  // Solo en desarrollo: `?avance=0.5` enseña el camino con la mitad recorrida (0 a 1; 1 o más, completado).
  const avance = (process.env.NODE_ENV !== 'production') ? Number(params.get('avance')) : NaN;
  const inicio = Number.isFinite(avance) && params.has('avance')
    ? sumarDias(camino.hoy, -Math.round(avance * RUTA.dias_por_virtud))
    : inicioDeLaRuta(camino.dias);
  const virtud = virtudDeDesafio(CHALLENGE_VIRTUE[clave]);
  const estado = bloquesDeLaRuta({ desafio: virtud, inicio, hoy: camino.hoy })[0]?.estado;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }} aria-label={t('camino.pagina.titulo')}>
      <style>{`
        .vl-camino-abajo { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
        @media (min-width: 860px) { .vl-camino-abajo { grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); align-items: start; gap: 18px; } }
      `}</style>
      <CicloDeVirtud
        virtud={virtud} estado={estado} resultado={caracter.resultado}
        tira={tiraDeDias(camino.dias, camino.hoy)} racha={rachaDeCompromisos(camino.dias, camino.hoy)} hoy={camino.hoy}
      />
      <div className="vl-camino-abajo">
        <TuEntorno miPrimario={clave} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
          <ListaHabitos
            habitos={camino.habitos} marcas={camino.marcas} hoy={camino.hoy} userId={camino.userId}
            config={camino.configHabitos} onCambio={camino.recargar}
          />
          <Historial dias={camino.dias} />
        </div>
      </div>
    </div>
  );
}
