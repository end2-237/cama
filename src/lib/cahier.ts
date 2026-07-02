import { supabase } from "@/lib/supabase";
import type { DBCahierEntry, DBProgramCourse, DBChapter } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════
   CAHIER DE TEXTE — journal pédagogique du cours
   + suivi de progression enseignant (heures faites / prévues)
════════════════════════════════════════════════════════════ */

export async function fetchCahier(courseId: string): Promise<DBCahierEntry[]> {
  const { data } = await supabase.from("cahier_texte").select("*")
    .eq("program_course_id", courseId).order("entry_date", { ascending: false });
  return (data as DBCahierEntry[]) ?? [];
}

export async function fetchCahierForCourses(courseIds: string[]): Promise<DBCahierEntry[]> {
  if (!courseIds.length) return [];
  const { data } = await supabase.from("cahier_texte").select("*")
    .in("program_course_id", courseIds).order("entry_date", { ascending: false });
  return (data as DBCahierEntry[]) ?? [];
}

export async function addCahierEntry(e: Partial<DBCahierEntry>) {
  return supabase.from("cahier_texte").insert(e);
}

export async function deleteCahierEntry(id: string) {
  return supabase.from("cahier_texte").delete().eq("id", id);
}

/** Progression pédagogique d'un cours : heures consignées au cahier de
    texte vs volume horaire officiel + complétude du contenu en ligne. */
export interface TeacherProgress {
  hoursDone: number;       // heures consignées au cahier
  hoursPlanned: number;    // volume horaire officiel de l'UE
  pctHours: number;        // % d'avancement horaire
  entries: number;         // nb de séances consignées
  chaptersTotal: number;
  chaptersWithContent: number;  // chapitres ayant PDF/vidéo/natif
  pctContent: number;
}

export function computeProgress(
  course: Pick<DBProgramCourse, "hours">,
  entries: DBCahierEntry[],
  chapters: DBChapter[],
): TeacherProgress {
  const hoursDone = Math.round(entries.reduce((a, e) => a + (e.duration_min || 0), 0) / 60 * 10) / 10;
  const hoursPlanned = course.hours || 0;
  const chaptersWithContent = chapters.filter((c) => c.pdf || c.video || c.natif).length;
  return {
    hoursDone, hoursPlanned,
    pctHours: hoursPlanned ? Math.min(100, Math.round((hoursDone / hoursPlanned) * 100)) : 0,
    entries: entries.length,
    chaptersTotal: chapters.length,
    chaptersWithContent,
    pctContent: chapters.length ? Math.round((chaptersWithContent / chapters.length) * 100) : 0,
  };
}
