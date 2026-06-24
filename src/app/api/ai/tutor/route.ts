import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Prof IA — tuteur ancré sur les ressources réelles du cours.
 *
 * POST /api/ai/tutor
 * body: {
 *   question: string,
 *   courseTitle: string,
 *   chapterTitle: string,
 *   context: string,          // transcription vidéo + blocs du cours natif (le « réel »)
 *   history?: { role: "user" | "assistant"; content: string }[]
 * }
 *
 * Utilise l'API Groq (https://groq.com — gratuite, ultra-rapide) avec le
 * modèle Llama 3.3 70B. Le tuteur est strictement ancré sur le `context`
 * fourni (transcription réelle + cours natif) : il reformule, approfondit et
 * vulgarise SANS inventer hors des ressources. Sans GROQ_API_KEY, l'appel
 * renvoie 503 et le front retombe sur le moteur local de secours.
 */

interface TutorBody {
  question?: string;
  courseTitle?: string;
  chapterTitle?: string;
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

  let body: TutorBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) return NextResponse.json({ error: "Question vide" }, { status: 400 });

  const courseTitle = body.courseTitle ?? "ce cours";
  const chapterTitle = body.chapterTitle ?? "ce chapitre";
  const context = (body.context ?? "").slice(0, 8000); // garde-fou tokens
  const history = (body.history ?? []).slice(-8);

  const system = [
    `Tu es « Prof IA », un tuteur pédagogique de l'Institut JFN (Cameroun) intégré à la plateforme CAMA.`,
    `Tu accompagnes un étudiant sur le cours « ${courseTitle} », chapitre « ${chapterTitle} ».`,
    ``,
    `RESSOURCES RÉELLES DU CHAPITRE (transcription vidéo + cours natif déposés par l'enseignant) :`,
    `"""`,
    context || "(aucune ressource fournie)",
    `"""`,
    ``,
    `RÈGLES :`,
    `- Ancre tes réponses sur ces ressources. Tu peux reformuler, vulgariser, donner des analogies, des exemples concrets et approfondir, MAIS reste fidèle au contenu réel ci-dessus.`,
    `- Si la question sort clairement du périmètre des ressources, dis-le honnêtement et propose de revenir au chapitre plutôt que d'inventer.`,
    `- Adapte-toi au contexte camerounais (faible débit, téléphones d'entrée de gamme) quand c'est pertinent.`,
    `- Explique « avec d'autres mots » pour une meilleure compréhension : étapes claires, exemples, et propose un mini-exercice ou un résumé quand c'est utile.`,
    `- Réponds en français, de façon chaleureuse et concise (pas de pavés inutiles). Utilise le markdown léger (listes, **gras**).`,
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
        temperature: 0.4,
        max_tokens: 900,
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
