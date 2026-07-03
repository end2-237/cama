import { supabase } from "@/lib/supabase";
import type { DBRemoteMachine } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════
// TP — Machines Linux distantes (terminal web embarqué)
// ════════════════════════════════════════════════════════════

export async function fetchMachines(): Promise<DBRemoteMachine[]> {
  const { data } = await supabase.from("remote_machines").select("*").order("created_at", { ascending: false });
  return (data as DBRemoteMachine[]) ?? [];
}

export async function addMachine(m: Partial<DBRemoteMachine>) {
  return supabase.from("remote_machines").insert(m);
}

export async function updateMachine(id: string, patch: Partial<DBRemoteMachine>) {
  return supabase.from("remote_machines").update(patch).eq("id", id);
}

export async function deleteMachine(id: string) {
  return supabase.from("remote_machines").delete().eq("id", id);
}

// Ouvre / ferme l'accès étudiant à une machine (séance de TP).
export async function setMachineAvailable(id: string, available: boolean) {
  return supabase.from("remote_machines").update({ available }).eq("id", id);
}

/* ════════════════════════════════════════════════════════════
   TP PROGRAMMÉS — le prof programme un TP dans son cours :
   machine attribuée + liste d'activités. L'étudiant coche sa
   progression, chaque connexion machine est une session, le prof
   apprécie et note dans la fenêtre multi-écran.
════════════════════════════════════════════════════════════ */

export type TpStatus = "ferme" | "ouvert" | "termine";

export interface DBCourseTp {
  id: string;
  program_course_id: string;
  machine_id: string | null;
  title: string;
  description: string | null;
  activities: string[];
  status: TpStatus;
  created_by: string | null;
  created_at: string;
}

export interface DBTpSession {
  id: string;
  tp_id: string;
  student_id: string;
  started_at: string;
  ended_at: string | null;
  report: string | null;
}

export interface DBTpProgress {
  tp_id: string;
  student_id: string;
  done: number[];
  updated_at: string;
}

export interface DBTpGrade {
  tp_id: string;
  student_id: string;
  note: number | null;
  appreciation: string | null;
  graded_by: string | null;
  graded_at: string;
}

// ── CRUD TP (enseignant) ──
export async function fetchTpsForCourses(courseIds: string[]): Promise<DBCourseTp[]> {
  if (!courseIds.length) return [];
  const { data } = await supabase.from("course_tps").select("*")
    .in("program_course_id", courseIds).order("created_at", { ascending: false });
  return (data as DBCourseTp[]) ?? [];
}

export async function fetchTp(id: string): Promise<DBCourseTp | null> {
  const { data } = await supabase.from("course_tps").select("*").eq("id", id).maybeSingle();
  return (data as DBCourseTp) ?? null;
}

export async function createTp(tp: Partial<DBCourseTp>) {
  return supabase.from("course_tps").insert(tp);
}

export async function updateTp(id: string, patch: Partial<DBCourseTp>) {
  return supabase.from("course_tps").update(patch).eq("id", id);
}

export async function deleteTp(id: string) {
  return supabase.from("course_tps").delete().eq("id", id);
}

// ── Sessions de travail (étudiant ↔ machine) ──
export async function startTpSession(tpId: string, studentId: string): Promise<string | null> {
  const { data } = await supabase.from("tp_sessions")
    .insert({ tp_id: tpId, student_id: studentId }).select("id").single();
  return (data as { id: string } | null)?.id ?? null;
}

export async function endTpSession(sessionId: string, report?: string) {
  const patch: Record<string, unknown> = { ended_at: new Date().toISOString() };
  if (report !== undefined) patch.report = report;
  return supabase.from("tp_sessions").update(patch).eq("id", sessionId);
}

export async function saveTpReport(sessionId: string, report: string) {
  return supabase.from("tp_sessions").update({ report }).eq("id", sessionId);
}

export async function fetchTpSessions(tpId: string): Promise<DBTpSession[]> {
  const { data } = await supabase.from("tp_sessions").select("*")
    .eq("tp_id", tpId).order("started_at", { ascending: false });
  return (data as DBTpSession[]) ?? [];
}

export async function fetchMyTpSessions(tpId: string, studentId: string): Promise<DBTpSession[]> {
  const { data } = await supabase.from("tp_sessions").select("*")
    .eq("tp_id", tpId).eq("student_id", studentId).order("started_at", { ascending: false });
  return (data as DBTpSession[]) ?? [];
}

// ── Progression (activités cochées) ──
export async function saveTpProgress(tpId: string, studentId: string, done: number[]) {
  return supabase.from("tp_progress").upsert({
    tp_id: tpId, student_id: studentId, done, updated_at: new Date().toISOString(),
  }, { onConflict: "tp_id,student_id" });
}

export async function fetchTpProgress(tpId: string): Promise<DBTpProgress[]> {
  const { data } = await supabase.from("tp_progress").select("*").eq("tp_id", tpId);
  return (data as DBTpProgress[]) ?? [];
}

export async function fetchMyTpProgress(tpId: string, studentId: string): Promise<DBTpProgress | null> {
  const { data } = await supabase.from("tp_progress").select("*")
    .eq("tp_id", tpId).eq("student_id", studentId).maybeSingle();
  return (data as DBTpProgress) ?? null;
}

export async function fetchTpProgressForCourses(tpIds: string[]): Promise<DBTpProgress[]> {
  if (!tpIds.length) return [];
  const { data } = await supabase.from("tp_progress").select("*").in("tp_id", tpIds);
  return (data as DBTpProgress[]) ?? [];
}

// ── Appréciation & note (prof) ──
export async function saveTpGrade(tpId: string, studentId: string, note: number, appreciation: string, gradedBy: string) {
  return supabase.from("tp_grades").upsert({
    tp_id: tpId, student_id: studentId, note, appreciation: appreciation.trim() || null,
    graded_by: gradedBy, graded_at: new Date().toISOString(),
  }, { onConflict: "tp_id,student_id" });
}

export async function fetchTpGrades(tpId: string): Promise<DBTpGrade[]> {
  const { data } = await supabase.from("tp_grades").select("*").eq("tp_id", tpId);
  return (data as DBTpGrade[]) ?? [];
}

/** Ajoute l'identité de l'étudiant à l'URL d'une machine (?arg=<id>) pour
    router vers SON conteneur (script cama-tp-setup-persistent.sh). Sans effet
    sur les machines mono-shell / multi-jetables (l'argument est ignoré). */
export function machineUrlFor(webUrl: string, studentId: string): string {
  if (!webUrl) return webUrl;
  const sep = webUrl.includes("?") ? "&" : "?";
  return `${webUrl}${sep}arg=${encodeURIComponent(studentId)}`;
}
