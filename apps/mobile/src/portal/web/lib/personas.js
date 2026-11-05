// Fichas de personas · «Descubre el temperamento de X». Lógica pura y textos. Sin React ni red.
// Fuente: «Camino · Semanas 0 y 1 — Especificación completa», sección Fichas de personas. Los
// textos son los de la especificación, sin reescribir.

export const TEMPS = ['COL', 'MEL', 'SAN', 'FLE'];

export const GRUPOS = [['familia', 'Familia'], ['amigos', 'Amigos'], ['trabajo', 'Trabajo o estudios'], ['comunidad', 'Comunidad']];
export const TEXTO_GRUPO = Object.fromEntries(GRUPOS);
/** Comunidad solo aparece para quien eligió «Religioso» como estado de vida. */
export const gruposPara = (estadoVida) => GRUPOS.filter(([g]) => g !== 'comunidad' || estadoVida === 'religioso');

export const RELACIONES = ['pareja', 'hijo', 'hija', 'padre', 'madre', 'hermano', 'hermana', 'amigo', 'amiga', 'jefe', 'compañero', 'profesor'];
export const AVATARES = ['🙂', '😊', '😎', '🧑', '👩', '👨', '🧓', '👵', '👴', '🧒', '⭐', '🌿'];

export const INTRO = (nombre) =>
  `Piensa en cómo reacciona ${nombre}, no en cómo es por fuera. Responde con lo primero que le sale, no con lo que ha aprendido a hacer.`;

export const NO_SE = 'nose';

// Las 8 preguntas: [pregunta, { COL, MEL, SAN, FLE }].
export const PREGUNTAS = [
  ['Cuando algo le sale mal…', { COL: 'Se enfada y quiere arreglarlo ya', MEL: 'Le da vueltas durante días', SAN: 'Lo cuenta a todos y al rato lo olvida', FLE: 'Apenas se altera' }],
  ['Ante una decisión importante…', { COL: 'Decide rápido y solo', MEL: 'Lo analiza todo y le cuesta decidir', SAN: 'Decide según el entusiasmo del momento', FLE: 'Lo aplaza o deja que decidan otros' }],
  ['Si le llevan la contraria…', { COL: 'Discute hasta convencer', MEL: 'Se lo toma a pecho y lo guarda', SAN: 'Salta, pero enseguida está como si nada', FLE: 'Cede para evitar el conflicto' }],
  ['En una comida o reunión con gente…', { COL: 'Lleva la conversación', MEL: 'Observa y habla a fondo con una persona', SAN: 'Anima, cuenta historias, conoce a todos', FLE: 'Está tranquilo y concilia' }],
  ['Cuando empieza un proyecto…', { COL: 'Lo lleva hasta el final, aunque atropelle', MEL: 'Lo planifica al detalle; le asusta equivocarse', SAN: 'Empieza con mucha ilusión y lo deja a medias', FLE: 'Es constante, pero espera a que se lo pidan' }],
  ['Cuando tiene un rato libre…', { COL: 'Busca algo útil que hacer', MEL: 'Lee, piensa o está a solas', SAN: 'Queda con gente o improvisa un plan', FLE: 'Descansa con su rutina de siempre' }],
  ['Cuando alguien cercano lo pasa mal…', { COL: 'Busca soluciones prácticas', MEL: 'Se conmueve y lo recuerda mucho tiempo', SAN: 'Le consuela con calidez, pero se distrae pronto', FLE: 'Escucha con paciencia y está ahí' }],
  ['Lo que más le cuesta es…', { COL: 'Escuchar y pedir perdón', MEL: 'Lanzarse y arriesgar', SAN: 'Terminar lo que empieza', FLE: 'Tomar la iniciativa' }],
];

// Desempate: rapidez y duración de la reacción.
export const DESEMPATE = {
  rapidez: { pregunta: (n) => `Cuando algo le afecta, ¿${n} reacciona rápido o tarda en reaccionar?`, opciones: [['rapido', 'Reacciona rápido'], ['lento', 'Tarda en reaccionar']] },
  duracion: { pregunta: () => '¿Le dura mucho o se le pasa pronto?', opciones: [['mucho', 'Le dura mucho'], ['pronto', 'Se le pasa pronto']] },
};
const POR_REACCION = { rapido: { mucho: 'COL', pronto: 'SAN' }, lento: { mucho: 'MEL', pronto: 'FLE' } };

/** Orden aleatorio de las cuatro respuestas de cada pregunta (se fija al empezar el test). */
export function ordenAleatorio(azar = Math.random) {
  return PREGUNTAS.map(() => {
    const o = [...TEMPS];
    for (let i = o.length - 1; i > 0; i -= 1) { const j = Math.floor(azar() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    return o;
  });
}

export function contarPuntos(respuestas) {
  const puntos = { COL: 0, MEL: 0, SAN: 0, FLE: 0 };
  for (const r of respuestas) if (puntos[r] !== undefined) puntos[r] += 1;
  return puntos;
}

/** Temperamentos empatados en cabeza (vacío si no hay ningún punto). */
export function empatados(puntos) {
  const max = Math.max(...TEMPS.map((k) => puntos[k]));
  return max > 0 ? TEMPS.filter((k) => puntos[k] === max) : [];
}

/** ¿Hacen falta las preguntas de desempate? Solo si hay empate en el primario y hay resultado. */
export const necesitaDesempate = (respuestas) =>
  respuestas.filter((r) => r === NO_SE).length < 4 && empatados(contarPuntos(respuestas)).length > 1;

/**
 * Puntuación de la especificación:
 *  - cada respuesta suma 1 punto a su temperamento; «No lo sé» suma 0;
 *  - primario: el de más puntos; si hay empate, decide el desempate (rapidez × duración); si sigue
 *    el empate, el que coincida con la respuesta a la pregunta 1;
 *  - secundario: el segundo con más puntos, solo si tiene 2 o más;
 *  - confianza alta: primario ≥5 y como mucho 1 «No lo sé»; media: primario con 4 o hasta 2 «No lo
 *    sé»; baja: el resto. Con 4 o más «No lo sé» no hay resultado.
 */
export function puntuar(respuestas, desempate = null) {
  const puntos = contarPuntos(respuestas);
  const noSe = respuestas.filter((r) => r === NO_SE).length;
  if (noSe >= 4) return { puntos, noSe, primario: null, secundario: null, confianza: null };

  const cabeza = empatados(puntos);
  let primario = cabeza[0];
  if (cabeza.length > 1) {
    const porReaccion = POR_REACCION[desempate?.rapidez]?.[desempate?.duracion];
    if (cabeza.includes(porReaccion)) primario = porReaccion;
    else if (cabeza.includes(respuestas[0])) primario = respuestas[0];
  }
  const resto = TEMPS.filter((k) => k !== primario).sort((a, b) => puntos[b] - puntos[a]);
  const secundario = puntos[resto[0]] >= 2 ? resto[0] : null;
  const p = puntos[primario];
  const confianza = p >= 5 && noSe <= 1 ? 'alta' : (p >= 4 && noSe <= 2) ? 'media' : 'baja';
  return { puntos, noSe, primario, secundario, confianza };
}

export const TEXTO_CONFIANZA = { alta: 'Confianza alta', media: 'Confianza media', baja: 'Confianza baja' };

// «parece de temperamento colérico» y no «parece colérico»: la ficha no guarda el sexo y así concuerda
// con cualquier nombre. Es el único cambio sobre el texto de la especificación.
export const textoResultado = (nombre, temperamento, lema) =>
  `Por lo que nos has contado, ${nombre} parece de temperamento ${temperamento}: ${lema}. Es una estimación; solo ${nombre} puede confirmarla haciendo el test.`;
export const textoSinResultado = (nombre) =>
  `Aún conoces poco cómo reacciona ${nombre}. Obsérvale esta semana y vuelve.`;

// Contenido de la ficha según el temperamento.
export const FICHA = {
  COL: { lema: 'la acción', facil: 'Decidir, emprender, mantener el rumbo, la energía', cuesta: 'Pedir consejo, escuchar, servir, controlar el orgullo y la ira', tratar: ['Dale objetivos claros y libertad', 'Si discrepas, trae datos, no ataques', 'Reconoce su energía antes de corregir'], virtud: 'Humildad' },
  MEL: { lema: 'las ideas', facil: 'Profundidad, constancia, fidelidad, soñar con valores nobles', cuesta: 'Decidir, arriesgar, salir de sí, el pesimismo', tratar: ['Pídele opinión antes de decidir, no después', 'Dale tiempo y datos', 'Ayúdale a dar el primer paso'], virtud: 'Audacia' },
  SAN: { lema: 'las personas', facil: 'Comunicar, empatía, espíritu de equipo, generosidad', cuesta: 'Terminar lo que empieza, profundizar, la estabilidad', tratar: ['Agradécele en público', 'Pídele cierres concretos con fecha', 'Canaliza su entusiasmo, no lo apagues'], virtud: 'Perseverancia' },
  FLE: { lema: 'la paz', facil: 'Equilibrio, calma en la tensión, paciencia, sentido del deber', cuesta: 'La iniciativa, arriesgar, la confrontación, ver sus talentos', tratar: ['Pídele su idea de forma explícita', 'Dale plazo, no prisa', 'Reconoce la constancia que nadie ve'], virtud: 'Magnanimidad' },
};

// Tú y [nombre]: describe la dinámica, nunca juzga a la persona. Clave: los dos, en orden alfabético.
const COMBINACIONES = {
  'COL-COL': 'Los dos vais a la acción. Juntos movéis montañas, pero podéis chocar por el mando: aclarad quién lidera qué.',
  'COL-MEL': 'Uno decide rápido; el otro necesita pensar. Con plazo, la reflexión mejora la decisión.',
  'COL-SAN': 'Os une la energía. Uno aporta dirección; el otro, relaciones. Cuidado: uno quiere terminar, el otro empezar algo nuevo.',
  'COL-FLE': 'Uno empuja, el otro sostiene. La calma no es desinterés: preguntad qué piensa el que calla.',
  'MEL-MEL': 'Os entendéis a fondo, pero os podéis contagiar el pesimismo. Alguien tiene que dar el primer paso.',
  'MEL-SAN': 'Uno saca al otro de sí mismo; el otro le da profundidad. Ni la ligereza ni la seriedad son defectos en sí.',
  'FLE-MEL': 'Calma y reflexión compartidas. El riesgo es que nadie decida: poned fechas.',
  'SAN-SAN': 'Mucha alegría y muchas ideas. Os falta quien cierre: hacedlo por turnos.',
  'FLE-SAN': 'Uno pone la chispa; el otro, la constancia. Sin prisas por un lado, sin apagar por el otro.',
  'FLE-FLE': 'Paz asegurada. El riesgo es la pasividad: alguien tiene que proponer.',
};
export function combinacion(a, b) {
  if (!a || !b) return null;
  return COMBINACIONES[[a, b].sort().join('-')] ?? null;
}

// ───────────── Observaciones ─────────────

export const SITUACIONES = [['critica', 'Le criticaron'], ['cambio_planes', 'Cambio de planes'], ['problema', 'Un problema'], ['buena_noticia', 'Una buena noticia'], ['desacuerdo', 'Un desacuerdo'], ['otro', 'Otro']];
export const TEXTO_SITUACION = Object.fromEntries(SITUACIONES);

// Las 12 palabras del examen, en tercera persona. El temperamento es interno: no se muestra.
export const PALABRAS_3P = [
  ['Se enfadó', 'COL'], ['Actuó rápido', 'COL'], ['Quiso controlarlo', 'COL'],
  ['Le dio vueltas', 'MEL'], ['Se encerró', 'MEL'], ['Se preocupó', 'MEL'],
  ['Lo contó', 'SAN'], ['Se distrajo', 'SAN'], ['Se rio', 'SAN'],
  ['Lo dejó pasar', 'FLE'], ['No le afectó', 'FLE'], ['Evitó el conflicto', 'FLE'],
];

/** Temperamento en cabeza con test + observaciones (0,5 cada una), o null si hay empate. */
function enCabeza(puntos, observaciones) {
  const total = { COL: 0, MEL: 0, SAN: 0, FLE: 0, ...(puntos ?? {}) };
  for (const o of observaciones) if (total[o.temperamento] !== undefined) total[o.temperamento] += 0.5;
  const cabeza = empatados(total);
  return cabeza.length === 1 ? cabeza[0] : null;
}

/**
 * Cada observación suma 0,5 puntos al temperamento de su palabra. Si la que se acaba de anotar
 * (`nueva`, la última de la lista) cambia el temperamento en cabeza y este no es el de la ficha,
 * devuelve el nuevo para proponer el cambio; si no, null. Así no se propone nada que la observación
 * no haya cambiado, ni se vuelve a preguntar tras «Dejarla como está». Si la persona ya hizo el test
 * (confirmado), las observaciones no cambian nada.
 */
export function propuestaPorObservaciones(persona, observaciones, nueva = observaciones[observaciones.length - 1]) {
  if (!persona || persona.estado === 'confirmado' || !nueva) return null;
  const antes = enCabeza(persona.puntos, observaciones.filter((o) => o !== nueva && o.id !== nueva.id));
  const ahora = enCabeza(persona.puntos, observaciones);
  return ahora && ahora !== antes && ahora !== persona.primario ? ahora : null;
}

export const textoPropuesta = (nombre, temperamento) =>
  `Lo que has observado de ${nombre} apunta a un temperamento ${temperamento}. ¿Actualizamos su ficha?`;

// ───────────── Privacidad ─────────────

/** Menores de 18 (por el año de nacimiento): sin marca «me cuesta». Con solo el año, se trata como
 *  menor a quien cumple 18 este año. */
export const esMenorDe18 = (anioNacimiento, hoy = new Date()) =>
  Number.isFinite(Number(anioNacimiento)) && anioNacimiento > 0 && hoy.getFullYear() - Number(anioNacimiento) <= 18;

// ───────────── «¿Con quién?» con fichas ─────────────
// En camino_dias.con_quien y en examen.con_quien: un grupo ('familia'…), 'solo', o 'p:<id de ficha>'.
export const claveFicha = (id) => `p:${id}`;
export const idDeClave = (clave) => (typeof clave === 'string' && clave.startsWith('p:') ? clave.slice(2) : null);

// ───────────── Sugerencia del día ─────────────

/**
 * Con quién hacer hoy el reto: UNA persona de tus fichas, primero las que aún no han aparecido esta
 * semana (en «¿con quién?» de la sesión o del examen) y, entre ellas, las de estrella. Con un consejo
 * de «cómo tratarle» si tiene temperamento. Es solo una sugerencia: elige siempre el usuario.
 */
export function sugerenciaDelDia(personas, porDia, dia) {
  if (!personas?.length || !dia) return null;
  const semana = dia <= 7 ? [1, 2, 3, 4, 5, 6, 7] : [8, 9, 10, 11, 12, 13, 14];
  const usadas = new Set();
  for (const d of semana) {
    if (d === dia) continue;
    for (const clave of [porDia[d]?.con_quien, porDia[d]?.examen?.con_quien]) {
      const id = idDeClave(clave);
      if (id) usadas.add(id);
    }
  }
  const orden = [...personas].sort((a, b) =>
    (usadas.has(a.id) - usadas.has(b.id)) || (b.estrella - a.estrella) || (a.creado_en < b.creado_en ? -1 : 1));
  const persona = orden[0];
  const consejos = FICHA[persona.primario]?.tratar;
  return { persona, consejo: consejos ? consejos[dia % consejos.length] : null };
}
