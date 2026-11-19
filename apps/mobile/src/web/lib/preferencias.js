// Preferencias de trabajo diario y avisos (tabla preferencias_notificaciones). Lógica pura, sin React
// ni red. Es la configuración primaria de notificaciones: de aquí leerán la web (correo del reto) y
// la app móvil (push). Las horas son SIEMPRE hora local del usuario, en su zona horaria (IANA).

export const DIAS_SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']; // ISO 1…7

export const ZONA_POR_DEFECTO = 'Europe/Madrid';

export const PREFERENCIAS_POR_DEFECTO = {
  hora_reto: '08:00',
  hora_reflexion: '21:30',
  dia_formacion: 7,
  hora_formacion: '10:00',
  zona_horaria: ZONA_POR_DEFECTO,
  avisos_email: true,
  avisos_push: true,
};

// Horas que se ofrecen con un toque en cada pantalla (siempre se puede escribir otra).
export const HORAS_SUGERIDAS = {
  hora_reto: ['07:00', '08:00', '09:00'],
  hora_reflexion: ['20:00', '21:30', '22:30'],
  hora_formacion: ['10:00', '17:00', '20:00'],
};

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 'HH:MM' válida (Postgres devuelve 'HH:MM:SS': ver `horaCorta`). */
export const horaValida = (h) => typeof h === 'string' && HORA_RE.test(h);

/** '08:00:00' → '08:00'. null si no es una hora. */
export function horaCorta(h) {
  const corta = typeof h === 'string' ? h.slice(0, 5) : '';
  return horaValida(corta) ? corta : null;
}

export const diaValido = (d) => Number.isInteger(d) && d >= 1 && d <= 7;

/** Zona horaria del dispositivo (IANA) o la de por defecto si el navegador no la da. */
export function zonaDelDispositivo() {
  try {
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zona === 'string' && zona.length > 0 && zona.length <= 64 ? zona : ZONA_POR_DEFECTO;
  } catch {
    return ZONA_POR_DEFECTO;
  }
}

/**
 * Preferencias completas y válidas a partir de una fila de la BD (o de nada): cada campo que falte
 * o no valga se sustituye por su valor por defecto. `zona` es la del dispositivo, para quien aún no
 * tiene fila.
 */
export function normalizar(fila, zona = ZONA_POR_DEFECTO) {
  const f = fila ?? {};
  const d = PREFERENCIAS_POR_DEFECTO;
  return {
    hora_reto: horaCorta(f.hora_reto) ?? d.hora_reto,
    hora_reflexion: horaCorta(f.hora_reflexion) ?? d.hora_reflexion,
    dia_formacion: diaValido(f.dia_formacion) ? f.dia_formacion : d.dia_formacion,
    hora_formacion: horaCorta(f.hora_formacion) ?? d.hora_formacion,
    zona_horaria: typeof f.zona_horaria === 'string' && f.zona_horaria ? f.zona_horaria : zona,
    avisos_email: typeof f.avisos_email === 'boolean' ? f.avisos_email : d.avisos_email,
    avisos_push: typeof f.avisos_push === 'boolean' ? f.avisos_push : d.avisos_push,
  };
}

/** ¿Se pueden guardar? (lo mismo que exige la tabla). */
export const sonValidas = (p) =>
  Boolean(p) && horaValida(p.hora_reto) && horaValida(p.hora_reflexion) && horaValida(p.hora_formacion)
  && diaValido(p.dia_formacion) && typeof p.zona_horaria === 'string' && p.zona_horaria.length > 0;

// Textos de resumen (Perfil y cierre de la configuración).
export const textoReto = (p) => `Cada día a las ${p.hora_reto}`;
export const textoReflexion = (p) => `Cada día a las ${p.hora_reflexion}`;
const DIAS_PLURAL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];
export const textoFormacion = (p) => `Los ${DIAS_PLURAL[p.dia_formacion - 1]} a las ${p.hora_formacion}`;
/** 'Europe/Madrid' → 'Madrid'; 'America/Argentina/Buenos_Aires' → 'Buenos Aires'. */
export const textoZona = (zona) => String(zona ?? '').split('/').pop().replace(/_/g, ' ');
