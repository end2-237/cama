import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDepositStatus } from "@/lib/pawapay";

export const dynamic = "force-dynamic";

/**
 * Callback PawaPay : notifie l'état final d'un dépôt.
 * POST /api/billing/webhook  body: { depositId, status }
 * On revérifie l'état réel auprès de PawaPay (ne pas se fier au seul corps),
 * puis on active l'abonnement si COMPLETED.
 */

interface Body { depositId?: string; status?: string; }

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Config serveur incomplète." }, { status: 500 });

  let b: Body;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }
  const depositId = (b.depositId ?? "").trim();
  if (!depositId) return NextResponse.json({ error: "depositId manquant" }, { status: 400 });

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: pay } = await admin.from("subscription_payments")
    .select("id, org_id, plan_id, subscription_id, status").eq("provider_ref", depositId).maybeSingle();
  if (!pay) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  if (pay.status === "completed") return NextResponse.json({ ok: true, already: true });

  // Source de vérité = PawaPay (repli sur le corps si le jeton n'est pas configuré).
  const verified = (await getDepositStatus(depositId)) ?? b.status ?? "";
  const completed = verified.toUpperCase() === "COMPLETED";

  await admin.from("subscription_payments")
    .update({ status: completed ? "completed" : "failed" }).eq("id", pay.id);

  if (completed) {
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    if (pay.subscription_id) {
      await admin.from("subscriptions").update({
        plan_id: pay.plan_id, status: "active", period_end: periodEnd.toISOString(),
      }).eq("id", pay.subscription_id);
    } else {
      await admin.from("subscriptions").insert({
        org_id: pay.org_id, plan_id: pay.plan_id, status: "active", period_end: periodEnd.toISOString(),
      });
    }
  }

  return NextResponse.json({ ok: true, status: completed ? "completed" : "failed" });
}
