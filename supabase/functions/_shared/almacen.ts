/**
 * Almacén del orquestador sobre metodo.* (03 §2). Todo por pseudo_id; el texto libre se cifra
 * con public.field_enc y solo se guarda ya seudonimizado.
 */
import type {
  Almacen,
  Candidato,
  DiaGuardado,
  Disparador,
  Niveles,
  Reto,
  SesionNoche,
  SesionOnboarding,
  Turno,
  VirtudClave,
} from '../../../packages/method/src/retos/index.ts';

import { db } from './db.ts';

/** La sesión de onboarding es única por usuario: fecha fija como clave. */
const FECHA_ONBOARDING = '2000-01-01';

let catalogoCache: { retos: Reto[]; disparadores: Disparador[]; en: number } | null = null;

export function almacenPara(pseudo: string): Almacen {
  const sql = db();
  const json = (x: unknown) => sql.json(x as Parameters<typeof sql.json>[0]);
  return {
    async catalogo() {
      if (catalogoCache && Date.now() - catalogoCache.en < 10 * 60_000) return catalogoCache;
      const retos = (await sql`select * from metodo.reto`) as unknown as Reto[];
      const disparadores = (await sql`select clave, descripcion, ambito from metodo.disparador order by clave`) as unknown as Disparador[];
      catalogoCache = { retos, disparadores, en: Date.now() };
      return catalogoCache;
    },

    async perfil() {
      const [p] = await sql`
        select temperamento_dominante, temperamento_secundario, public.field_dec(mision) as mision
        from metodo.perfil where pseudo_id = ${pseudo}`;
      if (!p) return null;
      const niveles = {} as Niveles;
      const confianza = {} as Record<VirtudClave, number>;
      for (const n of await sql`select virtud, nivel, confianza from metodo.nivel_virtud where pseudo_id = ${pseudo}`) {
        niveles[n.virtud as VirtudClave] = Number(n.nivel);
        confianza[n.virtud as VirtudClave] = Number(n.confianza ?? 0);
      }
      return {
        temperamento_dominante: p.temperamento_dominante,
        temperamento_secundario: p.temperamento_secundario,
        mision: p.mision,
        niveles,
        confianza,
      };
    },

    async guardarPerfil(p, fecha) {
      await sql.begin(async (tx) => {
        await tx`
          insert into metodo.perfil (pseudo_id, temperamento_dominante, temperamento_secundario, confianza_temperamento, mision, notas)
          values (${pseudo}, ${p.temperamento_dominante}, ${p.temperamento_secundario}, ${p.confianza_temperamento},
                  public.field_enc(${p.mision}), public.field_enc(${p.notas}))`;
        for (const [virtud, nivel] of Object.entries(p.niveles)) {
          await tx`insert into metodo.nivel_virtud (pseudo_id, virtud, nivel, confianza) values (${pseudo}, ${virtud}, ${nivel}, 0)`;
          await tx`insert into metodo.nivel_virtud_historial (pseudo_id, virtud, fecha, nivel) values (${pseudo}, ${virtud}, ${fecha}, ${nivel})`;
        }
        const roles = new Map<string, string>();
        for (const e of p.escenarios) {
          await tx`
            insert into metodo.escenario (pseudo_id, etiqueta, disparador, personas)
            values (${pseudo}, public.field_enc(${e.etiqueta}), ${e.disparador}, ${e.personas.map((x) => x.token)})`;
          for (const x of e.personas) roles.set(x.token, x.rol);
        }
        for (const [token, rol] of roles) {
          await tx`
            insert into metodo.persona (pseudo_id, token, rol) values (${pseudo}, ${token}, ${rolValido(rol)})
            on conflict do nothing`;
        }
      });
    },

    async historial(desde) {
      const filas = await sql`
        select to_char(fecha, 'YYYY-MM-DD') as fecha, reto_id, resultado, tipo_fallo,
               coalesce(obstaculos, '{}') as obstaculos, reescrito_por_usuario
        from metodo.dia where pseudo_id = ${pseudo} and fecha >= ${desde} order by fecha`;
      return filas as unknown as Awaited<ReturnType<Almacen['historial']>>;
    },

    async historialNivel(virtud, antesDe, dias) {
      const filas = await sql`
        select nivel from metodo.nivel_virtud_historial
        where pseudo_id = ${pseudo} and virtud = ${virtud} and fecha < ${antesDe}
        order by fecha desc limit ${dias}`;
      return filas.map((f) => Number(f.nivel)).reverse();
    },

    async personas() {
      const filas = await sql`
        select token, rol, menciones, to_char(ultima_mencion, 'YYYY-MM-DD') as ultima_mencion
        from metodo.persona where pseudo_id = ${pseudo}`;
      return filas as unknown as Awaited<ReturnType<Almacen['personas']>>;
    },

    async escenarios() {
      const filas = await sql`
        select id, disparador, personas, frecuencia from metodo.escenario where pseudo_id = ${pseudo}`;
      return filas.map((f) => ({ id: f.id, disparador: f.disparador, personas: f.personas ?? [], frecuencia: f.frecuencia ?? 1 }));
    },

    async dia(fecha) {
      const [d] = await sql`
        select reto_id, public.field_dec(reto_texto) as reto_texto, reto_porque,
               public.field_dec(situacion) as situacion, disparador, coalesce(personas, '{}') as personas
        from metodo.dia where pseudo_id = ${pseudo} and fecha = ${fecha}`;
      return (d as unknown as DiaGuardado) ?? null;
    },

    async guardarRetoDelDia(fecha, d) {
      await sql`
        insert into metodo.dia (pseudo_id, fecha, reto_id, reto_texto, reto_porque, situacion, disparador, personas)
        values (${pseudo}, ${fecha}, ${d.reto_id}, public.field_enc(${d.reto_texto}), ${d.reto_porque},
                public.field_enc(${d.situacion}), ${d.disparador}, ${d.personas})
        on conflict (pseudo_id, fecha) do update set
          reto_id = excluded.reto_id, reto_texto = excluded.reto_texto, reto_porque = excluded.reto_porque,
          situacion = excluded.situacion, disparador = excluded.disparador, personas = excluded.personas`;
    },

    async sesionNoche(fecha) {
      const [s] = await sql`
        select estado, candidatos from metodo.sesion
        where pseudo_id = ${pseudo} and fecha = ${fecha} and modo = 'noche'`;
      return s ? ({ estado: s.estado, candidatos: (s.candidatos as Candidato[] | null) ?? null } as SesionNoche) : null;
    },

    async guardarSesionNoche(fecha, s) {
      await sql`
        insert into metodo.sesion (pseudo_id, fecha, modo, paso, prisa, candidatos, estado, cerrada, actualizado_en)
        values (${pseudo}, ${fecha}, 'noche', ${s.estado.paso}, ${s.estado.prisa}, ${s.candidatos ? json(s.candidatos) : null},
                ${json(s.estado)}, ${s.estado.cerrada}, now())
        on conflict (pseudo_id, fecha, modo) do update set
          paso = excluded.paso, prisa = excluded.prisa, candidatos = excluded.candidatos,
          estado = excluded.estado, cerrada = excluded.cerrada, actualizado_en = now()`;
    },

    async turnosNoche(fecha) {
      const filas = await sql`
        select rol, public.field_dec(texto) as texto from metodo.conversacion_noche
        where pseudo_id = ${pseudo} and fecha = ${fecha} order by turno`;
      return filas as unknown as Turno[];
    },

    async anadirTurnoNoche(fecha, t) {
      await sql`
        insert into metodo.conversacion_noche (pseudo_id, fecha, turno, rol, texto)
        select ${pseudo}, ${fecha}, coalesce(max(turno), 0) + 1, ${t.rol}, public.field_enc(${t.texto})
        from metodo.conversacion_noche where pseudo_id = ${pseudo} and fecha = ${fecha}`;
    },

    async sesionOnboarding() {
      const [s] = await sql`
        select public.field_dec(turnos) as turnos, cerrada from metodo.sesion
        where pseudo_id = ${pseudo} and fecha = ${FECHA_ONBOARDING} and modo = 'onboarding'`;
      return s ? ({ turnos: s.turnos ? JSON.parse(s.turnos) : [], cerrada: s.cerrada } as SesionOnboarding) : null;
    },

    async guardarSesionOnboarding(s) {
      await sql`
        insert into metodo.sesion (pseudo_id, fecha, modo, turnos, cerrada, actualizado_en)
        values (${pseudo}, ${FECHA_ONBOARDING}, 'onboarding', public.field_enc(${JSON.stringify(s.turnos)}), ${s.cerrada}, now())
        on conflict (pseudo_id, fecha, modo) do update set
          turnos = excluded.turnos, cerrada = excluded.cerrada, actualizado_en = now()`;
    },

    async guardarCierreNoche(c) {
      await sql.begin(async (tx) => {
        const h = c.hoy;
        await tx`
          insert into metodo.dia (pseudo_id, fecha, resultado, tipo_fallo, nota_usuario, resumen_dia, obstaculos,
                                  paso_alcanzado, modo_prisa, nivel_atencion)
          values (${pseudo}, ${c.fecha}, ${h.resultado}, ${h.tipo_fallo}, public.field_enc(${h.nota_usuario}),
                  public.field_enc(${h.resumen_dia}), ${h.obstaculos}, ${h.paso_alcanzado}, ${h.modo_prisa}, ${h.nivel_atencion})
          on conflict (pseudo_id, fecha) do update set
            resultado = excluded.resultado, tipo_fallo = excluded.tipo_fallo, nota_usuario = excluded.nota_usuario,
            resumen_dia = excluded.resumen_dia, obstaculos = excluded.obstaculos, paso_alcanzado = excluded.paso_alcanzado,
            modo_prisa = excluded.modo_prisa, nivel_atencion = excluded.nivel_atencion`;

        if (c.nivel) {
          await tx`
            update metodo.nivel_virtud set nivel = ${c.nivel.nivel}, confianza = ${c.nivel.confianza}, actualizado_en = now()
            where pseudo_id = ${pseudo} and virtud = ${c.nivel.virtud}`;
          await tx`
            insert into metodo.nivel_virtud_historial (pseudo_id, virtud, fecha, nivel)
            values (${pseudo}, ${c.nivel.virtud}, ${c.fecha}, ${c.nivel.nivel})
            on conflict (pseudo_id, virtud, fecha) do update set nivel = excluded.nivel`;
        }

        const m = c.memoria;
        for (const p of m.personasNuevas) {
          await tx`insert into metodo.persona (pseudo_id, token, rol) values (${pseudo}, ${p.token}, ${p.rol}) on conflict do nothing`;
        }
        if (m.personasMencionadas.length) {
          await tx`
            update metodo.persona set menciones = menciones + 1, ultima_mencion = ${c.fecha}
            where pseudo_id = ${pseudo} and token = any(${m.personasMencionadas})`;
        }
        if (m.escenarioIncrementado != null) {
          await tx`update metodo.escenario set frecuencia = frecuencia + 1 where id = ${m.escenarioIncrementado} and pseudo_id = ${pseudo}`;
        } else if (m.escenarioNuevo) {
          await tx`
            insert into metodo.escenario (pseudo_id, etiqueta, disparador, personas)
            values (${pseudo}, public.field_enc(${c.etiquetaEscenarioNuevo}), ${m.escenarioNuevo.disparador}, ${m.escenarioNuevo.personas})`;
        }

        const d = c.diaManana;
        await tx`
          insert into metodo.dia (pseudo_id, fecha, reto_id, reto_texto, situacion, disparador, personas, reescrito_por_usuario)
          values (${pseudo}, ${c.manana}, ${d.reto_id}, public.field_enc(${d.reto_texto}), public.field_enc(${d.situacion}),
                  ${d.disparador}, ${d.personas}, ${d.reescrito_por_usuario})
          on conflict (pseudo_id, fecha) do update set
            reto_id = excluded.reto_id, reto_texto = excluded.reto_texto, reto_porque = null, situacion = excluded.situacion,
            disparador = excluded.disparador, personas = excluded.personas, reescrito_por_usuario = excluded.reescrito_por_usuario`;
      });
    },

    async marcarCrisis(fecha) {
      await sql.begin(async (tx) => {
        await tx`
          insert into metodo.dia (pseudo_id, fecha, nivel_atencion) values (${pseudo}, ${fecha}, 'crisis')
          on conflict (pseudo_id, fecha) do update set nivel_atencion = 'crisis'`;
        // Se descarta la conversación de esa noche.
        await tx`delete from metodo.conversacion_noche where pseudo_id = ${pseudo} and fecha = ${fecha}`;
      });
    },
  };
}

const ROLES = ['superior', 'colaborador', 'pareja', 'hijo', 'amigo', 'padre', 'otro'];
const rolValido = (r: string) => (ROLES.includes(r) ? r : 'otro');
