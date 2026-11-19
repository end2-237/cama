import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ════════════════════════════════════════════════════════════
   Création d'un établissement (tenant) + de son premier admin.
   Partagée par l'inscription publique (/api/org/signup) et par
   l'administration de la plateforme (/api/platform/orgs).
   La clé service ne quitte jamais le serveur.
════════════════════════════════════════════════════════════ */

/** Repli tant que le catalogue (migration 037) n'existe pas. */
export const VERTICALS = ["academique", "langues", "pro"] as const;

/**
 * La catégorie existe-t-elle (et, pour l'inscription publique, est-elle
 * proposée) ? Lit le catalogue org_categories ; avant la migration 037,
 * retombe sur les trois catégories historiques.
 */
export async function categorieValide(admin: SupabaseClient, id: string, seulementActives = true): Promise<boolean> {
  const { data, error } = await admin.from("org_categories").select("id, active").eq("id", id).maybeSingle();
  if (error) return (VERTICALS as readonly string[]).includes(id);
  return Boolean(data && (data.active || !seulementActives));
}
export const STATUTS = ["trial", "active", "suspended"] as const;
const RESERVED = new Set(["www", "app", "api", "admin", "cama", "signup", "onboarding", "dashboard", "auth", "super-admin", "plateforme"]);
const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;
const COULEUR_RE = /^#[0-9a-f]{6}$/i;

export function clientService(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export interface NouvelEtablissement {
  orgName?: string; subdomain?: string; vertical?: string;
  primaryColor?: string; accentColor?: string;
  planId?: string; status?: string;
  adminEmail?: string; adminPassword?: string;
  adminFirstName?: string; adminLastName?: string;
}

export type Resultat =
  | { ok: true; orgId: string; slug: string; subdomain: string; motDePasseProvisoire?: string }
  | { ok: false; status: number; error: string; detail?: string };

/**
 * @param options.genererMotDePasse  plateforme : sans mot de passe saisi, on en
 *        génère un, rendu une seule fois pour être transmis à l'admin.
 * @param options.statutsPermis      l'inscription publique est toujours en essai.
 */
export async function creerEtablissement(
  admin: SupabaseClient,
  b: NouvelEtablissement,
  options: { genererMotDePasse?: boolean; statutsPermis?: readonly string[]; categoriesInactives?: boolean } = {},
): Promise<Resultat> {
  const orgName = (b.orgName ?? "").trim().slice(0, 120);
  const subdomain = (b.subdomain ?? "").trim().toLowerCase();
  const vertical = (b.vertical ?? "academique").trim();
  const primaryColor = COULEUR_RE.test((b.primaryColor ?? "").trim()) ? b.primaryColor!.trim() : null;
  const accentColor = COULEUR_RE.test((b.accentColor ?? "").trim()) ? b.accentColor!.trim() : null;
  const statutsPermis = options.statutsPermis ?? ["trial"];
  const status = statutsPermis.includes((b.status ?? "").trim()) ? b.status!.trim() : "trial";
  const adminEmail = (b.adminEmail ?? "").trim().toLowerCase();
  const adminFirstName = (b.adminFirstName ?? "").trim().slice(0, 80);
  const adminLastName = (b.adminLastName ?? "").trim().slice(0, 80);
  let adminPassword = b.adminPassword ?? "";
  let motDePasseProvisoire: string | undefined;
  if (!adminPassword && options.genererMotDePasse) {
    adminPassword = motDePasseProvisoire = randomBytes(9).toString("base64url");
  }

  // ── Validation ──
  if (!orgName || !subdomain || !adminEmail || !adminFirstName || !adminLastName) {
    return { ok: false, status: 400, error: "Champs obligatoires manquants." };
  }
  if (!SUBDOMAIN_RE.test(subdomain) || RESERVED.has(subdomain)) {
    return { ok: false, status: 400, error: "Sous-domaine invalide ou réservé (a-z, 0-9, tirets)." };
  }
  if (!(await categorieValide(admin, vertical, !options.categoriesInactives))) {
    return { ok: false, status: 400, error: "Catégorie d'établissement inconnue." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    return { ok: false, status: 400, error: "Email de l'administrateur invalide." };
  }
  if (adminPassword.length < 8) {
    return { ok: false, status: 400, error: "Le mot de passe admin doit faire au moins 8 caractères." };
  }

  // Plan : seulement un plan du catalogue.
  let planId: string | null = null;
  if (b.planId) {
    const { data: plan } = await admin.from("plans").select("id").eq("id", b.planId).maybeSingle();
    if (!plan) return { ok: false, status: 400, error: "Plan inconnu." };
    planId = plan.id;
  }

  // ── Unicité du slug / sous-domaine ──
  const { data: existing } = await admin
    .from("organizations").select("id").or(`slug.eq.${subdomain},subdomain.eq.${subdomain}`).maybeSingle();
  if (existing) return { ok: false, status: 409, error: "Ce sous-domaine est déjà pris." };

  // ── 1. Organisation ──
  const { data: org, error: orgErr } = await admin.from("organizations").insert({
    slug: subdomain, name: orgName, subdomain,
    primary_color: primaryColor, accent_color: accentColor,
    vertical, status, ...(planId ? { plan_id: planId } : {}),
  }).select("id, slug, subdomain").single();
  if (orgErr || !org) {
    return { ok: false, status: 400, error: "Impossible de créer l'établissement.", detail: orgErr?.message?.slice(0, 200) };
  }

  // ── 2. Compte Auth de l'admin ──
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: adminEmail, password: adminPassword, email_confirm: true,
    user_metadata: { first_name: adminFirstName, last_name: adminLastName, role: "admin" },
  });
  const userId = created?.user?.id ?? "";
  if (createErr || !userId) {
    await admin.from("organizations").delete().eq("id", org.id);
    const msg = createErr?.message ?? "";
    return {
      ok: false, status: 400,
      error: /already|exists|registered/i.test(msg) ? "Un compte existe déjà avec cet email." : "Impossible de créer le compte admin.",
      detail: msg.slice(0, 200),
    };
  }

  // ── 3. Profil admin rattaché à l'org ──
  const { error: profErr } = await admin.from("users").insert({
    id: userId, email: adminEmail, org_id: org.id,
    first_name: adminFirstName, last_name: adminLastName,
    role: "admin", admin_level: "admin", avatar_color: "#4F46E5",
  });
  if (profErr) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await admin.from("organizations").delete().eq("id", org.id);
    return { ok: false, status: 500, error: "Erreur d'enregistrement de l'administrateur.", detail: profErr.message.slice(0, 200) };
  }

  return { ok: true, orgId: org.id, slug: org.slug, subdomain: org.subdomain, motDePasseProvisoire };
}

/**
 * L'appelant est-il de l'équipe plateforme ? Le jeton de session Supabase
 * (Authorization: Bearer …) est vérifié par Supabase lui-même — on ne fait
 * jamais confiance à un identifiant envoyé dans le corps de la requête.
 */
export async function adminPlateforme(admin: SupabaseClient, req: Request): Promise<{ id: string; email: string } | null> {
  const jeton = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jeton) return null;
  const { data } = await admin.auth.getUser(jeton);
  const id = data.user?.id;
  if (!id) return null;
  const { data: u } = await admin.from("users").select("id, email, is_platform_admin").eq("id", id).maybeSingle();
  return u?.is_platform_admin ? { id: u.id, email: u.email } : null;
}
