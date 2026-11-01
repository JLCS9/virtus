-- Cuentas creadas desde virtuousleadership.com al terminar el test de temperamento.
-- La web crea el usuario (Admin API) con estos datos en user_metadata; el trigger los copia al perfil.
alter table profiles
  add column first_name text,
  add column birth_year int check (birth_year between 1900 and 2100),
  add column sex text check (sex in ('mujer','hombre')),
  add column consent_at timestamptz,
  add column signup_source text;

alter table profiles drop constraint profiles_locale_check;
alter table profiles add constraint profiles_locale_check check (locale in ('es','fr','en','ru'));

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, locale, first_name, birth_year, sex, consent_at, signup_source)
  values (
    new.id,
    case when m->>'locale' in ('es','fr','en','ru') then m->>'locale' else 'es' end,
    nullif(m->>'first_name', ''),
    case when m->>'birth_year' ~ '^\d{4}$' then (m->>'birth_year')::int end,
    case when m->>'sex' in ('mujer','hombre') then m->>'sex' end,
    case when m ? 'consent_at' then (m->>'consent_at')::timestamptz end,
    nullif(m->>'signup_source', '')
  )
  on conflict do nothing;
  return new;
end $$;
