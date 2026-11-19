import { useNavigate, useSearchParams } from 'react-router-dom';
import { LocalLink as Link, useLocalPath } from '../i18n';
import { fetchLatestCharacter } from '../account/account';
import { useDatos } from '../account/useDatos';
import { useSession } from '../account/useSession';
import { extremos, resultadoCaracter } from '../lib/virtudes.js';
import { INK, MUTED, NAVY, FONT_BODY, FONT_SLAB, GOLD_REF } from '../theme';
import { botonSobreClaro, eyebrow, parrafo, tarjeta, titulo } from './estilos';
import { IconoFlecha } from './Iconos';
import { EsqueletoTarjeta } from './Esqueleto';
import { VirtudesRadar } from './Radar';

const DEMO = { self: { magnanimidad: 72, humildad: 55, prudencia: 63, fortaleza: 48, dominio: 60, justicia: 70 } };

export const TEXTO_VIRTUD = {
  magnanimidad: {
    bien: 'Reconoces tu dignidad y tu vocación trascendente, y te mueves a la acción con ambición noble.',
    cultivar: 'Es la virtud de las almas contemplativas que se dirigen a la acción. Trabajar la magnanimidad es atreverte a luchar por grandes cosas.',
  },
  humildad: {
    bien: 'Vives en la verdad sobre ti mismo y sirves a los demás ayudándoles a crecer como personas.',
    cultivar: 'Es el hábito de vivir en la verdad sobre uno mismo. Cultivar la humildad es conocerte mejor y ponerte al servicio de los demás.',
  },
  prudencia: {
    bien: 'Contemplas las situaciones en su complejidad y tomas decisiones conforme a esa percepción.',
    cultivar: 'Es el arte de tomar buenas decisiones. Cultivar la prudencia es mejorar tu deliberación y la firmeza de tus decisiones.',
  },
  fortaleza: {
    bien: 'Sabes asumir riesgos con audacia y mantener el rumbo con resistencia, incluso ante la adversidad.',
    cultivar: 'Tiene dos dimensiones: la audacia y la resistencia. Cultivar la fortaleza es atreverte a más y mantenerte firme en lo difícil.',
  },
  dominio: {
    bien: 'Sometes tus bajas pasiones y estimulas las nobles, poniéndolas al servicio de tu misión.',
    cultivar: 'Es dirigir nuestras pasiones. Cultivar el dominio de sí es mortificar lo que te frena y estimular lo que te impulsa.',
  },
  justicia: {
    bien: 'Practicas la comunión interpersonal con sinceridad y amor, y construyes el bien común.',
    cultivar: 'Es dar a cada uno lo suyo. Cultivar la justicia es crecer en sinceridad, amor y compromiso con el bien común.',
  },
};

// Qué virtudes son más naturales y más difíciles para cada temperamento dominante, según Havard.
export const TEMP_VIRTUD = {
  COL: {
    natural: ['fortaleza', 'magnanimidad'],
    dificil: ['humildad', 'prudencia'],
    mayor: {
      fortaleza: 'Como colérico, la acción y el resultado son tu terreno natural — es lógico que la fortaleza sea tu punto fuerte.',
      magnanimidad: 'Tu naturaleza colérica te empuja a pensar en grande y pasar a la acción. La magnanimidad es muy tuya.',
      _generico: 'Tu energía colérica te ha servido para construir esta virtud. Aprovéchala para seguir creciendo.',
    },
    menor: {
      humildad: 'Tu impulso hacia la acción puede hacerte descuidar el autoconocimiento y el servicio. Es un campo de crecimiento muy valioso para ti.',
      prudencia: 'Tu inclinación a actuar rápido puede adelantarse a la deliberación. Hacer una pausa para reflexionar antes de decidir te hará más eficaz.',
      magnanimidad: 'Aunque como colérico tiendes a la acción, la magnanimidad requiere también contemplación. Combinar las dos es tu siguiente paso.',
      _generico: 'Tu temperamento te da mucha energía para actuar. Canalizar esa fuerza hacia esta virtud es tu próximo reto.',
    },
  },
  MEL: {
    natural: ['prudencia', 'humildad'],
    dificil: ['fortaleza', 'magnanimidad'],
    mayor: {
      prudencia: 'Como melancólico, tu inclinación a la contemplación y el análisis te da una base natural para la prudencia.',
      humildad: 'Tu naturaleza introspectiva te facilita el autoconocimiento, la raíz de la humildad.',
      _generico: 'Tu sensibilidad y profundidad melancólica te han ayudado a construir esta virtud.',
    },
    menor: {
      fortaleza: 'Tu tendencia a la reflexión puede frenar el paso a la acción. Cultivar la audacia y la resistencia es el complemento que necesitas.',
      magnanimidad: 'Tienes la contemplación, pero la magnanimidad exige dar el salto a la acción. Atreverte a soñar en grande es tu reto.',
      _generico: 'Tu temperamento contemplativo necesita el empuje de esta virtud para equilibrarse. Es un crecimiento muy natural para ti.',
    },
  },
  SAN: {
    natural: ['justicia', 'humildad'],
    dificil: ['dominio', 'fortaleza'],
    mayor: {
      justicia: 'Como sanguíneo, tu amor por las personas y tu afectividad te llevan naturalmente a la comunión y el servicio.',
      humildad: 'Tu atención a los demás y tu capacidad de escucha te facilitan la humildad fraterna.',
      _generico: 'Tu calidez sanguínea te da una base fuerte en esta virtud. Sigue construyendo sobre ella.',
    },
    menor: {
      dominio: 'Tu impulsividad sanguínea puede dificultar el dominio de tus emociones. Aprender a canalizar tus pasiones es un gran paso.',
      fortaleza: 'Tu naturaleza amable puede hacerte evitar el conflicto. La resistencia ante lo difícil es tu campo de crecimiento.',
      _generico: 'Tu temperamento abierto y afectivo necesita el contrapeso de esta virtud para completarse.',
    },
  },
  FLE: {
    natural: ['dominio', 'prudencia'],
    dificil: ['magnanimidad', 'fortaleza'],
    mayor: {
      dominio: 'Como flemático, tu calma natural y tu equilibrio emocional te dan una base sólida para el dominio de ti mismo.',
      prudencia: 'Tu serenidad te permite contemplar las situaciones sin impulsividad. La prudencia es muy tuya.',
      _generico: 'Tu estabilidad flemática te ha ayudado a construir esta virtud. Es un cimiento sólido.',
    },
    menor: {
      magnanimidad: 'Tu temperamento tranquilo puede frenarte ante la ambición noble. Atreverte a soñar en grande es tu próximo paso.',
      fortaleza: 'Tu tendencia a la calma puede dificultar la audacia. Dar el primer paso sin esperar a que todo esté perfecto es tu reto.',
      _generico: 'Tu serenidad es una fortaleza, pero esta virtud te pide salir de tu zona de confort. Merece la pena.',
    },
  },
};

export function notaTemperamento(tempClave, virtudClave, tipo) {
  if (!tempClave) return null;
  const primario = tempClave.split('-')[0];
  const datos = TEMP_VIRTUD[primario];
  if (!datos) return null;
  const mapa = datos[tipo];
  return mapa?.[virtudClave] ?? mapa?._generico ?? null;
}

export default function MapaCaracter({ tempClave }) {
  const [params] = useSearchParams();
  const session = useSession();
  const userId = session?.user?.id;
  const { datos, listo, error } = useDatos(userId ? `caracter:${userId}` : null, async () => (await fetchLatestCharacter()) ?? null);
  const fila = listo ? datos : error ? null : undefined; // undefined = cargando por primera vez
  const navigate = useNavigate();
  const lp = useLocalPath();

  const demo = (process.env.NODE_ENV !== 'production') && params.has('demo');
  const resultado = resultadoCaracter(demo ? DEMO : fila?.result);
  if (fila === undefined && !demo) return <EsqueletoTarjeta alto={420} />;

  if (!resultado) {
    return (
      <section style={tarjeta} aria-label="Tus virtudes">
        <div style={eyebrow}>Tus virtudes</div>
        <h2 style={{ ...titulo(26), margin: '10px 0 8px' }}>Descubre qué virtudes has construido</h2>
        <p style={{ ...parrafo, marginBottom: 6 }}>El test de carácter mide las seis virtudes y dibuja aquí tu punto de partida. Son 68 preguntas y se hace una sola vez.</p>
        <p style={{ ...parrafo, fontSize: 13.5, marginBottom: 18 }}>Hazlo con tu sesión iniciada: así el resultado se guarda en tu cuenta.</p>
        <Link to="/tests/caracter" style={botonSobreClaro}>Hacer el test de carácter <IconoFlecha width={18} height={18} /></Link>
      </section>
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
    <section style={tarjeta} aria-label="Tus virtudes">
      <div style={eyebrow}>Tu mapa de carácter{fecha ? ` · ${fecha}` : ''}</div>

      <div className="vl-caracter-grid">
        <style>{`
          .vl-caracter-grid { margin-top: 8px; }
          @media (min-width: 860px) {
            .vl-caracter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; }
          }
        `}</style>

        <div>
          <VirtudesRadar valores={valores} />
        </div>

        <div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: INK, margin: '0 0 4px', lineHeight: 1.5 }}>
            Tu virtud más fuerte es <strong style={{ color: NAVY }}>{mayor.nombre}</strong> ({Math.round(mayor.valor)}%).
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: MUTED, margin: '0 0 14px', lineHeight: 1.5 }}>
            {notaMayor || textoMayor?.bien}
          </p>

          <p style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: INK, margin: '0 0 4px', lineHeight: 1.5 }}>
            Lo que más puedes cultivar ahora es <strong style={{ color: NAVY }}>{menor.nombre}</strong> ({Math.round(menor.valor)}%).
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: MUTED, margin: '0 0 4px', lineHeight: 1.5 }}>
            {notaMenor || textoMenor?.cultivar}
          </p>

          <button type="button" onClick={() => navigate(lp('/app/caracter'))} style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 16,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: NAVY,
          }}>
            Ver más →
          </button>
        </div>
      </div>
    </section>
  );
}
