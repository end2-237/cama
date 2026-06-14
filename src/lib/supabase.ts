import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// Types alignés sur le schéma DB (voir supabase/schema.sql)
export type UserRole = "etudiant" | "enseignant" | "admin" | "jury";
export type CycleMode = "online" | "hybride" | "presentiel";
export type SessionStatus = "propose" | "valide" | "rejete";
export type SessionKind = "campus" | "live" | "async" | "examen";
export type SlotStatus = "propose" | "valide" | "rejete";

export interface DBUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_color: string;
  school: string | null;
  level: string | null;
  phone: string | null;
  phone_prefix: string | null;
  student_card: string | null;
  created_at: string;
}

export interface DBInscription {
  id: string;
  user_id: string;
  matricule: string;
  parcours_slug: string;
  parcours_title: string;
  school: string;
  cycle_type: string;
  level: string;
  mode: CycleMode;
  campus: string;
  academic_year: string;
  semester: number;
  total_ects: number;
  status: "en_attente" | "validee" | "rejetee";
  enrolled_at: string;
}

// Programme académique : 1 matière (filière × année × semestre)
// + affectation enseignant (admin) + contenu (enseignant)
export interface DBProgramCourse {
  id: string;
  parcours_slug: string;
  parcours_title: string;
  annee_niveau: string;          // L1..M2
  semestre: string;              // S1..S6
  code: string;
  title: string;
  ects: number;
  hours: number;                 // volume horaire
  modalites: string[];           // video, pdf, plateforme, live
  evaluation: string | null;
  ordre: number;
  teacher_id: string | null;     // assigné par l'admin
  academic_year: string | null;
  description: string | null;
  objectives: string[];
  competences: string[];
  prerequis: string | null;
  audience: string | null;
  difficulte: string | null;
  published: boolean;
  prof_ia: boolean;
  created_at: string;
}

export interface DBChapter {
  id: string;
  program_course_id: string;
  ordre: number;
  title: string;
  pdf: { name: string; sizeMo: number; pages: number } | null;
  video: { title: string; durationMin: number; transcript: string; sizeMo: number } | null;
  natif: { blocks: unknown[] } | null;
  live_id: string | null;
  created_at: string;
}

export interface DBSession {
  id: string;
  program_course_id: string;
  title: string;
  day: string | null;
  start_time: string | null;
  end_time: string | null;
  kind: SessionKind;
  room: string | null;
  modes: CycleMode[];
  academic_year: string | null;
  semestre: string | null;
  week_start: string | null;
  status: SessionStatus;
  proposed_by: string | null;
  created_at: string;
}

export interface DBChapterProgress {
  student_id: string;
  chapter_id: string;
  done_at: string;
}
