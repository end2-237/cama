import { NextResponse } from "next/server";
import { clientService, creerEtablissement, type NouvelEtablissement } from "@/lib/server/organizations";

export const dynamic = "force-dynamic";

/**
 * Inscription publique d'un établissement (tenant) + son premier compte
 * administrateur. Toujours en essai : le statut, le plan et l'activation
 * se décident depuis l'administration de la plateforme (/plateforme).
 *
 * POST /api/org/signup
 * body: { orgName, subdomain, vertical, primaryColor?, accentColor?,
 *         adminEmail, adminPassword, adminFirstName, adminLastName }
 */
export async function POST(req: Request) {
  const admin = clientService();
  if (!admin) return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });

  let b: NouvelEtablissement;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  // Le public ne choisit ni son statut ni son plan.
  const r = await creerEtablissement(admin, { ...b, status: "trial", planId: undefined });
  if (!r.ok) return NextResponse.json({ error: r.error, detail: r.detail }, { status: r.status });
  return NextResponse.json({ ok: true, orgId: r.orgId, slug: r.slug, subdomain: r.subdomain });
}
