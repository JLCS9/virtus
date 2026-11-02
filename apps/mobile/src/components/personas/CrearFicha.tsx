/**
 * «Descubre el temperamento de X»: crear la ficha (o rehacer el test de una que ya existe), las 8
 * preguntas, el desempate si hace falta y el resultado. Al guardar, la ficha aparece en Mis personas
 * (en la app y en la web).
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Field } from '@/components/ui';
import {
  AVATARES,
  DESEMPATE,
  FICHA,
  INTRO,
  NO_SE,
  PREGUNTAS,
  RELACIONES,
  TEXTO_CONFIANZA,
  gruposPara,
  necesitaDesempate,
  ordenAleatorio,
  puntuar,
  textoResultado,
  textoSinResultado,
  type Desempate,
  type Persona,
} from '@/lib/personas';
import { crearPersona, guardarEstimacion, type DatosFicha } from '@/features/personas';
import { useTemperamento } from '@/features/temperamento';
import { Atras, Continuar, NOMBRES, Opcion, Opciones, Pantalla, Puntos, TEMP_COLORS, fraseGrande, nota, parrafo, textoError, titular } from '@/components/camino/ui';
import { color, fontFamily, radius, space, type } from '@/theme';
import { FichaContenido } from './comun';

function Pastilla({ activa, onPress, children, etiqueta }: { activa: boolean; onPress: () => void; children: string; etiqueta?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      style={{
        borderRadius: radius.pill,
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderWidth: 1,
        borderColor: activa ? color.azulProfundo : color.bruma,
        backgroundColor: activa ? color.azulProfundo : color.niebla,
      }}>
      <Text style={[type.body, { fontSize: children.length <= 2 ? 20 : 14, color: activa ? color.blanco : color.pizarra }]}>{children}</Text>
    </Pressable>
  );
}

const Campo = ({ texto, ayuda }: { texto: string; ayuda?: string }) => (
  <Text style={[type.bodyStrong, { color: color.pizarra, marginTop: space.s }]}>
    {texto}
    {ayuda ? <Text style={{ fontFamily: fontFamily.sans400, color: color.plomo }}> {ayuda}</Text> : null}
  </Text>
);

function Datos({ estadoVida, menor, onListo, onSalir }: { estadoVida?: string | null; menor: boolean; onListo: (d: DatosFicha) => void; onSalir: () => void }) {
  const [d, setD] = useState<Omit<DatosFicha, 'grupo'> & { grupo: DatosFicha['grupo'] | null }>({
    nombre: '',
    grupo: null,
    relacion: null,
    avatar: null,
    estrella: false,
    me_cuesta: false,
  });
  const valido = d.nombre.trim().length > 0 && !!d.grupo;
  return (
    <Pantalla
      etiqueta="Crear ficha"
      onVolver={onSalir}
      pie={<Continuar disabled={!valido} onPress={() => d.grupo && onListo({ ...d, grupo: d.grupo, nombre: d.nombre.trim() })} />}>
      <Text style={titular}>¿De quién quieres descubrir el temperamento?</Text>
      <Field label="Nombre o apodo" hint="Sin apellidos. Solo tú verás esta ficha." value={d.nombre} maxLength={40} autoComplete="off" onChangeText={(nombre) => setD({ ...d, nombre })} />

      <Campo texto="Grupo" />
      <Opciones columnas={2}>
        {gruposPara(estadoVida).map(([g, texto]) => (
          <Opcion key={g} compacta activa={d.grupo === g} onPress={() => setD({ ...d, grupo: g })}>
            {texto}
          </Opcion>
        ))}
      </Opciones>

      <Campo texto="Relación" ayuda="(opcional)" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {RELACIONES.map((r) => (
          <Pastilla key={r} activa={d.relacion === r} onPress={() => setD({ ...d, relacion: d.relacion === r ? null : r })}>
            {r}
          </Pastilla>
        ))}
      </View>

      <Campo texto="Avatar" ayuda="(opcional; si no, su inicial)" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {AVATARES.map((a) => (
          <Pastilla key={a} etiqueta={`Avatar ${a}`} activa={d.avatar === a} onPress={() => setD({ ...d, avatar: d.avatar === a ? null : a })}>
            {a}
          </Pastilla>
        ))}
      </View>

      <Campo texto="Solo para ti" ayuda="(nunca se muestra a nadie)" />
      <View style={{ gap: 8 }}>
        <Opcion activa={d.estrella} onPress={() => setD({ ...d, estrella: !d.estrella })}>
          ★ Quiero trabajar mis virtudes con esta persona
        </Opcion>
        {!menor ? (
          <Opcion activa={d.me_cuesta} onPress={() => setD({ ...d, me_cuesta: !d.me_cuesta })}>
            Me cuesta
          </Opcion>
        ) : null}
      </View>
    </Pantalla>
  );
}

type Paso = 'datos' | 'intro' | number | 'rapidez' | 'duracion' | 'resultado';

/** persona: si existe, se rehace su test (sin pedir los datos). Si no, se crea la ficha al guardar. */
export function CrearFicha({
  estadoVida,
  menor,
  persona = null,
  onHecho,
  onSalir,
}: {
  estadoVida?: string | null;
  menor: boolean;
  persona?: Persona | null;
  onHecho: (p: Persona) => void;
  onSalir: () => void;
}) {
  const temp = useTemperamento();
  const [orden] = useState(() => ordenAleatorio());
  const [datos, setDatos] = useState<DatosFicha | null>(null);
  const [paso, setPaso] = useState<Paso>(persona ? 'intro' : 'datos');
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [desempate, setDesempate] = useState<Desempate>({});
  const [estado, setEstado] = useState<null | 'guardando' | 'error'>(null);

  const nombre = persona?.nombre ?? datos?.nombre ?? '';
  const etiqueta = `Descubre el temperamento de ${nombre}`;

  if (paso === 'datos') {
    return (
      <Datos
        estadoVida={estadoVida}
        menor={menor}
        onSalir={onSalir}
        onListo={(d) => {
          setDatos(d);
          setPaso('intro');
        }}
      />
    );
  }

  if (paso === 'intro') {
    return (
      <Pantalla etiqueta={etiqueta} onVolver={onSalir} pie={<Continuar label="Empezar · 8 preguntas" onPress={() => setPaso(0)} />}>
        <Text style={fraseGrande}>{INTRO(nombre)}</Text>
      </Pantalla>
    );
  }

  if (typeof paso === 'number') {
    const [pregunta, opciones] = PREGUNTAS[paso];
    const responder = (r: string) => {
      const nuevas = [...respuestas.slice(0, paso), r];
      setRespuestas(nuevas);
      setTimeout(() => {
        if (paso + 1 < PREGUNTAS.length) setPaso(paso + 1);
        else setPaso(necesitaDesempate(nuevas) ? 'rapidez' : 'resultado');
      }, 160);
    };
    return (
      <Pantalla etiqueta={etiqueta} onVolver={onSalir} pie={paso > 0 ? <Atras onPress={() => setPaso(paso - 1)} /> : undefined}>
        <Puntos total={PREGUNTAS.length} actual={paso} />
        <Text style={nota}>{nombre}…</Text>
        <Text style={titular}>{pregunta}</Text>
        <Opciones>
          {orden[paso].map((k) => (
            <Opcion key={k} activa={respuestas[paso] === k} onPress={() => responder(k)}>
              {opciones[k]}
            </Opcion>
          ))}
          <Opcion activa={respuestas[paso] === NO_SE} onPress={() => responder(NO_SE)}>
            <Text style={[type.body, { color: respuestas[paso] === NO_SE ? color.blanco : color.plomo }]}>No lo sé</Text>
          </Opcion>
        </Opciones>
      </Pantalla>
    );
  }

  if (paso === 'rapidez' || paso === 'duracion') {
    const q = DESEMPATE[paso];
    const siguiente = () => setPaso(paso === 'rapidez' ? 'duracion' : 'resultado');
    return (
      <Pantalla etiqueta={etiqueta} onVolver={onSalir}>
        <Text style={nota}>Dos preguntas más para afinar.</Text>
        <Text style={titular}>{q.pregunta(nombre)}</Text>
        <Opciones>
          {q.opciones.map(([v, texto]) => (
            <Opcion
              key={v}
              onPress={() => {
                setDesempate((x) => ({ ...x, [paso]: v }));
                setTimeout(siguiente, 160);
              }}>
              {texto}
            </Opcion>
          ))}
          <Opcion onPress={siguiente}>
            <Text style={[type.body, { color: color.plomo }]}>No lo sé</Text>
          </Opcion>
        </Opciones>
      </Pantalla>
    );
  }

  // Resultado.
  const r = puntuar(respuestas, desempate);
  async function guardar() {
    setEstado('guardando');
    const estimacion = { respuestas, desempate: Object.keys(desempate).length ? desempate : null, ...r };
    try {
      let guardada: Persona;
      if (persona) {
        await guardarEstimacion(persona.id, estimacion);
        guardada = { ...persona, primario: r.primario, secundario: r.secundario, confianza: r.confianza, puntos: r.puntos };
      } else {
        guardada = await crearPersona(datos!, estimacion);
      }
      onHecho(guardada);
    } catch {
      setEstado('error');
    }
  }
  const pie = (
    <>
      {estado === 'error' ? textoError('No he podido guardar la ficha. Inténtalo de nuevo.') : null}
      <Continuar label={estado === 'guardando' ? 'Guardando…' : 'Guardar la ficha'} disabled={estado === 'guardando'} onPress={guardar} />
    </>
  );

  if (!r.primario) {
    return (
      <Pantalla etiqueta={etiqueta} pie={pie}>
        <Text style={fraseGrande}>{textoSinResultado(nombre)}</Text>
        <Text style={parrafo}>Guardamos la ficha sin temperamento. Cuando le observes, podrás anotar sus reacciones o volver a hacer el test.</Text>
      </Pantalla>
    );
  }
  const f = FICHA[r.primario];
  return (
    <Pantalla etiqueta={etiqueta} pie={pie}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: TEMP_COLORS[r.primario] }} />
        <Text style={{ fontFamily: fontFamily.slab700, fontSize: 28, lineHeight: 34, color: TEMP_COLORS[r.primario] }}>{NOMBRES[r.primario]}</Text>
        {r.secundario ? <Text style={nota}>· secundario {NOMBRES[r.secundario].toLowerCase()}</Text> : null}
      </View>
      {r.confianza ? <Text style={[nota, { fontFamily: fontFamily.sans700, color: color.plomo }]}>{TEXTO_CONFIANZA[r.confianza]}</Text> : null}
      <Text style={parrafo}>{textoResultado(nombre, NOMBRES[r.primario].toLowerCase(), f.lema)}</Text>
      <FichaContenido persona={{ nombre, primario: r.primario }} miPrimario={temp?.primario} />
      <Text style={nota}>Solo {nombre} puede confirmarlo. Pronto podrás invitarle a hacer el test.</Text>
    </Pantalla>
  );
}
