// Pestaña «Mis resultados» (web: TabDatos, BarraVirtud, SelectorHistorico, RetomarLink y SeccionFormacion de src/app/Perfil.jsx).
 
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { abrirWeb, PAGINA_WEB } from '../navegacion';
import { GOLD_REF, GOLD_REF_DK, LINE, MUTED, NAVY, fuente, parrafo } from '../tema';
import { claveTemperamento } from '../web/lib/virtudes.js';
import { leerSintesis } from './datos';
import { Fila, Seccion, Selector, Vacio, fmtFecha } from './piezas';

const TEMP_NOMBRE: Record<string, string> = { COL: 'Colérico', MEL: 'Melancólico', SAN: 'Sanguíneo', FLE: 'Flemático' };
const GRUPO: Record<string, string> = { familia: 'Familia', trabajo: 'Trabajo', amigos: 'Amigos', comunidad: 'Comunidad' };
const ESTADO_PERSONA: Record<string, string> = {
  sin_estimar: 'Sin estimar',
  estimado: 'Estimado',
  confirmado: 'Confirmado',
  invitado: 'Invitado',
  registrado: 'Registrado',
};
const NOMBRES_V: Record<string, string> = {
  prudencia: 'Prudencia',
  fortaleza: 'Fortaleza',
  dominio: 'Dominio de sí',
  justicia: 'Justicia',
  magnanimidad: 'Magnanimidad',
  humildad: 'Humildad',
};

const parrafoPeq = { ...parrafo, fontSize: 13, lineHeight: 13 * 1.65 };

function BarraVirtud({ nombre, pct }: { nombre: string; pct: number }) {
  return (
    <View style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: LINE }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ ...fuente.body(600), fontSize: 13, color: NAVY }}>{nombre}</Text>
        <Text style={{ ...fuente.body(400), fontSize: 13, color: MUTED }}>{pct}%</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: LINE, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: GOLD_REF, borderRadius: 3 }} />
      </View>
    </View>
  );
}

function SelectorHistorico({ items, idx, setIdx }: { items: Record<string, any>[]; idx: number; setIdx: (i: number) => void }) {
  if (items.length <= 1) return null;
  const opciones: [string, string][] = items.map((t, i) => [String(i), `${fmtFecha(t.taken_at, 'short')}${i === 0 ? ' (último)' : ''}`]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
      <Selector compacto value={String(idx)} opciones={opciones} onChange={(v) => setIdx(Number(v))} />
      <Text style={{ ...fuente.body(400), fontSize: 11, color: MUTED, paddingTop: 5 }}>
        {items.length} {items.length === 1 ? 'vez' : 'veces'}
      </Text>
    </View>
  );
}

function RetomarLink({ url, children }: { url: string; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => abrirWeb(url)}
      style={({ pressed }) => ({
        marginTop: 14,
        paddingVertical: 8,
        borderWidth: 1.5,
        borderColor: LINE,
        alignItems: 'center',
        backgroundColor: pressed ? 'rgba(165,139,38,0.06)' : 'transparent',
      })}>
      <Text style={{ ...fuente.body(600), fontSize: 13, color: GOLD_REF_DK, textAlign: 'center' }}>{children}</Text>
    </Pressable>
  );
}

function SeccionFormacion({ userId }: { userId?: string }) {
  const [sint, setSint] = useState<Record<string, any> | null>(null);
  useEffect(() => {
    if (!userId) return undefined;
    let vivo = true;
    leerSintesis(userId, 'modulo1').then((s) => vivo && setSint(s));
    return () => {
      vivo = false;
    };
  }, [userId]);
  if (!sint) return null;
  return (
    <Seccion titulo="Formación · Curso 1">
      <Fila label="Temperamento primario" valor={TEMP_NOMBRE[sint.temperamento_primario] ?? sint.temperamento_primario} />
      {sint.temperamento_secundario ? (
        <Fila label="Temperamento secundario" valor={TEMP_NOMBRE[sint.temperamento_secundario] ?? sint.temperamento_secundario} />
      ) : null}
      {sint.virtud_desafio ? <Fila label="Virtud-desafío" valor={sint.virtud_desafio} /> : null}
      <Fila label="Lo que me facilita" valor={sint.lo_que_facilita} />
      <Fila label="Lo que más me cuesta" valor={sint.lo_que_cuesta} />
      <Fila label="Mi propósito" valor={sint.proposito} />
      {sint.fecha ? <Fila label="Fecha" valor={fmtFecha(sint.fecha)} /> : null}
    </Seccion>
  );
}

export function TabDatos({
  tests,
  personas,
  camino,
  userId,
}: {
  tests: Record<string, any>[];
  personas: Record<string, any>[];
  camino: Record<string, any> | null;
  userId?: string;
}) {
  const tempTests = tests.filter((t) => t.kind === 'temperament');
  const charTests = tests.filter((t) => t.kind === 'character');
  const [tempIdx, setTempIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const tempTest = tempTests[tempIdx];
  const charTest = charTests[charIdx];
  const tempPerfil: string | undefined = tempTest?.result?.profile;
  const tempPartes = tempPerfil?.split('-') ?? [];
  const virtudes = charTest?.result?.virtues;

  const sinDatos = !tempTest && !charTest && personas.length === 0 && !camino;
  if (sinDatos) {
    return <Vacio titulo="Aún no tienes resultados" texto="Completa tu primer test para ver tus resultados aquí." />;
  }

  return (
    <View style={{ gap: 18 }}>
      <Seccion titulo="Tu temperamento">
        {tempTest ? (
          <>
            <SelectorHistorico items={tempTests} idx={tempIdx} setIdx={setTempIdx} />
            <Text style={{ ...fuente.slab(700), fontSize: 20, color: NAVY, marginTop: 2, marginBottom: 10 }}>
              {tempPartes.map((t) => TEMP_NOMBRE[t.toUpperCase()] ?? t).join(' – ')}
            </Text>
            {tempTest.result?.scores
              ? (() => {
                  const entries = (Object.entries(tempTest.result.scores) as [string, number][]).sort((a, b) => b[1] - a[1]);
                  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
                  return entries.map(([t, pts]) => <BarraVirtud key={t} nombre={TEMP_NOMBRE[t] ?? t} pct={Math.round((pts / total) * 100)} />);
                })()
              : null}
            <Fila label="Fecha" valor={fmtFecha(tempTest.taken_at)} />
            <Fila label="Veces realizado" valor={tempTests.length} />
            {tempTests.length > 1
              ? (() => {
                  const perfiles = tempTests.map((tt) => claveTemperamento(tt.result)).filter(Boolean);
                  const mismo = perfiles.filter((p) => p === perfiles[0]).length;
                  return <Fila label="Coincidencia" valor={`${Math.round((mismo / perfiles.length) * 100)}%`} />;
                })()
              : null}
          </>
        ) : (
          <Text style={parrafoPeq}>Aún no has hecho el test.</Text>
        )}
        <RetomarLink url={PAGINA_WEB.testTemperamento}>Volver a hacer el test</RetomarLink>
      </Seccion>

      <Seccion titulo="Tus virtudes">
        {charTest && virtudes ? (
          <>
            <SelectorHistorico items={charTests} idx={charIdx} setIdx={setCharIdx} />
            {Object.entries(NOMBRES_V).map(([key, nom]) => {
              const v = virtudes[key];
              if (!v) return null;
              return <BarraVirtud key={key} nombre={nom} pct={Math.round((v.global ?? 0) * 100)} />;
            })}
            <Fila label="Fecha" valor={fmtFecha(charTest.taken_at)} />
            <Fila label="Veces realizado" valor={charTests.length} />
          </>
        ) : (
          <Text style={parrafoPeq}>Aún no has hecho el test.</Text>
        )}
        <RetomarLink url={PAGINA_WEB.testCaracter}>Volver a hacer el test</RetomarLink>
      </Seccion>

      <SeccionFormacion userId={userId} />

      <Seccion titulo="Tu camino">
        {camino ? (
          <>
            <Fila label="Objetivo" valor={camino.objetivo} />
            <Fila label="Estado de vida" valor={camino.estado_vida} />
            <Fila label="Vida interior" valor={camino.vida_interior === 'si' ? 'Sí' : camino.vida_interior === 'no' ? 'No' : camino.vida_interior} />
            <Fila label="Inicio" valor={camino.inicio ? fmtFecha(`${camino.inicio}T00:00:00`) : null} />
            <Fila label="Hora mañana" valor={camino.hora_manana?.slice(0, 5)} />
            <Fila label="Hora examen" valor={camino.hora_examen?.slice(0, 5)} />
          </>
        ) : (
          <Text style={parrafoPeq}>Aún no has configurado tu camino.</Text>
        )}
      </Seccion>

      <Seccion titulo={`Tus personas (${personas.length})`}>
        {personas.length > 0 ? (
          personas.map((p, i) => (
            <View
              key={i}
              style={{
                paddingVertical: 9,
                borderBottomWidth: i < personas.length - 1 ? 1 : 0,
                borderBottomColor: LINE,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}>
              <View style={{ flexShrink: 1 }}>
                <Text style={{ ...fuente.body(600), fontSize: 14, color: NAVY }}>
                  {p.nombre} {p.estrella ? '★' : ''} {p.me_cuesta ? '⚡' : ''}
                </Text>
                <Text style={{ ...fuente.body(400), fontSize: 12, color: MUTED }}>
                  {GRUPO[p.grupo]} {p.relacion ? `· ${p.relacion}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {p.primario ? (
                  <Text style={{ ...fuente.body(400), fontSize: 13, color: NAVY, textAlign: 'right' }}>
                    {TEMP_NOMBRE[p.primario]}
                    {p.secundario ? ` – ${TEMP_NOMBRE[p.secundario]}` : ''}
                  </Text>
                ) : null}
                <Text style={{ ...fuente.body(400), fontSize: 11, color: MUTED, textAlign: 'right' }}>{ESTADO_PERSONA[p.estado]}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={parrafoPeq}>Aún no has añadido personas.</Text>
        )}
      </Seccion>
    </View>
  );
}
