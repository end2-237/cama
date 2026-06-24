import { supabase } from "@/lib/supabase";
import type { DBExtraCourse, DBExtraEnrollment, CycleMode } from "@/lib/supabase";

export const EXTRA_CATEGORIES = ["Soft skills", "Langues", "Entrepreneuriat", "Tech", "Arts & Culture", "Autre"] as const;

// ── CRUD cours hors-cursus (admin) ──
export async function fetchExtraCourses(onlyPublished = false): Promise<DBExtraCourse[]> {
  let q = supabase.from("extra_courses").select("*").order("created_at", { ascending: false });
  if (onlyPublished) q = q.eq("published", true);
  const { data } = await q;
  return (data as DBExtraCourse[]) ?? [];
}

export async function createExtraCourse(c: Partial<DBExtraCourse>) {
  const { data } = await supabase.from("extra_courses").insert(c).select("*").single();
  return (data as DBExtraCourse) ?? null;
}

export async function updateExtraCourse(id: string, patch: Partial<DBExtraCourse>) {
  return supabase.from("extra_courses").update(patch).eq("id", id);
}

export async function deleteExtraCourse(id: string) {
  return supabase.from("extra_courses").delete().eq("id", id);
}

// ── Inscriptions / participants ──
export interface ExtraEnrollmentWithUser extends DBExtraEnrollment {
  student?: { first_name: string; last_name: string; email: string; level: string | null };
}

export async function fetchEnrollments(extraCourseId: string): Promise<ExtraEnrollmentWithUser[]> {
  const { data } = await supabase.from("extra_enrollments")
    .select("*, student:users(first_name,last_name,email,level)")
    .eq("extra_course_id", extraCourseId).order("enrolled_at");
  return (data as ExtraEnrollmentWithUser[]) ?? [];
}

export async function fetchAllEnrollments(): Promise<DBExtraEnrollment[]> {
  const { data } = await supabase.from("extra_enrollments").select("*");
  return (data as DBExtraEnrollment[]) ?? [];
}

export async function fetchMyEnrollments(studentId: string): Promise<DBExtraEnrollment[]> {
  const { data } = await supabase.from("extra_enrollments").select("*").eq("student_id", studentId);
  return (data as DBExtraEnrollment[]) ?? [];
}

export async function enrollExtra(extraCourseId: string, studentId: string) {
  return supabase.from("extra_enrollments")
    .upsert({ extra_course_id: extraCourseId, student_id: studentId }, { onConflict: "extra_course_id,student_id" });
}

export async function unenrollExtra(extraCourseId: string, studentId: string) {
  return supabase.from("extra_enrollments").delete()
    .eq("extra_course_id", extraCourseId).eq("student_id", studentId);
}

export async function updateEnrollment(id: string, patch: Partial<DBExtraEnrollment>) {
  return supabase.from("extra_enrollments").update(patch).eq("id", id);
}

/** Statistiques d'un cours hors-cursus : inscrits, progression & satisfaction moyennes. */
export function enrollmentStats(enrollments: DBExtraEnrollment[]) {
  const n = enrollments.length;
  const avgProgress = n ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / n) : 0;
  const rated = enrollments.filter((e) => e.satisfaction != null);
  const avgSatisfaction = rated.length
    ? Math.round((rated.reduce((a, e) => a + (e.satisfaction ?? 0), 0) / rated.length) * 10) / 10
    : 0;
  const completed = enrollments.filter((e) => e.status === "termine").length;
  return { n, avgProgress, avgSatisfaction, completed, rated: rated.length };
}

export const MODE_LABEL: Record<CycleMode, string> = {
  online: "En ligne", hybride: "Hybride", presentiel: "Présentiel",
};
