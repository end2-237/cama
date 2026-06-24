"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Newspaper, Radio, Play, Heart, Bookmark, Share2, Eye,
  Search, Flame, Clock, ChevronRight, Volume2, Hash, TrendingUp,
  BookOpen, Sparkles, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchJournal, fetchMyReactions, fetchReactionCounts, toggleReaction,
  bumpJournalViews, JOURNAL_RUBRIQUES, type DBJournalArticle,
} from "@/lib/journal";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=70";

function cover(a: DBJournalArticle) {
  return a.cover_url || a.media_src || FALLBACK_COVER;
}

export default function JournalPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<DBJournalArticle[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [saves, setSaves] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [rub, setRub] = useState("Toutes");
  const [q, setQ] = useState("");
  const [reader, setReader] = useState<DBJournalArticle | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rows, c] = await Promise.all([fetchJournal(true), fetchReactionCounts()]);
      if (cancelled) return;
      setArticles(rows); setCounts(c); setLoading(false);
      if (user) {
        const r = await fetchMyReactions(user.id);
        if (cancelled) return;
        setLikes(new Set(r.filter((x) => x.kind === "like").map((x) => x.article_id)));
        setSaves(new Set(r.filter((x) => x.kind === "save").map((x) => x.article_id)));
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const reels = useMemo(() => articles.filter((a) => a.media_kind === "reel" || a.media_kind === "video" || a.media_kind === "live"), [articles]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return articles.filter((a) => {
      if (rub !== "Toutes" && a.rubrique !== rub) return false;
      if (!term) return true;
      return (a.title + " " + (a.subtitle ?? "") + " " + (a.body ?? "")).toLowerCase().includes(term);
    });
  }, [articles, rub, q]);

  const tags = useMemo(() => {
    const set = new Map<string, number>();
    articles.forEach((a) => (a.tags ?? []).forEach((t) => set.set(t, (set.get(t) ?? 0) + 1)));
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, [articles]);

  const rubriques = ["Toutes", ...JOURNAL_RUBRIQUES.filter((r) => articles.some((a) => a.rubrique === r))];

  const like = async (a: DBJournalArticle) => {
    if (!user) return;
    const on = !likes.has(a.id);
    setLikes((s) => { const n = new Set(s); if (on) n.add(a.id); else n.delete(a.id); return n; });
    setCounts((c) => ({ ...c, [a.id]: (c[a.id] ?? 0) + (on ? 1 : -1) }));
    await toggleReaction(a.id, user.id, "like", on);
  };
  const save = async (a: DBJournalArticle) => {
    if (!user) return;
    const on = !saves.has(a.id);
    setSaves((s) => { const n = new Set(s); if (on) n.add(a.id); else n.delete(a.id); return n; });
    await toggleReaction(a.id, user.id, "save", on);
  };
  const openReader = (a: DBJournalArticle) => {
    setReader(a);
    bumpJournalViews(a.id, a.views);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white">
      {/* ── BANDEAU FRANCE24 : ticker breaking ── */}
      <div className="bg-red-600 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-1.5 text-[11px] font-bold whitespace-nowrap">
          <span className="flex items-center gap-1 bg-white text-red-600 px-2 py-0.5 uppercase tracking-wider shrink-0">
            <Radio className="w-3 h-3" /> En continu
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="flex gap-8 animate-[ticker_30s_linear_infinite] whitespace-nowrap">
              {[...articles, ...articles].map((a, i) => (
                <span key={i} className="text-white/90">• {a.title}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ENTÊTE MASTHEAD ── */}
      <header className="border-b border-white/10 bg-[#0b0b0f]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-white/50 text-xs hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cama to-violet-600 flex items-center justify-center">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-lg tracking-tight leading-none">JFN<span className="text-cama">.</span>news</p>
              <p className="text-[9px] text-white/40 uppercase tracking-widest">Le média du campus</p>
            </div>
          </div>
          <div className="flex-1 max-w-md ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans le journal…"
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cama/50" />
          </div>
          <span className="hidden sm:block text-[11px] text-white/40">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        {/* Rubriques */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {rubriques.map((r) => (
            <button key={r} onClick={() => setRub(r)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                rub === r ? "bg-cama text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              {r}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="py-32 text-center"><div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin mx-auto" /></div>
      ) : (
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-8">

          {/* ── STORIES / REELS (TikTok × Insta) ── */}
          {reels.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/70 mb-3">
                <Flame className="w-4 h-4 text-orange-500" /> Reels & Directs
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {reels.map((a) => (
                  <button key={a.id} onClick={() => openReader(a)} className="group relative w-[130px] h-[210px] shrink-0 rounded-2xl overflow-hidden">
                    <img src={cover(a)} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
                    <div className={`absolute top-2 left-2 flex items-center gap-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${a.media_kind === "live" ? "bg-red-600" : "bg-white/20 backdrop-blur"}`}>
                      {a.media_kind === "live" ? <><span className="w-1 h-1 rounded-full bg-white animate-pulse" /> Live</> : a.media_kind === "reel" ? "Reel" : "Vidéo"}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                      </div>
                    </div>
                    <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold leading-tight text-left line-clamp-2">{a.title}</p>
                    {a.media_duration && <span className="absolute bottom-2 right-2 text-[8px] font-bold bg-black/60 px-1 rounded">{a.media_duration}</span>}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* ── COLONNE PRINCIPALE ── */}
            <div className="space-y-6">
              {/* À la une */}
              {featured && rub === "Toutes" && !q && (
                <button onClick={() => openReader(featured)} className="group relative block w-full rounded-3xl overflow-hidden text-left">
                  <img src={cover(featured)} alt="" className="w-full h-[340px] sm:h-[420px] object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 p-6 sm:p-8 max-w-2xl">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-cama px-2.5 py-1 rounded-full mb-3">
                      <Sparkles className="w-3 h-3" /> À la une · {featured.rubrique}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-black leading-[1.1] tracking-tight drop-shadow">{featured.title}</h1>
                    {featured.subtitle && <p className="text-white/70 text-sm sm:text-base mt-2 max-w-xl">{featured.subtitle}</p>}
                    <p className="text-white/40 text-xs mt-3 flex items-center gap-3">
                      <span>{featured.author}</span><span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {featured.views}</span>
                    </p>
                  </div>
                </button>
              )}

              {/* Grille d'articles */}
              <div className="grid sm:grid-cols-2 gap-4">
                {filtered.filter((a) => !(featured && a.id === featured.id && rub === "Toutes" && !q)).map((a) => (
                  <article key={a.id} className="group bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-white/25 transition-colors">
                    <button onClick={() => openReader(a)} className="relative h-44 overflow-hidden text-left">
                      <img src={cover(a)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest bg-black/50 backdrop-blur px-2 py-1 rounded-full">{a.rubrique}</span>
                      {a.media_kind !== "none" && a.media_kind !== "image" && (
                        <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                          {a.media_kind === "audio" ? <Volume2 className="w-3.5 h-3.5 text-black" /> : a.media_kind === "live" ? <Radio className="w-3.5 h-3.5 text-red-600" /> : <Play className="w-3.5 h-3.5 text-black fill-black" />}
                        </span>
                      )}
                    </button>
                    <div className="p-4 flex-1 flex flex-col">
                      <button onClick={() => openReader(a)} className="text-left">
                        <h3 className="font-bold leading-snug group-hover:text-cama transition-colors line-clamp-2">{a.title}</h3>
                        {a.subtitle && <p className="text-white/50 text-xs mt-1 line-clamp-2">{a.subtitle}</p>}
                      </button>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-[10px] text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {a.author}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => like(a)} className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-colors ${likes.has(a.id) ? "text-pink-500" : "text-white/40 hover:text-white"}`}>
                            <Heart className={`w-3.5 h-3.5 ${likes.has(a.id) ? "fill-pink-500" : ""}`} /> {counts[a.id] ?? 0}
                          </button>
                          <button onClick={() => save(a)} className={`p-1 rounded-full transition-colors ${saves.has(a.id) ? "text-cama" : "text-white/40 hover:text-white"}`}>
                            <Bookmark className={`w-3.5 h-3.5 ${saves.has(a.id) ? "fill-cama" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {filtered.length === 0 && <p className="text-center text-white/40 py-16 text-sm">Aucun article pour ce filtre.</p>}
            </div>

            {/* ── SIDEBAR WIKIPEDIA-NEWGEN ── */}
            <aside className="space-y-4 lg:sticky lg:top-[140px]">
              {/* Infobox style Wikipedia */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cama" />
                  <p className="text-xs font-black uppercase tracking-widest">Institut JFN</p>
                </div>
                <dl className="p-4 space-y-2 text-xs">
                  {[["Type", "Institut privé d'enseignement supérieur"], ["Localisation", "Yaoundé, Cameroun"], ["Plateforme", "CAMA — LMS nouvelle génération"], ["Filières", "Génie logiciel, Réseaux, Data, Gestion"], ["Langue", "Français"]].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className="text-white/40">{k}</dt>
                      <dd className="text-white/80 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Tendances (hashtags) */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <p className="text-xs font-black uppercase tracking-widest">Tendances</p>
                </div>
                <div className="p-3 flex flex-wrap gap-1.5">
                  {tags.length === 0 && <p className="text-[11px] text-white/30">—</p>}
                  {tags.map(([t, n]) => (
                    <button key={t} onClick={() => setQ(t)} className="inline-flex items-center gap-1 text-[11px] bg-white/5 hover:bg-white/10 text-white/70 px-2.5 py-1 rounded-full transition-colors">
                      <Hash className="w-3 h-3 text-cama" /> {t} <span className="text-white/30">{n}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Les plus lus */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cama" />
                  <p className="text-xs font-black uppercase tracking-widest">Les plus lus</p>
                </div>
                <div className="divide-y divide-white/5">
                  {[...articles].sort((a, b) => b.views - a.views).slice(0, 5).map((a, i) => (
                    <button key={a.id} onClick={() => openReader(a)} className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors">
                      <span className="text-lg font-black text-white/20 w-5">{i + 1}</span>
                      <p className="text-[12px] font-semibold leading-tight line-clamp-2 flex-1">{a.title}</p>
                      <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* ── LECTEUR ARTICLE (reader immersif) ── */}
      {reader && <Reader a={reader} liked={likes.has(reader.id)} saved={saves.has(reader.id)} count={counts[reader.id] ?? 0}
        onLike={() => like(reader)} onSave={() => save(reader)} onClose={() => setReader(null)} />}

      <style jsx global>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function Reader({ a, liked, saved, count, onLike, onSave, onClose }: {
  a: DBJournalArticle; liked: boolean; saved: boolean; count: number;
  onLike: () => void; onSave: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="max-w-3xl mx-auto my-6 sm:my-12 bg-[#13131a] rounded-3xl overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <img src={cover(a)} alt="" className="w-full h-64 sm:h-80 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-transparent to-black/40" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
          {a.media_kind === "live" && (
            <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live · {a.media_at}
            </span>
          )}
        </div>
        <div className="p-6 sm:p-8 -mt-12 relative">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-cama mb-2">{a.rubrique}</span>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">{a.title}</h1>
          {a.subtitle && <p className="text-white/60 text-base mt-2 italic">{a.subtitle}</p>}
          <div className="flex items-center gap-4 mt-4 text-xs text-white/40 border-y border-white/10 py-3">
            <span>{a.author}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {a.views} vues</span>
            {a.media_duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.media_duration}</span>}
          </div>

          {a.media_kind === "audio" && (
            <div className="mt-4 bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cama flex items-center justify-center"><Play className="w-5 h-5 fill-white ml-0.5" /></div>
              <div className="flex-1 flex items-center gap-[2px] h-8">
                {[5, 9, 14, 18, 12, 20, 16, 8, 13, 19, 11, 15, 7, 17, 10, 14, 6, 12, 18, 9].map((h, i) => (
                  <div key={i} className={`w-[3px] rounded-full ${i < 7 ? "bg-cama" : "bg-white/20"}`} style={{ height: `${h}px` }} />
                ))}
              </div>
              <span className="text-xs text-white/50">{a.media_duration}</span>
            </div>
          )}

          {a.body && <p className="text-white/80 leading-relaxed mt-5 whitespace-pre-line">{a.body}</p>}

          {a.refs && a.refs.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Références</p>
              <ul className="space-y-1">
                {a.refs.map((r, i) => (
                  <li key={i}><a href={r.href} className="text-sm text-cama hover:underline">↗ {r.label}</a></li>
                ))}
              </ul>
            </div>
          )}

          {a.tags && a.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {a.tags.map((t) => <span key={t} className="text-[11px] bg-white/5 text-white/60 px-2.5 py-1 rounded-full">#{t}</span>)}
            </div>
          )}

          <div className="mt-6 flex items-center gap-2">
            <button onClick={onLike} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-colors ${liked ? "bg-pink-500/20 text-pink-400" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-pink-400" : ""}`} /> {count}
            </button>
            <button onClick={onSave} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-colors ${saved ? "bg-cama/20 text-cama" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
              <Bookmark className={`w-4 h-4 ${saved ? "fill-cama" : ""}`} /> {saved ? "Enregistré" : "Enregistrer"}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-white/5 text-white/60 hover:bg-white/10 transition-colors ml-auto">
              <Share2 className="w-4 h-4" /> Partager
            </button>
            {a.cta_label && a.cta_href && (
              <a href={a.cta_href} className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-cama hover:bg-cama/90 transition-colors">
                {a.cta_label} <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
