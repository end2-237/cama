import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Création d'un établissement (tenant) + son premier compte administrateur.
 *
 * POST /api/org/signup
 * body: { orgName, subdomain, vertical, primaryColor?, accentColor?,
 *         adminEmail, adminPassword, adminFirstName, adminLastName }
 *
 * La clé service (SUPABASE_SERVICE_ROLE_KEY) reste strictement côté serveur.
 * Le flux est atomique du point de vue métier : si le profil admin échoue,
 * on nettoie l'org et le compte Auth créés.
 */

const VERTICALS = ["academique", "langues", "pro"] as const;
const RESERVED = new Set(["www", "app", "api", "admin", "cama", "signup", "onboarding", "dashboard", "auth", "super-admin"]);
const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

interface Body {
  orgName?: string; subdomain?: string; vertical?: string;
  primaryColor?: string; accentColor?: string;
  adminEmail?: string; adminPassword?: string;
  adminFirstName?: string; adminLastName?: string;
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  let b: Body;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const orgName = (b.orgName ?? "").trim();
  const subdomain = (b.subdomain ?? "").trim().toLowerCase();
  const vertical = (b.vertical ?? "academique").trim();
  const primaryColor = (b.primaryColor ?? "").trim() || null;
  const accentColor = (b.accentColor ?? "").trim() || null;
  const adminEmail = (b.adminEmail ?? "").trim().toLowerCase();
  const adminPassword = b.adminPassword ?? "";
  const adminFirstName = (b.adminFirstName ?? "").trim();
  const adminLastName = (b.adminLastName ?? "").trim();

  // ── Validation ──
  if (!orgName || !subdomain || !adminEmail || !adminFirstName || !adminLastName) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }
  if (!SUBDOMAIN_RE.test(subdomain) || RESERVED.has(subdomain)) {
    return NextResponse.json({ error: "Sous-domaine invalide ou réservé (a-z, 0-9, tirets)." }, { status: 400 });
  }
  if (!VERTICALS.includes(vertical as (typeof VERTICALS)[number])) {
    return NextResponse.json({ error: "Vertical inconnu." }, { status: 400 });
  }
  if (adminPassword.length < 8) {
    return NextResponse.json({ error: "Le mot de passe admin doit faire au moins 8 caractères." }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // ── Unicité du slug / sous-domaine ──
  const { data: existing } = await admin
    .from("organizations").select("id").or(`slug.eq.${subdomain},subdomain.eq.${subdomain}`).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Ce sous-domaine est déjà pris." }, { status: 409 });
  }

  // ── 1. Création de l'organisation ──
  const { data: org, error: orgErr } = await admin.from("organizations").insert({
    slug: subdomain, name: orgName, subdomain,
    primary_color: primaryColor, accent_color: accentColor,
    vertical, status: "trial",
  }).select("id, slug, subdomain").single();

  if (orgErr || !org) {
    return NextResponse.json({ error: "Impossible de créer l'établissement.", detail: orgErr?.message?.slice(0, 200) }, { status: 400 });
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
    return NextResponse.json({
      error: /already|exists|registered/i.test(msg) ? "Un compte existe déjà avec cet email." : "Impossible de créer le compte admin.",
      detail: msg.slice(0, 200),
    }, { status: 400 });
  }

  // ── 3. Profil admin dans public.users (rattaché à l'org) ──
  const { error: profErr } = await admin.from("users").insert({
    id: userId, email: adminEmail, org_id: org.id,
    first_name: adminFirstName, last_name: adminLastName,
    role: "admin", admin_level: "admin", avatar_color: "#4F46E5",
  });
  if (profErr) {
    // Rollback : compte Auth + org
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await admin.from("organizations").delete().eq("id", org.id);
    return NextResponse.json({ error: "Erreur d'enregistrement de l'administrateur.", detail: profErr.message.slice(0, 200) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orgId: org.id, slug: org.slug, subdomain: org.subdomain });
}
