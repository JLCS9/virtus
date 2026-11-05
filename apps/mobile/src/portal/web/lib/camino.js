// Lógica pura y textos del Camino · semanas 0 y 1 (los 14 primeros días). Sin React ni red.
// Fuente: «Camino · Semanas 0 y 1 — Especificación completa» (1-nov-2026). Los textos son los de la
// especificación, sin reescribir.

export const TOTAL_DIAS = 14;

export const SEMANAS = [
  {
    numero: 0,
    titulo: 'Punto de partida',
    frase: 'El test no es sobre tu carácter ni sobre tus cualidades: es sobre tu primera reacción.',
    reto: 'Cazar mi primera reacción',
    retoTexto: 'Una vez al día, nota tu reacción automática y ponle nombre.',
  },
  {
    numero: 1,
    titulo: 'El temperamento es biológico, el carácter espiritual',
    frase: 'Nacemos con un temperamento. No nacemos con un carácter: lo construimos.',
    reto: 'Contar mi temperamento y preguntar si me reconocen',
    retoTexto: 'Cada día a una persona distinta, si es posible.',
  },
];

// tipo: el componente que pinta la sesión. La primera ficha de persona va el día 2 (en la
// especificación, el 5): así los días siguientes ya pueden sugerir con quién hacer el reto.
export const DIAS = [
  { dia: 1, titulo: 'Vídeo 1.0 y tu resultado', tipo: 'video', leccion: '1.0', tiempo: 'Vídeo + 2 min' },
  { dia: 2, titulo: 'Descubre el temperamento de X', tipo: 'ficha', tiempo: '5 min' },
  { dia: 3, titulo: 'Desliza: los cuatro temperamentos', tipo: 'desliza', tiempo: '4 min' },
  { dia: 4, titulo: 'Elige tu reacción', tipo: 'elige', tiempo: '4 min' },
  { dia: 5, titulo: 'Verdad o mito', tipo: 'verdad_mito', tiempo: '3 min' },
  { dia: 6, titulo: 'Mi punto de partida', tipo: 'punto_partida', tiempo: '3 min' },
  { dia: 7, titulo: 'Cierre de la semana', tipo: 'cierre', cierre: true, tiempo: '4 min' },
  { dia: 8, titulo: 'Vídeo 1.1 y reto', tipo: 'video', leccion: '1.1', tiempo: 'Vídeo + 2 min' },
  { dia: 9, titulo: 'Verdad o mito', tipo: 'verdad_mito', tiempo: '3 min' },
  { dia: 10, titulo: 'Desliza: ¿temperamento o carácter?', tipo: 'desliza', tiempo: '4 min' },
  { dia: 11, titulo: 'Elige tu reacción: temperamento frente a carácter', tipo: 'elige', tiempo: '4 min' },
  { dia: 12, titulo: 'Mis personas', tipo: 'mis_personas', tiempo: '5 min' },
  { dia: 13, titulo: 'Arrastra: no lo elegí / lo he construido', tipo: 'arrastra', tiempo: '4 min' },
  { dia: 14, titulo: 'Cierre: primer espejo', tipo: 'cierre', cierre: true, tiempo: '5 min' },
];

export const semanaDe = (dia) => SEMANAS[dia <= 7 ? 0 : 1];
export const infoDia = (dia) => DIAS[dia - 1];
/** El título del día con punto final, salvo si ya acaba en «?» o «!». */
export const conPunto = (texto) => (/[?!.]$/.test(texto) ? texto : `${texto}.`);

// ───────────── Onboarding «Personaliza tu camino» ─────────────

export const ONBOARDING = {
  entrada: 'Tu temperamento ya lo conocemos. Ahora cuéntanos un poco de tu vida para que el camino sea tuyo.',
  momentos: {
    pregunta: '¿En qué momento de tu vida estás?',
    ayuda: 'Puedes elegir varias.',
    opciones: [['estudio', 'Estudio'], ['trabajo', 'Trabajo'], ['dirijo', 'Dirijo personas'], ['familia', 'Cuido de mi familia'], ['jubilado', 'Estoy jubilado'], ['otro', 'Otro']],
  },
  estado_vida: {
    pregunta: '¿Cuál es tu estado de vida?',
    opciones: [['soltero', 'Soltero'], ['casado', 'Casado'], ['religioso', 'Religioso'], ['no_dice', 'Prefiero no decirlo']],
  },
  objetivo: {
    pregunta: '¿Para qué estás aquí?',
    opciones: [['conocerme', 'Conocerme mejor'], ['liderar', 'Liderar mejor'], ['relaciones', 'Mejorar mis relaciones'], ['mision', 'Encontrar mi misión']],
  },
  vida_interior: {
    pregunta: '¿Quieres incluir propuestas de vida interior?',
    opciones: [['si', 'Sí'], ['no', 'No'], ['mas_adelante', 'Más adelante']],
  },
  agenda: { pregunta: '¿Qué día quieres tu vídeo? ¿A qué hora tu examen de la noche?' },
};

export const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']; // ISO 1…7

// `cuando`: «hoy» o «el lunes, 3 de noviembre».
export const textoCierreOnboarding = (cuando) =>
  `Tu camino empieza ${cuando}. Cada semana, un vídeo. Cada día, cinco minutos. Cada noche, un momento para mirar tu día.`;

// ───────────── Fechas (siempre la fecha local del usuario, «YYYY-MM-DD») ─────────────

const DIA_MS = 86400000;
const aFecha = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export function fechaLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const diferenciaDias = (a, b) => Math.round((aFecha(b) - aFecha(a)) / DIA_MS);
// Por calendario, no sumando milisegundos: los días del cambio de hora duran 23 o 25 horas.
const sumarDias = (fecha, n) => { const d = aFecha(fecha); return fechaLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); };

/** Día ISO de la semana (1 lunes … 7 domingo) de una fecha local. */
export const diaIso = (fecha) => ((aFecha(fecha).getDay() + 6) % 7) + 1;

/** El primer `diaVideo` (ISO) a partir de `desde`, incluido: ese es el día 1 del camino. */
export function calcularInicio(diaVideo, desde = fechaLocal()) {
  return sumarDias(desde, (diaVideo - diaIso(desde) + 7) % 7);
}

/** Día del camino hoy: ≤0 aún no empieza, 1…14 en curso, >14 terminado. */
export const diaDelCamino = (inicio, hoy = fechaLocal()) => diferenciaDias(inicio, hoy) + 1;

export const fechaDelDia = (inicio, dia) => sumarDias(inicio, dia - 1);

export function fechaCorta(fecha) {
  return aFecha(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Racha: días seguidos con sesión o examen hechos, contando hacia atrás desde hoy (si hoy aún no hay
 * nada, desde ayer). `dias` son las filas de camino_dias.
 */
export function racha(dias, hoy = fechaLocal()) {
  const activos = new Set();
  for (const d of dias) {
    if (d.sesion_en) activos.add(fechaLocal(new Date(d.sesion_en)));
    if (d.examen_en) activos.add(fechaLocal(new Date(d.examen_en)));
  }
  let cursor = activos.has(hoy) ? hoy : sumarDias(hoy, -1);
  let n = 0;
  while (activos.has(cursor)) { n += 1; cursor = sumarDias(cursor, -1); }
  return n;
}

// ───────────── Temperamentos ─────────────

export const LEMA = { COL: 'la acción', MEL: 'las ideas', SAN: 'las personas', FLE: 'la paz' };

// Día 1: «¿Te parece que tienes los cuatro?», el ejemplo del cuaderno según el primario.
export const EJEMPLO_CUATRO = {
  COL: 'El colérico que se cree flemático porque ha desarrollado el dominio propio.',
  FLE: 'El flemático que se cree colérico por la iniciativa.',
  MEL: 'El melancólico que se cree sanguíneo por la comunicación.',
  SAN: 'El sanguíneo que se cree melancólico por la contemplación.',
};

// Rueda: orden de los cuatro alrededor del círculo, en el sentido de las agujas del reloj.
export const RUEDA = ['COL', 'MEL', 'FLE', 'SAN'];

// ───────────── Sesiones ─────────────

export const RETO_PRESENTACION = {
  1: 'Esta semana, caza tu primera reacción. Cuando algo te mueva por dentro, fíjate en lo primero que sale. Esta noche te preguntaremos.',
  8: 'Esta semana, cuéntale a alguien tu temperamento y pregúntale: ¿me reconoces? Es la primera vez que te miras en un espejo que no eres tú.',
};

export const VERDAD_MITO = {
  5: [
    ['El temperamento se elige', false, 'Nacemos con un temperamento y no podemos cambiarlo'],
    ['Moriré con las cualidades y los defectos de mi temperamento', true, 'El temperamento no cambia; lo que crece es el carácter'],
    ['Si me veo de los cuatro temperamentos, el test está mal', false, 'Confundes temperamento y carácter: has desarrollado virtudes'],
    ['Hay temperamentos mejores que otros', false, 'Cada uno facilita unos aspectos de las virtudes y dificulta otros'],
    ['El carácter se construye con hábitos', true, 'Las virtudes son hábitos morales adquiridos con la práctica'],
    ['El test mide mis cualidades', false, 'Mide tu primera reacción ante los estímulos'],
  ],
  9: [
    ['El temperamento es biológico', true, 'Es nuestra predisposición natural a reaccionar de una manera'],
    ['El carácter también es innato', false, 'No nacemos con un carácter: lo construimos'],
    ['Con esfuerzo, un colérico puede volverse flemático', false, 'Su temperamento no cambia; puede adquirir el dominio de sí, que al flemático le resulta fácil'],
    ['El carácter se compone de virtudes', true, 'Prudencia, fortaleza, dominio de sí, justicia, magnanimidad y humildad'],
    ['Mi temperamento me condena a mis defectos', false, 'Sobre él construyes el carácter'],
    ['Mi temperamento me facilita unas virtudes y me dificulta otras', true, 'Al colérico le facilita la audacia y le dificulta el servicio'],
  ],
};

export const PUNTO_PARTIDA = {
  fallo: {
    pregunta: 'Cuando algo me sale mal, yo…',
    opciones: [['arreglo', 'Me pongo en marcha para arreglarlo'], ['vueltas', 'Le doy muchas vueltas'], ['cuento', 'Lo cuento y paso página'], ['acepto', 'Lo acepto con calma']],
  },
  me_ven: {
    pregunta: 'Los que me quieren dicen que soy…',
    opciones: ['decidido', 'exigente', 'impaciente', 'profundo', 'sensible', 'perfeccionista', 'alegre', 'generoso', 'disperso', 'tranquilo', 'constante', 'pasivo'],
  },
  me_gustaria: {
    pregunta: 'Me gustaría que dijeran que soy…',
    opciones: ['prudente', 'valiente', 'sereno', 'justo', 'magnánimo', 'humilde', 'paciente', 'alegre', 'fiel', 'generoso', 'decidido', 'cercano'],
  },
  linea: '¿Quieres añadir una línea tuya?',
};

// «Elige: ¿con quién vas a hacer hoy el reto?». Hasta que existan las fichas de personas, por grupo.
export const CON_QUIEN = [['familia', 'Alguien de mi familia'], ['amigos', 'Un amigo'], ['trabajo', 'Alguien del trabajo o los estudios'], ['otra', 'Otra persona']];

// ───────────── Examen de la noche ─────────────

export const EXAMEN = {
  intro: 'Antes de dormir, mira tu día un momento.',
  reto: { pregunta: '¿Hiciste el reto hoy?', opciones: [['si', 'Sí'], ['a_medias', 'A medias'], ['no', 'No']] },
  con_quien: { pregunta: '¿Con quién?', opciones: [...CON_QUIEN, ['solo', 'Solo']] },
  reconocio: { pregunta: '¿Te reconoció?', opciones: [['si', 'Sí'], ['en_parte', 'En parte'], ['no', 'No']] },
  palabra: { pregunta: '¿Qué palabra describe mejor tu reacción más fuerte de hoy?' },
  animo: { pregunta: '¿Cómo te fue?', opciones: [[1, '😣', 'Muy difícil'], [2, '😕', 'Difícil'], [3, '😐', 'Normal'], [4, '🙂', 'Bien'], [5, '😄', 'Muy bien']] },
  gracias: '¿Quieres dar gracias por algo de hoy?',
};

// Semana 0: las 12 palabras del reto. El temperamento es interno: nunca se muestra al usuario.
export const PALABRAS = [
  ['Me enfadé', 'COL'], ['Actué rápido', 'COL'], ['Quise controlarlo', 'COL'],
  ['Le di vueltas', 'MEL'], ['Me encerré', 'MEL'], ['Me preocupé', 'MEL'],
  ['Lo conté', 'SAN'], ['Me distraje', 'SAN'], ['Me reí', 'SAN'],
  ['Lo dejé pasar', 'FLE'], ['No me afectó', 'FLE'], ['Evité el conflicto', 'FLE'],
];

/** ¿Se puede hacer ya el examen de ese día? Los días 7 y 14 el cierre lo sustituye. */
export const tieneExamen = (dia) => !infoDia(dia)?.cierre;

/** Lo siguiente que toca: la sesión de hoy, su examen, o un día anterior que quedó sin hacer. */
export function siguientePaso({ diaHoy, porDia }) {
  if (diaHoy == null || diaHoy < 1 || diaHoy > TOTAL_DIAS) return null;
  const hoy = porDia[diaHoy];
  if (!hoy?.sesion_en) return { tipo: 'sesion', dia: diaHoy };
  if (tieneExamen(diaHoy) && !hoy.examen_en) return { tipo: 'examen', dia: diaHoy };
  const pendiente = DIAS.find((d) => d.dia < diaHoy && !porDia[d.dia]?.sesion_en);
  if (pendiente) return { tipo: 'sesion', dia: pendiente.dia, atrasada: true };
  return { tipo: 'hecho', dia: diaHoy };
}

// ───────────── Fase 2: juegos y cierres ─────────────

// Desliza (día 3): hacia una de las cuatro esquinas, con los colores de la rueda.
export const DESLIZA_4 = [
  ['En el atasco, toca el claxon y busca otra ruta', 'COL', 'Reacciona rápido y con fuerza: va a la acción'],
  ['Organiza la cena sin consultar a nadie, y sale bien', 'COL', 'Seguro de sí mismo, le cuesta pedir consejo'],
  ['Le llevan la contraria y sube el tono hasta ganar', 'COL', 'Tiende a vivir la opinión contraria como un ataque'],
  ['Una crítica de hace tres semanas aún le quita el sueño', 'MEL', 'Reacciona despacio, pero la impresión le dura mucho'],
  ['Tarda en elegir restaurante porque compara todas las opciones', 'MEL', 'Profundo y reflexivo, le cuesta decidir'],
  ['En la fiesta, pasa la noche hablando a fondo con una sola persona', 'MEL', 'Busca profundidad, no cantidad'],
  ['Llega tarde, pero entra contando una historia y todos ríen', 'SAN', 'Vive para las personas y el momento presente'],
  ['Empieza tres proyectos ilusionado y no termina ninguno', 'SAN', 'Le apasiona empezar; le cuesta perseverar'],
  ['Se enfada mucho y a los cinco minutos ya está de broma', 'SAN', 'Reacciona rápido, pero se le pasa pronto'],
  ['Le cambian el plan a última hora y dice "vale, sin problema"', 'FLE', 'Reacciona poco y despacio: busca la paz'],
  ['En la reunión nadie sabe qué piensa hasta que se lo preguntan', 'FLE', 'Sensato, pero no toma la iniciativa'],
  ['Hace lo mismo cada día, con calma y sin quejarse', 'FLE', 'Constante y fiel; le gusta la rutina'],
];

// Desliza (día 10): izquierda Temperamento (lo que me sale), derecha Carácter (lo que construyo).
export const DESLIZA_2 = [
  ['Se pone rojo cuando le critican', 'T', 'Es una primera reacción, no una elección'],
  ['Pide perdón sin justificarse', 'C', 'Es humildad: se aprende con la práctica'],
  ['Le cuesta decidir porque ve todos los riesgos', 'T', 'Rasgo típico del melancólico'],
  ['Decide a tiempo aunque tenga miedo a equivocarse', 'C', 'Es prudencia: supera el miedo a equivocarse'],
  ['Le encanta empezar cosas nuevas', 'T', 'Rasgo típico del sanguíneo'],
  ['Termina el proyecto aunque ya no le ilusione', 'C', 'Es fortaleza: resistencia'],
  ['Evita el conflicto por naturaleza', 'T', 'Rasgo típico del flemático'],
  ['Tiene la conversación difícil que llevaba meses evitando', 'C', 'Es fortaleza: audacia'],
  ['Quiere ejecutar sus ideas en el momento', 'T', 'Rasgo típico del colérico'],
  ['Escucha hasta el final antes de responder', 'C', 'Es dominio de sí y humildad'],
];

// Elige tu reacción (día 4): cuatro escenas, cuatro reacciones sin etiqueta.
export const ESCENAS_3 = [
  ['Te critican delante de otros', { COL: 'Respondo en el momento y defiendo mi postura', MEL: 'Me callo, pero le doy vueltas durante días', SAN: 'Me molesta, hago una broma y se me pasa', FLE: 'Me afecta poco: escucho y sigo' }],
  ['Alguien llega media hora tarde', { COL: 'Le digo claramente que no puede ser', MEL: 'No digo nada, pero lo guardo', SAN: 'Aprovecho para charlar con quien esté', FLE: 'Espero tranquilo: ya llegará' }],
  ['Te cambian los planes a última hora', { COL: 'Busco enseguida un plan B y lo organizo', MEL: 'Me cuesta; me fastidia el día', SAN: '¡Genial, algo nuevo!', FLE: 'Me adapto sin problema' }],
  ['Te proponen un proyecto nuevo y arriesgado', { COL: 'Me lanzo y lo lidero', MEL: 'Me atrae, pero veo todos los riesgos', SAN: 'Digo que sí antes de pensarlo', FLE: 'Prefiero que lo lidere otro; yo ayudo' }],
];

/** Resultado del día 4 según cuántas reacciones coinciden con el primario. */
export function textoElige3(coincidencias, nombrePrimario) {
  if (coincidencias >= 3) return `Tus reacciones confirman tu temperamento ${nombrePrimario}.`;
  if (coincidencias === 2) return 'Tu primario y tu secundario se reparten tus reacciones. Es normal.';
  return 'Puede que hayas elegido lo que haces, no lo que te sale primero. Recuerda: el test mide tu primera reacción. Esta semana, obsérvala.';
}

// Día 11: la escena 1 cambia según el momento vital.
export function quienCorrige(momentos = []) {
  if (momentos.includes('estudio')) return 'un profesor';
  if (momentos.includes('trabajo')) return 'tu jefe';
  if (momentos.includes('dirijo')) return 'un compañero';
  if (momentos.includes('familia') || momentos.includes('jubilado')) return 'un familiar';
  return 'alguien';
}

// Elige tu reacción (día 11): paso 1 «¿Qué te sale?», paso 2 «¿Y qué respondería la virtud?».
// La escena, la respuesta de la virtud, los distractores y la virtud son los de la especificación.
// BORRADOR · PENDIENTE DE REVISIÓN: las cuatro reacciones del paso 1 no están en la especificación
// («4 opciones, como el día 3»); la escena 1 reutiliza las del día 4 y las otras dos son propuesta.
export const ESCENAS_11 = [
  {
    escena: (momentos) => `Te corrige ${quienCorrige(momentos)} delante de todos`,
    sale: ESCENAS_3[0][1],
    virtud: 'Escucho, me quedo con lo que tenga de verdad y respondo después, con calma',
    distractores: ['Respondo en el momento para que quede claro', 'No digo nada y me lo guardo'],
    nombre: 'Humildad y dominio de sí',
  },
  {
    escena: () => 'Tienes que decidir y te falta información',
    sale: { COL: 'Decido ya, con lo que tengo', MEL: 'Sigo buscando datos y no me decido', SAN: 'Decido según lo que me ilusiona en ese momento', FLE: 'Lo dejo para más adelante' },
    virtud: 'Pido consejo, miro los datos que tengo y decido sin tardar',
    distractores: ['Decido ya y ya veré', 'Espero a tenerlo todo claro'],
    nombre: 'Prudencia',
  },
  {
    escena: () => 'Alguien cercano te pide ayuda justo cuando ibas a descansar',
    sale: { COL: 'Le digo que ahora no, sin rodeos', MEL: 'Ayudo, pero me quedo dándole vueltas', SAN: 'Digo que sí enseguida, aunque luego me pese', FLE: 'Ayudo sin decir nada, aunque no me apetezca' },
    virtud: 'Ayudo, y si de verdad no puedo, lo digo con cariño y propongo otro momento',
    distractores: ['Digo que sí, pero de mala gana', 'Hago como que no lo he oído'],
    nombre: 'Justicia y servicio',
  },
];

export const CIERRE_11 = 'Entre lo que te sale y lo que haces hay un espacio. Ahí se construye el carácter.';

// Arrastra (día 13): «No lo elegí» / «Lo he construido». No hay respuesta correcta.
// [rasgo, le sale a, le cuesta a]
export const RASGOS_13 = [
  ['Tomo decisiones rápido', ['COL'], ['MEL', 'FLE']],
  ['Pienso a fondo las cosas', ['MEL'], ['SAN']],
  ['Me relaciono con facilidad', ['SAN'], ['MEL']],
  ['Mantengo la calma', ['FLE'], ['COL']],
  ['Pido perdón sin justificarme', [], ['COL']],
  ['Termino lo que empiezo', ['MEL', 'FLE'], ['SAN']],
  ['Escucho sin interrumpir', ['FLE'], ['COL']],
  ['Me atrevo a arriesgar', ['COL', 'SAN'], ['MEL', 'FLE']],
  ['Animo a los demás', ['SAN'], ['MEL']],
  ['Propongo ideas sin que me lo pidan', ['COL'], ['FLE']],
  ['Controlo mi genio', ['FLE'], ['COL', 'SAN']],
  ['Profundizo en las amistades', ['MEL'], ['SAN']],
];
export const TEXTO_13 = 'Esto no te lo dio tu temperamento. Lo has construido tú.';

// Cierres.
// Mapa del camino (día 7): las semanas del curso 1; cada una con su lección (1.0 … 1.9).
export const SEMANA_DEL_TEMPERAMENTO = { COL: 6, MEL: 7, SAN: 8, FLE: 9 };
export const PALABRA_TEMPERAMENTO = Object.fromEntries(PALABRAS);

export const CIERRE_7 = {
  reacciones: 'Tus reacciones de la semana',
  encajan: '¿Encajan con tu temperamento?',
  encajanOpciones: [['si', 'Sí'], ['a_medias', 'A medias'], ['no', 'No']],
  encajanNo: 'Puede que el test no acertara del todo o que ya hayas construido carácter. En la semana 9 podrás repetirlo.',
  sobre: 'Tu virtud-desafío. Se abre en la semana 5.',
  personas: 'La semana que viene conocerás mejor a tu gente.',
  avance: (dia) => `Tu próximo vídeo, el ${dia}: el temperamento es biológico, el carácter espiritual.`,
};

export const CIERRE_14 = {
  espejo: '¿Alguien te vio distinto de como tú te ves?',
  espejoEnQue: '¿En qué?',
  lineaBase: '¿Cuál es temperamento y cuál carácter?',
  avance: (dia) => `Tu próximo vídeo, el ${dia}: el carácter se construye sobre la base del temperamento.`,
};

/** Resumen de la semana 1 a partir de los exámenes de los días 8 a 13. */
export function resumenSemana1(porDia) {
  const examenes = [8, 9, 10, 11, 12, 13].map((d) => porDia[d]?.examen).filter(Boolean);
  const contado = examenes.filter((e) => e.reto && e.reto !== 'no' && e.con_quien && e.con_quien !== 'solo');
  return {
    contado: contado.length,
    reconocieron: contado.filter((e) => e.reconocio === 'si' || e.reconocio === 'en_parte').length,
    retos: examenes.filter((e) => e.reto === 'si' || e.reto === 'a_medias').length,
  };
}
