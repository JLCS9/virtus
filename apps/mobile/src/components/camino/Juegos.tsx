/**
 * Juegos del Camino: desliza (días 3 y 10), elige tu reacción (días 4 y 11) y arrastra (día 13).
 * Con gestos de verdad: la tarjeta se arrastra con el dedo hacia su destino; también se puede tocar
 * el destino.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';

import {
  CIERRE_11,
  DESLIZA_2,
  DESLIZA_4,
  ESCENAS_11,
  ESCENAS_3,
  RASGOS_13,
  TEXTO_13,
  textoElige3,
  type Temp,
} from '@/lib/camino';
import { useTemperamento } from '@/features/temperamento';
import { color, fontFamily, radius, space, type } from '@/theme';
import {
  Continuar,
  DORADO_SUAVE,
  NOMBRES,
  Opcion,
  Opciones,
  Pantalla,
  Puntos,
  ROJO,
  TEMP_COLORS,
  VERDE,
  nota,
  parrafo,
  titular,
} from './ui';

export type FinJuego = (juego: Record<string, unknown>) => void;

const TEMPS: Temp[] = ['COL', 'MEL', 'SAN', 'FLE'];

/** Orden fijo pero distinto en cada escena, para que la reacción no esté siempre en el mismo sitio. */
const barajar = <T,>(lista: T[], semilla: number) =>
  lista.map((x, i) => [x, (i * 7 + semilla * 5) % 11] as const).sort((a, b) => a[1] - b[1]).map(([x]) => x);

// ───────────── Tarjeta que se arrastra ─────────────

type Pos = ['izq' | 'der'] | ['izq' | 'der', 'arr' | 'aba'];
export interface Destino {
  clave: string;
  etiqueta: string;
  color: string;
  pos: Pos;
}

function destinoPorGesto(dx: number, dy: number, destinos: Destino[]) {
  if (Math.hypot(dx, dy) < 70) return null;
  const h = dx < 0 ? 'izq' : 'der';
  const v = dy < 0 ? 'arr' : 'aba';
  return destinos.find((d) => d.pos[0] === h && (d.pos.length === 1 || d.pos[1] === v))?.clave ?? null;
}

/** La tarjeta sigue al dedo; al soltarla lejos del centro, va al destino de esa dirección. */
function Tarjeta({
  texto,
  destinos,
  bloqueada,
  borde,
  onSoltar,
  onApuntar,
}: {
  texto: string;
  destinos: Destino[];
  bloqueada: boolean;
  borde: string;
  onSoltar: (clave: string) => void;
  onApuntar: (clave: string | null) => void;
}) {
  const [pan] = useState(() => new Animated.ValueXY());
  const actual = useRef({ destinos, bloqueada, onSoltar, onApuntar });
  useEffect(() => {
    actual.current = { destinos, bloqueada, onSoltar, onApuntar };
  });
  // El PanResponder se crea una vez (su estado del gesto no puede perderse a mitad del arrastre) y lee
  // los props al día desde `actual` solo dentro de sus manejadores, nunca durante el render.
  // eslint-disable-next-line react-hooks/refs
  const [gestos] = useState(() => {
    const volver = () => Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !actual.current.bloqueada,
      onMoveShouldSetPanResponderCapture: (_, g) => !actual.current.bloqueada && Math.hypot(g.dx, g.dy) > 6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        pan.setValue({ x: g.dx, y: g.dy });
        actual.current.onApuntar(destinoPorGesto(g.dx, g.dy, actual.current.destinos));
      },
      onPanResponderRelease: (_, g) => {
        const clave = destinoPorGesto(g.dx, g.dy, actual.current.destinos);
        actual.current.onApuntar(null);
        volver();
        if (clave) actual.current.onSoltar(clave);
      },
      onPanResponderTerminate: () => {
        actual.current.onApuntar(null);
        volver();
      },
    });
  });
  return (
    <Animated.View
      {...gestos.panHandlers}
      accessibilityHint="Arrástrala hacia su destino o toca uno de los botones"
      style={{
        backgroundColor: color.blanco,
        borderWidth: 1,
        borderColor: borde,
        borderRadius: 18,
        paddingVertical: 28,
        paddingHorizontal: 20,
        minHeight: 150,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: color.azulProfundo,
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
        zIndex: 2,
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { rotate: pan.x.interpolate({ inputRange: [-300, 300], outputRange: ['-16deg', '16deg'] }) },
        ],
      }}>
      <Text style={{ fontFamily: fontFamily.slab500, fontSize: 21, lineHeight: 28, color: color.pizarra, textAlign: 'center' }}>{texto}</Text>
    </Animated.View>
  );
}

function BotonDestino({ d, apuntado, apagado, disabled, onPress }: { d: Destino; apuntado: boolean; apagado: boolean; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        minHeight: 48,
        justifyContent: 'center',
        backgroundColor: d.color,
        borderRadius: radius.l,
        paddingVertical: 12,
        paddingHorizontal: 8,
        opacity: apagado ? 0.35 : 1,
        borderWidth: 3,
        borderColor: apuntado ? color.doradoClaro : 'transparent',
        transform: [{ scale: apuntado ? 1.04 : 1 }],
      }}>
      <Text style={{ fontFamily: fontFamily.sans700, fontSize: 13.5, color: color.blanco, textAlign: 'center' }}>{d.etiqueta}</Text>
    </Pressable>
  );
}

// ───────────── Desliza ─────────────

function Desliza({
  etiqueta,
  tarjetas,
  destinos,
  onFin,
}: {
  etiqueta: string;
  tarjetas: [string, string, string][];
  destinos: Destino[];
  onFin: FinJuego;
}) {
  const [i, setI] = useState(0);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [apuntado, setApuntado] = useState<string | null>(null);
  const respondida = respuestas.length > i;
  const aciertos = respuestas.filter((r, k) => r === tarjetas[k][1]).length;

  if (i >= tarjetas.length) {
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar onPress={() => onFin({ respuestas, aciertos })} />}>
        <Text style={[titular, { fontSize: 28, lineHeight: 36 }]}>
          Has acertado {aciertos} de {tarjetas.length}.
        </Text>
      </Pantalla>
    );
  }

  const [texto, correcta, explicacion] = tarjetas[i];
  const elegida = respuestas[i];
  const responder = (clave: string) => {
    if (!respondida) setRespuestas((r) => [...r, clave]);
  };
  const destinoDe = (clave: string) => destinos.find((d) => d.clave === clave)!;
  const boton = (d: Destino) => (
    <BotonDestino
      key={d.clave}
      d={d}
      apuntado={apuntado === d.clave}
      apagado={respondida && elegida !== d.clave && correcta !== d.clave}
      disabled={respondida}
      onPress={() => responder(d.clave)}
    />
  );
  // Cada fila, izquierda primero: la misma posición que el gesto.
  const fila = (pos: 'arr' | 'aba') => destinos.filter((d) => d.pos[1] === pos).sort((a, b) => (a.pos[0] === 'izq' ? -1 : 1) - (b.pos[0] === 'izq' ? -1 : 1));
  const cuatro = destinos.length === 4;
  const tarjeta = (
    <Tarjeta
      key={i}
      texto={texto}
      destinos={destinos}
      bloqueada={respondida}
      borde={respondida ? (elegida === correcta ? VERDE : ROJO) : color.bruma}
      onSoltar={responder}
      onApuntar={setApuntado}
    />
  );

  return (
    <Pantalla
      etiqueta={etiqueta}
      pie={respondida ? <Continuar label={i + 1 < tarjetas.length ? 'Siguiente' : 'Ver resultado'} onPress={() => setI((n) => n + 1)} /> : undefined}>
      <Puntos total={tarjetas.length} actual={i} />
      <Text style={nota}>
        {cuatro ? 'Desliza la tarjeta hacia su temperamento, o toca el color.' : 'Desliza a la izquierda o a la derecha, o toca un lado.'}
      </Text>
      {cuatro ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>{fila('arr').map(boton)}</View>
          {tarjeta}
          <View style={{ flexDirection: 'row', gap: 10 }}>{fila('aba').map(boton)}</View>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {tarjeta}
          <View style={{ flexDirection: 'row', gap: 10 }}>{destinos.map(boton)}</View>
        </View>
      )}
      {respondida ? (
        <View style={{ gap: space.xs }}>
          <Text style={[type.bodyStrong, { color: elegida === correcta ? VERDE : ROJO }]}>
            {elegida === correcta ? '¡Bien!' : `Era: ${destinoDe(correcta).etiqueta.toLowerCase()}.`}
          </Text>
          <Text style={parrafo}>{explicacion}.</Text>
        </View>
      ) : null}
    </Pantalla>
  );
}

// Posición de los destinos. Cuatro esquinas: las de la rueda (colérico arriba a la derecha…).
const ESQUINAS: Record<Temp, Pos> = { SAN: ['izq', 'arr'], COL: ['der', 'arr'], FLE: ['izq', 'aba'], MEL: ['der', 'aba'] };

export function DeslizaTemperamentos({ dia, onFin }: { dia: number; onFin: FinJuego }) {
  const destinos = TEMPS.map((k) => ({ clave: k, etiqueta: NOMBRES[k], color: TEMP_COLORS[k], pos: ESQUINAS[k] }));
  return <Desliza etiqueta={`Día ${dia} · Los cuatro temperamentos`} tarjetas={DESLIZA_4} destinos={destinos} onFin={onFin} />;
}

export function DeslizaTemperamentoCaracter({ dia, onFin }: { dia: number; onFin: FinJuego }) {
  const destinos: Destino[] = [
    { clave: 'T', etiqueta: '← Temperamento', color: color.plomo, pos: ['izq'] },
    { clave: 'C', etiqueta: 'Carácter →', color: color.azulProfundo, pos: ['der'] },
  ];
  return <Desliza etiqueta={`Día ${dia} · ¿Temperamento o carácter?`} tarjetas={DESLIZA_2} destinos={destinos} onFin={onFin} />;
}

// ───────────── Elige tu reacción (día 4) ─────────────

export function EligeReaccion({ dia, onFin }: { dia: number; onFin: FinJuego }) {
  const temp = useTemperamento();
  const [i, setI] = useState(0);
  const [elecciones, setElecciones] = useState<Temp[]>([]);
  const etiqueta = `Día ${dia} · Elige tu reacción`;

  if (i < ESCENAS_3.length) {
    const [escena, opciones] = ESCENAS_3[i];
    return (
      <Pantalla etiqueta={etiqueta}>
        <Puntos total={ESCENAS_3.length} actual={i} />
        <Text style={titular}>{escena}</Text>
        <Text style={nota}>¿Qué te sale primero?</Text>
        <Opciones>
          {barajar(TEMPS, i).map((k) => (
            <Opcion
              key={k}
              onPress={() => {
                setElecciones((e) => [...e.slice(0, i), k]);
                setTimeout(() => setI(i + 1), 160);
              }}>
              {opciones[k]}
            </Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }

  if (temp === undefined) return <Pantalla etiqueta={etiqueta}><Text style={parrafo}>Un momento…</Text></Pantalla>;
  const primario = temp?.primario;
  const coincidencias = primario ? elecciones.filter((k) => k === primario).length : null;
  return (
    <Pantalla etiqueta={etiqueta} pie={<Continuar onPress={() => onFin({ elecciones, coincidencias })} />}>
      <Text style={titular}>Lo que había detrás de cada reacción</Text>
      {ESCENAS_3.map(([escena, opciones], k) => (
        <View key={escena} style={{ flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.bruma }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: TEMP_COLORS[elecciones[k]], marginTop: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={nota}>{escena}</Text>
            <Text style={parrafo}>{opciones[elecciones[k]]}</Text>
            <Text style={[type.caption, { fontFamily: fontFamily.sans700, color: TEMP_COLORS[elecciones[k]] }]}>{NOMBRES[elecciones[k]]}</Text>
          </View>
        </View>
      ))}
      {primario ? (
        <View style={{ borderLeftWidth: 3, borderLeftColor: color.doradoVirtud, paddingLeft: 14 }}>
          <Text style={[titular, { fontFamily: fontFamily.slab500, fontSize: 20, lineHeight: 28 }]}>
            {textoElige3(coincidencias ?? 0, NOMBRES[primario].toLowerCase())}
          </Text>
        </View>
      ) : null}
    </Pantalla>
  );
}

// ───────────── Elige tu reacción: temperamento frente a carácter (día 11) ─────────────

export function EligeVirtud({ dia, momentos, onFin }: { dia: number; momentos?: string[]; onFin: FinJuego }) {
  const [i, setI] = useState(0);
  const [fase, setFase] = useState<'sale' | 'virtud'>('sale');
  const [sale, setSale] = useState<Temp[]>([]);
  const [virtud, setVirtud] = useState<boolean[]>([]);
  const etiqueta = `Día ${dia} · Temperamento frente a carácter`;

  if (i >= ESCENAS_11.length) {
    const aciertos = virtud.filter(Boolean).length;
    return (
      <Pantalla etiqueta={etiqueta} pie={<Continuar onPress={() => onFin({ sale, aciertos })} />}>
        <Text style={[titular, { fontSize: 25, lineHeight: 34 }]}>{CIERRE_11}</Text>
      </Pantalla>
    );
  }

  const e = ESCENAS_11[i];
  const escena = e.escena(momentos);
  if (fase === 'sale') {
    return (
      <Pantalla etiqueta={etiqueta}>
        <Puntos total={ESCENAS_11.length * 2} actual={i * 2} />
        <Text style={titular}>{escena}</Text>
        <Text style={nota}>¿Qué te sale?</Text>
        <Opciones>
          {barajar(TEMPS, i + 3).map((k) => (
            <Opcion
              key={k}
              onPress={() => {
                setSale((s) => [...s.slice(0, i), k]);
                setTimeout(() => setFase('virtud'), 160);
              }}>
              {e.sale[k]}
            </Opcion>
          ))}
        </Opciones>
      </Pantalla>
    );
  }

  const respondida = virtud.length > i;
  const opciones = barajar([e.virtud, ...e.distractores], i);
  const acierto = respondida && virtud[i];
  return (
    <Pantalla
      etiqueta={etiqueta}
      pie={
        respondida ? (
          <Continuar
            label={i + 1 < ESCENAS_11.length ? 'Siguiente escena' : 'Terminar'}
            onPress={() => {
              setI((n) => n + 1);
              setFase('sale');
            }}
          />
        ) : undefined
      }>
      <Puntos total={ESCENAS_11.length * 2} actual={i * 2 + 1} />
      <Text style={titular}>{escena}</Text>
      <Text style={nota}>¿Y qué respondería la virtud?</Text>
      <Opciones>
        {opciones.map((o) => (
          <Opcion key={o} disabled={respondida} activa={respondida && o === e.virtud} onPress={() => setVirtud((v) => [...v, o === e.virtud])}>
            {o}
          </Opcion>
        ))}
      </Opciones>
      {respondida ? (
        <View style={{ gap: space.xs }}>
          <Text style={[type.bodyStrong, { color: acierto ? VERDE : ROJO }]}>{acierto ? '¡Bien!' : 'La virtud respondería lo que está marcado.'}</Text>
          <Text style={parrafo}>
            Virtud: <Text style={{ fontFamily: fontFamily.sans700 }}>{e.nombre}</Text>.
          </Text>
        </View>
      ) : null}
    </Pantalla>
  );
}

// ───────────── Arrastra: no lo elegí / lo he construido (día 13) ─────────────

type Sitio = 'no_elegi' | 'construido';
const SITIOS: Destino[] = [
  { clave: 'no_elegi', etiqueta: '← No lo elegí', color: color.plomo, pos: ['izq'] },
  { clave: 'construido', etiqueta: 'Lo he construido →', color: color.azulProfundo, pos: ['der'] },
];

export function Arrastra({ dia, onFin }: { dia: number; onFin: FinJuego }) {
  const temp = useTemperamento();
  const [i, setI] = useState(0); // rasgo que se está colocando
  const [sitio, setSitio] = useState<Record<string, Sitio>>({});
  const [apuntado, setApuntado] = useState<string | null>(null);
  const [visto, setVisto] = useState(false);
  const etiqueta = `Día ${dia} · No lo elegí / lo he construido`;
  const lista = (v: Sitio) => RASGOS_13.filter(([r]) => sitio[r] === v).map(([r]) => r);

  if (visto || i >= RASGOS_13.length) {
    if (temp === undefined) return <Pantalla etiqueta={etiqueta}><Text style={parrafo}>Un momento…</Text></Pantalla>;
    const primario = temp?.primario;
    const construidos = RASGOS_13.filter(([r]) => sitio[r] === 'construido');
    const destacados = construidos.filter(([, , cuesta]) => !!primario && cuesta.includes(primario)).map(([r]) => r);
    return (
      <Pantalla
        etiqueta={etiqueta}
        pie={<Continuar onPress={() => onFin({ no_elegi: lista('no_elegi'), construido: lista('construido'), destacados })} />}>
        <Text style={titular}>Lo has construido</Text>
        {construidos.length === 0 ? <Text style={parrafo}>No has puesto ningún rasgo en «Lo he construido».</Text> : null}
        {construidos.map(([r]) => {
          const destacado = destacados.includes(r);
          return (
            <View
              key={r}
              style={{
                padding: 14,
                borderRadius: radius.l,
                backgroundColor: destacado ? DORADO_SUAVE : 'transparent',
                borderWidth: 1,
                borderColor: destacado ? color.doradoVirtud : color.bruma,
                gap: 4,
              }}>
              <Text style={[type.body, { fontFamily: destacado ? fontFamily.sans700 : fontFamily.sans500, color: color.pizarra }]}>{r}</Text>
              {destacado ? <Text style={[type.cita, { color: color.azulProfundo }]}>{TEXTO_13}</Text> : null}
            </View>
          );
        })}
      </Pantalla>
    );
  }

  const [rasgo] = RASGOS_13[i];
  const poner = (v: string | null) => {
    if (v) setSitio((s) => ({ ...s, [rasgo]: v as Sitio }));
    setI(i + 1);
  };
  const quitar = (r: string) =>
    setSitio((s) => {
      const n = { ...s };
      delete n[r];
      return n;
    });
  const columna = (v: Sitio, texto: string) => (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={[type.eyebrow, { color: color.plomo }]}>{texto}</Text>
      {lista(v).map((r) => (
        <Pressable
          key={r}
          accessibilityRole="button"
          accessibilityHint="Toca para quitarlo"
          onPress={() => quitar(r)}
          style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: v === 'construido' ? color.azulProfundo : color.niebla }}>
          <Text style={[type.caption, { color: v === 'construido' ? color.blanco : color.pizarra }]}>{r}</Text>
        </Pressable>
      ))}
    </View>
  );
  return (
    <Pantalla
      etiqueta={etiqueta}
      pie={<Continuar label="Ver lo que has construido" disabled={!Object.keys(sitio).length} onPress={() => setVisto(true)} />}>
      <Puntos total={RASGOS_13.length} actual={i} />
      <Text style={parrafo}>Arrastra cada rasgo a su sitio. Si no te describe, déjalo fuera. No hay respuesta correcta.</Text>
      <Tarjeta key={rasgo} texto={rasgo} destinos={SITIOS} bloqueada={false} borde={color.bruma} onSoltar={poner} onApuntar={setApuntado} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {SITIOS.map((d) => (
          <BotonDestino key={d.clave} d={d} apuntado={apuntado === d.clave} apagado={false} disabled={false} onPress={() => poner(d.clave)} />
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={() => poner(null)} style={{ alignSelf: 'center', padding: space.s }}>
        <Text style={[type.body, { color: color.plomo, textDecorationLine: 'underline' }]}>No me describe</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: space.m }}>
        {columna('no_elegi', 'No lo elegí')}
        {columna('construido', 'Lo he construido')}
      </View>
    </Pantalla>
  );
}
