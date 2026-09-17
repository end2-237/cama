/* ════════════════════════════════════════════════════════════
   CAMA — Facturation (côté client) : plans, abonnement, paiements.
════════════════════════════════════════════════════════════ */

import { supabase } from "@/lib/supabase";

export interface DBPlan {
  id: string;
  name: string;
  price_fcfa: number;
  max_students: number | null;
  sort: number;
}

export interface DBSubscription {
  id: string;
  org_id: string;
  plan_id: string;
  status: "trial" | "active" | "past_due" | "canceled";
  period_end: string | null;
  created_at: string;
}

export interface DBSubscriptionPayment {
  id: string;
  org_id: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  provider: string;
  provider_ref: string | null;
  phone: string | null;
  operator: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

// Repli si la table n'est pas encore peuplée (avant migration).
export const FALLBACK_PLANS: DBPlan[] = [
  { id: "starter",    name: "Starter",    price_fcfa: 600000,  max_students: 150,  sort: 1 },
  { id: "pro",        name: "Pro",        price_fcfa: 1500000, max_students: 500,  sort: 2 },
  { id: "business",   name: "Business",   price_fcfa: 3600000, max_students: 1500, sort: 3 },
  { id: "enterprise", name: "Enterprise", price_fcfa: 0,       max_students: null, sort: 4 },
];

export async function fetchPlans(): Promise<DBPlan[]> {
  try {
    const { data } = await supabase.from("plans").select("*").order("sort");
    if (data && data.length) return data as DBPlan[];
  } catch { /* fallback */ }
  return FALLBACK_PLANS;
}

export async function fetchMySubscription(): Promise<DBSubscription | null> {
  try {
    const { data } = await supabase
      .from("subscriptions").select("*")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return (data as DBSubscription) ?? null;
  } catch { return null; }
}

export async function fetchMyBillingPayments(): Promise<DBSubscriptionPayment[]> {
  try {
    const { data } = await supabase
      .from("subscription_payments").select("*")
      .order("created_at", { ascending: false }).limit(20);
    return (data as DBSubscriptionPayment[]) ?? [];
  } catch { return []; }
}

export async function countOrgStudents(): Promise<number> {
  try {
    const { count } = await supabase
      .from("users").select("id", { count: "exact", head: true }).eq("role", "etudiant");
    return count ?? 0;
  } catch { return 0; }
}

export function formatFcfa(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}
