import { supabase } from "@/lib/supabase";
import type {
  DBExam, DBExamQuestion, DBExamAttempt, DBDeliberation,
  ExamStatus, AttemptStatus, DelibStatus,
} from "@/lib/supabase";

// ════════════════════════════════════════════════════════════
// ENSEIGNANT / ADMIN — création & gestion des examens
// ════════════════════════════════════════════════════════════
export async function fetchExamsForCourses(courseIds: string[]): Promise<DBExam[]> {
  if (courseIds.length === 0) return [];
  const { data } = await supabase.from("exams").select("*")
    .in("program_course_id", courseIds).order("created_at", { ascending: false });
  return (data as DBExam[]) ?? [];
}

export async function createExam(e: Partial<DBExam>) {
  return supabase.from("exams").insert(e).select().single();
}

export async function updateExam(id: string, patch: Partial<DBExam>) {
  return supabase.from("exams").update(patch).eq("id", id);
}

export async function setExamStatus(id: string, status: ExamStatus) {
  return supabase.from("exams").update({ status }).eq("id", id);
}

export async function deleteExam(id: string) {
  return supabase.from("exams").delete().eq("id", id);
}

// ── Questions ──
export async function fetchQuestions(examId: string): Promise<DBExamQuestion[]> {
  const { data } = await supabase.from("exam_questions").select("*")
    .eq("exam_id", examId).order("ordre");
  return (data as DBExamQuestion[]) ?? [];
}

export async function addQuestion(q: Partial<DBExamQuestion>) {
  return supabase.from("exam_questions").insert(q);
}

export async function updateQuestion(id: string, patch: Partial<DBExamQuestion>) {
  return supabase.from("exam_questions").update(patch).eq("id", id);
}

export async function deleteQuestion(id: string) {
  return supabase.from("exam_questions").delete().eq("id", id);
}

// ════════════════════════════════════════════════════════════
// ÉTUDIANT — passage d'examen
// ════════════════════════════════════════════════════════════
export async function fetchExam(id: string): Promise<DBExam | null> {
  const { data } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
  return (data as DBExam) ?? null;
}

/** Examens ouverts pour les matières publiées de la filière de l'étudiant. */
export async function fetchOpenExams(courseIds: string[]): Promise<DBExam[]> {
  if (courseIds.length === 0) return [];
  const { data } = await supabase.from("exams").select("*")
    .in("program_course_id", courseIds).eq("status", "ouvert")
    .order("scheduled_at", { ascending: true });
  return (data as DBExam[]) ?? [];
}

export async function fetchAttempt(examId: string, studentId: string): Promise<DBExamAttempt | null> {
  const { data } = await supabase.from("exam_attempts").select("*")
    .eq("exam_id", examId).eq("student_id", studentId).maybeSingle();
  return (data as DBExamAttempt) ?? null;
}

export async function fetchAttemptsForStudent(studentId: string): Promise<DBExamAttempt[]> {
  const { data } = await supabase.from("exam_attempts").select("*").eq("student_id", studentId);
  return (data as DBExamAttempt[]) ?? [];
}

/** Démarre (ou reprend) une tentative — une seule par (exam, étudiant). */
export async function startAttempt(examId: string, studentId: string): Promise<DBExamAttempt | null> {
  const existing = await fetchAttempt(examId, studentId);
  if (existing) return existing;
  const { data } = await supabase.from("exam_attempts")
    .insert({ exam_id: examId, student_id: studentId, status: "encours" })
    .select().single();
  return (data as DBExamAttempt) ?? null;
}

export async function pushAlert(attemptId: string, alert: { type: string; detail: string }) {
  // Récupère, ajoute, réécrit (pas d'array_append via PostgREST simple)
  const { data } = await supabase.from("exam_attempts").select("alerts").eq("id", attemptId).maybeSingle();
  const alerts = ((data?.alerts as DBExamAttempt["alerts"]) ?? []);
  alerts.push({ time: new Date().toISOString(), ...alert });
  return supabase.from("exam_attempts").update({ alerts }).eq("id", attemptId);
}

/** Correction automatique des QCM. Renvoie { score, scoreMax, hasOpen }. */
export function autograde(questions: DBExamQuestion[], answers: Record<string, number | string>) {
  let score = 0, scoreMax = 0, hasOpen = false;
  for (const q of questions) {
    scoreMax += q.points;
    if (q.type === "qcm") {
      if (answers[q.id] !== undefined && Number(answers[q.id]) === q.correct_index) score += q.points;
    } else {
      hasOpen = true; // correction manuelle requise
    }
  }
  return { score, scoreMax, hasOpen };
}

export async function submitAttempt(
  attemptId: string,
  answers: Record<string, number | string>,
  questions: DBExamQuestion[],
) {
  const { score, scoreMax, hasOpen } = autograde(questions, answers);
  const status: AttemptStatus = hasOpen ? "soumis" : "corrige";
  return supabase.from("exam_attempts").update({
    answers, score, score_max: scoreMax, status,
    submitted_at: new Date().toISOString(),
  }).eq("id", attemptId);
}

// ── Correction enseignant (questions ouvertes) ──
export async function fetchAttemptsForExam(examId: string): Promise<DBExamAttempt[]> {
  const { data } = await supabase.from("exam_attempts").select("*").eq("exam_id", examId);
  return (data as DBExamAttempt[]) ?? [];
}

export async function gradeAttempt(attemptId: string, score: number, feedback: string) {
  return supabase.from("exam_attempts").update({
    score, status: "corrige", feedback,
  }).eq("id", attemptId);
}

// ════════════════════════════════════════════════════════════
// JURY / ADMIN — délibérations
// ════════════════════════════════════════════════════════════
export interface DelibWithMeta extends DBDeliberation {
  student?: { first_name: string; last_name: string; email: string };
  course?: { code: string; title: string; ects: number };
}

export async function fetchDeliberations(): Promise<DelibWithMeta[]> {
  const { data } = await supabase.from("deliberations")
    .select("*, student:users!deliberations_student_id_fkey(first_name,last_name,email), course:program_courses(code,title,ects)")
    .order("created_at", { ascending: false });
  return (data as DelibWithMeta[]) ?? [];
}

export async function upsertDeliberation(d: Partial<DBDeliberation>) {
  return supabase.from("deliberations").upsert(d, { onConflict: "program_course_id,student_id" });
}

export async function setDelibStatus(id: string, status: DelibStatus, validatedBy: string, credits: number) {
  return supabase.from("deliberations").update({
    status, validated_by: validatedBy,
    validated_at: new Date().toISOString(),
    credits: status === "valide" ? credits : 0,
  }).eq("id", id);
}
