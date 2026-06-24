import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Transcription vidéo/audio → texte via Groq Whisper.
 *
 * POST /api/ai/transcribe
 * Content-Type: multipart/form-data
 * body: file (video/audio file, max ~25 Mo)
 *
 * Groq expose Whisper large-v3 turbo — gratuit jusqu'à 28 800 secondes
 * d'audio par jour. Renvoie la transcription en texte brut.
 * Sans GROQ_API_KEY, renvoie 503 pour que le front affiche un placeholder.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GROQ_API_KEY non configurée", transcript: null },
      { status: 503 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 });
    }

    const groqForm = new FormData();
    groqForm.append("file", file, file.name);
    groqForm.append("model", GROQ_MODEL);
    groqForm.append("language", "fr");
    groqForm.append("response_format", "text");

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: groqForm,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Groq Whisper ${res.status}`, detail: detail.slice(0, 300), transcript: null },
        { status: 502 },
      );
    }

    const transcript = (await res.text()).trim();
    return NextResponse.json({ transcript, model: GROQ_MODEL });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de transcription", transcript: null },
      { status: 500 },
    );
  }
}
