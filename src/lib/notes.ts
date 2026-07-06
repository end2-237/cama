import { supabase } from "@/lib/supabase";

/* ════ Notes personnelles, préférences & demandes de créneau ════
 * Remplace la persistance localStorage (chantier D1) — voir
 * supabase/migrations/016_local_to_server.sql.
 * Toutes les fonctions échouent en silence (retour null/vide) pour ne
 * jamais casser l'UI si la table n'est pas encore migrée.
 *
 * NB : `program_course_id` accepte l'id d'un cours OU d'un chapitre
 * (pas de FK) — le lecteur de cours stocke une note par chapitre.
 */

export interface DBCourseNote {
  id: string;
  student_id: string;
  program_course_id: string;
  body: string | null;
  updated_at: string;
}

export interface DBStudentSettings {
  student_id: string;
  cycle_mode: string | null;
  prefs: Record<string, unknown>;
  updated_at: string;
}

export interface DBSlotRequest {
  id: string;
  student_id: string;
  program_course_id: string | null;
  desired: string | null;
  status: string; // en_attente | valide | rejete
  created_at: string;
}

/* ── Notes personnelles ── */
export async function fetchNote(studentId: string, courseId: string): Promise<DBCourseNote | null> {
  const { data, error } = await supabase
    .from("course_notes").select("*")
    .eq("student_id", studentId)
    .eq("program_course_id", courseId)
    .maybeSingle();
  if (error) return null;
  return (data as DBCourseNote) ?? null;
}

export async function saveNote(studentId: string, courseId: string, body: string): Promise<DBCourseNote | null> {
  const { data, error } = await supabase
    .from("course_notes")
    .upsert(
      { student_id: studentId, program_course_id: courseId, body, updated_at: new Date().toISOString() },
      { onConflict: "student_id,program_course_id" }
    )
    .select("*").single();
  if (error) return null;
  return data as DBCourseNote;
}

/* ── Préférences étudiant ── */
export async function fetchSettings(studentId: string): Promise<DBStudentSettings | null> {
  const { data, error } = await supabase
    .from("student_settings").select("*")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) return null;
  return (data as DBStudentSettings) ?? null;
}

export async function saveSettings(studentId: string, s: {
  cycle_mode?: string | null; prefs?: Record<string, unknown>;
}): Promise<DBStudentSettings | null> {
  const { data, error } = await supabase
    .from("student_settings")
    .upsert({ student_id: studentId, ...s, updated_at: new Date().toISOString() }, { onConflict: "student_id" })
    .select("*").single();
  if (error) return null;
  return data as DBStudentSettings;
}

/* ── Demandes de créneau ── */
export async function createSlotRequest(r: {
  student_id: string; program_course_id?: string | null; desired: string;
}): Promise<DBSlotRequest | null> {
  const { data, error } = await supabase
    .from("slot_requests").insert(r).select("*").single();
  if (error) return null;
  return data as DBSlotRequest;
}

export async function fetchSlotRequests(courseId?: string): Promise<DBSlotRequest[]> {
  let q = supabase.from("slot_requests").select("*").order("created_at", { ascending: false });
  if (courseId) q = q.eq("program_course_id", courseId);
  const { data, error } = await q;
  if (error) return [];
  return (data as DBSlotRequest[]) ?? [];
}
