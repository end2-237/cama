"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, Check, Smartphone, AlertCircle, Sparkles } from "lucide-react";
import PageShell from "@/components/dashboard/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import {
  fetchPlans, fetchMySubscription, fetchMyBillingPayments, countOrgStudents,
  formatFcfa, type DBPlan, type DBSubscription, type DBSubscriptionPayment,
} from "@/lib/billing";

const OPERATORS = [
  { id: "MTN_MOMO_CMR", label: "MTN MoMo" },
  { id: "ORANGE_CMR", label: "Orange Money" },
];

const STATUS_LABEL: Record<string, string> = {
  trial: "Essai", active: "Actif", past_due: "Impayé", canceled: "Résilié",
};

export default function BillingPage() {
  const { user } = useAuth();
  const { org } = useOrg();
  const [plans, setPlans] = useState<DBPlan[]>([]);
  const [sub, setSub] = useState<DBSubscription | null>(null);
  const [payments, setPayments] = useState<DBSubscriptionPayment[]>([]);
  const [students, setStudents] = useState(0);
  const [fetching, setFetching] = useState(true);

  const [chosen, setChosen] = useState<string>("");
  const [operator, setOperator] = useState("MTN_MOMO_CMR");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const [p, s, pay, cnt] = await Promise.all([
        fetchPlans(), fetchMySubscription(), fetchMyBillingPayments(), countOrgStudents(),
      ]);
      setPlans(p); setSub(s); setPayments(pay); setStudents(cnt);
      setChosen(s?.plan_id ?? "pro");
      setFetching(false);
    })();
  }, []);

  const currentPlan = plans.find((p) => p.id === sub?.plan_id);
  const quota = currentPlan?.max_students ?? null;

  async function pay() {
    if (!user) return;
    setMsg(null);
    if (!chosen || !phone) { setMsg({ type: "err", text: "Choisissez un plan et saisissez votre numéro Mobile Money." }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user.id, plan_id: chosen, phone, operator }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Paiement impossible." }); }
      else { setMsg({ type: "ok", text: "Demande de paiement envoyée — validez sur votre téléphone." }); }
    } catch {
      setMsg({ type: "err", text: "Erreur réseau." });
    } finally { setBusy(false); }
  }

  if (!user || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  return (
    <PageShell
      title="Facturation & abonnement"
      subtitle="Gérez le plan de votre établissement et payez par Mobile Money (PawaPay)."
      icon={CreditCard}
      breadcrumb="Facturation"
      maxWidth="max-w-[1100px]"
      context={org.name}
      stats={[
        { label: "Plan actuel", value: currentPlan?.name ?? "—", accent: "cama" },
        { label: "Statut", value: STATUS_LABEL[sub?.status ?? ""] ?? "—", accent: sub?.status === "active" ? "green" : "gold" },
        { label: "Étudiants", value: quota ? `${students} / ${quota}` : `${students} / ∞`, accent: "ink" },
        { label: "Échéance", value: sub?.period_end ? new Date(sub.period_end).toLocaleDateString("fr-FR") : "—", accent: "gold" },
      ]}
    >
      <div className="space-y-5">
        {/* Plans */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Choisir un plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((p) => {
              const active = chosen === p.id;
              const isCurrent = sub?.plan_id === p.id;
              return (
                <button key={p.id} onClick={() => setChosen(p.id)}
                  className={`text-left border-2 rounded-xl p-4 transition-all ${active ? "border-cama bg-cama/5" : "border-border hover:border-cama/40"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-ink">{p.name}</p>
                    {isCurrent && <span className="text-[9px] font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5">Actuel</span>}
                    {active && !isCurrent && <Check className="w-4 h-4 text-cama" />}
                  </div>
                  <p className="text-lg font-black text-ink tabular-nums">{p.price_fcfa ? formatFcfa(p.price_fcfa) : "Sur devis"}</p>
                  <p className="text-[10px] text-muted">{p.price_fcfa ? "/ an" : " "}</p>
                  <p className="text-[11px] text-muted mt-2">{p.max_students ? `Jusqu'à ${p.max_students} étudiants` : "Étudiants illimités"}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paiement Mobile Money */}
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-sm font-bold text-ink flex items-center gap-2 mb-3"><Smartphone className="w-4 h-4 text-cama" /> Payer par Mobile Money</p>
          {msg && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 mb-3 ${msg.type === "ok" ? "text-green-700 bg-green-50 border border-green-200" : "text-red-700 bg-red-50 border border-red-200"}`}>
              {msg.type === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {msg.text}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Opérateur</label>
              <select value={operator} onChange={(e) => setOperator(e.target.value)} className="input-auth">
                {OPERATORS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Numéro Mobile Money</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2376XXXXXXXX" className="input-auth" />
            </div>
            <button onClick={pay} disabled={busy}
              className="btn-primary py-3.5 rounded-xl justify-center shadow-lg shadow-cama/20 disabled:opacity-70">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : <>Payer {plans.find((p) => p.id === chosen)?.price_fcfa ? formatFcfa(plans.find((p) => p.id === chosen)!.price_fcfa) : ""}</>}
            </button>
          </div>
          <p className="text-[11px] text-muted mt-2 flex items-center gap-1"><Sparkles className="w-3 h-3 text-gold-dark" /> Une notification de paiement s'affichera sur votre téléphone pour validation.</p>
        </div>

        {/* Historique */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Historique des paiements</p>
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            {payments.length === 0 ? (
              <p className="text-sm text-muted px-4 py-6 text-center">Aucun paiement pour l'instant.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] uppercase tracking-wide text-muted border-b border-border">
                  <th className="text-left px-4 py-2 font-semibold">Date</th>
                  <th className="text-left px-4 py-2 font-semibold">Plan</th>
                  <th className="text-left px-4 py-2 font-semibold">Montant</th>
                  <th className="text-left px-4 py-2 font-semibold">Statut</th>
                </tr></thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-2 capitalize">{p.plan_id ?? "—"}</td>
                      <td className="px-4 py-2 tabular-nums">{formatFcfa(p.amount)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                          p.status === "completed" ? "bg-green-100 text-green-700"
                          : p.status === "failed" ? "bg-red-100 text-red-700" : "bg-gold-light text-gold-dark"}`}>
                          {p.status === "completed" ? "Payé" : p.status === "failed" ? "Échoué" : "En attente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
