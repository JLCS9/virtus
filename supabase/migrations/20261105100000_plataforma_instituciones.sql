-- Plataforma de instituciones (web virtuous-platform) en el mismo Supabase que la app.
--
-- La web deja su Postgres propio y usa este proyecto: Prisma se conecta con DATABASE_URL a esta
-- base (rol postgres, sin RLS) y el inicio de sesión pasa a Supabase Auth. La app lee lo mismo con
-- la clave anon + RLS. Una cuenta = un auth.users = un profiles, en la web y en la app.
--
-- Equivalencias con el esquema Prisma anterior de la web:
--   Institution      → organizations (ya existía como esqueleto)
--   User             → auth.users + profiles (email, full_name, role, organization_id, …)
--   StudentParent    → student_parents
--   StudentProfile   → student_profiles (clave = user_id)
--   TeacherProfile   → teacher_profiles (clave = user_id)
--   AcademicYear     → academic_years
--   Course           → courses
--   ClassGroup       → class_groups
--   TeacherOnGroup   → class_group_teachers
--   TemperamentTest  → test_results (kind 'temperament'): el mismo historial para web y app
--   Resource         → resources
--   Assignment       → assignments
--   Document         → organization_documents
--   Invitation       → organization_invitations (invitations ya es la de la app)
--
-- Los roles se guardan con los mismos valores que usaba la web (SUPER_ADMIN, INSTITUTION_DIRECTOR, …).

-- ── Perfil: datos de la plataforma ───────────────────────────────────────────
alter table profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists role text check (role in
    ('SUPER_ADMIN','INSTITUTION_DIRECTOR','TEACHER','MENTOR','STUDENT','PARENT')),
  add column if not exists organization_id uuid references organizations on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists is_committee_member boolean not null default false,
  add column if not exists mentor_id uuid references profiles on delete set null,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists profiles_organization_idx on profiles (organization_id);
create index if not exists profiles_mentor_idx on profiles (mentor_id);
create unique index if not exists profiles_email_key on profiles (lower(email));

-- El email vive en auth.users; se copia al perfil para que la web lo liste sin tocar el esquema auth.
update profiles p set email = u.email from auth.users u where u.id = p.id and p.email is distinct from u.email;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, locale, first_name, birth_year, sex, consent_at, signup_source, email, full_name)
  values (
    new.id,
    case when m->>'locale' in ('es','fr','en','ru') then m->>'locale' else 'es' end,
    nullif(m->>'first_name', ''),
    case when m->>'birth_year' ~ '^\d{4}$' then (m->>'birth_year')::int end,
    case when m->>'sex' in ('mujer','hombre') then m->>'sex' end,
    case when m ? 'consent_at' then (m->>'consent_at')::timestamptz end,
    nullif(m->>'signup_source', ''),
    new.email,
    coalesce(nullif(m->>'full_name', ''), nullif(m->>'first_name', ''))
  )
  on conflict do nothing;
  return new;
end $$;

create or replace function handle_user_email_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end $$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email) execute function handle_user_email_change();

-- ── Instituciones ────────────────────────────────────────────────────────────
alter table organizations
  add column if not exists contact_email text,
  add column if not exists status text not null default 'REQUESTED'
    check (status in ('REQUESTED','REVIEW','ACTIVE','EXPIRED')),
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists student_parents (
  student_id uuid not null references profiles on delete cascade,
  parent_id uuid not null references profiles on delete cascade,
  primary key (student_id, parent_id)
);
create index if not exists student_parents_parent_idx on student_parents (parent_id);

create table if not exists academic_years (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists academic_years_org_idx on academic_years (organization_id);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_years on delete cascade,
  name text not null,
  level int not null check (level between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists courses_year_idx on courses (academic_year_id);

create table if not exists class_groups (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  owner_id uuid not null references profiles,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists class_groups_course_idx on class_groups (course_id);

create table if not exists class_group_teachers (
  teacher_id uuid not null references profiles on delete cascade,
  group_id uuid not null references class_groups on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (teacher_id, group_id)
);

create table if not exists student_profiles (
  user_id uuid primary key references profiles on delete cascade,
  temperament_primary text,
  temperament_secondary text,
  temperament_score jsonb,
  challenges text,
  observations text,
  class_group_id uuid references class_groups on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists student_profiles_group_idx on student_profiles (class_group_id);

create table if not exists teacher_profiles (
  user_id uuid primary key references profiles on delete cascade,
  temperament_primary text,
  accreditation_level text not null default 'NONE' check (accreditation_level in ('NONE','BRONZE','SILVER','GOLD')),
  is_internal_trainer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade, -- null = recurso global
  title text not null,
  type text not null check (type in ('GUIDE','STORY','VIDEO')),
  url text not null,
  description text,
  level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resources_org_idx on resources (organization_id);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references student_profiles (user_id) on delete cascade,
  resource_id uuid references resources on delete set null,
  created_by uuid not null references profiles,
  status text not null default 'PENDING' check (status in ('PENDING','IN_PROGRESS','COMPLETED')),
  due_date timestamptz,
  completed_at timestamptz,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assignments_student_idx on assignments (student_id, status);

create table if not exists organization_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  name text not null,
  url text not null,
  type text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations on delete cascade,
  email text not null,
  role text not null check (role in ('INSTITUTION_DIRECTOR','TEACHER','MENTOR','STUDENT','PARENT')),
  token text not null unique default encode(extensions.gen_random_bytes(24), 'base64url'),
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','EXPIRED','REVOKED')),
  expires_at timestamptz not null default now() + interval '48 hours',
  accepted_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, organization_id)
);

-- Historial de temperamento compartido: la web guarda también las respuestas y quién hizo el test.
alter table test_results
  add column if not exists answers jsonb,
  add column if not exists performed_by uuid references auth.users on delete set null;

-- ── Funciones de acceso (SECURITY DEFINER: leen profiles sin pasar por RLS) ──
create or replace function app_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function app_org() returns uuid
language sql stable security definer set search_path = '' as $$
  select organization_id from public.profiles where id = auth.uid() and is_active
$$;

create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.app_role() = 'SUPER_ADMIN', false)
$$;

create or replace function is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or (p_org is not null and public.app_org() = p_org)
$$;

-- Personal con acceso a los datos de los alumnos de la institución.
create or replace function is_org_staff(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or (p_org is not null and public.app_org() = p_org
    and public.app_role() in ('INSTITUTION_DIRECTOR','TEACHER','MENTOR'))
$$;

create or replace function is_org_director(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or (p_org is not null and public.app_org() = p_org
    and public.app_role() = 'INSTITUTION_DIRECTOR')
$$;

create or replace function org_of_user(p_user uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select organization_id from public.profiles where id = p_user
$$;

-- ¿Puede quien llama ver los datos de p_user? Uno mismo, el personal de su institución,
-- su mentor, sus padres o un SUPER_ADMIN.
create or replace function can_see_user(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = auth.uid()
    or public.is_org_staff(public.org_of_user(p_user))
    or exists (select 1 from public.profiles p where p.id = p_user and p.mentor_id = auth.uid())
    or exists (select 1 from public.student_parents sp where sp.student_id = p_user and sp.parent_id = auth.uid())
$$;

revoke all on function app_role, app_org, is_super_admin, is_org_member, is_org_staff, is_org_director,
  org_of_user, can_see_user from public, anon;
grant execute on function app_role, app_org, is_super_admin, is_org_member, is_org_staff, is_org_director,
  org_of_user, can_see_user to authenticated;

-- Nadie se sube el rol a sí mismo: los campos de la plataforma solo los cambia un director de la
-- institución (sin poder nombrar SUPER_ADMIN ni sacar a nadie de su institución), un SUPER_ADMIN
-- o el servidor (service role / Prisma, donde auth.uid() es null).
create or replace function guard_profile_platform_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_super_admin()
     or current_setting('virtus.profile_guard_bypass', true) = 'on' then return new; end if;
  if new.email is distinct from old.email then raise exception 'el email se cambia en la cuenta'; end if;
  if (new.role, new.organization_id, new.is_active, new.is_committee_member, new.mentor_id)
     is not distinct from (old.role, old.organization_id, old.is_active, old.is_committee_member, old.mentor_id) then
    return new;
  end if;
  if old.id <> auth.uid()
     and public.is_org_director(old.organization_id)
     and new.organization_id is not distinct from old.organization_id
     and coalesce(new.role, '') <> 'SUPER_ADMIN' then
    return new;
  end if;
  raise exception 'sin permiso para cambiar rol, institución o estado';
end $$;
drop trigger if exists guard_profile_platform_fields on profiles;
create trigger guard_profile_platform_fields before update on profiles
  for each row execute function guard_profile_platform_fields();

-- Un alumno solo puede marcar el estado de sus tareas, no reescribirlas.
create or replace function guard_assignment_student_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or auth.uid() <> old.student_id or public.is_org_staff(public.org_of_user(old.student_id)) then
    return new;
  end if;
  if (new.student_id, new.resource_id, new.created_by, new.due_date, new.feedback)
     is distinct from (old.student_id, old.resource_id, old.created_by, old.due_date, old.feedback) then
    raise exception 'solo puedes cambiar el estado de la tarea';
  end if;
  return new;
end $$;
drop trigger if exists guard_assignment_student_update on assignments;
create trigger guard_assignment_student_update before update on assignments
  for each row execute function guard_assignment_student_update();

-- Cada test de temperamento actualiza el resumen de la ficha de alumno (si la tiene),
-- venga de la web ({primary, secondary, breakdown|details}) o de la app ({dominant, secondary, percent}).
create or replace function sync_student_temperament() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.kind <> 'temperament' then return new; end if;
  update public.student_profiles set
    temperament_primary = coalesce(new.result->>'primary', new.result->>'dominant', temperament_primary),
    temperament_secondary = coalesce(new.result->>'secondary', temperament_secondary),
    temperament_score = coalesce(new.result->'breakdown', new.result->'details', new.result->'percent', temperament_score),
    updated_at = now()
  where user_id = new.user_id;
  return new;
end $$;
drop trigger if exists sync_student_temperament on test_results;
create trigger sync_student_temperament after insert on test_results
  for each row execute function sync_student_temperament();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table student_parents enable row level security;
alter table academic_years enable row level security;
alter table courses enable row level security;
alter table class_groups enable row level security;
alter table class_group_teachers enable row level security;
alter table student_profiles enable row level security;
alter table teacher_profiles enable row level security;
alter table resources enable row level security;
alter table assignments enable row level security;
alter table organization_documents enable row level security;
alter table organization_invitations enable row level security;

-- Perfiles: además de la política own existente.
drop policy if exists platform_read on profiles;
create policy platform_read on profiles for select to authenticated using (public.can_see_user(id));
drop policy if exists director_update on profiles;
create policy director_update on profiles for update to authenticated
  using (public.is_org_director(organization_id)) with check (public.is_org_director(organization_id));

-- Tests: el personal, el mentor y los padres ven el historial; el personal puede registrar un test
-- hecho a un alumno de su institución (performed_by = quien lo registra).
drop policy if exists platform_read on test_results;
create policy platform_read on test_results for select to authenticated using (public.can_see_user(user_id));
drop policy if exists staff_insert on test_results;
create policy staff_insert on test_results for insert to authenticated
  with check (performed_by = auth.uid() and public.is_org_staff(public.org_of_user(user_id)));

drop policy if exists member_read on organizations;
create policy member_read on organizations for select to authenticated using (public.is_org_member(id));
drop policy if exists director_update on organizations;
create policy director_update on organizations for update to authenticated
  using (public.is_org_director(id)) with check (public.is_org_director(id));
drop policy if exists admin_all on organizations;
create policy admin_all on organizations for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists read on student_parents;
create policy read on student_parents for select to authenticated
  using (parent_id = auth.uid() or public.can_see_user(student_id));
drop policy if exists director_write on student_parents;
create policy director_write on student_parents for all to authenticated
  using (public.is_org_director(public.org_of_user(student_id)))
  with check (public.is_org_director(public.org_of_user(student_id)));

drop policy if exists member_read on academic_years;
create policy member_read on academic_years for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists director_write on academic_years;
create policy director_write on academic_years for all to authenticated
  using (public.is_org_director(organization_id)) with check (public.is_org_director(organization_id));

drop policy if exists member_read on courses;
create policy member_read on courses for select to authenticated using (exists (
  select 1 from academic_years y where y.id = academic_year_id and public.is_org_member(y.organization_id)));
drop policy if exists director_write on courses;
create policy director_write on courses for all to authenticated
  using (exists (select 1 from academic_years y where y.id = academic_year_id and public.is_org_director(y.organization_id)))
  with check (exists (select 1 from academic_years y where y.id = academic_year_id and public.is_org_director(y.organization_id)));

drop policy if exists member_read on class_groups;
create policy member_read on class_groups for select to authenticated using (exists (
  select 1 from courses c join academic_years y on y.id = c.academic_year_id
  where c.id = course_id and public.is_org_member(y.organization_id)));
drop policy if exists director_write on class_groups;
create policy director_write on class_groups for all to authenticated
  using (exists (select 1 from courses c join academic_years y on y.id = c.academic_year_id
    where c.id = course_id and public.is_org_director(y.organization_id)))
  with check (exists (select 1 from courses c join academic_years y on y.id = c.academic_year_id
    where c.id = course_id and public.is_org_director(y.organization_id)));

drop policy if exists member_read on class_group_teachers;
create policy member_read on class_group_teachers for select to authenticated using (exists (
  select 1 from class_groups g join courses c on c.id = g.course_id join academic_years y on y.id = c.academic_year_id
  where g.id = group_id and public.is_org_member(y.organization_id)));
drop policy if exists director_write on class_group_teachers;
create policy director_write on class_group_teachers for all to authenticated
  using (public.is_org_director(public.org_of_user(teacher_id)))
  with check (public.is_org_director(public.org_of_user(teacher_id)));

drop policy if exists read on student_profiles;
create policy read on student_profiles for select to authenticated using (public.can_see_user(user_id));
drop policy if exists staff_write on student_profiles;
create policy staff_write on student_profiles for all to authenticated
  using (public.is_org_staff(public.org_of_user(user_id)))
  with check (public.is_org_staff(public.org_of_user(user_id)));

drop policy if exists read on teacher_profiles;
create policy read on teacher_profiles for select to authenticated
  using (public.can_see_user(user_id) or public.is_org_member(public.org_of_user(user_id)));
drop policy if exists director_write on teacher_profiles;
create policy director_write on teacher_profiles for all to authenticated
  using (public.is_org_director(public.org_of_user(user_id)))
  with check (public.is_org_director(public.org_of_user(user_id)));

drop policy if exists read on resources;
create policy read on resources for select to authenticated
  using (organization_id is null or public.is_org_member(organization_id));
drop policy if exists staff_write on resources;
create policy staff_write on resources for all to authenticated
  using (case when organization_id is null then public.is_super_admin()
    else public.is_org_director(organization_id) or (public.app_org() = organization_id and public.app_role() = 'TEACHER') end)
  with check (case when organization_id is null then public.is_super_admin()
    else public.is_org_director(organization_id) or (public.app_org() = organization_id and public.app_role() = 'TEACHER') end);

drop policy if exists read on assignments;
create policy read on assignments for select to authenticated using (public.can_see_user(student_id));
drop policy if exists staff_write on assignments;
create policy staff_write on assignments for all to authenticated
  using (public.is_org_staff(public.org_of_user(student_id)))
  with check (public.is_org_staff(public.org_of_user(student_id)) and created_by = auth.uid());
drop policy if exists student_update on assignments;
create policy student_update on assignments for update to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists director_all on organization_documents;
create policy director_all on organization_documents for all to authenticated
  using (public.is_org_director(organization_id)) with check (public.is_org_director(organization_id));

drop policy if exists director_all on organization_invitations;
create policy director_all on organization_invitations for all to authenticated
  using (public.is_org_director(organization_id)) with check (public.is_org_director(organization_id));

-- ── Aceptar una invitación de institución (web o app) ────────────────────────
-- La cuenta ya existe en Auth (registro normal); esto la une a la institución con el rol invitado.
create or replace function accept_organization_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.organization_invitations;
  v_email text;
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  select email into v_email from auth.users where id = auth.uid();
  select * into v_inv from public.organization_invitations where token = p_token for update;
  if not found or v_inv.status <> 'PENDING' then raise exception 'invitación no válida'; end if;
  if v_inv.expires_at < now() then
    update public.organization_invitations set status = 'EXPIRED', updated_at = now() where id = v_inv.id;
    raise exception 'invitación caducada';
  end if;
  if lower(v_inv.email) <> lower(v_email) then raise exception 'la invitación es para otro email'; end if;

  -- Solo dentro de esta transacción: deja pasar el cambio de rol por guard_profile_platform_fields.
  perform set_config('virtus.profile_guard_bypass', 'on', true);
  update public.profiles set role = v_inv.role, organization_id = v_inv.organization_id, is_active = true, updated_at = now()
  where id = auth.uid();
  perform set_config('virtus.profile_guard_bypass', 'off', true);
  if v_inv.role = 'STUDENT' then
    insert into public.student_profiles (user_id) values (auth.uid()) on conflict do nothing;
  elsif v_inv.role in ('TEACHER','MENTOR','INSTITUTION_DIRECTOR') then
    insert into public.teacher_profiles (user_id) values (auth.uid()) on conflict do nothing;
  end if;
  update public.organization_invitations set status = 'ACCEPTED', accepted_by = auth.uid(), updated_at = now()
  where id = v_inv.id;
  return v_inv.organization_id;
end $$;
revoke all on function accept_organization_invitation(text) from public, anon;
grant execute on function accept_organization_invitation(text) to authenticated;

notify pgrst, 'reload schema';
