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

// ── Examens & évaluations (Phase 3) ──
export type ExamStatus = "planifie" | "ouvert" | "termine";
export type QuestionType = "qcm" | "ouverte";
export type AttemptStatus = "encours" | "soumis" | "corrige";
export type DelibStatus = "en_delib" | "valide" | "rejete";

export interface DBExam {
  id: string;
  program_course_id: string;
  title: string;
  duration_min: number;
  status: ExamStatus;
  scheduled_at: string | null;
  shuffle: boolean;
  created_by: string | null;
  created_at: string;
}

export interface DBExamQuestion {
  id: string;
  exam_id: string;
  ordre: number;
  type: QuestionType;
  text: string;
  options: string[];
  correct_index: number | null;
  points: number;
}

export interface DBExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  answers: Record<string, number | string>;
  score: number | null;
  score_max: number | null;
  feedback: string | null;
  alerts: { time: string; type: string; detail: string }[];
}

export interface DBDeliberation {
  id: string;
  program_course_id: string;
  student_id: string;
  attempt_id: string | null;
  note: number | null;
  credits: number;
  status: DelibStatus;
  validated_by: string | null;
  validated_at: string | null;
  comment: string | null;
  created_at: string;
}

// Machine Linux distante : expose un terminal web (ttyd/wetty/guacamole)
// accessible en HTTPS. CAMA embarque ce terminal pour s'y connecter.
export interface DBRemoteMachine {
  id: string;
  name: string;
  os: string;
  kind: "ttyd" | "wetty" | "guacamole" | "vnc" | "other";
  web_url: string;          // URL HTTPS du terminal web
  description: string | null;
  status: "up" | "down" | "unknown";
  added_by: string | null;
  created_at: string;
}
