import { supabase } from "@/lib/supabase";
import type { DBProgramCourse } from "@/lib/supabase";
import { PARCOURS } from "@/lib/parcours";

/** Heuristique volume horaire par défaut : ~10h de contact par crédit ECTS. */
export function defaultHours(ects: number): number {
  return ects * 10;
}

/** Aplatis le catalogue parcours.ts en lignes program_courses (curriculum). */
export function buildCurriculumRows() {
  const rows: Array<Partial<DBProgramCourse>> = [];
  for (const p of PARCOURS) {
    p.annees.forEach((annee) => {
      annee.semestres.forEach((sem) => {
        const semCode = sem.nom.replace(/[^0-9]/g, "");
        sem.ues.forEach((ue, i) => {
          rows.push({
            parcours_slug:  p.slug,
            parcours_title: p.title,
            annee_niveau:   annee.niveau,
            semestre:       `S${semCode}`,
            code:           ue.code,
            title:          ue.title,
            ects:           ue.ects,
            hours:          defaultHours(ue.ects),
            modalites:      ue.type,
            evaluation:     ue.devoirs,
            ordre:          i,
          });
        });
      });
    });
  }
  return rows;
}

/**
 * Synchronise le programme dans Supabase.
 * Upsert sur (parcours_slug, code) — ne touche pas aux colonnes d'affectation
 * ni de contenu déjà remplies (on n'envoie que les champs curriculum).
 */
export async function syncProgram(): Promise<{ count: number; error: string | null }> {
  const rows = buildCurriculumRows();
  const { error, count } = await supabase
    .from("program_courses")
    .upsert(rows, { onConflict: "parcours_slug,code", ignoreDuplicates: false, count: "exact" });
  return { count: count ?? rows.length, error: error?.message ?? null };
}

export async function fetchProgram(parcoursSlug?: string): Promise<DBProgramCourse[]> {
  let q = supabase.from("program_courses").select("*").order("semestre").order("ordre");
  if (parcoursSlug) q = q.eq("parcours_slug", parcoursSlug);
  const { data } = await q;
  return (data as DBProgramCourse[]) ?? [];
}

export async function assignTeacher(courseId: string, teacherId: string | null) {
  return supabase.from("program_courses").update({ teacher_id: teacherId }).eq("id", courseId);
}

export async function updateHours(courseId: string, hours: number) {
  return supabase.from("program_courses").update({ hours }).eq("id", courseId);
}
