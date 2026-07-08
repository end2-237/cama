import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Agent d'administration CAMA — copilote de pilotage pour les administrateurs.
 *
 * POST /api/admin/agent
 * body: {
 *   question: string,
 *   context: string,   // instantané de données RÉELLES (stats, impayés, dossiers…)
 *   history?: { role: "user" | "assistant"; content: string }[]
 * }
 *
 * Réutilise l'API Groq (Llama 3.3 70B) comme le Prof IA. L'agent est ancré sur
 * l'instantané fourni (collecté côté client AVEC les droits/RLS de l'admin) : il
 * analyse, synthétise et propose des actions, mais ne modifie RIEN lui-même —
 * toute action reste validée puis exécutée par l'admin dans l'interface.
 * Sans GROQ_API_KEY : renvoie 503 et le front retombe sur un résumé local.
 */

interface AgentBody {
  question?: string;
  context?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GROQ_API_KEY non configurée", fallback: true },
      { status: 503 },
    );
  }

  let body: AgentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) return NextResponse.json({ error: "Question vide" }, { status: 400 });

  const context = (body.context ?? "").slice(0, 8000); // garde-fou tokens
  const history = (body.history ?? []).slice(-8);

  const system = [
    `Tu es « l'Agent d'administration » de la plateforme CAMA, système d'information académique de l'Institut JFN (Cameroun).`,
    `Tu assistes un ADMINISTRATEUR dans le pilotage de l'établissement.`,
    ``,
    `INSTANTANÉ DE DONNÉES RÉELLES (collecté à l'instant avec les droits de l'admin) :`,
    `"""`,
    context || "(aucune donnée fournie)",
    `"""`,
    ``,
    `PÉRIMÈTRE : utilisateurs & rôles, dossiers/inscriptions, structure académique,`,
    `promotions & cohortes, planification & salles, finance & paiements, corps`,
    `enseignant, qualité & jury, diplômes, communication, statistiques, audit.`,
    ``,
    `RÈGLES :`,
    `- Appuie tes réponses sur l'instantané ci-dessus et CITE les chiffres réels quand ils existent.`,
    `- Si une donnée manque, dis-le et indique dans quelle page de l'admin la trouver (ex. « Admin → Finance »).`,
    `- Tu ne modifies RIEN toi-même : pour toute action (relance, validation, publication…), tu PROPOSES une marche à suivre claire que l'admin exécutera. Jamais de suppression massive ni de changement financier sans validation humaine explicite.`,
    `- Reste strictement dans le périmètre administratif de CAMA ; pas de conseil hors sujet.`,
    `- Contexte camerounais/africain : sois concret et pragmatique.`,
    `- Réponds en français, concis, en markdown léger (listes, **gras**). Pas de pavés inutiles.`,
  ].join("\n");

  const messages = [
    { role: "system", content: system },
    ...history,
    { role: "user", content: question },
  ];

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        top_p: 0.9,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Groq ${res.status}`, detail: detail.slice(0, 300), fallback: true },
        { status: 502 },
      );
    }

    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ answer, model: GROQ_MODEL, provider: "groq" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur Groq", fallback: true },
      { status: 502 },
    );
  }
}
