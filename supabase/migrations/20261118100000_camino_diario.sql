-- Copia de virtuous-leadership-web/supabase-migraciones/20261118_camino_diario.sql (la web manda en el esquema).
-- Ya aplicada en el Supabase de producción (qyuxmqvqmgqcsduzljkd); comprobado el 2026-11-19.

-- Camino diario: reto de la mañana, examen de la noche y hábitos.
--
-- Qué hace
--   Crea cuatro tablas en public, todas con acceso por fila (cada cuenta solo ve y escribe lo suyo):
--     · camino_variables  Lo que el usuario cuenta de su vida (persona_trabajo, proyecto…): una fila por
--                         usuario y variable. Las variables entre llaves de los retos se rellenan de aquí.
--     · camino_dia        Un día: el reto y la cita que se enseñaron, la opción elegida, si la cumplió, la
--                         reflexión y la respuesta a la pregunta para nutrir. Una fila por usuario y fecha.
--     · habitos           Los hábitos del usuario (en prueba, activo, consolidado, en revisión, retirado).
--     · habito_marcas     Una fila por casilla marcada de un hábito en un día.
--
-- Por qué
--   El contenido (retos, citas, variables, reglas de hábitos) vive en la web, en
--   src/data/camino-biblioteca.json. En la base de datos solo va lo que escribe el usuario. Los límites y
--   umbrales de los hábitos (máximo activos, días de prueba…) NO se guardan aquí: salen de la biblioteca.
--
-- Qué NO toca
--   Ninguna tabla existente. No usa perfil_camino, actividad_diaria ni preguntas_respuestas_ejercicios
--   (las lee la app móvil), ni metodo.*, ni suscripciones_retos, ni preferencias_notificaciones.
--   Solo hace referencia a auth.users y a public.personas (para que una variable pueda apuntar a una
--   ficha de «Tu entorno»; si la ficha se borra, la variable conserva el texto).
--
-- Para quien la aplique (Infra/BD)
--   · COMPRUEBA ANTES que no existen ya tablas con estos cuatro nombres (hubo un camino_dias en una
--     migración antigua de la app). `create table if not exists` no avisaría de una estructura distinta.
--   · Es idempotente: se puede ejecutar más de una vez. No borra ni modifica datos existentes.
--
-- Estado: PENDIENTE DE APLICAR (preparada el 2026-11-18, no aplicada en producción).

-- ───────────── Utilidad: actualizado_en ─────────────

create or replace function public.camino_tocar()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ───────────── camino_variables ─────────────

create table if not exists public.camino_variables (
  user_id uuid not null references auth.users(id) on delete cascade,
  variable text not null check (variable ~ '^[a-z_]{1,40}$'),
  -- Nulo: la pregunta se saltó (cuenta como respondida, y se usa el texto por defecto).
  valor text check (valor is null or char_length(valor) between 1 and 120),
  -- Si se eligió de «Tu entorno». Si se borra la ficha, queda en nulo y se conserva `valor`.
  persona_id uuid references public.personas(id) on delete set null,
  origen text not null default 'manual' check (origen in ('inicial', 'noche', 'manual')),
  actualizado_en timestamptz not null default now(),
  primary key (user_id, variable)
);

drop trigger if exists camino_variables_tocar on public.camino_variables;
create trigger camino_variables_tocar
  before insert or update on public.camino_variables
  for each row execute function public.camino_tocar();

alter table public.camino_variables enable row level security;

drop policy if exists own_all on public.camino_variables;
create policy own_all on public.camino_variables for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (persona_id is null or exists (
      select 1 from public.personas p where p.id = persona_id and p.user_id = auth.uid()
    ))
  );

revoke all on public.camino_variables from anon, authenticated;
grant select, insert, update on public.camino_variables to authenticated;

-- ───────────── camino_dia ─────────────

create table if not exists public.camino_dia (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Fecha local del usuario (no la de UTC).
  fecha date not null,
  -- Ids de la biblioteca (C01…, Q25…). Se fijan al abrir la mañana y no cambian durante el día.
  reto_id text check (reto_id is null or char_length(reto_id) between 1 and 10),
  cita_id text check (cita_id is null or char_length(cita_id) between 1 and 10),
  temperamento text check (temperamento is null or temperamento in ('COL', 'MEL', 'SAN', 'FLE')),
  opcion text check (opcion is null or opcion in ('persona', 'habito', 'situacion')),
  -- El texto ya con las variables sustituidas, tal como lo aceptó el usuario.
  texto text check (texto is null or char_length(texto) <= 500),
  elegido_en timestamptz,
  cumplido text check (cumplido is null or cumplido in ('si', 'a_medias', 'no')),
  reflexion text check (reflexion is null or char_length(reflexion) <= 500),
  nutrir_variable text check (nutrir_variable is null or nutrir_variable ~ '^[a-z_]{1,40}$'),
  nutrir_respuesta text check (nutrir_respuesta is null or char_length(nutrir_respuesta) <= 120),
  examen_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  primary key (user_id, fecha)
);

drop trigger if exists camino_dia_tocar on public.camino_dia;
create trigger camino_dia_tocar
  before insert or update on public.camino_dia
  for each row execute function public.camino_tocar();

alter table public.camino_dia enable row level security;

drop policy if exists own_all on public.camino_dia;
create policy own_all on public.camino_dia for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.camino_dia from anon, authenticated;
grant select, insert, update on public.camino_dia to authenticated;

-- ───────────── habitos ─────────────

create table if not exists public.habitos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 200),
  -- Vínculo obligatorio con una de las seis virtudes.
  virtud text not null check (virtud in ('humildad', 'magnanimidad', 'prudencia', 'dominio_de_si', 'fortaleza', 'justicia')),
  -- Nulo si lo escribió el usuario en lugar de salir de una opción B.
  reto_id text check (reto_id is null or char_length(reto_id) between 1 and 10),
  estado text not null default 'en_prueba' check (estado in ('en_prueba', 'activo', 'consolidado', 'en_revision', 'retirado')),
  alta_en date not null default current_date,
  estado_desde date not null default current_date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists habitos_user_idx on public.habitos (user_id);

drop trigger if exists habitos_tocar on public.habitos;
create trigger habitos_tocar
  before insert or update on public.habitos
  for each row execute function public.camino_tocar();

alter table public.habitos enable row level security;

drop policy if exists own_all on public.habitos;
create policy own_all on public.habitos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.habitos from anon, authenticated;
-- Sin delete: un hábito que se deja pasa a «retirado» y queda en el historial.
grant select, insert, update on public.habitos to authenticated;

-- ───────────── habito_marcas ─────────────

create table if not exists public.habito_marcas (
  habito_id uuid not null references public.habitos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  creado_en timestamptz not null default now(),
  primary key (habito_id, fecha)
);

create index if not exists habito_marcas_user_fecha_idx on public.habito_marcas (user_id, fecha);

alter table public.habito_marcas enable row level security;

drop policy if exists own_all on public.habito_marcas;
create policy own_all on public.habito_marcas for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.habitos h where h.id = habito_id and h.user_id = auth.uid())
  );

revoke all on public.habito_marcas from anon, authenticated;
-- Desmarcar una casilla borra su fila.
grant select, insert, delete on public.habito_marcas to authenticated;
