/**
 * Orquestador de los tres modos (onboarding, mañana, noche). Puro respecto a la infraestructura:
 * el modelo, el almacén y el seudonimizador se inyectan (Bedrock + Postgres en las Edge
 * Functions; mocks en los tests). Principios:
 * - Todo texto de usuario pasa por el seudonimizador antes de llegar al modelo o al almacén.
 * - El modelo nunca escribe: su JSON se valida aquí y solo entonces se persiste.
 * - El método (candidatos, niveles, pasos) es del motor; el modelo solo redacta y conversa.
 */
import {
  type CrisisJson,
  type ExamenJson,
  parsearJson,
  validarCrisis,
  validarExamen,
  validarManana,
  validarPerfil,
  type PerfilJson,
  type Validacion,
} from './contratos.ts';
import { type EscenarioMemoria, cambiosMemoria, escenarioRespaldo, type PersonaMemoria, type CambiosMemoria } from './memoria.ts';
import { actualizarNivel } from './niveles.ts';
import { avanzar, type Boton, type EntradaNoche, ESTADO_INICIAL, type EstadoNoche, type Paso } from './noche.ts';
import {
  BLOQUE_BASE,
  CLASIFICADOR_CRISIS,
  EXTRAER_EXAMEN,
  EXTRAER_PERFIL,
  LINEA_ATENCION,
  MENSAJE_REINTENTO,
  MODO_MANANA,
  MODO_NOCHE,
  MODO_ONBOARDING,
  rellenar,
} from './prompts.ts';
import { razonTemperamento } from './razon-temperamento.ts';
import { candidatos as calcularCandidatos, diasEntre } from './scoring.ts';
import type {
  Candidato,
  DiaRegistro,
  Disparador,
  Niveles,
  NivelAtencion,
  Reto,
  SituacionManana,
  Temperamento,
  VirtudClave,
} from './tipos.ts';
import { NOMBRE_VIRTUD, virtudClave, virtudesReto } from './virtudes.ts';

// ── Puertos ───────────────────────────────────────────────────────────────────
export type Rol = 'usuario' | 'coach';
export interface Turno {
  rol: Rol;
  texto: string;
}

export interface Modelo {
  /**
   * `coach`: conversación. `json`: extracción (respuesta solo JSON). `clasificador`: crisis
   * (modelo barato). Devuelve el texto de la respuesta o lanza si la llamada falla.
   */
  completar(p: { uso: 'coach' | 'json' | 'clasificador'; sistema: string; mensajes: Turno[] }): Promise<string>;
}

export interface Seudonimizador {
  /** Texto del usuario → texto con tokens. Registra tokens nuevos en token_map. */
  seudonimizar(texto: string): Promise<string>;
  /** Tokens → nombres reales, solo en memoria para mostrar al usuario. */
  restaurar(texto: string): Promise<string>;
}

export interface PerfilGuardado {
  temperamento_dominante: Temperamento;
  temperamento_secundario: Temperamento | null;
  mision: string | null;
  niveles: Niveles;
  confianza: Record<VirtudClave, number>;
}

export interface DiaGuardado {
  reto_id: string | null;
  reto_texto: string | null;
  reto_porque: string | null;
  situacion: string | null;
  disparador: string | null;
  personas: string[];
}

export interface SesionNoche {
  estado: EstadoNoche & { atencion?: boolean; manana?: SituacionManana | null };
  candidatos: Candidato[] | null;
}

export interface SesionOnboarding {
  turnos: Turno[];
  cerrada: boolean;
}

export interface CierreNoche {
  fecha: string;
  manana: string;
  hoy: {
    resultado: ExamenJson['resultado'];
    tipo_fallo: ExamenJson['tipo_fallo'];
    nota_usuario: string | null;
    resumen_dia: string | null;
    obstaculos: string[];
    paso_alcanzado: number;
    modo_prisa: boolean;
    nivel_atencion: NivelAtencion;
  };
  nivel: { virtud: VirtudClave; nivel: number; confianza: number } | null;
  memoria: CambiosMemoria;
  /** Etiqueta (seudonimizada) del escenario nuevo, si lo hay. */
  etiquetaEscenarioNuevo: string | null;
  diaManana: DiaGuardado & { reescrito_por_usuario: boolean };
}

/** Almacén ligado a un pseudo_id. Lo implementan las Edge Functions sobre metodo.*. */
export interface Almacen {
  catalogo(): Promise<{ retos: Reto[]; disparadores: Disparador[] }>;
  perfil(): Promise<PerfilGuardado | null>;
  guardarPerfil(p: PerfilJson, fecha: string): Promise<void>;
  historial(desde: string): Promise<DiaRegistro[]>;
  historialNivel(virtud: VirtudClave, antesDe: string, dias: number): Promise<number[]>;
  personas(): Promise<PersonaMemoria[]>;
  escenarios(): Promise<EscenarioMemoria[]>;
  dia(fecha: string): Promise<DiaGuardado | null>;
  guardarRetoDelDia(fecha: string, d: DiaGuardado): Promise<void>;
  sesionNoche(fecha: string): Promise<SesionNoche | null>;
  guardarSesionNoche(fecha: string, s: SesionNoche): Promise<void>;
  turnosNoche(fecha: string): Promise<Turno[]>;
  anadirTurnoNoche(fecha: string, t: Turno): Promise<void>;
  sesionOnboarding(): Promise<SesionOnboarding | null>;
  guardarSesionOnboarding(s: SesionOnboarding): Promise<void>;
  guardarCierreNoche(c: CierreNoche): Promise<void>;
  marcarCrisis(fecha: string): Promise<void>;
}

export interface Dependencias {
  modelo: Modelo;
  almacen: Almacen;
  seudo: Seudonimizador;
  /** Mensaje fijo, revisado por un profesional, con recursos del país del usuario. */
  mensajeCrisis: string;
  /** Para trazas sin texto de usuario. */
  log?: (evento: string, datos?: Record<string, unknown>) => void;
}

// ── utilidades ────────────────────────────────────────────────────────────────
const NOMBRE_TEMP: Record<Temperamento, string> = {
  colerico: 'colérico',
  melancolico: 'melancólico',
  sanguineo: 'sanguíneo',
  flematico: 'flemático',
};

export function catalogoDisparadoresTexto(disparadores: Disparador[]): string {
  return disparadores.map((d) => `${d.clave}: ${d.descripcion}`).join('\n');
}

function sistema(disparadores: Disparador[], modo: string): string {
  return `${rellenar(BLOQUE_BASE, { catalogo_disparadores: catalogoDisparadoresTexto(disparadores) })}\n\n${modo}`;
}

export function sumarDias(fecha: string, n: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Pide JSON, valida y, si no valida, repite una vez con el mensaje del 02. */
async function pedirJson<T>(
  deps: Dependencias,
  sist: string,
  mensajes: Turno[],
  validar: (json: unknown) => Validacion<T>,
): Promise<Validacion<T>> {
  let historial = mensajes;
  let ultimoError = '';
  for (let intento = 0; intento < 2; intento++) {
    const texto = await deps.modelo.completar({ uso: 'json', sistema: sist, mensajes: historial });
    const parsed = parsearJson(texto);
    const v = parsed.ok ? validar(parsed.valor) : (parsed as Validacion<T>);
    if (v.ok) return v;
    ultimoError = v.error;
    deps.log?.('json_invalido', { intento, error: v.error });
    historial = [...historial, { rol: 'coach', texto }, { rol: 'usuario', texto: rellenar(MENSAJE_REINTENTO, { error: v.error }) }];
  }
  return { ok: false, error: ultimoError };
}

/** Clasificador de crisis: solo ve el mensaje del turno (03 §6). Si falla, se trata como atención. */
async function clasificar(deps: Dependencias, mensaje: string): Promise<CrisisJson> {
  try {
    const texto = await deps.modelo.completar({
      uso: 'clasificador',
      sistema: '',
      mensajes: [{ rol: 'usuario', texto: rellenar(CLASIFICADOR_CRISIS, { mensaje }) }],
    });
    const p = parsearJson(texto);
    const v = p.ok ? validarCrisis(p.valor) : null;
    if (v?.ok) return v.valor;
  } catch (e) {
    deps.log?.('clasificador_error', { error: String(e) });
  }
  return { nivel: 'atencion', motivo: 'clasificador no disponible' };
}

/** Une turnos consecutivos del mismo rol (la API exige alternancia usuario/coach). */
export function alternar(turnos: Turno[]): Turno[] {
  const out: Turno[] = [];
  for (const t of turnos) {
    const prev = out[out.length - 1];
    if (prev && prev.rol === t.rol) prev.texto = `${prev.texto}\n\n${t.texto}`;
    else out.push({ ...t });
  }
  if (out[0]?.rol === 'coach') out.unshift({ rol: 'usuario', texto: '(La persona abre la aplicación.)' });
  return out;
}

// ── MAÑANA ────────────────────────────────────────────────────────────────────
export interface RetoDelDia {
  reto_id: string;
  reto: string;
  porque: string;
  virtud: VirtudClave;
  variante_corta: string | null;
  /** true si el modelo no respondió y se muestra el texto de biblioteca. */
  respaldo: boolean;
}

export async function retoDelDia(deps: Dependencias, fecha: string): Promise<RetoDelDia | null> {
  const { almacen } = deps;
  const perfil = await almacen.perfil();
  if (!perfil) return null;
  const { retos, disparadores } = await almacen.catalogo();
  const porId = new Map(retos.map((r) => [r.id, r]));
  const existente = await almacen.dia(fecha);

  if (existente?.reto_id && existente.reto_texto && existente.reto_porque) {
    const r = porId.get(existente.reto_id)!;
    return {
      reto_id: r.id,
      reto: await deps.seudo.restaurar(existente.reto_texto),
      porque: existente.reto_porque,
      virtud: virtudClave(r),
      variante_corta: r.variante_corta,
      respaldo: false,
    };
  }

  // Sin examen anoche (o sin redacción): el sistema elige el reto con el escenario de respaldo.
  const escenarios = await almacen.escenarios();
  const respaldo = escenarioRespaldo(escenarios, retos);
  let reto: Reto;
  let situacion: DiaGuardado = existente ?? {
    reto_id: null,
    reto_texto: null,
    reto_porque: null,
    situacion: null,
    disparador: null,
    personas: [],
  };
  if (existente?.reto_id && porId.has(existente.reto_id)) {
    reto = porId.get(existente.reto_id)!;
  } else {
    const historial = await almacen.historial(sumarDias(fecha, -90));
    const [primero] = calcularCandidatos({
      perfil,
      niveles: perfil.niveles,
      historial,
      hoy: fecha,
      manana: { disparador: respaldo.disparador, personas: respaldo.personas },
      retos,
      disparadores,
    });
    reto = porId.get(primero.reto_id)!;
    situacion = { ...situacion, reto_id: reto.id, disparador: respaldo.disparador, personas: respaldo.personas };
  }

  const redaccion = await redactarManana(deps, {
    perfil,
    reto,
    disparadores,
    situacion: situacion.situacion,
    personas: situacion.personas,
    proposito: existente?.reto_texto ?? null,
    respaldo: respaldo,
  });
  await almacen.guardarRetoDelDia(fecha, { ...situacion, reto_id: reto.id, reto_texto: redaccion.reto, reto_porque: redaccion.porque });
  return {
    reto_id: reto.id,
    reto: await deps.seudo.restaurar(redaccion.reto),
    porque: redaccion.porque,
    virtud: virtudClave(reto),
    variante_corta: reto.variante_corta,
    respaldo: redaccion.respaldo,
  };
}

async function redactarManana(
  deps: Dependencias,
  p: {
    perfil: PerfilGuardado;
    reto: Reto;
    disparadores: Disparador[];
    situacion: string | null;
    personas: string[];
    proposito: string | null;
    respaldo: EscenarioMemoria;
  },
): Promise<{ reto: string; porque: string; respaldo: boolean }> {
  const v = virtudClave(p.reto);
  const razon = razonTemperamento(p.perfil.temperamento_dominante, v);
  const descDisp = (clave: string | null) => p.disparadores.find((d) => d.clave === clave)?.descripcion ?? null;
  const modo = rellenar(MODO_MANANA, {
    temperamento_dominante: NOMBRE_TEMP[p.perfil.temperamento_dominante],
    temperamento_secundario: p.perfil.temperamento_secundario ? NOMBRE_TEMP[p.perfil.temperamento_secundario] : null,
    mision: p.perfil.mision,
    reto_id: p.reto.id,
    reto_texto: p.reto.texto,
    virtud: p.reto.virtud,
    subcomponente: p.reto.subcomponente,
    tipo: p.reto.tipo,
    situacion_manana: p.situacion,
    personas_situacion: p.personas.length ? p.personas.join(', ') : null,
    proposito_usuario: p.proposito,
    razon_temperamento: razon,
    escenario_fallback: descDisp(p.respaldo.disparador),
  });
  try {
    const v2 = await pedirJson(deps, sistema(p.disparadores, modo), [{ rol: 'usuario', texto: 'buenos días' }], (j) =>
      validarManana(j, p.reto.id),
    );
    if (v2.ok) return { reto: v2.valor.reto, porque: v2.valor.porque, respaldo: false };
  } catch (e) {
    deps.log?.('manana_error', { error: String(e) });
  }
  // Respaldo determinista: el propósito de anoche o el texto de biblioteca, y la razón fija.
  return {
    reto: p.proposito ?? p.reto.texto,
    porque: `Trabajas la ${NOMBRE_VIRTUD[v]}: ${razon}.`,
    respaldo: true,
  };
}

// ── NOCHE ─────────────────────────────────────────────────────────────────────
export interface RespuestaNoche {
  mensaje: string;
  paso: Paso;
  prisa: boolean;
  /** Botones que la interfaz debe ofrecer en este punto. */
  botones: Boton[];
  cerrada: boolean;
  crisis: boolean;
}

const TEXTO_BOTON: Record<Boton, string> = {
  listo: 'listo',
  si: 'sí',
  a_medias: 'a medias',
  no: 'no',
  reaccion: 'falló mi primera reacción',
  decision: 'lo decidí',
  prisa: 'tengo prisa',
  aceptar: 'así está bien',
  parar: 'lo dejamos aquí',
};

export function botonesPara(e: EstadoNoche): Boton[] {
  if (e.cerrada) return [];
  const prisa: Boton[] = e.paso < 5 ? ['prisa'] : [];
  if (e.paso === 1) return ['listo', ...prisa];
  if (e.paso === 2) return e.esperandoFallo ? ['reaccion', 'decision', ...prisa] : ['si', 'a_medias', 'no', ...prisa];
  if (e.paso === 5) return ['aceptar'];
  return prisa;
}

export async function turnoNoche(deps: Dependencias, fecha: string, entrada: EntradaNoche | null): Promise<RespuestaNoche> {
  const { almacen, seudo } = deps;
  const perfil = await almacen.perfil();
  if (!perfil) throw new Error('sin_perfil');
  const { retos, disparadores } = await almacen.catalogo();
  const porId = new Map(retos.map((r) => [r.id, r]));

  let sesion: SesionNoche = (await almacen.sesionNoche(fecha)) ?? { estado: { ...ESTADO_INICIAL }, candidatos: null };
  const responder = (mensaje: string, s: SesionNoche, crisis = false): RespuestaNoche => ({
    mensaje,
    paso: s.estado.paso,
    prisa: s.estado.prisa,
    botones: botonesPara(s.estado),
    cerrada: s.estado.cerrada,
    crisis,
  });
  if (sesion.estado.cerrada) return responder('El examen de hoy ya está hecho. Hasta mañana.', sesion);

  const turnos = await almacen.turnosNoche(fecha);
  let turnoUsuario: Turno | null = null;

  if (entrada) {
    if (entrada.tipo === 'texto') {
      const texto = await seudo.seudonimizar(entrada.texto);
      const c = await clasificar(deps, texto);
      if (c.nivel === 'crisis') {
        // Se descarta todo lo demás y no se vuelve al guion esta noche.
        await almacen.marcarCrisis(fecha);
        sesion = { ...sesion, estado: { ...sesion.estado, cerrada: true } };
        await almacen.guardarSesionNoche(fecha, sesion);
        deps.log?.('crisis', { fecha });
        return responder(deps.mensajeCrisis, sesion, true);
      }
      if (c.nivel === 'atencion') sesion.estado.atencion = true;
      turnoUsuario = { rol: 'usuario', texto };
    } else {
      turnoUsuario = { rol: 'usuario', texto: TEXTO_BOTON[entrada.valor] };
    }
    await almacen.anadirTurnoNoche(fecha, turnoUsuario);
    turnos.push(turnoUsuario);
  }

  const tr = entrada ? avanzar(sesion.estado, entrada) : null;
  if (tr) sesion = { ...sesion, estado: { ...sesion.estado, ...tr.estado } };

  if (tr?.accion === 'cerrar') {
    await cerrarNoche(deps, fecha, sesion, turnos, perfil, retos, disparadores);
    await almacen.guardarSesionNoche(fecha, sesion);
    return responder('Lo dejamos aquí. Hasta mañana.', sesion);
  }

  const hoy = await almacen.dia(fecha);
  const retoHoy = hoy?.reto_id ? porId.get(hoy.reto_id) ?? null : null;
  const recientes = (await almacen.historial(sumarDias(fecha, -4))).filter((d) => d.fecha <= fecha && diasEntre(d.fecha, fecha) < 4);
  const virtudesRecientes =
    recientes
      .map((d) => (d.reto_id && porId.get(d.reto_id) ? NOMBRE_VIRTUD[virtudClave(porId.get(d.reto_id)!)] : null))
      .filter(Boolean)
      .join(', ') || 'ninguna';
  const personasTexto = (await almacen.personas()).map((p) => `${p.token} ${p.rol ?? 'otro'}`).join(', ') || 'ninguna';


  if (tr?.extraerSituacion) {
    const parcial = await pedirJson(deps, sistemaNoche(), [...alternar(turnos), { rol: 'usuario' as const, texto: EXTRAER_EXAMEN }], (j) =>
      validarExamen(j, { retoIdHoy: retoHoy?.id ?? null, idsCandidatos: [], catalogoDisparadores: new Set(disparadores.map((d) => d.clave)), parcial: true }),
    ).catch(() => null);
    sesion.estado.manana = parcial?.ok ? { disparador: parcial.valor.manana.disparador, personas: parcial.valor.manana.personas } : null;
  }
  if (tr?.calcularCandidatos || (sesion.estado.paso === 5 && !sesion.candidatos)) {
    const respaldo = escenarioRespaldo(await almacen.escenarios(), retos);
    const manana = sesion.estado.manana?.disparador ? sesion.estado.manana : { disparador: respaldo.disparador, personas: respaldo.personas };
    sesion.candidatos = calcularCandidatos({
      perfil,
      niveles: perfil.niveles,
      historial: await almacen.historial(sumarDias(fecha, -90)),
      hoy: sumarDias(fecha, 1),
      manana,
      retos,
      disparadores,
    });
  }

  function sistemaNoche(): string {
    return sistemaNocheCon(sesion);
  }
  function sistemaNocheCon(s: SesionNoche): string {
    const virtudReto = virtudesReto(perfil!.temperamento_dominante, perfil!.temperamento_secundario).principal;
    const modo = rellenar(MODO_NOCHE, {
      temperamento_dominante: NOMBRE_TEMP[perfil!.temperamento_dominante],
      temperamento_secundario: perfil!.temperamento_secundario ? NOMBRE_TEMP[perfil!.temperamento_secundario] : null,
      virtud_reto: NOMBRE_VIRTUD[virtudReto],
      mision: perfil!.mision,
      reto_id: retoHoy?.id ?? null,
      reto_de_hoy: hoy?.reto_texto ?? retoHoy?.texto ?? null,
      virtud: retoHoy ? NOMBRE_VIRTUD[virtudClave(retoHoy)] : null,
      pregunta_examen: retoHoy?.pregunta_examen ?? null,
      niveles: Object.entries(perfil!.niveles)
        .map(([k, n]) => `${k} ${Number(n).toFixed(1)}`)
        .join(', '),
      virtudes_recientes: virtudesRecientes,
      personas_conocidas: personasTexto,
      candidatos: s.candidatos
        ? JSON.stringify(s.candidatos.map((c) => ({ id: c.reto_id, texto: c.texto, virtud: c.virtud, disparador: c.disparador, intensidad: c.intensidad })))
        : 'se calculan antes del paso 5',
      paso: s.estado.paso,
      prisa: s.estado.prisa,
    });
    const base = sistema(disparadores, modo);
    return s.estado.atencion ? `${base}\n\n${LINEA_ATENCION}` : base;
  }

  const mensajes = alternar(turnos.length ? turnos : [{ rol: 'usuario', texto: '(La persona abre el examen.)' }]);
  const respuesta = (await deps.modelo.completar({ uso: 'coach', sistema: sistemaNoche(), mensajes })).trim();
  await almacen.anadirTurnoNoche(fecha, { rol: 'coach', texto: respuesta });
  turnos.push({ rol: 'coach', texto: respuesta });

  if (tr?.accion === 'coach_y_cerrar') await cerrarNoche(deps, fecha, sesion, turnos, perfil, retos, disparadores, sistemaNoche());
  await almacen.guardarSesionNoche(fecha, sesion);
  return responder(await seudo.restaurar(respuesta), sesion);
}

async function cerrarNoche(
  deps: Dependencias,
  fecha: string,
  sesion: SesionNoche,
  turnos: Turno[],
  perfil: PerfilGuardado,
  retos: Reto[],
  disparadores: Disparador[],
  sistemaNoche?: string,
): Promise<void> {
  const { almacen } = deps;
  const porId = new Map(retos.map((r) => [r.id, r]));
  const hoy = await almacen.dia(fecha);
  const retoHoy = hoy?.reto_id ? porId.get(hoy.reto_id) ?? null : null;
  const manana = sumarDias(fecha, 1);
  const catalogo = new Set(disparadores.map((d) => d.clave));

  // Si se cerró antes del paso 5 no hay candidatos: el motor los calcula con el respaldo.
  if (!sesion.candidatos) {
    const respaldo = escenarioRespaldo(await almacen.escenarios(), retos);
    sesion.candidatos = calcularCandidatos({
      perfil,
      niveles: perfil.niveles,
      historial: await almacen.historial(sumarDias(fecha, -90)),
      hoy: manana,
      manana: { disparador: respaldo.disparador, personas: respaldo.personas },
      retos,
      disparadores,
    });
  }
  const ids = sesion.candidatos.map((c) => c.reto_id);

  let examen: ExamenJson | null = null;
  if (sistemaNoche) {
    const v = await pedirJson(deps, sistemaNoche, [...alternar(turnos), { rol: 'usuario', texto: EXTRAER_EXAMEN }], (j) =>
      validarExamen(j, { retoIdHoy: retoHoy?.id ?? null, idsCandidatos: ids, catalogoDisparadores: catalogo }),
    ).catch(() => null);
    if (v?.ok) examen = v.valor;
  }
  if (examen?.senal_crisis) {
    await almacen.marcarCrisis(fecha);
    return;
  }

  // Lo que la persona marcó con botones es determinista y manda sobre la extracción.
  const e = sesion.estado;
  const resultado = e.resultado ?? examen?.resultado ?? 'sin_respuesta';
  const tipoFallo = resultado === 'si' ? null : e.tipo_fallo ?? examen?.tipo_fallo ?? null;
  const elegido = examen?.reto_manana.reto_id ? examen.reto_manana : null;
  const candidato = sesion.candidatos.find((c) => c.reto_id === elegido?.reto_id) ?? sesion.candidatos[0];

  let nivel: CierreNoche['nivel'] = null;
  if (retoHoy && resultado !== 'sin_respuesta') {
    const v = virtudClave(retoHoy);
    const hist = await almacen.historialNivel(v, fecha, 13);
    const n = actualizarNivel(perfil.niveles[v], perfil.confianza[v] ?? 0, hist, resultado, tipoFallo);
    nivel = { virtud: v, ...n };
  }

  const memoria = cambiosMemoria(await almacen.personas(), await almacen.escenarios(), {
    personas_nuevas: examen?.dia.personas_nuevas ?? [],
    personas_mencionadas: examen?.dia.personas_mencionadas ?? [],
    manana: examen ? { disparador: examen.manana.disparador, personas: examen.manana.personas } : null,
  });

  await almacen.guardarCierreNoche({
    fecha,
    manana,
    hoy: {
      resultado,
      tipo_fallo: tipoFallo,
      nota_usuario: examen?.nota_usuario ?? null,
      resumen_dia: examen?.dia.resumen ?? null,
      obstaculos: examen?.dia.obstaculos_detectados ?? [],
      paso_alcanzado: Math.max(e.paso, examen?.paso_alcanzado ?? 1),
      modo_prisa: e.prisa,
      nivel_atencion: e.atencion ? 'atencion' : 'ninguno',
    },
    nivel,
    memoria,
    etiquetaEscenarioNuevo: memoria.escenarioNuevo ? examen?.manana.situacion ?? null : null,
    diaManana: {
      reto_id: candidato.reto_id,
      reto_texto: elegido?.texto_final ?? null,
      reto_porque: null,
      situacion: examen?.manana.situacion ?? null,
      disparador: examen?.manana.disparador ?? e.manana?.disparador ?? null,
      personas: examen?.manana.personas ?? e.manana?.personas ?? [],
      reescrito_por_usuario: elegido?.fue_reescrito_por_usuario ?? false,
    },
  });

  // 03 §5: generar ya el reto de mañana (modo MAÑANA) para que por la mañana sea inmediato.
  try {
    await retoDelDia(deps, manana);
  } catch (err) {
    deps.log?.('manana_tras_noche_error', { error: String(err) });
  }
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
export interface RespuestaOnboarding {
  mensaje: string;
  terminado: boolean;
  crisis: boolean;
}

const MAX_TURNOS_ONBOARDING = 14;

export async function turnoOnboarding(
  deps: Dependencias,
  fecha: string,
  textoUsuario: string | null,
  temperamentoConocido: { dominante: Temperamento; secundario: Temperamento | null } | null,
): Promise<RespuestaOnboarding> {
  const { almacen, seudo } = deps;
  const { disparadores } = await almacen.catalogo();
  const sesion: SesionOnboarding = (await almacen.sesionOnboarding()) ?? { turnos: [], cerrada: false };
  if (sesion.cerrada || (await almacen.perfil())) return { mensaje: 'Tu perfil ya está listo.', terminado: true, crisis: false };

  if (sesion.turnos.length === 0) {
    // Dato del sistema, no reescritura del prompt: el temperamento ya medido por el test TBP.
    sesion.turnos.push({
      rol: 'usuario',
      texto: temperamentoConocido
        ? `(Dato del sistema: la persona ya hizo el test de temperamento. Dominante: ${NOMBRE_TEMP[temperamentoConocido.dominante]}${
            temperamentoConocido.secundario ? `; secundario: ${NOMBRE_TEMP[temperamentoConocido.secundario]}` : ''
          }. No hace falta preguntarlo.)\nHola.`
        : 'Hola.',
    });
  }
  if (textoUsuario) {
    const texto = await seudo.seudonimizar(textoUsuario);
    const c = await clasificar(deps, texto);
    if (c.nivel === 'crisis') {
      await almacen.guardarSesionOnboarding(sesion);
      return { mensaje: deps.mensajeCrisis, terminado: false, crisis: true };
    }
    sesion.turnos.push({ rol: 'usuario', texto });
  }

  const sist = sistema(disparadores, MODO_ONBOARDING);
  const respuesta = (await deps.modelo.completar({ uso: 'coach', sistema: sist, mensajes: alternar(sesion.turnos) })).trim();
  sesion.turnos.push({ rol: 'coach', texto: respuesta });

  const turnosUsuario = sesion.turnos.filter((t) => t.rol === 'usuario').length;
  const fin = (/buenos d[ií]as/i.test(respuesta) && turnosUsuario >= 4) || turnosUsuario >= MAX_TURNOS_ONBOARDING;
  if (fin) {
    const v = await pedirJson(deps, sist, [...alternar(sesion.turnos), { rol: 'usuario', texto: EXTRAER_PERFIL }], (j) =>
      validarPerfil(j, new Set(disparadores.map((d) => d.clave))),
    );
    if (v.ok) {
      const p = temperamentoConocido
        ? {
            ...v.valor,
            temperamento_dominante: temperamentoConocido.dominante,
            temperamento_secundario: temperamentoConocido.secundario,
            confianza_temperamento: 0.9,
          }
        : v.valor;
      await almacen.guardarPerfil(p, fecha);
      sesion.cerrada = true;
    } else {
      deps.log?.('perfil_invalido', { error: v.error });
    }
  }
  await almacen.guardarSesionOnboarding(sesion);
  return { mensaje: await seudo.restaurar(respuesta), terminado: sesion.cerrada, crisis: false };
}
