/**
 * Observación rápida: cómo ha reaccionado esa persona, en 3 toques (qué pasó, cómo reaccionó, una
 * línea opcional). Cada una suma 0,5 puntos; si cambia el primario estimado, se propone actualizar
 * la ficha y decide el usuario.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Field } from '@/components/ui';
import { PALABRAS_3P, SITUACIONES, propuestaPorObservaciones, textoPropuesta, type Persona } from '@/lib/personas';
import type { Temp } from '@/lib/camino';
import { actualizarPersona, anotarObservacion, observacionesDe } from '@/features/personas';
import { Atras, Continuar, NOMBRES, Opcion, Opciones, Pantalla, Puntos, fraseGrande, nota, textoError, titular } from '@/components/camino/ui';
import { space } from '@/theme';

export function Observacion({ persona, onHecho, onSalir }: { persona: Persona; onHecho: () => void; onSalir: () => void }) {
  const [paso, setPaso] = useState(0);
  const [o, setO] = useState<{ situacion: string | null; palabra: string | null; temperamento: Temp | null; linea: string }>({
    situacion: null,
    palabra: null,
    temperamento: null,
    linea: '',
  });
  const [estado, setEstado] = useState<null | 'guardando' | 'error'>(null);
  const [propuesta, setPropuesta] = useState<Temp | null>(null);
  const etiqueta = `Lo que he visto de ${persona.nombre}`;

  async function guardar() {
    if (!o.situacion || !o.palabra || !o.temperamento) return;
    setEstado('guardando');
    try {
      const nueva = await anotarObservacion(persona.id, { situacion: o.situacion, palabra: o.palabra, temperamento: o.temperamento, linea: o.linea.trim() });
      const p = propuestaPorObservaciones(persona, await observacionesDe(persona.id), nueva);
      if (p) {
        setPropuesta(p);
        setEstado(null);
      } else onHecho();
    } catch {
      setEstado('error');
    }
  }

  async function actualizar() {
    if (!propuesta) return;
    setEstado('guardando');
    try {
      await actualizarPersona(persona.id, {
        primario: propuesta,
        estado: 'estimado',
        secundario: persona.primario && persona.primario !== propuesta ? persona.primario : persona.secundario,
      });
      onHecho();
    } catch {
      setEstado('error');
    }
  }

  if (propuesta) {
    return (
      <Pantalla
        etiqueta={etiqueta}
        pie={
          <>
            {estado === 'error' ? textoError('No he podido actualizar la ficha.') : null}
            <Continuar label="Sí, actualizar" disabled={estado === 'guardando'} onPress={actualizar} />
            <Button variant="secondary" label="Dejarla como está" onPress={onHecho} />
          </>
        }>
        <Text style={fraseGrande}>{textoPropuesta(persona.nombre, NOMBRES[propuesta].toLowerCase())}</Text>
      </Pantalla>
    );
  }

  if (paso === 0) {
    return (
      <Pantalla etiqueta={etiqueta} onVolver={onSalir}>
        <Puntos total={3} actual={0} />
        <Text style={titular}>¿Qué pasó?</Text>
        <Opciones columnas={2}>
          {SITUACIONES.map(([v, texto]) => (
            <Opcion
              key={v}
              compacta
              activa={o.situacion === v}
              onPress={() => {
                setO((x) => ({ ...x, situacion: v }));
                setTimeout(() => setPaso(1), 160);
              }}>
              {texto}
            </Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }
  if (paso === 1) {
    return (
      <Pantalla etiqueta={etiqueta} onVolver={onSalir} pie={<Atras onPress={() => setPaso(0)} />}>
        <Puntos total={3} actual={1} />
        <Text style={titular}>¿Cómo reaccionó?</Text>
        <Opciones columnas={2}>
          {PALABRAS_3P.map(([texto, k]) => (
            <Opcion
              key={texto}
              compacta
              activa={o.palabra === texto}
              onPress={() => {
                setO((x) => ({ ...x, palabra: texto, temperamento: k }));
                setTimeout(() => setPaso(2), 160);
              }}>
              {texto}
            </Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }
  return (
    <Pantalla
      etiqueta={etiqueta}
      onVolver={onSalir}
      pie={
        <>
          {estado === 'error' ? textoError('No he podido guardarlo. Inténtalo de nuevo.') : null}
          <Continuar label={estado === 'guardando' ? 'Guardando…' : o.linea.trim() ? 'Guardar' : 'Guardar sin escribir'} disabled={estado === 'guardando'} onPress={guardar} />
        </>
      }>
      <Puntos total={3} actual={2} />
      <Text style={titular}>¿Quieres añadir una línea?</Text>
      <View style={{ gap: space.s }}>
        <Text style={nota}>Es opcional. Solo la ves tú.</Text>
        <Field label="Tu línea" value={o.linea} maxLength={280} multiline onChangeText={(linea) => setO((x) => ({ ...x, linea }))} />
      </View>
    </Pantalla>
  );
}
