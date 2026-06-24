import { supabase } from "@/lib/supabase";
import type { DBAttendance, CycleMode } from "@/lib/supabase";

export interface AttendanceWithUser extends DBAttendance {
  student?: { first_name: string; last_name: string; email: string; level: string | null };
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
