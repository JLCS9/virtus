-- Camino · fichas de personas («Descubre el temperamento de X»). Guardan datos de terceros que no
-- han dado su consentimiento: datos mínimos (nombre o apodo, grupo, relación), visibles solo para
-- la propia cuenta y borrables una a una o todas a la vez.
--   personas                  la ficha y su temperamento estimado actual.
--   persona_estimaciones      cada vez que se hace el test de 8 preguntas sobre esa persona.
--   persona_observaciones     «lo que he visto de X»: una reacción con fecha.

create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 40),
  grupo text not null check (grupo in ('familia','amigos','trabajo','comunidad')),
  relacion text check (char_length(relacion) <= 30),
  avatar text check (char_length(avatar) <= 8),
  estrella boolean not null default false,          -- colaborador privilegiado (privada)
  me_cuesta boolean not null default false,         -- marca privada; nunca sale de la cuenta
  estado text not null default 'sin_estimar' check (estado in ('sin_estimar','estimado','confirmado')),
  primario text check (primario in ('COL','MEL','SAN','FLE')),
  secundario text check (secundario in ('COL','MEL','SAN','FLE')),
  confianza text check (confianza in ('alta','media','baja')),
  puntos jsonb,                                     -- puntos del último test: { COL, MEL, SAN, FLE }
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists personas_user_idx on public.personas (user_id);

create table if not exists public.persona_estimaciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  respuestas jsonb not null,                        -- 8 respuestas: 'COL' | 'MEL' | 'SAN' | 'FLE' | 'nose'
  desempate jsonb,                                  -- { rapidez: 'rapido'|'lento', duracion: 'mucho'|'pronto' }
  puntos jsonb not null,
  primario text check (primario in ('COL','MEL','SAN','FLE')),
  secundario text check (secundario in ('COL','MEL','SAN','FLE')),
  confianza text check (confianza in ('alta','media','baja')),
  creado_en timestamptz not null default now()
);
create index if not exists persona_estimaciones_persona_idx on public.persona_estimaciones (persona_id);

create table if not exists public.persona_observaciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  situacion text not null check (situacion in ('critica','cambio_planes','problema','buena_noticia','desacuerdo','otro')),
  palabra text not null check (char_length(palabra) <= 40),
  temperamento text not null check (temperamento in ('COL','MEL','SAN','FLE')),
  linea text check (char_length(linea) <= 280),
  creado_en timestamptz not null default now()
);
create index if not exists persona_observaciones_persona_idx on public.persona_observaciones (persona_id);

alter table public.personas enable row level security;
alter table public.persona_estimaciones enable row level security;
alter table public.persona_observaciones enable row level security;

drop policy if exists own_all on public.personas;
create policy own_all on public.personas for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Estimaciones y observaciones: propias y siempre de una ficha propia.
drop policy if exists own_all on public.persona_estimaciones;
create policy own_all on public.persona_estimaciones for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.personas p where p.id = persona_id and p.user_id = auth.uid()));

drop policy if exists own_all on public.persona_observaciones;
create policy own_all on public.persona_observaciones for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.personas p where p.id = persona_id and p.user_id = auth.uid()));

revoke all on public.personas, public.persona_estimaciones, public.persona_observaciones from anon;
grant select, insert, update, delete on public.personas, public.persona_estimaciones, public.persona_observaciones to authenticated;
