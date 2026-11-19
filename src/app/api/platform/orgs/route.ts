import { NextResponse } from "next/server";
import {
  STATUTS, adminPlateforme, categorieValide, clientService, creerEtablissement, type NouvelEtablissement,
} from "@/lib/server/organizations";

export const dynamic = "force-dynamic";

/**
 * Administration de la plateforme : les établissements (tenants).
 * Réservé à l'équipe CAMA (users.is_platform_admin, migration 036),
 * vérifié à partir du jeton de session Supabase.
 *
 * GET   /api/platform/orgs            → établissements, comptes, plans
 * POST  /api/platform/orgs            → crée un établissement + son admin
 * PATCH /api/platform/orgs            → { id, status?, planId?, vertical? }
 */

async function garde(req: Request) {
  const admin = clientService();
  if (!admin) return { erreur: NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 }) };
  const moi = await adminPlateforme(admin, req);
  if (!moi) return { erreur: NextResponse.json({ error: "Réservé à l'équipe de la plateforme." }, { status: 403 }) };
  return { admin, moi };
}

export async function GET(req: Request) {
  const g = await garde(req);
  if ("erreur" in g) return g.erreur;
  const { admin } = g;

  const [orgs, plans, membres, categories] = await Promise.all([
    admin.from("organizations")
      .select("id, slug, name, subdomain, custom_domain, vertical, plan_id, status, primary_color, logo_url, created_at")
      .order("created_at", { ascending: false }),
    admin.from("plans").select("id, name, price_fcfa, max_students").order("sort"),
    admin.from("users").select("org_id, role, email, first_name, last_name").not("org_id", "is", null).limit(100000),
    admin.from("org_categories").select("*").order("sort"),
  ]);
  if (orgs.error) return NextResponse.json({ error: "Lecture impossible.", detail: orgs.error.message.slice(0, 200) }, { status: 500 });

  // Comptes par établissement, et ses administrateurs.
  const stats = new Map<string, { etudiants: number; enseignants: number; admins: { email: string; nom: string }[] }>();
  for (const u of membres.data ?? []) {
    const s = stats.get(u.org_id) ?? { etudiants: 0, enseignants: 0, admins: [] };
    if (u.role === "etudiant") s.etudiants++;
    else if (u.role === "enseignant") s.enseignants++;
    else if (u.role === "admin") s.admins.push({ email: u.email, nom: `${u.first_name} ${u.last_name}`.trim() });
    stats.set(u.org_id, s);
  }

  return NextResponse.json({
    plans: plans.data ?? [],
    // Avant la migration 037, le catalogue n'existe pas : null → l'écran garde les trois historiques.
    categories: categories.error ? null : categories.data ?? [],
    etablissements: (orgs.data ?? []).map((o) => ({
      ...o,
      ...(stats.get(o.id) ?? { etudiants: 0, enseignants: 0, admins: [] }),
    })),
  });
}

export async function POST(req: Request) {
  const g = await garde(req);
  if ("erreur" in g) return g.erreur;

  let b: NouvelEtablissement;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const r = await creerEtablissement(g.admin, b, { genererMotDePasse: true, statutsPermis: ["trial", "active"], categoriesInactives: true });
  if (!r.ok) return NextResponse.json({ error: r.error, detail: r.detail }, { status: r.status });

  // Trace dans le journal de l'établissement créé.
  await g.admin.from("audit_log").insert({
    org_id: r.orgId, actor_id: g.moi.id, actor_name: g.moi.email,
    action: "platform.org.create", entity: `org:${r.orgId}`, detail: `Établissement ${r.slug} créé par la plateforme`,
  }).then(() => {}, () => {});

  return NextResponse.json(r);
}

export async function PATCH(req: Request) {
  const g = await garde(req);
  if ("erreur" in g) return g.erreur;

  let b: { id?: string; status?: string; planId?: string | null; vertical?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  if (!b.id) return NextResponse.json({ error: "Établissement manquant." }, { status: 400 });

  const maj: Record<string, string | null> = {};
  if (b.status !== undefined) {
    if (!STATUTS.includes(b.status as (typeof STATUTS)[number])) return NextResponse.json({ error: "Statut inconnu." }, { status: 400 });
    maj.status = b.status;
  }
  if (b.planId !== undefined) {
    if (b.planId) {
      const { data: plan } = await g.admin.from("plans").select("id").eq("id", b.planId).maybeSingle();
      if (!plan) return NextResponse.json({ error: "Plan inconnu." }, { status: 400 });
    }
    maj.plan_id = b.planId || null;
  }
  if (b.vertical !== undefined) {
    // Changer l'orientation : n'importe quelle catégorie du catalogue, même retirée de l'inscription.
    if (!(await categorieValide(g.admin, b.vertical, false))) return NextResponse.json({ error: "Catégorie inconnue." }, { status: 400 });
    maj.vertical = b.vertical;
  }
  if (!Object.keys(maj).length) return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });

  const { error } = await g.admin.from("organizations").update(maj).eq("id", b.id);
  if (error) return NextResponse.json({ error: "Mise à jour impossible.", detail: error.message.slice(0, 200) }, { status: 400 });

  await g.admin.from("audit_log").insert({
    org_id: b.id, actor_id: g.moi.id, actor_name: g.moi.email,
    action: "platform.org.update", entity: `org:${b.id}`, detail: JSON.stringify(maj),
    severity: maj.status === "suspended" ? "warn" : "info",
  }).then(() => {}, () => {});

  return NextResponse.json({ ok: true });
}
