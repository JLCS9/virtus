/**
 * Acceso a datos del portal: las mismas consultas que hace la web (virtuous-leadership-web,
 * src/account/*.js) contra el mismo Supabase. Si la web cambia una tabla o una columna, se cambia aquí.
 *
 *  - Cuenta y tests: profiles, test_results
 *  - Acceso: suscripciones_retos (el servidor lo vuelve a exigir en cada función)
 *  - Camino (BD v3): perfil_camino, actividad_diaria, preguntas_respuestas_ejercicios (+ ejercicios)
 *  - Personas: personas, persona_estimaciones, persona_observaciones
 *  - Perfil: consents, delete_own_account
 *  - Formación: función formacion-catalogo (el progreso vive en el dispositivo, como en la web)
 */
 
import { supabase as cliente } from '@/lib/supabase';

type Fila = Record<string, any>;

function db() {
  if (!cliente) throw new Error('sin_backend');
  return cliente;
}

export const hayCuentas = cliente !== null;

const ahora = () => new Date().toISOString();

// ── Cuenta (src/account/account.js) ─────────────────────────────────────────

export class AccountError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const pendienteDeTutor = (error: { code?: string; message?: string } | null) =>
  error?.code === 'user_banned' || /banned/i.test(error?.message || '');

export async function signIn(email: string, password: string) {
  const { error } = await db().auth.signInWithPassword({ email, password });
  if (error && pendienteDeTutor(error)) throw new AccountError('pending_guardian');
  if (error) throw new AccountError(error.status === 400 ? 'invalid' : 'failed');
}

export async function sendPasswordReset(email: string, redirectTo: string) {
  const { error } = await db().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new AccountError('failed');
}

export async function fetchLatestTemperament(): Promise<Fila | null> {
  const { data, error } = await db()
    .from('test_results')
    .select('result, taken_at')
    .eq('kind', 'temperament')
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AccountError('failed');
  return data;
}

export async function fetchLatestCharacter(): Promise<Fila | null> {
  const { data, error } = await db()
    .from('test_results')
    .select('result, taken_at')
    .eq('kind', 'character')
    .order('taken_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AccountError('failed');
  return data;
}

export async function fetchFirstName(user: { id: string; user_metadata?: Fila }): Promise<string> {
  const { data } = await db().from('profiles').select('first_name').eq('id', user.id).maybeSingle();
  return data?.first_name || user.user_metadata?.first_name || '';
}

// ── Acceso y funciones de servidor (src/account/retos.js) ───────────────────

export class RetosError extends Error {
  constructor(
    public code: string,
    public detalle: string | null = null,
  ) {
    super(code);
  }
}

/** ¿Suscripción activa? Solo decide qué interfaz enseñar: el servidor lo exige igualmente. */
export async function tieneAccesoRetos(): Promise<boolean> {
  if (!cliente) return false;
  const { data } = await cliente.from('suscripciones_retos').select('activa, hasta').maybeSingle();
  return Boolean(data?.activa && (!data.hasta || new Date(data.hasta) > new Date()));
}

async function llamar<T = any>(fn: string, body: Fila): Promise<T> {
  const { data, error } = await db().functions.invoke<T>(fn, { body, headers: { 'x-virtus-cliente': 'app' } });
  if (error) {
    const contexto = (error as { context?: Response }).context;
    const status = contexto?.status;
    let detalle: string | null = null;
    try {
      detalle = (await contexto?.json())?.detalle ?? null;
    } catch {
      /* sin cuerpo */
    }
    throw new RetosError(status === 403 ? 'forbidden' : status === 503 ? 'unavailable' : 'failed', detalle);
  }
  return data as T;
}

export const catalogoFormacion = () => llamar<{ cursos: any[] }>('formacion-catalogo', {});

// ── Camino, BD v3 (src/account/camino.js) ────────────────────────────────────

export class CaminoError extends Error {}

const comprobar = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
  if (error) throw new CaminoError(error.message);
  return data;
};

const parseFecha = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const DIA_MS = 86400000;
const diaNumero = (inicio: string, fecha: string) => Math.round((parseFecha(fecha).getTime() - parseFecha(inicio).getTime()) / DIA_MS) + 1;
const fechaDeDia = (inicio: string, dia: number) => {
  const d = parseFecha(inicio);
  d.setDate(d.getDate() + dia - 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const LINEA_BASE_MAP: Record<string, string> = {
  'Mi fallo principal': 'fallo',
  'Cómo me ven los demás': 'me_ven',
  'Cómo me gustaría ser': 'me_gustaria',
};
const ONBOARDING_IDS: Record<string, string> = {
  fallo: '64c9372c-08fc-4fd9-b0e7-656ce4f67a1f',
  me_ven: 'c611caac-6ac0-460a-9ee9-a7acdac8c72d',
  me_gustaria: 'e1db0dde-8e65-4143-964a-26af56d9bcab',
};
const ONBOARDING_PREGUNTAS: Record<string, string> = {
  fallo: 'Cuando algo me sale mal, yo…',
  me_ven: 'Los que me quieren dicen que soy…',
  me_gustaria: 'Me gustaría que dijeran que soy…',
};

export interface DatosCamino {
  perfil: Fila | null;
  dias: Fila[];
  lineaBase: Record<string, string> | null;
}

export async function leerCamino(): Promise<DatosCamino> {
  const perfilData = comprobar(await db().from('perfil_camino').select('*').maybeSingle());

  let dias: Fila[] = [];
  if (perfilData?.inicio) {
    const actividad = await db().from('actividad_diaria').select('*').order('fecha');
    if (!actividad.error && actividad.data?.length) {
      dias = actividad.data.map((row) => ({ ...row, dia: diaNumero(perfilData.inicio, row.fecha) }));
    }
  }

  let lineaBase: Record<string, string> | null = null;
  const resp = await db()
    .from('preguntas_respuestas_ejercicios')
    .select('respuesta, ejercicios!inner(titulo)')
    .eq('ejercicios.categoria', 'onboarding')
    .order('creado_en', { ascending: false });
  if (!resp.error && resp.data?.length) {
    lineaBase = {};
    for (const row of resp.data as Fila[]) {
      const campo = LINEA_BASE_MAP[row.ejercicios?.titulo];
      if (campo && !(campo in lineaBase)) lineaBase[campo] = row.respuesta;
    }
    if (!Object.keys(lineaBase).length) lineaBase = null;
  }

  return { perfil: perfilData, dias, lineaBase };
}

const PERFIL_CAMPOS = new Set([
  'momentos',
  'estado_vida',
  'objetivo',
  'vida_interior',
  'ritmo',
  'hora_manana',
  'hora_examen',
  'formato_examen',
  'ciclo_semanas',
  'notificaciones',
  'inicio',
]);

export async function guardarPerfilCamino(userId: string, campos: Fila) {
  const limpio: Fila = {};
  for (const [k, v] of Object.entries(campos)) if (PERFIL_CAMPOS.has(k)) limpio[k] = v;
  return comprobar(await db().from('perfil_camino').upsert({ user_id: userId, ...limpio, actualizado_en: ahora() }).select().single());
}

export async function guardarSesion(userId: string, dia: number, { juego, conQuien }: { juego?: unknown; conQuien?: string | null }, inicio: string) {
  const fecha = fechaDeDia(inicio, dia);
  return comprobar(
    await db()
      .from('actividad_diaria')
      .upsert({ user_id: userId, fecha, sesion_en: ahora(), juego: juego ?? null, con_quien: conQuien ?? null, actualizado_en: ahora() })
      .select()
      .single(),
  );
}

export async function guardarExamen(userId: string, dia: number, examen: unknown, inicio: string) {
  const fecha = fechaDeDia(inicio, dia);
  return comprobar(
    await db().from('actividad_diaria').upsert({ user_id: userId, fecha, examen_en: ahora(), examen, actualizado_en: ahora() }).select().single(),
  );
}

export async function guardarLineaBase(userId: string, campos: Record<string, string | null>) {
  const ids = Object.values(ONBOARDING_IDS);
  await db().from('preguntas_respuestas_ejercicios').delete().eq('user_id', userId).in('ejercicio_id', ids);
  const rows = Object.entries(ONBOARDING_IDS)
    .filter(([campo]) => campos[campo] != null)
    .map(([campo, ejercicioId]) => ({ user_id: userId, ejercicio_id: ejercicioId, pregunta: ONBOARDING_PREGUNTAS[campo], respuesta: campos[campo] }));
  if (rows.length) comprobar(await db().from('preguntas_respuestas_ejercicios').insert(rows));
  return campos;
}

// ── Personas (src/account/personas.js) ───────────────────────────────────────

export class PersonasError extends Error {}
const comprobarP = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
  if (error) throw new PersonasError(error.message);
  return data;
};

export async function listarPersonas(): Promise<Fila[]> {
  return comprobarP(await db().from('personas').select('*').order('creado_en')) ?? [];
}

export async function borrarTodasLasPersonas(userId: string) {
  comprobarP(await db().from('personas').delete().eq('user_id', userId));
}

export async function anioNacimiento(userId: string): Promise<number | null> {
  const { data } = await db().from('profiles').select('birth_year').eq('id', userId).maybeSingle();
  return data?.birth_year ?? null;
}

// ── Perfil (src/account/perfil.js) ───────────────────────────────────────────

export async function leerPerfil(userId: string) {
  const d = db();
  const [profile, tests, personas, camino, consents] = await Promise.all([
    d.from('profiles').select('*').eq('id', userId).single(),
    d.from('test_results').select('kind, result, taken_at').eq('user_id', userId).order('taken_at', { ascending: false }),
    d
      .from('personas')
      .select('nombre, grupo, relacion, primario, secundario, estado, estrella, me_cuesta')
      .eq('user_id', userId)
      .order('creado_en'),
    d
      .from('perfil_camino')
      .select('momentos, estado_vida, objetivo, vida_interior, ritmo, hora_manana, hora_examen, inicio')
      .eq('user_id', userId)
      .maybeSingle(),
    d.from('consents').select('purpose, granted, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);
  return {
    profile: profile.data as Fila | null,
    tests: (tests.data ?? []) as Fila[],
    personas: (personas.data ?? []) as Fila[],
    camino: camino.data as Fila | null,
    consents: (consents.data ?? []) as Fila[],
  };
}

export async function cambiarPassword(oldPassword: string, newPassword: string) {
  const {
    data: { user },
  } = await db().auth.getUser();
  if (!user?.email) throw new Error('No session');
  const { error: authErr } = await db().auth.signInWithPassword({ email: user.email, password: oldPassword });
  if (authErr) throw new Error('wrong_password');
  const { error } = await db().auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function actualizarPerfil(userId: string, campos: Fila) {
  const { error } = await db().from('profiles').update(campos).eq('id', userId);
  if (error) throw error;
}

export async function borrarCuenta() {
  const { error } = await db().rpc('delete_own_account');
  if (error) throw error;
  await db().auth.signOut({ scope: 'local' });
}

export async function salir() {
  await db().auth.signOut({ scope: 'local' });
}
