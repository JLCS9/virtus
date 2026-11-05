// Test de carácter (curso 4) y test del corazón (curso 5) dentro de Formación
// (src/formacion/Actividad.jsx de la web). Guardan el resultado en test_results, como la web.
import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { BEIGE, GOLD_REF, GOLD_REF_DK, LINE, MUTED, NAVY, PAPER, eyebrow, fuente } from '../../tema';
import CHARACTER_SUPPORT from '@/portal/web/data/character-support-text.json';
import CHARACTER_TEST from '@/portal/web/data/character-test.json';
import HEART_SUPPORT from '@/portal/web/data/heart-support-text.json';
import HEART_TEST from '@/portal/web/data/heart-test.json';
import { scoreCharacter } from '@/portal/web/lib/characterScoring.js';
import { HEART_DISORDER_CODES, scoreHeart } from '@/portal/web/lib/heartScoring.js';
import { CHAR_FACES, HEART_FACES } from '../assets';
import { BotonDorado, Caratula, Medalla, Shell, Tarjeta, VERDE, lh, tb, ts, versalita } from '../comun';
import { saveCharacterResultIfLoggedIn, saveHeartResultIfLoggedIn } from '../datos';

const CT: any = CHARACTER_TEST;
const CS: any = CHARACTER_SUPPORT;
const HT: any = HEART_TEST;
const HS: any = HEART_SUPPORT;

type Likert = { key: string; value: number; label: string };

function OpcionLikert({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ paddingVertical: 16, paddingHorizontal: 20, borderWidth: 1.5, borderColor: pressed ? GOLD_REF : LINE, backgroundColor: pressed ? GOLD_REF : PAPER })}>
      {({ pressed }) => <Text style={tb(17, pressed ? '#fff' : NAVY, 400, { lineHeight: lh(17, 1.5) })}>{label}</Text>}
    </Pressable>
  );
}

/** Pregunta Likert con «n de N» y «← Anterior». */
function PreguntaLikert({ titulo, idx, total, texto, opciones, puedeVolver, onBack, onAnswer }: { titulo: string; idx: number; total: number; texto: string; opciones: Likert[]; puedeVolver: boolean; onBack: () => void; onAnswer: (v: number) => void }) {
  return (
    <Shell titulo={titulo} actual={idx + 1} total={total}>
      <Tarjeta>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={tb(14, MUTED)}>
            {idx + 1} de {total}
          </Text>
          <Pressable disabled={!puedeVolver} onPress={onBack} hitSlop={8} style={{ opacity: puedeVolver ? 1 : 0.3 }}>
            <Text style={tb(14, GOLD_REF_DK, 600)}>← Anterior</Text>
          </Pressable>
        </View>
        <Text style={{ ...fuente.slab(400), fontSize: 22, color: NAVY, marginTop: 20, marginBottom: 24, lineHeight: lh(22, 1.45) }}>{texto}</Text>
        <View style={{ gap: 10 }}>
          {opciones.map((opt) => (
            <OpcionLikert key={opt.key} label={opt.label} onPress={() => onAnswer(opt.value)} />
          ))}
        </View>
      </Tarjeta>
    </Shell>
  );
}

/** Modal «Virtud completada» / «Bloque completado». */
function Hito({ etiqueta, face, nombre, color, pct, texto, onContinue }: { etiqueta: string; face: number; nombre: string; color: string; pct: number; texto: string; onContinue: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onContinue} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(27, 42, 74, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View
          style={{
            backgroundColor: PAPER,
            maxWidth: 440,
            width: '100%',
            borderRadius: 4,
            borderTopWidth: 4,
            borderTopColor: color,
            paddingVertical: 32,
            paddingHorizontal: 28,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 20 },
            elevation: 12,
          }}>
          <Text style={[eyebrow, { marginBottom: 4 }]}>{etiqueta}</Text>
          <View style={{ marginTop: 4, marginBottom: 20, width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: color, overflow: 'hidden', backgroundColor: BEIGE }}>
            <Image source={face} accessibilityLabel={nombre} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
          <Text style={ts(24, NAVY, { marginBottom: 8, textAlign: 'center' })}>{nombre}</Text>
          <Text style={ts(48, color, { lineHeight: 52, marginTop: 12, marginBottom: 20 })}>{Math.round(pct)}%</Text>
          <Text style={tb(14, MUTED, 400, { lineHeight: lh(14, 1.5), marginBottom: 24, textAlign: 'center' })}>{texto}</Text>
          <BotonDorado onPress={onContinue} size={18} padV={14} padH={36} style={{ alignSelf: 'stretch' }}>
            Continuar
          </BotonDorado>
        </View>
      </View>
    </Modal>
  );
}

/* ─── TEST DE CARÁCTER (E2) — embebido en formación ─── */

const CHAR_VIRTUE_ORDER = ['P', 'C', 'S', 'J', 'M', 'H'];
const CHAR_COLORS: Record<string, { color: string }> = {
  P: { color: '#5B8C5A' },
  C: { color: '#C0392B' },
  S: { color: '#2980B9' },
  J: { color: '#8E44AD' },
  M: { color: '#D4A017' },
  H: { color: '#16A085' },
};

const { order: CHAR_CANONICAL, groups: CHAR_GROUPS } = (() => {
  const groups: Record<string, number[]> = Object.fromEntries(CHAR_VIRTUE_ORDER.map((v) => [v, []]));
  CT.questions.forEach((q: any, i: number) => {
    const v = q.code && q.code[0];
    if (groups[v]) groups[v].push(i);
    else groups[CHAR_VIRTUE_ORDER[0]].push(i);
  });
  const order: number[] = [];
  for (const v of CHAR_VIRTUE_ORDER) order.push(...groups[v]);
  return { order, groups };
})();

const CHAR_CUMULATIVE = (() => {
  const cum: number[] = [];
  let acc = 0;
  for (const v of CHAR_VIRTUE_ORDER) {
    acc += CHAR_GROUPS[v].length;
    cum.push(acc);
  }
  return cum;
})();

function resolveCharSupport(supportObj: any, key: string): string {
  const entry = supportObj?.[key];
  if (!entry) return '';
  return entry.es || entry.en || '';
}

function CharResultSummary({ scoreResult, onContinue }: { scoreResult: any; onContinue: () => void }) {
  return (
    <Tarjeta>
      <View style={{ paddingTop: 12, paddingBottom: 8 }}>
        <Medalla>✦</Medalla>
      </View>
      <Text style={ts(26, NAVY, { marginTop: 14, marginBottom: 8, textAlign: 'center' })}>Tu perfil de carácter</Text>
      <Text style={tb(16, MUTED, 400, { textAlign: 'center', marginBottom: 24, lineHeight: lh(16, 1.6) })}>
        Aquí tienes tu resultado en las seis virtudes del liderazgo. Podrás consultarlo en tu panel.
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {CHAR_VIRTUE_ORDER.map((code) => {
          const s = scoreResult[code];
          const c = CHAR_COLORS[code];
          const virtueName = resolveCharSupport(CS.labels, s.virtue_label_key);
          return (
            <View
              key={code}
              style={{ flexBasis: '45%', flexGrow: 1, backgroundColor: PAPER, borderWidth: 1, borderColor: LINE, borderTopWidth: 3, borderTopColor: c.color, paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center' }}>
              <Text style={ts(32, c.color, { lineHeight: 34 })}>{Math.round(s.global ?? 0)}%</Text>
              <Text style={[versalita(11, NAVY, 600, 0.08), { marginTop: 8, textAlign: 'center' }]}>{virtueName}</Text>
            </View>
          );
        })}
      </View>

      {CHAR_VIRTUE_ORDER.map((code) => {
        const s = scoreResult[code];
        const c = CHAR_COLORS[code];
        const virtueName = resolveCharSupport(CS.labels, s.virtue_label_key);
        const passiveName = resolveCharSupport(CS.labels, s.passive_facet_key);
        const activeName = resolveCharSupport(CS.labels, s.active_facet_key);
        return (
          <View key={code} style={{ backgroundColor: PAPER, borderWidth: 1, borderColor: LINE, borderLeftWidth: 4, borderLeftColor: c.color, marginBottom: 12, paddingVertical: 16, paddingHorizontal: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: c.color, backgroundColor: BEIGE }}>
                <Image source={CHAR_FACES[code]} accessibilityLabel={virtueName} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
              <Text style={ts(20, NAVY, { flex: 1 })}>{virtueName}</Text>
              <Text style={ts(26, c.color)}>{Math.round(s.global ?? 0)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: BEIGE }}>
                <Text style={versalita(11)}>Aspecto pasivo</Text>
                <Text style={tb(14, NAVY, 500)}>
                  {passiveName} — {Math.round(s.passive ?? 0)}%
                </Text>
              </View>
              <View style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: BEIGE }}>
                <Text style={versalita(11)}>Aspecto activo</Text>
                <Text style={tb(14, NAVY, 500)}>
                  {activeName} — {Math.round(s.active ?? 0)}%
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
        <BotonDorado onPress={onContinue} padV={18} padH={40}>
          Continuar →
        </BotonDorado>
      </View>
    </Tarjeta>
  );
}

const LIKERT_CARACTER: Likert[] = [
  { key: 'sa', value: 1, label: 'Totalmente de acuerdo' },
  { key: 'a', value: 0.5, label: 'De acuerdo' },
  { key: 'n', value: 0, label: 'Neutral' },
  { key: 'd', value: -0.5, label: 'En desacuerdo' },
  { key: 'sd', value: -1, label: 'Totalmente en desacuerdo' },
];

function canonicas(respuestas: number[]) {
  const canonical = new Array(CT.questions.length).fill(0);
  for (let i = 0; i < respuestas.length; i++) canonical[CHAR_CANONICAL[i]] = respuestas[i] ?? 0;
  return canonical;
}

export function TestCaracterFormacion({ paso, onComplete }: { paso: any; onComplete: (r: any) => void }) {
  const [fase, setFase] = useState('caratula');
  const [answers, setAnswers] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [milestone, setMilestone] = useState<{ virtueCode: string; pct: number } | null>(null);

  const scoreResult = useMemo(() => (fase !== 'resultado' ? null : scoreCharacter(canonicas(answers), CT)), [fase, answers]);

  function handleStart() {
    setAnswers([]);
    setIdx(0);
    setMilestone(null);
    setFase('preguntas');
  }

  function handleAnswer(value: number) {
    const next = [...answers];
    next[idx] = value;
    setAnswers(next);

    const total = CHAR_CANONICAL.length;
    const nextIdx = idx + 1;

    const cutoffIdx = CHAR_CUMULATIVE.indexOf(nextIdx);
    if (cutoffIdx >= 0 && cutoffIdx < CHAR_CUMULATIVE.length - 1) {
      const virtueCode = CHAR_VIRTUE_ORDER[cutoffIdx];
      const res: any = scoreCharacter(canonicas(next), CT);
      const pct = res?.[virtueCode]?.global ?? 0;
      setMilestone({ virtueCode, pct });
      return;
    }

    if (nextIdx < total) {
      setIdx(nextIdx);
    } else {
      setFase('resultado');
      const result = scoreCharacter(canonicas(next), CT);
      void saveCharacterResultIfLoggedIn(result);
    }
  }

  function handleMilestoneContinue() {
    setMilestone(null);
    setIdx(idx + 1);
  }

  function handleBack() {
    if (idx > 0 && !milestone) setIdx(idx - 1);
  }

  if (fase === 'caratula') return <Caratula paso={{ ...paso, descripcion: paso.descripcion }} tipo="test_caracter" modulo={null} onEmpezar={handleStart} />;

  if (fase === 'resultado' && scoreResult) return <CharResultSummary scoreResult={scoreResult} onContinue={() => onComplete({ scoreResult })} />;

  const item = CT.questions[CHAR_CANONICAL[idx]];
  const text = item.text?.es || item.text?.en || '';
  const total = CHAR_CANONICAL.length;

  return (
    <>
      <PreguntaLikert
        titulo="Test de carácter"
        idx={idx}
        total={total}
        texto={text}
        opciones={LIKERT_CARACTER}
        puedeVolver={idx > 0 && !milestone}
        onBack={handleBack}
        onAnswer={handleAnswer}
      />
      {milestone && (
        <Hito
          etiqueta="Virtud completada"
          face={CHAR_FACES[milestone.virtueCode]}
          nombre={resolveCharSupport(CS.labels, `chResult${milestone.virtueCode}`)}
          color={CHAR_COLORS[milestone.virtueCode].color}
          pct={milestone.pct}
          texto="Esta puntuación refleja tu estado actual en esta virtud. Las virtudes se desarrollan con la práctica."
          onContinue={handleMilestoneContinue}
        />
      )}
    </>
  );
}

/* ─── TEST DEL CORAZÓN (inline en formación, curso 5) ─── */

const HEART_STAGE_COLORS: Record<string, string> = { none: '#10b981', stage1: '#f59e0b', stage2: '#ef4444' };
const HEART_STAGE_LABELS: Record<string, string> = { none: 'Sin inclinación', stage1: 'Cierta inclinación', stage2: 'Fuerte inclinación' };

function resolveHeartLabel(key: string): string {
  const entry = HS?.labels?.[key];
  if (!entry) return '';
  return entry.es || entry.en || '';
}

function HeartResultSummary({ scoreResult, onContinue }: { scoreResult: any; onContinue: () => void }) {
  const balanced = scoreResult.verdict === 'balanced';

  return (
    <Tarjeta>
      <View style={{ paddingTop: 12, paddingBottom: 8 }}>
        <Medalla fondo={balanced ? VERDE.bg : BEIGE} borde={balanced ? VERDE.borde : GOLD_REF} color={balanced ? VERDE.texto : GOLD_REF_DK}>
          ♡
        </Medalla>
      </View>
      <Text style={ts(26, NAVY, { marginTop: 14, marginBottom: 8, textAlign: 'center' })}>{balanced ? 'Corazón equilibrado' : 'Tu perfil del corazón'}</Text>
      <Text style={tb(16, MUTED, 400, { textAlign: 'center', marginBottom: 24, lineHeight: lh(16, 1.6) })}>
        {balanced
          ? 'No se detectan inclinaciones marcadas hacia ninguna enfermedad espiritual. Podrás consultarlo en tu panel.'
          : 'Aquí tienes tu resultado en las ocho enfermedades espirituales. Podrás consultarlo en tu panel.'}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {(HEART_DISORDER_CODES as string[]).map((code) => {
          const d = scoreResult.disorders[code];
          const stageColor = HEART_STAGE_COLORS[d.stage];
          const name = resolveHeartLabel(d.label_key);
          return (
            <View
              key={code}
              style={{ flexBasis: '45%', flexGrow: 1, backgroundColor: PAPER, borderWidth: 1, borderColor: LINE, borderTopWidth: 3, borderTopColor: stageColor, paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden', marginBottom: 10, borderWidth: 2, borderColor: stageColor, backgroundColor: BEIGE }}>
                <Image source={HEART_FACES[code]} accessibilityLabel={name} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
              <Text style={ts(28, stageColor, { lineHeight: 30 })}>{Math.round(d.pct)}%</Text>
              <Text style={[versalita(11, NAVY, 600), { marginTop: 8, textAlign: 'center' }]}>{name}</Text>
              <Text style={tb(11, MUTED, 400, { marginTop: 4 })}>{HEART_STAGE_LABELS[d.stage]}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 8 }}>
        <BotonDorado onPress={onContinue} padV={18} padH={40}>
          Continuar →
        </BotonDorado>
      </View>
    </Tarjeta>
  );
}

const LIKERT_CORAZON: Likert[] = [
  { key: 'sa', value: 4, label: 'Totalmente de acuerdo' },
  { key: 'a', value: 3, label: 'De acuerdo' },
  { key: 'n', value: 2, label: 'Neutral' },
  { key: 'd', value: 1, label: 'En desacuerdo' },
  { key: 'sd', value: 0, label: 'Totalmente en desacuerdo' },
];

export function TestCorazonFormacion({ paso, onComplete }: { paso: any; onComplete: (r: any) => void }) {
  const [fase, setFase] = useState('caratula');
  const [answers, setAnswers] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [milestone, setMilestone] = useState<{ disorderCode: string; pct: number } | null>(null);

  const questions: any[] = HT.questions;
  const total = questions.length;

  const scoreResult = useMemo(() => (fase !== 'resultado' ? null : scoreHeart(answers, HT)), [fase, answers]);

  function handleStart() {
    setAnswers([]);
    setIdx(0);
    setMilestone(null);
    setFase('preguntas');
  }

  function handleAnswer(value: number) {
    const next = [...answers];
    next[idx] = value;
    setAnswers(next);

    const nextIdx = idx + 1;

    if (nextIdx % 4 === 0 && nextIdx < total) {
      const disorderIdx = Math.floor(idx / 4);
      const disorder = HT.disorders[disorderIdx];
      if (disorder) {
        let score = 0;
        for (let i = disorderIdx * 4; i < disorderIdx * 4 + 4; i++) score += next[i] ?? 0;
        const pct = Math.round((score / 16) * 100);
        setMilestone({ disorderCode: disorder.code, pct });
        return;
      }
    }

    if (nextIdx < total) {
      setIdx(nextIdx);
    } else {
      setFase('resultado');
      const result = scoreHeart(next, HT);
      void saveHeartResultIfLoggedIn(result);
    }
  }

  function handleMilestoneContinue() {
    setMilestone(null);
    const nextIdx = idx + 1;
    if (nextIdx < total) {
      setIdx(nextIdx);
    } else {
      const result = scoreHeart(answers, HT);
      void saveHeartResultIfLoggedIn(result);
      setFase('resultado');
    }
  }

  function handleBack() {
    if (idx > 0 && !milestone) setIdx(idx - 1);
  }

  if (fase === 'caratula') return <Caratula paso={{ ...paso, descripcion: paso.descripcion }} tipo="test_corazon" modulo={null} onEmpezar={handleStart} />;

  if (fase === 'resultado' && scoreResult) return <HeartResultSummary scoreResult={scoreResult} onContinue={() => onComplete({ scoreResult })} />;

  const item = questions[idx];
  const text = item.text?.es || item.text?.en || '';
  const hitoColor = milestone ? (milestone.pct >= 66 ? HEART_STAGE_COLORS.stage2 : milestone.pct >= 33 ? HEART_STAGE_COLORS.stage1 : HEART_STAGE_COLORS.none) : '';

  return (
    <>
      <PreguntaLikert
        titulo="Test del corazón"
        idx={idx}
        total={total}
        texto={text}
        opciones={LIKERT_CORAZON}
        puedeVolver={idx > 0 && !milestone}
        onBack={handleBack}
        onAnswer={handleAnswer}
      />
      {milestone && (
        <Hito
          etiqueta="Bloque completado"
          face={HEART_FACES[milestone.disorderCode]}
          nombre={resolveHeartLabel(`hResult${milestone.disorderCode}`)}
          color={hitoColor}
          pct={milestone.pct}
          texto="Al finalizar el test podrás ver el diagnóstico y remedio de cada enfermedad."
          onContinue={handleMilestoneContinue}
        />
      )}
    </>
  );
}
