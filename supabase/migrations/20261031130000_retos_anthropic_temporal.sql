-- TEMPORAL: mientras AWS activa Bedrock en la cuenta, la cuenta de Jose usa Claude por la API de
-- Anthropic (excepción explícita al principio 4, solo con datos de prueba). El resto de cuentas
-- sigue en Bedrock. Para retirarlo:
--   delete from public.feature_access where feature = 'retos_anthropic_directo';
insert into public.feature_access (user_id, feature)
select id, 'retos_anthropic_directo' from auth.users where email = 'jose@csodigital.tech'
on conflict do nothing;
