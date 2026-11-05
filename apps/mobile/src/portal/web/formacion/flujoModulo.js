// Motor de flujo secuencial para módulos de formación.
// Recorre los pasos en orden, salta los condicionales (test_profundo) según temperamento,
// y distingue entre pasos visibles en el listado (vídeos + cierre) y pasos de flujo (actividades).

export function pasosDelUsuario(modulo, temperamento) {
  const { primary, secondary } = temperamento ?? {};
  return modulo.pasos.filter((p) => {
    if (p.tipo === 'noop') return false;
    if (p.tipo === 'test_profundo') {
      const t = p.temperamento;
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

export function moduloDelPaso(pasos, pasoId) {
  const p = pasos.find((x) => x.id === pasoId);
  if (!p || p.tipo !== 'video') return null;
  const vids = pasos.filter((x) => x.tipo === 'video');
  const idx = vids.indexOf(p);
  return { numero: idx, total: vids.length };
}
