"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Newspaper, Radio, Play, Heart, Bookmark, Share2, Eye,
  Search, Flame, Clock, ChevronRight, ChevronUp, ChevronDown, Volume2, Hash, TrendingUp,
  BookOpen, Sparkles, X, Sun, Moon, MessageCircle, Users, Send, Award, Pause,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchJournal, fetchMyReactions, fetchReactionCounts, toggleReaction,
  bumpJournalViews, JOURNAL_RUBRIQUES, type DBJournalArticle,
} from "@/lib/journal";
import {
  fetchCommunity, postCommunity, likeCommunity, type DBCommunityMessage,
} from "@/lib/chat";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=70";
function cover(a: DBJournalArticle) { return a.cover_url || a.media_src || FALLBACK_COVER; }
function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "À l'instant";
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`;
  return `Il y a ${Math.floor(s / 86400)} j`;
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
  const [dark, setDark] = useState(true);
  const [reelIdx, setReelIdx] = useState(0);
  const [reelPlaying, setReelPlaying] = useState(true);
  const [showComm, setShowComm] = useState(false);
  const [fullReel, setFullReel] = useState<number | null>(null);
  const [comm, setComm] = useState<DBCommunityMessage[]>([]);
  const [commInput, setCommInput] = useState("");

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

  useEffect(() => {
    let cancelled = false;
    fetchCommunity().then((rows) => { if (!cancelled) setComm(rows); });
    return () => { cancelled = true; };
  }, []);

  const sendComm = async () => {
    const body = commInput.trim();
    if (!body || !user) return;
    setCommInput("");
    const optimistic: DBCommunityMessage = {
      id: `tmp-${Date.now()}`, user_id: user.id, author_name: user.name,
      avatar: "#7C3AED", body, likes: 0, created_at: new Date().toISOString(),
    };
    setComm((c) => [...c, optimistic]);
    const saved = await postCommunity({ user_id: user.id, author_name: user.name, body });
    if (saved) setComm((c) => c.map((m) => (m.id === optimistic.id ? saved : m)));
  };
  const likeComm = async (m: DBCommunityMessage) => {
    setComm((c) => c.map((x) => (x.id === m.id ? { ...x, likes: x.likes + 1 } : x)));
    await likeCommunity(m.id, m.likes);
  };

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
  const openReader = (a: DBJournalArticle) => { setReader(a); bumpJournalViews(a.id, a.views); };

  const bg = dark ? "bg-[#0b0b0f]" : "bg-gray-50";
  const fg = dark ? "text-white" : "text-gray-900";
  const card = dark ? "bg-white/[0.03] border-white/10" : "bg-white border-gray-200 shadow-sm";
  const sub = dark ? "text-white/50" : "text-gray-500";
  const subBg = dark ? "bg-white/5" : "bg-gray-100";
  const headerBg = dark ? "bg-[#0b0b0f]/95 border-white/10" : "bg-white/95 border-gray-200";

  return (
    <div className={`min-h-screen ${bg} ${fg} transition-colors duration-300`}>
      {/* ── TICKER ── */}
      <div className="bg-red-600 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-1.5 text-[11px] font-bold whitespace-nowrap text-white">
          <span className="flex items-center gap-1 bg-white text-red-600 px-2 py-0.5 uppercase tracking-wider shrink-0">
            <Radio className="w-3 h-3" /> En continu
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="flex gap-8 animate-[ticker_30s_linear_infinite] whitespace-nowrap">
              {[...articles, ...articles].map((a, i) => <span key={i} className="text-white/90">• {a.title}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* ── MASTHEAD ── */}
      <header className={`border-b ${headerBg} backdrop-blur sticky top-0 z-30`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/dashboard" className={`flex items-center gap-1.5 text-xs ${sub} hover:opacity-80 shrink-0`}>
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cama to-violet-600 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-lg tracking-tight leading-none">JFN<span className="text-cama">.</span>news</p>
              <p className={`text-[9px] ${sub} uppercase tracking-widest`}>Le média du campus</p>
            </div>
          </div>
          <div className="flex-1 max-w-md ml-auto relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sub}`} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
              className={`w-full ${subBg} border ${dark ? "border-white/10" : "border-gray-300"} rounded-full pl-9 pr-4 py-2 text-sm ${dark ? "placeholder:text-white/30" : "placeholder:text-gray-400"} focus:outline-none focus:border-cama/50`} />
          </div>
          {/* Dark / Light toggle */}
          <button onClick={() => setDark(!dark)} className={`w-9 h-9 rounded-full ${subBg} flex items-center justify-center hover:opacity-80 transition-colors`} title={dark ? "Mode clair" : "Mode sombre"}>
            {dark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>
          {/* Community toggle */}
          <button onClick={() => setShowComm(!showComm)} className={`w-9 h-9 rounded-full ${showComm ? "bg-cama text-white" : subBg} flex items-center justify-center hover:opacity-80 transition-colors`} title="Communauté">
            <Users className="w-4 h-4" />
          </button>
          <span className={`hidden lg:block text-[11px] ${sub}`}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {rubriques.map((r) => (
            <button key={r} onClick={() => setRub(r)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                rub === r ? "bg-cama text-white" : `${sub} hover:opacity-80 ${dark ? "hover:bg-white/5" : "hover:bg-gray-200"}`}`}>
              {r}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="py-32 text-center"><div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin mx-auto" /></div>
      ) : (
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-8">

          {/* ── REELS / STORIES (horizontal) ── */}
          {reels.length > 0 && (
            <section>
              <h2 className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest ${sub} mb-3`}>
                <Flame className="w-4 h-4 text-orange-500" /> Reels & Directs
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {reels.map((a, ri) => (
                  <button key={a.id} onClick={() => { setFullReel(ri); bumpJournalViews(a.id, a.views); }} className="group relative w-[130px] h-[210px] shrink-0 rounded-2xl overflow-hidden">
                    <img src={cover(a)} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
                    <div className={`absolute top-2 left-2 flex items-center gap-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded text-white ${a.media_kind === "live" ? "bg-red-600" : "bg-white/20 backdrop-blur"}`}>
                      {a.media_kind === "live" ? <><span className="w-1 h-1 rounded-full bg-white animate-pulse" /> Live</> : a.media_kind === "reel" ? "Reel" : "Vidéo"}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                      </div>
                    </div>
                    <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold leading-tight text-left line-clamp-2 text-white">{a.title}</p>
                    {a.media_duration && <span className="absolute bottom-2 right-2 text-[8px] font-bold bg-black/60 px-1 rounded text-white">{a.media_duration}</span>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── TIKTOK-STYLE VERTICAL VIDEO FEED ── */}
          {reels.length > 0 && (
            <section>
              <h2 className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest ${sub} mb-3`}>
                <Play className="w-4 h-4 text-cama" /> Feed Vidéo
              </h2>
              <div className="flex gap-4 items-start">
                <div className="relative w-full max-w-[360px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-black">
                  {reels.map((a, i) => (
                    <div key={a.id} className={`absolute inset-0 transition-opacity duration-500 ${i === reelIdx ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                      <img src={cover(a)} alt="" onClick={() => { setFullReel(i); bumpJournalViews(a.id, a.views); }} className="w-full h-full object-cover cursor-pointer" />
                      <button onClick={() => { setFullReel(i); bumpJournalViews(a.id, a.views); }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/90 text-black text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full hover:scale-105 transition-transform">
                        Plein écran TikTok
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                      {a.media_kind === "live" && (
                        <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                        </span>
                      )}
                      <div className="absolute bottom-0 left-0 right-14 p-5">
                        <p className="text-white text-xs font-bold flex items-center gap-2 mb-1">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-cama to-violet-500 flex items-center justify-center text-[10px] font-black">{a.author[0]}</span>
                          {a.author}
                        </p>
                        <p className="text-white text-sm font-bold leading-snug line-clamp-3">{a.title}</p>
                        {a.tags && a.tags.length > 0 && (
                          <p className="text-white/60 text-[11px] mt-1">
                            {a.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                          </p>
                        )}
                      </div>
                      {/* Right side actions (TikTok style) */}
                      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
                        <button onClick={(e) => { e.stopPropagation(); like(a); }} className="flex flex-col items-center gap-0.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${likes.has(a.id) ? "bg-pink-500/30" : "bg-black/40 backdrop-blur"}`}>
                            <Heart className={`w-5 h-5 text-white ${likes.has(a.id) ? "fill-pink-500" : ""}`} />
                          </div>
                          <span className="text-white text-[10px] font-bold">{counts[a.id] ?? 0}</span>
                        </button>
                        <button className="flex flex-col items-center gap-0.5">
                          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-white text-[10px] font-bold">{a.views}</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); save(a); }} className="flex flex-col items-center gap-0.5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${saves.has(a.id) ? "bg-cama/30" : "bg-black/40 backdrop-blur"}`}>
                            <Bookmark className={`w-5 h-5 text-white ${saves.has(a.id) ? "fill-cama" : ""}`} />
                          </div>
                          <span className="text-white text-[10px] font-bold">{saves.has(a.id) ? "Saved" : "Save"}</span>
                        </button>
                        <button className="flex flex-col items-center gap-0.5">
                          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-white text-[10px] font-bold">Share</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Nav up/down */}
                  <button onClick={() => setReelIdx((i) => Math.max(0, i - 1))} disabled={reelIdx === 0}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white disabled:opacity-30"><ChevronUp className="w-5 h-5" /></button>
                  <button onClick={() => setReelIdx((i) => Math.min(reels.length - 1, i + 1))} disabled={reelIdx >= reels.length - 1}
                    className="absolute top-14 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white disabled:opacity-30"><ChevronDown className="w-5 h-5" /></button>
                  {/* Play/Pause */}
                  <button onClick={() => setReelPlaying(!reelPlaying)} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
                    {reelPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>
                  {/* Progress dots */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    {reels.map((_, i) => <div key={i} className={`w-1 rounded-full transition-all ${i === reelIdx ? "h-5 bg-white" : "h-1.5 bg-white/40"}`} />)}
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className={`grid grid-cols-1 ${showComm ? "lg:grid-cols-[1fr_300px_280px]" : "lg:grid-cols-[1fr_300px]"} gap-6 items-start`}>
            {/* ── COLONNE PRINCIPALE ── */}
            <div className="space-y-6">
              {/* À la une */}
              {featured && rub === "Toutes" && !q && (
                <button onClick={() => openReader(featured)} className="group relative block w-full rounded-3xl overflow-hidden text-left">
                  <img src={cover(featured)} alt="" className="w-full h-[340px] sm:h-[420px] object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 p-6 sm:p-8 max-w-2xl text-white">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-cama px-2.5 py-1 rounded-full mb-3">
                      <Sparkles className="w-3 h-3" /> À la une · {featured.rubrique}
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-black leading-[1.1] tracking-tight drop-shadow">{featured.title}</h1>
                    {featured.subtitle && <p className="text-white/70 text-sm sm:text-base mt-2 max-w-xl">{featured.subtitle}</p>}
                    <p className="text-white/40 text-xs mt-3 flex items-center gap-3">
                      <span>{featured.author}</span><span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {featured.views}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {counts[featured.id] ?? 0}</span>
                    </p>
                  </div>
                </button>
              )}

              {/* Grille d'articles */}
              <div className="grid sm:grid-cols-2 gap-4">
                {filtered.filter((a) => !(featured && a.id === featured.id && rub === "Toutes" && !q)).map((a) => (
                  <article key={a.id} className={`group border rounded-2xl overflow-hidden flex flex-col transition-all ${card}`}>
                    <button onClick={() => openReader(a)} className="relative h-44 overflow-hidden text-left">
                      <img src={cover(a)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest bg-black/50 backdrop-blur px-2 py-1 rounded-full text-white">{a.rubrique}</span>
                      {a.media_kind !== "none" && a.media_kind !== "image" && (
                        <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                          {a.media_kind === "audio" ? <Volume2 className="w-3.5 h-3.5 text-black" /> : a.media_kind === "live" ? <Radio className="w-3.5 h-3.5 text-red-600" /> : <Play className="w-3.5 h-3.5 text-black fill-black" />}
                        </span>
                      )}
                    </button>
                    <div className="p-4 flex-1 flex flex-col">
                      <button onClick={() => openReader(a)} className="text-left">
                        <h3 className="font-bold leading-snug group-hover:text-cama transition-colors line-clamp-2">{a.title}</h3>
                        {a.subtitle && <p className={`${sub} text-xs mt-1 line-clamp-2`}>{a.subtitle}</p>}
                      </button>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className={`text-[10px] ${sub} flex items-center gap-1`}><Clock className="w-3 h-3" /> {a.author}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => like(a)} className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-colors ${likes.has(a.id) ? "text-pink-500" : `${sub} hover:opacity-80`}`}>
                            <Heart className={`w-3.5 h-3.5 ${likes.has(a.id) ? "fill-pink-500" : ""}`} /> {counts[a.id] ?? 0}
                          </button>
                          <button onClick={() => save(a)} className={`p-1 rounded-full transition-colors ${saves.has(a.id) ? "text-cama" : `${sub} hover:opacity-80`}`}>
                            <Bookmark className={`w-3.5 h-3.5 ${saves.has(a.id) ? "fill-cama" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {filtered.length === 0 && <p className={`text-center ${sub} py-16 text-sm`}>Aucun article pour ce filtre.</p>}
            </div>

            {/* ── SIDEBAR WIKIPEDIA-NEWGEN ── */}
            <aside className="space-y-4 lg:sticky lg:top-[140px]">
              <div className={`border rounded-2xl overflow-hidden ${card}`}>
                <div className={`px-4 py-3 ${subBg} border-b ${dark ? "border-white/10" : "border-gray-200"} flex items-center gap-2`}>
                  <BookOpen className="w-4 h-4 text-cama" />
                  <p className="text-xs font-black uppercase tracking-widest">Institut JFN</p>
                </div>
                <dl className="p-4 space-y-2 text-xs">
                  {[["Type", "Institut privé d'enseignement supérieur"], ["Localisation", "Yaoundé, Cameroun"], ["Plateforme", "CAMA — LMS nouvelle génération"], ["Filières", "Génie logiciel, Réseaux, Data, Gestion"], ["Langue", "Français"]].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[90px_1fr] gap-2">
                      <dt className={sub}>{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className={`border rounded-2xl overflow-hidden ${card}`}>
                <div className={`px-4 py-3 ${subBg} border-b ${dark ? "border-white/10" : "border-gray-200"} flex items-center gap-2`}>
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <p className="text-xs font-black uppercase tracking-widest">Tendances</p>
                </div>
                <div className="p-3 flex flex-wrap gap-1.5">
                  {tags.length === 0 && <p className={`text-[11px] ${sub}`}>—</p>}
                  {tags.map(([t, n]) => (
                    <button key={t} onClick={() => setQ(t)} className={`inline-flex items-center gap-1 text-[11px] ${subBg} px-2.5 py-1 rounded-full transition-colors hover:opacity-80`}>
                      <Hash className="w-3 h-3 text-cama" /> {t} <span className={sub}>{n}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`border rounded-2xl overflow-hidden ${card}`}>
                <div className={`px-4 py-3 ${subBg} border-b ${dark ? "border-white/10" : "border-gray-200"} flex items-center gap-2`}>
                  <Eye className="w-4 h-4 text-cama" />
                  <p className="text-xs font-black uppercase tracking-widest">Les plus lus</p>
                </div>
                <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-100"}`}>
                  {[...articles].sort((a, b) => b.views - a.views).slice(0, 5).map((a, i) => (
                    <button key={a.id} onClick={() => openReader(a)} className={`w-full px-4 py-2.5 flex items-center gap-3 text-left ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"} transition-colors`}>
                      <span className={`text-lg font-black w-5 ${sub}`}>{i + 1}</span>
                      <p className="text-[12px] font-semibold leading-tight line-clamp-2 flex-1">{a.title}</p>
                      <ChevronRight className={`w-4 h-4 ${sub} shrink-0`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Contributeurs */}
              <div className={`border rounded-2xl overflow-hidden ${card}`}>
                <div className={`px-4 py-3 ${subBg} border-b ${dark ? "border-white/10" : "border-gray-200"} flex items-center gap-2`}>
                  <Award className="w-4 h-4 text-amber-500" />
                  <p className="text-xs font-black uppercase tracking-widest">Top contributeurs</p>
                </div>
                <div className="p-3 space-y-2">
                  {["Rédaction JFN", "Pr. Amina Bello", "Club Informatique", "Radio Campus JFN", "Dép. Mathématiques"].map((n, i) => (
                    <div key={n} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ background: ["#7C3AED", "#0EA5E9", "#16A34A", "#DB2777", "#D97706"][i] }}>{n[0]}</div>
                      <p className="text-[11px] font-semibold flex-1 truncate">{n}</p>
                      <span className={`text-[9px] font-bold ${sub}`}>{[12, 8, 5, 4, 3][i]} articles</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── COMMUNAUTÉ ÉTUDIANTE ── */}
            {showComm && (
              <aside className="space-y-4 lg:sticky lg:top-[140px]">
                <div className={`border rounded-2xl overflow-hidden ${card}`}>
                  <div className={`px-4 py-3 ${subBg} border-b ${dark ? "border-white/10" : "border-gray-200"} flex items-center gap-2`}>
                    <Users className="w-4 h-4 text-cama" />
                    <p className="text-xs font-black uppercase tracking-widest">Communauté</p>
                    <span className="ml-auto flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className={`text-[10px] font-bold ${sub}`}>142 en ligne</span>
                    </span>
                  </div>
                  <div className={`divide-y ${dark ? "divide-white/5" : "divide-gray-100"} max-h-[400px] overflow-y-auto`}>
                    {comm.length === 0 && <p className={`text-center text-[11px] ${sub} py-6`}>Aucun message — lancez la discussion !</p>}
                    {comm.map((m) => (
                      <div key={m.id} className={`px-4 py-3 ${dark ? "hover:bg-white/5" : "hover:bg-gray-50"} transition-colors`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black" style={{ background: m.avatar }}>{m.author_name[0]}</div>
                          <p className="text-[11px] font-bold flex-1">{m.author_name}</p>
                          <span className={`text-[9px] ${sub}`}>{relTime(m.created_at)}</span>
                        </div>
                        <p className="text-[12px] leading-relaxed">{m.body}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => likeComm(m)} className={`flex items-center gap-1 text-[10px] ${sub} hover:text-pink-500 transition-colors`}>
                            <Heart className="w-3 h-3" /> {m.likes}
                          </button>
                          <button className={`flex items-center gap-1 text-[10px] ${sub} hover:text-cama transition-colors`}>
                            <MessageCircle className="w-3 h-3" /> Répondre
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`px-3 py-2 border-t ${dark ? "border-white/10" : "border-gray-200"} flex items-center gap-2`}>
                    <input value={commInput} onChange={(e) => setCommInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComm()}
                      placeholder={user ? "Écrire un message…" : "Connectez-vous pour écrire"} disabled={!user}
                      className={`flex-1 ${subBg} rounded-full px-3 py-1.5 text-xs ${dark ? "placeholder:text-white/30" : "placeholder:text-gray-400"} focus:outline-none disabled:opacity-50`} />
                    <button onClick={sendComm} disabled={!user || !commInput.trim()} className="w-8 h-8 rounded-full bg-cama flex items-center justify-center hover:bg-cama/90 transition-colors disabled:opacity-40">
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </main>
      )}

      {reader && <Reader a={reader} liked={likes.has(reader.id)} saved={saves.has(reader.id)} count={counts[reader.id] ?? 0}
        onLike={() => like(reader)} onSave={() => save(reader)} onClose={() => setReader(null)} dark={dark} />}

      {fullReel !== null && reels.length > 0 && (
        <ReelViewer
          reels={reels} idx={fullReel} setIdx={setFullReel}
          likes={likes} saves={saves} counts={counts}
          onLike={like} onSave={save}
          onOpenArticle={(a) => { setFullReel(null); openReader(a); }}
          onClose={() => setFullReel(null)}
        />
      )}

      <style jsx global>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function Reader({ a, liked, saved, count, onLike, onSave, onClose, dark }: {
  a: DBJournalArticle; liked: boolean; saved: boolean; count: number;
  onLike: () => void; onSave: () => void; onClose: () => void; dark: boolean;
}) {
  const bg = dark ? "bg-[#13131a]" : "bg-white";
  const sub = dark ? "text-white/60" : "text-gray-500";
  const border = dark ? "border-white/10" : "border-gray-200";
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className={`max-w-3xl mx-auto my-6 sm:my-12 ${bg} rounded-3xl overflow-hidden border ${border}`} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <img src={cover(a)} alt="" className="w-full h-64 sm:h-80 object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-t ${dark ? "from-[#13131a]" : "from-white"} via-transparent to-black/40`} />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
          {a.media_kind === "live" && (
            <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live · {a.media_at}
            </span>
          )}
        </div>
        <div className="p-6 sm:p-8 -mt-12 relative">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-cama mb-2">{a.rubrique}</span>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">{a.title}</h1>
          {a.subtitle && <p className={`${sub} text-base mt-2 italic`}>{a.subtitle}</p>}
          <div className={`flex items-center gap-4 mt-4 text-xs ${sub} border-y ${border} py-3`}>
            <span>{a.author}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {a.views} vues</span>
            {a.media_duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.media_duration}</span>}
          </div>

          {a.media_kind === "audio" && (
            <div className={`mt-4 ${dark ? "bg-white/5" : "bg-gray-100"} rounded-2xl p-4 flex items-center gap-3`}>
              <div className="w-12 h-12 rounded-full bg-cama flex items-center justify-center"><Play className="w-5 h-5 text-white fill-white ml-0.5" /></div>
              <div className="flex-1 flex items-center gap-[2px] h-8">
                {[5, 9, 14, 18, 12, 20, 16, 8, 13, 19, 11, 15, 7, 17, 10, 14, 6, 12, 18, 9].map((h, i) => (
                  <div key={i} className={`w-[3px] rounded-full ${i < 7 ? "bg-cama" : dark ? "bg-white/20" : "bg-gray-300"}`} style={{ height: `${h}px` }} />
                ))}
              </div>
              <span className={`text-xs ${sub}`}>{a.media_duration}</span>
            </div>
          )}

          {a.body && <p className={`${dark ? "text-white/80" : "text-gray-700"} leading-relaxed mt-5 whitespace-pre-line`}>{a.body}</p>}

          {a.refs && a.refs.length > 0 && (
            <div className={`mt-6 border-t ${border} pt-4`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${sub} mb-2`}>Références</p>
              <ul className="space-y-1">
                {a.refs.map((r, i) => <li key={i}><a href={r.href} className="text-sm text-cama hover:underline">↗ {r.label}</a></li>)}
              </ul>
            </div>
          )}

          {a.tags && a.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {a.tags.map((t) => <span key={t} className={`text-[11px] ${dark ? "bg-white/5 text-white/60" : "bg-gray-100 text-gray-600"} px-2.5 py-1 rounded-full`}>#{t}</span>)}
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 flex-wrap">
            <button onClick={onLike} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-colors ${liked ? "bg-pink-500/20 text-pink-400" : `${dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-pink-400" : ""}`} /> {count}
            </button>
            <button onClick={onSave} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-colors ${saved ? "bg-cama/20 text-cama" : `${dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}`}>
              <Bookmark className={`w-4 h-4 ${saved ? "fill-cama" : ""}`} /> {saved ? "Enregistré" : "Enregistrer"}
            </button>
            <button className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm ${dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} transition-colors ml-auto`}>
              <Share2 className="w-4 h-4" /> Partager
            </button>
            {a.cta_label && a.cta_href && (
              <a href={a.cta_href} className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-cama text-white hover:bg-cama/90 transition-colors">
                {a.cta_label} <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════ LECTEUR REELS PLEIN ÉCRAN — façon TikTok dans CAMA ════ */
function ReelViewer({ reels, idx, setIdx, likes, saves, counts, onLike, onSave, onOpenArticle, onClose }: {
  reels: DBJournalArticle[]; idx: number; setIdx: (i: number | null) => void;
  likes: Set<string>; saves: Set<string>; counts: Record<string, number>;
  onLike: (a: DBJournalArticle) => void; onSave: (a: DBJournalArticle) => void;
  onOpenArticle: (a: DBJournalArticle) => void; onClose: () => void;
}) {
  const go = (d: number) => setIdx(Math.max(0, Math.min(reels.length - 1, idx + d)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") go(1);
      if (e.key === "ArrowUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, reels.length]);

  // Swipe vertical (mobile)
  const startY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dy) > 60) go(dy < 0 ? 1 : -1);
    startY.current = null;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button onClick={onClose} className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors">
        <X className="w-5 h-5" />
      </button>
      <p className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-white/70 text-xs font-bold tracking-widest uppercase">JFN Reels</p>

      <div className="relative h-full w-full max-w-[440px] mx-auto overflow-hidden">
        {reels.map((a, i) => {
          const dy = (i - idx) * 100;
          const liked = likes.has(a.id), saved = saves.has(a.id);
          return (
            <div key={a.id} className="absolute inset-0 transition-transform duration-500 ease-out"
              style={{ transform: `translateY(${dy}%)` }}>
              <img src={cover(a)} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

              {a.media_kind === "live" && (
                <span className="absolute top-16 left-4 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                </span>
              )}

              {/* Centre : play */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>
              </div>

              {/* Légende bas */}
              <div className="absolute bottom-0 left-0 right-16 p-5">
                <p className="text-white text-sm font-bold flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cama to-violet-500 flex items-center justify-center text-[11px] font-black">{a.author[0]}</span>
                  {a.author}
                </p>
                <p className="text-white text-[15px] font-bold leading-snug">{a.title}</p>
                {a.subtitle && <p className="text-white/70 text-[12px] mt-1 line-clamp-2">{a.subtitle}</p>}
                {a.tags && a.tags.length > 0 && (
                  <p className="text-white/60 text-[12px] mt-2">{a.tags.slice(0, 4).map((t) => `#${t}`).join(" ")}</p>
                )}
                <button onClick={() => onOpenArticle(a)} className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur text-white text-[12px] font-bold px-3 py-1.5 rounded-full hover:bg-white/25 transition-colors">
                  Lire l&apos;article <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Actions droite */}
              <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
                <button onClick={() => onLike(a)} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${liked ? "bg-pink-500/30" : "bg-black/40 backdrop-blur"}`}>
                    <Heart className={`w-6 h-6 text-white ${liked ? "fill-pink-500" : ""}`} />
                  </div>
                  <span className="text-white text-[11px] font-bold">{counts[a.id] ?? 0}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"><MessageCircle className="w-6 h-6 text-white" /></div>
                  <span className="text-white text-[11px] font-bold">{a.views}</span>
                </button>
                <button onClick={() => onSave(a)} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${saved ? "bg-cama/40" : "bg-black/40 backdrop-blur"}`}>
                    <Bookmark className={`w-6 h-6 text-white ${saved ? "fill-cama" : ""}`} />
                  </div>
                  <span className="text-white text-[11px] font-bold">{saved ? "Saved" : "Save"}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"><Share2 className="w-6 h-6 text-white" /></div>
                  <span className="text-white text-[11px] font-bold">Share</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Nav haut/bas */}
        <button onClick={() => go(-1)} disabled={idx === 0}
          className="absolute right-4 top-1/2 -translate-y-14 z-20 w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white disabled:opacity-20 hover:bg-white/20 transition-colors"><ChevronUp className="w-5 h-5" /></button>
        <button onClick={() => go(1)} disabled={idx >= reels.length - 1}
          className="absolute right-4 top-1/2 translate-y-4 z-20 w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white disabled:opacity-20 hover:bg-white/20 transition-colors"><ChevronDown className="w-5 h-5" /></button>

        {/* Progression */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20">
          {reels.map((_, i) => <div key={i} className={`w-1 rounded-full transition-all ${i === idx ? "h-6 bg-white" : "h-2 bg-white/30"}`} />)}
        </div>
      </div>
    </div>
  );
}
