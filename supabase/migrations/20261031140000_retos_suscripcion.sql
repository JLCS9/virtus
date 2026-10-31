-- Virtus · Acceso a Retos por suscripción (beta privada).
--
-- REGLA ÚNICA: solo las cuentas con una fila ACTIVA en public.suscripciones_retos pueden usar los
-- retos (reto diario, conversación, examen de la noche, onboarding). Lo exige el servidor en todas
-- las funciones retos-* y en adapt-challenge, para la web y para la app. Sin fila = sin acceso.
--
-- No se reutiliza public.subscriptions: esa es la suscripción de la APP y la escribe RevenueCat,
-- así que una compra en la app habría activado los retos sin querer. Esta tabla solo se cambia
-- a mano (SQL en Supabase o desde la sesión de trabajo) hasta que se decida lo contrario.
--
-- Por defecto toda cuenta nueva (también la que se crea al terminar el test) queda DESACTIVADA.

create table public.suscripciones_retos (
  user_id        uuid primary key references auth.users on delete cascade,
  activa         boolean not null default false,
  hasta          timestamptz,                  -- null = sin caducidad
  nota           text,                         -- quién la activó y por qué
  actualizado_en timestamptz not null default now()
);

alter table public.suscripciones_retos enable row level security;
-- Cada cuenta solo puede LEER la suya (para que la web y la app sepan si mostrar los retos).
-- Nadie desde el cliente puede escribir: solo el servicio y el SQL del proyecto.
create policy own_read on public.suscripciones_retos for select using (user_id = auth.uid());
revoke all on public.suscripciones_retos from anon, authenticated;
grant select on public.suscripciones_retos to authenticated;

-- ¿Tiene esta cuenta la suscripción activa y sin caducar? Es lo que consultan las Edge Functions.
create or replace function public.retos_activo(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.suscripciones_retos s
    where s.user_id = p_user and s.activa and (s.hasta is null or s.hasta > now())
  )
$$;
-- No se puede preguntar por otras cuentas desde el cliente.
revoke all on function public.retos_activo(uuid) from public, anon, authenticated;

-- Toda cuenta nueva nace con la suscripción desactivada (se ve y se cambia en la tabla).
create or replace function public.crear_suscripcion_retos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.suscripciones_retos (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
revoke all on function public.crear_suscripcion_retos() from public, anon, authenticated;
create trigger crear_suscripcion_retos after insert on auth.users
  for each row execute function public.crear_suscripcion_retos();

-- Cuentas que ya existen: todas desactivadas…
insert into public.suscripciones_retos (user_id) select id from auth.users on conflict do nothing;

-- …salvo las que ya tenían acceso a los retos (feature_access 'retos_web'): su acceso pasa a ser
-- suscripción activa, para que no se rompa lo que ya se está probando. Nadie más se activa.
update public.suscripciones_retos s
   set activa = true, hasta = null, nota = 'migrado de feature_access retos_web', actualizado_en = now()
 where s.user_id in (select user_id from public.feature_access where feature = 'retos_web');
delete from public.feature_access where feature = 'retos_web';
-- feature_access queda solo para 'retos_anthropic_directo' (qué proveedor usa el modelo), no da acceso.
