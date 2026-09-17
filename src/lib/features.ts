/* ════════════════════════════════════════════════════════════
   CAMA — Entitlements / modules à la carte par établissement.
   La disponibilité d'un module dépend du vertical + du palier de plan,
   avec possibilité d'override explicite par org (colonne features[]).
════════════════════════════════════════════════════════════ */

import type { DBOrganization } from "@/lib/org";

export type FeatureKey =
  | "courses" | "exams" | "messaging" | "library" | "forum"
  | "prof_ia" | "agent_admin" | "jury" | "scolarite" | "bulletins"
  | "certifications" | "presences" | "tp_vm";

// Modules disponibles pour tout le monde (socle commun).
const BASE: FeatureKey[] = [
  "courses", "exams", "messaging", "library", "forum",
  "prof_ia", "agent_admin", "jury", "scolarite", "bulletins",
  "certifications", "presences",
];

const PREMIUM_PLANS = new Set(["business", "enterprise"]);

/** TP/VM : réservé au vertical pro/IT ET à un palier Business/Enterprise. */
function tpVmEligible(org: DBOrganization): boolean {
  const plan = (org.plan_id ?? "").toLowerCase();
  return org.vertical === "pro" && PREMIUM_PLANS.has(plan);
}

/** Ensemble effectif des modules actifs pour un établissement. */
export function orgFeatures(org: DBOrganization): Set<FeatureKey> {
  const set = new Set<FeatureKey>(BASE);
  if (tpVmEligible(org)) set.add("tp_vm");
  // Overrides explicites (ex. JFN académique qui utilise déjà les TP).
  for (const f of org.features ?? []) set.add(f as FeatureKey);
  return set;
}

export function hasFeature(org: DBOrganization, key: FeatureKey): boolean {
  return orgFeatures(org).has(key);
}
