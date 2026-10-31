-- Respuestas de personas invitadas y suscripciones.
alter table invitations
  add column completed_at timestamptz,
  add column consent_at timestamptz,
  -- Solo para 'temperament': resultado compartido con quien invita, con consentimiento expreso.
  add column result jsonb;

-- Quien invita puede leer el resultado de sus invitaciones completadas (política own_read ya existente).

-- Eventos de RevenueCat procesados (idempotencia del webhook).
create table revenuecat_events (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  type text not null,
  received_at timestamptz not null default now()
);
alter table revenuecat_events enable row level security;
