/**
 * Validación de los JSON que devuelve el modelo (contratos del 02). El orquestador solo
 * persiste lo que pasa por aquí; si falla, repite una vez con MENSAJE_REINTENTO.
 * Sin dependencias: lo mismo corre en Deno, en la app y en los tests.
 */
import { OBSTACULOS, TEMPERAMENTOS, VIRTUDES_CLAVE, type Niveles, type Temperamento } from './tipos.ts';

export type Validacion<T> = { ok: true; valor: T } | { ok: false; error: string };

export interface PerfilJson {
  temperamento_dominante: Temperamento;
  temperamento_secundario: Temperamento | null;
  confianza_temperamento: number;
  mision: string | null;
  escenarios: { etiqueta: string; disparador: string; personas: { token: string; rol: string }[] }[];
  niveles: Niveles;
  notas: string | null;
}

export interface MananaJson {
  reto: string;
  porque: string;
  reto_id: string;
}

export interface ExamenJson {
  reto_id: string | null;
  resultado: 'si' | 'a_medias' | 'no' | 'sin_respuesta';
  tipo_fallo: 'reaccion' | 'decision' | null;
  nota_usuario: string | null;
  dia: {
    resumen: string | null;
    personas_nuevas: { token: string; rol: string }[];
    personas_mencionadas: string[];
    obstaculos_detectados: string[];
  };
  manana: { situacion: string | null; disparador: string | null; personas: string[] };
  reto_manana: { reto_id: string; texto_final: string; virtud: string; fue_reescrito_por_usuario: boolean };
  paso_alcanzado: number;
  senal_crisis: boolean;
}

export interface CrisisJson {
  nivel: 'ninguno' | 'atencion' | 'crisis';
  motivo: string | null;
}

/** Extrae el primer objeto JSON de la respuesta (tolera espacios o un bloque ``` por si acaso). */
export function parsearJson(texto: string): Validacion<unknown> {
  const t = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const i = t.indexOf('{');
  const j = t.lastIndexOf('}');
  if (i < 0 || j <= i) return { ok: false, error: 'la respuesta no contiene un objeto JSON' };
  try {
    return { ok: true, valor: JSON.parse(t.slice(i, j + 1)) };
  } catch (e) {
    return { ok: false, error: `JSON mal formado: ${(e as Error).message}` };
  }
}

// ── utilidades ─────────────────────────────────────────────────────────────────
type O = Record<string, unknown>;
const esObj = (x: unknown): x is O => typeof x === 'object' && x !== null && !Array.isArray(x);
const esTexto = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;
const textoONull = (x: unknown) => x === null || x === undefined || typeof x === 'string';
const normNull = (x: unknown) => (x === 'null' || x === undefined ? null : x);
const TOKEN = /^\[(P|ORG|L|F)\d+\]$/;
const esToken = (x: unknown): x is string => typeof x === 'string' && TOKEN.test(x);

class Error400 extends Error {}
function exigir(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error400(msg);
}
function envolver<T>(f: () => T): Validacion<T> {
  try {
    return { ok: true, valor: f() };
  } catch (e) {
    if (e instanceof Error400) return { ok: false, error: e.message };
    throw e;
  }
}

/**
 * ¿Hay palabras con mayúscula que no empiezan frase y no son tokens? Sirve para comprobar
 * que una salida del modelo solo contiene tokens (02 §5, caso 7). `permitidos`: palabras que
 * pueden ir en mayúscula (p. ej. «Dios»).
 */
export function contieneNombresSinToken(texto: string, permitidos: string[] = []): boolean {
  const permit = new Set(permitidos.map((p) => p.toLowerCase()));
  for (const frase of texto.replace(/\[(P|ORG|L|F)\d+\]/g, ' ').split(/[.!?¿¡:;\n"«»]+/)) {
    for (const palabra of frase.trim().split(/\s+/).slice(1)) {
      const w = palabra.replace(/[^\p{L}]/gu, '');
      if (/^\p{Lu}\p{Ll}{2,}$/u.test(w) && !permit.has(w.toLowerCase())) return true;
    }
  }
  return false;
}

// ── PERFIL (onboarding) ───────────────────────────────────────────────────────
export function validarPerfil(json: unknown, catalogoDisparadores: Set<string>): Validacion<PerfilJson> {
  return envolver(() => {
    exigir(esObj(json), 'el perfil debe ser un objeto');
    const dom = json.temperamento_dominante;
    exigir(TEMPERAMENTOS.includes(dom as Temperamento), 'temperamento_dominante no válido');
    const sec = normNull(json.temperamento_secundario);
    exigir(sec === null || TEMPERAMENTOS.includes(sec as Temperamento), 'temperamento_secundario no válido');
    const conf = Number(json.confianza_temperamento);
    exigir(Number.isFinite(conf) && conf >= 0 && conf <= 1, 'confianza_temperamento debe estar entre 0 y 1');
    exigir(textoONull(json.mision), 'mision debe ser texto o null');
    exigir(Array.isArray(json.escenarios), 'escenarios debe ser una lista');
    const escenarios = (json.escenarios as unknown[]).map((e, i) => {
      exigir(esObj(e) && esTexto(e.etiqueta), `escenarios[${i}].etiqueta vacía`);
      const disp = typeof e.disparador === 'string' && catalogoDisparadores.has(e.disparador) ? e.disparador : 'sin_disparador';
      const personas = Array.isArray(e.personas) ? e.personas : [];
      return {
        etiqueta: e.etiqueta as string,
        disparador: disp,
        personas: personas.map((p: unknown, k: number) => {
          exigir(esObj(p) && esToken(p.token), `escenarios[${i}].personas[${k}].token no es un token`);
          return { token: p.token as string, rol: typeof p.rol === 'string' ? p.rol : 'otro' };
        }),
      };
    });
    exigir(esObj(json.niveles), 'niveles debe ser un objeto');
    const niveles = {} as Niveles;
    for (const v of VIRTUDES_CLAVE) {
      const n = Number((json.niveles as O)[v]);
      exigir(Number.isFinite(n) && n >= 1 && n <= 5, `niveles.${v} debe estar entre 1 y 5`);
      niveles[v] = n;
    }
    exigir(textoONull(json.notas), 'notas debe ser texto o null');
    return {
      temperamento_dominante: dom as Temperamento,
      temperamento_secundario: sec as Temperamento | null,
      confianza_temperamento: conf,
      mision: (normNull(json.mision) as string | null) ?? null,
      escenarios,
      niveles,
      notas: (normNull(json.notas) as string | null) ?? null,
    };
  });
}

// ── MAÑANA ────────────────────────────────────────────────────────────────────
export function validarManana(json: unknown, retoId: string): Validacion<MananaJson> {
  return envolver(() => {
    exigir(esObj(json), 'la respuesta debe ser un objeto');
    exigir(esTexto(json.reto), 'reto vacío');
    exigir(esTexto(json.porque), 'porque vacío');
    exigir(json.reto_id === retoId, `reto_id debe ser ${retoId}`);
    const reto = (json.reto as string).trim();
    const porque = (json.porque as string).trim();
    exigir(reto.split(/\s+/).length < 30, 'el reto debe caber en una frase de menos de 30 palabras');
    exigir(porque.split(/\s+/).length < 20, 'la línea de porqué debe tener menos de 20 palabras');
    return { reto, porque, reto_id: retoId };
  });
}

// ── EXAMEN (noche) ────────────────────────────────────────────────────────────
const RESULTADOS = ['si', 'a_medias', 'no', 'sin_respuesta'];

/**
 * @param idsCandidatos  ids enviados al modelo; reto_manana.reto_id debe ser uno de ellos.
 * @param parcial        extracción previa al paso 5: solo importa `manana` (no hay candidatos aún).
 */
export function validarExamen(
  json: unknown,
  opciones: { retoIdHoy: string | null; idsCandidatos: string[]; catalogoDisparadores: Set<string>; parcial?: boolean },
): Validacion<ExamenJson> {
  return envolver(() => {
    exigir(esObj(json), 'el examen debe ser un objeto');
    if (json.senal_crisis === true) {
      // Con señal de crisis se descarta todo lo demás: no se valida nada más.
      return { ...vacio(opciones.retoIdHoy), senal_crisis: true };
    }
    const resultado = normNull(json.resultado) ?? 'sin_respuesta';
    exigir(RESULTADOS.includes(resultado as string), 'resultado no válido');
    const tipoFallo = normNull(json.tipo_fallo);
    exigir(tipoFallo === null || tipoFallo === 'reaccion' || tipoFallo === 'decision', 'tipo_fallo no válido');
    exigir(textoONull(normNull(json.nota_usuario)), 'nota_usuario debe ser texto o null');

    const dia = esObj(json.dia) ? json.dia : {};
    const personasNuevas = (Array.isArray(dia.personas_nuevas) ? dia.personas_nuevas : []).map((p: unknown, i: number) => {
      exigir(esObj(p) && esToken(p.token), `dia.personas_nuevas[${i}].token no es un token`);
      return { token: p.token as string, rol: typeof p.rol === 'string' ? p.rol : 'otro' };
    });
    const mencionadas = (Array.isArray(dia.personas_mencionadas) ? dia.personas_mencionadas : []).filter(esToken);
    // Solo los siete obstáculos del método: un texto inventado no entra al motor ni a la base de datos.
    const obstaculos = [...new Set(Array.isArray(dia.obstaculos_detectados) ? dia.obstaculos_detectados : [])].filter(
      (o: unknown): o is string => typeof o === 'string' && (OBSTACULOS as readonly string[]).includes(o),
    );

    exigir(esObj(json.manana), 'falta manana');
    const m = json.manana;
    const dispM = normNull(m.disparador);
    const manana = {
      situacion: (normNull(m.situacion) as string | null) ?? null,
      disparador: typeof dispM === 'string' && opciones.catalogoDisparadores.has(dispM) ? dispM : null,
      personas: (Array.isArray(m.personas) ? m.personas : []).filter(esToken),
    };

    let retoManana = { reto_id: '', texto_final: '', virtud: '', fue_reescrito_por_usuario: false };
    if (!opciones.parcial) {
      exigir(esObj(json.reto_manana), 'falta reto_manana');
      const r = json.reto_manana;
      exigir(
        typeof r.reto_id === 'string' && opciones.idsCandidatos.includes(r.reto_id),
        `reto_manana.reto_id debe ser uno de los candidatos: ${opciones.idsCandidatos.join(', ')}`,
      );
      exigir(esTexto(r.texto_final), 'reto_manana.texto_final vacío');
      retoManana = {
        reto_id: r.reto_id as string,
        texto_final: (r.texto_final as string).trim(),
        virtud: typeof r.virtud === 'string' ? r.virtud : '',
        fue_reescrito_por_usuario: r.fue_reescrito_por_usuario === true,
      };
    }
    const paso = Number(json.paso_alcanzado);
    return {
      reto_id: opciones.retoIdHoy,
      resultado: resultado as ExamenJson['resultado'],
      tipo_fallo: (resultado === 'si' ? null : tipoFallo) as ExamenJson['tipo_fallo'],
      nota_usuario: (normNull(json.nota_usuario) as string | null) ?? null,
      dia: {
        resumen: typeof dia.resumen === 'string' ? dia.resumen : null,
        personas_nuevas: personasNuevas,
        personas_mencionadas: mencionadas,
        obstaculos_detectados: obstaculos,
      },
      manana,
      reto_manana: retoManana,
      paso_alcanzado: Number.isFinite(paso) ? Math.min(5, Math.max(1, Math.round(paso))) : 1,
      senal_crisis: false,
    };
  });
}

function vacio(retoId: string | null): ExamenJson {
  return {
    reto_id: retoId,
    resultado: 'sin_respuesta',
    tipo_fallo: null,
    nota_usuario: null,
    dia: { resumen: null, personas_nuevas: [], personas_mencionadas: [], obstaculos_detectados: [] },
    manana: { situacion: null, disparador: null, personas: [] },
    reto_manana: { reto_id: '', texto_final: '', virtud: '', fue_reescrito_por_usuario: false },
    paso_alcanzado: 1,
    senal_crisis: false,
  };
}

// ── CRISIS ────────────────────────────────────────────────────────────────────
export function validarCrisis(json: unknown): Validacion<CrisisJson> {
  return envolver(() => {
    exigir(esObj(json), 'la clasificación debe ser un objeto');
    exigir(['ninguno', 'atencion', 'crisis'].includes(json.nivel as string), 'nivel no válido');
    return { nivel: json.nivel as CrisisJson['nivel'], motivo: (normNull(json.motivo) as string | null) ?? null };
  });
}
