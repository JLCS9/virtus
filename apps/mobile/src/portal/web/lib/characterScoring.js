// characterScoring.js — Motor de puntuación del Test de Carácter
// (modelo de las 6 virtudes de A. Havard).
//
// PURO (no React, no i18n, no fetch). Recibe un vector de 68 respuestas en
// escala Likert [-1, -0.5, 0, +0.5, +1] y devuelve los porcentajes globales
// y por aspecto pasivo/activo de cada virtud.
//
// Algoritmo (determinista, derivado de la matriz del Excel oficial — ver
// scripts/extract-character-xlsx.py para validación cruzada):
//
//   1. Suma cruda por faceta = Σ (respuesta_i × peso_i,faceta) sobre 68 ítems.
//      Una misma pregunta puede sumar a varias facetas (de ahí matriz, no
//      contador simple).
//   2. Normalizada = suma_cruda / denominador_faceta  ∈ [-1, +1].
//   3. % faceta = (normalizada + 1) / 2 × 100  ∈ [0, 100].
//   4. % global de virtud = ((suma_cruda_pasiva + suma_cruda_activa) /
//      (denom_pasiva + denom_activa) + 1) / 2 × 100.
//      Equivale a una media ponderada por número de pesos (más ítems → más peso).
//
// Los denominadores se leen del JSON; coinciden por construcción con la
// suma real de pesos del Excel (lo verifica el script de extracción).

// ──────────────────────────── umbrales de stage ────────────────────────────
// Para mapear cada % a una etiqueta cualitativa (chResultVirtueStage0/1/2 en
// support_text). El Excel no fija umbrales, así que usamos defaults
// razonables; ajustables aquí sin tocar UI.
export const STAGE_THRESHOLDS = {
  LOW_MAX: 40,       // < 40  → stage 0 (low)
  MODERATE_MAX: 70,  // < 70  → stage 1 (moderate)
                     // ≥ 70  → stage 2 (high)
};

/**
 * Devuelve la clave i18n del stage en support_text según el % global.
 * @param {number} percent — [0, 100]
 * @returns {'chResultVirtueStage0'|'chResultVirtueStage1'|'chResultVirtueStage2'}
 */
export function getStageKey(percent) {
  if (percent < STAGE_THRESHOLDS.LOW_MAX) return 'chResultVirtueStage0';
  if (percent < STAGE_THRESHOLDS.MODERATE_MAX) return 'chResultVirtueStage1';
  return 'chResultVirtueStage2';
}

/**
 * Calcula los porcentajes de cada virtud a partir de las 68 respuestas.
 *
 * @param {Array<number>} answers — 68 valores en {-1, -0.5, 0, 0.5, 1}.
 *   Si llegan menos de 68, se rellena con 0 (preguntas no contestadas =
 *   neutras, no penaliza). Si llegan más se truncan.
 * @param {object} characterTest — JSON cargado de character-test.json.
 *   Espera las propiedades: questions (con weights[12]), facets (con
 *   {key, virtue, role, denominator}), virtues (con {code, denominator,
 *   passive_facet, active_facet}).
 * @returns {object} mapping virtue_code → { global, passive, active,
 *   passive_facet_key, active_facet_key, stage_key }.
 *   Cada porcentaje es number ∈ [0, 100] con 2 decimales; null si el
 *   denominador es 0 (defensivo, no debería ocurrir con datos válidos).
 */
export function scoreCharacter(answers, characterTest) {
  const { questions, facets, virtues } = characterTest;
  const N = questions.length;

  // Normaliza el input: longitud exacta, valores numéricos o 0.
  const padded = new Array(N).fill(0);
  for (let i = 0; i < Math.min(N, answers?.length || 0); i++) {
    const v = answers[i];
    padded[i] = typeof v === 'number' && Number.isFinite(v) ? v : 0;
  }

  // Paso 1: suma cruda por faceta (vector × matriz).
  const facetRaw = new Array(facets.length).fill(0);
  for (let q = 0; q < N; q++) {
    const ans = padded[q];
    if (ans === 0) continue; // optimización: 0 no aporta
    const w = questions[q].weights;
    for (let f = 0; f < facets.length; f++) {
      facetRaw[f] += ans * w[f];
    }
  }

  // Pasos 2 + 3: % por faceta = ((raw / denom) + 1) / 2 × 100.
  const pctFromRaw = (raw, denom) => {
    if (!denom) return null;
    const norm = raw / denom;
    return Math.round(((norm + 1) / 2) * 100 * 100) / 100; // 2 decimales
  };

  // Mapa key faceta → índice (para lookup O(1) por virtud).
  const facetIdx = Object.fromEntries(facets.map((f, i) => [f.key, i]));

  // Paso 4: por virtud, % global ponderado + recupera % passive/active.
  const result = {};
  for (const v of virtues) {
    const ip = facetIdx[v.passive_facet];
    const ia = facetIdx[v.active_facet];
    const rawP = facetRaw[ip];
    const rawA = facetRaw[ia];
    const denomP = facets[ip].denominator;
    const denomA = facets[ia].denominator;

    const passive = pctFromRaw(rawP, denomP);
    const active = pctFromRaw(rawA, denomA);
    const global = pctFromRaw(rawP + rawA, denomP + denomA);

    result[v.code] = {
      global,
      passive,
      active,
      passive_facet_key: facets[ip].label_key, // p.ej. 'chResultP1'
      active_facet_key:  facets[ia].label_key,
      virtue_label_key:  v.label_key,          // p.ej. 'chResultP'
      virtue_html_key:   v.html_key,           // p.ej. '1-prudence.html'
      stage_key: global == null ? null : getStageKey(global),
    };
  }
  return result;
}

/**
 * Aplana el resultado de scoreCharacter a los 18 atributos esperados por
 * Brevo (P_GLOBAL, P_PASSIVE, P_ACTIVE, ..., H_ACTIVE).
 *   - Valores enteros (Brevo NUMBER tolera decimales, pero los enteros
 *     son más legibles en su interfaz).
 *   - Si algún % es null, se manda 0 (fallback defensivo).
 *
 * @param {object} scoreResult — output de scoreCharacter()
 * @returns {object} { P_GLOBAL: number, P_PASSIVE: number, ... }
 */
export function toBrevoAttributes(scoreResult) {
  const out = {};
  for (const code of Object.keys(scoreResult)) {
    const s = scoreResult[code];
    out[`${code}_GLOBAL`]  = Math.round(s.global  ?? 0);
    out[`${code}_PASSIVE`] = Math.round(s.passive ?? 0);
    out[`${code}_ACTIVE`]  = Math.round(s.active  ?? 0);
  }
  return out;
}
