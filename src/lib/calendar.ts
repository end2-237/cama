import { supabase } from "@/lib/supabase";
import type { DBCalendarEvent, CalEventType } from "@/lib/supabase";

export async function fetchCalendar(academicYear = "2025-2026"): Promise<DBCalendarEvent[]> {
  const { data } = await supabase.from("calendar_events").select("*")
    .eq("academic_year", academicYear)
    .order("semester").order("sort_date", { ascending: true, nullsFirst: false }).order("created_at");
  return (data as DBCalendarEvent[]) ?? [];
}

export async function addCalendarEvent(e: {
  date_label: string; label: string; type: CalEventType; semester: number;
  sort_date?: string | null; academic_year?: string; created_by?: string | null;
}) {
  const { data } = await supabase.from("calendar_events")
    .insert({ academic_year: "2025-2026", ...e }).select("*").single();
  return (data as DBCalendarEvent) ?? null;
}

export async function deleteCalendarEvent(id: string) {
  return supabase.from("calendar_events").delete().eq("id", id);
}

/** Jeu d'événements par défaut — pour amorcer un calendrier vide (admin). */
export const DEFAULT_CALENDAR: Omit<DBCalendarEvent, "id" | "created_at" | "created_by" | "academic_year" | "sort_date">[] = [
  { date_label: "01 sept. 2025", label: "Rentrée administrative — inscriptions & réinscriptions", type: "admin", semester: 1 },
  { date_label: "08 sept. 2025", label: "Rentrée académique — début des cours S1 / S3 / S5", type: "cours", semester: 1 },
  { date_label: "03 — 08 nov. 2025", label: "Contrôles continus n°1 (toutes filières)", type: "examen", semester: 1 },
  { date_label: "15 déc. 2025", label: "Fin des enseignements du semestre 1", type: "cours", semester: 1 },
  { date_label: "16 déc. 2025 — 04 janv. 2026", label: "Vacances de fin d'année", type: "vacances", semester: 1 },
  { date_label: "05 — 17 janv. 2026", label: "Examens semestriels S1 (sessions Safe-CAMA)", type: "examen", semester: 1 },
  { date_label: "26 janv. 2026", label: "Délibérations du jury — semestre 1", type: "jury", semester: 1 },
  { date_label: "30 janv. 2026", label: "Publication des résultats S1 (relevés certifiés QR)", type: "resultat", semester: 1 },
  { date_label: "02 févr. 2026", label: "Début des cours S2 / S4 / S6", type: "cours", semester: 2 },
  { date_label: "16 — 21 mars 2026", label: "Contrôles continus n°2", type: "examen", semester: 2 },
  { date_label: "30 mars — 05 avr. 2026", label: "Vacances de Pâques", type: "vacances", semester: 2 },
  { date_label: "08 — 20 juin 2026", label: "Examens semestriels S2 (sessions Safe-CAMA)", type: "examen", semester: 2 },
  { date_label: "25 juin 2026", label: "Délibérations du jury — semestre 2", type: "jury", semester: 2 },
  { date_label: "18 juil. 2026", label: "Cérémonie de remise des diplômes", type: "event", semester: 2 },
];

export async function seedCalendar(createdBy?: string | null) {
  const existing = await fetchCalendar();
  if (existing.length > 0) return existing;
  const rows = DEFAULT_CALENDAR.map((e) => ({ ...e, academic_year: "2025-2026", created_by: createdBy ?? null }));
  await supabase.from("calendar_events").insert(rows);
  return fetchCalendar();
}
