-- Virtus · Retos diarios de carácter (método Havard). Nombres de tablas y campos según
-- 03_Esquema_datos_y_motor.md. Identidad y contenido van separados:
--   identidad.*  conoce user_id ↔ pseudo_id y el diccionario de tokens (cifrado).
--   metodo.*     solo conoce pseudo_id. Nunca se expone por la API REST: solo lo tocan las
--                Edge Functions retos-* con conexión directa (SUPABASE_DB_URL).
-- Los campos [cifrado] del 03 son bytea con public.field_enc (clave en Vault, fase 1).
-- Extensiones respecto al 03 (necesarias para un orquestador sin estado):
--   reto.perfil_combinado, nivel_virtud_historial, sesion.

create schema if not exists identidad;
create schema if not exists metodo;
revoke all on schema identidad, metodo from public, anon, authenticated;

-- ── Identidad ────────────────────────────────────────────────────────────────
create table identidad.user_pseudonym (
  user_id    uuid primary key references auth.users on delete cascade,
  pseudo_id  uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table identidad.token_map (
  user_id       uuid not null references auth.users on delete cascade,
  token         text not null check (token ~ '^\[(P|ORG|L|F)[0-9]+\]$'),
  valor_cifrado bytea not null,
  tipo          text not null check (tipo in ('P','ORG','L','F')),
  primary key (user_id, token)
);

-- ── Catálogos ────────────────────────────────────────────────────────────────
create table metodo.disparador (
  clave       text primary key,
  descripcion text not null,
  ambito      text check (ambito in ('trabajo','familia','amistad','vida interior','cultura','cuerpo','sociedad'))
);

-- ── Biblioteca ───────────────────────────────────────────────────────────────
create table metodo.reto (
  id                    text primary key,
  texto                 text not null,
  variante_corta        text,
  virtud                text not null check (virtud in ('prudencia','fortaleza','dominio de sí','justicia','magnanimidad','humildad')),
  subcomponente         text check (subcomponente in ('deliberacion','decision','audacia','resistencia','fundamental','fraternal')),
  facultad              text not null check (facultad in ('corazon','razon','voluntad')),
  ambito                text not null check (ambito in ('trabajo','familia','amistad','vida interior','cultura','cuerpo','sociedad')),
  tipo                  text not null check (tipo in ('accion','omision','contemplacion')),
  minutos_estimados     smallint,
  requiere_otra_persona boolean not null default false,
  disparador            text references metodo.disparador,
  dif_colerico          smallint check (dif_colerico between 1 and 5),
  dif_melancolico       smallint check (dif_melancolico between 1 and 5),
  dif_sanguineo         smallint check (dif_sanguineo between 1 and 5),
  dif_flematico         smallint check (dif_flematico between 1 and 5),
  obstaculo             text,
  repetible             boolean,
  pregunta_examen       text not null,
  fuente_libro          text, fuente_seccion text, cita_literal text,
  -- Extensión: retos «gt-*» solo para un perfil dominante-secundario (p. ej. 'MEL-COL').
  perfil_combinado      text,
  activo                boolean default true
);

-- ── Perfil y niveles ─────────────────────────────────────────────────────────
create table metodo.perfil (
  pseudo_id               uuid primary key,
  temperamento_dominante  text not null check (temperamento_dominante in ('colerico','melancolico','sanguineo','flematico')),
  temperamento_secundario text check (temperamento_secundario in ('colerico','melancolico','sanguineo','flematico')),
  confianza_temperamento  real,
  mision                  bytea,   -- [cifrado]
  notas                   bytea,   -- [cifrado]
  creado_en               timestamptz not null default now(),
  actualizado_en          timestamptz not null default now()
);

create table metodo.nivel_virtud (
  pseudo_id      uuid references metodo.perfil on delete cascade,
  virtud         text check (virtud in ('prudencia','fortaleza_audacia','fortaleza_resistencia','dominio_de_si',
                                        'justicia','magnanimidad','humildad_fundamental','humildad_fraternal')),
  nivel          real check (nivel between 1 and 5),
  confianza      real,
  actualizado_en timestamptz not null default now(),
  primary key (pseudo_id, virtud)
);

-- Extensión: serie diaria para la media móvil de 14 días (03 §3.2 «usuario.historial[v]»).
create table metodo.nivel_virtud_historial (
  pseudo_id uuid references metodo.perfil on delete cascade,
  virtud    text,
  fecha     date,
  nivel     real check (nivel between 1 and 5),
  primary key (pseudo_id, virtud, fecha)
);

create table metodo.persona (
  pseudo_id      uuid references metodo.perfil on delete cascade,
  token          text,
  rol            text check (rol in ('superior','colaborador','pareja','hijo','amigo','padre','otro')),
  notas          bytea,   -- [cifrado]
  menciones      int default 0,
  ultima_mencion date,
  primary key (pseudo_id, token)
);

create table metodo.escenario (
  id         serial primary key,
  pseudo_id  uuid references metodo.perfil on delete cascade,
  etiqueta   bytea,   -- [cifrado]
  disparador text references metodo.disparador,
  personas   text[] not null default '{}',
  frecuencia int default 1
);
create index on metodo.escenario (pseudo_id);

-- ── Registro diario ──────────────────────────────────────────────────────────
create table metodo.dia (
  pseudo_id             uuid references metodo.perfil on delete cascade,
  fecha                 date,
  reto_id               text references metodo.reto,
  reto_texto            bytea,   -- [cifrado]
  reto_porque           text,
  situacion             bytea,   -- [cifrado]
  disparador            text,
  personas              text[],
  resultado             text check (resultado in ('si','a_medias','no','sin_respuesta')),
  tipo_fallo            text check (tipo_fallo in ('reaccion','decision')),
  nota_usuario          bytea,   -- [cifrado]
  resumen_dia           bytea,   -- [cifrado]
  obstaculos            text[],
  paso_alcanzado        smallint,
  modo_prisa            boolean,
  reescrito_por_usuario boolean,
  nivel_atencion        text check (nivel_atencion in ('ninguno','atencion','crisis')),
  primary key (pseudo_id, fecha)
);

create table metodo.conversacion_noche (
  pseudo_id uuid references metodo.perfil on delete cascade,
  fecha     date,
  turno     smallint,
  rol       text check (rol in ('usuario','coach')),
  texto     bytea,   -- [cifrado], ya seudonimizado
  creado_en timestamptz not null default now(),
  primary key (pseudo_id, fecha, turno)
);

-- Extensión: estado del orquestador entre peticiones (las Edge Functions no guardan estado).
-- Onboarding: no hay perfil todavía, por eso la clave es pseudo_id sin FK.
create table metodo.sesion (
  pseudo_id      uuid,
  fecha          date,
  modo           text check (modo in ('onboarding','noche')),
  paso           smallint not null default 1,
  prisa          boolean not null default false,
  candidatos     jsonb,            -- los 5 enviados al modelo (sin texto de usuario)
  estado         jsonb not null default '{}',
  turnos         bytea,            -- [cifrado] solo onboarding: [{rol, texto}] seudonimizado
  cerrada        boolean not null default false,
  actualizado_en timestamptz not null default now(),
  primary key (pseudo_id, fecha, modo)
);

-- ── Borrado (03 §7): token_map primero, después todo lo del pseudo_id ─────────
create or replace function identidad.borrar_usuario(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_pseudo uuid;
begin
  delete from identidad.token_map where user_id = p_user_id;
  select pseudo_id into v_pseudo from identidad.user_pseudonym where user_id = p_user_id;
  if v_pseudo is not null then
    delete from metodo.sesion where pseudo_id = v_pseudo;
    delete from metodo.perfil where pseudo_id = v_pseudo;   -- cascada al resto de metodo.*
    delete from identidad.user_pseudonym where user_id = p_user_id;
  end if;
end $$;
revoke all on function identidad.borrar_usuario(uuid) from public, anon, authenticated;

-- Red de seguridad: si se borra la cuenta sin pasar por delete-account, el contenido
-- del método no queda huérfano.
create or replace function identidad.on_pseudonym_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from metodo.sesion where pseudo_id = old.pseudo_id;
  delete from metodo.perfil where pseudo_id = old.pseudo_id;
  return old;
end $$;
create trigger user_pseudonym_delete after delete on identidad.user_pseudonym
  for each row execute function identidad.on_pseudonym_delete();

-- ── Acceso por funcionalidad (la web de retos solo para cuentas autorizadas) ──
create table public.feature_access (
  user_id    uuid not null references auth.users on delete cascade,
  feature    text not null,
  granted_at timestamptz not null default now(),
  primary key (user_id, feature)
);
alter table public.feature_access enable row level security;
create policy own_read on public.feature_access for select using (user_id = auth.uid());

-- Jose (jose@csodigital.tech) prueba la web de retos. Si la cuenta aún no existe, no hace nada.
insert into public.feature_access (user_id, feature)
select id, 'retos_web' from auth.users where email = 'jose@csodigital.tech'
on conflict do nothing;

-- ── Retención (03 §7): conversación nocturna 30 días ─────────────────────────
create extension if not exists pg_cron;
select cron.schedule('retos-retencion-conversacion', '17 3 * * *', $$
  delete from metodo.conversacion_noche where fecha < current_date - 30;
  update metodo.sesion set turnos = null, estado = '{}' where fecha < current_date - 30;
$$);
