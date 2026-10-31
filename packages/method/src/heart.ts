/**
 * Test «Corazón libre» oficial, portado de heartScoring.js.
 * 32 respuestas 0–4 (todas son síntomas); 8 tendencias de 4 preguntas.
 */
export const HEART_CODES = ['R', 'VR', 'VM', 'VI', 'VC', 'SV', 'SI', 'SC'] as const;
export type HeartCode = (typeof HEART_CODES)[number];
export type HeartStage = 'none' | 'stage1' | 'stage2';

export interface HeartTestData {
  thresholds?: { LOW_PCT: number; HIGH_PCT: number };
  disorders: { code: string; label_key: string; html_key: string; question_codes: string[] }[];
  questions: { code: string }[];
}

export const HEART_THRESHOLDS = { LOW_PCT: 33, HIGH_PCT: 66 } as const;

export function heartStage(p: number, t: { LOW_PCT: number; HIGH_PCT: number } = HEART_THRESHOLDS): HeartStage {
  if (p < t.LOW_PCT) return 'none';
  if (p < t.HIGH_PCT) return 'stage1';
  return 'stage2';
}

export interface HeartResult {
  disorders: Record<HeartCode, { score: number; pct: number; stage: HeartStage; labelKey: string; textKey: string }>;
  verdict: 'balanced' | 'has_stages';
  stage1: HeartCode[];
  stage2: HeartCode[];
}

export function scoreHeart(answers: (number | null | undefined)[] | null | undefined, test: HeartTestData): HeartResult {
  const t = test.thresholds ?? HEART_THRESHOLDS;
  const padded = test.questions.map((_, i) => {
    const v = answers?.[i];
    return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(4, Math.round(v))) : 0;
  });
  const idx = Object.fromEntries(test.questions.map((q, i) => [q.code, i]));
  const result: HeartResult = { disorders: {} as HeartResult['disorders'], verdict: 'balanced', stage1: [], stage2: [] };
  for (const d of test.disorders) {
    const score = d.question_codes.reduce((s, c) => s + (idx[c] != null ? padded[idx[c]] : 0), 0);
    const p = Math.round((score / 16) * 100 * 100) / 100;
    const stage = heartStage(p, t);
    const code = d.code as HeartCode;
    result.disorders[code] = { score, pct: p, stage, labelKey: d.label_key, textKey: d.html_key };
    if (stage === 'stage1') result.stage1.push(code);
    if (stage === 'stage2') result.stage2.push(code);
  }
  if (result.stage1.length || result.stage2.length) result.verdict = 'has_stages';
  return result;
}
