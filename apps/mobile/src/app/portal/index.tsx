// Hoy (src/app/Hoy.jsx de la web): reto de la semana, tu resultado de temperamento y tu mapa de carácter.
 
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { fetchLatestCharacter, fetchLatestTemperament } from '@/portal/datos';
import { useCamino, usePersonas } from '@/portal/hooks';
import { VirtudesBarras, VirtudesRadar } from '@/portal/hoy/Radar';
import { IconoCheck, IconoChevron } from '@/portal/Iconos';
import { PAGINA_WEB, abrirWeb } from '@/portal/navegacion';
import { ESPACIO_BURBUJA } from '@/portal/Shell';
import { t } from '@/portal/t';
import { GOLD_REF, GOLD_REF_LT, INK, MUTED, NAVY, PAPER, TEMP_COLORS, eyebrow, fuente, parrafo, tarjeta } from '@/portal/tema';
import { Boton, Enlace, Eyebrow, Hero, Negrita, Parrafo, Tarjeta, Titulo } from '@/portal/ui';
import { CHALLENGE_VIRTUE } from '@/portal/web/lib/challengeVirtues.js';
import { CON_QUIEN, TOTAL_DIAS, fechaCorta, infoDia, semanaDe, siguientePaso } from '@/portal/web/lib/camino.js';
import { idDeClave, sugerenciaDelDia } from '@/portal/web/lib/personas.js';
import { claveTemperamento, extremos, resultadoCaracter } from '@/portal/web/lib/virtudes.js';

// «Con quién» guardado → texto (textoConQuien de src/app/personas/EligeQuien.jsx).
const TEXTO_CON_QUIEN: Record<string, string> = Object.fromEntries([...CON_QUIEN, ['solo', 'Solo']]);
function textoConQuien(clave: string, porId: Record<string, any> = {}) {
  const id = idDeClave(clave);
  if (id) return porId[id]?.nombre ?? 'Una persona';
  return TEXTO_CON_QUIEN[clave] ?? clave;
}

const etiquetaHero = { ...eyebrow, color: GOLD_REF_LT, marginTop: 6 };
const fraseHero = (tam: number, extra = {}) => ({ ...fuente.slab(400), fontSize: tam, lineHeight: Math.round(tam * 1.25), color: PAPER, ...extra });
const textoHero = (opacidad: number, extra = {}) => ({ ...fuente.body(400), fontSize: 15, lineHeight: 22, color: PAPER, opacity: opacidad, ...extra });

function PopupFormacion({ visible, onCerrar }: { visible: boolean; onCerrar: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCerrar}>
      <Pressable onPress={onCerrar} style={{ flex: 1, backgroundColor: 'rgba(15,29,56,0.22)', alignItems: 'center', justifyContent: 'center' }}>
        <Pressable onPress={() => {}} style={[tarjeta, { maxWidth: 400, width: '90%', alignItems: 'center' }]}>
          <Text style={[eyebrow, { marginBottom: 12, textAlign: 'center' }]}>Próximamente</Text>
          <Titulo tam={24} style={{ marginBottom: 14, lineHeight: 30, textAlign: 'center' }}>
            Solo se han editado temas de la formación
          </Titulo>
          <Parrafo style={{ fontSize: 15, lineHeight: 24, marginBottom: 24, textAlign: 'center' }}>
            Esta sección se activará próximamente. Por ahora, explora los cursos en Formación.
          </Parrafo>
          <Boton variante="sobreClaro" ancho onPress={onCerrar}>
            Entendido
          </Boton>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Hero pulsable: en la web, todo el reto abre el aviso de «Próximamente». */
function HeroPulsable({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      <Hero>{children}</Hero>
    </Pressable>
  );
}

const BotonFalso = ({ children }: { children: string }) => (
  <View style={{ alignSelf: 'flex-start', backgroundColor: GOLD_REF, paddingVertical: 16, paddingHorizontal: 28, flexDirection: 'row', gap: 9 }}>
    <Text style={{ ...fuente.body(600), fontSize: 16, color: '#fff' }}>{children} →</Text>
  </View>
);

function RetoDeLaSemana() {
  const camino = useCamino();
  const personas = usePersonas();
  const [popup, setPopup] = useState(false);
  const abrir = () => setPopup(true);

  if (camino.cargando) {
    return (
      <Hero>
        <Text style={etiquetaHero}>Tu reto de la semana</Text>
        <Text style={fraseHero(24, { marginTop: 14, opacity: 0.75 })}>Preparando tu camino…</Text>
      </Hero>
    );
  }
  if (camino.error) {
    return (
      <Hero>
        <Text style={etiquetaHero}>Tu reto de la semana</Text>
        <Text accessibilityRole="alert" style={textoHero(0.92, { marginTop: 14, marginBottom: 18 })}>
          No he podido cargar tu camino ahora mismo.
        </Text>
        <Boton onPress={camino.recargar}>Reintentar</Boton>
      </Hero>
    );
  }

  const popupEl = <PopupFormacion visible={popup} onCerrar={() => setPopup(false)} />;

  if (!camino.perfil) {
    return (
      <>
        {popupEl}
        <HeroPulsable onPress={abrir}>
          <Text style={etiquetaHero}>Antes de empezar</Text>
          <Text style={fraseHero(27, { marginTop: 14, marginBottom: 8 })}>Personaliza tu camino.</Text>
          <Text style={textoHero(0.8, { marginBottom: 20 })}>
            Tu temperamento ya lo conocemos. Ahora cuéntanos un poco de tu vida para que el camino sea tuyo. Son dos minutos.
          </Text>
          <BotonFalso>Empezar</BotonFalso>
        </HeroPulsable>
      </>
    );
  }

  const { diaHoy } = camino;
  if ((diaHoy ?? 0) > TOTAL_DIAS) {
    return (
      <>
        {popupEl}
        <HeroPulsable onPress={abrir}>
          <Text style={etiquetaHero}>Tu camino</Text>
          <Text style={fraseHero(27, { marginTop: 14, marginBottom: 8 })}>Has completado tus dos primeras semanas.</Text>
          <Text style={textoHero(0.8)}>La semana 2 llega muy pronto.</Text>
        </HeroPulsable>
      </>
    );
  }

  const dia = diaHoy ?? 0;
  const empezado = dia >= 1;
  const semana = semanaDe(empezado ? dia : 1);
  const paso = siguientePaso(camino);
  const conQuien: string | null = empezado ? camino.porDia[dia]?.con_quien : null;
  const sugerencia = empezado && !infoDia(dia)?.cierre ? sugerenciaDelDia(personas.lista, camino.porDia, dia) : null;

  return (
    <>
      {popupEl}
      <HeroPulsable onPress={abrir}>
        <Text style={etiquetaHero}>{empezado ? `Día ${dia} · Tu reto de la semana` : `Empieza el ${fechaCorta(camino.perfil.inicio)}`}</Text>
        <Text style={{ ...fuente.slab(600), fontSize: 29, lineHeight: 35, color: PAPER, marginTop: 16, marginBottom: 10 }}>{semana.reto}</Text>
        <Text style={textoHero(0.85, { fontSize: 14.5, marginBottom: 8 })}>{semana.retoTexto}</Text>
        <Text style={{ ...fuente.body(400, true), fontSize: 14.5, lineHeight: 22, color: PAPER, opacity: 0.72, marginBottom: 22 }}>«{semana.frase}»</Text>
        {conQuien ? (
          <Text style={textoHero(0.9, { fontSize: 14, marginTop: -8, marginBottom: 20 })}>
            Hoy, con: <Negrita>{idDeClave(conQuien) ? textoConQuien(conQuien, personas.porId) : textoConQuien(conQuien).toLowerCase()}</Negrita>
          </Text>
        ) : sugerencia ? (
          <Text style={textoHero(0.9, { fontSize: 14, marginTop: -8, marginBottom: 20 })}>
            Hoy podrías hacerlo con <Negrita>{sugerencia.persona.nombre}</Negrita>
            {sugerencia.consejo ? `: ${sugerencia.consejo.charAt(0).toLowerCase()}${sugerencia.consejo.slice(1)}.` : '.'}
          </Text>
        ) : null}
        {paso && paso.tipo !== 'hecho' ? (
          <BotonFalso>
            {paso.tipo === 'examen' ? 'Hacer el examen de la noche' : paso.atrasada ? `Hacer el día ${paso.dia}` : 'Tu sesión de hoy'}
          </BotonFalso>
        ) : empezado ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconoCheck size={18} color={GOLD_REF_LT} />
            <Text style={{ ...fuente.body(600), fontSize: 14.5, color: GOLD_REF_LT }}>Hoy está hecho</Text>
          </View>
        ) : null}
      </HeroPulsable>
    </>
  );
}

function Desplegable({ titulo, texto }: { titulo: string; texto: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(27,42,74,0.10)', paddingVertical: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        onPress={() => setAbierto((a) => !a)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ ...fuente.body(600), fontSize: 14, color: NAVY }}>{titulo}</Text>
        <View style={{ transform: [{ rotate: abierto ? '180deg' : '0deg' }] }}>
          <IconoChevron size={18} color={NAVY} />
        </View>
      </Pressable>
      {abierto ? <Parrafo style={{ marginTop: 10, fontSize: 14.5, lineHeight: 24 }}>{texto}</Parrafo> : null}
    </View>
  );
}

function MiResultado() {
  const [fila, setFila] = useState<any>(undefined);
  useEffect(() => {
    let vivo = true;
    fetchLatestTemperament()
      .then((r) => vivo && setFila(r ?? null))
      .catch(() => vivo && setFila(null));
    return () => {
      vivo = false;
    };
  }, []);

  if (fila === undefined) return null;
  const clave: string | null = claveTemperamento(fila?.result);
  if (!clave) {
    return (
      <Tarjeta>
        <Eyebrow>Tu resultado</Eyebrow>
        <Parrafo style={{ marginTop: 10, marginBottom: 16 }}>Aún no tienes un resultado del test de temperamento.</Parrafo>
        <Boton variante="contorno" onPress={() => abrirWeb(PAGINA_WEB.testTemperamento)}>
          Hacer el test
        </Boton>
      </Tarjeta>
    );
  }

  const perfil = t(`result.profiles.${clave}`);
  const partes = clave.split('-');
  const color1 = TEMP_COLORS[partes[0]];
  const color2 = partes[1] ? TEMP_COLORS[partes[1]] : null;
  const desafio = t(`result.challenge_defs.${CHALLENGE_VIRTUE[clave as keyof typeof CHALLENGE_VIRTUE]}`);
  const nombres: string[] = partes.map((p) => t(`temperaments.${p}`)?.name).filter(Boolean);

  return (
    <Tarjeta>
      <Eyebrow>Tu resultado</Eyebrow>
      <Titulo tam={30} style={{ marginTop: 10, marginBottom: 6 }}>
        {perfil?.name ?? clave}
      </Titulo>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {nombres.map((n, i) => (
          <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5, paddingLeft: 10, paddingRight: 12, backgroundColor: 'rgba(27,42,74,0.06)' }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: (i === 0 ? color1 : color2) ?? color1 }} />
            <Text style={{ ...fuente.body(600), fontSize: 13, color: INK }}>{n}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', height: 4, overflow: 'hidden', maxWidth: 160, marginBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: color1 }} />
        {color2 ? <View style={{ flex: 1, backgroundColor: color2 }} /> : null}
      </View>

      {desafio?.name ? (
        <View style={{ borderLeftWidth: 3, borderLeftColor: GOLD_REF, paddingLeft: 14, marginBottom: 18 }}>
          <Eyebrow style={{ color: MUTED }}>Tu virtud-desafío</Eyebrow>
          <Text style={{ ...fuente.slab(700), fontSize: 22, color: NAVY, marginVertical: 4 }}>{desafio.name}</Text>
          <Parrafo style={{ fontSize: 14.5, lineHeight: 24 }}>{desafio.def}</Parrafo>
        </View>
      ) : null}

      {(
        [
          ['Tu fortaleza', perfil?.fortaleza],
          ['Tu punto débil', perfil?.debilidad],
        ] as const
      ).map(([titulillo, texto]) => (texto ? <Desplegable key={titulillo} titulo={titulillo} texto={texto} /> : null))}
      <View style={{ marginTop: 6 }}>
        <Enlace onPress={() => abrirWeb(PAGINA_WEB.resultadoTemperamento)}>Ver mi resultado completo →</Enlace>
      </View>
    </Tarjeta>
  );
}

function MapaCaracter() {
  const [fila, setFila] = useState<any>(undefined);
  useEffect(() => {
    let vivo = true;
    fetchLatestCharacter()
      .then((r) => vivo && setFila(r ?? null))
      .catch(() => vivo && setFila(null));
    return () => {
      vivo = false;
    };
  }, []);

  if (fila === undefined) return null;
  const resultado = resultadoCaracter(fila?.result);

  if (!resultado) {
    return (
      <Tarjeta>
        <Eyebrow>Tus virtudes</Eyebrow>
        <Titulo tam={26} style={{ marginTop: 10, marginBottom: 8 }}>
          Descubre qué virtudes has construido
        </Titulo>
        <Parrafo style={{ marginBottom: 6 }}>
          El test de carácter mide las seis virtudes y dibuja aquí tu punto de partida. Son 68 preguntas y se hace una sola vez.
        </Parrafo>
        <Parrafo style={{ fontSize: 13.5, lineHeight: 22, marginBottom: 18 }}>Hazlo con tu sesión iniciada: así el resultado se guarda en tu cuenta.</Parrafo>
        <Boton variante="sobreClaro" flecha onPress={() => abrirWeb(PAGINA_WEB.testCaracter)}>
          Hacer el test de carácter
        </Boton>
      </Tarjeta>
    );
  }

  const valores = resultado.valores as Record<string, number>;
  const { mayor, menor } = extremos(valores);
  const fecha = fila?.taken_at ? new Date(fila.taken_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : null;
  return (
    <Tarjeta>
      <Eyebrow>Tus virtudes{fecha ? ` · medido el ${fecha}` : ''}</Eyebrow>
      <Titulo tam={26} style={{ marginTop: 10, marginBottom: 14 }}>
        Tu mapa de carácter
      </Titulo>
      <VirtudesRadar valores={valores} />
      <Text style={{ ...parrafo, color: INK, textAlign: 'center', marginTop: 14, marginBottom: 20 }}>
        Tu virtud más presente es <Negrita>{mayor.nombre}</Negrita> ({Math.round(mayor.valor)} %). La que más puedes cultivar ahora es{' '}
        <Negrita>{menor.nombre}</Negrita> ({Math.round(menor.valor)} %).
      </Text>
      <VirtudesBarras valores={valores} />
      <View style={{ marginTop: 18 }}>
        <Enlace onPress={() => abrirWeb(PAGINA_WEB.testCaracter)}>Repetir el test →</Enlace>
      </View>
    </Tarjeta>
  );
}

export default function Hoy() {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: ESPACIO_BURBUJA, gap: 18 }}>
      <RetoDeLaSemana />
      <MiResultado />
      <MapaCaracter />
    </ScrollView>
  );
}
