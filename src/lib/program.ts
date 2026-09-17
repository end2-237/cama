import { supabase } from "@/lib/supabase";
import type { DBProgramCourse, DBSession, DBChapter, DBChapterProgress } from "@/lib/supabase";
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

// ════════════════════════════════════════════════════════════
// ENSEIGNANT — matières assignées + contenu
// ════════════════════════════════════════════════════════════
export async function fetchTeacherCourses(teacherId: string): Promise<DBProgramCourse[]> {
  const { data } = await supabase.from("program_courses").select("*")
    .eq("teacher_id", teacherId).order("semestre").order("ordre");
  return (data as DBProgramCourse[]) ?? [];
}

export async function updateCourseContent(courseId: string, patch: Partial<DBProgramCourse>) {
  return supabase.from("program_courses").update(patch).eq("id", courseId);
}

// ── Chapitres ──
export async function fetchChapters(courseId: string): Promise<DBChapter[]> {
  const { data } = await supabase.from("course_chapters").select("*")
    .eq("program_course_id", courseId).order("ordre");
  return (data as DBChapter[]) ?? [];
}

export async function addChapter(courseId: string, title: string, ordre: number) {
  return supabase.from("course_chapters").insert({ program_course_id: courseId, title, ordre });
}

export async function updateChapter(id: string, patch: Partial<DBChapter>) {
  return supabase.from("course_chapters").update(patch).eq("id", id);
}

export async function deleteChapter(id: string) {
  return supabase.from("course_chapters").delete().eq("id", id);
}

// ════════════════════════════════════════════════════════════
// ÉTUDIANT — programme + progression
// ════════════════════════════════════════════════════════════
/**
 * Matières du programme de l'étudiant (sa filière), publiées et limitées à
 * son année/cycle (annee_niveau : L1..M2). Un L3 ne voit que les UE de L3.
 */
export async function fetchStudentProgram(parcoursSlug: string, anneeNiveau?: string): Promise<DBProgramCourse[]> {
  let q = supabase.from("program_courses").select("*")
    .eq("parcours_slug", parcoursSlug).eq("published", true);
  if (anneeNiveau) q = q.eq("annee_niveau", anneeNiveau);
  const { data } = await q.order("semestre").order("ordre");
  return (data as DBProgramCourse[]) ?? [];
}

export async function fetchProgress(studentId: string): Promise<DBChapterProgress[]> {
  const { data } = await supabase.from("chapter_progress").select("*").eq("student_id", studentId);
  return (data as DBChapterProgress[]) ?? [];
}

export async function markChapter(studentId: string, chapterId: string, done: boolean) {
  if (done) {
    return supabase.from("chapter_progress").upsert(
      { student_id: studentId, chapter_id: chapterId },
      { onConflict: "student_id,chapter_id" });
  }
  return supabase.from("chapter_progress").delete()
    .eq("student_id", studentId).eq("chapter_id", chapterId);
}

/** Séances de la filière (pour la vue programme/semaine de l'étudiant). */
export async function fetchSessionsForCourses(courseIds: string[]) {
  return fetchSessions(courseIds);
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

  // Moyenne de complétion sur les matières qui ont au moins un chapitre
  const withChapters = courses.filter((c) => (perCourse[c.id]?.chapters ?? 0) > 0);
  const avgCompletion = withChapters.length
    ? Math.round(withChapters.reduce((a, c) => a + perCourse[c.id].completion, 0) / withChapters.length)
    : 0;

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


// ════════════════════════════════════════════════════════════
// Étape 6 — Structure de programme par établissement (tracks/levels)
// ════════════════════════════════════════════════════════════

export interface DBTrack { id: string; org_id: string; slug: string; title: string; cycle_type: string; ordre: number; }
export interface DBLevel { id: string; org_id: string; code: string; title: string; ordre: number; }

export async function fetchTracks(): Promise<DBTrack[]> {
  const { data } = await supabase.from("program_tracks").select("*").order("ordre");
  return (data as DBTrack[]) ?? [];
}
export async function fetchLevels(): Promise<DBLevel[]> {
  const { data } = await supabase.from("program_levels").select("*").order("ordre");
  return (data as DBLevel[]) ?? [];
}
export async function createTrack(t: { slug: string; title: string; cycle_type?: string; ordre?: number }) {
  return supabase.from("program_tracks").insert({
    slug: t.slug, title: t.title, cycle_type: t.cycle_type ?? "Licence", ordre: t.ordre ?? 0,
  });
}
export async function deleteTrack(id: string) {
  return supabase.from("program_tracks").delete().eq("id", id);
}
export async function createLevel(l: { code: string; title: string; ordre?: number }) {
  return supabase.from("program_levels").insert({ code: l.code, title: l.title, ordre: l.ordre ?? 0 });
}
export async function deleteLevel(id: string) {
  return supabase.from("program_levels").delete().eq("id", id);
}

/** Filières effectives : DB de l'org si définies, sinon repli PARCOURS (JFN). */
export function effectiveTracks(dbTracks: DBTrack[]): { slug: string; title: string; cycle_type: string }[] {
  if (dbTracks.length) return dbTracks.map((t) => ({ slug: t.slug, title: t.title, cycle_type: t.cycle_type }));
  return PARCOURS.map((p) => ({ slug: p.slug, title: p.title, cycle_type: p.cycleType }));
}
/** Niveaux effectifs : DB de l'org si définis, sinon repli L1…M2 (JFN). */
export function effectiveLevels(dbLevels: DBLevel[]): { code: string; title: string }[] {
  if (dbLevels.length) return dbLevels.map((l) => ({ code: l.code, title: l.title }));
  return ["L1", "L2", "L3", "M1", "M2"].map((c) => ({ code: c, title: c }));
}
