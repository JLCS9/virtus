// Las cinco preguntas iniciales del temperamento, de una en una, antes del primer reto. Cada una se
// puede saltar (queda como respondida sin valor y el reto usa el texto por defecto).
import { useState } from 'react';
import { guardarVariable } from '../../account/caminoDiario';
import { useT } from '../../i18n';
import { MUTED, FONT_BODY } from '../../theme';
import { botonContorno, botonSobreClaro, parrafo } from '../estilos';
import { Pantalla, Puntos } from '../camino/ui';
import CampoVariable from './CampoVariable';

const VACIO = { valor: '', personaId: null };

export default function PreguntasIniciales({ preguntas, variables, personas, userId, onTerminado }) {
  const { t } = useT();
  const [i, setI] = useState(0);
  const [borrador, setBorrador] = useState(VACIO);
  const [estado, setEstado] = useState(null); // null · 'guardando' · 'error'

  const pregunta = preguntas[i];
  const ultima = i === preguntas.length - 1;

  async function seguir(saltar) {
    setEstado('guardando');
    try {
      await guardarVariable(userId, {
        variable: pregunta.variable,
        valor: saltar ? null : borrador.valor,
        personaId: saltar ? null : borrador.personaId,
        origen: 'inicial',
      });
    } catch {
      setEstado('error');
      return;
    }
    setEstado(null);
    setBorrador(VACIO);
    if (ultima) onTerminado();
    else setI(i + 1);
  }

  return (
    <Pantalla etiqueta={t('camino.iniciales.eyebrow')} pregunta={pregunta.pregunta}>
      {i === 0 && <p style={{ ...parrafo, fontSize: 16, margin: '-6px 0 18px' }}>{t('camino.iniciales.intro')}</p>}
      <Puntos total={preguntas.length} actual={i} />
      <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: MUTED, margin: '4px 0 18px' }}>
        {t('camino.iniciales.progreso', { n: i + 1, total: preguntas.length })}
      </p>
      <CampoVariable
        key={pregunta.variable} variable={variables[pregunta.variable]} personas={personas}
        etiqueta={pregunta.pregunta} valor={borrador.valor} personaId={borrador.personaId} onCambiar={setBorrador}
      />
      {estado === 'error' && <p role="alert" style={{ ...parrafo, fontSize: 16, color: '#9b1c1c', marginTop: 14 }}>{t('camino.error_guardar')}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
        <button
          type="button" onClick={() => seguir(false)} disabled={estado === 'guardando' || !borrador.valor.trim()}
          style={{ ...botonSobreClaro, opacity: borrador.valor.trim() ? 1 : 0.5, cursor: borrador.valor.trim() ? 'pointer' : 'default' }}
        >
          {estado === 'guardando' ? t('camino.iniciales.guardando') : ultima ? t('camino.iniciales.terminar') : t('camino.iniciales.siguiente')}
        </button>
        <button type="button" onClick={() => seguir(true)} disabled={estado === 'guardando'} style={botonContorno}>
          {t('camino.iniciales.saltar')}
        </button>
      </div>
    </Pantalla>
  );
}
