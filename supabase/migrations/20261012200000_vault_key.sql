-- Crea la clave de cifrado de campo en Supabase Vault si no existe.
-- Se genera aleatoriamente dentro de la base de datos: nunca pasa por el repositorio ni por el chat.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'virtus_field_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'virtus_field_key',
      'Clave de cifrado de campo de Virtus (diario, misión, roles, colaboradores)'
    );
  end if;
end $$;
