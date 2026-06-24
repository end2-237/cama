import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * CAMA Search — recherche web via Brave Search API.
 * GET /api/search?q=...&count=10
 * Nécessite la variable d'environnement BRAVE_API_KEY.
 * Docs : https://brave.com/search/api/
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const count = Math.min(20, Number(searchParams.get("count") ?? 8));

  if (!q) return NextResponse.json({ results: [] });

  const key = process.env.BRAVE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Brave Search non configuré (BRAVE_API_KEY manquant)", results: [] },
      { status: 200 },
    );
  }

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", q);
    url.searchParams.set("count", String(count));
    url.searchParams.set("country", "cm");
    url.searchParams.set("search_lang", "fr");
    url.searchParams.set("safesearch", "moderate");

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": key,
      },
      // Cache court côté edge pour limiter la conso d'API
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Brave API ${res.status}`, results: [] },
        { status: 200 },
      );
    }

    const data = await res.json();
    const web = data?.web?.results ?? [];
    const results = web.map((r: { title: string; url: string; description?: string; profile?: { name?: string }; age?: string }) => ({
      title: r.title,
      url: r.url,
      description: r.description ?? "",
      source: r.profile?.name ?? new URL(r.url).hostname.replace(/^www\./, ""),
      age: r.age ?? "",
    }));

    return NextResponse.json({ query: q, results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur recherche web", results: [] },
      { status: 200 },
    );
  }
}
