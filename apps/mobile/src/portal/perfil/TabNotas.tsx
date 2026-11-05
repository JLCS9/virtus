// Pestaña «Mis notas» (web: TabNotas de src/app/Perfil.jsx).
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { GOLD_REF, MUTED, NAVY, em, eyebrow, fuente, tarjeta } from '../tema';
import { leerNotasModulo } from './datos';
import { MODULOS } from './modulos';
import { Vacio, fmtFecha } from './piezas';

type Nota = { id: string; fecha: string; texto: string };
type Grupo = { mod: (typeof MODULOS)[number]; entradas: { pasoId: string; titulo: string; notas: Nota[] }[] };

async function leerTodas(userId: string): Promise<Grupo[]> {
  const todas: Grupo[] = [];
  for (const mod of MODULOS) {
    const parsed = await leerNotasModulo(userId, mod.id);
    if (!parsed) continue;
    const entradas: Grupo['entradas'] = [];
    for (const [pasoId, arr] of Object.entries(parsed)) {
      if (!Array.isArray(arr) || arr.length === 0) continue;
      entradas.push({ pasoId, titulo: mod.titulos[pasoId] ?? pasoId, notas: (arr as Nota[]).slice().reverse() });
    }
    if (entradas.length > 0) todas.push({ mod, entradas });
  }
  return todas;
}

export function TabNotas({ userId }: { userId: string }) {
  const [todas, setTodas] = useState<Grupo[] | null>(null);

  useEffect(() => {
    let vivo = true;
    leerTodas(userId).then((t) => vivo && setTodas(t));
    return () => {
      vivo = false;
    };
  }, [userId]);

  if (!todas) return null;

  if (todas.length === 0) {
    return <Vacio titulo="Aún no tienes notas" texto="Tus notas de la formación aparecerán aquí, organizadas por curso y módulo." />;
  }

  const totalNotas = todas.reduce((s, g) => s + g.entradas.reduce((s2, e) => s2 + e.notas.length, 0), 0);

  return (
    <View>
      <Text style={{ ...fuente.body(400), fontSize: 14, color: MUTED, marginBottom: 20 }}>
        {totalNotas} nota{totalNotas !== 1 ? 's' : ''} en total
      </Text>
      {todas.map(({ mod, entradas }) => (
        <View key={mod.id} style={{ marginBottom: 28 }}>
          <Text style={[eyebrow, { marginBottom: 12 }]}>{mod.titulo}</Text>
          {entradas.map(({ pasoId, titulo, notas }) => (
            <View key={pasoId} style={[tarjeta, { marginBottom: 12 }]}>
              <Text style={{ ...fuente.slab(700), fontSize: 16, color: NAVY, marginBottom: 10 }}>{titulo}</Text>
              <View style={{ gap: 8 }}>
                {notas.map((n, i) => (
                  <View
                    key={n.id ?? i}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderLeftWidth: 3,
                      borderLeftColor: GOLD_REF,
                      backgroundColor: 'rgba(165,139,38,0.04)',
                    }}>
                    <Text
                      style={{
                        ...fuente.body(400),
                        fontSize: 11,
                        color: MUTED,
                        letterSpacing: em(0.04, 11),
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}>
                      {fmtFecha(n.fecha)}
                    </Text>
                    <Text style={{ ...fuente.body(400), fontSize: 15, color: NAVY, lineHeight: 15 * 1.6 }}>{n.texto}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
