-- Camino · semanas 0 y 1 (los 14 primeros días). Sustituye al reto diario generado por la IA y a la
-- conversación de la noche en el panel web.
--   camino_perfil      «Personaliza tu camino» (onboarding) y el día en que empieza.
--   camino_dias        lo hecho cada día del camino: la sesión (juego) y el examen de la noche.
--   camino_linea_base  «Mi punto de partida» (día 6). Se relee en el día 14 y en la semana 9.
-- Todo es de la propia cuenta: cada persona lee y escribe solo sus filas.

create table if not exists public.camino_perfil (
  user_id uuid primary key references auth.users(id) on delete cascade,
  momentos text[] not null default '{}'
    check (momentos <@ array['estudio','trabajo','dirijo','familia','jubilado','otro']),
  estado_vida text check (estado_vida in ('soltero','casado','religioso','no_dice')),
  objetivo text check (objetivo in ('conocerme','liderar','relaciones','mision')),
  vida_interior text check (vida_interior in ('si','no','mas_adelante')),
  dia_video smallint not null check (dia_video between 1 and 7),  -- ISO: 1 lunes … 7 domingo
  hora_examen time not null default '21:30',
  inicio date not null,                                           -- día 1 del camino (fecha local)
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.camino_dias (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia smallint not null check (dia between 1 and 14),
  sesion_en timestamptz,         -- sesión terminada
  juego jsonb,                   -- respuestas del juego del día
  con_quien text,                -- «¿Con quién vas a hacer hoy el reto?»
  examen_en timestamptz,         -- examen de la noche hecho
  examen jsonb,                  -- { reto, con_quien, palabra | animo, reconocio, gracias }
  actualizado_en timestamptz not null default now(),
  primary key (user_id, dia)
);

create table if not exists public.camino_linea_base (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fallo text check (fallo in ('arreglo','vueltas','cuento','acepto')),
  me_ven text[] not null default '{}' check (cardinality(me_ven) <= 3),
  me_gustaria text[] not null default '{}' check (cardinality(me_gustaria) <= 3),
  linea text check (char_length(linea) <= 280),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.camino_perfil enable row level security;
alter table public.camino_dias enable row level security;
alter table public.camino_linea_base enable row level security;

drop policy if exists own_all on public.camino_perfil;
create policy own_all on public.camino_perfil for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_all on public.camino_dias;
create policy own_all on public.camino_dias for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_all on public.camino_linea_base;
create policy own_all on public.camino_linea_base for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.camino_perfil, public.camino_dias, public.camino_linea_base from anon;
grant select, insert, update on public.camino_perfil, public.camino_dias, public.camino_linea_base to authenticated;
