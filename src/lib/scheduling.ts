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
