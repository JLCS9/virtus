// «Tu día a día»: cuándo quiere el usuario su reto diario, su reflexión y su formación semanal.
// Tres pantallas, una decisión en cada una. Lo que se guarda (preferencias_notificaciones) es la
// configuración primaria de avisos, compartida con la app móvil y con el envío por correo.
//
// `ConfigurarHorarios` es la pieza reutilizable (onboarding, perfil…); el export por defecto es la
// página del portal (/app/horarios).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalPath } from '../i18n';
import { useSession } from '../account/useSession';
import { guardarPreferencias, leerPreferencias } from '../account/preferencias';
import { DIAS_SEMANA, HORAS_SUGERIDAS, horaValida, textoZona } from '../lib/preferencias.js';
import { INK, LINE, MUTED, NAVY, FONT_BODY, FONT_SLAB } from '../theme';
import { botonSobreClaro, parrafo, tarjeta } from './estilos';
import { Opcion, Opciones, Pantalla, Puntos } from './camino/ui';

const titular = { fontFamily: FONT_SLAB, fontSize: 26, lineHeight: 1.25, fontWeight: 700, color: INK, margin: '16px 0 8px' };
const apoyo = { ...parrafo, fontSize: 18, lineHeight: 1.5, color: INK, margin: '0 0 20px' };
const etiqueta = { display: 'block', fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600, color: INK, margin: '20px 0 8px' };
const ROJO = '#9C3A3A';

const PASOS = [
  { campo: 'hora_reto', pregunta: '¿A qué hora quieres recibir tu reto de cada día?', apoyo: 'Te lo enviaremos a esa hora, todos los días.' },
  { campo: 'hora_reflexion', pregunta: '¿A qué hora quieres hacer tu reflexión del día?', apoyo: 'Unos minutos para repasar cómo ha ido el reto. Te avisaremos a esa hora.' },
  { campo: 'hora_formacion', pregunta: '¿Cuándo quieres hacer tu formación de la semana?', apoyo: 'Entre 10 y 20 minutos, una vez por semana.', conDia: true },
];

// Las tres preguntas también las usa el onboarding (Bienvenida.jsx), con su propio diseño.
export { PASOS as PASOS_HORARIOS };

function ElegirHora({ id, valor, sugeridas, onChange }) {
  return (
    <>
      <Opciones columnas={3}>
        {sugeridas.map((h) => (
          <Opcion key={h} compacta activa={valor === h} onClick={() => onChange(h)}>
            <span style={{ fontSize: 18 }}>{h}</span>
          </Opcion>
        ))}
      </Opciones>
      <label htmlFor={id} style={etiqueta}>O elige otra hora</label>
      <input id={id} type="time" value={valor} step={300}
             onChange={(e) => { if (horaValida(e.target.value)) onChange(e.target.value); }}
             style={{ fontFamily: FONT_BODY, fontSize: 20, padding: '12px 14px', borderRadius: 0, border: `1px solid ${LINE}`, color: INK, background: '#fff' }} />
    </>
  );
}

/**
 * iniciales: preferencias ya normalizadas (las guardadas o las de por defecto).
 * onHecho(preferencias) al guardar; onSalir para abandonar sin guardar.
 */
export function ConfigurarHorarios({ user, iniciales, onHecho, onSalir }) {
  const [p, setP] = useState(iniciales);
  const [paso, setPaso] = useState(0);
  const [estado, setEstado] = useState(null); // null · 'guardando' · 'error'
  const actual = PASOS[paso];
  const ultimo = paso === PASOS.length - 1;

  async function guardar() {
    setEstado('guardando');
    try {
      onHecho(await guardarPreferencias(user.id, p));
    } catch {
      setEstado('error');
    }
  }

  const pie = (
    <>
      {estado === 'error' && <p role="alert" style={{ ...parrafo, fontSize: 16, color: ROJO, marginBottom: 12 }}>No he podido guardar tus horarios. Inténtalo de nuevo.</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        {paso > 0
          ? <button type="button" onClick={() => setPaso(paso - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 16, color: INK, padding: '8px 0' }}>← Atrás</button>
          : <span />}
        {ultimo
          ? <button type="button" style={botonSobreClaro} disabled={estado === 'guardando'} onClick={guardar}>{estado === 'guardando' ? 'Guardando…' : 'Guardar'}</button>
          : <button type="button" style={botonSobreClaro} onClick={() => setPaso(paso + 1)}>Continuar</button>}
      </div>
    </>
  );

  return (
    <Pantalla etiqueta={`Tu día a día · ${paso + 1} de ${PASOS.length}`} onVolver={onSalir} pie={pie}>
      <Puntos total={PASOS.length} actual={paso} />
      <h2 style={titular}>{actual.pregunta}</h2>
      <p style={apoyo}>{actual.apoyo}</p>

      {actual.conDia && (
        <>
          <span style={{ ...etiqueta, marginTop: 0 }}>El día</span>
          <Opciones columnas={4}>
            {DIAS_SEMANA.map((nombre, i) => (
              <Opcion key={nombre} compacta activa={p.dia_formacion === i + 1} onClick={() => setP((x) => ({ ...x, dia_formacion: i + 1 }))}>
                <span style={{ fontSize: 16 }}>{nombre}</span>
              </Opcion>
            ))}
          </Opciones>
          <span style={etiqueta}>A las</span>
        </>
      )}

      <ElegirHora key={actual.campo} id={`horario-${actual.campo}`} valor={p[actual.campo]}
                  sugeridas={HORAS_SUGERIDAS[actual.campo]} onChange={(h) => setP((x) => ({ ...x, [actual.campo]: h }))} />

      <p style={{ ...parrafo, fontSize: 16, color: MUTED, margin: '20px 0 0' }}>
        Hora de {textoZona(p.zona_horaria)}. Podrás cambiarlo cuando quieras desde tu perfil.
      </p>
    </Pantalla>
  );
}

/** Carga las preferencias del usuario: { cargando } · { error } · { preferencias, configurado }. */
export function usePreferencias(userId) {
  const [estado, setEstado] = useState({ cargando: true });
  useEffect(() => {
    if (!userId) return undefined;
    let vivo = true;
    leerPreferencias()
      .then((d) => { if (vivo) setEstado(d); })
      .catch(() => { if (vivo) setEstado({ error: true }); });
    return () => { vivo = false; };
  }, [userId]);
  return estado;
}

export default function Horarios() {
  const navigate = useNavigate();
  const lp = useLocalPath();
  const session = useSession();
  const estado = usePreferencias(session?.user?.id);
  const volver = () => navigate(lp('/app/perfil'));

  if (!session?.user || estado.cargando) return <section style={tarjeta}><p style={parrafo}>Cargando…</p></section>;
  if (estado.error) {
    return (
      <section style={{ ...tarjeta, maxWidth: 640, margin: '0 auto' }}>
        <p role="alert" style={{ ...parrafo, fontSize: 18, color: INK }}>No he podido cargar tus horarios. Inténtalo de nuevo en unos minutos.</p>
        <button type="button" onClick={volver} style={{ ...botonSobreClaro, marginTop: 14, background: NAVY }}>Volver</button>
      </section>
    );
  }
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <ConfigurarHorarios user={session.user} iniciales={estado.preferencias} onHecho={volver} onSalir={volver} />
    </div>
  );
}
