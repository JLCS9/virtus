// Eventos de analítica de Formación → dataLayer (GTM → GA4 / BigQuery).
//
// Mismo patrón que PageTracker: dataLayer.push desde React. El consentimiento
// lo gestiona GTM con Consent Mode v2 (default denegado): aquí solo se empuja
// el evento, los tags deciden si disparan.
//
// PRIVACIDAD: nunca viajan textos libres (reflexiones, notas, misión...) ni
// email/nombre. Solo identificadores de paso y contadores (aciertos/total).

export function track(event, params = {}) {
  if (typeof window === 'undefined') return;
  (window.dataLayer = window.dataLayer || []).push({ event, ...params });
}

// Eventos que genera completar un paso. Devuelve [{event, params}] para poder
// testearlo sin DOM.
//   - video            → video_viewed
//   - resto            → activity_completed (+ aciertos/total/aprobado si los hay)
//   - conclusion_modulo→ además module_completed
//   - cierre           → además course_completed (también proyecto_mision terminado)
// `previo` es lo que ya había guardado de ese paso (para marcar repeticiones).
export function eventosCompletado({ curso, pasoId, tipo, modulo, resultado, aprobado, previo }) {
  // El proyecto final guarda borradores: solo cuenta cuando está terminado.
  if (tipo === 'proyecto_mision' && !resultado?.completado) return [];

  const repeticion = Boolean(previo) && (tipo !== 'proyecto_mision' || Boolean(previo.completado));
  const base = { curso, paso_id: pasoId, modulo: modulo ?? 0, repeticion };
  const out = [];

  if (tipo === 'video') {
    out.push({ event: 'video_viewed', params: base });
  } else {
    const params = { ...base, tipo: tipo ?? 'desconocido' };
    if (typeof resultado?.aciertos === 'number' && typeof resultado?.total === 'number') {
      params.aciertos = resultado.aciertos;
      params.total = resultado.total;
    }
    if (typeof aprobado === 'boolean') params.aprobado = aprobado;
    out.push({ event: 'activity_completed', params });
  }

  if (tipo === 'conclusion_modulo') out.push({ event: 'module_completed', params: base });
  if (tipo === 'cierre' || tipo === 'proyecto_mision') out.push({ event: 'course_completed', params: base });

  return out;
}

export function trackCompletado(datos) {
  for (const { event, params } of eventosCompletado(datos)) track(event, params);
}

// Navegación entre pasos (embudo por paso: dónde se abandona un curso).
export function trackPaso({ curso, pasoId, totalPasos, completados }) {
  if (!pasoId) return; // irA(null) = salir al listado, no es una vista de paso
  track('formacion_step_view', {
    curso,
    paso_id: pasoId,
    total_pasos: totalPasos ?? 0,
    completados: completados ?? 0,
  });
}
