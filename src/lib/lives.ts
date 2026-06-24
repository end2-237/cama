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
