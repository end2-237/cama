import { supabase } from "@/lib/supabase";
import type { DBProgramCourse, DBDeliberation, DBExam, DBExamAttempt, DBUser } from "@/lib/supabase";
import { effectiveScore } from "@/lib/exams";
import { fetchProgram } from "@/lib/program";

/* ════════════════════════════════════════════════════════════
   JURY DE SEMESTRE — sessions, membres, décisions & compensation
   Règle de compensation : si la moyenne générale pondérée ECTS
   est ≥ 10 alors que certaines matières sont < 10, l'étudiant est
   « admis » avec compensation (compensation_applied = true).
   Moyenne ≥ 10 → admis · ≥ 8 → rattrapage · sinon → ajourné.
════════════════════════════════════════════════════════════ */

export type JuryDecisionKind = "admis" | "rattrapage" | "ajourne";

export interface DBJurySession {
  id: string;
  academic_year: string | null;
  semester: number | null;
  parcours_slug: string | null;
  status: string;                 // 'ouvert' | 'cloture'
  held_at: string;
  created_by: string | null;
  closed_at: string | null;
}

export interface DBJuryMember {
  id: string;
  jury_session_id: string;
  user_id: string | null;
  role_in_jury: string;
}

export interface JuryMemberWithUser extends DBJuryMember {
  user?: Pick<DBUser, "first_name" | "last_name" | "email" | "role">;
}

export interface DBJuryDecision {
  id: string;
  jury_session_id: string;
  student_id: string;
  average: number | null;
  ects_earned: number | null;
  decision: JuryDecisionKind | null;
  compensation_applied: boolean;
  comment: string | null;
}

export interface JuryDecisionWithUser extends DBJuryDecision {
  student?: Pick<DBUser, "first_name" | "last_name" | "email">;
}

/** Résultat calculé pour un étudiant (avant enregistrement). */
export interface SemesterResult {
  student_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  average: number | null;         // moyenne pondérée ECTS (/20)
  ects_earned: number;
  decision: JuryDecisionKind;
  compensation_applied: boolean;
  courses_below_10: number;       // matières < 10 (info)
  courses_graded: number;
}

// ── Sessions ──
export async function createJurySession(
  year: string, semester: number, parcoursSlug: string, createdBy: string,
) {
  return supabase.from("jury_sessions").insert({
    academic_year: year, semester, parcours_slug: parcoursSlug, created_by: createdBy,
  }).select().single();
}

export async function fetchJurySessions(): Promise<DBJurySession[]> {
  const { data } = await supabase.from("jury_sessions").select("*")
    .order("held_at", { ascending: false });
  return (data as DBJurySession[]) ?? [];
}

export async function fetchJurySession(id: string): Promise<DBJurySession | null> {
  const { data } = await supabase.from("jury_sessions").select("*").eq("id", id).maybeSingle();
  return (data as DBJurySession) ?? null;
}

export async function closeJurySession(id: string) {
  return supabase.from("jury_sessions").update({
    status: "cloture", closed_at: new Date().toISOString(),
  }).eq("id", id);
}

// ── Membres ──
export async function addJuryMember(sessionId: string, userId: string, role = "membre") {
  return supabase.from("jury_members").insert({
    jury_session_id: sessionId, user_id: userId, role_in_jury: role,
  });
}

export async function fetchJuryMembers(sessionId: string): Promise<JuryMemberWithUser[]> {
  const { data } = await supabase.from("jury_members")
    .select("*, user:users(first_name,last_name,email,role)")
    .eq("jury_session_id", sessionId);
  return (data as JuryMemberWithUser[]) ?? [];
}

export async function removeJuryMember(id: string) {
  return supabase.from("jury_members").delete().eq("id", id);
}

// ── Décisions ──
export async function recordDecision(
  sessionId: string,
  studentId: string,
  payload: Partial<Pick<DBJuryDecision, "average" | "ects_earned" | "decision" | "compensation_applied" | "comment">>,
) {
  return supabase.from("jury_decisions").upsert({
    jury_session_id: sessionId, student_id: studentId, ...payload,
  }, { onConflict: "jury_session_id,student_id" });
}

export async function fetchDecisions(sessionId: string): Promise<JuryDecisionWithUser[]> {
  const { data } = await supabase.from("jury_decisions")
    .select("*, student:users(first_name,last_name,email)")
    .eq("jury_session_id", sessionId);
  return (data as JuryDecisionWithUser[]) ?? [];
}

// ── Étudiants du parcours (matricule + identité) ──
export interface ParcoursStudent {
  user_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
}

export async function fetchParcoursStudents(parcoursSlug: string): Promise<ParcoursStudent[]> {
  const { data } = await supabase.from("inscriptions")
    .select("user_id, matricule, user:users(first_name,last_name)")
    .eq("parcours_slug", parcoursSlug);
  const rows = ((data as unknown as InscriptionRow[]) ?? []);
  return rows.map((r) => ({
    user_id: r.user_id,
    matricule: r.matricule,
    first_name: r.user?.first_name ?? "",
    last_name: r.user?.last_name ?? "",
  }));
}

// ── Calcul des résultats du semestre ──
interface InscriptionRow {
  user_id: string;
  matricule: string;
  parcours_slug: string;
  user?: Pick<DBUser, "first_name" | "last_name">;
}

/**
 * Agrège, pour chaque étudiant inscrit au parcours de la session, les notes
 * des matières du semestre (délibérations par cours + tentatives d'examen
 * via effectiveScore), puis calcule la moyenne pondérée par les ECTS et
 * applique la règle de compensation.
 */
export async function computeSemesterResults(sessionId: string): Promise<SemesterResult[]> {
  const session = await fetchJurySession(sessionId);
  if (!session || !session.parcours_slug) return [];

  // Matières du semestre pour le parcours (semestre stocké 'S1'..'S6')
  const all = await fetchProgram(session.parcours_slug);
  const courses = session.semester
    ? all.filter((c) => c.semestre === `S${session.semester}`)
    : all;
  if (courses.length === 0) return [];
  const courseIds = courses.map((c) => c.id);
  const courseById = new Map<string, DBProgramCourse>(courses.map((c) => [c.id, c]));

  // Étudiants inscrits au parcours
  const { data: insData } = await supabase.from("inscriptions")
    .select("user_id, matricule, parcours_slug, user:users(first_name,last_name)")
    .eq("parcours_slug", session.parcours_slug);
  const inscriptions = ((insData as unknown as InscriptionRow[]) ?? []);
  if (inscriptions.length === 0) return [];

  // Notes de délibération par cours
  const { data: delibData } = await supabase.from("deliberations")
    .select("*").in("program_course_id", courseIds);
  const delibs = (delibData as DBDeliberation[]) ?? [];

  // Examens des matières + tentatives
  const { data: examData } = await supabase.from("exams")
    .select("*").in("program_course_id", courseIds);
  const exams = (examData as DBExam[]) ?? [];
  const examIds = exams.map((e) => e.id);
  const { data: attData } = examIds.length
    ? await supabase.from("exam_attempts").select("*").in("exam_id", examIds)
    : { data: [] as DBExamAttempt[] };
  const attempts = (attData as DBExamAttempt[]) ?? [];

  const results: SemesterResult[] = [];
  for (const ins of inscriptions) {
    // note retenue par matière : délibération prioritaire, sinon examen
    const notes = new Map<string, number>();
    for (const d of delibs) {
      if (d.student_id === ins.user_id && d.note !== null && d.note !== undefined) {
        notes.set(d.program_course_id, Number(d.note));
      }
    }
    for (const ex of exams) {
      if (notes.has(ex.program_course_id)) continue;
      const mine = attempts.filter((a) => a.exam_id === ex.id && a.student_id === ins.user_id);
      const score = effectiveScore(mine, ex.resit_rule ?? "best");
      if (score !== null) {
        const prev = notes.get(ex.program_course_id);
        notes.set(ex.program_course_id, prev !== undefined ? Math.max(prev, score) : score);
      }
    }

    let sumWeighted = 0, sumEcts = 0, below10 = 0, ectsValidated = 0;
    notes.forEach((note, courseId) => {
      const ects = courseById.get(courseId)?.ects ?? 0;
      sumWeighted += note * ects;
      sumEcts += ects;
      if (note < 10) below10 += 1; else ectsValidated += ects;
    });

    const average = sumEcts > 0 ? Math.round((sumWeighted / sumEcts) * 100) / 100 : null;

    let decision: JuryDecisionKind = "ajourne";
    let compensation = false;
    let ectsEarned = ectsValidated;
    if (average !== null && average >= 10) {
      decision = "admis";
      if (below10 > 0) { compensation = true; }
      // admis (avec ou sans compensation) → tous les ECTS des matières notées
      ectsEarned = sumEcts;
    } else if (average !== null && average >= 8) {
      decision = "rattrapage";
    }

    results.push({
      student_id: ins.user_id,
      matricule: ins.matricule,
      first_name: ins.user?.first_name ?? "",
      last_name: ins.user?.last_name ?? "",
      average,
      ects_earned: ectsEarned,
      decision,
      compensation_applied: compensation,
      courses_below_10: below10,
      courses_graded: notes.size,
    });
  }

  return results.sort((a, b) => a.last_name.localeCompare(b.last_name));
}
