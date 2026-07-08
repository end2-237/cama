/* ════════════════════════════════════════════════════════════
   AGENT D'ADMINISTRATION — flux semi-autonome (client)

   Cycle : PLAN → APPROBATION → EXÉCUTION (serveur, arrière-plan) → RAPPORT.

   • planRentreeInscriptions() : construit un plan à partir des dossiers
     d'inscription réels (le premier besoin d'une rentrée académique).
   • createTask / fetchTasks / subscribeTasks : file persistée (agent_tasks).
   L'exécution se fait côté serveur (voir /api/admin/agent/execute) pour
   continuer même si l'admin ferme la fenêtre.
════════════════════════════════════════════════════════════ */
import { supabase } from "@/lib/supabase";
import { fetchInscriptions } from "@/lib/admin";
import { fetchAllInvoices } from "@/lib/finance";

export type StepAction =
  | "valider_inscription"
  | "relance_documents"
  | "relance_paiement";
export type StepStatus = "attente" | "ok" | "echec" | "ignore";
export type TaskStatus = "planifie" | "en_cours" | "termine" | "echoue" | "annule";

export interface AgentStep {
  id: string;
  label: string;
  action: StepAction;
  target_id: string;           // inscription id
  params: Record<string, unknown>;
  selected: boolean;           // approuvée par l'admin ?
  status: StepStatus;
  result?: string;
}

export interface AgentTask {
  id: string;
  admin_id: string;
  kind: string;
  title: string;
  status: TaskStatus;
  steps: AgentStep[];
  progress: number;
  total: number;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

/** Pièces requises pour qu'un dossier de rentrée soit jugé complet. */
export const REQUIRED_DOCS: { kind: string; label: string }[] = [
  { kind: "acte_naissance", label: "Acte de naissance" },
  { kind: "diplome", label: "Diplôme / dernier titre" },
  { kind: "photo", label: "Photo d'identité" },
  { kind: "cni", label: "Pièce d'identité (CNI)" },
];

export interface PlanPreview {
  title: string;
  kind: string;
  steps: AgentStep[];
  /** Ligne descriptive des compteurs, propre à chaque flux. */
  note: string;
}

/**
 * Analyse les inscriptions EN ATTENTE et propose, pour chacune :
 *  • dossier complet  → valider l'inscription ;
 *  • dossier incomplet → relancer l'étudiant avec la liste des pièces manquantes.
 * Lecture seule : rien n'est modifié ici.
 */
export async function planRentreeInscriptions(): Promise<PlanPreview> {
  const pending = await fetchInscriptions("en_attente");

  // Documents non refusés, groupés par étudiant.
  const studentIds = Array.from(new Set(pending.map((p) => p.user_id)));
  const docsByStudent = new Map<string, Set<string>>();
  if (studentIds.length) {
    const { data } = await supabase
      .from("student_documents")
      .select("student_id,kind,status")
      .in("student_id", studentIds);
    for (const d of (data as { student_id: string; kind: string; status: string }[]) ?? []) {
      if (d.status === "refuse") continue;
      if (!docsByStudent.has(d.student_id)) docsByStudent.set(d.student_id, new Set());
      docsByStudent.get(d.student_id)!.add(d.kind);
    }
  }

  const steps: AgentStep[] = [];
  let complets = 0;
  let incomplets = 0;

  for (const ins of pending) {
    const have = docsByStudent.get(ins.user_id) ?? new Set<string>();
    const missing = REQUIRED_DOCS.filter((r) => !have.has(r.kind));
    const who = ins.user
      ? `${ins.user.first_name ?? ""} ${ins.user.last_name ?? ""}`.trim() || ins.user.email
      : "Étudiant";

    if (missing.length === 0) {
      complets++;
      steps.push({
        id: ins.id,
        label: `Valider l'inscription de ${who} — ${ins.parcours_title}`,
        action: "valider_inscription",
        target_id: ins.id,
        params: { user_id: ins.user_id, parcours_title: ins.parcours_title },
        selected: true,
        status: "attente",
      });
    } else {
      incomplets++;
      steps.push({
        id: ins.id,
        label: `Relancer ${who} — ${missing.length} pièce(s) manquante(s)`,
        action: "relance_documents",
        target_id: ins.id,
        params: {
          user_id: ins.user_id,
          parcours_title: ins.parcours_title,
          missing: missing.map((m) => m.label),
        },
        selected: true,
        status: "attente",
      });
    }
  }

  return {
    title: "Traitement des dossiers de rentrée",
    kind: "rentree_inscriptions",
    steps,
    note: `${pending.length} dossier(s) en attente · ${complets} complet(s) à valider · ${incomplets} à relancer. Décochez ce que vous ne voulez pas exécuter.`,
  };
}

/**
 * FLUX 1 — Relance des impayés.
 * Analyse les factures dues/partielles échues et propose une relance
 * personnalisée (montant, échéance) à chaque étudiant concerné. Lecture seule.
 */
export async function planRelanceImpayes(): Promise<PlanPreview> {
  const invoices = await fetchAllInvoices();
  const now = Date.now();
  const unpaid = invoices.filter((i) => i.status === "du" || i.status === "partiel");

  const steps: AgentStep[] = [];
  let echues = 0;
  for (const inv of unpaid) {
    const overdue = inv.due_date ? new Date(inv.due_date).getTime() < now : false;
    if (overdue) echues++;
    const montant = Number(inv.amount_fcfa ?? 0).toLocaleString("fr-FR");
    steps.push({
      id: inv.id,
      label: `Relancer le paiement « ${inv.label ?? "Scolarité"} » — ${montant} FCFA${overdue ? " (échu)" : ""}`,
      action: "relance_paiement",
      target_id: inv.id,
      params: {
        user_id: inv.student_id,
        label: inv.label ?? "Scolarité",
        montant,
        due_date: inv.due_date,
      },
      selected: overdue, // pré-cochées : seulement les factures échues
      status: "attente",
    });
  }

  return {
    title: "Relance des impayés",
    kind: "relance_impayes",
    steps,
    note: `${unpaid.length} facture(s) non soldée(s) · ${echues} échue(s) (pré-cochées). Décochez ce que vous ne voulez pas relancer.`,
  };
}

/* ── Persistance de la file ─────────────────────────────────── */

export async function createTask(
  adminId: string,
  plan: PlanPreview,
): Promise<AgentTask | null> {
  const selected = plan.steps.filter((s) => s.selected);
  const { data } = await supabase
    .from("agent_tasks")
    .insert({
      admin_id: adminId,
      kind: plan.kind,
      title: plan.title,
      status: "en_cours",
      steps: plan.steps,
      progress: 0,
      total: selected.length,
    })
    .select("*")
    .maybeSingle();
  return (data as AgentTask) ?? null;
}

export async function fetchTasks(adminId: string, limit = 20): Promise<AgentTask[]> {
  const { data } = await supabase
    .from("agent_tasks")
    .select("*")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AgentTask[]) ?? [];
}

export async function fetchTask(id: string): Promise<AgentTask | null> {
  const { data } = await supabase.from("agent_tasks").select("*").eq("id", id).maybeSingle();
  return (data as AgentTask) ?? null;
}

/** Abonnement temps réel aux changements des tâches d'un admin. */
export function subscribeTasks(adminId: string, onChange: () => void) {
  const ch = supabase
    .channel(`agent-tasks-${adminId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "agent_tasks", filter: `admin_id=eq.${adminId}` },
      () => onChange(),
    )
    .subscribe();
  return () => { void supabase.removeChannel(ch); };
}
