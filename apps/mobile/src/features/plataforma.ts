/**
 * Plataforma de instituciones (la web virtuous-platform), en el mismo Supabase que la app.
 * Misma cuenta, mismas tablas y mismas reglas de acceso (RLS) que la web:
 * profiles (rol e institución), organizations, student_profiles, teacher_profiles, assignments,
 * resources, estructura académica y organization_invitations.
 * Sin backend o sin sesión devuelve null / [] y la app sigue funcionando en local.
 */
import { supabase } from '@/lib/supabase';

export type Rol = 'SUPER_ADMIN' | 'INSTITUTION_DIRECTOR' | 'TEACHER' | 'MENTOR' | 'STUDENT' | 'PARENT';
export type EstadoTarea = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface PerfilPlataforma {
  id: string;
  email: string | null;
  fullName: string | null;
  role: Rol | null;
  organizationId: string | null;
  isActive: boolean;
  isCommitteeMember: boolean;
  mentorId: string | null;
}

export interface Institucion {
  id: string;
  name: string;
  contactEmail: string | null;
  status: 'REQUESTED' | 'REVIEW' | 'ACTIVE' | 'EXPIRED';
}

export interface FichaAlumno {
  userId: string;
  fullName: string | null;
  email: string | null;
  temperamentPrimary: string | null;
  temperamentSecondary: string | null;
  temperamentScore: Record<string, number> | null;
  challenges: string | null;
  observations: string | null;
  classGroupId: string | null;
}

export interface Recurso {
  id: string;
  title: string;
  type: 'GUIDE' | 'STORY' | 'VIDEO';
  url: string;
  description: string | null;
  level: string | null;
  organizationId: string | null;
}

export interface Tarea {
  id: string;
  studentId: string;
  status: EstadoTarea;
  dueDate: string | null;
  completedAt: string | null;
  feedback: string | null;
  resource: Recurso | null;
}

const esPersonal = (rol: Rol | null) => rol === 'INSTITUTION_DIRECTOR' || rol === 'TEACHER' || rol === 'MENTOR' || rol === 'SUPER_ADMIN';

async function usuario(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

type FilaRecurso = { id: string; title: string; type: Recurso['type']; url: string; description: string | null; level: string | null; organization_id: string | null };
const aRecurso = (r: FilaRecurso): Recurso => ({
  id: r.id, title: r.title, type: r.type, url: r.url, description: r.description, level: r.level, organizationId: r.organization_id,
});

/** Rol e institución de la cuenta abierta. null si no hay sesión. */
export async function miPerfilPlataforma(): Promise<PerfilPlataforma | null> {
  const userId = await usuario();
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, organization_id, is_active, is_committee_member, mentor_id')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id, email: data.email, fullName: data.full_name, role: data.role, organizationId: data.organization_id,
    isActive: data.is_active, isCommitteeMember: data.is_committee_member, mentorId: data.mentor_id,
  };
}

export async function miInstitucion(): Promise<Institucion | null> {
  const perfil = await miPerfilPlataforma();
  if (!supabase || !perfil?.organizationId) return null;
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, contact_email, status')
    .eq('id', perfil.organizationId)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, name: data.name, contactEmail: data.contact_email, status: data.status };
}

const COLUMNAS_FICHA =
  'user_id, temperament_primary, temperament_secondary, temperament_score, challenges, observations, class_group_id, profiles!inner(full_name, email, organization_id)';

type FilaFicha = {
  user_id: string; temperament_primary: string | null; temperament_secondary: string | null;
  temperament_score: Record<string, number> | null; challenges: string | null; observations: string | null;
  class_group_id: string | null; profiles: { full_name: string | null; email: string | null; organization_id: string | null } | null;
};
const aFicha = (f: FilaFicha): FichaAlumno => ({
  userId: f.user_id, fullName: f.profiles?.full_name ?? null, email: f.profiles?.email ?? null,
  temperamentPrimary: f.temperament_primary, temperamentSecondary: f.temperament_secondary,
  temperamentScore: f.temperament_score, challenges: f.challenges, observations: f.observations, classGroupId: f.class_group_id,
});

/** Ficha de alumno de la cuenta abierta (o de otra persona que RLS deje ver: hijo, alumno, mentorizado). */
export async function fichaAlumno(userId?: string): Promise<FichaAlumno | null> {
  const id = userId ?? (await usuario());
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from('student_profiles').select(COLUMNAS_FICHA).eq('user_id', id).maybeSingle();
  if (error || !data) return null;
  return aFicha(data as unknown as FilaFicha);
}

/**
 * Alumnos visibles para la cuenta: los de su institución (personal), sus mentorizados o sus hijos.
 * Las reglas de acceso las aplica el servidor; aquí solo se filtra por institución para el personal.
 */
export async function alumnosVisibles(): Promise<FichaAlumno[]> {
  const perfil = await miPerfilPlataforma();
  if (!supabase || !perfil) return [];
  let consulta = supabase.from('student_profiles').select(COLUMNAS_FICHA).neq('user_id', perfil.id);
  if (esPersonal(perfil.role) && perfil.role !== 'SUPER_ADMIN' && perfil.organizationId) {
    consulta = consulta.eq('profiles.organization_id', perfil.organizationId);
  }
  const { data, error } = await consulta.order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as unknown as FilaFicha[]).map(aFicha);
}

/** Tareas de un alumno (por defecto, las propias). */
export async function tareas(studentId?: string): Promise<Tarea[]> {
  const id = studentId ?? (await usuario());
  if (!supabase || !id) return [];
  const { data, error } = await supabase
    .from('assignments')
    .select('id, student_id, status, due_date, completed_at, feedback, resources(id, title, type, url, description, level, organization_id)')
    .eq('student_id', id)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error || !data) return [];
  return (data as unknown as Array<{
    id: string; student_id: string; status: EstadoTarea; due_date: string | null; completed_at: string | null;
    feedback: string | null; resources: FilaRecurso | null;
  }>).map((t) => ({
    id: t.id, studentId: t.student_id, status: t.status, dueDate: t.due_date, completedAt: t.completed_at,
    feedback: t.feedback, resource: t.resources ? aRecurso(t.resources) : null,
  }));
}

/** El alumno solo puede cambiar el estado (lo impone el servidor). */
export async function marcarTarea(id: string, status: EstadoTarea): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('assignments')
    .update({ status, completed_at: status === 'COMPLETED' ? new Date().toISOString() : null })
    .eq('id', id);
  return !error;
}

/** Recursos globales y los de la institución de la cuenta. */
export async function recursos(): Promise<Recurso[]> {
  if (!supabase || !(await usuario())) return [];
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, type, url, description, level, organization_id')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as FilaRecurso[]).map(aRecurso);
}

/** Une la cuenta a una institución con el enlace de invitación que envía la web. Devuelve el id de la institución. */
export async function aceptarInvitacionInstitucion(token: string): Promise<string | null> {
  if (!supabase || !(await usuario())) return null;
  const { data, error } = await supabase.rpc('accept_organization_invitation', { p_token: token });
  if (error) return null;
  return (data as string | null) ?? null;
}
