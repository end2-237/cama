import { supabase } from "@/lib/supabase";
import type { DBProgramCourse, DBSession } from "@/lib/supabase";
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

// ── Horaires (course_sessions) ──
export async function fetchSessions(courseIds: string[]): Promise<DBSession[]> {
  if (courseIds.length === 0) return [];
  const { data } = await supabase.from("course_sessions").select("*").in("program_course_id", courseIds);
  return (data as DBSession[]) ?? [];
}

export async function upsertSession(s: Partial<DBSession>) {
  if (s.id) {
    return supabase.from("course_sessions").update(s).eq("id", s.id);
  }
  return supabase.from("course_sessions").insert(s);
}

export async function deleteSession(id: string) {
  return supabase.from("course_sessions").delete().eq("id", id);
}

// ── Analytics filière (taux de performance / couverture) ──
export interface ProgramAnalytics {
  students: number;        // étudiants inscrits dans la filière
  matieres: number;
  assigned: number;        // matières avec enseignant
  published: number;       // matières avec contenu publié
  totalEcts: number;
  totalHours: number;
  chapters: number;        // total chapitres créés
  avgCompletion: number;   // % moyen de progression des étudiants
  perCourse: Record<string, { chapters: number; completion: number }>;
}

export async function fetchAnalytics(slug: string): Promise<ProgramAnalytics> {
  const courses = await fetchProgram(slug);
  const courseIds = courses.map((c) => c.id);

  // Étudiants inscrits dans la filière
  const { count: students } = await supabase
    .from("inscriptions").select("*", { count: "exact", head: true })
    .eq("parcours_slug", slug);
  const nbStudents = students ?? 0;

  // Chapitres de toutes les matières de la filière
  const { data: chaptersData } = courseIds.length
    ? await supabase.from("course_chapters").select("id,program_course_id").in("program_course_id", courseIds)
    : { data: [] as { id: string; program_course_id: string }[] };
  const chapters = (chaptersData as { id: string; program_course_id: string }[]) ?? [];
  const chapterIds = chapters.map((c) => c.id);

  // Progression enregistrée
  const { data: progData } = chapterIds.length
    ? await supabase.from("chapter_progress").select("chapter_id").in("chapter_id", chapterIds)
    : { data: [] as { chapter_id: string }[] };
  const prog = (progData as { chapter_id: string }[]) ?? [];

  // Agrégat par matière
  const perCourse: ProgramAnalytics["perCourse"] = {};
  courses.forEach((c) => {
    const chs = chapters.filter((x) => x.program_course_id === c.id);
    const chIds = new Set(chs.map((x) => x.id));
    const done = prog.filter((p) => chIds.has(p.chapter_id)).length;
    const possible = chs.length * Math.max(nbStudents, 1);
    perCourse[c.id] = {
      chapters: chs.length,
      completion: possible ? Math.round((done / possible) * 100) : 0,
    };
  });

  const completions = Object.values(perCourse).map((p) => p.completion).filter((_, i) => chapters.length > 0);
  const avgCompletion = completions.length ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length) : 0;

  return {
    students: nbStudents,
    matieres: courses.length,
    assigned: courses.filter((c) => c.teacher_id).length,
    published: courses.filter((c) => c.published).length,
    totalEcts: courses.reduce((a, c) => a + c.ects, 0),
    totalHours: courses.reduce((a, c) => a + c.hours, 0),
    chapters: chapters.length,
    avgCompletion,
    perCourse,
  };
}

