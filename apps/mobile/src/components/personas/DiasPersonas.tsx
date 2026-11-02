/**
 * Sesiones de los días 2 («Descubre el temperamento de X») y 12 («Mis personas»). Las fichas y las
 * observaciones se hacen aquí mismo, sin salir de la sesión.
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { combinacion, idDeClave, type Persona } from '@/lib/personas';
import type { EstadoCamino } from '@/features/camino';
import type { EstadoPersonas } from '@/features/personas';
import { useTemperamento } from '@/features/temperamento';
import { Bloque, Continuar, NOMBRES, Pantalla, VERDE, fraseGrande, nota, parrafo, titular } from '@/components/camino/ui';
import type { FinJuego } from '@/components/camino/Juegos';
import { color, fontFamily, space, type } from '@/theme';
import { Avatar } from './comun';
import { CrearFicha } from './CrearFicha';
import { ListaPersonas } from './MisPersonas';
import { Observacion } from './Observacion';
import { textoConQuien } from './EligeQuien';

const RECONOCIO: Record<string, string> = { si: 'Sí', en_parte: 'En parte', no: 'No' };

export function DiaFicha({ dia, personas, estadoVida, onFin }: { dia: number; personas: EstadoPersonas; estadoVida?: string | null; onFin: FinJuego }) {
  const [creando, setCreando] = useState(false);
  const lista = personas.lista;
  if (creando) {
    return (
      <CrearFicha
        estadoVida={estadoVida}
        menor={personas.menor}
        onSalir={() => setCreando(false)}
        onHecho={(p) => {
          void personas.recargar();
          onFin({ ficha: p.id });
        }}
      />
    );
  }
  return (
    <Pantalla
      etiqueta={`Día ${dia} · Descubre el temperamento de X`}
      pie={
        <>
          <Button label={lista.length ? 'Descubre el de otra persona' : 'Crear ficha'} onPress={() => setCreando(true)} />
          <Button variant="ghost" label="Ahora no" onPress={() => onFin({ ficha: null })} />
        </>
      }>
      <Text style={fraseGrande}>Ya conoces tu temperamento. ¿Te atreves con el de alguien que conoces bien?</Text>
      <Text style={parrafo}>Con tus personas en la app, cada día te propondremos con quién hacer el reto.</Text>
      {lista.length > 0 ? (
        <View style={{ gap: space.xs }}>
          <Text style={[type.eyebrow, { color: color.plomo }]}>Tu primera ficha</Text>
          <ListaPersonas personas={lista.slice(0, 1)} onAbrir={() => {}} compacta />
        </View>
      ) : null}
    </Pantalla>
  );
}

export function Dia12({ dia, camino, personas, onFin }: { dia: number; camino: EstadoCamino; personas: EstadoPersonas; onFin: FinJuego }) {
  const temp = useTemperamento();
  const [sub, setSub] = useState<null | { crear: true } | { observar: Persona }>(null);
  const [observadas, setObservadas] = useState<string[]>([]);
  const { porDia, perfil } = camino;
  const { lista, porId } = personas;

  // A quién se lo contaste (exámenes de la semana 1).
  const contados = [8, 9, 10, 11]
    .map((d) => ({ dia: d, ...porDia[d]?.examen }))
    .filter((e) => e.reto && e.reto !== 'no' && e.con_quien && e.con_quien !== 'solo');
  const fichasContadas = [...new Set(contados.map((e) => idDeClave(e.con_quien)).filter((id): id is string => !!id && !!porId[id]))].map((id) => porId[id]);
  const sinFicha = contados.some((e) => !idDeClave(e.con_quien));
  const paraObservar = fichasContadas.length ? fichasContadas : lista;
  const conTemperamento = lista.filter((p) => p.primario);

  if (sub && 'crear' in sub) {
    return (
      <CrearFicha
        estadoVida={perfil?.estado_vida}
        menor={personas.menor}
        onSalir={() => setSub(null)}
        onHecho={() => {
          void personas.recargar();
          setSub(null);
        }}
      />
    );
  }
  if (sub && 'observar' in sub) {
    const p = sub.observar;
    return (
      <Observacion
        persona={p}
        onSalir={() => setSub(null)}
        onHecho={() => {
          void personas.recargar();
          setObservadas((o) => [...o, p.id]);
          setSub(null);
        }}
      />
    );
  }

  return (
    <Pantalla etiqueta={`Día ${dia} · Mis personas`} pie={<Continuar onPress={() => onFin({ contados: contados.length, observadas: observadas.length })} />}>
      <Text style={titular}>Aprender a leer a los demás</Text>

      <Bloque titulo="A quién se lo has contado">
        {contados.length === 0 ? (
          <Text style={parrafo}>Esta semana no has anotado a quién se lo contaste. Puedes hacerlo en el examen de la noche.</Text>
        ) : (
          contados.map((e) => (
            <View key={e.dia} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text style={parrafo}>{textoConQuien(e.con_quien!, porId)}</Text>
              <Text style={nota}>
                ¿Te reconoció? <Text style={{ fontFamily: fontFamily.sans700, color: color.pizarra }}>{RECONOCIO[e.reconocio ?? ''] ?? '—'}</Text>
              </Text>
            </View>
          ))
        )}
      </Bloque>

      {sinFicha || lista.length === 0 ? (
        <Bloque titulo="¿Descubres su temperamento?">
          <Text style={parrafo}>Crea la ficha de alguien a quien se lo contaste y responde 8 preguntas sobre cómo reacciona.</Text>
          <Button variant="secondary" label="Crear ficha" onPress={() => setSub({ crear: true })} />
        </Bloque>
      ) : null}

      {paraObservar.length > 0 ? (
        <Bloque titulo="¿Qué reacción le has visto esta semana?">
          {paraObservar.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar persona={p} tam={36} />
              <Text style={[type.bodyStrong, { flex: 1, color: color.pizarra }]}>{p.nombre}</Text>
              {observadas.includes(p.id) ? (
                <Text style={[type.caption, { color: VERDE, fontFamily: fontFamily.sans700 }]}>Anotado ✓</Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSub({ observar: p })}
                  style={{ borderWidth: 1, borderColor: color.azulProfundo, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14 }}>
                  <Text style={[type.caption, { color: color.azulProfundo, fontFamily: fontFamily.sans500 }]}>Anotar</Text>
                </Pressable>
              )}
            </View>
          ))}
        </Bloque>
      ) : null}

      {temp?.primario && conTemperamento.length > 0 ? (
        <Bloque titulo="Tú y tus personas">
          {conTemperamento.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', gap: 10 }}>
              <Avatar persona={p} tam={36} />
              <View style={{ flex: 1 }}>
                <Text style={nota}>
                  Tú, {NOMBRES[temp.primario].toLowerCase()} · {p.nombre}, {NOMBRES[p.primario!].toLowerCase()}
                  {p.estado === 'confirmado' ? '' : ' (estimado)'}
                </Text>
                <Text style={parrafo}>{combinacion(temp.primario, p.primario)}</Text>
              </View>
            </View>
          ))}
        </Bloque>
      ) : null}
    </Pantalla>
  );
}
