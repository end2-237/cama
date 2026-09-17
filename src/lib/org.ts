/* ════════════════════════════════════════════════════════════
   CAMA — Couche « organisation » (multi-tenant)
   Résolution de l'établissement courant + branding.
   Étape 1 : lecture seule + fallback intégré (jfn, demo) pour
   fonctionner même avant l'application de la migration.
════════════════════════════════════════════════════════════ */

import { supabase } from "@/lib/supabase";

export type OrgVertical = "academique" | "langues" | "pro";
export type OrgStatus = "active" | "trial" | "suspended";

export interface DBOrganization {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;   // couleur de marque (hex) — pilote le thème
  accent_color: string | null;
  locale: string;                  // "fr" | "en" ...
  subdomain: string;               // institut-x
  custom_domain: string | null;
  vertical: OrgVertical;
  plan_id: string | null;
  status: OrgStatus;
  created_at?: string;
}

/* Fallback local : garantit un rendu cohérent tant que la table n'est pas
   peuplée (ou hors-ligne). Ce sont les 2 tenants de démonstration. */
export const FALLBACK_ORGS: Record<string, DBOrganization> = {
  jfn: {
    id: "00000000-0000-0000-0000-000000000001",
    slug: "jfn",
    name: "Institut JFN",
    logo_url: "/campus/jfn-hui-logo.png",
    primary_color: "#4F46E5",
    accent_color: "#F59E0B",
    locale: "fr",
    subdomain: "jfn",
    custom_domain: null,
    vertical: "academique",
    plan_id: null,
    status: "active",
  },
  demo: {
    id: "00000000-0000-0000-0000-000000000002",
    slug: "demo",
    name: "LinguaPro Academy",
    logo_url: null,
    primary_color: "#0EA5A4",   // teal : identité nettement différente de JFN
    accent_color: "#F97316",
    locale: "fr",
    subdomain: "demo",
    custom_domain: null,
    vertical: "langues",
    plan_id: null,
    status: "trial",
  },
};

export const DEFAULT_ORG_SLUG = "jfn";

/** Détermine le slug du tenant courant (sous-domaine, ou ?org= pour tester). */
export function resolveOrgSlug(): string {
  if (typeof window === "undefined") return DEFAULT_ORG_SLUG;
  // 1) override explicite ?org=slug (pratique en dev / preview)
  const q = new URLSearchParams(window.location.search).get("org");
  if (q) {
    try { localStorage.setItem("cama_org", q); } catch { /* ignore */ }
    return q;
  }
  // 2) sous-domaine institut-x.cama.app (ignore www, apex, previews connus)
  const host = window.location.hostname;
  const parts = host.split(".");
  const IGNORE = new Set(["www", "app", "localhost", "vercel", "cama"]);
  if (parts.length >= 3 && !IGNORE.has(parts[0])) return parts[0];
  // 3) dernier choix mémorisé (dev)
  try {
    const saved = localStorage.getItem("cama_org");
    if (saved) return saved;
  } catch { /* ignore */ }
  return DEFAULT_ORG_SLUG;
}

/** Charge une organisation par slug (DB, sinon fallback intégré). */
export async function fetchOrgBySlug(slug: string): Promise<DBOrganization> {
  try {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (data) return data as DBOrganization;
  } catch { /* DB absente/hors-ligne → fallback */ }
  return FALLBACK_ORGS[slug] ?? FALLBACK_ORGS[DEFAULT_ORG_SLUG];
}

export async function fetchOrgById(id: string): Promise<DBOrganization | null> {
  try {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) return data as DBOrganization;
  } catch { /* ignore */ }
  return Object.values(FALLBACK_ORGS).find((o) => o.id === id) ?? null;
}
