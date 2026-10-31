/**
 * Máquina de pasos del examen nocturno (02 §3, 03 §5). El orquestador, no el modelo, decide
 * el paso siguiente: los botones sí / a medias / no hacen avanzar el paso 2 y «prisa» salta al 5.
 */
import type { Resultado, TipoFallo } from './tipos.ts';

export type Paso = 1 | 2 | 3 | 4 | 5;

export interface EstadoNoche {
  paso: Paso;
  prisa: boolean;
  resultado: Resultado | null;
  tipo_fallo: TipoFallo | null;
  /** Paso 2, tras «a medias» o «no»: falta saber si falló la reacción o la decisión. */
  esperandoFallo: boolean;
  /** Turnos de usuario en el paso actual. */
  turnosPaso: number;
  cerrada: boolean;
}

export type Boton = 'listo' | 'si' | 'a_medias' | 'no' | 'reaccion' | 'decision' | 'prisa' | 'aceptar' | 'parar';
export type EntradaNoche = { tipo: 'texto'; texto: string } | { tipo: 'boton'; valor: Boton };

export type AccionNoche =
  /** Llamar al coach con el paso actual. */
  | 'coach'
  /** Llamar al coach (despedida del paso 5) y después EXTRAER_EXAMEN. */
  | 'coach_y_cerrar'
  /** Cerrar sin más coach (la persona pidió parar): EXTRAER_EXAMEN con lo que haya. */
  | 'cerrar';

export interface Transicion {
  estado: EstadoNoche;
  accion: AccionNoche;
  /** Al entrar en el paso 5: el motor debe calcular candidatos. */
  calcularCandidatos: boolean;
  /** Al entrar en el paso 5 desde el 4: extraer antes la situación de mañana (disparador). */
  extraerSituacion: boolean;
}

export const ESTADO_INICIAL: EstadoNoche = {
  paso: 1,
  prisa: false,
  resultado: null,
  tipo_fallo: null,
  esperandoFallo: false,
  turnosPaso: 0,
  cerrada: false,
};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function leerResultado(texto: string): Resultado | null {
  const t = norm(texto);
  if (/\b(a medias|en parte|mas o menos|un poco)\b/.test(t)) return 'a_medias';
  if (/^(si|claro|lo hice|hecho)\b/.test(t)) return 'si';
  if (/^(no|nada)\b/.test(t)) return 'no';
  return null;
}

export function leerFallo(texto: string): TipoFallo | null {
  const t = norm(texto);
  if (/\b(reaccion|reaccione|primera|impulso|me salio|sin pensar)\b/.test(t)) return 'reaccion';
  if (/\b(decid|decision|elegi|preferi|no quise|lo deje)\w*/.test(t)) return 'decision';
  return null;
}

export const pidePrisa = (texto: string) => /\b(tengo prisa|prisa|rapido|no tengo tiempo)\b/.test(norm(texto));
export const pideParar = (texto: string) => /^(para|parar|basta|dejalo|lo dejamos|stop)\b/.test(norm(texto));
const sinNada = (texto: string) => /^(nada|nada especial|nada que contar|no se|ninguna?)\b/.test(norm(texto));
export const acepta = (texto: string) =>
  norm(texto).split(/\s+/).length <= 6 &&
  /^(si|vale|ok|okay|perfecto|de acuerdo|asi|asi esta bien|me vale|dale|genial|bien|listo)\b/.test(norm(texto));

export function avanzar(estado: EstadoNoche, entrada: EntradaNoche): Transicion {
  const e: EstadoNoche = { ...estado, turnosPaso: estado.turnosPaso + 1 };
  const texto = entrada.tipo === 'texto' ? entrada.texto : '';
  const boton = entrada.tipo === 'boton' ? entrada.valor : null;
  const t = (estado: EstadoNoche, accion: AccionNoche, extra: Partial<Transicion> = {}): Transicion => ({
    estado,
    accion,
    calcularCandidatos: false,
    extraerSituacion: false,
    ...extra,
  });
  const irA = (paso: Paso, extra: Partial<Transicion> = {}) =>
    t({ ...e, paso, turnosPaso: 0, esperandoFallo: false }, 'coach', paso === 5 ? { calcularCandidatos: true, ...extra } : extra);

  if (estado.cerrada) return t(estado, 'cerrar');
  if (boton === 'parar' || (texto && pideParar(texto))) return t({ ...e, cerrada: true }, 'cerrar');
  if (estado.paso < 5 && (boton === 'prisa' || (texto && pidePrisa(texto)))) {
    // 02 §5 caso 4: «tengo prisa» en el paso 2 salta al 5 y el reto sale sin situación.
    return irA(5, { estado: { ...e, prisa: true, paso: 5, turnosPaso: 0, esperandoFallo: false } });
  }

  switch (estado.paso) {
    case 1:
      return irA(2);
    case 2: {
      if (!estado.esperandoFallo) {
        const r = boton === 'si' || boton === 'a_medias' || boton === 'no' ? boton : leerResultado(texto);
        if (!r) return e.turnosPaso >= 2 ? siguienteTrasPaso2({ ...e, resultado: 'sin_respuesta' }) : t(e, 'coach');
        if (r === 'si') return siguienteTrasPaso2({ ...e, resultado: 'si' });
        return t({ ...e, resultado: r, esperandoFallo: true, turnosPaso: 0 }, 'coach');
      }
      const f = boton === 'reaccion' || boton === 'decision' ? boton : leerFallo(texto);
      if (!f && e.turnosPaso < 2) return t(e, 'coach');
      return siguienteTrasPaso2({ ...e, tipo_fallo: f });
    }
    case 3:
      if (sinNada(texto) || e.turnosPaso >= 2) return irA(4);
      return t(e, 'coach'); // como mucho una repregunta de hechos
    case 4:
      return irA(5, { extraerSituacion: !sinNada(texto) });
    case 5:
      if (boton === 'aceptar' || acepta(texto) || e.turnosPaso >= 2) return t({ ...e, cerrada: true }, 'coach_y_cerrar');
      return t(e, 'coach'); // reescritura: el coach acepta u ofrece una versión intermedia una vez
  }

  function siguienteTrasPaso2(s: EstadoNoche): Transicion {
    const destino: Paso = s.prisa ? 5 : 3;
    return t({ ...s, paso: destino, turnosPaso: 0, esperandoFallo: false }, 'coach', { calcularCandidatos: destino === 5 });
  }
}
