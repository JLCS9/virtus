// Lógica pura del Camino diario: qué contenido es válido, qué reto y qué cita tocan hoy y cómo se
// rellenan las variables. Sin React ni red: el contenido llega de src/data/camino-biblioteca.json y
// los datos del usuario (variables, días anteriores) los pasa quien llame.
//
// Convenciones: `fecha` es la fecha local del usuario, 'YYYY-MM-DD' (se comparan como texto).
// `historial` son las filas de camino_dia de ese usuario: { fecha, reto_id, cita_id }.

export const TEMPS = ['COL', 'MEL', 'SAN', 'FLE'];

// A, B y C del Excel: con una persona, un hábito, una situación.
export const ORDEN_OPCIONES = ['persona', 'habito', 'situacion'];

// ───────────── Validación del contenido ─────────────

/** ¿Se puede enseñar este reto, cita o pregunta? Solo «aprobado»; en desarrollo, también «pendiente». */
export const esValido = (item, { incluirPendientes = false } = {}) =>
  item.validacion === 'aprobado' || (incluirPendientes && item.validacion === 'pendiente');

export const filtrarValidos = (lista, opciones) => lista.filter((item) => esValido(item, opciones));

// ───────────── Variables ─────────────

const limpio = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
const LLAVES = /\{(\w+)\}/g;

/** { variable: textoPorDefecto } a partir de la lista `variables` de la biblioteca. */
export const defectosDe = (variables) => Object.fromEntries(variables.map((v) => [v.id, v.defecto]));

/**
 * Sustituye {variable} por la respuesta del usuario; si está vacía, por el texto por defecto. Una
 * variable que no existe en ninguno de los dos se deja tal cual ({nombre}): es un fallo de contenido
 * que las pruebas de la biblioteca detectan, y mejor verlo que borrarlo en silencio.
 */
export function sustituir(texto, valores = {}, defectos = {}) {
  return texto.replace(LLAVES, (llave, nombre) => limpio(valores[nombre]) || limpio(defectos[nombre]) || llave);
}

/**
 * Valores de las variables del usuario a partir de sus filas de camino_variables
 * ({ variable, valor, persona_id }). Si la variable apunta a una ficha de «Tu entorno» que sigue
 * existiendo, se usa su nombre actual (si la renombra, el reto lo refleja); si la ficha se borró, se
 * conserva el texto guardado. Las vacías no entran: usarán el texto por defecto.
 */
export function valoresDe(filas = [], personasPorId = {}) {
  const valores = {};
  for (const f of filas) {
    const v = limpio(f.persona_id ? personasPorId[f.persona_id]?.nombre : '') || limpio(f.valor);
    if (v) valores[f.variable] = v;
  }
  return valores;
}

/** Las tres opciones del reto ya con las variables sustituidas: [{ clave, texto }] en orden A, B, C. */
export const opcionesDelReto = (reto, valores, defectos) =>
  ORDEN_OPCIONES.map((clave) => ({ clave, texto: sustituir(reto.opciones[clave], valores, defectos) }));

// ───────────── Preguntas iniciales ─────────────

/** Las preguntas iniciales válidas del temperamento primario, en su orden. */
export const preguntasIniciales = (preguntas, primario, opciones) =>
  filtrarValidos(preguntas, opciones)
    .filter((p) => p.temperamento === primario)
    .sort((a, b) => a.orden - b.orden);

/** Las que aún no tienen fila en camino_variables (aunque la respuesta fuera «saltar»). */
export const preguntasPendientes = (preguntas, respondidas) => preguntas.filter((p) => !respondidas.has(p.variable));

// ───────────── Temperamento ─────────────

/** 'SAN-COL' → { primario: 'SAN', secundario: 'COL' }; 'COL' → { primario: 'COL', secundario: null }. */
export function partesTemperamento(clave) {
  const [primario, secundario] = String(clave ?? '').split('-');
  if (!TEMPS.includes(primario)) return null;
  return { primario, secundario: TEMPS.includes(secundario) && secundario !== primario ? secundario : null };
}

// ───────────── Reto del día ─────────────

const porFecha = (a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);

// El que lleva más tiempo sin salir (o nunca ha salido). Con empate, el primero de la biblioteca.
function masAntiguo(candidatos, idsEnOrden) {
  return candidatos.reduce((mejor, c) => (idsEnOrden.lastIndexOf(c.id) < idsEnOrden.lastIndexOf(mejor.id) ? c : mejor));
}

/**
 * El reto de hoy. `retos` son los válidos (ver `filtrarValidos`); `clave` es el temperamento del
 * usuario ('SAN-COL'). Reglas:
 *  · Si hoy ya tiene reto en el historial, es ese: no cambia durante el día.
 *  · Mixtos: dos de cada tres días con reto, uno del primario; el tercero, del secundario.
 *  · Dentro del temperamento: en el orden de la biblioteca, sin repetir hasta agotarlos; después,
 *    el que lleva más tiempo sin salir.
 *  · Si el temperamento que toca no tiene retos válidos, se usa el otro. Sin ninguno: null.
 * `excluir` son los ids ya propuestos hoy y rechazados («Proponme otro»): se salta esos y, si no queda
 * ninguno, vuelve a empezar. Con exclusiones la fila de hoy deja de fijar el reto: se está buscando otro.
 * Es determinista: la misma entrada da siempre el mismo reto.
 */
export function retoDelDia({ retos, clave, historial = [], fecha, excluir = [] }) {
  const hoy = historial.find((h) => h.fecha === fecha && h.reto_id);
  const fijado = hoy && !excluir.length && retos.find((r) => r.id === hoy.reto_id);
  if (fijado) return fijado;

  const partes = partesTemperamento(clave);
  if (!partes) return null;

  const previos = historial.filter((h) => h.fecha < fecha && h.reto_id).sort(porFecha);
  const toca = partes.secundario && previos.length % 3 === 2 ? partes.secundario : partes.primario;
  const idsEnOrden = previos.map((h) => h.reto_id);

  for (const t of new Set([toca, partes.primario, partes.secundario])) {
    if (!t) continue;
    const pool = retos.filter((r) => r.temperamento === t && !excluir.includes(r.id));
    if (pool.length) return masAntiguo(pool, idsEnOrden);
  }
  // Se han propuesto todos y ninguno se aceptó: se vuelve a empezar.
  return excluir.length ? retoDelDia({ retos, clave, historial, fecha }) : null;
}

// ───────────── Cita del día ─────────────

/**
 * La cita de hoy. `citas` son las válidas. Entre las del `momento` (por defecto, la mañana) que
 * encajan con el reto o son libres, la que lleva más tiempo sin enseñarse al usuario (o nunca); con
 * empate, primero las sugeridas para ese reto y luego el orden de la biblioteca. Si hoy ya tiene
 * cita en el historial, es esa. Sin ninguna disponible: null (el reto se enseña igual).
 */
export function citaDelDia({ citas, reto, historial = [], fecha, momento = 'manana' }) {
  const hoy = historial.find((h) => h.fecha === fecha && h.cita_id);
  const fijada = hoy && citas.find((c) => c.id === hoy.cita_id);
  if (fijada) return fijada;

  const sugerida = (c) => Boolean(reto) && c.retos.includes(reto.id);
  const candidatas = citas.filter((c) => c.momento === momento && (sugerida(c) || c.libre));
  if (!candidatas.length) return null;

  const vistas = historial.filter((h) => h.fecha < fecha && h.cita_id).sort(porFecha).map((h) => h.cita_id);
  const rango = (c) => vistas.lastIndexOf(c.id) * 2 + (sugerida(c) ? 0 : 1);
  return candidatas.reduce((mejor, c) => (rango(c) < rango(mejor) ? c : mejor));
}

// ───────────── Noche ─────────────

export const CUMPLIDOS = ['si', 'a_medias', 'no'];

/**
 * Por dónde va el examen de la noche según lo guardado del día (`dia`, fila de camino_dia o null):
 *  · null          → aún no se ha elegido opción por la mañana: no hay examen que hacer.
 *  · 'cumplido'    → falta «¿lo hiciste?».
 *  · 'reflexion'   → ya dijo si lo hizo; faltan la reflexión y la pregunta para nutrir.
 *  · 'hecho'       → examen cerrado. Un día que se queda a medias no se retoma al día siguiente.
 */
export function pasoDeNoche(dia) {
  if (!dia?.opcion) return null;
  if (dia.examen_en) return 'hecho';
  return CUMPLIDOS.includes(dia.cumplido) ? 'reflexion' : 'cumplido';
}

/**
 * Lo que se guarda de la pregunta para nutrir: la variable que alimenta el reto y la respuesta
 * (sin espacios de más y en su máximo de 120). Respuesta vacía → {}: no se toca la variable.
 */
export function camposDeNutrir(reto, respuesta) {
  const valor = limpio(respuesta).slice(0, 120);
  return valor ? { nutrir_variable: reto.noche.variable, nutrir_respuesta: valor } : {};
}
