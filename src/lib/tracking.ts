import { supabase } from "@/lib/supabase";
import type { DBUser } from "@/lib/supabase";
import type { DBLive } from "@/lib/lives";
import { autoStatus } from "@/lib/lives";
import type { DBLiveAttendance, DBProgramCourse } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════
   SUIVI & QUALITÉ — progression étudiante par cycle, ancrage du
   cours natif (anti scroll rapide), retours étudiants, évaluation
   qualité des enseignants (administration).
════════════════════════════════════════════════════════════ */

// ── Ancrage de lecture du cours natif ──
export interface DBNativeProgress {
  student_id: string;
  chapter_id: string;
  pct: number;
  read_ms: number;
  fast_scrolls: number;
  updated_at: string;
}

/** Enregistre l'ancrage de lecture (le client n'envoie que du temps VALIDE :
    les scrolls rapides pour "passer" ne comptent pas). */
export async function saveNativeProgress(
  studentId: string, chapterId: string,
  patch: { pct: number; read_ms: number; fast_scrolls: number },
) {
  return supabase.from("native_progress").upsert({
    student_id: studentId, chapter_id: chapterId,
    ...patch, updated_at: new Date().toISOString(),
  }, { onConflict: "student_id,chapter_id" });
}

export async function fetchNativeProgress(studentId: string): Promise<DBNativeProgress[]> {
  const { data } = await supabase.from("native_progress").select("*").eq("student_id", studentId);
  return (data as DBNativeProgress[]) ?? [];
}

export async function fetchNativeProgressForChapters(chapterIds: string[]): Promise<DBNativeProgress[]> {
  if (!chapterIds.length) return [];
  const { data } = await supabase.from("native_progress").select("*").in("chapter_id", chapterIds);
  return (data as DBNativeProgress[]) ?? [];
}

// ── Retour étudiant (qualité perçue d'un cours) ──
export interface DBCourseFeedback {
  id: string;
  program_course_id: string;
  student_id: string;
  rating: number;               // note du COURS 1..5
  comment: string | null;
  teacher_rating: number | null;// note de l'ENSEIGNANT 1..5
  teacher_comment: string | null;
  created_at: string;
}

export async function submitFeedback(
  courseId: string, studentId: string,
  rating: number, comment: string,
  teacherRating?: number, teacherComment?: string,
) {
  const row: Record<string, unknown> = {
    program_course_id: courseId, student_id: studentId,
    rating, comment: comment.trim() || null,
  };
  if (teacherRating !== undefined) row.teacher_rating = teacherRating;
  if (teacherComment !== undefined) row.teacher_comment = teacherComment.trim() || null;
  return supabase.from("course_feedback").upsert(row, { onConflict: "program_course_id,student_id" });
}

export async function fetchFeedback(courseId: string): Promise<DBCourseFeedback[]> {
  const { data } = await supabase.from("course_feedback").select("*").eq("program_course_id", courseId);
  return (data as DBCourseFeedback[]) ?? [];
}

export async function fetchAllFeedback(): Promise<DBCourseFeedback[]> {
  const { data } = await supabase.from("course_feedback").select("*");
  return (data as DBCourseFeedback[]) ?? [];
}

export async function fetchMyFeedback(studentId: string, courseId: string): Promise<DBCourseFeedback | null> {
  const { data } = await supabase.from("course_feedback").select("*")
    .eq("student_id", studentId).eq("program_course_id", courseId).maybeSingle();
  return (data as DBCourseFeedback) ?? null;
}

// ── Évaluation qualité enseignant (administration) ──
export interface DBTeacherReview {
  id: string;
  teacher_id: string;
  program_course_id: string | null;
  score: number;          // 1..5
  comment: string | null;
  created_by: string | null;
  created_at: string;
}

export async function addTeacherReview(r: Partial<DBTeacherReview>) {
  return supabase.from("teacher_reviews").insert(r);
}

export async function fetchTeacherReviews(): Promise<DBTeacherReview[]> {
  const { data } = await supabase.from("teacher_reviews").select("*").order("created_at", { ascending: false });
  return (data as DBTeacherReview[]) ?? [];
}

// ── Replay des lives ──
export async function setLiveRecording(liveId: string, url: string | null) {
  return supabase.from("lives").update({ recording_url: url }).eq("id", liveId);
}

/* ════════════════════════════════════════════════════════════
   PROGRESSION ÉTUDIANTE PAR CYCLE
   - presentiel : NON suivie (consultation libre uniquement)
   - online     : 100 % ancrage du cours natif (scroll valide)
   - hybride    : 70 % présence aux lives + 30 % ancrage natif
════════════════════════════════════════════════════════════ */
export type CycleMode = "online" | "hybride" | "presentiel";

export interface StudentProgression {
  tracked: boolean;          // false pour présentiel
  pct: number;               // progression globale 0-100
  natifPct: number;          // ancrage moyen du natif
  livePct: number;           // % de présence aux lives (hybride)
  fastScrolls: number;       // signaux de lecture superficielle
  detail: string;            // explication de la formule
}

export function computeStudentProgression(
  mode: CycleMode,
  natifRows: DBNativeProgress[],       // lignes de l'étudiant sur les chapitres du cursus
  natifChapterCount: number,           // nb total de chapitres natifs du cursus
  lives: DBLive[],                     // lives tenus des cours de l'étudiant
  liveRows: DBLiveAttendance[],        // ses lignes de connexion
  courseById: Map<string, Pick<DBProgramCourse, "live_max_join_delay_min" | "live_min_stay_min" | "live_duration_min">>,
): StudentProgression {
  if (mode === "presentiel") {
    return { tracked: false, pct: 0, natifPct: 0, livePct: 0, fastScrolls: 0,
      detail: "Cycle présentiel : consultation libre, progression non suivie sur la plateforme." };
  }

  const natifPct = natifChapterCount
    ? Math.round(natifRows.reduce((a, r) => a + r.pct, 0) / natifChapterCount)
    : 0;
  const fastScrolls = natifRows.reduce((a, r) => a + r.fast_scrolls, 0);

  if (mode === "online") {
    return { tracked: true, pct: natifPct, natifPct, livePct: 0, fastScrolls,
      detail: "Cycle 100% en ligne : progression = ancrage réel du cours natif (les scrolls rapides ne comptent pas)." };
  }

  // hybride : 70 % lives + 30 % natif
  const held = lives.filter((l) => l.started_at);
  const byLive = new Map(liveRows.map((r) => [r.live_id, r]));
  let present = 0;
  for (const l of held) {
    const course = l.program_course_id ? courseById.get(l.program_course_id) : undefined;
    if (!course) continue;
    const st = autoStatus(l, course, byLive.get(l.id));
    if (st === "present" || st === "retard") present++;
  }
  const livePct = held.length ? Math.round((present / held.length) * 100) : 0;
  const pct = Math.round(livePct * 0.7 + natifPct * 0.3);
  return { tracked: true, pct, natifPct, livePct, fastScrolls,
    detail: "Cycle hybride : 70 % présence aux cours live + 30 % ancrage du cours natif." };
}

/* Accès aux lives selon le cycle :
   - hybride    : accès direct (programme live imposé par le prof)
   - presentiel : consultation libre (non suivi)
   - online     : live si en cours, sinon replay                       */
export function liveAccess(mode: CycleMode, live: Pick<DBLive, "status" | "recording_url">):
  { canJoin: boolean; showReplay: boolean; reason: string } {
  if (mode === "hybride") return { canJoin: true, showReplay: live.status === "termine" && !!live.recording_url, reason: "Programme live de votre cycle hybride." };
  if (mode === "presentiel") return { canJoin: live.status === "encours", showReplay: false, reason: "Cycle présentiel : consultation libre." };
  // online
  if (live.status === "encours") return { canJoin: true, showReplay: false, reason: "Live en cours : accès ouvert." };
  return { canJoin: false, showReplay: !!live.recording_url, reason: "Hors horaire : regardez l'enregistrement du live." };
}

export function averageRating(rows: { rating: number }[]): number {
  return rows.length ? Math.round(rows.reduce((a, r) => a + r.rating, 0) / rows.length * 10) / 10 : 0;
}

export function teacherName(id: string | null, users: Map<string, DBUser>): string {
  if (!id) return "—";
  const u = users.get(id);
  return u ? `${u.first_name} ${u.last_name}`.trim() : "—";
}
