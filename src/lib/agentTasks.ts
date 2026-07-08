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
  | "relance_paiement"
  | "relance_saisie_notes"
  | "signaler_conflit_salle"
  | "preparer_deliberation"
  | "notifier_passage";
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

/**
 * FLUX 2 — Relance de la saisie des notes.
 * Repère les cours affectés à un enseignant qui n'ont encore aucune note
 * saisie (aucune ligne de bulletin) et propose de relancer l'enseignant.
 */
export async function planRelanceSaisieNotes(): Promise<PlanPreview> {
  const { data: courses } = await supabase
    .from("program_courses")
    .select("id,title,code,teacher_id,parcours_title")
    .not("teacher_id", "is", null);
  const list = (courses as { id: string; title: string; code: string; teacher_id: string; parcours_title: string }[]) ?? [];

  const { data: lines } = await supabase.from("transcript_lines").select("program_course_id");
  const withNotes = new Set(
    ((lines as { program_course_id: string | null }[]) ?? [])
      .map((l) => l.program_course_id).filter(Boolean) as string[],
  );

  // Noms des enseignants.
  const teacherIds = Array.from(new Set(list.map((c) => c.teacher_id)));
  const nameById = new Map<string, string>();
  if (teacherIds.length) {
    const { data: us } = await supabase.from("users").select("id,first_name,last_name").in("id", teacherIds);
    for (const u of (us as { id: string; first_name: string; last_name: string }[]) ?? []) {
      nameById.set(u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim());
    }
  }

  const steps: AgentStep[] = [];
  for (const c of list) {
    if (withNotes.has(c.id)) continue;
    const prof = nameById.get(c.teacher_id) || "l'enseignant";
    steps.push({
      id: c.id,
      label: `Relancer ${prof} — notes non saisies pour « ${c.title} » (${c.code})`,
      action: "relance_saisie_notes",
      target_id: c.id,
      params: { teacher_id: c.teacher_id, course_title: c.title, course_code: c.code },
      selected: true,
      status: "attente",
    });
  }

  return {
    title: "Relance de la saisie des notes",
    kind: "relance_saisie_notes",
    steps,
    note: `${list.length} cours affecté(s) · ${steps.length} sans notes saisies. Décochez ce que vous ne voulez pas relancer.`,
  };
}

/**
 * FLUX 3 — Détection des conflits de salles.
 * Analyse les réservations hebdomadaires et signale les chevauchements
 * (même salle, même jour, plages horaires qui se recoupent).
 */
export async function planConflitsSalles(): Promise<PlanPreview> {
  const { data } = await supabase
    .from("room_bookings")
    .select("id,room_id,title,day,start_time,end_time,booked_by")
    .not("start_time", "is", null);
  const bookings = (data as {
    id: string; room_id: string; title: string | null; day: number | null;
    start_time: string | null; end_time: string | null; booked_by: string | null;
  }[]) ?? [];

  // Nom des salles.
  const roomIds = Array.from(new Set(bookings.map((b) => b.room_id).filter(Boolean)));
  const roomName = new Map<string, string>();
  if (roomIds.length) {
    const { data: rs } = await supabase.from("rooms").select("id,name").in("id", roomIds);
    for (const r of (rs as { id: string; name: string }[]) ?? []) roomName.set(r.id, r.name);
  }

  const overlap = (a: typeof bookings[number], b: typeof bookings[number]) =>
    a.room_id === b.room_id && a.day === b.day &&
    !!a.start_time && !!a.end_time && !!b.start_time && !!b.end_time &&
    a.start_time < b.end_time! && b.start_time! < a.end_time!;

  const steps: AgentStep[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i], b = bookings[j];
      if (!overlap(a, b)) continue;
      const key = [a.id, b.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const salle = roomName.get(a.room_id) || "une salle";
      const detail = `${salle} — « ${a.title ?? "cours"} » et « ${b.title ?? "cours"} » se chevauchent (${a.start_time}-${a.end_time}).`;
      steps.push({
        id: key,
        label: `Conflit : ${detail}`,
        action: "signaler_conflit_salle",
        target_id: a.id,
        params: { booker_ids: [a.booked_by, b.booked_by].filter(Boolean), detail },
        selected: true,
        status: "attente",
      });
    }
  }

  return {
    title: "Détection des conflits de salles",
    kind: "conflits_salles",
    steps,
    note: `${bookings.length} réservation(s) analysée(s) · ${steps.length} conflit(s) détecté(s). L'agent signalera chaque conflit aux responsables.`,
  };
}

/**
 * FLUX 4 — Préparation des dossiers de délibération.
 * Liste les relevés sans décision et prépare le jury (notification aux
 * membres). PRÉPARATION uniquement : la décision reste 100 % humaine.
 */
export async function planPreparationDeliberation(): Promise<PlanPreview> {
  const { data } = await supabase
    .from("transcripts")
    .select("id,student_id,academic_year,semester,decision")
    .is("decision", null);
  const pend = (data as { id: string; student_id: string; academic_year: string; semester: number }[]) ?? [];

  // Membres du jury (destinataires de la préparation).
  const { data: jm } = await supabase.from("jury_members").select("user_id");
  const juryIds = Array.from(new Set(((jm as { user_id: string | null }[]) ?? []).map((m) => m.user_id).filter(Boolean))) as string[];

  // Noms étudiants.
  const sids = Array.from(new Set(pend.map((t) => t.student_id)));
  const sname = new Map<string, string>();
  if (sids.length) {
    const { data: us } = await supabase.from("users").select("id,first_name,last_name").in("id", sids);
    for (const u of (us as { id: string; first_name: string; last_name: string }[]) ?? []) {
      sname.set(u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim());
    }
  }

  const steps: AgentStep[] = pend.map((t) => ({
    id: t.id,
    label: `Préparer la délibération — ${sname.get(t.student_id) || "étudiant"} (${t.academic_year} S${t.semester})`,
    action: "preparer_deliberation" as StepAction,
    target_id: t.id,
    params: { student_id: t.student_id, student_name: sname.get(t.student_id) || "un étudiant", jury_ids: juryIds },
    selected: true,
    status: "attente",
  }));

  return {
    title: "Préparation des délibérations",
    kind: "preparation_deliberation",
    steps,
    note: `${pend.length} relevé(s) sans décision · ${juryIds.length} membre(s) de jury à informer. Préparation uniquement — le jury décide.`,
  };
}

/**
 * FLUX 5 — Passage de niveau (notification).
 * À partir des décisions « admis », notifie les étudiants de leur passage.
 * SENSIBLE : étapes décochées par défaut (double validation de l'admin).
 */
export async function planPassageNiveau(): Promise<PlanPreview> {
  const { data } = await supabase
    .from("transcripts")
    .select("id,student_id,academic_year,decision")
    .eq("decision", "admis");
  const admis = (data as { id: string; student_id: string; academic_year: string }[]) ?? [];

  const sids = Array.from(new Set(admis.map((t) => t.student_id)));
  const sname = new Map<string, string>();
  if (sids.length) {
    const { data: us } = await supabase.from("users").select("id,first_name,last_name").in("id", sids);
    for (const u of (us as { id: string; first_name: string; last_name: string }[]) ?? []) {
      sname.set(u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim());
    }
  }

  const steps: AgentStep[] = admis.map((t) => ({
    id: t.id,
    label: `Notifier le passage — ${sname.get(t.student_id) || "étudiant"} (${t.academic_year})`,
    action: "notifier_passage" as StepAction,
    target_id: t.id,
    params: { student_id: t.student_id, academic_year: t.academic_year },
    selected: false, // action sensible : décochée par défaut
    status: "attente",
  }));

  return {
    title: "Passage de niveau",
    kind: "passage_niveau",
    steps,
    note: `${admis.length} étudiant(s) admis. Action sensible : cochez explicitement chaque passage à notifier.`,
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
