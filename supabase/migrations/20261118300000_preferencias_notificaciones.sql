-- Copia de virtuous-leadership-web/supabase-migraciones/20261118_preferencias_notificaciones.sql (la web manda en el esquema).
-- Ya aplicada en el Supabase de producción (qyuxmqvqmgqcsduzljkd); comprobado el 2026-11-19.

-- Preferencias de trabajo diario y avisos: la configuración PRIMARIA de notificaciones.
--
-- Qué hace
--   Crea public.preferencias_notificaciones, una fila por usuario, con:
--     · hora_reto        cuándo quiere su reto diario
--     · hora_reflexion   cuándo quiere hacer la reflexión del día
--     · dia_formacion    día de la formación semanal (ISO: 1 lunes … 7 domingo)
--     · hora_formacion   y a qué hora
--     · zona_horaria     IANA (p. ej. 'Europe/Madrid'): las horas son SIEMPRE hora local del usuario
--     · avisos_email / avisos_push   interruptores por canal
--
-- Por qué
--   Es una fuente única y compartida: la web la usará para enviar el reto por correo y la app móvil
--   para programar las notificaciones push. Quien envía debe leer de aquí, no guardar copias.
--   Sustituye a perfil_camino.hora_manana / hora_examen (que quedan como dato antiguo del Camino;
--   esta migración no los toca ni los copia).
--
-- Para quien envíe (correo o push): «¿a quién le toca ahora?» se calcula con la zona de cada fila,
--   p. ej.  (now() at time zone zona_horaria)::time  entre hora_reto y hora_reto + el intervalo del cron.
--
-- Es idempotente: se puede ejecutar más de una vez. No borra ni modifica datos existentes.
-- Aplicado en producción (Supabase qyuxmqvqmgqcsduzljkd) el 2026-11-18.

create table if not exists public.preferencias_notificaciones (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hora_reto time not null default '08:00',
  hora_reflexion time not null default '21:30',
  dia_formacion smallint not null default 7 check (dia_formacion between 1 and 7),
  hora_formacion time not null default '10:00',
  zona_horaria text not null default 'Europe/Madrid' check (char_length(zona_horaria) between 1 and 64),
  avisos_email boolean not null default true,
  avisos_push boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- La zona tiene que ser una que Postgres conozca: si no, el cálculo de «a quién le toca» fallaría.
create or replace function public.preferencias_notificaciones_validar()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.zona_horaria) then
    raise exception 'zona_horaria desconocida: %', new.zona_horaria using errcode = '22023';
  end if;
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists preferencias_notificaciones_validar on public.preferencias_notificaciones;
create trigger preferencias_notificaciones_validar
  before insert or update on public.preferencias_notificaciones
  for each row execute function public.preferencias_notificaciones_validar();

alter table public.preferencias_notificaciones enable row level security;

drop policy if exists own_all on public.preferencias_notificaciones;
create policy own_all on public.preferencias_notificaciones for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.preferencias_notificaciones from anon, authenticated;
grant select, insert, update on public.preferencias_notificaciones to authenticated;
