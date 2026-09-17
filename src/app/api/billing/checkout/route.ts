import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { initiateDeposit, CORRESPONDENTS } from "@/lib/pawapay";

export const dynamic = "force-dynamic";

/**
 * Initie un paiement d'abonnement par Mobile Money via PawaPay.
 * POST /api/billing/checkout
 * body: { requesterId, plan_id, phone, operator }
 * - requesterId doit être admin de l'établissement.
 * - Crée un subscription_payment (pending) puis lance le dépôt PawaPay.
 */

interface Body { requesterId?: string; plan_id?: string; phone?: string; operator?: string; }

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });

  let b: Body;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const requesterId = (b.requesterId ?? "").trim();
  const planId = (b.plan_id ?? "").trim();
  const phone = (b.phone ?? "").trim();
  const operator = (b.operator ?? "").trim();

  if (!requesterId || !planId || !phone || !operator) {
    return NextResponse.json({ error: "Champs manquants (plan, téléphone, opérateur)." }, { status: 400 });
  }
  const corr = CORRESPONDENTS[operator];
  if (!corr) return NextResponse.json({ error: "Opérateur non pris en charge." }, { status: 400 });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // 1. Vérifier l'admin + récupérer son org
  const { data: requester } = await admin.from("users").select("role, org_id").eq("id", requesterId).maybeSingle();
  if (!requester || requester.role !== "admin" || !requester.org_id) {
    return NextResponse.json({ error: "Accès réservé à l'administration de l'établissement." }, { status: 403 });
  }
  const orgId = requester.org_id as string;

  // 2. Plan + montant
  const { data: plan } = await admin.from("plans").select("id, price_fcfa, name").eq("id", planId).maybeSingle();
  if (!plan) return NextResponse.json({ error: "Plan inconnu." }, { status: 400 });
  if (!plan.price_fcfa || plan.price_fcfa <= 0) {
    return NextResponse.json({ error: "Ce plan est sur devis — contactez-nous." }, { status: 400 });
  }

  // 3. Abonnement courant (pour rattacher le paiement)
  const { data: sub } = await admin.from("subscriptions").select("id").eq("org_id", orgId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  // 4. Enregistrer le paiement (pending)
  const depositId = randomUUID();
  const { error: payErr } = await admin.from("subscription_payments").insert({
    org_id: orgId, subscription_id: sub?.id ?? null, plan_id: planId,
    amount: plan.price_fcfa, currency: corr.currency, provider: "pawapay",
    provider_ref: depositId, phone, operator, status: "pending",
  });
  if (payErr) return NextResponse.json({ error: "Erreur d'enregistrement du paiement." }, { status: 500 });

  // 5. Lancer le dépôt PawaPay
  const dep = await initiateDeposit({
    depositId, amount: plan.price_fcfa, currency: corr.currency,
    correspondent: operator, phone, description: `CAMA ${plan.name}`,
  });
  if (!dep.ok) {
    await admin.from("subscription_payments").update({ status: "failed" }).eq("provider_ref", depositId);
    return NextResponse.json({ error: dep.error ?? "Paiement refusé par l'opérateur.", detail: dep.status }, { status: 400 });
  }

  return NextResponse.json({ ok: true, depositId, status: dep.status ?? "ACCEPTED" });
}
