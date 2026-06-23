"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, Clock, ChevronRight, Play, Radio, ShieldCheck,
  FileText, Video, MonitorPlay, Bot, CheckCircle2, TrendingUp,
  Star, Award, GraduationCap, QrCode, AlertCircle, Calendar,
  Newspaper, ExternalLink, BookMarked,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchStudentProgram, fetchChapters, fetchProgress } from "@/lib/program";
import { fetchOpenExams, fetchAttemptsForStudent, fetchDeliberations } from "@/lib/exams";
import type { DBProgramCourse, DBChapter, DBExam, DBExamAttempt } from "@/lib/supabase";
import type { DelibWithMeta } from "@/lib/exams";
import { COURS_INTERMEDIAIRES, formatFcfa } from "@/lib/parcours";

/* Visuels des cours hors cursus (par slug) */
const HORS_CURSUS_IMG: Record<string, string> = {
  anglais:        "https://images.unsplash.com/photo-1543109740-4bdb38fda756?w=480&q=70",
  diction:        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=480&q=70",
  bureautique:    "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=480&q=70",
  entrepreneuriat:"https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=480&q=70",
  allemand:       "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=480&q=70",
  design:         "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=480&q=70",
};

export default function StudentView({ tab }: { tab: string }) {
  if (tab === "Examens")   return <ExamsTab />;
  if (tab === "Résultats") return <ResultsTab />;
  return <CoursesTab />;
}

/* ════ JOURNAL DU CAMPUS — fil d'actualités éditorial ════ */
type Media =
  | { kind: "image"; src: string; legend: string }
  | { kind: "video"; src: string; duration: string; legend: string }
  | { kind: "audio"; duration: string; legend: string }
  | { kind: "reel";  src: string; duration: string; legend: string }
  | { kind: "live";  src: string; at: string }
  | { kind: "none" };

interface Article {
  rubrique: string;
  title: string;
  subtitle: string;
  body: string;
  media: Media;
  author: string;
  time: string;
  refs: { label: string; href: string }[];
  cta?: { label: string; href: string };
}

function MediaBlock({ media }: { media: Media }) {
  if (media.kind === "none") return null;

  if (media.kind === "image") return (
    <figure className="mt-2">
      <img src={media.src} alt="" className="w-full h-36 object-cover" />
      <figcaption className="text-[10px] text-subtle italic mt-1">{media.legend}</figcaption>
    </figure>
  );

  if (media.kind === "live") return (
    <div className="mt-2 relative overflow-hidden group cursor-pointer">
      <img src={media.src} alt="" className="w-full h-36 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      {/* Badge LIVE */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
      </div>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5">
        {media.at}
      </div>
      {/* Bouton play centré */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Radio className="w-5 h-5 text-white animate-pulse" />
        </div>
      </div>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-bold">Rejoindre la classe virtuelle dès l&apos;ouverture</p>
    </div>
  );

  if (media.kind === "video") return (
    <div className="mt-2 cursor-pointer group">
      <div className="relative overflow-hidden">
        <img src={media.src} alt="" className="w-full h-36 object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />
        {/* Play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 text-ink fill-ink ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5">{media.duration}</span>
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 uppercase">Vidéo</span>
        {/* Barre de progression factice */}
        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/30">
          <div className="h-full w-1/4 bg-red-500" />
        </div>
      </div>
      <p className="text-[10px] text-subtle italic mt-1">{media.legend}</p>
    </div>
  );

  if (media.kind === "reel") return (
    <div className="mt-2 flex gap-2.5 cursor-pointer group">
      {/* Miniature verticale type reel */}
      <div className="relative w-20 h-32 flex-shrink-0 overflow-hidden">
        <img src={media.src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-3.5 h-3.5 text-ink fill-ink ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-black/60 px-1 py-0.5">{media.duration}</span>
      </div>
      <div className="self-end pb-1">
        <span className="inline-flex items-center gap-1 text-[9px] font-black text-ink uppercase tracking-wider mb-1 border border-ink px-1.5 py-0.5">Reel</span>
        <p className="text-[10px] text-subtle italic">{media.legend}</p>
      </div>
    </div>
  );

  /* audio — mini lecteur avec forme d'onde */
  return (
    <div className="mt-2 bg-ink px-3 py-2.5 flex items-center gap-3">
      <button className="w-9 h-9 rounded-full bg-gold flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform">
        <Play className="w-4 h-4 text-ink fill-ink ml-0.5" />
      </button>
      {/* Forme d'onde */}
      <div className="flex-1 flex items-center gap-[2px] h-8">
        {[5, 9, 14, 18, 12, 20, 16, 8, 13, 19, 11, 15, 7, 17, 10, 14, 6, 12, 18, 9, 13, 16, 8, 11].map((h, i) => (
          <div key={i} className={`w-[3px] rounded-full ${i < 6 ? "bg-gold" : "bg-white/25"}`} style={{ height: `${h}px` }} />
        ))}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[10px] font-bold text-white flex items-center gap-1 justify-end">{media.duration}</p>
        <p className="text-[9px] text-white/50">{media.legend}</p>
      </div>
    </div>
  );
}

function NewsFeed({ articles }: { articles: Article[] }) {
  return (
    <aside className="bg-white border-r border-border overflow-x-hidden lg:sticky lg:top-[112px] lg:h-[calc(100vh-112px)] lg:overflow-y-auto">
      {/* Cartouche journal */}
      <div className="px-4 py-3 border-b-2 border-ink flex items-baseline justify-between">
        <div>
          <p className="text-base font-black text-ink tracking-tight uppercase">Le Journal JFN</p>
          <p className="text-[10px] text-subtle">Édition campus · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Newspaper className="w-4 h-4 text-ink" />
      </div>

      {articles.length === 0 && (
        <article className="px-4 py-4 border-b border-border">
          <p className="text-[10px] font-black text-cama uppercase tracking-widest mb-1">Campus</p>
          <h3 className="text-sm font-bold text-ink leading-snug">Aucune actualité</h3>
          <p className="text-[11px] font-medium text-muted italic mt-0.5 leading-snug">Le fil d&apos;actualités de votre filière s&apos;affichera ici.</p>
        </article>
      )}

      {articles.map((a, i) => (
        <article key={i} className="px-4 py-4 border-b border-border">
          <p className="text-[10px] font-black text-cama uppercase tracking-widest mb-1">{a.rubrique}</p>
          <h3 className="text-sm font-bold text-ink leading-snug hover:underline cursor-pointer">{a.title}</h3>
          <p className="text-[11px] font-medium text-muted italic mt-0.5 leading-snug">{a.subtitle}</p>
          <MediaBlock media={a.media} />
          <p className="text-[11px] text-muted leading-relaxed mt-2">{a.body}</p>

          {/* Références */}
          {a.refs.length > 0 && (
            <div className="mt-2 border-t border-border/70 pt-1.5">
              <p className="text-[9px] font-bold text-subtle uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <BookMarked className="w-2.5 h-2.5" /> Références
              </p>
              <ul className="space-y-0.5">
                {a.refs.map((r, j) => (
                  <li key={j}>
                    <a href={r.href} className="text-[10px] text-cama hover:underline flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" /> {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[9px] text-subtle">{a.author} · {a.time}</p>
            {a.cta && (
              <a href={a.cta.href}
                className="text-[10px] font-bold text-white bg-ink px-2.5 py-1 hover:bg-cama transition-colors">
                {a.cta.label}
              </a>
            )}
          </div>
        </article>
      ))}

      <div className="px-4 py-3">
        <button className="w-full text-[11px] font-bold text-ink border border-ink py-1.5 hover:bg-ink hover:text-white transition-colors">
          Toutes les éditions →
        </button>
      </div>
    </aside>
  );
}

/* Construit le fil d'actualités à partir de données réelles. */
function buildNews(courses: DBProgramCourse[], chapterCounts: Record<string, number>, exams: DBExam[]): Article[] {
  const items: Article[] = [];
  exams.forEach((e) => {
    items.push({
      rubrique: "Examens",
      title: e.title,
      subtitle: `Épreuve ouverte · ${e.duration_min} min`,
      body: e.scheduled_at
        ? `Session prévue le ${new Date(e.scheduled_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}.`
        : "Épreuve ouverte dans votre espace examens.",
      media: { kind: "none" },
      author: "Service Scolarité",
      time: "",
      refs: [{ label: "Passer l'examen", href: `/examen/${e.id}` }],
    });
  });
  courses.forEach((c) => {
    const n = chapterCounts[c.id] ?? 0;
    items.push({
      rubrique: c.code,
      title: c.title,
      subtitle: `${c.ects} ECTS · ${c.semestre}`,
      body: n > 0 ? `${n} chapitre${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""} dans ce cours.` : "Cours publié dans votre programme.",
      media: { kind: "none" },
      author: "Programme académique",
      time: "",
      refs: [{ label: "Ouvrir le cours", href: `/cours/${c.id}` }],
    });
  });
  return items;
}

/* ════ MES COURS ════ */
function CoursesTab() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [chaptersByCourse, setChaptersByCourse] = useState<Record<string, DBChapter[]>>({});
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const liveNow = null;

  useEffect(() => {
    const slug = user?.dossier?.parcoursSlug;
    if (!user || !slug) return;
    let cancelled = false;
    (async () => {
      const [progList, list] = await Promise.all([
        fetchProgress(user.id),
        fetchStudentProgram(slug),
      ]);
      if (cancelled) return;
      const chaptersEntries = await Promise.all(list.map(async (c) => [c.id, await fetchChapters(c.id)] as const));
      if (cancelled) return;
      setCourses(list);
      setChaptersByCourse(Object.fromEntries(chaptersEntries));
      setDoneIds(new Set(progList.map((p) => p.chapter_id)));
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const stats = courses.map((c) => {
    const chs = chaptersByCourse[c.id] ?? [];
    const done = chs.filter((x) => doneIds.has(x.id)).length;
    return { course: c, total: chs.length, done, pct: chs.length ? Math.round((done / chs.length) * 100) : 0 };
  });
  const avg = stats.length ? Math.round(stats.reduce((a, s) => a + s.pct, 0) / stats.length) : 0;
  const validatedChapters = stats.reduce((a, s) => a + s.done, 0);
  const chapterCounts = Object.fromEntries(Object.entries(chaptersByCourse).map(([id, chs]) => [id, chs.length]));
  const articles = buildNews(courses, chapterCounts, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr_250px] items-start">

      {/* ── COL GAUCHE : Journal campus — collé à la nav ── */}
      <NewsFeed articles={articles} />

      {/* ── COL CENTRE : Cours ── */}
      <div className="px-4 py-3 border-r border-border min-h-full">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <BookOpen className="w-5 h-5 text-ink" strokeWidth={1.5} />
          <h1 className="text-xl font-light text-ink">Mes Cours</h1>
          <div className="flex-1" />
          <Link href="/tp"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white text-[11px] font-bold hover:bg-cama transition-colors group">
            <MonitorPlay className="w-3.5 h-3.5 group-hover:text-gold transition-colors" />
            TP &amp; Machines virtuelles
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />
          </Link>
        </div>

        {/* Live en cours */}
        {liveNow && (
          <Link href={`/live/${liveNow}`}
            className="flex items-center gap-3 p-3 mb-2 text-white hover:opacity-95 transition-opacity"
            style={{ background: "linear-gradient(90deg, #1E1B4B, #4F46E5)" }}>
            <div className="w-9 h-9 bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Radio className="w-4 h-4 text-red-300 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-red-300 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> EN DIRECT MAINTENANT
              </p>
              <p className="font-bold text-sm truncate"></p>
            </div>
            <span className="text-xs font-bold bg-gold text-white px-3 py-1.5 flex-shrink-0">Rejoindre</span>
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 border border-border divide-x divide-border mb-2 bg-white">
          {[
            { icon: TrendingUp,   label: "Progression moy.", value: `${avg}%`, color: "text-cama" },
            { icon: CheckCircle2, label: "Chapitres validés", value: String(validatedChapters), color: "text-green-600" },
            { icon: Star,         label: "Cours actifs", value: String(courses.length), color: "text-gold-dark" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-2.5 flex items-center gap-2.5">
              <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
              <div>
                <p className={`text-base font-bold leading-none ${color}`}>{value}</p>
                <p className="text-[10px] text-muted leading-tight mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cours */}
        <div className="border border-border divide-y divide-border bg-white">
          {stats.map(({ course: c, total, done, pct }) => {
            const modes = chaptersByCourse[c.id] ?? [];
            return (
              <Link key={c.id} href={`/cours/${c.id}`}
                className="p-3 flex gap-3 hover:bg-cama-50/40 transition-colors group block">
                <div className="w-10 h-10 bg-cama-50 flex items-center justify-center flex-shrink-0 group-hover:bg-cama transition-colors">
                  <BookOpen className="w-4 h-4 text-cama group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-subtle">{c.code} · {c.ects} ECTS · {c.semestre}</p>
                  <h3 className="text-sm font-bold text-ink group-hover:text-cama transition-colors">{c.title}</h3>
                  <div className="flex items-center gap-1.5 my-1 flex-wrap">
                    {modes.some((m) => m.pdf) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark"><FileText className="w-2.5 h-2.5" /> PDF</span>}
                    {modes.some((m) => m.video) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><Video className="w-2.5 h-2.5" /> Vidéo</span>}
                    {modes.some((m) => m.natif) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><MonitorPlay className="w-2.5 h-2.5" /> Natif</span>}
                    {modes.some((m) => m.live_id) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500"><Radio className="w-2.5 h-2.5" /> Live</span>}
                    {c.prof_ia && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><Bot className="w-2.5 h-2.5" /> Prof IA</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-surface overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cama to-cama-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-cama">{pct}%</span>
                    <span className="text-[10px] text-subtle">{done}/{total}</span>
                  </div>
                </div>
                <div className="self-center flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-7 h-7 bg-cama text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── HORS CURSUS ── */}
        <div className="flex items-center justify-between mt-4 mb-2 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-ink" strokeWidth={1.5} />
            <h2 className="text-xl font-light text-ink">Hors cursus</h2>
          </div>
          <p className="text-[10px] text-subtle">Cours intermédiaires ouverts à tous, hors parcours académique</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-px bg-border border border-border">
          {COURS_INTERMEDIAIRES.map((c) => (
            <div key={c.slug} className="bg-white group cursor-pointer hover:bg-cama-50/30 transition-colors">
              <div className="relative h-24 overflow-hidden">
                <img src={HORS_CURSUS_IMG[c.slug]} alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className={`absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 ${
                  c.gratuit ? "bg-green-600 text-white" : "bg-gold text-white"
                }`}>
                  {c.gratuit ? "GRATUIT" : formatFcfa(c.prix!)}
                </span>
                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white bg-black/50 px-1.5 py-0.5">{c.duree}</span>
              </div>
              <div className="p-2.5">
                <h3 className="text-xs font-bold text-ink leading-snug group-hover:text-cama transition-colors">{c.emoji} {c.title}</h3>
                <p className="text-[10px] text-muted leading-snug mt-0.5 line-clamp-2">{c.desc}</p>
                <button className="mt-1.5 text-[10px] font-bold text-white bg-ink px-2 py-1 hover:bg-cama transition-colors">
                  {c.gratuit ? "S'inscrire gratuitement" : "Souscrire"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COL DROITE : Notifications + Prof IA + Agenda ── */}
      <div className="bg-white min-h-full border-l border-border lg:border-l-0">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Notifications</h2>
          <div className="space-y-2.5">
            {([] as { id: string; read: boolean; text: string; time: string }[]).map((n) => (
              <div key={n.id} className="flex gap-2.5 items-start">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-border" : "bg-cama"}`} />
                <div>
                  <p className="text-xs text-ink leading-snug">{n.text}</p>
                  <p className="text-[10px] text-subtle mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted">Aucune notification.</p>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Agenda</h2>
          <div className="space-y-2">
            {([] as { date: string; label: string; color: string }[]).map((a, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.color}`} />
                <div>
                  <p className="text-[10px] font-bold text-cama leading-none">{a.date}</p>
                  <p className="text-xs text-ink">{a.label}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/calendrier" className="block text-[10px] font-bold text-cama hover:underline mt-2">
            Calendrier académique →
          </Link>
        </div>

        <div className="p-4 text-white"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
          <Bot className="w-5 h-5 text-gold mb-1.5" />
          <p className="font-bold text-sm leading-snug mb-1">Prof IA disponible</p>
          <p className="text-white/60 text-xs leading-relaxed">Questions, exercices, résumés — ancré sur vos cours, ultra-léger en data. Ouvrez un cours pour l&apos;utiliser.</p>
        </div>
      </div>
    </div>
  );
}

/* ════ EXAMENS ════ */
function ExamsTab() {
  const { user } = useAuth();
  const [exams, setExams] = useState<DBExam[]>([]);
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);

  useEffect(() => {
    const slug = user?.dossier?.parcoursSlug;
    if (!user || !slug) return;
    let cancelled = false;
    (async () => {
      const courses = await fetchStudentProgram(slug);
      if (cancelled) return;
      const [openExams, atts] = await Promise.all([
        fetchOpenExams(courses.map((c) => c.id)),
        fetchAttemptsForStudent(user.id),
      ]);
      if (cancelled) return;
      setExams(openExams);
      setAttempts(atts);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const articles = buildNews([], {}, exams);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr_250px] items-start">

      {/* ── COL GAUCHE : Journal campus ── */}
      <NewsFeed articles={articles} />

      {/* ── COL CENTRE : Examens ── */}
      <div className="px-4 py-3 border-r border-border min-h-full">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <ShieldCheck className="w-5 h-5 text-ink" strokeWidth={1.5} />
          <h1 className="text-xl font-light text-ink">Mes Examens</h1>
        </div>

        <div className="border border-border divide-y divide-border bg-white">
          {exams.map((e) => {
            const attempt = attempts.find((a) => a.exam_id === e.id);
            return (
              <div key={e.id} className="p-3 flex items-center gap-3 flex-wrap hover:bg-cama-50/30 transition-colors">
                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                  e.status === "ouvert" ? "bg-cama-50" : "bg-surface"}`}>
                  <ShieldCheck className={`w-4 h-4 ${e.status === "ouvert" ? "text-cama" : "text-subtle"}`} />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-[10px] text-subtle">{e.duration_min} min</p>
                  <p className="font-bold text-ink text-sm">{e.title}</p>
                  {e.scheduled_at && (
                    <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(e.scheduled_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                  )}
                </div>
                {attempt ? (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-600">
                      {attempt.status === "corrige" ? `Corrigé · ${attempt.score}/20` : `Soumis${attempt.score !== null && attempt.score !== undefined ? ` · QCM ${attempt.score}/20` : ""}`}
                    </span>
                    {attempt.alerts.length > 0 && (
                      <p className="text-[10px] text-gold-dark flex items-center gap-1 mt-1 justify-end">
                        <AlertCircle className="w-3 h-3" /> {attempt.alerts.length} signalement(s)
                      </p>
                    )}
                  </div>
                ) : e.status === "ouvert" ? (
                  <Link href={`/examen/${e.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-cama px-4 py-2 hover:bg-cama-700 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5" /> Passer l&apos;examen
                  </Link>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-surface text-muted">{e.status === "planifie" ? "Planifié" : "Terminé"}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COL DROITE : Consignes Safe-CAMA + prochaines sessions ── */}
      <div className="bg-white min-h-full">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Consignes Safe-CAMA</h2>
          <div className="space-y-2">
            {[
              "Plein écran obligatoire pendant toute l'épreuve",
              "Copier-coller et clic droit désactivés",
              "Tout changement d'onglet est signalé au jury",
              "Sauvegarde automatique toutes les 15 secondes",
              "Aucune image ne quitte votre appareil",
            ].map((r, i) => (
              <div key={i} className="flex gap-2 items-start">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ink leading-snug">{r}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Prochaines sessions</h2>
          <div className="space-y-2">
            {exams.map((e) => (
              <div key={e.id} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-cama" />
                <div>
                  <p className="text-[10px] font-bold text-cama leading-none">
                    {e.scheduled_at
                      ? new Date(e.scheduled_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                      : `${e.duration_min} min`}
                  </p>
                  <p className="text-xs text-ink">{e.title}</p>
                </div>
              </div>
            ))}
            {exams.length === 0 && <p className="text-xs text-muted">Aucune session à venir.</p>}
          </div>
          <Link href="/calendrier" className="block text-[10px] font-bold text-cama hover:underline mt-2">
            Calendrier académique →
          </Link>
        </div>

        <div className="p-4 text-white"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
          <ShieldCheck className="w-5 h-5 text-gold mb-1.5" />
          <p className="font-bold text-sm leading-snug mb-1">Human-in-the-loop</p>
          <p className="text-white/60 text-xs leading-relaxed">L&apos;IA signale, le jury décide. Aucune sanction automatique — vous disposez toujours d&apos;un droit d&apos;appel.</p>
        </div>
      </div>
    </div>
  );
}

/* ════ RÉSULTATS ════ */
function ResultsTab() {
  const { user } = useAuth();
  const [results, setResults] = useState<DelibWithMeta[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const all = await fetchDeliberations();
      if (cancelled) return;
      setResults(all.filter((d) => d.student_id === user.id));
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const validated = results.filter((r) => r.status === "valide");
  const totalCredits = validated.reduce((a, r) => a + r.credits, 0);
  const articles = buildNews([], {}, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr_250px] items-start">

      {/* ── COL GAUCHE : Journal campus ── */}
      <NewsFeed articles={articles} />

      {/* ── COL CENTRE : Résultats ── */}
      <div className="px-4 py-3 border-r border-border min-h-full">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <Award className="w-5 h-5 text-ink" strokeWidth={1.5} />
          <h1 className="text-xl font-light text-ink">Mes Résultats</h1>
        </div>

        <div className="border border-border bg-white mb-2">
          <table className="w-full">
            <thead><tr className="bg-surface border-b border-border">
              <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2">UE</th>
              <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2">Note</th>
              <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2">Crédits</th>
              <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2">Jury</th>
            </tr></thead>
            <tbody>
              {results.map((r) => {
                const note = r.note ?? 0;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-cama-50/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-ink">{r.course?.title}</p>
                      <p className="text-[10px] text-subtle">{r.course?.code}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-bold ${note >= 10 ? "text-green-600" : "text-red-500"}`}>{note}/20</span>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-ink">{r.status === "valide" ? r.credits : 0} ECTS</td>
                    <td className="px-3 py-2.5">
                      {r.status === "valide"
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-600"><CheckCircle2 className="w-3 h-3" /> Validé</span>
                        : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-gold/10 text-gold-dark"><Clock className="w-3 h-3" /> En délibération</span>}
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted">Aucun résultat publié pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 text-white flex items-center gap-4 flex-wrap"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
          <div className="w-11 h-11 bg-white/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-gold" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="font-bold text-sm">Relevé & certification vérifiable</p>
            <p className="text-white/60 text-xs">{totalCredits} crédits ECTS validés par le jury · document à QR code authentifiable</p>
          </div>
          <Link href="/diplome" className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gold px-4 py-2 hover:bg-gold-dark transition-colors flex-shrink-0">
            <QrCode className="w-3.5 h-3.5" /> Voir mon relevé
          </Link>
        </div>
        <p className="text-[10px] text-subtle mt-2 flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" /> Confiance par la preuve : chaque action de votre parcours est horodatée et rattachée au document.
        </p>
      </div>

      {/* ── COL DROITE : Synthèse + délibérations ── */}
      <div className="bg-white min-h-full">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Synthèse</h2>
          <div className="grid grid-cols-2 gap-px bg-border border border-border">
            {[
              { value: `${totalCredits}`, label: "ECTS validés", color: "text-green-600" },
              { value: `${validated.length}/${results.length}`, label: "UE certifiées", color: "text-cama" },
            ].map((s, i) => (
              <div key={i} className="bg-white p-2.5 text-center">
                <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Délibérations</h2>
          <div className="space-y-2">
            {([] as { date: string; label: string; color: string }[]).map((a, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.color}`} />
                <div>
                  <p className="text-[10px] font-bold text-cama leading-none">{a.date}</p>
                  <p className="text-xs text-ink">{a.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Vérification publique</h2>
          <p className="text-xs text-muted leading-relaxed mb-2">Tout recruteur peut authentifier votre relevé en scannant le QR code — aucune connexion requise.</p>
          <Link href="/verifier/CAMA-U1-2025" className="text-[10px] font-bold text-cama hover:underline">
            Tester la page de vérification →
          </Link>
        </div>

        <div className="p-4 text-white"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
          <Award className="w-5 h-5 text-gold mb-1.5" />
          <p className="font-bold text-sm leading-snug mb-1">Décision humaine garantie</p>
          <p className="text-white/60 text-xs leading-relaxed">Chaque note est validée en délibération par le jury avant certification — jamais par un algorithme seul.</p>
        </div>
      </div>
    </div>
  );
}
