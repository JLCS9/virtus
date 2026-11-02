/**
 * «Personaliza tu camino»: unas preguntas con botones, una vez, antes del día 1. Todo se puede
 * cambiar después. La primera vez pregunta también si quieres crear ya la primera ficha de persona.
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DIAS_SEMANA, ONBOARDING, calcularInicio, diaIso, fechaCorta, fechaLocal, textoCierreOnboarding, type CaminoPerfil } from '@/lib/camino';
import { guardarPerfil } from '@/features/camino';
import { Button } from '@/components/ui';
import { color, fontFamily, radius, space, type } from '@/theme';
import { Atras, Continuar, Opcion, Opciones, Pantalla, Puntos, fraseGrande, nota, parrafo, textoError, titular } from './ui';

const PASOS = ['entrada', 'momentos', 'estado_vida', 'objetivo', 'vida_interior', 'ficha', 'agenda'] as const;
type Respuestas = Pick<CaminoPerfil, 'momentos' | 'estado_vida' | 'objetivo' | 'vida_interior' | 'dia_video' | 'hora_examen'>;

/** Mueve una hora «HH:MM» en pasos de 15 minutos, dentro del día. */
function moverHora(hora: string, pasos: number) {
  const [h, m] = hora.split(':').map(Number);
  const total = Math.min(23 * 60 + 45, Math.max(0, h * 60 + m + pasos * 15));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function SelectorHora({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  const boton = (texto: string, pasos: number, etiqueta: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={() => onCambio(moverHora(valor, pasos))}
      style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: color.piedra, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fontFamily.sans500, fontSize: 22, color: color.azulProfundo }}>{texto}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }} accessibilityLabel={`Hora del examen: ${valor}`}>
      {boton('−', -1, 'Quince minutos antes')}
      <Text style={{ fontFamily: fontFamily.slab700, fontSize: 30, color: color.azulProfundo, minWidth: 96, textAlign: 'center' }}>{valor}</Text>
      {boton('+', 1, 'Quince minutos después')}
    </View>
  );
}

export function Onboarding({ perfil, onHecho, onSalir }: { perfil: CaminoPerfil | null; onHecho: (p: CaminoPerfil, quiereFicha: boolean) => void; onSalir?: () => void }) {
  const hoy = fechaLocal();
  const [paso, setPaso] = useState(0);
  const [r, setR] = useState<Respuestas>(() => ({
    momentos: perfil?.momentos ?? [],
    estado_vida: perfil?.estado_vida ?? null,
    objetivo: perfil?.objetivo ?? null,
    vida_interior: perfil?.vida_interior ?? null,
    dia_video: perfil?.dia_video ?? diaIso(hoy),
    hora_examen: (perfil?.hora_examen ?? '21:30').slice(0, 5),
  }));
  const [quiereFicha, setQuiereFicha] = useState<boolean | null>(null);
  const [guardado, setGuardado] = useState<CaminoPerfil | null>(null);
  // Al editar el perfil ya creado no se vuelve a preguntar por la primera ficha.
  const pasos = perfil ? PASOS.filter((x) => x !== 'ficha') : PASOS;
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);

  const siguiente = () => setPaso((p) => p + 1);
  const elegir = (campo: keyof Respuestas, valor: string) => {
    setR((x) => ({ ...x, [campo]: valor }));
    setTimeout(siguiente, 180);
  };

  async function guardar() {
    setOcupado(true);
    setError(false);
    try {
      // Si ya tenía camino, cambiar el día del vídeo no lo reinicia.
      const inicio = perfil?.inicio ?? calcularInicio(r.dia_video);
      setGuardado(await guardarPerfil({ ...r, inicio }));
    } catch {
      setError(true);
    }
    setOcupado(false);
  }

  if (guardado) {
    const empiezaHoy = guardado.inicio === hoy;
    return (
      <Pantalla
        etiqueta="Tu camino"
        pie={<Continuar label={quiereFicha ? 'Crear la ficha' : empiezaHoy ? 'Empezar el día 1' : 'Ver mi camino'} onPress={() => onHecho(guardado, quiereFicha === true)} />}>
        <Text style={[fraseGrande, { fontSize: 25, lineHeight: 34 }]}>{textoCierreOnboarding(empiezaHoy ? 'hoy' : `el ${fechaCorta(guardado.inicio)}`)}</Text>
      </Pantalla>
    );
  }

  const clave = pasos[paso];
  const volver = paso > 0 ? <Atras onPress={() => setPaso((p) => p - 1)} /> : undefined;

  if (clave === 'entrada') {
    return (
      <Pantalla etiqueta="Personaliza tu camino" onVolver={onSalir} pie={<Continuar label="Empezar" onPress={siguiente} />}>
        <Text style={[fraseGrande, { fontSize: 25, lineHeight: 33 }]}>{ONBOARDING.entrada}</Text>
        <Text style={parrafo}>Son unas pocas preguntas, unos dos minutos. Podrás cambiarlas cuando quieras.</Text>
      </Pantalla>
    );
  }

  const cabecera = <Puntos total={pasos.length - 1} actual={paso - 1} />;

  if (clave === 'momentos') {
    const q = ONBOARDING.momentos;
    const cambiar = (v: string) => setR((x) => ({ ...x, momentos: x.momentos.includes(v) ? x.momentos.filter((m) => m !== v) : [...x.momentos, v] }));
    return (
      <Pantalla
        etiqueta="Personaliza tu camino"
        onVolver={onSalir}
        pie={
          <>
            <Continuar disabled={!r.momentos.length} onPress={siguiente} />
            {volver}
          </>
        }>
        {cabecera}
        <Text style={titular}>{q.pregunta}</Text>
        <Text style={nota}>{q.ayuda}</Text>
        <Opciones columnas={2}>
          {q.opciones.map(([v, texto]) => (
            <Opcion key={v} activa={r.momentos.includes(v)} onPress={() => cambiar(v)}>
              {texto}
            </Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }

  if (clave === 'ficha') {
    return (
      <Pantalla etiqueta="Personaliza tu camino" onVolver={onSalir} pie={volver}>
        {cabecera}
        <Text style={titular}>¿Hay alguien cuyo temperamento te gustaría descubrir?</Text>
        <Text style={nota}>Ocho preguntas sobre cómo reacciona. Lo harás al terminar.</Text>
        <Opciones>
          <Opcion
            activa={quiereFicha === true}
            onPress={() => {
              setQuiereFicha(true);
              setTimeout(siguiente, 180);
            }}>
            Crear ficha
          </Opcion>
          <Opcion
            activa={quiereFicha === false}
            onPress={() => {
              setQuiereFicha(false);
              setTimeout(siguiente, 180);
            }}>
            Ahora no
          </Opcion>
        </Opciones>
      </Pantalla>
    );
  }

  if (clave === 'agenda') {
    return (
      <Pantalla
        etiqueta="Personaliza tu camino"
        onVolver={onSalir}
        pie={
          <>
            {error ? textoError('No he podido guardar tus respuestas. Inténtalo de nuevo.') : null}
            <Button label={ocupado ? 'Guardando…' : 'Listo'} disabled={ocupado} onPress={guardar} />
            {volver}
          </>
        }>
        {cabecera}
        <Text style={titular}>{ONBOARDING.agenda.pregunta}</Text>
        <Text style={[type.bodyStrong, { color: color.pizarra }]}>Tu vídeo de cada semana, el…</Text>
        <Opciones columnas={4}>
          {DIAS_SEMANA.map((nombre, i) => (
            <Opcion key={nombre} compacta activa={r.dia_video === i + 1} onPress={() => setR((x) => ({ ...x, dia_video: i + 1 }))}>
              {`${nombre.slice(0, 3)}${i + 1 === diaIso(hoy) ? ' · hoy' : ''}`}
            </Opcion>
          ))}
        </Opciones>
        <Text style={[type.bodyStrong, { color: color.pizarra, marginTop: space.s }]}>Tu examen de la noche, a las…</Text>
        <View style={{ alignSelf: 'flex-start', padding: space.s, borderRadius: radius.l, backgroundColor: color.niebla }}>
          <SelectorHora valor={r.hora_examen} onCambio={(hora_examen) => setR((x) => ({ ...x, hora_examen }))} />
        </View>
        {!perfil ? (
          <Text style={parrafo}>{r.dia_video === diaIso(hoy) ? 'Tu camino empieza hoy mismo.' : `Tu camino empezará el ${fechaCorta(calcularInicio(r.dia_video))}.`}</Text>
        ) : null}
      </Pantalla>
    );
  }

  const q = ONBOARDING[clave];
  return (
    <Pantalla etiqueta="Personaliza tu camino" onVolver={onSalir} pie={volver}>
      {cabecera}
      <Text style={titular}>{q.pregunta}</Text>
      <Opciones>
        {q.opciones.map(([v, texto]) => (
          <Opcion key={v} activa={r[clave] === v} onPress={() => elegir(clave, v)}>
            {texto}
          </Opcion>
        ))}
      </Opciones>
    </Pantalla>
  );
}
