import { supabase } from "@/lib/supabase";
import { formatFcfa } from "@/lib/parcours";

/* ════════════════════════════════════════════════════════════
   FINANCES & SCOLARITÉ — trace administrative (chantier B3)
   Barèmes, factures, encaissements et bourses. Aucun paiement en
   ligne : les encaissements sont enregistrés par l'administration.
   Fonctions robustes : échec silencieux → [] / null.
════════════════════════════════════════════════════════════ */

export { formatFcfa };

export type InvoiceStatus = "du" | "partiel" | "paye" | "annule";
export type PaymentMethod = "especes" | "mobile_money" | "virement";

export interface DBFeeSchedule {
  id: string;
  parcours_slug: string | null;
  cycle_type: string | null;
  academic_year: string | null;
  total_fcfa: number;
  installments: number;
  created_at: string;
}

export interface DBInvoice {
  id: string;
  student_id: string;
  academic_year: string | null;
  label: string | null;
  amount_fcfa: number;
  due_date: string | null;
  status: InvoiceStatus;
  created_at: string;
}

export interface DBPayment {
  id: string;
  invoice_id: string | null;
  student_id: string;
  amount_fcfa: number;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string;
  recorded_by: string | null;
}

export interface DBScholarship {
  id: string;
  student_id: string;
  academic_year: string | null;
  kind: string | null;
  percent: number | null;
  amount_fcfa: number | null;
  note: string | null;
  granted_by: string | null;
  created_at: string;
}

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  virement: "Virement",
};

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  du: "Dû",
  partiel: "Partiel",
  paye: "Payé",
  annule: "Annulé",
};

// ════════════════════════════════════════════════════════════
// BARÈMES DE FRAIS
// ════════════════════════════════════════════════════════════
export async function createFeeSchedule(payload: {
  parcoursSlug?: string | null;
  cycleType?: string | null;
  academicYear?: string | null;
  totalFcfa: number;
  installments?: number;
}) {
  return supabase.from("fee_schedules").insert({
    parcours_slug: payload.parcoursSlug ?? null,
    cycle_type: payload.cycleType ?? null,
    academic_year: payload.academicYear ?? null,
    total_fcfa: Math.round(payload.totalFcfa) || 0,
    installments: payload.installments ?? 1,
  });
}

export async function fetchFeeSchedules(): Promise<DBFeeSchedule[]> {
  const { data } = await supabase.from("fee_schedules").select("*")
    .order("created_at", { ascending: false });
  return (data as DBFeeSchedule[]) ?? [];
}

// ════════════════════════════════════════════════════════════
// FACTURES
// ════════════════════════════════════════════════════════════
export async function issueInvoice(payload: {
  studentId: string;
  academicYear?: string | null;
  label?: string | null;
  amountFcfa: number;
  dueDate?: string | null;
}) {
  return supabase.from("invoices").insert({
    student_id: payload.studentId,
    academic_year: payload.academicYear ?? null,
    label: payload.label?.trim() || null,
    amount_fcfa: Math.round(payload.amountFcfa) || 0,
    due_date: payload.dueDate || null,
    status: "du",
  }).select("*").maybeSingle();
}

export async function fetchInvoices(studentId?: string): Promise<DBInvoice[]> {
  let q = supabase.from("invoices").select("*").order("created_at", { ascending: false });
  if (studentId) q = q.eq("student_id", studentId);
  const { data } = await q;
  return (data as DBInvoice[]) ?? [];
}

export async function fetchAllInvoices(): Promise<DBInvoice[]> {
  return fetchInvoices();
}

export async function cancelInvoice(id: string) {
  return supabase.from("invoices").update({ status: "annule" }).eq("id", id);
}

// ════════════════════════════════════════════════════════════
// ENCAISSEMENTS
// ════════════════════════════════════════════════════════════
/** Insère le paiement puis recalcule le statut de la facture
    (somme des paiements vs montant : 0→'du', <total→'partiel', >=total→'paye'). */
export async function recordPayment(
  invoiceId: string,
  studentId: string,
  amount: number,
  method: PaymentMethod,
  reference: string | null,
  recordedBy: string | null,
) {
  const res = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    student_id: studentId,
    amount_fcfa: Math.round(amount) || 0,
    method,
    reference: reference?.trim() || null,
    recorded_by: recordedBy,
  });
  await recomputeInvoiceStatus(invoiceId);
  return res;
}

/** Recalcule et persiste le statut d'une facture d'après ses paiements. */
export async function recomputeInvoiceStatus(invoiceId: string) {
  const { data: inv } = await supabase.from("invoices")
    .select("amount_fcfa,status").eq("id", invoiceId).maybeSingle();
  const invoice = inv as Pick<DBInvoice, "amount_fcfa" | "status"> | null;
  if (!invoice || invoice.status === "annule") return;
  const { data: pays } = await supabase.from("payments")
    .select("amount_fcfa").eq("invoice_id", invoiceId);
  const paid = ((pays as Pick<DBPayment, "amount_fcfa">[]) ?? [])
    .reduce((a, p) => a + (p.amount_fcfa ?? 0), 0);
  const total = invoice.amount_fcfa ?? 0;
  const status: InvoiceStatus = paid <= 0 ? "du" : paid >= total ? "paye" : "partiel";
  return supabase.from("invoices").update({ status }).eq("id", invoiceId);
}

export async function fetchPayments(invoiceId: string): Promise<DBPayment[]> {
  const { data } = await supabase.from("payments").select("*")
    .eq("invoice_id", invoiceId).order("paid_at", { ascending: false });
  return (data as DBPayment[]) ?? [];
}

export async function fetchStudentPayments(studentId: string): Promise<DBPayment[]> {
  const { data } = await supabase.from("payments").select("*")
    .eq("student_id", studentId).order("paid_at", { ascending: false });
  return (data as DBPayment[]) ?? [];
}

// ════════════════════════════════════════════════════════════
// BOURSES
// ════════════════════════════════════════════════════════════
export async function grantScholarship(payload: {
  studentId: string;
  academicYear?: string | null;
  kind?: string | null;
  percent?: number | null;
  amountFcfa?: number | null;
  note?: string | null;
  grantedBy?: string | null;
}) {
  return supabase.from("scholarships").insert({
    student_id: payload.studentId,
    academic_year: payload.academicYear ?? null,
    kind: payload.kind?.trim() || null,
    percent: payload.percent ?? null,
    amount_fcfa: payload.amountFcfa ?? null,
    note: payload.note?.trim() || null,
    granted_by: payload.grantedBy ?? null,
  });
}

export async function fetchScholarships(studentId: string): Promise<DBScholarship[]> {
  const { data } = await supabase.from("scholarships").select("*")
    .eq("student_id", studentId).order("created_at", { ascending: false });
  return (data as DBScholarship[]) ?? [];
}

// ════════════════════════════════════════════════════════════
// SOLDE
// ════════════════════════════════════════════════════════════
/** Solde d'un étudiant sur toutes ses factures (hors annulées). */
export async function balanceOf(studentId: string): Promise<{ due: number; paid: number; balance: number }> {
  const [invoices, payments] = await Promise.all([
    fetchInvoices(studentId),
    fetchStudentPayments(studentId),
  ]);
  const active = invoices.filter((i) => i.status !== "annule");
  const activeIds = new Set(active.map((i) => i.id));
  const due = active.reduce((a, i) => a + (i.amount_fcfa ?? 0), 0);
  const paid = payments
    .filter((p) => !p.invoice_id || activeIds.has(p.invoice_id))
    .reduce((a, p) => a + (p.amount_fcfa ?? 0), 0);
  return { due, paid, balance: Math.max(0, due - paid) };
}
