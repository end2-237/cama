import { supabase } from "@/lib/supabase";

/* ════════════════════════════════════════════════════════════
   STRUCTURE ACADÉMIQUE — années, semestres, ledger ECTS
   Progression vers le diplôme : 180 ECTS (licence).
════════════════════════════════════════════════════════════ */

export const DEGREE_TARGET_ECTS = 180;

export interface DBAcademicYear {
  id: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
  created_at: string;
}

export interface DBSemester {
  id: string;
  academic_year_id: string | null;
  number: number;
  label: string | null;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
}

export interface DBEctsEntry {
  id: string;
  student_id: string;
  program_course_id: string | null;
  academic_year: string | null;
  semester: number | null;
  ects: number;
  obtained: boolean;
  origin: string | null;
  validated_at: string | null;
  validated_by: string | null;
}

// ── Années académiques ──
export async function fetchYears(): Promise<DBAcademicYear[]> {
  const { data } = await supabase.from("academic_years").select("*")
    .order("label", { ascending: false });
  return (data as DBAcademicYear[]) ?? [];
}

export async function fetchSemesters(yearId?: string): Promise<DBSemester[]> {
  let q = supabase.from("semesters").select("*").order("number");
  if (yearId) q = q.eq("academic_year_id", yearId);
  const { data } = await q;
  return (data as DBSemester[]) ?? [];
}

export async function currentYear(): Promise<DBAcademicYear | null> {
  const { data } = await supabase.from("academic_years").select("*")
    .eq("is_current", true).limit(1).maybeSingle();
  return (data as DBAcademicYear) ?? null;
}

export async function currentSemester(): Promise<DBSemester | null> {
  const { data } = await supabase.from("semesters").select("*")
    .eq("is_current", true).limit(1).maybeSingle();
  return (data as DBSemester) ?? null;
}

export async function createYear(label: string, startsOn?: string | null, endsOn?: string | null) {
  return supabase.from("academic_years").insert({
    label: label.trim(), starts_on: startsOn || null, ends_on: endsOn || null,
  });
}

export async function createSemester(
  academicYearId: string, number: number, label?: string | null,
  startsOn?: string | null, endsOn?: string | null,
) {
  return supabase.from("semesters").insert({
    academic_year_id: academicYearId, number,
    label: label?.trim() || `Semestre ${number}`,
    starts_on: startsOn || null, ends_on: endsOn || null,
  });
}

/** Dé-flague toutes les années puis marque celle-ci comme courante. */
export async function setCurrentYear(id: string) {
  await supabase.from("academic_years").update({ is_current: false }).eq("is_current", true);
  return supabase.from("academic_years").update({ is_current: true }).eq("id", id);
}

/** Dé-flague tous les semestres puis marque celui-ci comme courant. */
export async function setCurrentSemester(id: string) {
  await supabase.from("semesters").update({ is_current: false }).eq("is_current", true);
  return supabase.from("semesters").update({ is_current: true }).eq("id", id);
}

// ── Ledger ECTS ──
/** Upsert d'une ligne du ledger sur (student_id, program_course_id). */
export async function creditStudent(
  studentId: string,
  programCourseId: string,
  ects: number,
  obtained: boolean,
  origin: string,
  validatedBy: string | null,
  year?: string | null,
  semester?: number | null,
) {
  return supabase.from("ects_ledger").upsert({
    student_id: studentId,
    program_course_id: programCourseId,
    ects, obtained, origin,
    validated_by: validatedBy,
    validated_at: new Date().toISOString(),
    academic_year: year ?? null,
    semester: semester ?? null,
  }, { onConflict: "student_id,program_course_id" });
}

export async function fetchLedger(studentId: string): Promise<DBEctsEntry[]> {
  const { data } = await supabase.from("ects_ledger").select("*")
    .eq("student_id", studentId).order("validated_at", { ascending: false });
  return (data as DBEctsEntry[]) ?? [];
}

/** Total des ECTS effectivement obtenus par l'étudiant. */
export async function ectsTotal(studentId: string): Promise<number> {
  const ledger = await fetchLedger(studentId);
  return ledger.filter((e) => e.obtained).reduce((a, e) => a + e.ects, 0);
}

/** ECTS obtenus pour une année académique + semestre donnés. */
export async function ectsForSemester(studentId: string, year: string, semester: number): Promise<number> {
  const { data } = await supabase.from("ects_ledger").select("ects, obtained")
    .eq("student_id", studentId).eq("academic_year", year).eq("semester", semester);
  return ((data as Pick<DBEctsEntry, "ects" | "obtained">[]) ?? [])
    .filter((e) => e.obtained).reduce((a, e) => a + e.ects, 0);
}

/** Progression vers le diplôme (180 ECTS). */
export async function degreeProgress(studentId: string): Promise<{ earned: number; target: number; pct: number }> {
  const earned = await ectsTotal(studentId);
  return {
    earned,
    target: DEGREE_TARGET_ECTS,
    pct: Math.min(100, Math.round((earned / DEGREE_TARGET_ECTS) * 100)),
  };
}

/* ════════════════════════════════════════════════════════════
   PROMOTIONS & COHORTES — regrouper les étudiants d'une
   filière + niveau + année (ex. « L3 GL 2025-2026 »).
════════════════════════════════════════════════════════════ */

export interface DBCohort {
  id: string;
  label: string;
  parcours_slug: string | null;
  parcours_title: string | null;
  academic_year: string | null;
  level: string | null;
  created_at: string;
  created_by: string | null;
}

export interface DBCohortMember {
  id: string;
  cohort_id: string;
  student_id: string;
  added_at: string;
}

export async function fetchCohorts(): Promise<DBCohort[]> {
  const { data } = await supabase.from("cohorts").select("*")
    .order("created_at", { ascending: false });
  return (data as DBCohort[]) ?? [];
}

export async function createCohort(payload: {
  label: string;
  parcoursSlug?: string | null;
  parcoursTitle?: string | null;
  academicYear?: string | null;
  level?: string | null;
  createdBy?: string | null;
}) {
  return supabase.from("cohorts").insert({
    label: payload.label.trim(),
    parcours_slug: payload.parcoursSlug ?? null,
    parcours_title: payload.parcoursTitle ?? null,
    academic_year: payload.academicYear ?? null,
    level: payload.level ?? null,
    created_by: payload.createdBy ?? null,
  }).select("*").maybeSingle();
}

export async function deleteCohort(id: string) {
  return supabase.from("cohorts").delete().eq("id", id);
}

export async function fetchCohortMembers(cohortId: string): Promise<DBCohortMember[]> {
  const { data } = await supabase.from("cohort_members").select("*")
    .eq("cohort_id", cohortId).order("added_at", { ascending: false });
  return (data as DBCohortMember[]) ?? [];
}

export async function addCohortMember(cohortId: string, studentId: string) {
  return supabase.from("cohort_members").upsert(
    { cohort_id: cohortId, student_id: studentId },
    { onConflict: "cohort_id,student_id", ignoreDuplicates: true });
}

export async function removeCohortMember(cohortId: string, studentId: string) {
  return supabase.from("cohort_members").delete()
    .eq("cohort_id", cohortId).eq("student_id", studentId);
}

/** Nombre de membres par cohorte : { [cohortId]: count }. */
export async function cohortMembersCount(): Promise<Record<string, number>> {
  const { data } = await supabase.from("cohort_members").select("cohort_id");
  const rows = (data as { cohort_id: string }[]) ?? [];
  const map: Record<string, number> = {};
  for (const r of rows) map[r.cohort_id] = (map[r.cohort_id] ?? 0) + 1;
  return map;
}
