// La pantalla principal de Hoy cuando estás al día: el reto aceptado, el examen y tus hábitos de hoy. Lo que te
// falta por hacer no sale aquí sino en el flujo guiado (HoyGuiado). Solo monta; los datos vienen de useHoy.
import { useT } from '../../i18n';
import { parrafo, tarjeta } from '../estilos';
import HabitosHoy from './HabitosHoy';
import Manana from './Manana';
import Noche from './Noche';
import { DEFECTOS } from './useHoy';

export default function CaminoHoy({ hoy }) {
  const { t } = useT();
  const { camino, personas, reto, cita, valores, variable, habito } = hoy;

  if (camino.error) {
    return <section style={{ ...tarjeta, gridColumn: '1 / -1' }}><p role="alert" style={parrafo}>{t('camino.error_cargar')}</p></section>;
  }

  const habitos = (
    <HabitosHoy
      habitos={camino.habitos} marcas={camino.marcas} hoy={camino.hoy} userId={camino.userId}
      config={camino.configHabitos} onCambio={camino.recargar}
    />
  );
  if (!reto) return habitos;

  return (
    <>
      <Manana
        key={reto.id} reto={reto} cita={cita} valores={valores} defectos={DEFECTOS}
        diaDeHoy={camino.diaDeHoy} hoy={camino.hoy} userId={camino.userId} onGuardado={camino.recargar}
        proponerOtro={hoy.proponerOtro}
      />
      <Noche
        reto={reto} diaDeHoy={camino.diaDeHoy} hoy={camino.hoy} userId={camino.userId} variable={variable}
        filaVariable={camino.variables.find((v) => v.variable === variable.id)} valorActual={valores[variable.id]}
        personas={personas.lista} onGuardado={camino.recargar} habito={habito}
      />
      {habitos}
    </>
  );
}
