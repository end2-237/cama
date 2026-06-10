"use client";

import { Suspense, useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, ArrowLeft, BookOpen, FileText, Radio, MessageSquare,
  GraduationCap, X, Mic, TrendingUp, CornerDownLeft,
  Terminal, CalendarDays, HelpCircle, User, QrCode, MonitorPlay,
} from "lucide-react";
import { useDB } from "@/hooks/useDB";

/* ── Types ── */
interface Hit {
  cat: "Cours" | "Chapitre" | "Live" | "Forum" | "UE" | "Page";
  title: string;
  snippet: string;
  href: string;
  meta: string;
  icon: typeof BookOpen;
  score: number;
}

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
  Forum:    { color: "bg-purple-100 text-purple-700" },
  UE:       { color: "bg-gold/15 text-gold-dark" },
  Page:     { color: "bg-green-50 text-green-700" },
};

function SearchEngine() {
  const params = useSearchParams();
  const router = useRouter();
  const { db } = useDB();
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState<"Tous" | Hit["cat"]>("Tous");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Recherche instantanée */
  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term || !db) return [];
    const words = term.split(/\s+/);
    const match = (txt: string) => {
      const lt = txt.toLowerCase();
      return words.filter((w) => lt.includes(w)).length;
    };
    const out: Hit[] = [];

    /* Cours */
    db.courses.filter((c) => c.published).forEach((c) => {
      const ue = db.ues.find((u) => u.id === c.ueId);
      const m = match(c.title) * 3 + match(c.description) + match(ue?.code || "");
      if (m > 0) out.push({
        cat: "Cours", title: c.title,
        snippet: c.description,
        href: `/cours/${c.id}`, meta: `${ue?.code} · ${ue?.ects} ECTS · ${ue?.semestre}`,
        icon: BookOpen, score: m + 4,
      });
    });

    /* Chapitres + contenus */
    db.chapters.forEach((ch) => {
      const course = db.courses.find((c) => c.id === ch.courseId);
      if (!course?.published) return;
      let m = match(ch.title) * 3;
      let snippet = ch.title;
      ch.natif?.blocks.forEach((b) => {
        const text = b.type === "definition" ? `${b.terme} : ${b.text}` : b.type === "quiz" ? b.question : (b as { text?: string }).text || "";
        const bm = match(text);
        if (bm > m - match(ch.title) * 3 && bm > 0) snippet = text;
        m += bm;
      });
      if (ch.video) m += match(ch.video.transcript) + match(ch.video.title);
      if (ch.pdf) m += match(ch.pdf.name);
      if (m > 0) out.push({
        cat: "Chapitre", title: `${ch.title} — ${course.title}`,
        snippet: snippet.slice(0, 180),
        href: `/cours/${course.id}`, meta: `Chapitre ${ch.order} · ${[ch.natif && "natif", ch.pdf && "PDF", ch.video && "vidéo"].filter(Boolean).join(" · ")}`,
        icon: FileText, score: m + 2,
      });
    });

    /* Lives */
    db.lives.forEach((l) => {
      const course = db.courses.find((c) => c.id === l.courseId);
      const m = match(l.title) * 2 + match(course?.title || "");
      if (m > 0) out.push({
        cat: "Live", title: l.title,
        snippet: `Classe virtuelle ${l.status === "encours" ? "EN DIRECT" : l.status === "planifie" ? "planifiée" : "terminée"} · ${new Date(l.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · ${l.durationMin} min`,
        href: l.status === "encours" ? `/live/${l.id}` : `/cours/${l.courseId}`,
        meta: course?.title || "", icon: Radio, score: m + (l.status === "encours" ? 5 : 1),
      });
    });

    /* Forum */
    db.forum.forEach((f) => {
      const ue = db.ues.find((u) => u.id === f.ueId);
      const m = match(f.text) * 2 + match(f.author);
      if (m > 0) out.push({
        cat: "Forum", title: `${f.author} — ${ue?.code || "Forum"}`,
        snippet: f.text,
        href: "/dashboard", meta: `${f.role === "enseignant" ? "Enseignant" : "Étudiant"} · ${f.time}`,
        icon: MessageSquare, score: m,
      });
    });

    /* UEs */
    db.ues.forEach((u) => {
      const m = match(u.title) * 2 + match(u.code) * 3;
      if (m > 0) out.push({
        cat: "UE", title: `${u.code} — ${u.title}`,
        snippet: `Unité d'enseignement · ${u.ects} ECTS · ${u.semestre}`,
        href: "/dashboard", meta: `${u.ects} crédits`, icon: GraduationCap, score: m + 1,
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
  }, [q, db]);

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
          <header className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-3 text-xs text-muted">
              <Link href="/guide" className="hover:text-cama transition-colors">Guide</Link>
              <Link href="/calendrier" className="hover:text-cama transition-colors">Calendrier</Link>
              <Link href="/profil" className="hover:text-cama transition-colors">Profil</Link>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
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
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
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
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 flex items-center gap-0 overflow-x-auto">
              {(["Tous", "Cours", "Chapitre", "Live", "Forum", "UE", "Page"] as const).map((c) => (
                <button key={c} onClick={() => setCat(c)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                    cat === c ? "border-cama text-cama" : "border-transparent text-muted hover:text-ink"
                  }`}>
                  {c === "Tous" ? `Tous (${hits.length})` : `${c}${counts[c] ? ` (${counts[c]})` : ""}`}
                </button>
              ))}
            </div>
          </header>

          {/* Résultats */}
          <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-5">
            <p className="text-[11px] text-subtle mb-4">
              Environ {filtered.length} résultat{filtered.length > 1 ? "s" : ""} ({"<"} 0,01 s) — ressources Institut JFN uniquement
            </p>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <Search className="w-10 h-10 text-border mx-auto mb-3" />
                <p className="text-sm font-bold text-ink mb-1">Aucun résultat pour « {q} »</p>
                <p className="text-xs text-muted mb-4">Vérifiez l&apos;orthographe ou essayez des termes plus généraux.</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {TRENDING.slice(0, 4).map((t) => (
                    <button key={t} onClick={() => setQ(t)}
                      className="text-[11px] text-cama border border-cama/20 px-3 py-1.5 hover:bg-cama/5 transition-colors">{t}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {filtered.map((h, i) => (
                <div key={i} className="group max-w-2xl">
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
                  <Link href={h.href} className="block">
                    <h3 className="text-lg text-cama group-hover:underline leading-snug font-medium">
                      {highlight(h.title)}
                    </h3>
                  </Link>
                  {/* snippet */}
                  <p className="text-sm text-muted leading-relaxed mt-0.5 line-clamp-2">
                    {highlight(h.snippet)}
                  </p>
                </div>
              ))}
            </div>

            {filtered.length > 0 && (
              <div className="mt-10 pt-4 border-t border-border flex items-center justify-between">
                <p className="text-[10px] text-subtle flex items-center gap-1.5">
                  <CornerDownLeft className="w-3 h-3" /> Cliquez sur un résultat pour y accéder directement
                </p>
                <button onClick={() => router.push("/dashboard")} className="text-[11px] font-bold text-cama hover:underline">
                  Retour au dashboard →
                </button>
              </div>
            )}
          </main>
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
