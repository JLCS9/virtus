import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalPath } from '../i18n';
import { pasosDelUsuario } from './flujoModulo';
import { useModuloProgreso } from './useModulo';
import { VistaCuaderno } from './Modulo';
import curso1Data from '../data/curso1.json';
import curso2Data from '../data/curso2.json';
import curso3Data from '../data/curso3.json';
import curso4Data from '../data/curso4.json';
import curso5Data from '../data/curso5.json';
import { LINE, MUTED, NAVY, GOLD_REF_DK, FONT_SLAB, FONT_BODY } from '../theme';
import { eyebrow, tarjeta, titulo, parrafo } from '../app/estilos';

const CURSOS_CFG = [
  { label: 'Cuaderno 1', cursoId: 'curso1', cursoNum: 1, data: curso1Data },
  { label: 'Cuaderno 2', cursoId: 'curso2', cursoNum: 2, data: curso2Data },
  { label: 'Cuaderno 3', cursoId: 'curso3', cursoNum: 3, data: curso3Data },
  { label: 'Cuaderno 4', cursoId: 'curso4', cursoNum: 4, data: curso4Data },
  { label: 'Cuaderno 5', cursoId: 'curso5', cursoNum: 5, data: curso5Data },
  { label: 'Cuaderno 6', cursoId: null, cursoNum: 6, data: null },
];

function TabProximamente() {
  return (
    <div style={{ ...tarjeta, textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontFamily: FONT_SLAB, fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Próximamente</div>
      <p style={{ ...parrafo, color: MUTED }}>Este cuaderno estará disponible cuando se abra el curso.</p>
    </div>
  );
}

function TabCuaderno({ userId, cursoId, cursoNum, data, irAlEjercicio }) {
  const progreso = useModuloProgreso(userId, cursoId, cursoNum);
  const pasos = pasosDelUsuario(data, null);
  const irA = irAlEjercicio ? (pasoId) => irAlEjercicio(cursoNum, pasoId) : null;

  return (
    <VistaCuaderno
      pasos={pasos}
      completados={progreso.completados}
      onVolver={null}
      onIrA={irA}
      onEditar={irA}
      userId={userId}
      cursoId={cursoId}
      temperamento={null}
    />
  );
}

export default function PlanPersonal({ userId, onVolver }) {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();
  const localPath = useLocalPath();
  const TABS = CURSOS_CFG.map(m => m.label);
  const cfg = CURSOS_CFG[tab];

  const irAlEjercicio = (cursoNum, pasoId) => navigate(localPath(`/app/formacion/curso-${cursoNum}`) + (pasoId ? `#${pasoId}` : ''));

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <button type="button" onClick={onVolver} style={{
        fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: GOLD_REF_DK,
        background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginBottom: 16,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        ← Formación
      </button>
      <div style={eyebrow}>Tu formación</div>
      <h1 style={{ ...titulo(24), margin: '8px 0 16px' }}>Plan de crecimiento personal</h1>

      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', borderBottom: `2px solid ${LINE}`, marginBottom: 20 }}>
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setTab(i)}
            style={{
              fontFamily: FONT_BODY, fontSize: 13, fontWeight: tab === i ? 700 : 500,
              color: tab === i ? GOLD_REF_DK : MUTED,
              background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${GOLD_REF_DK}` : '2px solid transparent',
              padding: '10px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
              marginBottom: -2,
              transition: 'color 200ms ease, border-color 200ms ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {cfg.data ? (
        <TabCuaderno
          key={cfg.cursoId}
          userId={userId}
          cursoId={cfg.cursoId}
          cursoNum={cfg.cursoNum}
          data={cfg.data}
          irAlEjercicio={irAlEjercicio}
        />
      ) : (
        <TabProximamente />
      )}
    </div>
  );
}
