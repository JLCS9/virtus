-- Registro de consentimientos y autorización de tutores para menores de 14 años.
--
-- consents: histórico append-only de lo que cada persona ha aceptado o rechazado
-- (finalidad + versión del texto + fecha). Solo escribe el servidor (service role);
-- cada usuario puede leer los suyos.
--   purpose 'cuenta'     → crear la cuenta y tratar sus datos y resultados (obligatorio)
--   purpose 'newsletter' → boletín mensual y comunicaciones comerciales (opcional)
--   purpose 'tutor'      → autorización del padre, madre o tutor de un menor de 14
--
-- guardian_requests: solicitud pendiente de autorización de un tutor. Solo servidor.
-- Mientras está pendiente la cuenta del menor está bloqueada (ban en Auth) y
-- profiles.guardian_status = 'pendiente'.

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  purpose text not null check (purpose in ('cuenta','newsletter','tutor')),
  granted boolean not null,
  text_version text not null,
  locale text,
  source text not null,
  guardian_email text,
  created_at timestamptz not null default now()
);
create index if not exists consents_user_purpose_idx on consents (user_id, purpose, created_at desc);
alter table consents enable row level security;
drop policy if exists own_read on consents;
create policy own_read on consents for select using (user_id = auth.uid());

create table if not exists guardian_requests (
  user_id uuid primary key references auth.users on delete cascade,
  guardian_email text not null,
  token_hash text not null unique,
  locale text,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  confirmed_at timestamptz
);
alter table guardian_requests enable row level security;

alter table profiles
  add column if not exists guardian_status text check (guardian_status in ('pendiente','confirmado'));

-- Estado actual de cada consentimiento (el último registro por finalidad).
create or replace view consents_current with (security_invoker = true) as
  select distinct on (user_id, purpose) user_id, purpose, granted, text_version, created_at
  from consents
  order by user_id, purpose, created_at desc;

-- Cuentas creadas antes de este registro: aceptaron una única casilla que agrupaba
-- cuenta, envío de resultados y boletín. Se registra tal cual, con su versión.
insert into consents (user_id, purpose, granted, text_version, locale, source, created_at)
select p.id, x.purpose, true, 'v0-agrupado', p.locale, 'registro-previo', p.consent_at
from profiles p
cross join (values ('cuenta'), ('newsletter')) as x(purpose)
where p.consent_at is not null
  and not exists (select 1 from consents c where c.user_id = p.id);

notify pgrst, 'reload schema';
