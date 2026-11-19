/* ════════════════════════════════════════════════════════════
   CAMA — Couche « organisation » (multi-tenant)
   Résolution de l'établissement courant + branding.
   Étape 1 : lecture seule + fallback intégré (jfn, demo) pour
   fonctionner même avant l'application de la migration.
════════════════════════════════════════════════════════════ */

import { supabase } from "@/lib/supabase";

/** Les trois modèles de fonctionnement que l'application sait faire tourner. */
export type OrgFamily = "academique" | "langues" | "pro";
/** Catégorie d'établissement : un identifiant du catalogue org_categories
    (academique, langues, pro, bureautique, auto-ecole…). */
export type OrgVertical = string;

export interface DBCategory {
  id: string;
  label: string;
  description: string;
  family: OrgFamily;
  terms: Record<string, string>;
  features: string[];
  icon: string | null;
  active: boolean;
  sort: number;
}

/** Les trois catégories historiques : repli tant que la migration 037 n'est pas passée. */
export const CATEGORIES_DE_BASE: DBCategory[] = [
  { id: "academique", label: "Académique", description: "Université, institut, cursus & ECTS", family: "academique", terms: {}, features: [], icon: null, active: true, sort: 10 },
  { id: "langues", label: "Langues", description: "École de langues, niveaux A1→C2", family: "langues", terms: {}, features: [], icon: null, active: true, sort: 20 },
  { id: "pro", label: "Formation pro", description: "Centre pro, modules & certifications", family: "pro", terms: {}, features: [], icon: null, active: true, sort: 30 },
];

/** Le modèle de fonctionnement d'un établissement. */
export function familleDe(org: Pick<DBOrganization, "vertical" | "category">): OrgFamily {
  const f = org.category?.family ?? org.vertical;
  return f === "langues" || f === "pro" ? f : "academique";
}

/** Catalogue des catégories proposées (actives), triées. */
export async function fetchCategories(toutes = false): Promise<DBCategory[]> {
  try {
    let req = supabase.from("org_categories").select("*").order("sort");
    if (!toutes) req = req.eq("active", true);
    const { data, error } = await req;
    if (!error && data?.length) return data as DBCategory[];
  } catch { /* table absente → repli */ }
  return CATEGORIES_DE_BASE;
}

async function avecCategorie(org: DBOrganization): Promise<DBOrganization> {
  try {
    const { data } = await supabase.from("org_categories").select("*").eq("id", org.vertical).maybeSingle();
    if (data) return { ...org, category: data as DBCategory };
  } catch { /* ignore */ }
  return { ...org, category: CATEGORIES_DE_BASE.find((c) => c.id === org.vertical) ?? null };
}
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
  features: string[];              // overrides explicites de modules
  status: OrgStatus;
  created_at?: string;
  /** La catégorie chargée avec l'établissement (vocabulaire, modèle). */
  category?: DBCategory | null;
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
    plan_id: "business",
    features: ["tp_vm"],
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
    plan_id: "starter",
    features: [],
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
    if (data) return avecCategorie(data as DBOrganization);
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
    if (data) return avecCategorie(data as DBOrganization);
  } catch { /* ignore */ }
  return Object.values(FALLBACK_ORGS).find((o) => o.id === id) ?? null;
}
