// Bloc de notas bajo cada vídeo (src/formacion/BlocDeNotas.jsx de la web).
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { IconoChevron } from '../Iconos';
import { GOLD_REF, LINE, MUTED, NAVY, PAPER, eyebrow } from '../tema';
import { EnlaceLupa, Tarjeta, cursiva, lh, tb, versalita } from './comun';
import type { Notas } from './useNotas';

type Video = { id: string; titulo: string };

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function leccionesDesbloqueadas(videos: Video[], completados: Record<string, unknown>) {
  const result: Video[] = [];
  for (const v of videos) {
    result.push(v);
    if (!completados[v.id]) break;
  }
  return result;
}

/** <select> de la web: desplegable con las lecciones desbloqueadas. */
function Selector({ opciones, valor, onChange }: { opciones: { valor: string; etiqueta: string }[]; valor: string; onChange: (v: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const actual = opciones.find((o) => o.valor === valor);
  return (
    <View style={{ marginBottom: 14, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff' }}>
      <Pressable onPress={() => setAbierto((a) => !a)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingLeft: 16, paddingRight: 14, gap: 10 }}>
        <Text style={tb(15, NAVY, 500, { flex: 1 })} numberOfLines={abierto ? undefined : 1}>
          {actual?.etiqueta ?? ''}
        </Text>
        <View style={{ transform: [{ rotate: abierto ? '180deg' : '0deg' }] }}>
          <IconoChevron size={14} color="#7a8599" />
        </View>
      </Pressable>
      {abierto &&
        opciones.map((o) => (
          <Pressable
            key={o.valor}
            onPress={() => {
              onChange(o.valor);
              setAbierto(false);
            }}
            style={({ pressed }) => ({ paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: LINE, backgroundColor: pressed || o.valor === valor ? 'rgba(165,139,38,0.08)' : '#fff' })}>
            <Text style={tb(15, NAVY, o.valor === valor ? 600 : 400)}>{o.etiqueta}</Text>
          </Pressable>
        ))}
    </View>
  );
}

export function BlocDeNotas({
  videos,
  completados,
  pasoActualId,
  notas,
  onAgregar,
  onEliminar,
}: {
  videos: Video[];
  completados: Record<string, unknown>;
  pasoActualId: string;
  notas: Notas;
  onAgregar: (pasoId: string, texto: string) => void;
  onEliminar: (pasoId: string, notaId: string) => void;
}) {
  const desbloqueadas = leccionesDesbloqueadas(videos, completados);
  if (!desbloqueadas.find((v) => v.id === pasoActualId)) {
    const actual = videos.find((v) => v.id === pasoActualId);
    if (actual && !desbloqueadas.includes(actual)) desbloqueadas.push(actual);
  }

  const [texto, setTexto] = useState('');
  const [verPasadas, setVerPasadas] = useState(false);
  const [filtro, setFiltro] = useState(pasoActualId);

  const totalNotas = Object.values(notas).reduce((s, arr) => s + arr.length, 0);
  const notasDelFiltro = (notas[filtro] ?? []).slice().reverse();
  const hayTexto = Boolean(texto.trim());

  function guardarNota() {
    const t = texto.trim();
    if (!t || !pasoActualId) return;
    onAgregar(pasoActualId, t);
    setTexto('');
  }

  return (
    <Tarjeta style={{ marginTop: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <Text style={eyebrow}>Bloc de notas</Text>
        {totalNotas > 0 && <EnlaceLupa onPress={() => setVerPasadas(!verPasadas)}>{verPasadas ? 'Ocultar notas pasadas' : 'Ver notas pasadas'}</EnlaceLupa>}
      </View>

      <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: LINE }}>
        <TextInput
          multiline
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe una reflexión…"
          placeholderTextColor="#9a9a9a"
          textAlignVertical="top"
          style={[tb(15, NAVY), { paddingVertical: 14, paddingHorizontal: 16, minHeight: 80, lineHeight: lh(15, 1.55) }]}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={guardarNota}
          disabled={!hayTexto}
          style={({ pressed }) => ({ backgroundColor: hayTexto ? GOLD_REF : LINE, paddingVertical: 10, paddingHorizontal: 22, opacity: pressed ? 0.85 : 1 })}>
          <Text style={tb(14, hayTexto ? PAPER : MUTED, 600, { letterSpacing: 0.28 })}>Guardar nota</Text>
        </Pressable>
      </View>

      {verPasadas && (
        <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 14 }}>
          <Selector opciones={desbloqueadas.map((v, i) => ({ valor: v.id, etiqueta: `Módulo ${i} — ${v.titulo}` }))} valor={filtro} onChange={setFiltro} />

          {notasDelFiltro.length === 0 && <Text style={cursiva(14, MUTED)}>Sin notas en esta lección.</Text>}

          {notasDelFiltro.length > 0 && (
            <View style={{ gap: 10 }}>
              {notasDelFiltro.map((nota) => (
                <View key={nota.id} style={{ paddingVertical: 14, paddingLeft: 16, paddingRight: 18, borderLeftWidth: 3, borderLeftColor: GOLD_REF, backgroundColor: 'rgba(165,139,38,0.04)' }}>
                  <Text style={[versalita(11, MUTED, 400, 0.04), { marginBottom: 6 }]}>{formatFecha(nota.fecha)}</Text>
                  <Text style={tb(16, NAVY, 400, { lineHeight: lh(16, 1.65), paddingRight: 24 })}>{nota.texto}</Text>
                  <Pressable
                    accessibilityLabel="Eliminar nota"
                    onPress={() => onEliminar(filtro, nota.id)}
                    hitSlop={8}
                    style={({ pressed }) => ({ position: 'absolute', top: 10, right: 10, paddingVertical: 4, paddingHorizontal: 6, opacity: pressed ? 1 : 0.4 })}>
                    <Text style={tb(15, MUTED)}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Tarjeta>
  );
}
