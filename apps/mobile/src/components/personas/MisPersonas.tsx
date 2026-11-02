/**
 * «Mis personas»: la lista y el mapa de tus fichas, y la ficha de cada persona con lo que has visto
 * de ella. Todo es privado: solo lo ve la propia cuenta, y se puede borrar una a una o todo a la vez.
 * Sustituye al antiguo «Círculo».
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, Eyebrow, H2, Screen, Titular } from '@/components/ui';
import { GRUPOS, TEXTO_GRUPO, TEXTO_SITUACION, textoSinResultado, type Observacion, type Persona } from '@/lib/personas';
import { actualizarPersona, borrarObservacion, borrarPersona, borrarTodasLasPersonas, leerPersona } from '@/features/personas';
import { useTemperamento } from '@/features/temperamento';
import { Atras, Opcion, ROJO, nota, parrafo } from '@/components/camino/ui';
import { color, fontFamily, space, type } from '@/theme';
import { Avatar, EtiquetaEstado, FichaContenido, MapaPersonas } from './comun';

/** Botón de borrar en dos pasos: «Borrar» → «¿Seguro? Sí, borrar». */
function BorrarConfirmando({ texto, confirmar, onBorrar }: { texto: string; confirmar: string; onBorrar: () => void }) {
  const [seguro, setSeguro] = useState(false);
  const enlace = (t: string, onPress: () => void, c = ROJO, negrita = false) => (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ padding: 4 }}>
      <Text style={[type.caption, { fontSize: 14, color: c, fontFamily: negrita ? fontFamily.sans700 : fontFamily.sans400 }]}>{t}</Text>
    </Pressable>
  );
  if (!seguro) return enlace(texto, () => setSeguro(true));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
      {confirmar ? <Text style={nota}>{confirmar}</Text> : null}
      {enlace('Sí, borrar', onBorrar, ROJO, true)}
      {enlace('No', () => setSeguro(false), color.plomo)}
    </View>
  );
}

export function ListaPersonas({ personas, onAbrir, compacta = false }: { personas: Persona[]; onAbrir: (p: Persona) => void; compacta?: boolean }) {
  if (!personas.length) return null;
  return (
    <View>
      {personas.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          onPress={() => onAbrir(p)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: compacta ? 8 : 10,
            borderTopWidth: 1,
            borderTopColor: color.bruma,
            opacity: pressed ? 0.8 : 1,
          })}>
          <Avatar persona={p} tam={compacta ? 36 : 42} />
          <View style={{ flex: 1 }}>
            <Text style={[type.bodyStrong, { color: color.pizarra }]}>
              {p.nombre}
              {p.estrella ? ' ★' : ''}
              {p.relacion ? <Text style={{ fontFamily: fontFamily.sans400, color: color.plomo }}> · {p.relacion}</Text> : null}
            </Text>
            <EtiquetaEstado persona={p} />
          </View>
          <Text style={{ color: color.plomo, fontSize: 18 }}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Tarjeta de «Mis personas» en la pestaña Camino. */
export function TarjetaPersonas({ personas, onVer, onCrear }: { personas: Persona[]; onVer: (id: string | null) => void; onCrear: () => void }) {
  return (
    <Card>
      <Eyebrow>Mis personas</Eyebrow>
      <H2>{personas.length ? `${personas.length} ${personas.length === 1 ? 'ficha' : 'fichas'}` : 'Descubre a tu gente'}</H2>
      {!personas.length ? <Text style={parrafo}>Crea la ficha de alguien cercano y descubre su temperamento con 8 preguntas.</Text> : null}
      <ListaPersonas personas={personas.slice(0, 4)} onAbrir={(p) => onVer(p.id)} compacta />
      <Button variant="secondary" label="Crear ficha" onPress={onCrear} />
      {personas.length > 0 ? <Button variant="ghost" label="Ver todas" onPress={() => onVer(null)} /> : null}
    </Card>
  );
}

export function MisPersonas({
  personas,
  onAbrir,
  onCrear,
  onVolver,
  onCambio,
}: {
  personas: Persona[];
  onAbrir: (id: string) => void;
  onCrear: () => void;
  onVolver?: () => void;
  onCambio: () => void;
}) {
  async function borrarTodas() {
    await borrarTodasLasPersonas().catch(() => {});
    onCambio();
  }
  return (
    <Screen>
      {onVolver ? <Atras label="← Mi camino" onPress={onVolver} /> : null}
      <Titular eyebrow="Mis personas">Tu gente</Titular>
      <Text style={parrafo}>Las personas con las que practicarás las virtudes. Solo tú ves estas fichas.</Text>
      {personas.length > 0 ? <MapaPersonas personas={personas} /> : null}
      {GRUPOS.map(([g]) => {
        const delGrupo = personas.filter((p) => p.grupo === g);
        if (!delGrupo.length) return null;
        return (
          <View key={g} style={{ gap: space.xs }}>
            <Text style={[type.eyebrow, { color: color.plomo }]}>{TEXTO_GRUPO[g]}</Text>
            <ListaPersonas personas={delGrupo} onAbrir={(p) => onAbrir(p.id)} />
          </View>
        );
      })}
      <Button label="Crear ficha" onPress={onCrear} />
      {personas.length > 0 ? (
        <BorrarConfirmando texto="Borrar todas las fichas" confirmar="Se borrarán todas tus fichas y lo que has anotado." onBorrar={borrarTodas} />
      ) : null}
    </Screen>
  );
}

export function Ficha({
  id,
  menor,
  onVolver,
  onObservar,
  onRehacer,
  onCambio,
}: {
  id: string;
  menor: boolean;
  onVolver: () => void;
  onObservar: (p: Persona) => void;
  onRehacer: (p: Persona) => void;
  onCambio: () => void;
}) {
  const temp = useTemperamento();
  const [estado, setEstado] = useState<{ cargando?: boolean; error?: boolean; persona?: Persona | null; observaciones?: Observacion[] }>({ cargando: true });
  const cargar = useCallback(() => {
    leerPersona(id)
      .then((d) => setEstado(d))
      .catch(() => setEstado({ error: true }));
  }, [id]);
  useEffect(cargar, [cargar]);

  if (estado.cargando) {
    return (
      <Screen>
        <Text style={parrafo}>Cargando la ficha…</Text>
      </Screen>
    );
  }
  if (estado.error || !estado.persona) {
    return (
      <Screen>
        <Atras label="← Mis personas" onPress={onVolver} />
        <Text style={parrafo}>No he encontrado esta ficha.</Text>
      </Screen>
    );
  }
  const p = estado.persona;
  const observaciones = estado.observaciones ?? [];
  async function marcar(campo: 'estrella' | 'me_cuesta') {
    const nueva = await actualizarPersona(p.id, { [campo]: !p[campo] }).catch(() => null);
    if (nueva) setEstado((e) => ({ ...e, persona: nueva }));
    onCambio();
  }
  async function borrarFicha() {
    await borrarPersona(p.id).catch(() => {});
    onCambio();
    onVolver();
  }
  async function borrarObs(obsId: string) {
    await borrarObservacion(obsId).catch(() => {});
    cargar();
  }

  return (
    <Screen>
      <Atras label="← Mis personas" onPress={onVolver} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar persona={p} tam={60} />
        <View style={{ flex: 1 }}>
          <Text style={[type.h1, { color: color.azulProfundo }]}>{p.nombre}</Text>
          <Text style={nota}>
            {TEXTO_GRUPO[p.grupo]}
            {p.relacion ? ` · ${p.relacion}` : ''}
          </Text>
          <EtiquetaEstado persona={p} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Opcion compacta activa={p.estrella} onPress={() => marcar('estrella')}>
          ★ Colaborador privilegiado
        </Opcion>
        {!menor ? (
          <Opcion compacta activa={p.me_cuesta} onPress={() => marcar('me_cuesta')}>
            Me cuesta
          </Opcion>
        ) : null}
      </View>

      {p.primario ? (
        <FichaContenido persona={p} miPrimario={temp?.primario} />
      ) : (
        <Text style={[parrafo, { borderTopWidth: 1, borderTopColor: color.bruma, paddingTop: 14 }]}>{textoSinResultado(p.nombre)}</Text>
      )}

      <View style={{ borderTopWidth: 1, borderTopColor: color.bruma, paddingTop: 14, gap: space.s }}>
        <Text style={[type.eyebrow, { color: color.plomo }]}>Lo que he visto de {p.nombre}</Text>
        {observaciones.length === 0 ? <Text style={nota}>Aún no has anotado ninguna reacción.</Text> : null}
        {observaciones.map((o) => (
          <View key={o.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingTop: 8, borderTopWidth: 1, borderTopColor: color.niebla }}>
            <Text style={[nota, { minWidth: 56 }]}>{new Date(o.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
            <View style={{ flex: 1 }}>
              <Text style={parrafo}>
                {TEXTO_SITUACION[o.situacion]}: <Text style={{ fontFamily: fontFamily.sans700 }}>{o.palabra.toLowerCase()}</Text>
              </Text>
              {o.linea ? <Text style={[type.cita, { color: color.plomo }]}>«{o.linea}»</Text> : null}
            </View>
            <BorrarConfirmando texto="Borrar" confirmar="" onBorrar={() => borrarObs(o.id)} />
          </View>
        ))}
      </View>

      <Button label="Anotar una reacción" onPress={() => onObservar(p)} />
      {p.estado !== 'confirmado' ? <Button variant="secondary" label={p.primario ? 'Rehacer el test' : 'Hacer el test'} onPress={() => onRehacer(p)} /> : null}
      <BorrarConfirmando texto="Borrar esta ficha" confirmar={`Se borrará la ficha de ${p.nombre} y todo lo anotado.`} onBorrar={borrarFicha} />
    </Screen>
  );
}
