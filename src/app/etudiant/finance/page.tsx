"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, Receipt, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import {
  fetchInvoices, fetchStudentPayments, fetchScholarships,
  formatFcfa, STATUS_LABELS, METHOD_LABELS,
  type DBInvoice, type DBPayment, type DBScholarship, type InvoiceStatus,
} from "@/lib/finance";

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  du:      "border-gold-dark text-gold-dark",
  partiel: "border-cama text-cama",
  paye:    "border-green-700 text-green-700",
  annule:  "border-border text-subtle line-through",
};

export default function EtudiantFinancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [invoices, setInvoices] = useState<DBInvoice[]>([]);
  const [payments, setPayments] = useState<DBPayment[]>([]);
  const [scholarships, setScholarships] = useState<DBScholarship[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "etudiant")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    Promise.all([
      fetchInvoices(user.id), fetchStudentPayments(user.id), fetchScholarships(user.id),
    ]).then(([inv, pay, sch]) => {
      if (!alive) return;
      setInvoices(inv); setPayments(pay); setScholarships(sch); setFetching(false);
    });
    return () => { alive = false; };
  }, [user]);

  if (loading || fetching || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  const active = invoices.filter((i) => i.status !== "annule");
  const activeIds = new Set(active.map((i) => i.id));
  const due = active.reduce((a, i) => a + i.amount_fcfa, 0);
  const paid = payments.filter((p) => !p.invoice_id || activeIds.has(p.invoice_id)).reduce((a, p) => a + p.amount_fcfa, 0);
  const balance = Math.max(0, due - paid);
  const paidForInvoice = (id: string) => payments.filter((p) => p.invoice_id === id).reduce((a, p) => a + p.amount_fcfa, 0);

  return (
    <PageShell
      title="Ma scolarité"
      subtitle="Vos frais de scolarité, paiements et bourses — enregistrés par l'administration."
      icon={Wallet}
      breadcrumb="Ma scolarité"
      maxWidth="max-w-[1100px]"
      stats={[
        { label: "Total dû", value: formatFcfa(due),     accent: "ink" },
        { label: "Payé",     value: formatFcfa(paid),    accent: "green" },
        { label: "Solde",    value: formatFcfa(balance), accent: "gold" },
      ]}
    >
      <div className="space-y-4">
        {/* Factures */}
        <div className="bg-white border border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted px-3 py-2 border-b border-border">Mes factures</p>
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-2 px-3 py-2 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted">
            <span>Libellé</span><span>Montant</span><span>Solde</span><span>Statut</span>
          </div>
          {invoices.length === 0 && <div className="p-6 text-center text-xs text-muted">Aucune facture pour le moment.</div>}
          {invoices.map((inv) => {
            const solde = Math.max(0, inv.amount_fcfa - paidForInvoice(inv.id));
            return (
              <div key={inv.id} className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-2 px-3 py-2.5 border-b border-border items-center text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-ink truncate">{inv.label ?? "Frais de scolarité"}</p>
                  <p className="text-[10px] text-subtle">{inv.academic_year ?? ""}{inv.due_date ? ` · échéance ${inv.due_date}` : ""}</p>
                </div>
                <span className="tabular-nums text-ink font-semibold">{formatFcfa(inv.amount_fcfa)}</span>
                <span className={`tabular-nums font-semibold ${solde > 0 && inv.status !== "annule" ? "text-gold-dark" : "text-green-700"}`}>{formatFcfa(solde)}</span>
                <span>
                  <span className={`text-[9px] font-black uppercase tracking-widest border px-1.5 py-0.5 ${STATUS_STYLE[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Paiements */}
        <div className="bg-white border border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted px-3 py-2 border-b border-border flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-cama" /> Historique des paiements
          </p>
          {payments.length === 0 && <div className="p-6 text-center text-xs text-muted">Aucun paiement enregistré.</div>}
          {payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border text-xs">
              <span className="tabular-nums font-bold text-green-700">{formatFcfa(p.amount_fcfa)}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-cama border border-cama px-1.5 py-0.5">{METHOD_LABELS[p.method]}</span>
              {p.reference && <span className="text-[10px] text-muted">Réf. {p.reference}</span>}
              <span className="text-[10px] text-subtle ml-auto">{new Date(p.paid_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          ))}
        </div>

        {/* Bourses */}
        {scholarships.length > 0 && (
          <div className="bg-white border border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted px-3 py-2 border-b border-border flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-gold-dark" /> Mes bourses
            </p>
            {scholarships.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border text-xs">
                <span className="font-bold text-ink">{s.kind ?? "Bourse"}</span>
                {s.percent != null && <span className="text-[9px] font-black uppercase tracking-widest text-gold-dark border border-gold-dark px-1.5 py-0.5">-{s.percent}%</span>}
                {s.amount_fcfa != null && <span className="tabular-nums text-gold-dark font-semibold">{formatFcfa(s.amount_fcfa)}</span>}
                {s.note && <span className="text-[10px] text-muted">{s.note}</span>}
                <span className="text-[10px] text-subtle ml-auto">{s.academic_year ?? ""}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-subtle">
          Paiements enregistrés par l&apos;administration. Pour tout règlement, rapprochez-vous du service scolarité de l&apos;Institut JFN.
        </p>
      </div>
    </PageShell>
  );
}
