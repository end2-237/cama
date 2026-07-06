/* ════════════════════════════════════════════════════════════
   CAMA — Constantes & helpers de planification
════════════════════════════════════════════════════════════ */
import type { CycleMode, SessionKind, DBSession, DBStudentSetting } from "./db";

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;

export interface CycleModeMeta {
  id: CycleMode;
  label: string;
  short: string;
  color: string;       // hex
  desc: string;
  canPropose: boolean; // peut proposer des créneaux ?
  proposeScope: string;// portée des propositions
}

export const CYCLE_MODES: CycleModeMeta[] = [
  {
    id: "online", label: "100% en ligne", short: "En ligne", color: "#4F46E5",
    desc: "Intégralement sur la plateforme CAMA — lives synchrones et ressources asynchrones.",
    canPropose: true,
    proposeScope: "Vous proposez librement vos créneaux ; ils sont validés par l'administration.",
  },
  {
    id: "hybride", label: "Hybride", short: "Hybride", color: "#D97706",
    desc: "Campus certains jours + plateforme CAMA le reste de la semaine.",
    canPropose: true,
    proposeScope: "Vous proposez des créneaux uniquement pour vos journées en ligne, dans la limite du délai de progression fixé.",
  },
  {
    id: "presentiel", label: "Présentiel", short: "Présentiel", color: "#16a34a",
    desc: "Tous les cours sur le campus de Yaoundé, aux horaires fixés par l'administration.",
    canPropose: false,
    proposeScope: "Les horaires sont fixés par l'administration — aucune proposition de créneau.",
  },
];

export function modeMeta(mode: CycleMode): CycleModeMeta {
  return CYCLE_MODES.find((m) => m.id === mode) || CYCLE_MODES[0];
}

export const SESSION_KINDS: Record<SessionKind, { label: string; color: string }> = {
  campus: { label: "Campus",     color: "text-green-700 bg-green-50 border-green-200" },
  live:   { label: "Live CAMA",  color: "text-red-600 bg-red-50 border-red-200" },
  async:  { label: "Asynchrone", color: "text-cama bg-cama/5 border-cama/20" },
  examen: { label: "Évaluation", color: "text-purple-700 bg-purple-50 border-purple-200" },
};

/** Mode d'inscription d'un étudiant (défaut : présentiel). */
export function studentMode(settings: DBStudentSetting[], studentId: string): CycleMode {
  return settings.find((s) => s.studentId === studentId)?.mode || "presentiel";
}

/* ════════════════════════════════════════════════════════════
   Salles & réservations (chantier E2)
════════════════════════════════════════════════════════════ */
import { supabase } from "./supabase";

export interface DBRoom {
  id: string;
  name: string;
  capacity: number | null;
  kind: string;              // 'salle' | 'amphi' | 'labo'
  campus: string | null;
  active: boolean;
  created_at: string;
}

export interface DBRoomBooking {
  id: string;
  room_id: string;
  program_course_id: string | null;
  title: string | null;
  day: number | null;        // 0=lundi..5=samedi (hebdo), null si ponctuel
  starts_at: string | null;  // ponctuel
  ends_at: string | null;    // ponctuel
  start_time: string | null; // "HH:MM" (hebdo)
  end_time: string | null;   // "HH:MM" (hebdo)
  weekly: boolean;
  booked_by: string | null;
  created_at: string;
}

export async function fetchRooms(): Promise<DBRoom[]> {
  const { data } = await supabase.from("rooms").select("*").order("name");
  return (data as DBRoom[]) ?? [];
}

export async function addRoom(room: {
  name: string; capacity?: number | null; kind?: string; campus?: string | null;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from("rooms").insert({
    name: room.name, capacity: room.capacity ?? null,
    kind: room.kind ?? "salle", campus: room.campus ?? null,
  });
  return { error: error?.message ?? null };
}

export async function updateRoom(
  id: string,
  patch: Partial<Pick<DBRoom, "name" | "capacity" | "kind" | "campus" | "active">>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("rooms").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}

export async function setRoomActive(id: string, active: boolean) {
  return updateRoom(id, { active });
}

export async function fetchBookings(roomId?: string): Promise<DBRoomBooking[]> {
  let q = supabase.from("room_bookings").select("*").order("created_at");
  if (roomId) q = q.eq("room_id", roomId);
  const { data } = await q;
  return (data as DBRoomBooking[]) ?? [];
}

export async function createBooking(b: {
  room_id: string; program_course_id?: string | null; title?: string | null;
  day?: number | null; starts_at?: string | null; ends_at?: string | null;
  start_time?: string | null; end_time?: string | null;
  weekly?: boolean; booked_by?: string | null;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from("room_bookings").insert({
    room_id: b.room_id, program_course_id: b.program_course_id ?? null,
    title: b.title ?? null, day: b.day ?? null,
    starts_at: b.starts_at ?? null, ends_at: b.ends_at ?? null,
    start_time: b.start_time ?? null, end_time: b.end_time ?? null,
    weekly: b.weekly ?? true, booked_by: b.booked_by ?? null,
  });
  return { error: error?.message ?? null };
}

export async function deleteBooking(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("room_bookings").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/** "HH:MM" → minutes depuis minuit (NaN si invalide). */
function toMinutes(t: string | null | undefined): number {
  if (!t) return NaN;
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
}

/** Chevauchement strict de deux intervalles [a1,a2) / [b1,b2). */
function overlaps(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

/**
 * Réservations existantes en conflit avec `booking` (même salle).
 * — hebdo : même jour et plages "HH:MM" qui se chevauchent ;
 * — ponctuel : intervalles starts_at/ends_at qui se chevauchent.
 */
export function conflictsFor(
  booking: Pick<DBRoomBooking, "room_id" | "weekly" | "day" | "start_time" | "end_time" | "starts_at" | "ends_at"> & { id?: string },
  existing: DBRoomBooking[],
): DBRoomBooking[] {
  return existing.filter((e) => {
    if (e.room_id !== booking.room_id) return false;
    if (booking.id && e.id === booking.id) return false;
    if (booking.weekly && e.weekly) {
      if (booking.day == null || e.day == null || booking.day !== e.day) return false;
      const a1 = toMinutes(booking.start_time), a2 = toMinutes(booking.end_time);
      const b1 = toMinutes(e.start_time), b2 = toMinutes(e.end_time);
      if ([a1, a2, b1, b2].some((n) => isNaN(n))) return false;
      return overlaps(a1, a2, b1, b2);
    }
    if (!booking.weekly && !e.weekly) {
      if (!booking.starts_at || !booking.ends_at || !e.starts_at || !e.ends_at) return false;
      return overlaps(
        new Date(booking.starts_at).getTime(), new Date(booking.ends_at).getTime(),
        new Date(e.starts_at).getTime(), new Date(e.ends_at).getTime(),
      );
    }
    return false; // hebdo vs ponctuel : non comparés
  });
}

/** Salles actives libres sur un créneau hebdo donné. */
export function findFreeRooms(
  day: number, startTime: string, endTime: string,
  rooms: DBRoom[], bookings: DBRoomBooking[],
): DBRoom[] {
  return rooms.filter((r) => {
    if (!r.active) return false;
    const probe = {
      room_id: r.id, weekly: true, day,
      start_time: startTime, end_time: endTime,
      starts_at: null, ends_at: null,
    };
    return conflictsFor(probe, bookings).length === 0;
  });
}

/** Séances validées s'appliquant à un mode donné, groupées par jour. */
export function weeklyForMode(sessions: DBSession[], mode: CycleMode): Record<string, DBSession[]> {
  const out: Record<string, DBSession[]> = {};
  for (const d of DAYS) out[d] = [];
  for (const s of sessions) {
    if (s.status !== "valide") continue;
    if (!s.modes.includes(mode)) continue;
    if (out[s.day]) out[s.day].push(s);
  }
  return out;
}
