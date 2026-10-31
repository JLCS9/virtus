/**
 * Selección de candidatos (03 §3.1). Determinista y sin efectos: recibe el estado y devuelve
 * los 5 candidatos. Se ejecuta antes del paso 5 del examen y, si no hubo examen, por la mañana.
 *
 * Desviaciones acordadas respecto al pseudocódigo del 03:
 * - Necesidad ×3 a la virtud-reto del perfil combinado; ×1,5 a la del dominante si es otra.
 * - Los retos con perfil_combinado (gt-*) solo son candidatos para ese perfil.
 * - Obstáculo repetido (≥3 veces en 14 días) multiplica ×1,5 los retos que lo combaten (03 §3.2
 *   dice «prioriza»; el factor es nuestro).
 */
import { objetivoIntensidad, obstaculosRecurrentes } from './niveles.ts';
import type { Ambito, Candidato, DiaRegistro, Disparador, Niveles, PerfilMotor, Reto, SituacionManana, Temperamento, VirtudClave } from './tipos.ts';
import { codigoPerfil, virtudClave, virtudesReto } from './virtudes.ts';

export interface EntradaMotor {
  perfil: PerfilMotor;
  niveles: Niveles;
  /** Registro de los últimos 90 días (para novedad) ordenado o no; la fecha de referencia es `hoy`. */
  historial: DiaRegistro[];
  /** Fecha para la que se eligen los candidatos (YYYY-MM-DD). */
  hoy: string;
  manana: SituacionManana | null;
  retos: Reto[];
  disparadores: Disparador[];
}

export interface Puntuacion {
  reto: Reto;
  virtud: VirtudClave;
  total: number;
  factores: { necesidad: number; relevancia: number; zona: number; espiral: number; novedad: number; obstaculo: number };
}

const DIA_MS = 86_400_000;
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / DIA_MS);
}

export function dificultad(reto: Reto, temperamento: Temperamento): number {
  return reto[`dif_${temperamento}`];
}

function porFechaDesc(historial: DiaRegistro[], hoy: string): DiaRegistro[] {
  return historial.filter((d) => d.fecha < hoy).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

/** Días consecutivos (hasta ayer) trabajando la misma virtud. */
export function rachaDeVirtud(dias: DiaRegistro[], v: VirtudClave, retosPorId: Map<string, Reto>): number {
  let n = 0;
  for (const d of dias) {
    const r = d.reto_id ? retosPorId.get(d.reto_id) : undefined;
    if (!r || virtudClave(r) !== v) break;
    n++;
  }
  return n;
}

export function puntuar(reto: Reto, e: EntradaMotor, ctx: Contexto): Puntuacion {
  const v = virtudClave(reto);
  const nivel = e.niveles[v] ?? 3;
  const dif = dificultad(reto, e.perfil.temperamento_dominante);

  let necesidad = 5 - nivel;
  if (v === ctx.virtudes.principal) necesidad *= 3;
  else if (v === ctx.virtudes.secundaria) necesidad *= 1.5;

  let relevancia = 1.0;
  const m = e.manana;
  if (m && m.disparador && reto.disparador === m.disparador) relevancia = 3.0;
  else if (m && m.disparador && reto.ambito === ctx.ambitoDe(m.disparador)) relevancia = 1.5;
  if (reto.requiere_otra_persona && !(m && m.personas.length > 0)) relevancia *= 0.6;

  const objetivo = Math.min(5, ctx.objetivo(nivel));
  const zona = Math.max(0.1, 1.0 - Math.abs(dif - objetivo) * 0.25);

  let espiral = 1.0;
  if (rachaDeVirtud(ctx.diasDesc, v, ctx.retosPorId) >= 4) espiral = 0.3;
  if (!ctx.facultadesSemana.has(reto.facultad)) espiral *= 1.5;
  if (v === 'magnanimidad' && ctx.ultimaVirtud === 'humildad_fraternal') espiral *= 1.2;
  if (v === 'humildad_fraternal' && ctx.ultimaVirtud === 'magnanimidad') espiral *= 1.2;

  let novedad = 1.0;
  const ultimo = ctx.ultimoUso.get(reto.id);
  if (ultimo !== undefined) {
    if (!reto.repetible) novedad = ultimo < 90 ? 0.0 : 0.5;
    else novedad = Math.min(1.0, ultimo / 14);
  }
  if ((ctx.rechazosPorTipo.get(reto.tipo) ?? 0) >= 3) novedad *= 0.4;

  const obstaculo = reto.obstaculo && ctx.obstaculos.has(reto.obstaculo) ? 1.5 : 1.0;

  return {
    reto,
    virtud: v,
    total: necesidad * relevancia * zona * espiral * novedad * obstaculo,
    factores: { necesidad, relevancia, zona, espiral, novedad, obstaculo },
  };
}

interface Contexto {
  virtudes: { principal: VirtudClave; secundaria: VirtudClave | null };
  ambitoDe: (disparador: string) => Ambito | null;
  objetivo: (nivel: number) => number;
  diasDesc: DiaRegistro[];
  retosPorId: Map<string, Reto>;
  facultadesSemana: Set<string>;
  ultimaVirtud: VirtudClave | null;
  ultimoUso: Map<string, number>;
  rechazosPorTipo: Map<string, number>;
  obstaculos: Set<string>;
}

function contexto(e: EntradaMotor): Contexto {
  const retosPorId = new Map(e.retos.map((r) => [r.id, r]));
  const ambitos = new Map(e.disparadores.map((d) => [d.clave, d.ambito]));
  const diasDesc = porFechaDesc(e.historial, e.hoy);
  const ultimos14 = diasDesc.filter((d) => diasEntre(d.fecha, e.hoy) <= 14);

  const facultadesSemana = new Set<string>();
  const ultimoUso = new Map<string, number>();
  const rechazosPorTipo = new Map<string, number>();
  for (const d of diasDesc) {
    const r = d.reto_id ? retosPorId.get(d.reto_id) : undefined;
    if (!r) continue;
    const hace = diasEntre(d.fecha, e.hoy);
    if (hace <= 7) facultadesSemana.add(r.facultad);
    if (!ultimoUso.has(r.id)) ultimoUso.set(r.id, hace);
    if (hace <= 14 && d.reescrito_por_usuario) rechazosPorTipo.set(r.tipo, (rechazosPorTipo.get(r.tipo) ?? 0) + 1);
  }
  const ultimoReto = diasDesc[0]?.reto_id ? retosPorId.get(diasDesc[0].reto_id!) : undefined;

  return {
    virtudes: virtudesReto(e.perfil.temperamento_dominante, e.perfil.temperamento_secundario),
    ambitoDe: (disp) => ambitos.get(disp) ?? null,
    objetivo: (nivel) => objetivoIntensidad(nivel, ultimos14),
    diasDesc,
    retosPorId,
    facultadesSemana,
    ultimaVirtud: ultimoReto ? virtudClave(ultimoReto) : null,
    ultimoUso,
    rechazosPorTipo,
    obstaculos: obstaculosRecurrentes(ultimos14),
  };
}

/** Retos elegibles: activos y, si son de perfil combinado, solo para ese perfil. */
export function retosElegibles(e: EntradaMotor): Reto[] {
  const perfil = codigoPerfil(e.perfil.temperamento_dominante, e.perfil.temperamento_secundario);
  return e.retos.filter((r) => r.activo && (!r.perfil_combinado || r.perfil_combinado === perfil));
}

export function ranking(e: EntradaMotor): Puntuacion[] {
  const ctx = contexto(e);
  return retosElegibles(e)
    .map((r) => puntuar(r, e, ctx))
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total || (a.reto.id < b.reto.id ? -1 : 1));
}

/**
 * Top 5 con las garantías del 03: al menos uno de la virtud-reto y al menos uno que no
 * requiera otra persona. Si faltan, sustituyen al peor del top que no sea imprescindible.
 */
export function candidatos(e: EntradaMotor, n = 5): Candidato[] {
  const todos = ranking(e);
  const top = todos.slice(0, n);
  const { principal } = virtudesReto(e.perfil.temperamento_dominante, e.perfil.temperamento_secundario);

  const garantizar = (cumple: (p: Puntuacion) => boolean, protegido: (p: Puntuacion) => boolean) => {
    if (top.some(cumple)) return;
    const extra = todos.slice(n).find(cumple);
    if (!extra) return;
    for (let i = top.length - 1; i >= 0; i--) {
      if (!protegido(top[i])) {
        top[i] = extra;
        return;
      }
    }
  };
  const esVirtudReto = (p: Puntuacion) => p.virtud === principal;
  const sinPersona = (p: Puntuacion) => !p.reto.requiere_otra_persona;
  garantizar(esVirtudReto, () => false);
  // Al buscar uno sin persona no se quita el único de la virtud-reto.
  garantizar(sinPersona, (p) => esVirtudReto(p) && top.filter(esVirtudReto).length === 1);

  return top.map((p) => aCandidato(p, e.perfil.temperamento_dominante));
}

export function aCandidato(p: Puntuacion, temperamento: Temperamento): Candidato {
  return {
    reto_id: p.reto.id,
    texto: p.reto.texto,
    virtud: p.virtud,
    subcomponente: p.reto.subcomponente,
    tipo: p.reto.tipo,
    disparador: p.reto.disparador,
    intensidad: dificultad(p.reto, temperamento),
    pregunta_examen: p.reto.pregunta_examen,
  };
}
