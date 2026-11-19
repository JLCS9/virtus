-- Copia de virtuous-leadership-web/supabase-migraciones/20261118_persona_invitaciones.sql (la web manda en el esquema).
-- Ya aplicada en el Supabase de producción (qyuxmqvqmgqcsduzljkd); comprobado el 2026-11-19.

-- «Tu entorno»: invitar a una persona de una ficha a hacer el test y verificar su temperamento.
--
-- Qué hace
--   1. Crea public.persona_invitaciones: una invitación (token) por ficha. La crea el front con la
--      sesión de quien invita; el enlace es /es/tests/temperamento?inv=<token>.
--   2. Añade personas.verificado_en: cuándo la persona hizo el test con ese enlace y aceptó compartir
--      su temperamento. En ese momento el servidor (api/invitaciones.mjs, service role) pone la
--      ficha en estado 'confirmado' con su primario/secundario reales y confianza 'alta'.
--
-- Por qué
--   Es el bucle de crecimiento del onboarding: añades a alguien con el test corto, le compartes el
--   enlace y, al hacer su test, tu ficha pasa a «Temperamento verificado por X».
--
-- Privacidad
--   El token solo lo puede leer quien creó la ficha (RLS) y el servidor. Quien invita solo recibe
--   el temperamento del invitado, y solo si este lo acepta expresamente antes de empezar el test.
--   aceptada_por queda como registro de quién lo compartió.
--
--   3. Si la persona invitada repite el test más adelante, un trigger sobre test_results actualiza
--      las fichas que verificó (las de las invitaciones que aceptó). Así vale también para los
--      tests hechos desde la app móvil. El trigger nunca impide guardar un resultado: si algo
--      falla, lo ignora.
--
-- Es idempotente: se puede ejecutar más de una vez. No borra ni modifica datos existentes.
-- Aplicado en producción (Supabase qyuxmqvqmgqcsduzljkd) el 2026-11-18.

alter table public.personas add column if not exists verificado_en timestamptz;

create table if not exists public.persona_invitaciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null unique references public.personas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,   -- quien invita (dueño de la ficha)
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  creado_en timestamptz not null default now(),
  caduca_en timestamptz not null default now() + interval '180 days',
  aceptada_en timestamptz,
  aceptada_por uuid references auth.users(id) on delete set null       -- la persona invitada
);
create index if not exists persona_invitaciones_user_idx on public.persona_invitaciones (user_id);

alter table public.persona_invitaciones enable row level security;

-- Quien invita: ver, crear y borrar las suyas, siempre de una ficha propia. Sin UPDATE: aceptar la
-- invitación es cosa del servidor (service role), no del navegador.
drop policy if exists own_select on public.persona_invitaciones;
create policy own_select on public.persona_invitaciones for select to authenticated
  using (user_id = auth.uid());

drop policy if exists own_insert on public.persona_invitaciones;
create policy own_insert on public.persona_invitaciones for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.personas p where p.id = persona_id and p.user_id = auth.uid()));

drop policy if exists own_delete on public.persona_invitaciones;
create policy own_delete on public.persona_invitaciones for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.persona_invitaciones from anon, authenticated;
grant select, insert, delete on public.persona_invitaciones to authenticated;

-- ───────── Si la persona invitada repite el test, se actualizan las fichas que verificó ─────────
create or replace function public.sincronizar_fichas_verificadas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  validos constant text[] := array['COL','MEL','SAN','FLE'];
  clave text;
  p text;
  s text;
begin
  if new.kind <> 'temperament' or coalesce(new.source, 'self') <> 'self' then
    return new;
  end if;

  -- Formato actual { primario, secundario }; antiguo { profileKey | type | profile: 'SAN-COL' };
  -- app móvil { dominant, secondary }.
  p := new.result->>'primario';
  s := new.result->>'secundario';
  if p is null or not (p = any (validos)) then
    clave := upper(coalesce(new.result->>'profileKey', new.result->>'type', new.result->>'profile', ''));
    p := split_part(clave, '-', 1);
    s := nullif(split_part(clave, '-', 2), '');
  end if;
  if p is null or not (p = any (validos)) then
    p := new.result->>'dominant';
    s := new.result->>'secondary';
  end if;
  if p is null or not (p = any (validos)) then
    return new;
  end if;
  if s is null or not (s = any (validos)) or s = p then
    s := null;
  end if;

  update public.personas pe
     set primario = p, secundario = s, confianza = 'alta', estado = 'confirmado', actualizado_en = now()
    from public.persona_invitaciones i
   where i.persona_id = pe.id
     and i.aceptada_por = new.user_id
     and i.aceptada_en is not null;
  return new;
exception when others then
  return new;   -- guardar el resultado del test es lo primero
end;
$$;

revoke all on function public.sincronizar_fichas_verificadas() from public, anon, authenticated;

drop trigger if exists test_results_sincroniza_fichas on public.test_results;
create trigger test_results_sincroniza_fichas
  after insert on public.test_results
  for each row execute function public.sincronizar_fichas_verificadas();
