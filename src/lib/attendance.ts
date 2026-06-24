import { supabase } from "@/lib/supabase";
import type { DBAttendance, CycleMode } from "@/lib/supabase";

export interface AttendanceWithUser extends DBAttendance {
  student?: { first_name: string; last_name: string; email: string; level: string | null };
}

export interface CourseStudent {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  level: string;
  mode: CycleMode;
}

/** Étudiants inscrits dans la filière + année d'une matière (par cycle / type de cycle). */
export async function fetchCourseStudents(parcoursSlug: string, level?: string): Promise<CourseStudent[]> {
  let q = supabase.from("inscriptions")
    .select("user_id, level, mode, user:users(first_name,last_name,email)")
    .eq("parcours_slug", parcoursSlug).eq("status", "validee");
  if (level) q = q.eq("level", level);
  const { data } = await q;
  type Row = { user_id: string; level: string; mode: CycleMode; user?: { first_name: string; last_name: string; email: string } };
  return ((data as Row[] | null) ?? []).map((r) => ({
    user_id: r.user_id,
    first_name: r.user?.first_name ?? "",
    last_name: r.user?.last_name ?? "",
    email: r.user?.email ?? "",
    level: r.level,
    mode: r.mode,
  }));
}

/** Présences d'une matière (toutes dates) avec infos étudiant. */
export async function fetchAttendance(courseId: string, date?: string): Promise<AttendanceWithUser[]> {
  let q = supabase.from("attendance")
    .select("*, student:users(first_name,last_name,email,level)")
    .eq("program_course_id", courseId);
  if (date) q = q.eq("session_date", date);
  const { data } = await q.order("session_date", { ascending: false });
  return (data as AttendanceWithUser[]) ?? [];
}

/** Marque (ou met à jour) la présence d'un étudiant pour une date. */
export async function markAttendance(a: {
  program_course_id: string; student_id: string; session_date: string;
  present: boolean; cycle?: string | null; mode?: CycleMode | null;
  session_id?: string | null; marked_by?: string | null;
}) {
  return supabase.from("attendance")
    .upsert(a, { onConflict: "program_course_id,student_id,session_date" });
}

/** Taux de présence agrégé par cycle (annee_niveau) puis par mode. */
export function attendanceRates(rows: DBAttendance[]) {
  const byCycle: Record<string, { present: number; total: number }> = {};
  const byMode: Record<string, { present: number; total: number }> = {};
  rows.forEach((r) => {
    const c = r.cycle ?? "—";
    const m = r.mode ?? "—";
    (byCycle[c] ??= { present: 0, total: 0 }).total++;
    if (r.present) byCycle[c].present++;
    (byMode[m] ??= { present: 0, total: 0 }).total++;
    if (r.present) byMode[m].present++;
  });
  return { byCycle, byMode };
}
