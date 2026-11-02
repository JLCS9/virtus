/**
 * Cierres de semana: día 7 (tus reacciones, mapa del camino, sobre sellado) y día 14 (primer espejo,
 * tu semana, con quién has hecho el reto, mapa de mis personas y relectura de tu punto de partida).
 * Resumen + 1 pregunta.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Field } from '@/components/ui';
import {
  CIERRE_14,
  CIERRE_7,
  PALABRA_TEMPERAMENTO,
  PUNTO_PARTIDA,
  SEMANA_DEL_TEMPERAMENTO,
  fechaCorta,
  fechaDelDia,
  resumenSemana1,
  type Temp,
} from '@/lib/camino';
import { idDeClave } from '@/lib/personas';
import type { EstadoCamino } from '@/features/camino';
import type { EstadoPersonas } from '@/features/personas';
import { useContent } from '@/features/content';
import { useTemperamento } from '@/features/temperamento';
import { MapaPersonas } from '@/components/personas/comun';
import { textoConQuien } from '@/components/personas/EligeQuien';
import { color, fontFamily, radius, space, type } from '@/theme';
import type { FinJuego } from './Juegos';
import { Bloque, Chip, Continuar, DORADO_SUAVE, NOMBRES, Opcion, Opciones, Pantalla, TEMP_COLORS, nota, parrafo, titular } from './ui';

function Cifra({ n, texto }: { n: number; texto: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: fontFamily.slab700, fontSize: 32, lineHeight: 36, color: color.azulProfundo }}>{n}</Text>
      <Text style={[nota, { textAlign: 'center' }]}>{texto}</Text>
    </View>
  );
}

// ───────────── Día 7 ─────────────

export function Cierre7({ camino, personas, onFin }: { camino: EstadoCamino; personas: EstadoPersonas; onFin: FinJuego }) {
  const temp = useTemperamento();
  const content = useContent();
  const [encajan, setEncajan] = useState<string | null>(null);
  const { porDia, perfil } = camino;

  // Las palabras del examen, agrupadas por color de temperamento (el temperamento no se nombra).
  const palabras = [1, 2, 3, 4, 5, 6].map((d) => porDia[d]?.examen?.palabra).filter((p): p is string => !!p);
  const grupos = (['COL', 'MEL', 'SAN', 'FLE'] as Temp[]).map((k) => [k, palabras.filter((p) => PALABRA_TEMPERAMENTO[p] === k)] as const).filter(([, ps]) => ps.length);
  const semanaTuya = temp?.primario ? SEMANA_DEL_TEMPERAMENTO[temp.primario] : null;
  const curso1 = content.courses.find((c) => c.numero === 1);

  return (
    <Pantalla etiqueta="Día 7 · Cierre de la semana" pie={<Continuar label="Cerrar la semana" disabled={!encajan} onPress={() => onFin({ encajan, palabras })} />}>
      <Text style={titular}>Tu primera semana</Text>

      <Bloque titulo={CIERRE_7.reacciones}>
        {grupos.length === 0 ? (
          <Text style={parrafo}>Esta semana no has anotado reacciones en el examen de la noche.</Text>
        ) : (
          grupos.map(([k, ps]) => (
            <View key={k} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {ps.map((p, j) => (
                <Chip key={`${p}${j}`} color={TEMP_COLORS[k]} texto={p} />
              ))}
            </View>
          ))
        )}
      </Bloque>

      <Bloque titulo={CIERRE_7.encajan}>
        <Opciones columnas={3}>
          {CIERRE_7.encajanOpciones.map(([v, texto]) => (
            <Opcion key={v} compacta activa={encajan === v} onPress={() => setEncajan(v)}>
              {texto}
            </Opcion>
          ))}
        </Opciones>
        {encajan === 'no' ? <Text style={parrafo}>{CIERRE_7.encajanNo}</Text> : null}
      </Bloque>

      <Bloque titulo="El mapa de tu camino">
        {Array.from({ length: 10 }, (_, s) => {
          const tuya = s === semanaTuya;
          const tituloLeccion = curso1?.lecciones.find((l) => l.id === `1.${s}`)?.titulo;
          return (
            <View
              key={s}
              style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'baseline',
                paddingVertical: 7,
                paddingHorizontal: 10,
                borderRadius: radius.m,
                backgroundColor: tuya ? DORADO_SUAVE : s <= 1 ? color.niebla : 'transparent',
                borderWidth: 1,
                borderColor: tuya ? color.doradoVirtud : 'transparent',
              }}>
              <Text style={[nota, { fontFamily: fontFamily.sans700, color: s === 0 ? color.azulProfundo : color.plomo, minWidth: 74 }]}>
                Semana {s}
                {s === 0 ? ' ✓' : ''}
              </Text>
              <Text style={[parrafo, { flex: 1, fontSize: 14, lineHeight: 20 }]}>
                {tuya ? (
                  <Text style={{ fontFamily: fontFamily.sans700 }}>Tu lección{temp?.primario ? `: ${NOMBRES[temp.primario].toLowerCase()}` : ''}</Text>
                ) : (
                  tituloLeccion ?? ''
                )}
              </Text>
            </View>
          );
        })}
      </Bloque>

      <Bloque titulo="Sobre sellado">
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14, borderRadius: radius.l, backgroundColor: color.azulProfundo }}>
          <Text style={{ fontSize: 28 }}>✉️</Text>
          <Text style={{ flex: 1, fontFamily: fontFamily.slab500, fontSize: 18, lineHeight: 25, color: color.blanco }}>{CIERRE_7.sobre}</Text>
        </View>
      </Bloque>

      <Bloque titulo="Tus personas">
        <Text style={parrafo}>
          Llevas {personas.lista.length} {personas.lista.length === 1 ? 'ficha' : 'fichas'}. {CIERRE_7.personas}
        </Text>
      </Bloque>

      {perfil ? (
        <Bloque titulo="Próximo paso">
          <Text style={parrafo}>{CIERRE_7.avance(fechaCorta(fechaDelDia(perfil.inicio, 8)))}</Text>
        </Bloque>
      ) : null}
    </Pantalla>
  );
}

// ───────────── Día 14 ─────────────

export function Cierre14({ camino, personas, onFin }: { camino: EstadoCamino; personas: EstadoPersonas; onFin: FinJuego }) {
  const { porDia, perfil, lineaBase, racha } = camino;
  const [espejo, setEspejo] = useState<string | null>(null);
  const [enQue, setEnQue] = useState('');
  const [lectura, setLectura] = useState<Record<string, 'T' | 'C'>>({}); // fallo | me_ven | me_gustaria
  const semana = resumenSemana1(porDia);

  const grupos: Record<string, number> = {};
  for (const d of [8, 9, 10, 11, 12, 13]) {
    const q = porDia[d]?.examen?.con_quien ?? porDia[d]?.con_quien;
    if (q && q !== 'solo') grupos[q] = (grupos[q] ?? 0) + 1;
  }
  const respuestasBase = lineaBase
    ? (
        [
          ['fallo', PUNTO_PARTIDA.fallo.pregunta, PUNTO_PARTIDA.fallo.opciones.find(([v]) => v === lineaBase.fallo)?.[1]],
          ['me_ven', PUNTO_PARTIDA.me_ven.pregunta, lineaBase.me_ven?.join(', ')],
          ['me_gustaria', PUNTO_PARTIDA.me_gustaria.pregunta, lineaBase.me_gustaria?.join(', ')],
        ] as [string, string, string | undefined][]
      ).filter(([, , r]) => r)
    : [];

  return (
    <Pantalla
      etiqueta="Día 14 · Cierre: primer espejo"
      pie={<Continuar label="Cerrar la semana" disabled={!espejo} onPress={() => onFin({ espejo, en_que: enQue.trim() || null, lectura, semana })} />}>
      <Text style={titular}>Tu primer espejo</Text>

      <Bloque titulo={CIERRE_14.espejo}>
        <Opciones columnas={2}>
          {[
            ['si', 'Sí'],
            ['no', 'No'],
          ].map(([v, texto]) => (
            <Opcion key={v} compacta activa={espejo === v} onPress={() => setEspejo(v)}>
              {texto}
            </Opcion>
          ))}
        </Opciones>
        {espejo === 'si' ? <Field label={CIERRE_14.espejoEnQue} hint="(opcional)" value={enQue} maxLength={280} multiline onChangeText={setEnQue} /> : null}
      </Bloque>

      <Bloque titulo="Tu semana">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Cifra n={semana.contado} texto="se lo contaste" />
          <Cifra n={semana.reconocieron} texto="te reconocieron" />
          <Cifra n={semana.retos} texto="retos hechos" />
          <Cifra n={racha} texto={racha === 1 ? 'día de racha' : 'días de racha'} />
        </View>
      </Bloque>

      <Bloque titulo="Con quién has hecho el reto">
        {Object.keys(grupos).length === 0 ? (
          <Text style={parrafo}>Esta semana no has anotado con quién hiciste el reto.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(grupos).map(([g, n]) => {
              const primario = personas.porId[idDeClave(g) ?? '']?.primario;
              return <Chip key={g} color={primario ? TEMP_COLORS[primario] : color.azulProfundo} texto={`${textoConQuien(g, personas.porId)} · ${n}`} />;
            })}
          </View>
        )}
      </Bloque>

      <Bloque titulo="El mapa de mis personas">
        {personas.lista.length ? (
          <MapaPersonas personas={personas.lista} />
        ) : (
          <Text style={parrafo}>Aún no tienes fichas. Crea la de alguien cercano desde «Mis personas», en tu camino.</Text>
        )}
      </Bloque>

      {respuestasBase.length > 0 ? (
        <Bloque titulo={`Tu punto de partida · ${CIERRE_14.lineaBase}`}>
          {respuestasBase.map(([clave, pregunta, respuesta]) => (
            <View key={clave} style={{ gap: space.xs }}>
              <Text style={nota}>{pregunta}</Text>
              <Text style={{ fontFamily: fontFamily.slab500, fontSize: 18, lineHeight: 25, color: color.pizarra }}>{respuesta}</Text>
              <Opciones columnas={2}>
                {(
                  [
                    ['T', 'Temperamento'],
                    ['C', 'Carácter'],
                  ] as const
                ).map(([v, texto]) => (
                  <Opcion key={v} compacta activa={lectura[clave] === v} onPress={() => setLectura((l) => ({ ...l, [clave]: v }))}>
                    {texto}
                  </Opcion>
                ))}
              </Opciones>
            </View>
          ))}
          {lineaBase?.linea ? <Text style={[type.cita, { color: color.plomo }]}>Tu línea: «{lineaBase.linea}»</Text> : null}
        </Bloque>
      ) : null}

      {perfil ? (
        <Bloque titulo="Próximo paso">
          <Text style={parrafo}>{CIERRE_14.avance(fechaCorta(fechaDelDia(perfil.inicio, 15)))}</Text>
        </Bloque>
      ) : null}
    </Pantalla>
  );
}
