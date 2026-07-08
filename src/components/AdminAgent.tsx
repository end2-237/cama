"use client";

/* ════════════════════════════════════════════════════════════
   AGENT D'ADMINISTRATION — panneau latéral (admin uniquement).

   Design calqué sur le panneau « Tâches en arrière-plan » de Claude Code :
   • un petit bouton flottant l'ouvre (comme le bouton des tâches) ;
   • panneau qui glisse depuis la droite ;
   • EN HAUT : titre + petit bouton « Tâches » (historique des échanges) ;
   • AU MILIEU : la conversation, texte centré à l'état vide ;
   • EN BAS : un simple champ de saisie.

   Activé/désactivé via le toggle des paramètres admin (localStorage
   « cama.admin.agent »). L'agent lit et propose — il ne modifie rien.
════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, X, Send, ListChecks, MessageSquarePlus, ArrowLeft, Loader2, Bot,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminAgentEnabled } from "@/hooks/useAdminAgentEnabled";
import { buildAdminContext, askAdminAgent, type AgentTurn } from "@/lib/adminAgent";

const HISTORY_KEY = "cama.admin.agent.history";

const SUGGESTIONS = [
  "Combien de dossiers sont en attente de validation ?",
  "Quel est le montant des impayés ?",
  "Résume l'état de l'établissement.",
  "Que dois-je traiter en priorité aujourd'hui ?",
];

function renderMarkdownLite(text: string) {
  // Gras **…** minimal, le reste en texte brut multi-lignes.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>,
  );
}

export default function AdminAgent() {
  const { user } = useAuth();
  const [enabled] = useAdminAgentEnabled();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "tasks">("chat");
  const [turns, setTurns] = useState<AgentTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Historique persistant (les « tâches »).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setTurns(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(turns.slice(-40))); } catch { /* ignore */ }
  }, [turns]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  if (!user || user.role !== "admin" || !enabled) return null;

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setView("chat");
    const history = turns.slice(-8);
    setTurns((t) => [...t, { role: "user", content: q }]);
    setBusy(true);
    try {
      const context = await buildAdminContext();
      const { answer } = await askAdminAgent(q, context, history);
      setTurns((t) => [...t, { role: "assistant", content: answer }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: "Une erreur est survenue. Réessayez." }]);
    } finally {
      setBusy(false);
    }
  }

  const userTasks = turns.filter((t) => t.role === "user");

  return (
    <>
      {/* Petit bouton flottant — ouvre le panneau (style « tâches en arrière-plan »). */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 left-5 z-50 h-11 pl-3 pr-4 rounded-full bg-ink text-white flex items-center gap-2 shadow-lg hover:bg-black transition-colors"
          title="Agent d'administration">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold">Agent</span>
        </button>
      )}

      {/* Panneau latéral droit. */}
      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/20" onClick={() => setOpen(false)} />
          <aside className="fixed right-0 top-0 z-[61] h-full w-full sm:w-[400px] bg-white border-l border-border flex flex-col animate-slide-in-left shadow-2xl">
            {/* EN HAUT : titre + bouton Tâches + fermer */}
            <header className="flex items-center gap-2 px-4 h-14 border-b border-border">
              <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
                <Bot className="w-4 h-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink leading-none">Agent d'administration</p>
                <p className="text-[10px] text-text-subtle mt-0.5">Lit &amp; propose · n'exécute rien sans vous</p>
              </div>
              <button
                onClick={() => setView(view === "tasks" ? "chat" : "tasks")}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${view === "tasks" ? "bg-cama-50 text-cama" : "hover:bg-bg-surface text-text-muted"}`}
                title="Tâches (historique)">
                <ListChecks className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg hover:bg-bg-surface flex items-center justify-center text-text-muted" title="Fermer">
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* AU MILIEU : conversation ou liste des tâches */}
            {view === "tasks" ? (
              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center justify-between px-1 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">Tâches récentes</span>
                  <button onClick={() => setView("chat")} className="text-[11px] text-cama flex items-center gap-1 hover:underline">
                    <ArrowLeft className="w-3 h-3" /> Retour
                  </button>
                </div>
                {userTasks.length === 0 ? (
                  <p className="text-xs text-text-subtle text-center mt-10">Aucune tâche pour le moment.</p>
                ) : (
                  <ul className="space-y-1">
                    {userTasks.slice().reverse().map((t, i) => (
                      <li key={i}>
                        <button
                          onClick={() => send(t.content)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-bg-surface flex items-start gap-2 group">
                          <MessageSquarePlus className="w-3.5 h-3.5 text-text-subtle mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-ink line-clamp-2 group-hover:text-cama">{t.content}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {turns.length === 0 ? (
                  // État vide : texte centré au milieu.
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-cama-50 flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-cama" />
                    </div>
                    <p className="text-sm font-semibold text-ink">Comment puis-je vous aider ?</p>
                    <p className="text-xs text-text-subtle mt-1 max-w-[260px]">
                      Interrogez vos données en langage naturel : effectifs, dossiers, impayés, priorités…
                    </p>
                    <div className="mt-4 grid gap-1.5 w-full max-w-[300px]">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => send(s)}
                          className="text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-cama hover:bg-cama-50 text-text-muted hover:text-cama transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  turns.map((t, i) => (
                    <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                        t.role === "user"
                          ? "bg-cama text-white rounded-br-sm"
                          : "bg-bg-surface text-ink rounded-bl-sm border border-border"
                      }`}>
                        {t.role === "assistant" ? renderMarkdownLite(t.content) : t.content}
                      </div>
                    </div>
                  ))
                )}
                {busy && (
                  <div className="flex justify-start">
                    <div className="bg-bg-surface border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2 text-xs text-text-muted">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cama" /> Analyse des données…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* EN BAS : champ de saisie */}
            <div className="border-t border-border p-3">
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-end gap-2 bg-bg-surface rounded-xl border border-border px-3 py-2 focus-within:border-cama transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  placeholder="Posez une question sur l'établissement…"
                  className="flex-1 bg-transparent text-sm text-ink placeholder:text-text-subtle resize-none outline-none max-h-24" />
                <button type="submit" disabled={busy || !input.trim()}
                  className="h-8 w-8 rounded-lg bg-cama text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <p className="text-[10px] text-text-subtle text-center mt-1.5">
                L'agent propose — vous validez et exécutez dans l'interface.
              </p>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
