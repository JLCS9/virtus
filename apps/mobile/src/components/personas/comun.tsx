/**
 * Piezas comunes de las fichas de personas: avatar, etiqueta de estado, contenido de la ficha según
 * el temperamento y el mapa de mis personas.
 */
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import type { Temp } from '@/lib/camino';
import { FICHA, TEXTO_CONFIANZA, combinacion, type Persona } from '@/lib/personas';
import { Bloque, NOMBRES, TEMP_COLORS, nota, parrafo } from '@/components/camino/ui';
import { color, fontFamily, space, type } from '@/theme';

export function Avatar({ persona, tam = 44 }: { persona: Pick<Persona, 'primario' | 'avatar' | 'nombre'>; tam?: number }) {
  const borde = persona.primario ? TEMP_COLORS[persona.primario] : color.piedra;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: tam, height: tam, borderRadius: tam / 2, borderWidth: 3, borderColor: borde, backgroundColor: color.blanco, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fontFamily.sans700, color: color.azulProfundo, fontSize: persona.avatar ? tam * 0.45 : tam * 0.38 }}>
        {persona.avatar || persona.nombre.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export function EtiquetaEstado({ persona }: { persona: Pick<Persona, 'primario' | 'estado' | 'confianza'> }) {
  if (!persona.primario) return <Text style={nota}>Sin estimar</Text>;
  return (
    <Text style={nota}>
      <Text style={{ fontFamily: fontFamily.sans700, color: TEMP_COLORS[persona.primario] }}>{NOMBRES[persona.primario]}</Text>
      {' · '}
      {persona.estado === 'confirmado' ? 'Confirmado' : `Estimado${persona.confianza ? ` (${TEXTO_CONFIANZA[persona.confianza].toLowerCase()})` : ''}`}
    </Text>
  );
}

/** Lema, lo que le sale fácil, lo que le cuesta, cómo tratarle, su virtud-desafío y «Tú y X». */
export function FichaContenido({ persona, miPrimario }: { persona: { nombre: string; primario: Temp | null }; miPrimario?: Temp | null }) {
  if (!persona.primario) return null;
  const f = FICHA[persona.primario];
  const combo = combinacion(miPrimario, persona.primario);
  const titulo = { fontFamily: fontFamily.slab700, fontSize: 19, lineHeight: 26, color: color.azulProfundo };
  return (
    <View style={{ gap: space.m }}>
      <Bloque titulo="Lema">
        <Text style={[titulo, { fontFamily: fontFamily.slab500, fontSize: 21 }]}>{f.lema.charAt(0).toUpperCase() + f.lema.slice(1)}</Text>
      </Bloque>
      <Bloque titulo="Le sale fácil">
        <Text style={parrafo}>{f.facil}</Text>
      </Bloque>
      <Bloque titulo="Le cuesta">
        <Text style={parrafo}>{f.cuesta}</Text>
      </Bloque>
      <Bloque titulo="Cómo tratarle">
        {f.tratar.map((t) => (
          <Text key={t} style={parrafo}>
            • {t}
          </Text>
        ))}
      </Bloque>
      <Bloque titulo="Su virtud-desafío">
        <Text style={titulo}>{f.virtud}</Text>
      </Bloque>
      {combo && miPrimario ? (
        <Bloque titulo={`Tú y ${persona.nombre}`}>
          <Text style={nota}>
            {NOMBRES[miPrimario]} y {NOMBRES[persona.primario].toLowerCase()}
          </Text>
          <View style={{ borderLeftWidth: 3, borderLeftColor: color.doradoVirtud, paddingLeft: 12 }}>
            <Text style={parrafo}>{combo}</Text>
          </View>
        </Bloque>
      ) : null}
    </View>
  );
}

const ETIQUETA_MAPA: Record<string, string> = { familia: 'FAMILIA', amigos: 'AMIGOS', trabajo: 'TRABAJO', comunidad: 'COMUNIDAD' };

/** Mapa de mis personas: tú en el centro y tus fichas alrededor, por grupos, del color de su temperamento. */
export function MapaPersonas({ personas, nombreTu = 'Tú' }: { personas: Persona[]; nombreTu?: string }) {
  const T = 300;
  const C = T / 2;
  const grupos = ['familia', 'amigos', 'trabajo', 'comunidad'].filter((g) => personas.some((p) => p.grupo === g));
  if (!personas.length) return null;
  // Cada grupo ocupa un sector; las personas se reparten dentro de su sector.
  const sector = (2 * Math.PI) / grupos.length;
  const puntos: { p: Persona; x: number; y: number }[] = [];
  grupos.forEach((g, gi) => {
    const delGrupo = personas.filter((p) => p.grupo === g);
    delGrupo.forEach((p, i) => {
      const ang = -Math.PI / 2 + gi * sector + ((i + 1) / (delGrupo.length + 1)) * sector;
      const r = delGrupo.length > 3 && i % 2 ? 80 : 100;
      puntos.push({ p, x: C + r * Math.cos(ang), y: C + r * Math.sin(ang) });
    });
  });
  // Con un solo grupo no hace falta etiqueta (y caería sobre el nombre de la persona).
  const etiquetas =
    grupos.length < 2
      ? []
      : grupos.map((g, gi) => {
          const ang = -Math.PI / 2 + (gi + 0.5) * sector;
          const cos = Math.cos(ang);
          const ancla: 'middle' | 'start' | 'end' = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end';
          return { g, x: C + 132 * cos, y: C + 132 * Math.sin(ang), ancla };
        });
  return (
    <View accessible accessibilityLabel={`Mapa de tus personas: ${personas.map((p) => p.nombre).join(', ')}`} style={{ width: '100%', maxWidth: 420, alignSelf: 'center', aspectRatio: (T + 152) / (T + 32) }}>
      <Svg viewBox={`-76 -16 ${T + 152} ${T + 32}`} width="100%" height="100%">
        {grupos.length > 1
          ? grupos.map((g, gi) => {
              const ang = -Math.PI / 2 + gi * sector;
              return <Line key={g} x1={C} y1={C} x2={C + 125 * Math.cos(ang)} y2={C + 125 * Math.sin(ang)} stroke={color.bruma} strokeDasharray="3 4" />;
            })
          : null}
        {puntos.map(({ p, x, y }) => (
          <Line key={`l${p.id}`} x1={C} y1={C} x2={x} y2={y} stroke="rgba(26,48,79,0.12)" />
        ))}
        <Circle cx={C} cy={C} r={26} fill={color.azulProfundo} />
        <SvgText x={C} y={C + 4} textAnchor="middle" fontFamily={fontFamily.sans700} fontSize={11} fontWeight="700" fill={color.blanco}>
          {nombreTu}
        </SvgText>
        {puntos.map(({ p, x, y }) => (
          <G key={p.id}>
            <Circle cx={x} cy={y} r={17} fill={p.primario ? TEMP_COLORS[p.primario] : '#B9B3A5'} stroke={color.blanco} strokeWidth={2} />
            <SvgText x={x} y={y + 4} textAnchor="middle" fontFamily={fontFamily.sans700} fontSize={12} fontWeight="700" fill={color.blanco}>
              {p.nombre.trim().charAt(0).toUpperCase()}
            </SvgText>
            <SvgText x={x} y={y + 30} textAnchor="middle" fontFamily={fontFamily.sans400} fontSize={10.5} fill={color.pizarra}>
              {p.nombre.length > 12 ? `${p.nombre.slice(0, 11)}…` : p.nombre}
            </SvgText>
          </G>
        ))}
        {etiquetas.map(({ g, x, y, ancla }) => (
          <SvgText key={g} x={x} y={y + 3} textAnchor={ancla} fontFamily={fontFamily.sans700} fontSize={10} fontWeight="700" letterSpacing={0.8} fill={color.plomo}>
            {ETIQUETA_MAPA[g] ?? g.toUpperCase()}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export const estiloNombre = [type.bodyStrong, { color: color.pizarra }];
