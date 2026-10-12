-- Virtus · esquema inicial (v1). Región UE. RLS en todas las tablas.
-- Lo íntimo (diario, misión, roles, alias de colaboradores) se guarda cifrado en servidor:
-- la clave vive en Supabase Vault ('virtus_field_key') y solo la usan funciones SECURITY DEFINER.
-- El temperamento estimado de terceros NO existe en el servidor: solo en el dispositivo.

create extension if not exists pgcrypto with schema extensions;

-- ── Cifrado de campo ─────────────────────────────────────────────────────────
create or replace function private_field_key() returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'virtus_field_key' limit 1
$$;
revoke all on function private_field_key() from public, anon, authenticated;

create or replace function field_enc(plain text) returns bytea
language sql stable security definer set search_path = '' as $$
  select case when plain is null then null
    else extensions.pgp_sym_encrypt(plain, public.private_field_key()) end
$$;
create or replace function field_dec(cipher bytea) returns text
language sql stable security definer set search_path = '' as $$
  select case when cipher is null then null
    else extensions.pgp_sym_decrypt(cipher, public.private_field_key()) end
$$;
revoke all on function field_enc(text), field_dec(bytea) from public, anon, authenticated;

-- ── Perfil ───────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  locale text not null default 'es' check (locale in ('es','fr','en')),
  country text,
  spiritual boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Tests (datos, no código) ─────────────────────────────────────────────────
create table test_definitions (
  id text not null,
  version text not null,
  kind text not null check (kind in ('temperament','character','heart')),
  locale text not null,
  status text not null check (status in ('draft','approved')),
  definition jsonb not null,
  created_at timestamptz not null default now(),
  primary key (id, version, locale)
);

create table test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  test_id text not null,
  test_version text not null,
  kind text not null check (kind in ('temperament','character','heart')),
  -- temperamento: {percent, dominant, secondary, type, ...}; carácter: {self}
  result jsonb not null,
  source text not null default 'self' check (source in ('self','invitation')),
  taken_at timestamptz not null default now()
);
create index on test_results (user_id, kind, taken_at desc);

-- Mirada de los otros para el test de carácter (respuesta de una persona invitada)
create table character_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  invitation_id uuid,
  result jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Casillas (cifradas) ──────────────────────────────────────────────────────
create table boxes (
  user_id uuid primary key references auth.users on delete cascade,
  mission bytea,
  mission_notes bytea,
  roles bytea,
  updated_at timestamptz not null default now()
);

create table collaborators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  alias bytea not null,
  relation bytea,
  role text not null,
  invited_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Plan, ciclos y práctica ──────────────────────────────────────────────────
create table plans (
  user_id uuid primary key references auth.users on delete cascade,
  plan jsonb not null,
  updated_at timestamptz not null default now()
);

create table cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  virtue text not null,
  started_at timestamptz not null default now(),
  closed_at timestamptz
);

create table daily_entries (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  challenge_base_id text,
  accepted_at timestamptz,
  -- reto, examen y hábitos: cifrados
  payload bytea not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ── Contenido con taxonomía y derechos ───────────────────────────────────────
create table challenges_base (
  id text primary key,
  locale text not null,
  virtue text not null,
  roles text[] not null default '{}',
  temperaments text[] not null default '{}',
  moment text not null,
  text text not null,
  with_person text,
  source text not null,
  status text not null check (status in ('draft','approved'))
);

create table content_pieces (
  id text primary key,
  kind text not null check (kind in ('fragment','lesson','audio','clip','portrait','classic')),
  locale text not null,
  author text,
  body text,
  media_url text,
  temperaments text[] not null default '{}',
  virtues text[] not null default '{}',
  heart_profiles text[] not null default '{}',
  roles text[] not null default '{}',
  moment text,
  duration_min int,
  -- derechos: fuente, traductor y territorios donde se puede mostrar
  source text not null,
  translator text,
  territories text[] not null default '{*}',
  status text not null check (status in ('draft','approved'))
);

-- ── Círculos e invitaciones ──────────────────────────────────────────────────
create table invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('temperament','character_view')),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'base64url'),
  collaborator_id uuid references collaborators on delete set null,
  accepted_by uuid references auth.users on delete set null,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

create table circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table circle_members (
  circle_id uuid references circles on delete cascade,
  user_id uuid references auth.users on delete cascade,
  primary key (circle_id, user_id)
);

-- ── Instituciones (esqueleto v2) ─────────────────────────────────────────────
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  organization_id uuid references organizations on delete set null,
  provider text check (provider in ('revenuecat','stripe','organization')),
  status text not null default 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table test_definitions enable row level security;
alter table test_results enable row level security;
alter table character_views enable row level security;
alter table boxes enable row level security;
alter table collaborators enable row level security;
alter table plans enable row level security;
alter table cycles enable row level security;
alter table daily_entries enable row level security;
alter table challenges_base enable row level security;
alter table content_pieces enable row level security;
alter table invitations enable row level security;
alter table circles enable row level security;
alter table circle_members enable row level security;
alter table organizations enable row level security;
alter table subscriptions enable row level security;

-- Datos propios: cada usuario solo ve y escribe lo suyo.
create policy own on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy own on test_results for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_read on character_views for select using (user_id = auth.uid());
create policy own on plans for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own on cycles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_read on invitations for select using (inviter_id = auth.uid());
create policy own on circles for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_read on circle_members for select using (user_id = auth.uid());
create policy own_read on subscriptions for select using (user_id = auth.uid());
-- Las tablas cifradas (boxes, collaborators, daily_entries) no tienen políticas de acceso directo:
-- se leen y escriben solo mediante las funciones de abajo.

-- Contenido: lectura pública del aprobado (y de borradores durante el piloto).
create policy read_content on test_definitions for select using (true);
create policy read_challenges on challenges_base for select using (true);
create policy read_pieces on content_pieces for select using (true);

-- ── API cifrada (RPC) ────────────────────────────────────────────────────────
create or replace function save_boxes(p_mission text, p_mission_notes jsonb, p_roles jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  insert into public.boxes (user_id, mission, mission_notes, roles, updated_at)
  values (auth.uid(), public.field_enc(p_mission), public.field_enc(p_mission_notes::text), public.field_enc(p_roles::text), now())
  on conflict (user_id) do update set mission = excluded.mission, mission_notes = excluded.mission_notes,
    roles = excluded.roles, updated_at = now();
end $$;

create or replace function get_boxes()
returns table (mission text, mission_notes jsonb, roles jsonb, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select public.field_dec(b.mission), public.field_dec(b.mission_notes)::jsonb, public.field_dec(b.roles)::jsonb, b.updated_at
  from public.boxes b where b.user_id = auth.uid()
$$;

create or replace function save_daily_entry(p_day date, p_challenge_base_id text, p_accepted_at timestamptz, p_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  insert into public.daily_entries (user_id, day, challenge_base_id, accepted_at, payload, updated_at)
  values (auth.uid(), p_day, p_challenge_base_id, p_accepted_at, public.field_enc(p_payload::text), now())
  on conflict (user_id, day) do update set challenge_base_id = excluded.challenge_base_id,
    accepted_at = excluded.accepted_at, payload = excluded.payload, updated_at = now();
end $$;

create or replace function get_daily_entries(p_since date)
returns table (day date, challenge_base_id text, accepted_at timestamptz, payload jsonb, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.day, d.challenge_base_id, d.accepted_at, public.field_dec(d.payload)::jsonb, d.updated_at
  from public.daily_entries d where d.user_id = auth.uid() and d.day >= p_since order by d.day
$$;

create or replace function save_collaborator(p_id uuid, p_alias text, p_relation text, p_role text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  insert into public.collaborators (id, user_id, alias, relation, role)
  values (coalesce(p_id, gen_random_uuid()), auth.uid(), public.field_enc(p_alias), public.field_enc(p_relation), p_role)
  on conflict (id) do update set alias = excluded.alias, relation = excluded.relation, role = excluded.role
    where public.collaborators.user_id = auth.uid()
  returning id into v_id;
  return v_id;
end $$;

create or replace function get_collaborators()
returns table (id uuid, alias text, relation text, role text, invited_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, public.field_dec(c.alias), public.field_dec(c.relation), c.role, c.invited_at
  from public.collaborators c where c.user_id = auth.uid() order by c.created_at
$$;

create or replace function delete_collaborator(p_id uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.collaborators where id = p_id and user_id = auth.uid()
$$;

revoke all on function save_boxes, get_boxes, save_daily_entry, get_daily_entries,
  save_collaborator, get_collaborators, delete_collaborator from public, anon;
grant execute on function save_boxes, get_boxes, save_daily_entry, get_daily_entries,
  save_collaborator, get_collaborators, delete_collaborator to authenticated;

-- Perfil automático al registrarse
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
