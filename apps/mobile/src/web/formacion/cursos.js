// Lógica pura de «Formación» (cursos en vídeo). Sin React ni red.
//
// Es la misma regla de la app móvil (apps/mobile/src/features/courses.ts de Virtus):
//   - una lección cuenta como vista al llegar al 90 % del vídeo (o al pulsar «marcar como vista»);
//   - «siguiente» = la primera sin ver DESPUÉS de la última vista; si no hay, la primera sin ver
//     del curso; si el curso está completo, ninguna.
//
// Forma del catálogo (la sirve la función `formacion-catalogo`, solo con suscripción activa):
//   Curso   = { id, numero, titulo, virtudes[], temas[], lecciones: Leccion[] }
//   Leccion = { id, titulo, vimeoId, duracion (segundos), miniatura|null, virtudes[], temperamentos[] }
// `vistas` = { [idLeccion]: fechaISO }.

export const UMBRAL_VISTA = 0.9;

export function urlVimeo(vimeoId) {
  return `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&playsinline=1&title=0&byline=0&portrait=0&dnt=1`;
}

export function progresoCurso(curso, vistas = {}) {
  const total = curso.lecciones.length;
  const hechas = curso.lecciones.filter((l) => vistas[l.id]).length;
  return { hechas, total, completo: total > 0 && hechas === total, porcentaje: total ? Math.round((hechas / total) * 100) : 0 };
}

export function siguienteLeccion(curso, vistas = {}) {
  const ls = curso.lecciones;
  let ultima = -1;
  ls.forEach((l, i) => { if (vistas[l.id]) ultima = i; });
  return ls.slice(ultima + 1).find((l) => !vistas[l.id]) ?? ls.find((l) => !vistas[l.id]) ?? null;
}

export function buscarLeccion(cursos, idLeccion) {
  for (const curso of cursos) {
    const leccion = curso.lecciones.find((l) => l.id === idLeccion);
    if (leccion) return { curso, leccion };
  }
  return null;
}

/**
 * La lección a la que invitar a volver: «continúa donde lo dejaste». Parte de la última abierta; si
 * ya la vio, la siguiente de ese curso; si ese curso está completo (o no hay última), la primera
 * lección sin ver del primer curso que no esté terminado. null si lo ha visto todo.
 */
export function continuar(cursos, vistas = {}, ultimaAbierta = null) {
  const previa = ultimaAbierta ? buscarLeccion(cursos, ultimaAbierta) : null;
  if (previa && !progresoCurso(previa.curso, vistas).completo) {
    const leccion = vistas[previa.leccion.id] ? siguienteLeccion(previa.curso, vistas) : previa.leccion;
    if (leccion) return { curso: previa.curso, leccion, retomada: !vistas[previa.leccion.id] };
  }
  for (const curso of cursos) {
    const leccion = siguienteLeccion(curso, vistas);
    if (leccion) return { curso, leccion, retomada: false };
  }
  return null;
}

export function resumenGlobal(cursos, vistas = {}) {
  let hechas = 0, total = 0, segundosVistos = 0, segundosTotal = 0;
  for (const curso of cursos) {
    for (const l of curso.lecciones) {
      total += 1; segundosTotal += l.duracion || 0;
      if (vistas[l.id]) { hechas += 1; segundosVistos += l.duracion || 0; }
    }
  }
  return { hechas, total, segundosVistos, segundosTotal, porcentaje: total ? Math.round((hechas / total) * 100) : 0 };
}

export function duracionCurso(curso) {
  return curso.lecciones.reduce((s, l) => s + (l.duracion || 0), 0);
}

/** «1 h 45 min», «12 min», «45 s», «0 min». */
export function formatoDuracion(segundos) {
  const s = Math.max(0, Math.round(segundos || 0));
  if (s === 0) return '0 min';
  if (s < 60) return `${s} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
