/**
 * Conexión directa a Postgres para los esquemas identidad.* y metodo.* (no expuestos por la
 * API REST). SUPABASE_DB_URL la inyecta Supabase en las Edge Functions.
 */
import postgres from 'npm:postgres@3.4.5';

export type Sql = ReturnType<typeof postgres>;

let sql: Sql | null = null;
export function db(): Sql {
  const url = Deno.env.get('SUPABASE_DB_URL');
  if (!url) throw new Error('SUPABASE_DB_URL no está configurado');
  sql ??= postgres(url, { prepare: false, max: 3, idle_timeout: 20 });
  return sql;
}

/** pseudo_id del usuario; lo crea la primera vez. El núcleo de método solo conoce este id. */
export async function pseudoId(userId: string): Promise<string> {
  const [fila] = await db()`
    insert into identidad.user_pseudonym (user_id) values (${userId})
    on conflict (user_id) do update set user_id = excluded.user_id
    returning pseudo_id`;
  return fila.pseudo_id as string;
}
