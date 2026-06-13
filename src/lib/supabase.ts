import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// Types alignés sur le schéma DB
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
  created_at: string;
}

export interface DBCourse {
  id: string;
  code: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  ue_id: string;
  teacher_id: string;
  semester: number;
  is_published: boolean;
  has_ai: boolean;
  objectives: string[];
  competences: string[];
  prerequis: string | null;
  audience: string | null;
  evaluation: string | null;
  volume: string | null;
  difficulte: string | null;
  created_at: string;
}

export interface DBSession {
  id: string;
  course_id: string;
  title: string;
  day: string;
  start: string;
  end: string;
  kind: SessionKind;
  room: string | null;
  modes: CycleMode[];
  proposed_by: string;
  status: SessionStatus;
  semester: number;
}

export interface DBSlotRequest {
  id: string;
  user_id: string;
  day: string;
  start: string;
  end: string;
  ue: string;
  note: string | null;
  status: SlotStatus;
}

export interface DBStudentSetting {
  id: string;
  user_id: string;
  mode: CycleMode;
  deadline_weeks: number;
}

export interface DBCalendarEvent {
  id: string;
  date: string;
  label: string;
  type: string;
  semester: number;
}
