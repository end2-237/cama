"use client";

/* ════════════════════════════════════════════════════════════
   AGENT D'ADMINISTRATION — panneau latéral semi-autonome (admin only).

   Design calqué sur « Tâches en arrière-plan » de Claude Code :
   • petit bouton flottant → ouvre le panneau depuis la droite ;
   • EN HAUT : titre + bouton « Tâches » (exécutions en arrière-plan) ;
   • AU MILIEU : conversation / plan d'action à approuver ;
   • EN BAS : champ de saisie.

   Flux semi-autonome : l'agent PROPOSE un plan → l'admin APPROUVE (cases) →
   le serveur EXÉCUTE en arrière-plan → la progression s'affiche dans « Tâches ».
   Périmètre = droits de l'admin ; rien n'est exécuté sans approbation.
════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Sparkles, X, Send, ListChecks, ArrowLeft, Loader2, Bot, Play,
  CheckCircle2, XCircle, Clock, Zap, RotateCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminAgentEnabled } from "@/hooks/useAdminAgentEnabled";
import { buildAdminContext, askAdminAgent, type AgentTurn } from "@/lib/adminAgent";
import {
  planRentreeInscriptions, planRelanceImpayes, planRelanceSaisieNotes,
  planConflitsSalles, planPreparationDeliberation, planPassageNiveau,
  planRappelEcheances, planBienvenueNouveaux,
  createTask, fetchTasks, subscribeTasks,
  type PlanPreview, type AgentTask, type AgentStep,
} from "@/lib/agentTasks";

/* Exemples d'instructions en langage naturel (l'agent comprend l'intention). */
const EXAMPLES = [
  "Traite les dossiers de rentrée",
  "Relance les étudiants qui n'ont pas payé",
  "Rappelle les échéances de paiement",
  "Relance les enseignants qui n'ont pas saisi les notes",
  "Souhaite la bienvenue aux nouveaux inscrits",
  "Combien de dossiers sont en attente ?",
];

/* Libellé court par type d'action (badge du plan). */
const ACTION_LABEL: Record<string, string> = {
  valider_inscription: "Validation",
  relance_documents: "Relance",
  relance_paiement: "Relance paiement",
  relance_saisie_notes: "Relance notes",
  signaler_conflit_salle: "Conflit salle",
  preparer_deliberation: "Délibération",
  notifier_passage: "Passage",
  rappel_echeance: "Rappel échéance",
  message_bienvenue: "Bienvenue",
};

/* Catalogue des flux semi-autonomes + mots-clés pour la détection d'intention. */
const FLOWS: { id: string; label: string; planner: () => Promise<PlanPreview>; keywords: string[] }[] = [
  { id: "rentree", label: "Traitement des dossiers de rentrée", planner: planRentreeInscriptions,
    keywords: ["dossier", "rentree", "inscription", "admission", "valider les dossier", "valide les dossier"] },
  { id: "echeances", label: "Rappel des échéances de paiement", planner: planRappelEcheances,
    keywords: ["echeance", "rappel", "avant echeance", "paiement a venir", "rappelle"] },
  { id: "impayes", label: "Relance des impayés", planner: planRelanceImpayes,
    keywords: ["impaye", "recouvrement", "pas paye", "n'ont pas paye", "ont pas paye", "relance paiement", "relance le paiement", "facture echue"] },
  { id: "notes", label: "Relance de la saisie des notes", planner: planRelanceSaisieNotes,
    keywords: ["note", "saisie", "saisi les note", "relance enseignant", "relance les enseignant", "bulletin manquant"] },
  { id: "salles", label: "Détection des conflits de salles", planner: planConflitsSalles,
    keywords: ["salle", "conflit", "emploi du temps", "planning", "chevauchement"] },
  { id: "delib", label: "Préparation des délibérations", planner: planPreparationDeliberation,
    keywords: ["deliberation", "delibere", "jury", "releve a statuer"] },
  { id: "passage", label: "Passage de niveau", planner: planPassageNiveau,
    keywords: ["passage", "admis", "niveau superieur", "promotion", "faire passer"] },
  { id: "bienvenue", label: "Message de bienvenue aux nouveaux", planner: planBienvenueNouveaux,
    keywords: ["bienvenue", "nouveaux", "accueil", "accueillir", "souhaite la bienvenue"] },
];

/** Normalise (minuscules, sans accents) pour la détection d'intention. */
function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
/** Retourne le flux correspondant à l'intention du message, ou null. */
function matchIntent(text: string) {
  const t = norm(text);
  for (const f of FLOWS) {
    if (f.keywords.some((k) => t.includes(norm(k)))) return f;
  }
  return null;
}

function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}

const STATUS_META: Record<AgentTask["status"], { label: string; cls: string; icon: typeof Clock }> = {
  planifie: { label: "Planifiée", cls: "text-text-muted", icon: Clock },
  en_cours: { label: "En cours", cls: "text-cama", icon: Loader2 },
  termine:  { label: "Terminée", cls: "text-green-700", icon: CheckCircle2 },
  echoue:   { label: "Échouée", cls: "text-red-600", icon: XCircle },
  annule:   { label: "Annulée", cls: "text-text-subtle", icon: XCircle },
};

export default function AdminAgent() {
  const { user } = useAuth();
  const [enabled] = useAdminAgentEnabled();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "tasks">("chat");
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [plan, setPlan] = useState<PlanPreview | null>(null);
  const [planning, setPlanning] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const adminId = user?.id ?? "";

  const reloadTasks = useCallback(async () => {
    if (!adminId) return;
    setTasks(await fetchTasks(adminId));
  }, [adminId]);

  // Temps réel sur les tâches en arrière-plan.
  useEffect(() => {
    if (!adminId || !enabled) return;
    reloadTasks();
    const unsub = subscribeTasks(adminId, reloadTasks);
    return unsub;
  }, [adminId, enabled, reloadTasks]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy, plan]);

  if (!user || user.role !== "admin" || !enabled) return null;

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || busy || planning) return;
    setInput("");

    // 1) L'agent comprend l'intention : si le message correspond à un flux,
    //    il prépare directement le plan (à approuver). Sinon → questions/réponses.
    const flow = matchIntent(q);
    if (flow) { await startFlow(flow.id, q); return; }

    setView("chat"); setPlan(null);
    const history = turns.slice(-8);
    setTurns((t) => [...t, { role: "user", content: q }]);
    setBusy(true);
    try {
      const context = await buildAdminContext();
      const { answer } = await askAdminAgent(q, context, history);
      setTurns((t) => [...t, { role: "assistant", content: answer }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: "Une erreur est survenue. Réessayez." }]);
    } finally { setBusy(false); }
  }

  // ── Flux semi-autonome : construire un plan (depuis une intention détectée) ──
  async function startFlow(flowId: string, fromMessage?: string) {
    const flow = FLOWS.find((f) => f.id === flowId);
    if (!flow) return;
    setPlanning(flowId); setView("chat");
    setTurns(fromMessage ? [
      { role: "user", content: fromMessage },
      { role: "assistant", content: `Compris. J'ai préparé un plan pour « ${flow.label} » — vérifiez les étapes ci-dessous puis approuvez.` },
    ] : []);
    try {
      setPlan(await flow.planner());
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: "Impossible de construire le plan (données inaccessibles)." }]);
    } finally { setPlanning(null); }
  }

  function toggleStep(id: string) {
    setPlan((p) => p ? { ...p, steps: p.steps.map((s) => s.id === id ? { ...s, selected: !s.selected } : s) } : p);
  }

  // ── Approuver → créer la tâche → lancer l'exécution serveur ──
  async function approveAndRun() {
    if (!plan || !adminId) return;
    const selected = plan.steps.filter((s) => s.selected);
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const task = await createTask(adminId, plan);
      setPlan(null); setView("tasks");
      await reloadTasks();
      if (task) {
        // Exécution en arrière-plan (le serveur écrit la progression ; le
        // panneau la suit en temps réel). On ne bloque pas l'UI.
        void fetch("/api/admin/agent/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: task.id, requesterId: adminId }),
        }).then(reloadTasks).catch(() => {});
      }
    } finally { setBusy(false); }
  }

  // Relancer une tâche inachevée (idempotent côté serveur).
  async function resumeTask(id: string) {
    void fetch("/api/admin/agent/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: id, requesterId: adminId }),
    }).then(reloadTasks).catch(() => {});
  }

  const selectedCount = plan?.steps.filter((s) => s.selected).length ?? 0;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-5 left-5 z-50 h-11 pl-3 pr-4 rounded-full bg-ink text-white flex items-center gap-2 shadow-lg hover:bg-black transition-colors"
          title="Agent d'administration">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold">Agent</span>
          {tasks.some((t) => t.status === "en_cours") && (
            <span className="w-2 h-2 rounded-full bg-cama animate-pulse" />
          )}
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setOpen(false)} />
          <aside className="fixed right-0 top-0 z-[61] h-full w-full sm:w-[420px] bg-white border-l border-border flex flex-col animate-slide-in-left shadow-2xl">
            {/* EN HAUT */}
            <header className="flex items-center gap-2 px-4 h-14 border-b border-border">
              <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
                <Bot className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink leading-none">Agent d'administration</p>
                <p className="text-[10px] text-text-subtle mt-0.5">Propose &amp; exécute avec votre accord</p>
              </div>
              <button onClick={() => setView(view === "tasks" ? "chat" : "tasks")}
                className={`relative h-8 px-2 rounded-lg flex items-center gap-1 transition-colors ${view === "tasks" ? "bg-cama-50 text-cama" : "hover:bg-bg-surface text-text-muted"}`}
                title="Tâches en arrière-plan">
                <ListChecks className="w-4 h-4" />
                {tasks.length > 0 && <span className="text-[10px] font-bold">{tasks.length}</span>}
              </button>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg hover:bg-bg-surface flex items-center justify-center text-text-muted" title="Fermer">
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* ── VUE TÂCHES (exécutions en arrière-plan) ── */}
            {view === "tasks" ? (
              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center justify-between px-1 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">Tâches en arrière-plan</span>
                  <button onClick={() => setView("chat")} className="text-[11px] text-cama flex items-center gap-1 hover:underline">
                    <ArrowLeft className="w-3 h-3" /> Retour
                  </button>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-xs text-text-subtle text-center mt-10">Aucune tâche lancée.</p>
                ) : (
                  <ul className="space-y-2">
                    {tasks.map((t) => {
                      const m = STATUS_META[t.status];
                      const Icon = m.icon;
                      const pct = t.total > 0 ? Math.round((t.progress / t.total) * 100) : 0;
                      return (
                        <li key={t.id} className="border border-border rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${m.cls} ${t.status === "en_cours" ? "animate-spin" : ""}`} />
                            <p className="text-xs font-semibold text-ink flex-1 min-w-0 truncate">{t.title}</p>
                            <span className={`text-[10px] font-bold ${m.cls}`}>{m.label}</span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-bg-surface overflow-hidden">
                            <div className="h-full bg-cama transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-text-subtle mt-1">
                            {t.progress}/{t.total} étape(s){t.summary ? ` · ${t.summary}` : ""}
                          </p>
                          {(t.status === "en_cours" || t.status === "echoue") && t.progress < t.total && (
                            <button onClick={() => resumeTask(t.id)}
                              className="mt-2 text-[11px] text-cama flex items-center gap-1 hover:underline">
                              <RotateCw className="w-3 h-3" /> Reprendre
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : plan ? (
              /* ── VUE PLAN À APPROUVER ── */
              <div className="flex-1 overflow-y-auto p-3">
                <div className="bg-cama-50 border border-cama/20 rounded-xl p-3 mb-3">
                  <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cama" /> {plan.title}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">{plan.note}</p>
                </div>
                {plan.steps.length === 0 ? (
                  <p className="text-xs text-text-subtle text-center mt-8">Aucun dossier en attente. Rien à faire 🎉</p>
                ) : (
                  <ul className="space-y-1.5">
                    {plan.steps.map((s: AgentStep) => (
                      <li key={s.id}>
                        <label className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-bg-surface cursor-pointer">
                          <input type="checkbox" checked={s.selected} onChange={() => toggleStep(s.id)}
                            className="mt-0.5 accent-[#4F46E5]" />
                          <div className="min-w-0">
                            <p className="text-xs text-ink">{s.label}</p>
                            <span className={`text-[10px] font-semibold ${s.action === "valider_inscription" ? "text-green-700" : "text-gold-dark"}`}>
                              {ACTION_LABEL[s.action] ?? "Action"}
                            </span>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setPlan(null)} className="flex-1 text-xs font-semibold py-2 rounded-lg border border-border text-text-muted hover:bg-bg-surface">
                    Annuler
                  </button>
                  <button onClick={approveAndRun} disabled={busy || selectedCount === 0}
                    className="flex-1 text-xs font-bold py-2 rounded-lg bg-cama text-white hover:bg-cama-700 disabled:opacity-40 flex items-center justify-center gap-1.5">
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Approuver &amp; lancer ({selectedCount})
                  </button>
                </div>
              </div>
            ) : (
              /* ── VUE CHAT ── */
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {turns.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-cama-50 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-cama" />
                    </div>
                    <p className="text-sm font-semibold text-ink">Dites-moi ce qu'il faut faire</p>
                    <p className="text-xs text-text-subtle mt-1 max-w-[290px]">
                      Écrivez votre demande en langage naturel : je comprends l'intention,
                      je prépare le plan et je l'exécute après votre validation.
                    </p>

                    <div className="mt-4 grid gap-1.5 w-full max-w-[320px]">
                      {EXAMPLES.map((s) => (
                        <button key={s} onClick={() => send(s)} disabled={planning !== null}
                          className="text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-cama hover:bg-cama-50 text-text-muted hover:text-cama disabled:opacity-50 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  turns.map((t, i) => (
                    <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                        t.role === "user" ? "bg-cama text-white rounded-br-sm" : "bg-bg-surface text-ink rounded-bl-sm border border-border"
                      }`}>
                        {t.role === "assistant" ? renderMarkdownLite(t.content) : t.content}
                      </div>
                    </div>
                  ))
                )}
                {busy && !plan && (
                  <div className="flex justify-start">
                    <div className="bg-bg-surface border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2 text-xs text-text-muted">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cama" /> Analyse des données…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* EN BAS */}
            <div className="border-t border-border p-3">
              <form onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-end gap-2 bg-bg-surface rounded-xl border border-border px-3 py-2 focus-within:border-cama transition-colors">
                <textarea value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1} placeholder="Posez une question sur l'établissement…"
                  className="flex-1 bg-transparent text-sm text-ink placeholder:text-text-subtle resize-none outline-none max-h-24" />
                <button type="submit" disabled={busy || !input.trim()}
                  className="h-8 w-8 rounded-lg bg-cama text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <p className="text-[10px] text-text-subtle text-center mt-1.5">
                L'agent agit dans votre périmètre · tout est tracé dans l'audit.
              </p>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
