// Motor de flujo secuencial para módulos de formación.
// Recorre los pasos en orden, salta los condicionales (test_profundo) según temperamento,
// y distingue entre pasos visibles en el listado (vídeos + cierre) y pasos de flujo (actividades).

export function pasosDelUsuario(modulo, temperamento) {
  const { primary, secondary } = temperamento ?? {};
  return modulo.pasos.filter((p) => {
    if (p.tipo === 'noop') return false;
    if (p.tipo === 'test_profundo') {
      const t = p.temperamento;
      if (!t) return true;
      return t === primary || t === secondary;
    }
    return true;
  });
}

export function pasosVisibles(pasos) {
  return pasos.filter((p) => p.visible);
}

export function indicePaso(pasos, pasoId) {
  return pasos.findIndex((p) => p.id === pasoId);
}

export function siguientePaso(pasos, pasoActualId) {
  const i = indicePaso(pasos, pasoActualId);
  return i >= 0 && i < pasos.length - 1 ? pasos[i + 1] : null;
}

export function pasoAnterior(pasos, pasoActualId) {
  const i = indicePaso(pasos, pasoActualId);
  return i > 0 ? pasos[i - 1] : null;
}

export function videoAnterior(pasos, pasoActualId) {
  const i = indicePaso(pasos, pasoActualId);
  for (let j = i - 1; j >= 0; j--) {
    if (pasos[j].tipo === 'video') return pasos[j];
  }
  return null;
}

export function progresoModulo(pasos, completados) {
  const total = pasos.length;
  const hechos = pasos.filter((p) => completados[p.id]).length;
  return { hechos, total, porcentaje: total ? Math.round((hechos / total) * 100) : 0, completo: hechos === total };
}

export function progresoActividad(paso) {
  if (paso.tipo === 'quiz' || paso.tipo === 'identifica') return paso.preguntas?.length ?? 0;
  if (paso.tipo === 'define') return paso.conceptos?.length ?? 0;
  if (paso.tipo === 'desliza') return paso.escenas?.length ?? 0;
  if (paso.tipo === 'test_profundo') return paso.num_preguntas ?? 0;
  return 0;
}

export function continuarModulo(pasos, completados) {
  return pasos.find((p) => !completados[p.id]) ?? null;
}

// Si el primer vídeo es la introducción (`es_introduccion`), no cuenta como módulo:
// la introducción tiene numero 0 y el siguiente bloque es el Módulo 1.
export function moduloDelPaso(pasos, pasoId) {
  const r = moduloDelPasoBase(pasos, pasoId);
  if (!r) return r;
  const conIntro = pasos.find((x) => x.tipo === 'video' && !x.continua_modulo)?.es_introduccion;
  if (!conIntro) return r;
  return { numero: r.numero - 1, total: r.total - 1, introduccion: r.numero === 1 };
}

function moduloDelPasoBase(pasos, pasoId) {
  const p = pasos.find((x) => x.id === pasoId);
  if (!p || p.tipo !== 'video') return null;
  const modHeaders = pasos.filter((x) => x.tipo === 'video' && !x.continua_modulo);
  if (p.continua_modulo) {
    const allVids = pasos.filter((x) => x.tipo === 'video');
    const thisIdx = allVids.indexOf(p);
    for (let i = thisIdx - 1; i >= 0; i--) {
      if (!allVids[i].continua_modulo) {
        const parentIdx = modHeaders.indexOf(allVids[i]);
        return { numero: parentIdx + 1, total: modHeaders.length };
      }
    }
    return null;
  }
  const idx = modHeaders.indexOf(p);
  return { numero: idx + 1, total: modHeaders.length };
}

// Módulos completados: un módulo está hecho cuando están hechos su vídeo, los vídeos que lo continúan
// y todos los ejercicios que aparecen en la lista del curso (cuestionarios incluidos). No cuentan las
// lecturas, los resúmenes, la síntesis ni los proyectos finales. Mismo criterio en la lista de cursos,
// en la cabecera del curso y en los círculos de cada módulo.
export const TIPOS_NO_CONTABLES = new Set(['noop', 'cierre', 'conclusion_modulo', 'reflexion_guiada', 'plan_crecimiento', 'test_caracter', 'test_corazon', 'lectura']);
export function modulosCompletados(pasos, completados) {
  const lista = (pasos ?? []).filter((p) => !p.proyecto_final);
  const modHeaders = lista.filter((p) => p.tipo === 'video' && !p.continua_modulo);
  const hechos = modHeaders.filter((p, mi) => {
    const startIdx = lista.indexOf(p);
    const nextHeader = modHeaders[mi + 1];
    const endIdx = nextHeader ? lista.indexOf(nextHeader) : lista.length;
    for (let k = startIdx; k < endIdx; k++) {
      if (!TIPOS_NO_CONTABLES.has(lista[k].tipo) && !completados[lista[k].id]) return false;
    }
    return true;
  }).length;
  const total = modHeaders.length;
  return { hechos, total, porcentaje: total ? Math.round((hechos / total) * 100) : 0, completo: total > 0 && hechos === total };
}
