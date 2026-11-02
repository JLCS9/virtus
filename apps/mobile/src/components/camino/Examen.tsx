/**
 * Examen de la noche: 45 segundos, tres toques. ¿Hiciste el reto? ¿Con quién? ¿Cómo te fue?
 * Semana 0: la palabra de tu reacción más fuerte (su temperamento nunca se muestra).
 * Semana 1: «¿Te reconoció?» y cómo te fue. Con vida interior: «¿Quieres dar gracias…?», un toque.
 * Sustituye a la conversación de la noche con la IA.
 */
import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/ui';
import { EXAMEN, PALABRAS, semanaDe, type Examen as RespuestasExamen } from '@/lib/camino';
import { idDeClave } from '@/lib/personas';
import { guardarExamen, type EstadoCamino } from '@/features/camino';
import type { EstadoPersonas } from '@/features/personas';
import { EligeQuien } from '@/components/personas/EligeQuien';
import { Observacion } from '@/components/personas/Observacion';
import { Atras, Hecho, Opcion, Opciones, Pantalla, Puntos, parrafo, textoError, titular } from './ui';
import { color, type } from '@/theme';

type Clave = 'reto' | 'con_quien' | 'reconocio' | 'palabra' | 'animo' | 'gracias';

function pasosDe(semana: number, r: RespuestasExamen, vidaInterior: boolean): Clave[] {
  const p: Clave[] = ['reto'];
  if (r.reto && r.reto !== 'no') p.push('con_quien');
  if (semana === 1 && r.reto && r.reto !== 'no' && r.con_quien && r.con_quien !== 'solo') p.push('reconocio');
  p.push(semana === 0 ? 'palabra' : 'animo');
  if (vidaInterior) p.push('gracias');
  return p;
}

export function Examen({ dia, camino, personas, onCerrar }: { dia: number; camino: EstadoCamino; personas: EstadoPersonas; onCerrar: () => void }) {
  const semana = semanaDe(dia).numero;
  const vidaInterior = camino.perfil?.vida_interior === 'si';
  const [r, setR] = useState<RespuestasExamen>({});
  const [i, setI] = useState(0);
  const [estado, setEstado] = useState<null | 'guardando' | 'hecho' | 'error'>(null);
  const [observando, setObservando] = useState<boolean | 'hecho'>(false);

  const pasos = pasosDe(semana, r, vidaInterior);
  const clave = pasos[i];

  async function guardar(final: RespuestasExamen) {
    setEstado('guardando');
    try {
      await guardarExamen(dia, final);
      void camino.recargar();
      setEstado('hecho');
    } catch {
      setEstado('error');
    }
  }

  function responder(campo: Clave, valor: string | number | boolean) {
    const nuevo = { ...r, [campo]: valor } as RespuestasExamen;
    if (campo === 'reto' && valor === 'no') {
      delete nuevo.con_quien;
      delete nuevo.reconocio;
    }
    if (campo === 'con_quien' && valor === 'solo') delete nuevo.reconocio;
    setR(nuevo);
    const p = pasosDe(semana, nuevo, vidaInterior);
    const j = p.indexOf(campo);
    if (j + 1 < p.length) setTimeout(() => setI(j + 1), 160);
    else void guardar(nuevo);
  }

  // Si lo hizo con alguien que tiene ficha: «¿Quieres anotar cómo reaccionó?».
  const ficha = personas.porId[idDeClave(r.con_quien) ?? ''] ?? null;
  if (estado === 'hecho' && observando === true && ficha) {
    return (
      <Observacion
        persona={ficha}
        onSalir={() => setObservando(false)}
        onHecho={() => {
          void personas.recargar();
          setObservando('hecho');
        }}
      />
    );
  }
  if (estado === 'hecho') {
    const conFicha = ficha && observando !== 'hecho';
    return (
      <Pantalla
        etiqueta={`Día ${dia} · Examen de la noche`}
        pie={
          <>
            {conFicha ? <Button label="Anotar su reacción" onPress={() => setObservando(true)} /> : null}
            <Button variant={conFicha ? 'secondary' : 'primary'} label="Volver a mi camino" onPress={onCerrar} />
          </>
        }>
        <Hecho titulo="Buenas noches" />
        <Text style={parrafo}>Has mirado tu día. Mañana, un paso más.</Text>
        {conFicha ? <Text style={parrafo}>¿Quieres anotar cómo reaccionó {ficha.nombre}?</Text> : null}
      </Pantalla>
    );
  }

  const pie = (
    <>
      {estado === 'error' ? (
        <>
          {textoError('No he podido guardar tu examen.')}
          <Button variant="secondary" label="Reintentar" onPress={() => guardar(r)} />
        </>
      ) : null}
      {estado === 'guardando' ? <Text style={parrafo}>Guardando…</Text> : i > 0 ? <Atras onPress={() => setI(i - 1)} /> : null}
    </>
  );

  return (
    <Pantalla etiqueta={`Día ${dia} · Examen de la noche`} onVolver={onCerrar} pie={pie}>
      {i === 0 ? <Text style={[type.cita, { color: color.pizarra, fontSize: 19, lineHeight: 28 }]}>{EXAMEN.intro}</Text> : null}
      <Puntos total={pasos.length} actual={i} />
      {clave === 'con_quien' ? (
        <>
          <Text style={titular}>{EXAMEN.con_quien.pregunta}</Text>
          <EligeQuien personas={personas.lista} valor={r.con_quien} onElegir={(v) => v && responder('con_quien', v)} extra={[['solo', 'Solo']]} />
        </>
      ) : null}
      {clave === 'reto' || clave === 'reconocio' ? (
        <>
          <Text style={titular}>{EXAMEN[clave].pregunta}</Text>
          <Opciones columnas={3}>
            {EXAMEN[clave].opciones.map(([v, texto]) => (
              <Opcion key={v} compacta activa={r[clave] === v} onPress={() => responder(clave, v)}>
                {texto}
              </Opcion>
            ))}
          </Opciones>
        </>
      ) : null}
      {clave === 'palabra' ? (
        <>
          <Text style={titular}>{EXAMEN.palabra.pregunta}</Text>
          <Opciones columnas={2}>
            {PALABRAS.map(([texto]) => (
              <Opcion key={texto} compacta activa={r.palabra === texto} onPress={() => responder('palabra', texto)}>
                {texto}
              </Opcion>
            ))}
          </Opciones>
        </>
      ) : null}
      {clave === 'animo' ? (
        <>
          <Text style={titular}>{EXAMEN.animo.pregunta}</Text>
          <Opciones columnas={5}>
            {EXAMEN.animo.opciones.map(([v, emoji, texto]) => (
              <Opcion key={v} compacta activa={r.animo === v} onPress={() => responder('animo', v)}>
                <Text accessibilityLabel={texto} style={{ fontSize: 26, textAlign: 'center' }}>
                  {emoji}
                </Text>
              </Opcion>
            ))}
          </Opciones>
        </>
      ) : null}
      {clave === 'gracias' ? (
        <>
          <Text style={titular}>{EXAMEN.gracias}</Text>
          <Opciones columnas={2}>
            <Opcion compacta onPress={() => responder('gracias', true)}>
              Doy gracias
            </Opcion>
            <Opcion compacta onPress={() => responder('gracias', false)}>
              Hoy no
            </Opcion>
          </Opciones>
        </>
      ) : null}
    </Pantalla>
  );
}
