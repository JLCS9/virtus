// heartScoring.js — Motor de puntuación del Test del Corazón (modelo
// "Corazón Libre" de A. Havard, 8 enfermedades espirituales).
//
// PURO (no React, no i18n, no fetch). Recibe un array de 32 respuestas en
// escala Likert 0-4 (0 = totalmente en desacuerdo, 4 = totalmente de
// acuerdo — todas las afirmaciones son síntomas, misma dirección) y
// devuelve el score, % y stage por trastorno + veredicto global + los
// atributos aplanados listos para Brevo.
//
// Algoritmo:
//   1. Score por trastorno = suma de sus 4 items ∈ [0, 16].
//   2. % = (score / 16) × 100 ∈ [0, 100].
//   3. Stage:
//        pct <  LOW  → 'none'
//        pct >= LOW y pct < HIGH → 'stage1'
//        pct >= HIGH → 'stage2'
//   4. Veredicto global:
//        'balanced'   si NINGÚN trastorno alcanza al menos 'stage1'
//        'has_stages' en caso contrario
//
// Umbrales exportados como constantes — el JSON del test también los
// trae en meta.thresholds (fuente única en el ODS/extractor).

// ─────────────────────── umbrales ───────────────────────
// Defaults del briefing. Cambiarlos: aquí (rebuild) o inyectarlos en
// scoreHeart(answers, { thresholds: { LOW_PCT, HIGH_PCT } }) para
// experimentación sin rebuild.
export const HEART_THRESHOLD_LOW = 33;   // % debajo del cual → 'none'
export const HEART_THRESHOLD_HIGH = 66;  // % igual/por encima del cual → 'stage2'

// Orden semántico de los 8 trastornos — coincide con el ODS y con el
// orden visual en la pantalla de resultados.
export const HEART_DISORDER_CODES = ['R', 'VR', 'VM', 'VI', 'VC', 'SV', 'SI', 'SC'];

/**
 * Devuelve el stage para un % dado.
 * @param {number} pct — [0, 100]
 * @param {object} [thresholds] — {LOW_PCT, HIGH_PCT}, opcional override
 * @returns {'none'|'stage1'|'stage2'}
 */
export function stageForPct(pct, thresholds) {
  const low = thresholds?.LOW_PCT ?? HEART_THRESHOLD_LOW;
  const high = thresholds?.HIGH_PCT ?? HEART_THRESHOLD_HIGH;
  if (pct < low) return 'none';
  if (pct < high) return 'stage1';
  return 'stage2';
}

/**
 * Calcula scores del test del corazón.
 *
 * @param {Array<number>} answers — 32 valores enteros en {0,1,2,3,4}.
 *   Si llegan menos, se rellena con 0 (preguntas no contestadas =
 *   ausencia de síntoma). Si llegan más, se truncan.
 * @param {object} heartTest — JSON de character-test.json (necesita
 *   `disorders` y `questions` para conocer el mapeo idx → disorder).
 * @param {object} [options]
 * @param {object} [options.thresholds] — override de umbrales.
 * @returns {object}
 *   {
 *     disorders: {
 *       R: { code, score, pct, stage, label_key, html_key, question_codes },
 *       VR: {...}, ..., SC: {...}
 *     },
 *     verdict: 'balanced' | 'has_stages',
 *     stage2_codes: ['SV', 'VM', ...],   // los que están en stage2 (para HEART_TOP)
 *     stage1_codes: [...],
 *   }
 */
export function scoreHeart(answers, heartTest, options = {}) {
  const { disorders, questions } = heartTest;
  const N = questions.length;
  const thresholds = options.thresholds;

  // Normaliza input a longitud N con enteros 0..4.
  const padded = new Array(N).fill(0);
  for (let i = 0; i < Math.min(N, answers?.length || 0); i++) {
    const v = answers[i];
    if (typeof v === 'number' && Number.isFinite(v)) {
      padded[i] = Math.max(0, Math.min(4, Math.round(v)));
    }
  }

  // Índice: question_code → idx en el array de respuestas.
  const qIdxByCode = Object.fromEntries(questions.map((q, i) => [q.code, i]));

  const result = { disorders: {}, verdict: 'balanced', stage1_codes: [], stage2_codes: [] };

  for (const d of disorders) {
    // Suma de las 4 respuestas de este trastorno.
    let score = 0;
    for (const qCode of d.question_codes) {
      const idx = qIdxByCode[qCode];
      if (idx != null) score += padded[idx];
    }
    // Max posible = 4 preguntas × 4 puntos = 16.
    const pct = Math.round((score / 16) * 100 * 100) / 100; // 2 decimales
    const stage = stageForPct(pct, thresholds);

    result.disorders[d.code] = {
      code: d.code,
      score,
      pct,
      stage,
      label_key: d.label_key,
      html_key: d.html_key,
      question_codes: d.question_codes,
    };
    if (stage === 'stage1') result.stage1_codes.push(d.code);
    if (stage === 'stage2') result.stage2_codes.push(d.code);
  }

  // Veredicto: si ALGÚN trastorno está en stage1 o stage2 → has_stages.
  if (result.stage1_codes.length > 0 || result.stage2_codes.length > 0) {
    result.verdict = 'has_stages';
  }

  return result;
}

/**
 * Aplana el resultado de scoreHeart a los atributos que espera Brevo:
 * 8 × SCORE (0-16), 8 × STAGE (none|stage1|stage2), HEART_TOP (coma-
 * separado de codes en stage2), HEART_BALANCED (bool).
 *
 * @param {object} scoreResult — output de scoreHeart()
 * @returns {object} listo para POST /v3/contacts (attributes)
 */
export function toBrevoAttributes(scoreResult) {
  const out = {};
  for (const code of HEART_DISORDER_CODES) {
    const d = scoreResult.disorders[code];
    out[`HEART_${code}_SCORE`] = d.score;
    out[`HEART_${code}_STAGE`] = d.stage; // 'none' | 'stage1' | 'stage2'
  }
  out.HEART_TOP      = scoreResult.stage2_codes.join(',');
  out.HEART_BALANCED = scoreResult.verdict === 'balanced';
  return out;
}
