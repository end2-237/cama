/* ════════════════════════════════════════════════════════════
   AGENT D'ADMINISTRATION — client

   • buildAdminContext()  : collecte un instantané compact de données RÉELLES
     via les libs existantes (donc avec les droits/RLS de l'admin connecté).
   • askAdminAgent()      : envoie question + instantané à /api/admin/agent.
     En cas d'indisponibilité (pas de clé Groq), repli sur un résumé local.

   L'agent NE MODIFIE RIEN : il lit, analyse et propose. Toute action reste
   exécutée par l'admin dans l'interface.
════════════════════════════════════════════════════════════ */
import { fetchAdminStats } from "@/lib/admin";
import { fetchAllInvoices } from "@/lib/finance";

export interface AgentTurn {
  role: "user" | "assistant";
  content: string;
}

/** Construit un instantané texte des indicateurs clés (best-effort, tolérant aux erreurs). */
export async function buildAdminContext(): Promise<string> {
  const lines: string[] = [];

  try {
    const s = await fetchAdminStats();
    lines.push(
      `Effectifs : ${s.students} étudiants, ${s.teachers} enseignants.`,
      `Dossiers d'inscription : ${s.pending} en attente, ${s.validated} validés.`,
    );
  } catch {
    lines.push("Statistiques d'effectifs indisponibles pour le moment.");
  }

  try {
    const invoices = await fetchAllInvoices();
    const active = invoices.filter((i) => i.status !== "annule");
    const unpaid = active.filter((i) => i.status === "du" || i.status === "partiel");
    const due = unpaid.reduce((sum, i) => sum + Number(i.amount_fcfa ?? 0), 0);
    lines.push(
      `Facturation : ${active.length} factures actives, ${unpaid.length} non soldées (dues/partielles).`,
      `Montant facturé non soldé : ${due.toLocaleString("fr-FR")} FCFA.`,
    );
  } catch {
    lines.push("Données financières indisponibles pour le moment.");
  }

  return lines.join("\n");
}

/** Résumé local de secours quand l'API Groq n'est pas configurée. */
function localFallback(context: string): string {
  return [
    "L'IA générative n'est pas configurée sur ce serveur (clé Groq absente).",
    "Voici toutefois l'instantané des indicateurs de pilotage :",
    "",
    context || "(aucune donnée disponible)",
    "",
    "Pour agir : rendez-vous dans les sections **Admin → Finance / Utilisateurs / Suivi**.",
  ].join("\n");
}

export async function askAdminAgent(
  question: string,
  context: string,
  history: AgentTurn[] = [],
): Promise<{ answer: string; fallback: boolean }> {
  try {
    const res = await fetch("/api/admin/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context, history }),
    });
    if (res.ok) {
      const data = await res.json();
      const answer = (data?.answer ?? "").trim();
      if (answer) return { answer, fallback: false };
    }
    // 503/502 → repli local
    return { answer: localFallback(context), fallback: true };
  } catch {
    return { answer: localFallback(context), fallback: true };
  }
}
