"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, Plus, Download, Receipt, Ban } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import { fetchInscriptions, fetchUsers, type InscriptionWithUser } from "@/lib/admin";
import type { DBUser } from "@/lib/supabase";
import { currentYear } from "@/lib/academic";
import { logAudit } from "@/lib/governance";
import { notify } from "@/lib/notifications";
import {
  issueInvoice, fetchAllInvoices, cancelInvoice,
  recordPayment, fetchStudentPayments,
  formatFcfa, STATUS_LABELS, METHOD_LABELS,
  type DBInvoice, type DBPayment, type InvoiceStatus, type PaymentMethod,
} from "@/lib/finance";

/* Métadonnées d'un étudiant (nom + email) construites depuis les inscriptions/users */
interface StudentMeta { id: string; name: string; email: string }

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  du:      "border-gold-dark text-gold-dark",
  partiel: "border-cama text-cama",
  paye:    "border-green-700 text-green-700",
  annule:  "border-border text-subtle line-through",
};

export default function AdminFinancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoices, setInvoices] = useState<DBInvoice[]>([]);
  const [payments, setPayments] = useState<DBPayment[]>([]);
  const [students, setStudents] = useState<StudentMeta[]>([]);
  const [year, setYear] = useState<string>("");

  // Formulaire nouvelle facture
  const [invStudent, setInvStudent] = useState("");
  const [invLabel, setInvLabel] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invDue, setInvDue] = useState("");

  // Encaissement (facture en cours)
  const [payFor, setPayFor] = useState<DBInvoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("especes");
  const [payRef, setPayRef] = useState("");

  // Filtres
  const [filterStudent, setFilterStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | InvoiceStatus>("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => {
    const [invs, insc, users, yr] = await Promise.all([
      fetchAllInvoices(), fetchInscriptions(), fetchUsers(), currentYear(),
    ]);
    setInvoices(invs);
    setYear(yr?.label ?? "");
    // Table de correspondance étudiant : d'abord users (rôle étudiant), enrichie par inscriptions
    const map = new Map<string, StudentMeta>();
    (users as DBUser[]).filter((u) => u.role === "etudiant").forEach((u) => {
      map.set(u.id, { id: u.id, name: `${u.first_name} ${u.last_name}`.trim(), email: u.email });
    });
    (insc as InscriptionWithUser[]).forEach((i) => {
      if (!map.has(i.user_id) && i.user) {
        map.set(i.user_id, { id: i.user_id, name: `${i.user.first_name} ${i.user.last_name}`.trim(), email: i.user.email });
      }
    });
    setStudents(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
    // Paiements de tous les étudiants concernés par une facture
    const ids = Array.from(new Set(invs.map((i) => i.student_id)));
    const pays = await Promise.all(ids.map((id) => fetchStudentPayments(id)));
    setPayments(pays.flat());
    setFetching(false);
  };
  useEffect(() => { if (user) reload(); }, [user]);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? "Étudiant";
  const paidForInvoice = (invId: string) =>
    payments.filter((p) => p.invoice_id === invId).reduce((a, p) => a + p.amount_fcfa, 0);

  const addInvoice = async () => {
    if (!invStudent || !invAmount || saving) return;
    setSaving(true);
    const res = await issueInvoice({
      studentId: invStudent,
      academicYear: year || null,
      label: invLabel,
      amountFcfa: Number(invAmount),
      dueDate: invDue || null,
    });
    if (!res.error) {
      await notify(invStudent, "finance", "Nouvelle facture",
        `Une facture de ${formatFcfa(Number(invAmount) || 0)} a été émise${invLabel ? ` — ${invLabel}` : ""}.`,
        "/etudiant/finance");
      await logAudit({ actorId: user!.id, actorName: user!.name, action: "facture.emettre",
        entity: `student:${invStudent}`, detail: `${invLabel || "Frais"} · ${formatFcfa(Number(invAmount) || 0)}` });
    }
    setInvStudent(""); setInvLabel(""); setInvAmount(""); setInvDue("");
    await reload();
    setSaving(false);
  };

  const openPay = (inv: DBInvoice) => {
    setPayFor(inv);
    const remaining = Math.max(0, inv.amount_fcfa - paidForInvoice(inv.id));
    setPayAmount(String(remaining));
    setPayMethod("especes");
    setPayRef("");
  };

  const submitPay = async () => {
    if (!payFor || !payAmount || saving) return;
    setSaving(true);
    const res = await recordPayment(payFor.id, payFor.student_id, Number(payAmount), payMethod, payRef || null, user!.id);
    if (!res.error) {
      await notify(payFor.student_id, "finance", "Paiement enregistré",
        `Un paiement de ${formatFcfa(Number(payAmount) || 0)} (${METHOD_LABELS[payMethod]}) a été enregistré par l'administration.`,
        "/etudiant/finance");
      await logAudit({ actorId: user!.id, actorName: user!.name, action: "paiement.enregistrer",
        entity: `invoice:${payFor.id}`, detail: `${formatFcfa(Number(payAmount) || 0)} · ${METHOD_LABELS[payMethod]}${payRef ? ` · réf ${payRef}` : ""}` });
    }
    setPayFor(null);
    await reload();
    setSaving(false);
  };

  const doCancel = async (inv: DBInvoice) => {
    if (saving) return;
    setSaving(true);
    await cancelInvoice(inv.id);
    await logAudit({ actorId: user!.id, actorName: user!.name, action: "facture.annuler",
      entity: `invoice:${inv.id}`, detail: inv.label ?? "Facture", severity: "warn" });
    await reload();
    setSaving(false);
  };

  const filtered = useMemo(() => invoices.filter((i) =>
    (!filterStudent || i.student_id === filterStudent) &&
    (!filterStatus || i.status === filterStatus)
  ), [invoices, filterStudent, filterStatus]);

  const totals = useMemo(() => {
    const active = invoices.filter((i) => i.status !== "annule");
    const due = active.reduce((a, i) => a + i.amount_fcfa, 0);
    const activeIds = new Set(active.map((i) => i.id));
    const paid = payments.filter((p) => !p.invoice_id || activeIds.has(p.invoice_id)).reduce((a, p) => a + p.amount_fcfa, 0);
    const unpaid = active.filter((i) => i.status === "du" || i.status === "partiel").length;
    return { due, paid, balance: Math.max(0, due - paid), unpaid };
  }, [invoices, payments]);

  const exportCsv = () => {
    const rows = [["Étudiant", "Libellé", "Année", "Montant FCFA", "Payé FCFA", "Solde FCFA", "Échéance", "Statut"]];
    filtered.forEach((i) => {
      const p = paidForInvoice(i.id);
      rows.push([
        studentName(i.student_id), i.label ?? "", i.academic_year ?? "",
        String(i.amount_fcfa), String(p), String(Math.max(0, i.amount_fcfa - p)),
        i.due_date ?? "", STATUS_LABELS[i.status],
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading || fetching || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  return (
    <PageShell
      title="Finances & scolarité"
      subtitle="Suivi des frais de scolarité, encaissements et reçus — trace administrative."
      icon={Wallet}
      breadcrumb="Finances & scolarité"
      context={year ? `Année · ${year}` : undefined}
      actions={
        <button onClick={exportCsv}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cama border border-cama px-3 py-2 hover:bg-cama-50 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      }
      stats={[
        { label: "Total dû",       value: formatFcfa(totals.due),     accent: "ink" },
        { label: "Total encaissé", value: formatFcfa(totals.paid),    accent: "green" },
        { label: "Solde",          value: formatFcfa(totals.balance), accent: "gold" },
        { label: "Impayés",        value: totals.unpaid,              accent: "cama" },
      ]}
    >
      <div className="space-y-4">
        {/* Émettre une facture */}
        <div className="bg-white border border-border p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Émettre une facture</p>
          <div className="flex flex-wrap items-center gap-2">
            <select value={invStudent} onChange={(e) => setInvStudent(e.target.value)}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama min-w-[200px]">
              <option value="">— Choisir un étudiant —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.email}</option>)}
            </select>
            <input value={invLabel} onChange={(e) => setInvLabel(e.target.value)} placeholder="Libellé (ex. Scolarité S1)"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama w-52" />
            <input value={invAmount} onChange={(e) => setInvAmount(e.target.value)} type="number" min={0} placeholder="Montant FCFA"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama w-32" />
            <input value={invDue} onChange={(e) => setInvDue(e.target.value)} type="date"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            <button onClick={addInvoice} disabled={!invStudent || !invAmount || saving}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-cama px-3 py-2 disabled:opacity-50">
              <Plus className="w-3 h-3" /> Émettre
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white border border-border p-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Filtrer</span>
          <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}
            className="text-xs px-2 py-1.5 border border-border bg-white outline-none focus:border-cama min-w-[180px]">
            <option value="">Tous les étudiants</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "" | InvoiceStatus)}
            className="text-xs px-2 py-1.5 border border-border bg-white outline-none focus:border-cama">
            <option value="">Tous les statuts</option>
            {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <span className="text-[10px] text-subtle ml-auto">{filtered.length} facture{filtered.length > 1 ? "s" : ""}</span>
        </div>

        {/* Liste des factures */}
        <div className="bg-white border border-border">
          <div className="grid grid-cols-[1.4fr_1.4fr_1fr_1fr_1fr_auto] gap-2 px-3 py-2 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted">
            <span>Étudiant</span><span>Libellé</span><span>Montant</span><span>Solde</span><span>Statut</span><span>Actions</span>
          </div>
          {filtered.length === 0 && (
            <div className="p-6 text-center text-xs text-muted">Aucune facture.</div>
          )}
          {filtered.map((inv) => {
            const paid = paidForInvoice(inv.id);
            const solde = Math.max(0, inv.amount_fcfa - paid);
            return (
              <div key={inv.id} className="grid grid-cols-[1.4fr_1.4fr_1fr_1fr_1fr_auto] gap-2 px-3 py-2.5 border-b border-border items-center text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-ink truncate">{studentName(inv.student_id)}</p>
                  {inv.due_date && <p className="text-[10px] text-subtle">Échéance {inv.due_date}</p>}
                </div>
                <span className="text-muted truncate">{inv.label ?? "—"}</span>
                <span className="tabular-nums text-ink font-semibold">{formatFcfa(inv.amount_fcfa)}</span>
                <span className={`tabular-nums font-semibold ${solde > 0 ? "text-gold-dark" : "text-green-700"}`}>{formatFcfa(solde)}</span>
                <span>
                  <span className={`text-[9px] font-black uppercase tracking-widest border px-1.5 py-0.5 ${STATUS_STYLE[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                </span>
                <div className="flex items-center gap-1.5 justify-end">
                  {inv.status !== "paye" && inv.status !== "annule" && (
                    <button onClick={() => openPay(inv)} disabled={saving}
                      className="flex items-center gap-1 text-[10px] font-bold text-white bg-cama px-2 py-1 disabled:opacity-50">
                      <Receipt className="w-3 h-3" /> Encaisser
                    </button>
                  )}
                  {inv.status !== "annule" && (
                    <button onClick={() => doCancel(inv)} disabled={saving} title="Annuler la facture"
                      className="flex items-center gap-1 text-[10px] font-bold text-muted border border-border px-2 py-1 hover:border-red-400 hover:text-red-600 disabled:opacity-50">
                      <Ban className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-subtle">
          Trace administrative uniquement — les encaissements sont saisis par l&apos;administration (pas de paiement en ligne).
          Chaque émission et encaissement est tracé dans le journal d&apos;audit.
        </p>
      </div>

      {/* Modale d'encaissement */}
      {payFor && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={() => !saving && setPayFor(null)}>
          <div className="bg-white border border-border w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="h-0.5 w-full bg-gradient-to-r from-cama via-cama-400 to-gold" />
            <div className="p-4">
              <p className="text-sm font-black text-ink flex items-center gap-2"><Receipt className="w-4 h-4 text-cama" /> Encaisser un paiement</p>
              <p className="text-xs text-muted mt-1">{studentName(payFor.student_id)} · {payFor.label ?? "Facture"} · {formatFcfa(payFor.amount_fcfa)}</p>
              <div className="mt-3 space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted">Montant (FCFA)</label>
                <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} type="number" min={0}
                  className="w-full text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted">Méthode</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama">
                  {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                </select>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted">Référence (facultatif)</label>
                <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="N° reçu / transaction"
                  className="w-full text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => setPayFor(null)} disabled={saving}
                  className="text-[10px] font-black uppercase tracking-widest text-muted border border-border px-3 py-2 disabled:opacity-50">Annuler</button>
                <button onClick={submitPay} disabled={!payAmount || saving}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-cama px-3 py-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Receipt className="w-3 h-3" />} Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
