import { supabase } from "@/lib/supabase";

export type LiveStatus = "planifie" | "encours" | "termine";

export interface DBLive {
  id: string;
  program_course_id: string | null;
  chapter_id: string | null;
  title: string;
  status: LiveStatus;
  started_at: string | null;
  ended_at: string | null;
  created_by: string | null;
  recording_url?: string | null;   // replay pour les étudiants online
  created_at: string;
}

/** Crée une classe virtuelle (planifiée) et renvoie son id. */
export async function createLive(l: Partial<DBLive>): Promise<string | null> {
  const { data } = await supabase.from("lives")
    .insert({ status: "planifie", ...l }).select("id").single();
  return (data as { id: string } | null)?.id ?? null;
}

export async function fetchLive(id: string): Promise<DBLive | null> {
  const { data } = await supabase.from("lives").select("*").eq("id", id).maybeSingle();
  return (data as DBLive) ?? null;
}

/** Lives des matières fournies (pour les bannières « en direct »). */
export async function fetchLivesForCourses(courseIds: string[]): Promise<DBLive[]> {
  if (courseIds.length === 0) return [];
  const { data } = await supabase.from("lives").select("*")
    .in("program_course_id", courseIds).order("created_at", { ascending: false });
  return (data as DBLive[]) ?? [];
}

/** Passe le live en direct / terminé (présence enseignant). */
export async function setLiveStatus(id: string, status: LiveStatus) {
  const patch: Partial<DBLive> = { status };
  if (status === "encours") patch.started_at = new Date().toISOString();
  if (status === "termine") patch.ended_at = new Date().toISOString();
  return supabase.from("lives").update(patch).eq("id", id);
}

export async function deleteLive(id: string) {
  return supabase.from("lives").delete().eq("id", id);
}

/**
 * Abonnement temps réel à TOUS les lives ; le callback reçoit la ligne modifiée.
 * On filtre côté client par matière (le filtre `in` n'est pas supporté en realtime).
 * Renvoie une fonction de désabonnement.
 */
export function subscribeLives(onChange: (live: DBLive) => void): () => void {
  const channel = supabase
    .channel("lives-feed")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "lives" },
      (payload) => {
        const row = (payload.new ?? payload.old) as DBLive;
        if (row) onChange(row);
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/* ════════════════════════════════════════════════════════════
   PRÉSENCE AUTOMATIQUE — journal de connexion aux lives
════════════════════════════════════════════════════════════ */
import type { DBLiveAttendance, DBProgramCourse } from "@/lib/supabase";

/** Enregistre l'entrée d'un participant (1 ligne par live+user, upsert). */
export async function logLiveJoin(liveId: string, userId: string, role: string) {
  return supabase.from("live_attendance")
    .upsert({ live_id: liveId, user_id: userId, role }, { onConflict: "live_id,user_id", ignoreDuplicates: true });
}

/** Horodate la sortie du participant. */
export async function logLiveLeave(liveId: string, userId: string) {
  return supabase.from("live_attendance")
    .update({ left_at: new Date().toISOString() })
    .eq("live_id", liveId).eq("user_id", userId);
}

export async function fetchLiveAttendance(liveId: string): Promise<DBLiveAttendance[]> {
  const { data } = await supabase.from("live_attendance").select("*").eq("live_id", liveId);
  return (data as DBLiveAttendance[]) ?? [];
}

export async function fetchAttendanceForLives(liveIds: string[]): Promise<DBLiveAttendance[]> {
  if (!liveIds.length) return [];
  const { data } = await supabase.from("live_attendance").select("*").in("live_id", liveIds);
  return (data as DBLiveAttendance[]) ?? [];
}

export type AutoStatus = "present" | "retard" | "absent";

/** Statut automatique d'un participant selon les délais configurés sur le cours.
    - jamais connecté            → absent
    - connecté après le retard max → absent (retard disqualifiant)
    - resté moins que le minimum   → absent (sortie prématurée)
    - connecté dans les temps mais après 5 min → retard (présent signalé)   */
export function autoStatus(
  live: DBLive,
  course: Pick<DBProgramCourse, "live_max_join_delay_min" | "live_min_stay_min" | "live_duration_min">,
  row: DBLiveAttendance | undefined,
): AutoStatus {
  if (!row || !live.started_at) return "absent";
  const start = new Date(live.started_at).getTime();
  const joined = new Date(row.joined_at).getTime();
  const delayMin = (joined - start) / 60000;
  if (delayMin > (course.live_max_join_delay_min ?? 15)) return "absent";
  const end = row.left_at ? new Date(row.left_at).getTime()
    : live.ended_at ? new Date(live.ended_at).getTime() : Date.now();
  const stayMin = (end - joined) / 60000;
  if (stayMin < (course.live_min_stay_min ?? 30)) return "absent";
  return delayMin > 5 ? "retard" : "present";
}
