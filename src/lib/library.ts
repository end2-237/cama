import { supabase } from "@/lib/supabase";
import type { DBProgramCourse, DBChapter, DBCourseResource, DBExam, DBUser } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════
   BIBLIOTHÈQUE — agrégation de tous les documents de la plateforme
   (chapitres PDF/vidéo, supports de cours, épreuves) avec métadonnées
   filière / niveau / semestre / année académique / auteur.
════════════════════════════════════════════════════════════ */

export type LibraryKind = "pdf" | "video" | "natif" | "syllabus" | "support" | "biblio" | "lien" | "epreuve";

export interface LibraryDoc {
  id: string;                 // "<source>:<id>"
  kind: LibraryKind;
  title: string;
  url: string | null;
  sizeMo: number | null;
  // Rattachement académique
  courseId: string;
  courseCode: string;
  courseTitle: string;
  parcoursSlug: string;
  parcoursTitle: string;
  level: string;              // L1…M2
  semestre: string;           // S1…S6
  academicYear: string | null;
  // Traçabilité
  authorId: string | null;
  authorName: string;
  date: string;               // ISO created_at
}

export const KIND_LABEL: Record<LibraryKind, string> = {
  pdf: "PDF de cours", video: "Vidéo", natif: "Cours natif",
  syllabus: "Syllabus", support: "Support", biblio: "Bibliographie",
  lien: "Lien externe", epreuve: "Épreuve",
};

function authorName(id: string | null, users: Map<string, DBUser>): string {
  if (!id) return "Institut JFN";
  const u = users.get(id);
  return u ? `${u.first_name} ${u.last_name}`.trim() : "Enseignant";
}

/** Charge TOUS les documents de la plateforme (bibliothèque générale). */
export async function fetchLibrary(): Promise<LibraryDoc[]> {
  const [coursesQ, chaptersQ, resourcesQ, examsQ, usersQ] = await Promise.all([
    supabase.from("program_courses").select("*"),
    supabase.from("course_chapters").select("*"),
    supabase.from("course_resources").select("*"),
    supabase.from("exams").select("*"),
    supabase.from("users").select("*"),
  ]);

  const courses = (coursesQ.data as DBProgramCourse[]) ?? [];
  const chapters = (chaptersQ.data as (DBChapter & { created_by?: string | null })[]) ?? [];
  const resources = (resourcesQ.data as DBCourseResource[]) ?? [];
  const exams = (examsQ.data as DBExam[]) ?? [];
  const users = new Map(((usersQ.data as DBUser[]) ?? []).map((u) => [u.id, u]));

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const docs: LibraryDoc[] = [];

  const meta = (courseId: string) => {
    const c = courseById.get(courseId);
    return c ? {
      courseId: c.id, courseCode: c.code, courseTitle: c.title,
      parcoursSlug: c.parcours_slug, parcoursTitle: c.parcours_title,
      level: c.annee_niveau, semestre: c.semestre,
      academicYear: c.academic_year,
      teacherId: c.teacher_id,
    } : null;
  };

  // ── Chapitres : PDF, vidéo, natif ──
  for (const ch of chapters) {
    const m = meta(ch.program_course_id);
    if (!m) continue;
    const author = ch.created_by ?? m.teacherId ?? null;
    const base = {
      courseId: m.courseId, courseCode: m.courseCode, courseTitle: m.courseTitle,
      parcoursSlug: m.parcoursSlug, parcoursTitle: m.parcoursTitle,
      level: m.level, semestre: m.semestre, academicYear: m.academicYear,
      authorId: author, authorName: authorName(author, users), date: ch.created_at,
    };
    if (ch.pdf) docs.push({
      id: `chpdf:${ch.id}`, kind: "pdf",
      title: ch.pdf.name || `${ch.title} — PDF`,
      url: ch.pdf.url ?? null, sizeMo: ch.pdf.sizeMo ?? null, ...base,
    });
    if (ch.video) docs.push({
      id: `chvid:${ch.id}`, kind: "video",
      title: ch.video.title || `${ch.title} — vidéo`,
      url: ch.video.url ?? null, sizeMo: ch.video.sizeMo ?? null, ...base,
    });
    if (ch.natif) docs.push({
      id: `chnat:${ch.id}`, kind: "natif",
      title: `${ch.title} — cours natif`,
      url: null, sizeMo: null, ...base,
    });
  }

  // ── Ressources de cours (syllabus, supports, biblio, liens) ──
  for (const r of resources) {
    const m = meta(r.program_course_id);
    if (!m) continue;
    const author = r.created_by ?? m.teacherId ?? null;
    docs.push({
      id: `res:${r.id}`, kind: (r.kind as LibraryKind) ?? "support",
      title: r.title, url: r.url, sizeMo: r.size_mo,
      courseId: m.courseId, courseCode: m.courseCode, courseTitle: m.courseTitle,
      parcoursSlug: m.parcoursSlug, parcoursTitle: m.parcoursTitle,
      level: m.level, semestre: m.semestre, academicYear: m.academicYear,
      authorId: author, authorName: authorName(author, users), date: r.created_at,
    });
  }

  // ── Épreuves (examens terminés = annales consultables) ──
  for (const e of exams) {
    const m = meta(e.program_course_id);
    if (!m) continue;
    const author = e.created_by ?? m.teacherId ?? null;
    docs.push({
      id: `exam:${e.id}`, kind: "epreuve",
      title: e.title, url: null, sizeMo: null,
      courseId: m.courseId, courseCode: m.courseCode, courseTitle: m.courseTitle,
      parcoursSlug: m.parcoursSlug, parcoursTitle: m.parcoursTitle,
      level: m.level, semestre: m.semestre, academicYear: m.academicYear,
      authorId: author, authorName: authorName(author, users), date: e.created_at,
    });
  }

  docs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return docs;
}

/** Bibliothèque personnelle d'un enseignant : documents de ses matières
    actuelles + tout document dont il est l'AUTEUR (même si le cours lui a
    été retiré — la trace created_by reste). */
export function teacherLibrary(all: LibraryDoc[], teacherId: string, currentCourseIds: string[]): LibraryDoc[] {
  const mine = new Set(currentCourseIds);
  return all.filter((d) => d.authorId === teacherId || mine.has(d.courseId));
}
