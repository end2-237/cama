import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * CAMA Search — recherche web multi-provider.
 *
 * GET /api/search?q=...&count=10
 *
 * Choisit automatiquement le provider selon les variables d'environnement,
 * par ordre de priorité. AUCUNE clé n'est obligatoire : sans configuration,
 * la recherche utilise l'API Wikipédia (gratuite, sans clé) — idéale pour
 * une démonstration et cohérente avec le côté « encyclopédie new-gen ».
 *
 *   TAVILY_API_KEY   → Tavily   (1 000 req/mois gratuites, sans CB)   https://tavily.com
 *   SERPER_API_KEY   → Serper   (2 500 req gratuites, sans CB)        https://serper.dev
 *   BRAVE_API_KEY    → Brave    (2 000 req/mois, CB requise)          https://brave.com/search/api
 *   (aucune)         → Wikipédia FR (gratuit, sans clé)
 */

interface WebResult { title: string; url: string; description: string; source: string; age: string }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const count = Math.min(20, Number(searchParams.get("count") ?? 8));
  if (!q) return NextResponse.json({ results: [] });

  try {
    let results: WebResult[] = [];
    let provider = "wikipedia";

    if (process.env.TAVILY_API_KEY) {
      provider = "tavily";
      results = await searchTavily(q, count, process.env.TAVILY_API_KEY);
    } else if (process.env.SERPER_API_KEY) {
      provider = "serper";
      results = await searchSerper(q, count, process.env.SERPER_API_KEY);
    } else if (process.env.BRAVE_API_KEY) {
      provider = "brave";
      results = await searchBrave(q, count, process.env.BRAVE_API_KEY);
    } else {
      results = await searchWikipedia(q, count);
    }

    return NextResponse.json({ query: q, provider, results });
  } catch (e) {
    // En cas d'échec d'un provider payant, on retombe sur Wikipédia.
    try {
      const results = await searchWikipedia(q, count);
      return NextResponse.json({ query: q, provider: "wikipedia", results, fallback: true });
    } catch {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Erreur recherche web", results: [] },
        { status: 200 },
      );
    }
  }
}

/* ── Wikipédia FR — gratuit, sans clé ── */
async function searchWikipedia(q: string, count: number): Promise<WebResult[]> {
  const url = new URL("https://fr.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", q);
  url.searchParams.set("srlimit", String(count));
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url, { headers: { "User-Agent": "CAMA/1.0 (Institut JFN)" }, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
  const data = await res.json();
  const hits = data?.query?.search ?? [];
  return hits.map((h: { title: string; snippet: string }) => ({
    title: h.title,
    url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`,
    description: (h.snippet ?? "").replace(/<[^>]+>/g, ""),
    source: "fr.wikipedia.org",
    age: "",
  }));
}

/* ── Tavily — gratuit (1000/mois), sans CB ── */
async function searchTavily(q: string, count: number, key: string): Promise<WebResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query: q, max_results: count, search_depth: "basic" }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const data = await res.json();
  return (data?.results ?? []).map((r: { title: string; url: string; content?: string }) => ({
    title: r.title,
    url: r.url,
    description: r.content ?? "",
    source: new URL(r.url).hostname.replace(/^www\./, ""),
    age: "",
  }));
}

/* ── Serper.dev — gratuit (2500), sans CB ── */
async function searchSerper(q: string, count: number, key: string): Promise<WebResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: count, gl: "cm", hl: "fr" }),
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const data = await res.json();
  return (data?.organic ?? []).map((r: { title: string; link: string; snippet?: string; date?: string }) => ({
    title: r.title,
    url: r.link,
    description: r.snippet ?? "",
    source: new URL(r.link).hostname.replace(/^www\./, ""),
    age: r.date ?? "",
  }));
}

/* ── Brave Search ── */
async function searchBrave(q: string, count: number, key: string): Promise<WebResult[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", q);
  url.searchParams.set("count", String(count));
  url.searchParams.set("country", "cm");
  url.searchParams.set("search_lang", "fr");
  url.searchParams.set("safesearch", "moderate");

  const res = await fetch(url, {
    headers: { Accept: "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": key },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Brave ${res.status}`);
  const data = await res.json();
  return (data?.web?.results ?? []).map((r: { title: string; url: string; description?: string; profile?: { name?: string }; age?: string }) => ({
    title: r.title,
    url: r.url,
    description: r.description ?? "",
    source: r.profile?.name ?? new URL(r.url).hostname.replace(/^www\./, ""),
    age: r.age ?? "",
  }));
}
