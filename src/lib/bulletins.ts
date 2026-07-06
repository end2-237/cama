import { supabase } from "@/lib/supabase";
import type { DBExam, DBExamAttempt } from "@/lib/supabase";
import { effectiveScore } from "@/lib/exams";
import { fetchStudentProgram } from "@/lib/program";
import type { DBTpGrade, DBCourseTp } from "@/lib/tp";

/* ════════════════════════════════════════════════════════════
   BULLETINS — relevés de notes semestriels consolidés
   Agrège, pour chaque UE d'un semestre : note d'examen retenue
   (session 1 / rattrapage via effectiveScore) + note de TP.
   Moyenne générale pondérée par ECTS, mention, décision.
════════════════════════════════════════════════════════════ */

export interface DBTranscript {
  id: string;
  student_id: string;
  academic_year: string;
  semester: number;
  parcours_slug: string | null;
  average: number | null;
  ects_earned: number;
  ects_total: number;
  mention: string | null;
  decision: string | null;   // 'admis' | 'rattrapage' | 'ajourne'
  generated_at: string;
  generated_by: string | null;
}

export interface DBTranscriptLine {
  id: string;
  transcript_id: string;
  program_course_id: string | null;
  course_title: string | null;
  code: string | null;
  ects: number;
  note: number | null;
  credit_obtenu: boolean;
  source: string | null;     // 'examen' | 'tp' | 'examen+tp' | 'aucune'
}

export const DECISION_LABEL: Record<string, string> = {
  admis: "Admis(e)", rattrapage: "Rattrapage", ajourne: "Ajourné(e)",
};

/** Mention française selon la moyenne /20. */
export function mentionFor(avg: number | null): string | null {
  if (avg == null) return null;
  if (avg >= 16) return "Très Bien";
  if (avg >= 14) return "Bien";
  if (avg >= 12) return "Assez Bien";
  if (avg >= 10) return "Passable";
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Construit (ou reconstruit) le relevé d'un étudiant pour un semestre :
 *   • note d'examen retenue par UE (toutes tentatives, règle resit_rule)
 *   • note de TP éventuelle (moyenne des tp_grades de l'UE)
 *   • moyenne UE = moyenne des notes disponibles (examen, TP)
 *   • ECTS obtenus si moyenne UE >= 10 ; moyenne générale pondérée ECTS
 *   • décision : 'admis' (moy>=10 et tous crédits), 'rattrapage' (moy>=8), sinon 'ajourne'
 * Upsert transcripts + réécriture complète des transcript_lines.
 */
export async function buildTranscript(
  studentId: string,
  year: string,
  semester: number,
  parcoursSlug: string,
  generatedBy: string | null,
): Promise<{ transcript: DBTranscript | null; error: string | null }> {
  // 1 — UE du semestre pour la filière
  const program = await fetchStudentProgram(parcoursSlug);
  const courses = program.filter((c) => c.semestre === `S${semester}`);
  if (!courses.length) return { transcript: null, error: "Aucune UE publiée pour ce semestre." };
  const courseIds = courses.map((c) => c.id);

  // 2 — Examens + tentatives de l'étudiant
  const { data: examsData } = await supabase.from("exams").select("*")
    .in("program_course_id", courseIds);
  const exams = (examsData as DBExam[]) ?? [];
  const { data: attData } = await supabase.from("exam_attempts").select("*")
    .eq("student_id", studentId).in("exam_id", exams.length ? exams.map((e) => e.id) : ["-"]);
  const attempts = (attData as DBExamAttempt[]) ?? [];

  // 3 — TP + notes de TP de l'étudiant
  const { data: tpsData } = await supabase.from("course_tps").select("*")
    .in("program_course_id", courseIds);
  const tps = (tpsData as DBCourseTp[]) ?? [];
  const { data: tpgData } = tps.length
    ? await supabase.from("tp_grades").select("*")
        .eq("student_id", studentId).in("tp_id", tps.map((t) => t.id))
    : { data: [] as DBTpGrade[] };
  const tpGrades = (tpgData as DBTpGrade[]) ?? [];

  // 4 — Agrégation par UE
  const lines: Omit<DBTranscriptLine, "id" | "transcript_id">[] = [];
  let weighted = 0, weights = 0, ectsEarned = 0, ectsTotal = 0;

  for (const c of courses) {
    ectsTotal += c.ects;

    // Note d'examen retenue : meilleure des notes effectives des examens de l'UE
    const examNotes = exams
      .filter((e) => e.program_course_id === c.id)
      .map((e) => effectiveScore(attempts.filter((a) => a.exam_id === e.id), e.resit_rule ?? "best"))
      .filter((n): n is number => n !== null);
    const examNote = examNotes.length ? Math.max(...examNotes) : null;

    // Note TP : moyenne des TP notés de l'UE
    const tpIds = new Set(tps.filter((t) => t.program_course_id === c.id).map((t) => t.id));
    const tpNotes = tpGrades.filter((g) => tpIds.has(g.tp_id) && g.note != null).map((g) => Number(g.note));
    const tpNote = tpNotes.length ? tpNotes.reduce((a, n) => a + n, 0) / tpNotes.length : null;

    const parts = [examNote, tpNote].filter((n): n is number => n !== null);
    const note = parts.length ? round2(parts.reduce((a, n) => a + n, 0) / parts.length) : null;
    const credit = note !== null && note >= 10;
    if (credit) ectsEarned += c.ects;
    if (note !== null) { weighted += note * c.ects; weights += c.ects; }

    const source = examNote !== null && tpNote !== null ? "examen+tp"
      : examNote !== null ? "examen" : tpNote !== null ? "tp" : "aucune";

    lines.push({
      program_course_id: c.id, course_title: c.title, code: c.code,
      ects: c.ects, note, credit_obtenu: credit, source,
    });
  }

  const average = weights ? round2(weighted / weights) : null;
  const decision = average !== null && average >= 10 && ectsEarned === ectsTotal ? "admis"
    : average !== null && average >= 8 ? "rattrapage" : "ajourne";

  // 5 — Upsert du relevé
  const { data: trData, error: trErr } = await supabase.from("transcripts").upsert({
    student_id: studentId, academic_year: year, semester,
    parcours_slug: parcoursSlug, average,
    ects_earned: ectsEarned, ects_total: ectsTotal,
    mention: mentionFor(average), decision,
    generated_at: new Date().toISOString(), generated_by: generatedBy,
  }, { onConflict: "student_id,academic_year,semester" }).select().single();
  if (trErr || !trData) return { transcript: null, error: trErr?.message ?? "Échec de l'enregistrement du relevé." };
  const transcript = trData as DBTranscript;

  // 6 — Réécriture des lignes
  await supabase.from("transcript_lines").delete().eq("transcript_id", transcript.id);
  const { error: lnErr } = await supabase.from("transcript_lines")
    .insert(lines.map((l) => ({ ...l, transcript_id: transcript.id })));
  return { transcript, error: lnErr?.message ?? null };
}

export async function fetchTranscript(studentId: string, year: string, semester: number): Promise<DBTranscript | null> {
  const { data } = await supabase.from("transcripts").select("*")
    .eq("student_id", studentId).eq("academic_year", year).eq("semester", semester).maybeSingle();
  return (data as DBTranscript) ?? null;
}

export async function fetchTranscriptsForStudent(studentId: string): Promise<DBTranscript[]> {
  const { data } = await supabase.from("transcripts").select("*")
    .eq("student_id", studentId)
    .order("academic_year", { ascending: false }).order("semester", { ascending: false });
  return (data as DBTranscript[]) ?? [];
}

export async function fetchTranscriptLines(transcriptId: string): Promise<DBTranscriptLine[]> {
  const { data } = await supabase.from("transcript_lines").select("*")
    .eq("transcript_id", transcriptId).order("code");
  return (data as DBTranscriptLine[]) ?? [];
}
