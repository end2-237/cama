"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, FileText, Video, MonitorPlay, Radio, Bot, Check,
  Lock, Download, ChevronDown, ChevronRight, Play, Pause, Volume2,
  Headphones, AlignLeft, Send, Sparkles, CheckCircle2, MessageSquare,
  Wifi, X, User, Phone, AudioLines, Mic, MicOff, PhoneOff,
  BookMarked, Clock, Star, Bell, Share2,
  Bookmark, Award, Zap, BarChart2, Target, Users,
  Pencil, ThumbsUp, RotateCcw, ExternalLink, Hash, StickyNote,
  Search, Filter, ChevronUp, BookOpen, X as XIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";
import { uid, BlocNatif, DBChapter } from "@/lib/db";

type Mode = "pdf" | "video" | "natif" | "live" | "ia";

const MODE_META: Record<Mode, { label: string; icon: typeof FileText }> = {
  pdf:   { label: "Support PDF",  icon: FileText },
  video: { label: "Vidéo",        icon: Video },
  natif: { label: "Cours natif",  icon: MonitorPlay },
  live:  { label: "Live",         icon: Radio },
  ia:    { label: "Prof IA",      icon: Bot },
};

export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { db, mutate } = useDB();

  const [chapIdx, setChapIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("natif");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  const course   = db?.courses.find((c) => c.id === id);
  const chapters = useMemo(
    () => (db?.chapters.filter((c) => c.courseId === id) || []).sort((a, b) => a.order - b.order),
    [db, id]
  );
  const ue = db?.ues.find((u) => u.id === course?.ueId);

  if (!db || !user || !course) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  const doneIds = new Set(db.progress.filter((p) => p.studentId === user.id).map((p) => p.chapterId));
  const chapter = chapters[chapIdx];
  /* Un chapitre est débloqué si le précédent est validé (checkpoint) */
  const unlocked = (i: number) => i === 0 || doneIds.has(chapters[i - 1].id);
  const pct = chapters.length ? Math.round((chapters.filter((c) => doneIds.has(c.id)).length / chapters.length) * 100) : 0;

  const availModes: Mode[] = [];
  if (chapter?.natif) availModes.push("natif");
  if (chapter?.pdf)   availModes.push("pdf");
  if (chapter?.video) availModes.push("video");
  if (chapter?.liveId) availModes.push("live");
  if (course.profIA)  availModes.push("ia");
  const activeMode: Mode = availModes.includes(mode) ? mode : availModes[0] || "natif";

  const validateChapter = () => {
    if (doneIds.has(chapter.id)) return;
    mutate((d) => {
      d.progress.push({ studentId: user.id, chapterId: chapter.id, doneAt: new Date().toISOString() });
    });
  };

  const doneCount = chapters.filter((c) => doneIds.has(c.id)).length;

  return (
    <div className="min-h-screen bg-surface" onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); } }}>
      {searchOpen && (
        <CourseSearch
          chapters={chapters}
          onClose={() => setSearchOpen(false)}
          onJump={(i) => { setChapIdx(i); setSearchOpen(false); }}
        />
      )}
      {/* Top bar */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center gap-4 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <p className="text-xs text-subtle min-w-0 truncate flex-1">
            Mes Cours <span className="mx-1">/</span> <span className="text-ink font-semibold">{course.title}</span>
          </p>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-28 h-1 bg-border overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cama to-gold transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-cama">{pct}%</span>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(120deg, #1E1B4B 0%, #312E81 55%, #4F46E5 100%)" }}>
        {/* Motif kente subtil */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 22px, #fff 22px, #fff 23px), repeating-linear-gradient(0deg, transparent, transparent 22px, #fff 22px, #fff 23px)",
        }} />
        {/* Arcs décoratifs */}
        <svg className="absolute -right-10 -top-16 w-72 h-72 opacity-20" viewBox="0 0 200 200" fill="none">
          {[80, 60, 40, 20].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} stroke="#F59E0B" strokeWidth="1.5" />
          ))}
        </svg>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-gold text-white px-2 py-0.5">{ue?.code}</span>
              <span className="text-[10px] font-bold text-white/60">{ue?.ects} ECTS · {ue?.semestre}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">{course.title}</h1>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[9px] font-bold">AB</div>
              Pr. Amina Bello
              <span className="text-white/30">·</span>
              {chapters.length} chapitres
              <span className="text-white/30">·</span>
              <span className="flex items-center gap-1">
                {course.profIA && <><Bot className="w-3.5 h-3.5 text-gold" /> Prof IA inclus</>}
              </span>
            </div>
          </div>

          {/* Droite hero : progression + bouton recherche */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-black text-gold leading-none">{pct}%</p>
                <p className="text-[10px] text-white/60 mt-1">{doneCount}/{chapters.length} chapitres validés</p>
              </div>
              <div className="w-14 h-14 relative">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F59E0B" strokeWidth="3"
                    strokeDasharray={`${pct} 100`} strokeLinecap="round" />
                </svg>
              </div>
            </div>
            {/* Bouton moteur de recherche */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all text-white text-xs font-bold backdrop-blur-sm">
              <Search className="w-3.5 h-3.5 text-gold" />
              Rechercher dans le cours
              <kbd className="text-[9px] font-mono bg-white/10 px-1.5 py-0.5 ml-1">Ctrl K</kbd>
            </button>
          </div>
        </div>

        {/* Tabs modes — intégrés au bas du hero */}
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-0 flex-wrap">
          {availModes.map((m) => {
            const Icon = MODE_META[m].icon;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all border-b-[3px] ${
                  activeMode === m
                    ? "bg-surface text-cama border-gold"
                    : "text-white/70 border-transparent hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" /> {MODE_META[m].label}
                {m === "live" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[260px_1fr_280px] gap-0 items-start">

        {/* ── Sidebar chapitres ── */}
        <aside className="bg-white border-r border-border lg:sticky lg:top-12 lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto">

          {/* Prochain live */}
          {db.lives.some((l) => l.courseId === course.id && l.status === "planifie") && (
            <div className="px-4 py-2 border-b border-border bg-red-50/50 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-red-600">Prochain live</p>
                <p className="text-[10px] text-ink truncate">{db.lives.find((l) => l.courseId === course.id && l.status === "planifie")?.title}</p>
              </div>
              <Bell className="w-3 h-3 text-red-400 flex-shrink-0" />
            </div>
          )}

          <div className="px-4 py-2.5 border-b-2 border-ink flex items-center justify-between">
            <p className="text-[10px] font-black text-ink uppercase tracking-widest">Chapitres</p>
            <span className="text-[9px] text-subtle">{doneCount}/{chapters.length}</span>
          </div>
          <div className="divide-y divide-border">
            {chapters.map((c, i) => {
              const done = doneIds.has(c.id);
              const open = unlocked(i);
              return (
                <button
                  key={c.id}
                  disabled={!open}
                  onClick={() => { setChapIdx(i); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                    i === chapIdx ? "bg-cama-50/60 border-l-cama" : open ? "hover:bg-surface border-l-transparent" : "opacity-50 cursor-not-allowed border-l-transparent"
                  }`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                    done ? "bg-green-500 text-white" : i === chapIdx ? "bg-cama text-white" : "bg-border text-subtle"
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : open ? c.order : <Lock className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${i === chapIdx ? "font-bold text-cama" : "font-medium text-ink"}`}>{c.title}</p>
                    <div className="flex gap-1.5 mt-1">
                      {c.pdf   && <FileText className="w-3 h-3 text-subtle" />}
                      {c.video && <Video className="w-3 h-3 text-subtle" />}
                      {c.natif && <MonitorPlay className="w-3 h-3 text-subtle" />}
                      {c.liveId && <Radio className="w-3 h-3 text-red-400" />}
                    </div>
                  </div>
                  {done && <Star className="w-3 h-3 text-gold flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Stats rapides */}
          <div className="px-4 py-3 border-t border-border grid grid-cols-2 gap-px bg-border">
            {[
              { icon: Clock,     label: "Temps estimé", value: `${chapters.length * 25} min` },
              { icon: Award,     label: "Crédits ECTS",  value: `${ue?.ects || 0} pts` },
              { icon: Target,    label: "Objectif",      value: doneCount >= chapters.length ? "Atteint ✓" : "En cours" },
              { icon: BarChart2, label: "Difficulté",    value: "Interméd." },
            ].map((s) => (
              <div key={s.label} className="bg-white p-2 text-center">
                <s.icon className="w-3 h-3 text-cama mx-auto mb-0.5" />
                <p className="text-[10px] font-bold text-ink leading-none">{s.value}</p>
                <p className="text-[9px] text-subtle mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Ressources du cours */}
          <div className="border-t border-border px-4 py-3">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1">
              <BookMarked className="w-3 h-3" /> Ressources
            </p>
            <div className="space-y-0.5">
              {[
                { icon: FileText,  label: "Syllabus complet",    sub: "PDF · 0.2 Mo" },
                { icon: Download,  label: "Supports chapitres",  sub: "ZIP · tous les PDF" },
                { icon: ExternalLink, label: "Bibliographie UE", sub: "Liens externes" },
              ].map((r) => (
                <button key={r.label} className="w-full flex items-center gap-2 px-1 py-1.5 hover:bg-surface transition-colors group text-left">
                  <r.icon className="w-3.5 h-3.5 text-subtle flex-shrink-0 group-hover:text-cama" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-ink group-hover:text-cama transition-colors truncate">{r.label}</p>
                    <p className="text-[9px] text-subtle">{r.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Forum UE */}
          <ForumPanel ueId={course.ueId} />
        </aside>

        {/* ── Contenu central ── */}
        <div className="min-w-0">
          <div className="bg-white border-r border-border p-6 animate-fade-up" key={`${chapter?.id}-${activeMode}`}>
            {/* En-tête chapitre enrichi */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-cama uppercase tracking-widest mb-1">Chapitre {chapter?.order}</p>
                <h2 className="text-2xl font-light text-ink leading-tight">{chapter?.title}</h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] text-subtle"><Clock className="w-3 h-3" /> ~25 min</span>
                  <span className="flex items-center gap-1 text-[10px] text-subtle"><Users className="w-3 h-3" />142 étudiants</span>
                  <span className="flex items-center gap-1 text-[10px] text-gold-dark"><Star className="w-3 h-3 fill-current" /> 4.7/5</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button title="Mettre en favori" className="p-1.5 text-subtle hover:text-gold transition-colors"><Bookmark className="w-4 h-4" /></button>
                <button title="Partager" className="p-1.5 text-subtle hover:text-cama transition-colors"><Share2 className="w-4 h-4" /></button>
              </div>
            </div>

            {activeMode === "pdf"   && chapter?.pdf   && <PdfMode pdf={chapter.pdf} />}
            {activeMode === "video" && chapter?.video && <VideoMode video={chapter.video} />}
            {activeMode === "natif" && chapter?.natif && <NatifMode blocks={chapter.natif.blocks} />}
            {activeMode === "live"  && chapter?.liveId && <LiveMode liveId={chapter.liveId} />}
            {activeMode === "ia"    && <ProfIA chapter={chapter} courseTitle={course.title} />}

            {/* Objectifs du chapitre */}
            <div className="mt-8 pt-5 border-t border-border">
              <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1">
                <Target className="w-3 h-3 text-cama" /> Objectifs pédagogiques
              </p>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {[
                  "Comprendre les concepts fondamentaux du chapitre",
                  "Appliquer les méthodes sur des cas pratiques",
                  "Analyser et comparer différentes approches",
                  "Synthétiser les points-clés pour l'examen",
                ].map((obj, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-muted">
                    <Zap className="w-3 h-3 text-cama flex-shrink-0 mt-0.5" />
                    {obj}
                  </div>
                ))}
              </div>
            </div>

            {/* Checkpoint */}
            <div className="mt-5 pt-5 border-t border-border flex items-center justify-between flex-wrap gap-3">
              {doneIds.has(chapter?.id) ? (
                <p className="flex items-center gap-2 text-green-600 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> Chapitre validé
                </p>
              ) : (
                <p className="text-sm text-muted">Validez ce checkpoint pour débloquer le chapitre suivant.</p>
              )}
              {!doneIds.has(chapter?.id) && (
                <button onClick={validateChapter}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white bg-cama px-6 py-2.5 hover:bg-cama-700 transition-colors">
                  <Check className="w-4 h-4" /> Valider le chapitre
                </button>
              )}
              {doneIds.has(chapter?.id) && chapIdx < chapters.length - 1 && (
                <button onClick={() => setChapIdx(chapIdx + 1)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white bg-cama px-6 py-2.5 hover:bg-cama-700 transition-colors">
                  Chapitre suivant <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Zone de notes personnelles */}
          <ChapterNotes chapId={chapter?.id || ""} />

          {/* Chapitres voisins */}
          <div className="bg-white border-r border-border border-t border-border px-6 py-4">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-3 flex items-center gap-1">
              <Hash className="w-3 h-3" /> Navigation dans le cours
            </p>
            <div className="grid grid-cols-2 gap-px bg-border">
              <button disabled={chapIdx === 0} onClick={() => setChapIdx(chapIdx - 1)}
                className="bg-white p-3 flex items-center gap-2 hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left">
                <ArrowLeft className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-subtle">Précédent</p>
                  <p className="text-[11px] font-bold text-ink truncate">{chapIdx > 0 ? chapters[chapIdx - 1]?.title : "—"}</p>
                </div>
              </button>
              <button disabled={chapIdx >= chapters.length - 1} onClick={() => setChapIdx(chapIdx + 1)}
                className="bg-white p-3 flex items-center justify-end gap-2 hover:bg-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-right">
                <div className="min-w-0">
                  <p className="text-[9px] text-subtle">Suivant</p>
                  <p className="text-[11px] font-bold text-ink truncate">{chapIdx < chapters.length - 1 ? chapters[chapIdx + 1]?.title : "—"}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar droite ── */}
        <div className="flex flex-col lg:sticky lg:top-12" style={{ height: "calc(100vh - 48px)" }}>

          {/* Évaluer ce chapitre */}
          <div className="bg-white border-b border-border px-4 py-3 flex-shrink-0">
            <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1">
              <Star className="w-3 h-3 text-gold-dark" /> Évaluer ce chapitre
            </p>
            <div className="flex items-center gap-2 mb-2">
              {[1,2,3,4,5].map((s) => (
                <button key={s} className="text-border hover:text-gold transition-colors">
                  <Star className="w-5 h-5" />
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {[
                { icon: ThumbsUp, label: "Clair" },
                { icon: Zap,      label: "Utile" },
                { icon: RotateCcw, label: "À revoir" },
              ].map((b) => (
                <button key={b.label}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold border border-border hover:border-cama/40 hover:text-cama transition-colors text-muted">
                  <b.icon className="w-3 h-3" />{b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat prof — prend le reste */}
          <ProfChat courseTitle={course.title} />
        </div>
      </div>
    </div>
  );
}

/* ════ MOTEUR DE RECHERCHE DU COURS ════ */
type SearchResult = {
  chapIdx: number;
  chapTitle: string;
  kind: string;
  snippet: string;
  score: number;
};

function CourseSearch({ chapters, onClose, onJump }: {
  chapters: DBChapter[];
  onClose: () => void;
  onJump: (i: number) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"tout" | "natif" | "pdf" | "video">("tout");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: SearchResult[] = [];
    chapters.forEach((c, i) => {
      if (filter === "natif" && !c.natif) return;
      if (filter === "pdf"   && !c.pdf)   return;
      if (filter === "video" && !c.video) return;

      /* Titre chapitre */
      if (c.title.toLowerCase().includes(term)) {
        out.push({ chapIdx: i, chapTitle: c.title, kind: "Titre", snippet: c.title, score: 3 });
      }
      /* Blocs natifs */
      c.natif?.blocks.forEach((b) => {
        const text = b.type === "definition" ? `${b.terme} : ${b.text}` : b.type === "quiz" ? b.question : "text" in b ? (b as { text: string }).text : "";
        if (text.toLowerCase().includes(term)) {
          const idx = text.toLowerCase().indexOf(term);
          const snippet = text.slice(Math.max(0, idx - 40), idx + 80).replace(/\n/g, " ");
          out.push({ chapIdx: i, chapTitle: c.title, kind: b.type === "quiz" ? "Quiz" : b.type === "definition" ? "Définition" : "Cours natif", snippet, score: 2 });
        }
      });
      /* Transcription vidéo */
      if (c.video?.transcript?.toLowerCase().includes(term)) {
        const t = c.video.transcript;
        const idx = t.toLowerCase().indexOf(term);
        out.push({ chapIdx: i, chapTitle: c.title, kind: "Transcription vidéo", snippet: t.slice(Math.max(0, idx - 40), idx + 80), score: 1 });
      }
      /* PDF nom */
      if (c.pdf?.name.toLowerCase().includes(term)) {
        out.push({ chapIdx: i, chapTitle: c.title, kind: "Support PDF", snippet: c.pdf.name, score: 1 });
      }
    });
    return out.sort((a, b) => b.score - a.score).slice(0, 12);
  }, [q, filter, chapters]);

  const highlight = (text: string) => {
    const term = q.trim();
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === term.toLowerCase()
        ? <mark key={i} className="bg-gold/40 text-ink font-bold">{p}</mark>
        : p
    );
  };

  const KIND_COLOR: Record<string, string> = {
    "Titre": "bg-cama text-white",
    "Quiz": "bg-gold/20 text-gold-dark",
    "Définition": "bg-purple-100 text-purple-700",
    "Cours natif": "bg-green-50 text-green-700",
    "Transcription vidéo": "bg-blue-50 text-blue-700",
    "Support PDF": "bg-red-50 text-red-600",
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] px-4"
      style={{ background: "rgba(15,14,40,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden animate-scale-in">

        {/* Barre de recherche */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-cama flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher dans tous les chapitres, définitions, quiz, PDF…"
            className="flex-1 text-sm text-ink placeholder-subtle outline-none bg-transparent"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-subtle hover:text-ink transition-colors flex-shrink-0">
              <XIcon className="w-4 h-4" />
            </button>
          )}
          <kbd onClick={onClose} className="text-[10px] font-mono bg-surface border border-border px-2 py-1 text-subtle cursor-pointer hover:text-ink transition-colors flex-shrink-0">Esc</kbd>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-0 border-b border-border px-4 py-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-subtle mr-2 flex-shrink-0" />
          {(["tout", "natif", "pdf", "video"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-[11px] font-bold mr-1 transition-colors flex-shrink-0 ${
                filter === f ? "bg-cama text-white" : "bg-surface text-muted hover:text-ink"
              }`}>
              {f === "tout" ? "Tout le cours" : f === "natif" ? "Cours natif" : f === "pdf" ? "PDF" : "Vidéo"}
            </button>
          ))}
          {q && <span className="ml-auto text-[10px] text-subtle flex-shrink-0">{results.length} résultat{results.length > 1 ? "s" : ""}</span>}
        </div>

        {/* Résultats */}
        <div className="max-h-[55vh] overflow-y-auto divide-y divide-border">
          {!q && (
            <div className="px-5 py-8 text-center">
              <BookOpen className="w-10 h-10 text-border mx-auto mb-3" />
              <p className="text-sm font-bold text-ink mb-1">Recherche dans le cours</p>
              <p className="text-xs text-muted">Titres de chapitres, définitions, cours natif, quiz, transcriptions, PDF</p>
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {["complexité", "arbre binaire", "hachage", "quiz", "résumé"].map((s) => (
                  <button key={s} onClick={() => setQ(s)}
                    className="text-[11px] text-cama border border-cama/20 px-3 py-1.5 hover:bg-cama/5 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {q && results.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm font-bold text-ink mb-1">Aucun résultat pour « {q} »</p>
              <p className="text-xs text-muted">Essayez un autre terme ou changez le filtre.</p>
            </div>
          )}
          {results.map((r, i) => (
            <button key={i} onClick={() => onJump(r.chapIdx)}
              className="w-full flex items-start gap-3 px-5 py-3 hover:bg-cama/5 transition-colors text-left group">
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-[9px] font-black px-1.5 py-0.5 ${KIND_COLOR[r.kind] || "bg-surface text-subtle"}`}>
                  {r.kind}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-cama mb-0.5">{r.chapTitle}</p>
                <p className="text-xs text-ink leading-relaxed line-clamp-2">{highlight(r.snippet)}</p>
              </div>
              <ChevronUp className="w-3.5 h-3.5 text-subtle rotate-90 flex-shrink-0 mt-0.5 group-hover:text-cama transition-colors" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-border bg-surface flex items-center justify-between">
          <p className="text-[10px] text-subtle">Recherche dans les ressources de ce cours uniquement · IA désactivée</p>
          <div className="flex items-center gap-2 text-[9px] text-subtle">
            <kbd className="bg-white border border-border px-1.5 py-0.5 font-mono">↵</kbd> Accéder au chapitre
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════ CHAT PROF (enseignant réel) ════ */
type ChatMsg = { from: "prof" | "moi"; text: string };

const PROF_INIT: ChatMsg[] = [
  { from: "prof", text: "Bonjour ! Je suis disponible pour vos questions sur ce cours. N'hésitez pas. 👋" },
];

const PROF_REPLIES = [
  "Bonne question ! Je regarderai ça dès que possible et reviendrai vers vous.",
  "Oui, exactement. Relisez la section 2.3 du cours natif, c'est bien expliqué là-dedans.",
  "Je comprends la confusion. En pratique, la différence est surtout visible quand n > 1000.",
  "Vous pouvez poster ça aussi dans le forum UE pour que les autres étudiants en profitent !",
  "Excellente remarque. J'en parlerai lors du prochain live pour tout le groupe.",
];

function ProfChat({ courseTitle }: { courseTitle: string }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(PROF_INIT);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [online] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  function send() {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { from: "moi" as ChatMsg["from"], text: q }]);
    setTyping(true);
    const delay = 1200 + Math.random() * 1000;
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "prof" as ChatMsg["from"], text: PROF_REPLIES[Math.floor(Math.random() * PROF_REPLIES.length)] }]);
    }, delay);
  }

  return (
    <aside className="bg-white overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-cama/5 to-indigo-50 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-cama flex items-center justify-center text-white text-sm font-bold">AB</div>
          {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-ink leading-tight">Pr. Amina Bello</p>
          <p className="text-[10px] text-muted">Enseignante · {courseTitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-surface transition-colors" title="Appel vocal (bientôt)">
            <Phone className="w-3.5 h-3.5 text-subtle" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-surface transition-colors" title="Profil enseignant">
            <User className="w-3.5 h-3.5 text-subtle" />
          </button>
        </div>
      </div>

      {/* Info disponibilité */}
      <div className="px-3 py-2 bg-green-50 border-b border-green-100 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
        <p className="text-[10px] text-green-700 font-medium">En ligne · répond généralement en quelques minutes</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F9FAFB]" style={{ minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "moi" ? "justify-end" : "justify-start"}`}>
            {m.from === "prof" && (
              <div className="w-6 h-6 rounded-full bg-cama flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-[9px] font-bold text-white">AB</div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              m.from === "moi"
                ? "bg-cama text-white rounded-tr-sm"
                : "bg-white border border-border text-ink rounded-tl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-cama flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-[9px] font-bold text-white">AB</div>
            <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map((k) => (
                <span key={k} className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce" style={{ animationDelay: `${k * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Questions rapides */}
      <div className="px-3 pt-2 flex flex-col gap-1.5 bg-white border-t border-border">
        {["Je n'ai pas compris l'exemple", "Pouvez-vous donner plus d'exercices ?"].map((s) => (
          <button key={s} onClick={() => { setInput(s); }}
            className="text-[10px] text-cama border border-cama/20 rounded-full px-2.5 py-1.5 hover:bg-cama/8 transition-colors text-left font-medium">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-white flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Écrire au professeur…"
          className="flex-1 text-xs bg-[#F9FAFB] border border-border rounded-xl px-3 py-2.5 outline-none focus:border-cama transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="w-8 h-8 rounded-xl bg-cama hover:bg-cama-700 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </aside>
  );
}

/* ════ MODE PDF — Data budgeting + lecture page à page ════ */
function PdfMode({ pdf }: { pdf: NonNullable<DBChapter["pdf"]> }) {
  const [page, setPage] = useState(1);
  const [downloaded, setDownloaded] = useState(false);
  return (
    <div>
      {/* Data budgeting */}
      <div className="flex items-center gap-3 bg-gold/5 border border-gold/20 rounded-xl p-4 mb-5">
        <Wifi className="w-5 h-5 text-gold-dark flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">{pdf.name}</p>
          <p className="text-xs text-muted">Poids : <strong>{pdf.sizeMo} Mo</strong> · {pdf.pages} pages · Compressé pour bas-débit</p>
        </div>
        <button
          onClick={() => setDownloaded(true)}
          className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border-2 transition-all ${
            downloaded ? "border-green-500 text-green-600 bg-green-50" : "border-cama text-cama hover:bg-cama-50"
          }`}
        >
          {downloaded ? <><Check className="w-4 h-4" /> Hors-ligne</> : <><Download className="w-4 h-4" /> Télécharger ({pdf.sizeMo} Mo)</>}
        </button>
      </div>

      {/* Lecture page à page */}
      <div className="bg-surface rounded-xl border border-border aspect-[4/3] max-h-[420px] w-full flex flex-col items-center justify-center mb-4 relative overflow-hidden">
        <div className="absolute inset-x-8 top-8 bottom-8 bg-white rounded-lg shadow-md p-6 flex flex-col gap-2">
          <div className="h-3 w-2/3 bg-cama-100 rounded" />
          <div className="h-2 w-full bg-border rounded mt-2" />
          <div className="h-2 w-full bg-border rounded" />
          <div className="h-2 w-5/6 bg-border rounded" />
          <div className="h-2 w-full bg-border rounded mt-2" />
          <div className="h-2 w-4/6 bg-border rounded" />
          <div className="h-16 w-full bg-cama-50 rounded mt-3" />
          <div className="h-2 w-full bg-border rounded mt-2" />
          <div className="h-2 w-3/4 bg-border rounded" />
          <p className="text-[10px] text-subtle mt-auto text-center">Page {page} / {pdf.pages} — seule la page courante est chargée</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setPage(Math.max(1, page - 1))} className="btn-outline py-2 px-4 text-sm">← Précédente</button>
        <span className="text-sm font-bold text-ink">{page} / {pdf.pages}</span>
        <button onClick={() => setPage(Math.min(pdf.pages, page + 1))} className="btn-primary py-2 px-4 text-sm">Suivante →</button>
      </div>
    </div>
  );
}

/* ════ MODE VIDÉO — qualités, audio seul, transcription ════ */
function VideoMode({ video }: { video: NonNullable<DBChapter["video"]> }) {
  const [playing, setPlaying]   = useState(false);
  const [quality, setQuality]   = useState<"240p" | "360p" | "480p" | "720p">("360p");
  const [audioOnly, setAudioOnly] = useState(false);
  const [showTrans, setShowTrans] = useState(false);
  const [pos, setPos] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => setPos((p) => Math.min(p + 1, video.durationMin * 60)), 1000);
    } else if (timer.current) clearInterval(timer.current);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, video.durationMin]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const sizes = { "240p": Math.round(video.sizeMo * 0.3), "360p": Math.round(video.sizeMo * 0.5), "480p": Math.round(video.sizeMo * 0.75), "720p": video.sizeMo };

  return (
    <div>
      {/* Lecteur */}
      <div className={`rounded-xl overflow-hidden mb-4 relative aspect-video flex items-center justify-center ${audioOnly ? "bg-cama-900" : "bg-ink"}`}>
        {audioOnly ? (
          <div className="text-center">
            <Headphones className="w-14 h-14 text-gold mx-auto mb-3" />
            <p className="text-white font-bold">{video.title}</p>
            <p className="text-white/50 text-sm">Mode audio seul — ~{Math.round(video.sizeMo * 0.12)} Mo</p>
            {playing && (
              <div className="flex items-center justify-center gap-1 mt-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-1 bg-gold rounded-full animate-pulse" style={{ height: `${12 + (i % 3) * 8}px`, animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=60" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            <button onClick={() => setPlaying(!playing)}
              className="relative z-10 w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
              {playing ? <Pause className="w-7 h-7 text-cama" /> : <Play className="w-7 h-7 text-cama ml-1" />}
            </button>
            <span className="absolute top-3 right-3 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded">{quality}</span>
          </>
        )}
        {/* Barre */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-3">
          <button onClick={() => setPlaying(!playing)} className="text-white">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-cama-400" style={{ width: `${(pos / (video.durationMin * 60)) * 100}%` }} />
          </div>
          <span className="text-[10px] text-white/80">{fmt(pos)} / {video.durationMin}:00</span>
          <Volume2 className="w-4 h-4 text-white/80" />
        </div>
      </div>

      {/* Contrôles bas-débit */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-muted font-semibold mr-1">Qualité :</span>
        {(["240p", "360p", "480p", "720p"] as const).map((q) => (
          <button key={q} onClick={() => { setQuality(q); setAudioOnly(false); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              quality === q && !audioOnly ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/40"
            }`}>
            {q} · {sizes[q]} Mo
          </button>
        ))}
        <button onClick={() => setAudioOnly(!audioOnly)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
            audioOnly ? "border-gold bg-gold text-white" : "border-border text-muted hover:border-gold/50"
          }`}>
          <Headphones className="w-3.5 h-3.5" /> Audio seul · {Math.round(video.sizeMo * 0.12)} Mo
        </button>
      </div>

      {/* Transcription */}
      <button onClick={() => setShowTrans(!showTrans)}
        className="flex items-center gap-2 text-sm font-bold text-cama hover:underline mb-3">
        <AlignLeft className="w-4 h-4" />
        Transcription texte (IA) — apprendre sans télécharger
        <ChevronDown className={`w-4 h-4 transition-transform ${showTrans ? "rotate-180" : ""}`} />
      </button>
      {showTrans && (
        <div className="bg-surface border border-border rounded-xl p-5 text-sm text-muted leading-relaxed animate-fade-up">
          {video.transcript}
          <p className="text-[10px] text-subtle mt-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Transcription générée automatiquement — ~0,01 Mo
          </p>
        </div>
      )}
    </div>
  );
}

/* ════ MODE COURS NATIF — blocs interactifs ════ */
function NatifMode({ blocks }: { blocks: BlocNatif[] }) {
  return (
    <div className="space-y-5 max-w-2xl">
      {blocks.map((b, i) => <Bloc key={i} b={b} />)}
      <p className="text-[10px] text-subtle flex items-center gap-1 pt-2">
        <Wifi className="w-3 h-3" /> Contenu 100% texte/HTML — idéal en zone à débit critique (~0,05 Mo)
      </p>
    </div>
  );
}

function Bloc({ b }: { b: BlocNatif }) {
  const [open, setOpen]   = useState(false);
  const [pick, setPick]   = useState<number | null>(null);

  if (b.type === "titre") return <h2 className="text-xl font-bold text-ink">{b.text}</h2>;
  if (b.type === "texte") return <p className="text-muted leading-relaxed">{b.text}</p>;
  if (b.type === "point") return (
    <div className="flex items-start gap-3 bg-cama-50/60 border-l-4 border-cama rounded-r-xl p-4">
      <Sparkles className="w-4 h-4 text-cama mt-0.5 flex-shrink-0" />
      <p className="text-sm text-ink font-medium">{b.text}</p>
    </div>
  );
  if (b.type === "definition") return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-cama-50/40 transition-colors">
        <span className="text-sm font-bold text-ink">📖 {b.terme}</span>
        <ChevronDown className={`w-4 h-4 text-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-4 py-3 text-sm text-muted leading-relaxed animate-fade-up">{b.text}</p>}
    </div>
  );
  /* quiz */
  return (
    <div className="border-2 border-gold/30 bg-gold/5 rounded-xl p-5">
      <p className="text-xs font-bold text-gold-dark uppercase tracking-wider mb-2">Quiz d&apos;auto-évaluation</p>
      <p className="text-sm font-semibold text-ink mb-3">{b.question}</p>
      <div className="space-y-2">
        {b.options.map((o, i) => {
          const chosen = pick === i;
          const good = pick !== null && i === b.bonne;
          const bad = chosen && i !== b.bonne;
          return (
            <button key={i} onClick={() => setPick(i)}
              className={`w-full text-left text-sm px-4 py-2.5 rounded-xl border-2 transition-all ${
                good ? "border-green-500 bg-green-50 text-green-700 font-bold"
                : bad ? "border-red-400 bg-red-50 text-red-600"
                : "border-border bg-white hover:border-cama/40"
              }`}>
              {o} {good && "✓"} {bad && "✗"}
            </button>
          );
        })}
      </div>
      {pick !== null && (
        <p className={`text-xs font-bold mt-3 ${pick === b.bonne ? "text-green-600" : "text-red-500"}`}>
          {pick === b.bonne ? "Bonne réponse ! Vous pouvez continuer." : "Réessayez — relisez le point-clé ci-dessus."}
        </p>
      )}
    </div>
  );
}

/* ════ MODE LIVE — accès à la classe virtuelle ════ */
function LiveMode({ liveId }: { liveId: string }) {
  const { db } = useDB();
  const live = db?.lives.find((l) => l.id === liveId);
  if (!live) return null;
  const date = new Date(live.date);
  return (
    <div className="border-2 border-border rounded-2xl p-6 text-center max-w-md mx-auto">
      <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
        live.status === "encours" ? "bg-red-50" : "bg-cama-50"}`}>
        <Radio className={`w-7 h-7 ${live.status === "encours" ? "text-red-500" : "text-cama"}`} />
      </div>
      <h3 className="font-bold text-ink mb-1">{live.title}</h3>
      <p className="text-sm text-muted mb-1">
        {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} · {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {live.durationMin} min
      </p>
      {live.status === "encours" ? (
        <>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> EN DIRECT
          </p>
          <Link href={`/live/${live.id}`} className="btn-primary w-full justify-center gap-2">
            <Radio className="w-4 h-4" /> Rejoindre le live
          </Link>
        </>
      ) : live.status === "termine" ? (
        <p className="text-sm text-green-600 font-bold mt-2">
          {live.replayPublie ? "Replay disponible dans l'onglet Vidéo" : "Live terminé — replay en cours de publication"}
        </p>
      ) : (
        <p className="badge bg-cama-50 text-cama mt-2">Planifié</p>
      )}
      <p className="text-[10px] text-subtle mt-4">Mode audio seul disponible · enregistré pour replay — personne n&apos;est exclu.</p>
    </div>
  );
}

/* ════ MODE PROF IA — tuteur ancré sur les ressources ════ */
function ProfIA({ chapter, courseTitle }: { chapter: DBChapter; courseTitle: string }) {
  const [msgs, setMsgs] = useState<{ from: "ia" | "moi"; text: string }[]>([
    { from: "ia", text: `Bonjour ! Je suis votre Prof IA, ancré sur les ressources du cours « ${courseTitle} ». Posez-moi une question sur le chapitre « ${chapter.title} », demandez un exercice, un résumé ou une fiche de révision.` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const reply = (q: string): string => {
    const lq = q.toLowerCase();
    const src = [
      chapter.video?.transcript || "",
      ...(chapter.natif?.blocks.map((b) => ("text" in b ? b.text : b.type === "quiz" ? b.question : "")) || []),
    ].join(" ");

    if (lq.includes("résum") || lq.includes("fiche")) {
      const pts = chapter.natif?.blocks.filter((b) => b.type === "point" || b.type === "definition") || [];
      return `📝 Fiche de révision — ${chapter.title} :\n\n${pts.map((p, i) =>
        `${i + 1}. ${"terme" in p ? `${p.terme} : ${p.text}` : p.text}`).join("\n")}\n\nCes points proviennent directement des ressources déposées par votre enseignant.`;
    }
    if (lq.includes("exercice") || lq.includes("qcm") || lq.includes("entraîn")) {
      const quiz = chapter.natif?.blocks.find((b) => b.type === "quiz");
      if (quiz && quiz.type === "quiz") {
        return `💪 Exercice d'entraînement :\n\n${quiz.question}\n${quiz.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}\n\nRépondez-moi avec la lettre, je vous donnerai un feedback formatif.`;
      }
      return "💪 Exercice : expliquez avec vos propres mots le concept central de ce chapitre. Je corrigerai votre réponse.";
    }
    if (/^[a-d]$/i.test(lq.trim())) {
      const quiz = chapter.natif?.blocks.find((b) => b.type === "quiz");
      if (quiz && quiz.type === "quiz") {
        const idx = lq.trim().toUpperCase().charCodeAt(0) - 65;
        return idx === quiz.bonne
          ? "✅ Excellente réponse ! Vous maîtrisez ce point. Voulez-vous un exercice plus difficile ou passer au résumé ?"
          : `❌ Pas tout à fait. Relisez le point-clé du chapitre : la bonne réponse était « ${quiz.options[quiz.bonne!]} ». Voulez-vous que je vous l'explique autrement ?`;
      }
    }
    if (lq.includes("complexité") || lq.includes("big-o") || lq.includes("big o")) {
      return "La complexité algorithmique mesure l'efficacité d'un algorithme selon la taille n de l'entrée. D'après le cours : O(1) constant, O(log n) logarithmique, O(n) linéaire, O(n²) quadratique. Pour n = 1000, un O(n²) fait un million d'opérations — d'où l'importance du bon choix d'algorithme, surtout sur les téléphones d'entrée de gamme courants au Cameroun.";
    }
    if (lq.includes("arbre") || lq.includes("abr")) {
      return "D'après les ressources du cours : un arbre binaire de recherche (ABR) place les valeurs inférieures à gauche et supérieures à droite de chaque nœud. Recherche/insertion/suppression en O(log n) si l'arbre est équilibré (sinon O(n) — arbre dégénéré). Les rotations permettent le rééquilibrage (arbres AVL). Voulez-vous un exercice là-dessus ?";
    }
    if (lq.includes("hachage") || lq.includes("hash")) {
      return "Une table de hachage associe clés et valeurs via une fonction de hachage, avec un accès moyen en O(1). Le point délicat couvert par votre enseignant : la gestion des collisions (chaînage ou adressage ouvert).";
    }
    if (lq.includes("html") || lq.includes("css") || lq.includes("dom") || lq.includes("javascript")) {
      return "D'après le cours : HTML structure le contenu, CSS le met en forme, JavaScript anime. Le DOM est l'arbre des éléments de la page que JavaScript manipule ; fetch() permet d'appeler une API sans recharger la page. Besoin d'un exemple ?";
    }
    if (src.length > 0) {
      return `Bonne question ! En me basant sur les ressources de ce chapitre : ${src.slice(0, 220)}…\n\nVoulez-vous que je développe un point précis, ou que je génère un QCM d'entraînement ?`;
    }
    return "Je ne trouve pas ce point dans les ressources déposées pour ce chapitre — je préfère ne pas inventer (réponses ancrées uniquement). Reformulez ou demandez-moi un résumé du chapitre.";
  };

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMsgs((m) => [...m, { from: "moi", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "ia", text: reply(q) }]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  };

  return (
    <div className="max-w-2xl">
      {voiceMode && <VoiceLive chapterTitle={chapter.title} onClose={() => setVoiceMode(false)} />}

      <div className="flex items-center gap-2 bg-cama-50 border border-cama/15 px-4 py-2 mb-4">
        <Bot className="w-4 h-4 text-cama flex-shrink-0" />
        <p className="text-xs text-cama font-medium flex-1">Réponses ancrées sur les ressources du cours · inactif pendant les examens · échanges texte ultra-légers</p>
        <button onClick={() => setVoiceMode(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 flex-shrink-0 hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #4F46E5, #1E1B4B)" }}>
          <AudioLines className="w-3.5 h-3.5 text-gold" /> Mode vocal live
        </button>
      </div>
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-surface">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "moi" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                m.from === "moi" ? "bg-cama text-white rounded-br-sm" : "bg-white border border-border text-ink rounded-bl-sm"
              }`}>
                {m.from === "ia" && <p className="text-[10px] font-bold text-cama mb-1 flex items-center gap-1"><Bot className="w-3 h-3" /> Prof IA</p>}
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2 p-3 bg-white border-t border-border">
          {["Résume le chapitre", "Donne-moi un exercice"].map((s) => (
            <button key={s} onClick={() => { setInput(s); }} className="hidden sm:block text-[11px] text-cama border border-cama/30 rounded-full px-2.5 py-1 hover:bg-cama-50 transition-colors flex-shrink-0">
              {s}
            </button>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Posez votre question…"
            className="flex-1 text-sm outline-none text-ink placeholder-subtle min-w-0"
          />
          <button onClick={send} className="w-9 h-9 rounded-full bg-cama text-white flex items-center justify-center hover:bg-cama-700 transition-colors flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════ NOTES PERSONNELLES ════ */
function ChapterNotes({ chapId }: { chapId: string }) {
  const key = `notes-chap-${chapId}`;
  const [note, setNote] = useState(() => (typeof window !== "undefined" ? localStorage.getItem(key) || "" : ""));
  const [saved, setSaved] = useState(false);
  const save = () => {
    localStorage.setItem(key, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <div className="bg-white border-r border-border border-t border-border px-6 py-4">
      <p className="text-[9px] font-black text-subtle uppercase tracking-widest mb-2 flex items-center gap-1">
        <StickyNote className="w-3 h-3 text-gold-dark" /> Mes notes — chapitre
        <span className="ml-auto text-[8px] text-subtle font-normal normal-case">sauvegardé localement</span>
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Écrivez vos notes, questions, idées pour ce chapitre…"
        rows={4}
        className="w-full text-xs text-ink placeholder-subtle bg-surface border border-border p-2.5 outline-none focus:border-cama transition-colors resize-none leading-relaxed"
      />
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[9px] text-subtle">{note.length} caractères</p>
        <button onClick={save}
          className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1 transition-colors ${
            saved ? "bg-green-50 text-green-600" : "bg-cama text-white hover:bg-cama-700"
          }`}>
          {saved ? <><Check className="w-3 h-3" /> Sauvegardé</> : <><Pencil className="w-3 h-3" /> Sauvegarder</>}
        </button>
      </div>
    </div>
  );
}

/* ════ FORUM UE (sidebar) ════ */
function ForumPanel({ ueId }: { ueId: string }) {
  const { db, mutate } = useDB();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const msgs = db?.forum.filter((f) => f.ueId === ueId) || [];

  const post = () => {
    if (!text.trim() || !user) return;
    mutate((d) => {
      d.forum.push({ id: uid("f"), ueId, author: user.name, role: user.role, text: text.trim(),
        time: "À l'instant" });
    });
    setText("");
  };

  return (
    <div className="border-t border-border">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors">
        <span className="flex items-center gap-2 text-xs font-bold text-ink">
          <MessageSquare className="w-4 h-4 text-cama" /> Forum de l&apos;UE
          <span className="text-[10px] bg-cama-50 text-cama px-1.5 py-0.5 rounded-full">{msgs.length}</span>
        </span>
        {open ? <X className="w-3.5 h-3.5 text-subtle" /> : <ChevronDown className="w-3.5 h-3.5 text-subtle" />}
      </button>
      {open && (
        <div className="px-4 pb-4 animate-fade-up">
          <div className="space-y-3 max-h-56 overflow-y-auto mb-3">
            {msgs.map((m) => (
              <div key={m.id} className="text-xs">
                <p className="font-bold text-ink flex items-center gap-1.5">
                  {m.author}
                  {m.role === "enseignant" && <span className="text-[9px] bg-gold/10 text-gold-dark px-1.5 rounded-full">Enseignant</span>}
                </p>
                <p className="text-muted leading-relaxed mt-0.5">{m.text}</p>
                <p className="text-[9px] text-subtle mt-0.5">{m.time}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && post()}
              placeholder="Poser une question…"
              className="flex-1 text-xs border border-border rounded-full px-3 py-2 outline-none focus:border-cama min-w-0" />
            <button onClick={post} className="w-8 h-8 rounded-full bg-cama text-white flex items-center justify-center flex-shrink-0">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════ PROF IA — MODE VOCAL LIVE (plein écran, style Gemini Live) ════ */
const VOICE_SCRIPT = [
  { state: "speaking",  text: "Bonjour Jean-Paul ! Je suis votre Prof IA en mode vocal. De quoi voulez-vous parler dans ce chapitre ?", dur: 5200 },
  { state: "listening", text: "« Explique-moi la complexité algorithmique simplement »", dur: 4200 },
  { state: "thinking",  text: "", dur: 1800 },
  { state: "speaking",  text: "Imaginez que vous cherchez un nom dans l'annuaire de Yaoundé. Page par page, c'est O(n) : lent. En l'ouvrant au milieu et en éliminant la moitié à chaque fois, c'est O(log n) : rapide. La complexité, c'est ça — compter les étapes selon la taille du problème.", dur: 11000 },
  { state: "listening", text: "« Et pourquoi O(n²) est mauvais ? »", dur: 3600 },
  { state: "thinking",  text: "", dur: 1500 },
  { state: "speaking",  text: "Pour n = 1000 éléments, un algorithme O(n²) fait un million d'opérations contre mille pour un O(n). Sur un téléphone d'entrée de gamme, la différence se sent immédiatement. C'est exactement le point-clé de votre chapitre.", dur: 9500 },
] as const;

function VoiceLive({ chapterTitle, onClose }: { chapterTitle: string; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  /* Plein écran natif à l'ouverture */
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };
  }, []);

  /* Chrono */
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  /* Déroulé du scénario vocal */
  useEffect(() => {
    const cur = VOICE_SCRIPT[step % VOICE_SCRIPT.length];
    const t = setTimeout(() => setStep((s) => s + 1), cur.dur);
    return () => clearTimeout(t);
  }, [step]);

  const cur = VOICE_SCRIPT[step % VOICE_SCRIPT.length];
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const stateLabel = { speaking: "Prof IA parle…", listening: "Je vous écoute…", thinking: "Réflexion…" }[cur.state];

  return (
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-between overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 35%, #312E81 0%, #1E1B4B 55%, #0d0b2b 100%)" }}>

      {/* Header */}
      <div className="w-full flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-white font-bold text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-gold" /> Prof IA — Vocal live
          </p>
          <p className="text-white/40 text-[11px]">{chapterTitle} · ancré sur les ressources du cours</p>
        </div>
        <div className="flex items-center gap-2 text-white/50 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {fmt(elapsed)}
        </div>
      </div>

      {/* Orbe central animé */}
      <div className="flex flex-col items-center gap-8">
        <div className="relative w-52 h-52 flex items-center justify-center">
          {/* Anneaux pulsants */}
          {cur.state === "speaking" && [0, 1, 2].map((i) => (
            <div key={i} className="absolute inset-0 rounded-full border-2 border-gold/30 animate-ping"
              style={{ animationDuration: "2.2s", animationDelay: `${i * 0.5}s` }} />
          ))}
          {cur.state === "listening" && (
            <div className="absolute -inset-3 rounded-full border-2 border-green-400/40 animate-pulse" />
          )}
          {/* Orbe */}
          <div className={`w-40 h-40 rounded-full transition-all duration-700 flex items-center justify-center ${
            cur.state === "speaking" ? "scale-110" : cur.state === "thinking" ? "scale-90" : "scale-100"}`}
            style={{
              background: cur.state === "listening"
                ? "radial-gradient(circle at 35% 30%, #4ade80, #16a34a 60%, #14532d)"
                : "radial-gradient(circle at 35% 30%, #818CF8, #4F46E5 55%, #1E1B4B)",
              boxShadow: cur.state === "speaking"
                ? "0 0 90px rgba(245,158,11,.45), 0 0 40px rgba(99,102,241,.6)"
                : "0 0 60px rgba(99,102,241,.45)",
            }}>
            {/* Barres audio quand l'IA parle */}
            {cur.state === "speaking" ? (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-2 bg-white/90 rounded-full animate-pulse"
                    style={{ height: `${18 + ((i * 13) % 30)}px`, animationDuration: ".6s", animationDelay: `${i * 110}ms` }} />
                ))}
              </div>
            ) : cur.state === "listening" ? (
              <Mic className="w-12 h-12 text-white/90" />
            ) : (
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* État + sous-titres */}
        <div className="text-center px-6 max-w-xl">
          <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${
            cur.state === "listening" ? "text-green-400" : cur.state === "speaking" ? "text-gold" : "text-white/50"}`}>
            {stateLabel}
          </p>
          {cur.text && (
            <p className={`leading-relaxed animate-fade-up ${
              cur.state === "listening" ? "text-white/60 italic text-sm" : "text-white text-base"}`} key={step}>
              {cur.text}
            </p>
          )}
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex items-center gap-4 pb-10">
        <button onClick={() => setMuted(!muted)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            muted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20 border border-white/15"}`}
          title={muted ? "Réactiver le micro" : "Couper le micro"}>
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button onClick={onClose}
          className="h-14 px-8 rounded-full bg-red-500 text-white flex items-center gap-2.5 font-bold hover:bg-red-600 transition-colors">
          <PhoneOff className="w-5 h-5" /> Terminer
        </button>
        <button onClick={onClose}
          className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/15 flex items-center justify-center transition-all"
          title="Revenir au chat texte">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      <p className="absolute bottom-3 text-[10px] text-white/25">Prototype — synthèse et reconnaissance vocales simulées · ~0,2 Mo/min en production</p>
    </div>
  );
}
