-- Progreso de la formación compartido entre la app móvil y la web (misma cuenta).
-- Solo guarda qué lecciones se han visto y cuál se abrió la última: nada sensible.
create table if not exists public.formacion_progreso (
  user_id uuid not null references auth.users(id) on delete cascade,
  leccion_id text not null,
  visto_en timestamptz not null default now(),
  primary key (user_id, leccion_id)
);

create table if not exists public.formacion_estado (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ultima text,
  actualizado_en timestamptz not null default now()
);

alter table public.formacion_progreso enable row level security;
alter table public.formacion_estado enable row level security;

drop policy if exists own_all on public.formacion_progreso;
create policy own_all on public.formacion_progreso for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_all on public.formacion_estado;
create policy own_all on public.formacion_estado for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.formacion_progreso, public.formacion_estado from anon;
grant select, insert, update, delete on public.formacion_progreso, public.formacion_estado to authenticated;
