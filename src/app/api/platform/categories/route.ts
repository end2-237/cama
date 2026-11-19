import { NextResponse } from "next/server";
import { adminPlateforme, clientService } from "@/lib/server/organizations";

export const dynamic = "force-dynamic";

/**
 * Catalogue des catégories d'établissements (migration 037).
 * Réservé à l'équipe CAMA. La lecture publique passe directement par
 * Supabase (règle « categories_read »).
 *
 * POST  /api/platform/categories → { id, label, description?, family, terms?, active?, sort? }
 * PATCH /api/platform/categories → { id, label?, description?, family?, terms?, active?, sort? }
 */

const FAMILLES = ["academique", "langues", "pro"];
const ID_RE = /^[a-z0-9][a-z0-9_-]{1,40}$/;
const CLES_TERMS = ["platformLabel", "heroLine1", "heroLine2", "heroTail", "levelWord", "groupWord", "unitWord", "creditWord", "programWord"];

interface Corps {
  id?: string; label?: string; description?: string; family?: string;
  terms?: Record<string, unknown>; active?: boolean; sort?: number;
}

function nettoyer(b: Corps, creation: boolean): { ok: true; ligne: Record<string, unknown> } | { ok: false; error: string } {
  const ligne: Record<string, unknown> = {};
  if (creation || b.label !== undefined) {
    const label = String(b.label ?? "").trim().slice(0, 80);
    if (!label) return { ok: false, error: "Le nom de la catégorie est obligatoire." };
    ligne.label = label;
  }
  if (b.description !== undefined) ligne.description = String(b.description).trim().slice(0, 240);
  if (creation || b.family !== undefined) {
    if (!FAMILLES.includes(String(b.family))) return { ok: false, error: "Modèle de fonctionnement inconnu." };
    ligne.family = b.family;
  }
  if (b.terms !== undefined) {
    // Seules les clés connues, en texte court : rien d'autre ne s'affiche.
    ligne.terms = Object.fromEntries(
      Object.entries(b.terms ?? {})
        .filter(([k, v]) => CLES_TERMS.includes(k) && typeof v === "string" && v.trim())
        .map(([k, v]) => [k, String(v).trim().slice(0, 60)]),
    );
  }
  if (b.active !== undefined) ligne.active = Boolean(b.active);
  if (b.sort !== undefined && Number.isFinite(Number(b.sort))) ligne.sort = Math.round(Number(b.sort));
  return { ok: true, ligne };
}

async function garde(req: Request) {
  const admin = clientService();
  if (!admin) return { erreur: NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 }) };
  const moi = await adminPlateforme(admin, req);
  if (!moi) return { erreur: NextResponse.json({ error: "Réservé à l'équipe de la plateforme." }, { status: 403 }) };
  return { admin, moi };
}

export async function POST(req: Request) {
  const g = await garde(req);
  if ("erreur" in g) return g.erreur;
  let b: Corps;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const id = String(b.id ?? "").trim().toLowerCase();
  if (!ID_RE.test(id)) return NextResponse.json({ error: "Identifiant invalide (a-z, 0-9, tirets)." }, { status: 400 });
  const n = nettoyer(b, true);
  if (!n.ok) return NextResponse.json({ error: n.error }, { status: 400 });

  const { data, error } = await g.admin.from("org_categories").insert({ id, ...n.ligne }).select("*").single();
  if (error) {
    return NextResponse.json(
      { error: /duplicate|unique/i.test(error.message) ? "Cette catégorie existe déjà." : "Création impossible.", detail: error.message.slice(0, 200) },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, categorie: data });
}

export async function PATCH(req: Request) {
  const g = await garde(req);
  if ("erreur" in g) return g.erreur;
  let b: Corps;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  if (!b.id) return NextResponse.json({ error: "Catégorie manquante." }, { status: 400 });

  const n = nettoyer(b, false);
  if (!n.ok) return NextResponse.json({ error: n.error }, { status: 400 });
  if (!Object.keys(n.ligne).length) return NextResponse.json({ error: "Rien à modifier." }, { status: 400 });

  const { data, error } = await g.admin.from("org_categories").update(n.ligne).eq("id", b.id).select("*").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Mise à jour impossible.", detail: error?.message?.slice(0, 200) }, { status: 400 });
  return NextResponse.json({ ok: true, categorie: data });
}
