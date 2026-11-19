import { supabase } from './supabase';

export async function leerPerfil(userId) {
  const [profile, tests, personas, camino, consents] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('test_results').select('kind, result, taken_at').eq('user_id', userId).order('taken_at', { ascending: false }),
    supabase.from('personas').select('nombre, grupo, relacion, primario, secundario, estado, estrella, me_cuesta').eq('user_id', userId).order('creado_en'),
    supabase.from('perfil_camino').select('momentos, estado_vida, objetivo, vida_interior, ritmo, hora_manana, hora_examen, inicio').eq('user_id', userId).maybeSingle(),
    supabase.from('consents').select('purpose, granted, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);

  return {
    profile: profile.data,
    tests: tests.data ?? [],
    personas: personas.data ?? [],
    camino: camino.data,
    consents: consents.data ?? [],
  };
}

export async function cambiarPassword(oldPassword, newPassword) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('No session');
  const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPassword });
  if (authErr) throw new Error('wrong_password');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function actualizarPerfil(userId, campos) {
  const { error } = await supabase.from('profiles').update(campos).eq('id', userId);
  if (error) throw error;
}

export async function borrarCuenta() {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}
