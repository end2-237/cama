"use client";

import { Suspense, useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, ArrowLeft, BookOpen, FileText, Radio, X, Mic, Globe, Loader2, ExternalLink,
  TrendingUp, CornerDownLeft, Terminal, CalendarDays, HelpCircle, User, QrCode, MonitorPlay,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchStudentProgram, fetchChapters } from "@/lib/program";
import { fetchLivesForCourses } from "@/lib/lives";
import type { DBProgramCourse, DBChapter } from "@/lib/supabase";
import type { DBLive } from "@/lib/lives";

/* ── Types ── */
interface Hit {
  cat: "Cours" | "Chapitre" | "Live" | "Page";
  title: string;
  snippet: string;
  href: string;
  meta: string;
  icon: typeof BookOpen;
  score: number;
}

interface WebHit { title: string; url: string; description: string; source: string; age: string }

/* Pages statiques indexées */
const STATIC_PAGES = [
  { title: "TP & Machines virtuelles", desc: "Connexion aux machines distantes et VMs pour participer aux travaux pratiques : SSH, VNC, RDP, cluster JFN.", href: "/tp", icon: Terminal, kw: "tp machine virtuelle vm ssh vnc rdp distance lab pratique debian ubuntu kali windows serveur" },
  { title: "Calendrier académique 2025–2026", desc: "Semestres, examens, jurys, délibérations, vacances et événements de l'année universitaire.", href: "/calendrier", icon: CalendarDays, kw: "calendrier academique annee semestre examen jury vacances date planning" },
  { title: "Guide CAMA", desc: "Tout comprendre de la plateforme : modes de cours, Prof IA, Safe-CAMA, hybride, data budgeting.", href: "/guide", icon: HelpCircle, kw: "guide aide fonctionnement plateforme cama tutoriel prof ia safe examen hybride" },
  { title: "Mon profil étudiant", desc: "Cursus, progression, résultats, intégrité académique, préférences et identité certifiée QR.", href: "/profil", icon: User, kw: "profil etudiant cursus progression resultat preference compte" },
  { title: "Relevé certifié & diplôme", desc: "Diplôme vérifiable par QR code — confiance par la preuve pour les recruteurs.", href: "/diplome", icon: QrCode, kw: "diplome releve certifie qr code verification recruteur ects" },
  { title: "Dashboard étudiant", desc: "Mes cours, examens, résultats, journal du campus et notifications.", href: "/dashboard", icon: MonitorPlay, kw: "dashboard accueil cours examen resultat journal notification" },
];

const TRENDING = ["complexité algorithmique", "arbre binaire", "TP réseaux", "examen S4", "Prof IA", "machine virtuelle"];

const CAT_META: Record<Hit["cat"], { color: string }> = {
  Cours:    { color: "bg-cama text-white" },
  Chapitre: { color: "bg-cama-50 text-cama" },
  Live:     { color: "bg-red-50 text-red-600" },
  Page:     { color: "bg-green-50 text-green-700" },
};

function SearchEngine() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState<"Tous" | Hit["cat"] | "Web">("Tous");
  const inputRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [chaptersByCourse, setChaptersByCourse] = useState<Record<string, DBChapter[]>>({});
  const [lives, setLives] = useState<DBLive[]>([]);
  const [web, setWeb] = useState<WebHit[]>([]);
  const [webLoading, setWebLoading] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Recherche web (Brave) — débouncée */
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) { setWeb([]); setWebLoading(false); return; }
    setWebLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const d = await r.json();
        setWeb(Array.isArray(d.results) ? d.results : []);
      } catch { setWeb([]); }
      setWebLoading(false);
    }, 450);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!user) return;
    const slug = user.dossier?.parcoursSlug;
    if (!slug) return;
    (async () => {
      const cs = await fetchStudentProgram(slug, user.dossier?.level);
      setCourses(cs);
      const ids = cs.map((c) => c.id);
      setLives(await fetchLivesForCourses(ids));
      const map: Record<string, DBChapter[]> = {};
      await Promise.all(cs.map(async (c) => { map[c.id] = await fetchChapters(c.id); }));
      setChaptersByCourse(map);
    })();
  }, [user]);

  const allChapters = useMemo(() => Object.values(chaptersByCourse).flat(), [chaptersByCourse]);

  /* Recherche instantanée */
  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const words = term.split(/\s+/);
    const match = (txt: string) => {
      const lt = txt.toLowerCase();
      return words.filter((w) => lt.includes(w)).length;
    };
    const out: Hit[] = [];

    /* Cours */
    courses.filter((c) => c.published).forEach((c) => {
      const m = match(c.title) * 3 + match(c.description ?? "") + match(c.code);
      if (m > 0) out.push({
        cat: "Cours", title: c.title,
        snippet: c.description ?? "",
        href: `/cours/${c.id}`, meta: `${c.code} · ${c.ects} ECTS · ${c.semestre}`,
        icon: BookOpen, score: m + 4,
      });
    });

    /* Chapitres + contenus */
    allChapters.forEach((ch) => {
      const course = courses.find((c) => c.id === ch.program_course_id);
      if (!course?.published) return;
      let m = match(ch.title) * 3;
      let snippet = ch.title;
      if (ch.natif?.blocks) {
        (ch.natif.blocks as { type?: string; terme?: string; text?: string; question?: string }[]).forEach((b) => {
          const text = b.type === "definition" ? `${b.terme} : ${b.text}` : b.type === "quiz" ? (b.question ?? "") : (b.text ?? "");
          const bm = match(text);
          if (bm > m - match(ch.title) * 3 && bm > 0) snippet = text;
          m += bm;
        });
      }
      if (ch.video) m += match(ch.video.transcript) + match(ch.video.title);
      if (ch.pdf) m += match(ch.pdf.name);
      if (m > 0) out.push({
        cat: "Chapitre", title: `${ch.title} — ${course.title}`,
        snippet: snippet.slice(0, 180),
        href: `/cours/${course.id}`, meta: `Chapitre ${ch.ordre} · ${[ch.natif && "natif", ch.pdf && "PDF", ch.video && "vidéo"].filter(Boolean).join(" · ")}`,
        icon: FileText, score: m + 2,
      });
    });

    /* Lives */
    lives.forEach((l) => {
      const course = courses.find((c) => c.id === l.program_course_id);
      const m = match(l.title) * 2 + match(course?.title || "");
      if (m > 0) out.push({
        cat: "Live", title: l.title,
        snippet: `Classe virtuelle ${l.status === "encours" ? "EN DIRECT" : l.status === "planifie" ? "planifiée" : "terminée"}`,
        href: l.status === "encours" ? `/live/${l.id}` : `/cours/${l.program_course_id}`,
        meta: course?.title || "", icon: Radio, score: m + (l.status === "encours" ? 5 : 1),
      });
    });

    /* Pages statiques */
    STATIC_PAGES.forEach((p) => {
      const m = match(p.title) * 3 + match(p.desc) + match(p.kw) * 2;
      if (m > 0) out.push({
        cat: "Page", title: p.title, snippet: p.desc, href: p.href,
        meta: "Page CAMA", icon: p.icon, score: m,
      });
    });

    return out.sort((a, b) => b.score - a.score).slice(0, 25);
  }, [q, courses, allChapters, lives]);

  const filtered = cat === "Tous" ? hits : hits.filter((h) => h.cat === cat);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    hits.forEach((h) => { c[h.cat] = (c[h.cat] || 0) + 1; });
    return c;
  }, [hits]);

  const highlight = (text: string) => {
    const term = q.trim();
    if (!term) return text;
    const esc = term.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const parts = text.split(new RegExp(`(${esc})`, "gi"));
    return parts.map((p, i) =>
      new RegExp(`^(${esc})$`, "i").test(p)
        ? <mark key={i} className="bg-gold/30 text-ink font-semibold">{p}</mark>
        : p
    );
  };

  const hasQuery = q.trim().length > 0;

  return (
    <div className="min-h-screen bg-white">

      {/* ── MODE ACCUEIL (à la Google) ── */}
      {!hasQuery && (
        <div className="min-h-screen flex flex-col">
          <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 h-12 border-b border-border bg-white">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-3 text-xs text-muted">
              <Link href="/guide" className="hover:text-cama transition-colors">Guide</Link>
              <Link href="/calendrier" className="hover:text-cama transition-colors">Calendrier</Link>
              <Link href="/profil" className="hover:text-cama transition-colors">Profil</Link>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-4">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-12 bg-gradient-to-b from-cama to-gold" />
              <div>
                <p className="text-4xl font-black text-ink tracking-tight leading-none">CA<span className="text-cama">MA</span></p>
                <p className="text-[11px] text-subtle tracking-widest uppercase mt-1">Recherche · Institut JFN</p>
              </div>
            </div>

            {/* Grande barre */}
            <div className="w-full max-w-xl flex items-center gap-3 border border-border hover:border-cama/40 focus-within:border-cama focus-within:shadow-lg transition-all px-5 py-3.5 bg-white">
              <Search className="w-5 h-5 text-subtle flex-shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher cours, chapitres, lives, TP, forum…"
                className="flex-1 text-base text-ink placeholder-subtle outline-none bg-transparent"
              />
              <Mic className="w-4 h-4 text-cama flex-shrink-0 cursor-pointer" />
            </div>

            {/* Tendances */}
            <div className="mt-6 flex items-center gap-2 flex-wrap justify-center max-w-xl">
              <span className="flex items-center gap-1 text-[11px] text-subtle"><TrendingUp className="w-3 h-3" /> Tendances :</span>
              {TRENDING.map((t) => (
                <button key={t} onClick={() => setQ(t)}
                  className="text-[11px] text-cama border border-cama/20 px-3 py-1.5 hover:bg-cama/5 transition-colors">
                  {t}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-subtle mt-8">Recherche limitée aux ressources de l&apos;Institut JFN · résultats instantanés · 0 Mo consommé</p>
          </div>
        </div>
      )}

      {/* ── MODE RÉSULTATS ── */}
      {hasQuery && (
        <>
          {/* Barre haute compacte */}
          <header className="sticky top-0 z-40 bg-white border-b border-border">
            <div className="px-4 sm:px-6 py-3 flex items-center gap-4">
              <button onClick={() => { setQ(""); setCat("Tous"); }} className="flex items-center gap-2 flex-shrink-0">
                <div className="w-1.5 h-8 bg-gradient-to-b from-cama to-gold" />
                <span className="text-lg font-black text-ink tracking-tight hidden sm:block">CA<span className="text-cama">MA</span></span>
              </button>
              <div className="flex-1 flex items-center gap-3 border border-border focus-within:border-cama focus-within:shadow-md transition-all px-4 py-2 bg-white max-w-xl">
                <Search className="w-4 h-4 text-subtle flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="flex-1 text-sm text-ink outline-none bg-transparent"
                />
                <button onClick={() => setQ("")} className="text-subtle hover:text-ink transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Link href="/dashboard" className="text-xs text-muted hover:text-ink transition-colors flex-shrink-0 hidden sm:block">Dashboard</Link>
            </div>

            {/* Filtres catégories */}
            <div className="px-4 sm:px-6 flex items-center gap-0 overflow-x-auto">
              {(["Tous", "Cours", "Chapitre", "Live", "Page", "Web"] as const).map((c) => (
                <button key={c} onClick={() => setCat(c)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
                    cat === c ? "border-cama text-cama" : "border-transparent text-muted hover:text-ink"
                  }`}>
                  {c === "Web" && <Globe className="w-3 h-3" />}
                  {c === "Tous" ? `Tous (${hits.length})` : c === "Web" ? `Web${web.length ? ` (${web.length})` : ""}` : `${c}${counts[c] ? ` (${counts[c]})` : ""}`}
                </button>
              ))}
            </div>
          </header>

          {/* Résultats + sidebar — pleine largeur, sidebar collée au bord droit */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-0 items-start">
          <main className="px-4 sm:px-6 py-5 min-w-0 min-h-[calc(100vh-100px)]">
            <p className="text-[11px] text-subtle mb-4">
              {cat === "Web"
                ? `Environ ${web.length} résultat${web.length > 1 ? "s" : ""} web (Brave Search)`
                : `Environ ${filtered.length} résultat${filtered.length > 1 ? "s" : ""} (< 0,01 s) — ressources Institut JFN`}
            </p>

            {filtered.length === 0 && cat !== "Web" && (
              <div className="py-16 text-center">
                <Search className="w-10 h-10 text-border mx-auto mb-3" />
                <p className="text-sm font-bold text-ink mb-1">Aucun résultat pour « {q} »</p>
                <p className="text-xs text-muted mb-4">Vérifiez l&apos;orthographe ou essayez des termes plus généraux.</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {TRENDING.slice(0, 4).map((t) => (
                    <button key={t} type="button" onClick={() => setQ(t)}
                      className="text-[11px] text-cama border border-cama/20 px-3 py-1.5 hover:bg-cama/5 transition-colors">{t}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {cat !== "Web" && filtered.map((h, i) => (
                <Link key={i} href={h.href} className="block group max-w-2xl cursor-pointer">
                  {/* fil d'ariane façon Google */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-6 h-6 bg-surface border border-border flex items-center justify-center flex-shrink-0">
                      <h.icon className="w-3 h-3 text-cama" />
                    </div>
                    <div className="leading-tight min-w-0">
                      <p className="text-[11px] text-ink truncate">cama.jfn.cm{h.href}</p>
                      <p className="text-[9px] text-subtle truncate">{h.meta}</p>
                    </div>
                    <span className={`ml-auto text-[8px] font-black px-1.5 py-0.5 flex-shrink-0 ${CAT_META[h.cat].color}`}>{h.cat}</span>
                  </div>
                  {/* titre bleu cliquable */}
                  <h3 className="text-lg text-cama group-hover:underline leading-snug font-medium">
                    {highlight(h.title)}
                  </h3>
                  {/* snippet */}
                  <p className="text-sm text-muted leading-relaxed mt-0.5 line-clamp-2">
                    {highlight(h.snippet)}
                  </p>
                </Link>
              ))}

              {/* ── Résultats du web (Brave Search) ── */}
              {(cat === "Web" || cat === "Tous") && (
                <div className={cat === "Tous" ? "pt-4 mt-2 border-t border-border" : ""}>
                  {cat === "Tous" && (web.length > 0 || webLoading) && (
                    <p className="text-[11px] font-black text-subtle uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cama" /> Sur le web
                    </p>
                  )}
                  {webLoading && (
                    <p className="text-xs text-subtle flex items-center gap-2 py-3"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Recherche web en cours…</p>
                  )}
                  {!webLoading && cat === "Web" && web.length === 0 && (
                    <div className="py-16 text-center">
                      <Globe className="w-10 h-10 text-border mx-auto mb-3" />
                      <p className="text-sm font-bold text-ink mb-1">Aucun résultat web</p>
                      <p className="text-xs text-muted">La recherche web nécessite la clé <code>BRAVE_API_KEY</code> configurée côté serveur.</p>
                    </div>
                  )}
                  <div className="space-y-6">
                    {web.map((w, i) => (
                      <a key={i} href={w.url} target="_blank" rel="noopener noreferrer" className="block group max-w-2xl">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-6 h-6 bg-surface border border-border flex items-center justify-center flex-shrink-0">
                            <Globe className="w-3 h-3 text-cama" />
                          </div>
                          <div className="leading-tight min-w-0">
                            <p className="text-[11px] text-ink truncate">{w.source}</p>
                            <p className="text-[9px] text-subtle truncate">{w.url}</p>
                          </div>
                          <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 flex-shrink-0 bg-blue-50 text-blue-700 flex items-center gap-0.5"><ExternalLink className="w-2 h-2" /> Web</span>
                        </div>
                        <h3 className="text-lg text-cama group-hover:underline leading-snug font-medium">{highlight(w.title)}</h3>
                        <p className="text-sm text-muted leading-relaxed mt-0.5 line-clamp-2">{highlight(w.description)}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {filtered.length > 0 && (
              <div className="mt-10 pt-4 border-t border-border flex items-center justify-between">
                <p className="text-[10px] text-subtle flex items-center gap-1.5">
                  <CornerDownLeft className="w-3 h-3" /> Cliquez sur un résultat pour y accéder directement
                </p>
                <button type="button" onClick={() => router.push("/dashboard")} className="text-[11px] font-bold text-cama hover:underline">
                  Retour au dashboard →
                </button>
              </div>
            )}
          </main>

          {/* ══ SIDEBAR RÉSULTATS — collée au bord droit ══ */}
          <aside className="hidden lg:block lg:sticky lg:top-[100px] lg:h-[calc(100vh-100px)] lg:overflow-y-auto divide-y divide-border border-l border-border bg-white">

            {/* Panneau de connaissance — meilleur résultat */}
            {filtered.length > 0 && (
              <div className="px-4 py-4 bg-white">
                <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Meilleur résultat</p>
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-9 h-9 bg-cama flex items-center justify-center flex-shrink-0">
                    {(() => { const I = filtered[0].icon; return <I className="w-4 h-4 text-white" />; })()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink leading-snug">{filtered[0].title}</p>
                    <p className="text-[9px] text-subtle mt-0.5">{filtered[0].meta}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted leading-relaxed line-clamp-3 mb-2">{filtered[0].snippet}</p>
                <Link href={filtered[0].href}
                  className="block w-full text-center py-1.5 text-[11px] font-bold bg-cama text-white hover:bg-cama-700 transition-colors">
                  Accéder directement →
                </Link>
              </div>
            )}

            {/* Répartition par catégorie */}
            {hits.length > 0 && (
              <div className="px-4 py-3 bg-white">
                <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Répartition</p>
                <div className="space-y-1">
                  {Object.entries(counts).map(([c, n]) => (
                    <button key={c} type="button" onClick={() => setCat(c as Hit["cat"])}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] transition-colors ${
                        cat === c ? "bg-cama text-white font-bold" : "hover:bg-surface text-muted"
                      }`}>
                      <span>{c}</span>
                      <span className={`font-bold ${cat === c ? "text-gold" : "text-ink"}`}>{n}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recherches associées */}
            <div className="px-4 py-3 bg-white">
              <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Recherches associées
              </p>
              <div className="space-y-0.5">
                {TRENDING.filter((t) => t.toLowerCase() !== q.trim().toLowerCase()).slice(0, 5).map((t) => (
                  <button key={t} type="button" onClick={() => setQ(t)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted hover:text-cama hover:bg-cama-50/40 transition-colors text-left">
                    <Search className="w-3 h-3 flex-shrink-0" /> {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Accès directs */}
            <div className="px-4 py-3 bg-white">
              <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2">Accès directs</p>
              <div className="space-y-0.5">
                {[
                  { icon: Terminal,     label: "TP & VMs",       href: "/tp" },
                  { icon: CalendarDays, label: "Calendrier",     href: "/calendrier" },
                  { icon: HelpCircle,   label: "Guide CAMA",     href: "/guide" },
                  { icon: User,         label: "Mon profil",     href: "/profil" },
                ].map((l) => (
                  <Link key={l.label} href={l.href}
                    className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-muted hover:text-cama hover:bg-cama-50/40 transition-colors">
                    <l.icon className="w-3 h-3 flex-shrink-0" /> {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Note légère */}
            <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #1E1B4B, #312E81)" }}>
              <p className="text-[10px] text-white/80 leading-relaxed">
                <span className="font-bold text-gold">CAMA Search</span> indexe uniquement les ressources
                officielles de l&apos;Institut JFN — aucune donnée externe, 0 Mo de data consommée.
              </p>
            </div>
          </aside>
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
      </div>
    }>
      <SearchEngine />
    </Suspense>
  );
}
