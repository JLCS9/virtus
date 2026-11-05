// Gráfica de las seis virtudes: radar + barras (src/app/Radar.jsx de la web) con react-native-svg.
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText, TSpan } from 'react-native-svg';

import { GOLD_DEEP, INK, LINE, MUTED, fuente } from '../tema';
import { VIRTUDES, etapa, geometriaRadar } from '../web/lib/virtudes.js';

const TAMANO = 400;
type Valores = Record<string, number>;

export function VirtudesRadar({ valores }: { valores: Valores }) {
  const g = geometriaRadar(valores, { tamano: TAMANO, margen: 94 });
  const pts = (lista: number[][]) => lista.map((p) => p.join(',')).join(' ');
  const resumen = VIRTUDES.map((v: { nombre: string; clave: string }) => `${v.nombre} ${Math.round(valores[v.clave])} %`).join(', ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`Gráfica de tus virtudes: ${resumen}`} style={{ width: '100%', maxWidth: 400, aspectRatio: 1, alignSelf: 'center' }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${TAMANO} ${TAMANO}`}>
        {g.anillos.map((anillo: number[][], i: number) => (
          <Polygon key={i} points={pts(anillo)} fill="none" stroke={LINE} strokeWidth={i === 3 ? 1.4 : 1} />
        ))}
        {g.ejes.map((e: { clave: string; fin: number[] }) => (
          <Line key={e.clave} x1={g.centro} y1={g.centro} x2={e.fin[0]} y2={e.fin[1]} stroke={LINE} strokeWidth={1} />
        ))}
        <Polygon points={pts(g.poligono)} fill="rgba(197,165,90,0.30)" stroke={GOLD_DEEP} strokeWidth={2.2} strokeLinejoin="round" />
        {g.poligono.map(([x, y]: number[], i: number) => (
          <Circle key={i} cx={x} cy={y} r={4.2} fill={GOLD_DEEP} stroke="#FBF8F1" strokeWidth={1.5} />
        ))}
        {g.ejes.map((e: { clave: string; etiqueta: number[] }, i: number) => {
          const [x, y] = e.etiqueta;
          const ancla = x < g.centro - 8 ? 'end' : x > g.centro + 8 ? 'start' : 'middle';
          const v = VIRTUDES[i];
          return (
            <SvgText key={e.clave} x={x} y={y} textAnchor={ancla} fontFamily="Roboto_400Regular" fill={INK}>
              <TSpan x={x} dy={-3} fontSize={13} fontFamily="Roboto_700Bold">
                {v.corta}
              </TSpan>
              <TSpan x={x} dy={17} fontSize={12} fill={MUTED}>
                {`${Math.round(valores[v.clave])} %`}
              </TSpan>
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

export function VirtudesBarras({ valores }: { valores: Valores }) {
  return (
    <View style={{ gap: 14 }}>
      {VIRTUDES.map((v: { clave: string; nombre: string; color: string }) => {
        const valor = Math.round(valores[v.clave]);
        const e = etapa(valor);
        return (
          <View key={v.clave}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <Text style={{ ...fuente.body(600), fontSize: 14, color: INK }}>{v.nombre}</Text>
              <Text style={{ ...fuente.body(400), fontSize: 13, color: MUTED }}>
                {e.texto} · {valor} %
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: 'rgba(27,42,74,0.09)', overflow: 'hidden' }}>
              <View style={{ width: `${valor}%`, height: '100%', backgroundColor: v.color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
