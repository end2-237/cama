"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen, Users, PlusCircle, Edit3, ChevronRight, Info,
  Radio, Bot, FileText, Video, MonitorPlay, ShieldCheck,
  AlertTriangle, Check, Eye, EyeOff, TrendingUp, Terminal,
  Newspaper, BookMarked, ExternalLink, Play, Sparkles, Inbox, Target,
  Trash2, X, CalendarClock, Edit3 as EditIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchTeacherCourses, fetchChapters } from "@/lib/program";
import {
  fetchExamsForCourses, fetchAttemptsForExam, fetchQuestions,
  createExam, updateExam, setExamStatus, deleteExam, gradeAttempt,
  addQuestion, updateQuestion, deleteQuestion,
} from "@/lib/exams";
import { fetchUsers } from "@/lib/admin";
import { fetchLivesForCourses, subscribeLives } from "@/lib/lives";
import type {
  DBProgramCourse, DBChapter, DBExam, DBExamAttempt, DBExamQuestion, DBUser, ExamStatus,
} from "@/lib/supabase";
import TeacherCourseDrawer from "@/components/TeacherCourseDrawer";

export default function TeacherView({ tab }: { tab: string }) {
  if (tab === "Évaluations") return <EvalTab />;
  if (tab === "Étudiants")   return <StudentsTab />;
  return <CoursesTab />;
}

/* ════════════════════════════════════════════════════════════
   SALLE DES PROFS — fil éditorial enseignant (colonne gauche)
════════════════════════════════════════════════════════════ */
type TMedia =
  | { kind: "image"; src: string; legend: string }
  | { kind: "live"; src: string; at: string }
  | { kind: "none" };

interface TArticle {
  rubrique: string;
  title: string;
  subtitle: string;
  body: string;
  media: TMedia;
  author: string;
  time: string;
  refs: { label: string; href: string }[];
  cta?: { label: string; href: string };
}

function TMediaBlock({ media }: { media: TMedia }) {
  if (media.kind === "none") return null;
  if (media.kind === "image") return (
    <figure className="mt-2">
      <img src={media.src} alt="" className="w-full h-36 object-cover" />
      <figcaption className="text-[10px] text-subtle italic mt-1">{media.legend}</figcaption>
    </figure>
  );
  /* live */
  return (
    <div className="mt-2 relative overflow-hidden group cursor-pointer">
      <img src={media.src} alt="" className="w-full h-36 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-cama text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
        <Radio className="w-2.5 h-2.5" /> Webinaire
      </div>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5">{media.at}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full bg-cama flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-bold">Formation continue des enseignants</p>
    </div>
  );
}

function TeacherFeed({ articles }: { articles: TArticle[] }) {
  return (
    <aside className="bg-white border-r border-border overflow-x-hidden lg:sticky lg:top-[112px] lg:h-[calc(100vh-112px)] lg:overflow-y-auto">
      <div className="px-4 py-3 border-b-2 border-ink flex items-baseline justify-between">
        <div>
          <p className="text-base font-black text-ink tracking-tight uppercase">Salle des Profs</p>
          <p className="text-[10px] text-subtle">Espace enseignant · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Newspaper className="w-4 h-4 text-ink" />
      </div>

      {articles.length === 0 && (
        <article className="px-4 py-4 border-b border-border">
          <p className="text-[10px] font-black text-cama uppercase tracking-widest mb-1">Actualités</p>
          <h3 className="text-sm font-bold text-ink leading-snug">Aucune actualité</h3>
          <p className="text-[11px] font-medium text-muted italic mt-0.5 leading-snug">Vos cours et activités apparaîtront ici.</p>
        </article>
      )}

      {articles.map((a, i) => (
        <article key={i} className="px-4 py-4 border-b border-border">
          <p className="text-[10px] font-black text-cama uppercase tracking-widest mb-1">{a.rubrique}</p>
          <h3 className="text-sm font-bold text-ink leading-snug hover:underline cursor-pointer">{a.title}</h3>
          <p className="text-[11px] font-medium text-muted italic mt-0.5 leading-snug">{a.subtitle}</p>
          <TMediaBlock media={a.media} />
          <p className="text-[11px] text-muted leading-relaxed mt-2">{a.body}</p>
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
              <Link href={a.cta.href} className="text-[10px] font-bold text-white bg-ink px-2.5 py-1 hover:bg-cama transition-colors">
                {a.cta.label}
              </Link>
            )}
          </div>
        </article>
      ))}

      <div className="px-4 py-3">
        <button className="w-full text-[11px] font-bold text-ink border border-ink py-1.5 hover:bg-ink hover:text-white transition-colors">
          Toutes les actualités enseignants →
        </button>
      </div>
    </aside>
  );
}

/* Coquille 3 colonnes partagée */
function TeacherShell({ children, right, articles }: { children: React.ReactNode; right: React.ReactNode; articles: TArticle[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr_250px] items-start">
      <TeacherFeed articles={articles} />
      <div className="px-4 py-3 border-r border-border min-h-full">{children}</div>
      <div className="bg-white min-h-full border-l border-border lg:border-l-0">{right}</div>
    </div>
  );
}

/* Panneau gradient réutilisable (col droite) */
function GradientNote({ icon: Icon, title, body }: { icon: typeof Bot; title: string; body: string }) {
  return (
    <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
      <Icon className="w-5 h-5 text-gold mb-1.5" />
      <p className="font-bold text-sm leading-snug mb-1">{title}</p>
      <p className="text-white/60 text-xs leading-relaxed">{body}</p>
    </div>
  );
}

function studentName(id: string, users: Map<string, DBUser>): string {
  const u = users.get(id);
  if (u) return `${u.first_name} ${u.last_name}`.trim();
  return "Étudiant " + id.slice(0, 6);
}

/* Construit le fil éditorial à partir des cours réels de l'enseignant. */
function buildArticles(courses: DBProgramCourse[], chapterCounts: Record<string, number>): TArticle[] {
  return courses.map((c) => ({
    rubrique: c.published ? "Cours publié" : "Brouillon",
    title: c.title,
    subtitle: `${c.code} · ${c.ects} ECTS · ${c.semestre}`,
    body: `${chapterCounts[c.id] ?? 0} chapitre(s) dans ce cours. ${c.published ? "Ce cours est visible par les étudiants." : "Ce cours n'est pas encore publié."}`,
    media: { kind: "none" },
    author: c.code,
    time: c.semestre,
    refs: [],
    cta: { label: "Gérer le cours", href: `/enseignant/cours/${c.id}` },
  }));
}

/* ════════════════════════════════════════════════════════════
   MES COURS (création + diffusion + détails)
════════════════════════════════════════════════════════════ */
function CoursesTab() {
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [ueId, setUeId] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [chapters, setChapters] = useState<Record<string, DBChapter[]>>({});
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [users, setUsers] = useState<Map<string, DBUser>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [liveNow, setLiveNow] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!courses.length) return;
    const ids = courses.map((c) => c.id);
    let cancelled = false;
    (async () => {
      const list = await fetchLivesForCourses(ids);
      if (cancelled) return;
      const a = list.find((l) => l.status === "encours");
      if (a) setLiveNow({ id: a.id, title: a.title });
    })();
    const unsub = subscribeLives((live) => {
      if (!ids.includes(live.program_course_id ?? "")) return;
      if (live.status === "encours") setLiveNow({ id: live.id, title: live.title });
      else setLiveNow((prev) => (prev?.id === live.id ? null : prev));
    });
    return () => { cancelled = true; unsub(); };
  }, [courses]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const cs = await fetchTeacherCourses(user.id);
      const chEntries = await Promise.all(cs.map(async (c) => [c.id, await fetchChapters(c.id)] as const));
      const exams = await fetchExamsForCourses(cs.map((c) => c.id));
      const atts = (await Promise.all(exams.map((e) => fetchAttemptsForExam(e.id)))).flat();
      const allUsers = await fetchUsers();
      if (cancelled) return;
      setCourses(cs);
      setChapters(Object.fromEntries(chEntries));
      setAttempts(atts);
      setUsers(new Map(allUsers.map((u) => [u.id, u])));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const myCourses = courses;
  const published = myCourses.filter((c) => c.published).length;
  const pending = attempts.filter((a) => a.status === "soumis").length;
  const totalStudents = new Set(attempts.map((a) => a.student_id)).size;

  const chapterCounts: Record<string, number> = Object.fromEntries(
    Object.entries(chapters).map(([id, list]) => [id, list.length]),
  );
  const articles = buildArticles(myCourses, chapterCounts);

  /* Les enseignants ne créent pas de program_courses (affectés par l'admin). */
  const create = () => {
    setTitle(""); setShowNew(false);
  };

  const recentNotifs = attempts
    .filter((a) => a.status === "soumis")
    .slice(0, 5)
    .map((a) => ({ text: `${studentName(a.student_id, users)} a soumis une copie`, time: "Récemment", unread: true }));

  const right = (
    <>
      {/* Notifications */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Notifications</h2>
        <div className="space-y-2.5">
          {recentNotifs.length === 0 && <p className="text-xs text-muted">Aucune notification.</p>}
          {recentNotifs.map((n, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? "bg-cama" : "bg-border"}`} />
              <div>
                <p className="text-xs text-ink leading-snug">{n.text}</p>
                <p className="text-[10px] text-subtle mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agenda enseignant */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Mon agenda</h2>
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
          <p className="text-xs text-muted">Aucun événement à venir.</p>
        </div>
        <Link href="/calendrier" className="block text-[10px] font-bold text-cama hover:underline mt-2">Calendrier académique →</Link>
      </div>

      <GradientNote icon={Sparkles} title="Assistant pédagogique IA"
        body="Générez un plan de chapitre, des quiz ou une transcription. Ouvrez un cours puis l'éditeur pour composer en quelques clics." />
    </>
  );

  return (
    <TeacherShell right={right} articles={articles}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <BookOpen className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Mes Cours</h1>
        <div className="flex-1" />
        <Link href="/tp" className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white text-[11px] font-bold hover:bg-cama transition-colors group">
          <Terminal className="w-3.5 h-3.5 group-hover:text-gold transition-colors" /> TP &amp; VM
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-0.5" />
        </Link>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-1.5 bg-cama text-white text-[11px] font-bold hover:bg-cama-700 transition-colors">
          <PlusCircle className="w-3.5 h-3.5" /> Nouveau cours
        </button>
      </div>

      {/* Live en cours */}
      {liveNow && (
        <Link href={`/live/${liveNow.id}`} className="flex items-center gap-3 p-3 mb-2 text-white hover:opacity-95 transition-opacity"
          style={{ background: "linear-gradient(90deg, #7f1d1d, #dc2626)" }}>
          <div className="w-9 h-9 bg-white/15 flex items-center justify-center flex-shrink-0">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-red-100 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> VOTRE LIVE EST EN COURS
            </p>
            <p className="font-bold text-sm truncate">{liveNow.title}</p>
          </div>
          <span className="text-xs font-bold bg-white text-red-600 px-3 py-1.5 flex-shrink-0">Entrer dans la salle</span>
        </Link>
      )}

      {/* Formulaire création */}
      {showNew && (
        <div className="bg-white border-2 border-cama/30 p-4 mb-2 animate-scale-in">
          <p className="text-sm font-bold text-ink mb-3">Créer un cours rattaché à une UE</p>
          <div className="flex gap-2 flex-wrap">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du cours…"
              className="flex-1 min-w-[200px] text-sm border border-border px-4 py-2.5 outline-none focus:border-cama" />
            <select value={ueId} onChange={(e) => setUeId(e.target.value)}
              className="text-sm border border-border px-3 py-2.5 outline-none focus:border-cama bg-white">
              <option value="">Choisir l&apos;UE…</option>
              {myCourses.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.title}</option>)}
            </select>
            <button onClick={create} className="bg-cama text-white text-sm font-bold px-5 hover:bg-cama-700 transition-colors">Créer</button>
          </div>
          <p className="text-[10px] text-subtle mt-2">Les cours sont affectés par l&apos;administration.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 border border-border divide-x divide-border mb-2 bg-white">
        {[
          { icon: BookOpen, label: "Cours publiés", value: `${published}/${myCourses.length}`, color: "text-cama" },
          { icon: Users, label: "Étudiants suivis", value: String(totalStudents), color: "text-green-600" },
          { icon: Inbox, label: "Copies à corriger", value: String(pending), color: "text-gold-dark" },
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

      {/* Liste des cours */}
      <div className="border border-border divide-y divide-border bg-white">
        {loaded && myCourses.length === 0 && (
          <p className="text-sm text-muted text-center py-6">Aucun cours affecté pour le moment.</p>
        )}
        {myCourses.map((c) => {
          const chs = chapters[c.id] ?? [];
          return (
            <div key={c.id} className="p-3 flex gap-3 hover:bg-cama-50/40 transition-colors group">
              <div className="w-10 h-10 bg-cama-50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-cama" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-subtle">{c.code} · {chs.length} chapitres · {c.ects} ECTS</p>
                <h3 className="text-sm font-bold text-ink">{c.title}</h3>
                <div className="flex items-center gap-1.5 my-1 flex-wrap">
                  {chs.some((m) => m.pdf) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark"><FileText className="w-2.5 h-2.5" /> PDF</span>}
                  {chs.some((m) => m.video) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><Video className="w-2.5 h-2.5" /> Vidéo</span>}
                  {chs.some((m) => m.natif) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><MonitorPlay className="w-2.5 h-2.5" /> Natif</span>}
                  {chs.some((m) => m.live_id) && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500"><Radio className="w-2.5 h-2.5" /> Live</span>}
                  {c.prof_ia && <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cama-50 text-cama"><Bot className="w-2.5 h-2.5" /> Prof IA</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${c.published ? "bg-green-50 text-green-600" : "bg-surface text-muted"}`}>
                  {c.published ? <><Eye className="w-3 h-3" /> Publié</> : <><EyeOff className="w-3 h-3" /> Brouillon</>}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setDetailId(c.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-muted border border-border hover:border-cama/40 hover:text-cama hover:bg-white transition-all"
                    title="Fiche détaillée & analytics">
                    <Info className="w-3 h-3" /> Détails
                  </button>
                  <Link href={`/enseignant/cours/${c.id}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-cama text-white text-[10px] font-bold hover:bg-cama-700 transition-colors">
                    <Edit3 className="w-3 h-3" /> Gérer
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-subtle mt-3 flex items-center gap-1.5">
        <ChevronRight className="w-3 h-3" /> Chaque cours se diffuse en 5 modes : PDF, vidéo + audio seul, natif léger, live et Prof IA.
      </p>

      <TeacherCourseDrawer courseId={detailId} onClose={() => setDetailId(null)} />
    </TeacherShell>
  );
}

/* ════════════════════════════════════════════════════════════
   ÉVALUATIONS (fusion examens + correction + évaluation TP)
════════════════════════════════════════════════════════════ */
function EvalTab() {
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [ueId, setUeId] = useState("");
  const [dur, setDur] = useState("45");
  const [examType, setExamType] = useState<"examen" | "tp">("examen");

  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [exams, setExams] = useState<DBExam[]>([]);
  const [attemptsByExam, setAttemptsByExam] = useState<Record<string, DBExamAttempt[]>>({});
  const [questionsByExam, setQuestionsByExam] = useState<Record<string, DBExamQuestion[]>>({});
  const [users, setUsers] = useState<Map<string, DBUser>>(new Map());
  const [selExam, setSelExam] = useState<DBExam | null>(null);
  const [tab, setTab] = useState<"questions" | "copies">("questions");
  const [filter, setFilter] = useState<"all" | "examen" | "tp">("all");

  const [sched, setSched] = useState("");        // date/heure planifiée (création)

  // formulaire question (création + édition)
  const [qOpen, setQOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<string | null>(null);  // id si édition
  const [q, setQ] = useState<Partial<DBExamQuestion>>({ type: "qcm", text: "", options: ["", "", "", ""], correct_index: 0, points: 1 });

  const reload = useCallback(async () => {
    if (!user) return;
    const cs = await fetchTeacherCourses(user.id);
    const es = await fetchExamsForCourses(cs.map((c) => c.id));
    const attEntries = await Promise.all(es.map(async (e) => [e.id, await fetchAttemptsForExam(e.id)] as const));
    const qEntries = await Promise.all(es.map(async (e) => [e.id, await fetchQuestions(e.id)] as const));
    const allUsers = await fetchUsers();
    setCourses(cs);
    setExams(es);
    setAttemptsByExam(Object.fromEntries(attEntries));
    setQuestionsByExam(Object.fromEntries(qEntries));
    setUsers(new Map(allUsers.map((u) => [u.id, u])));
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  if (!user) return null;

  const allAttempts = Object.values(attemptsByExam).flat();
  const pending = allAttempts.filter((a) => a.status === "soumis").length;
  const corrected = allAttempts.filter((a) => a.status === "corrige").length;
  const flagged = allAttempts.filter((a) => a.alerts.length > 0).length;
  const avgScore = (() => {
    const graded = allAttempts.filter((a) => a.status === "corrige" && a.score !== null && a.score_max);
    if (!graded.length) return 0;
    return Math.round(graded.reduce((s, a) => s + (Number(a.score) / Number(a.score_max)) * 20, 0) / graded.length * 10) / 10;
  })();

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const chapterCounts: Record<string, number> = {};
  const articles = buildArticles(courses, chapterCounts);

  // Classification TP vs Examen (convention: titre contient "TP" ou dur <= 0 = TP)
  const isTP = (e: DBExam) => /\bTP\b/i.test(e.title);
  const filteredExams = filter === "all" ? exams : filter === "tp" ? exams.filter(isTP) : exams.filter((e) => !isTP(e));

  const doCreateExam = async () => {
    if (!title.trim() || !ueId) return;
    await createExam({
      program_course_id: ueId,
      title: (examType === "tp" ? "TP : " : "") + title.trim(),
      duration_min: examType === "tp" ? 120 : (parseInt(dur) || 45),
      status: "planifie",
      scheduled_at: sched ? new Date(sched).toISOString() : null,
      created_by: user.id,
    });
    setTitle(""); setSched(""); setShowNew(false);
    await reload();
  };

  // Met à jour la date planifiée d'un examen existant (alimente le calendrier étudiant).
  const onSchedChange = async (id: string, value: string) => {
    await updateExam(id, { scheduled_at: value ? new Date(value).toISOString() : null });
    if (selExam?.id === id) setSelExam((s) => s ? { ...s, scheduled_at: value ? new Date(value).toISOString() : null } : s);
    await reload();
  };

  const onStatusChange = async (id: string, status: ExamStatus) => {
    await setExamStatus(id, status);
    if (selExam?.id === id) setSelExam((s) => s ? { ...s, status } : s);
    await reload();
  };

  const onDelExam = async (id: string) => {
    if (!confirm("Supprimer cette évaluation ?")) return;
    await deleteExam(id);
    if (selExam?.id === id) setSelExam(null);
    await reload();
  };

  const openExam = async (e: DBExam) => {
    setSelExam(e);
    setTab("questions");
    const qs = await fetchQuestions(e.id);
    const atts = await fetchAttemptsForExam(e.id);
    setQuestionsByExam((p) => ({ ...p, [e.id]: qs }));
    setAttemptsByExam((p) => ({ ...p, [e.id]: atts }));
  };

  const openNewQuestion = () => {
    setEditingQ(null);
    setQ({ type: "qcm", text: "", options: ["", "", "", ""], correct_index: 0, points: 1 });
    setQOpen(true);
  };

  const openEditQuestion = (qq: DBExamQuestion) => {
    setEditingQ(qq.id);
    setQ({
      type: qq.type, text: qq.text, points: qq.points,
      options: qq.type === "qcm" ? [...qq.options, "", "", "", ""].slice(0, Math.max(4, qq.options.length)) : ["", "", "", ""],
      correct_index: qq.correct_index ?? 0,
    });
    setQOpen(true);
  };

  const onSaveQuestion = async () => {
    if (!selExam || !q.text?.trim()) return;
    const payload = {
      type: q.type, text: q.text, points: q.points ?? 1,
      options: q.type === "qcm" ? (q.options ?? []).filter(Boolean) : [],
      correct_index: q.type === "qcm" ? q.correct_index : null,
    };
    if (editingQ) {
      await updateQuestion(editingQ, payload);
    } else {
      await addQuestion({ exam_id: selExam.id, ordre: (questionsByExam[selExam.id] ?? []).length, ...payload });
    }
    const qs = await fetchQuestions(selExam.id);
    setQuestionsByExam((p) => ({ ...p, [selExam.id]: qs }));
    setQOpen(false);
    setEditingQ(null);
    setQ({ type: "qcm", text: "", options: ["", "", "", ""], correct_index: 0, points: 1 });
  };

  const onDelQuestion = async (id: string) => {
    if (!selExam) return;
    if (!confirm("Supprimer cette question ?")) return;
    await deleteQuestion(id);
    setQuestionsByExam((p) => ({ ...p, [selExam.id]: (p[selExam.id] ?? []).filter((x) => x.id !== id) }));
  };

  const right = (
    <>
      {/* Stats de correction */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">File de correction</h2>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {[
            { value: String(pending), label: "à corriger", color: "text-gold-dark" },
            { value: String(corrected), label: "corrigées", color: "text-green-600" },
            { value: String(flagged), label: "signalées", color: "text-red-500" },
            { value: String(avgScore || "—"), label: "moy. /20", color: "text-cama" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-2.5 text-center">
              <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Répartition par statut */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Répartition examens</h2>
        <div className="space-y-2">
          {[
            { label: "Planifiés", count: exams.filter((e) => e.status === "planifie").length, color: "bg-gold/40" },
            { label: "Ouverts", count: exams.filter((e) => e.status === "ouvert").length, color: "bg-green-500" },
            { label: "Terminés", count: exams.filter((e) => e.status === "termine").length, color: "bg-surface" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 flex-shrink-0 ${r.color}`} />
              <span className="text-xs text-muted flex-1">{r.label}</span>
              <span className="text-xs font-bold text-ink">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Intégrité Safe-CAMA</h2>
        <div className="space-y-2">
          {[
            "Plein écran imposé pendant l'épreuve",
            "Copier-coller et clic droit désactivés",
            "Changement d'onglet horodaté et signalé",
            "Sauvegarde auto toutes les 15 s",
          ].map((r, i) => (
            <div key={i} className="flex gap-2 items-start">
              <ShieldCheck className="w-3.5 h-3.5 text-cama flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink leading-snug">{r}</p>
            </div>
          ))}
        </div>
      </div>

      <GradientNote icon={ShieldCheck} title="L'IA signale, vous décidez"
        body="Aucune sanction automatique : les signalements sont indicatifs. Vous corrigez et transmettez au jury, l'étudiant garde un droit d'appel." />

      {/* Évaluation TP */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Évaluation TP</h2>
        <div className="space-y-2">
          <div className="flex gap-2 items-start">
            <Terminal className="w-3.5 h-3.5 text-cama flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink leading-snug">Créez un examen TP pour évaluer le travail pratique sur machine.</p>
          </div>
          <div className="flex gap-2 items-start">
            <Eye className="w-3.5 h-3.5 text-cama flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink leading-snug">Accédez aux machines des étudiants en temps réel.</p>
          </div>
          <Link href="/tp" className="block text-[10px] font-bold text-cama hover:underline mt-1">Ouvrir le gestionnaire de TP →</Link>
        </div>
      </div>
    </>
  );

  return (
    <TeacherShell right={right} articles={articles}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <ShieldCheck className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Évaluations</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 bg-surface p-0.5">
          {([["all", "Tout"], ["examen", "Examens"], ["tp", "TP"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-2.5 py-1 text-[10px] font-bold transition-all ${filter === k ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>{l}</button>
          ))}
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-1.5 bg-cama text-white text-[11px] font-bold hover:bg-cama-700 transition-colors">
          <PlusCircle className="w-3.5 h-3.5" /> Nouvelle évaluation
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 border border-border divide-x divide-border mb-2 bg-white">
        {[
          { icon: FileText, label: "Évaluations", value: String(exams.length), color: "text-cama" },
          { icon: Users, label: "Copies reçues", value: String(allAttempts.length), color: "text-ink" },
          { icon: Inbox, label: "À corriger", value: String(pending), color: "text-gold-dark" },
          { icon: Target, label: "Moyenne", value: avgScore ? `${avgScore}/20` : "—", color: "text-green-600" },
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

      {/* Formulaire création */}
      {showNew && (
        <div className="bg-white border-2 border-cama/30 p-4 mb-2 animate-scale-in">
          <p className="text-sm font-bold text-ink mb-3">Nouvelle évaluation</p>
          <div className="flex gap-1.5 mb-3">
            {([["examen", "Examen classique"], ["tp", "Évaluation TP"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setExamType(k)}
                className={`px-3 py-1.5 text-xs font-bold border-2 transition-all ${examType === k ? "border-cama bg-cama text-white" : "border-border text-muted"}`}>{l}</button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={examType === "tp" ? "Titre du TP..." : "Titre de l'examen..."}
              className="flex-1 min-w-[200px] text-sm border border-border px-4 py-2.5 outline-none focus:border-cama" />
            <select value={ueId} onChange={(e) => setUeId(e.target.value)}
              className="text-sm border border-border px-3 py-2.5 outline-none bg-white">
              <option value="">UE...</option>
              {courses.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
            </select>
            {examType === "examen" && (
              <input value={dur} onChange={(e) => setDur(e.target.value)} type="number" min="5" placeholder="Durée (min)"
                className="w-28 text-sm border border-border px-3 py-2.5 outline-none" />
            )}
            <button onClick={doCreateExam} className="bg-cama text-white text-sm font-bold px-5 hover:bg-cama-700 transition-colors">Créer</button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              <CalendarClock className="w-3 h-3" /> Date planifiée
            </label>
            <input type="datetime-local" value={sched} onChange={(e) => setSched(e.target.value)}
              className="text-sm border border-border px-3 py-1.5 outline-none focus:border-cama" />
            <span className="text-[10px] text-subtle">apparaît dans le calendrier de l&apos;étudiant</span>
          </div>
          {examType === "tp" && (
            <p className="text-[10px] text-muted mt-2 flex items-center gap-1">
              <Terminal className="w-3 h-3" /> L&apos;évaluation TP permet de corriger le travail des étudiants sur machine distante.
            </p>
          )}
        </div>
      )}

      {/* Liste principale - vue détailée avec sélection */}
      <div className="grid lg:grid-cols-[340px_1fr] gap-2">
        {/* Sidebar examens */}
        <div className="border border-border divide-y divide-border bg-white">
          {filteredExams.length === 0 && (
            <p className="text-sm text-muted text-center py-6">Aucune évaluation. Créez-en une ci-dessus.</p>
          )}
          {filteredExams.map((e) => {
            const ue = courseById.get(e.program_course_id);
            const attempts = attemptsByExam[e.id] ?? [];
            const questions = questionsByExam[e.id] ?? [];
            const tp = isTP(e);
            return (
              <button key={e.id} onClick={() => openExam(e)}
                className={`w-full text-left p-3 hover:bg-cama-50/40 transition-colors flex items-center gap-3 ${selExam?.id === e.id ? "bg-cama-50/60 border-l-2 border-l-cama" : ""}`}>
                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${e.status === "ouvert" ? "bg-green-50" : tp ? "bg-cama-50" : "bg-surface"}`}>
                  {tp
                    ? <Terminal className={`w-4 h-4 ${e.status === "ouvert" ? "text-green-600" : "text-cama"}`} />
                    : <ShieldCheck className={`w-4 h-4 ${e.status === "ouvert" ? "text-green-600" : "text-subtle"}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-subtle">{ue?.code} {tp ? "· TP" : ""} · {e.duration_min} min · {questions.length}q · {attempts.length} copie(s)</p>
                  <p className="font-bold text-ink text-sm truncate">{e.title}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 ${
                    e.status === "ouvert" ? "bg-green-50 text-green-600" : e.status === "termine" ? "bg-surface text-muted" : "bg-gold/10 text-gold-dark"
                  }`}>{e.status === "ouvert" ? "Ouvert" : e.status === "termine" ? "Terminé" : "Planifié"}</span>
                  {attempts.filter((a) => a.status === "soumis").length > 0 && (
                    <span className="text-[9px] font-bold text-gold-dark">{attempts.filter((a) => a.status === "soumis").length} à corriger</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Détail de l'évaluation sélectionnée */}
        {!selExam ? (
          <div className="bg-white border border-border p-8 text-center">
            <ShieldCheck className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">Sélectionnez ou créez une évaluation.</p>
            <p className="text-[10px] text-subtle mt-1">Les examens et les évaluations TP sont gérés ici.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* En-tête + statut */}
            <div className="bg-white border border-border p-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[160px]">
                <h2 className="text-base font-bold text-ink">{selExam.title}</h2>
                <p className="text-[11px] text-muted">
                  {courseById.get(selExam.program_course_id)?.code} · {(questionsByExam[selExam.id] ?? []).length} questions · {(questionsByExam[selExam.id] ?? []).reduce((a, x) => a + x.points, 0)} pts · {selExam.duration_min} min
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-subtle uppercase tracking-wider flex items-center gap-1">
                  <CalendarClock className="w-2.5 h-2.5" /> Planifié le
                </label>
                <input type="datetime-local"
                  value={selExam.scheduled_at ? new Date(selExam.scheduled_at).toISOString().slice(0, 16) : ""}
                  onChange={(ev) => onSchedChange(selExam.id, ev.target.value)}
                  className="text-xs border border-border px-2 py-1 outline-none focus:border-cama" />
              </div>
              <select
                value={selExam.status}
                onChange={(ev) => onStatusChange(selExam.id, ev.target.value as ExamStatus)}
                className={`text-xs font-bold px-3 py-1.5 border-2 outline-none ${
                  selExam.status === "ouvert" ? "border-green-500 text-green-600 bg-green-50" : "border-border text-muted bg-white"}`}>
                <option value="planifie">Planifié</option>
                <option value="ouvert">Ouvert</option>
                <option value="termine">Terminé</option>
              </select>
              <button onClick={() => onDelExam(selExam.id)} className="text-subtle hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
            </div>

            {/* Onglets */}
            <div className="flex gap-0.5 bg-white border border-border p-1 w-fit">
              {([["questions", "Questions"], ["copies", `Copies (${(attemptsByExam[selExam.id] ?? []).length})`]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-1.5 text-xs font-bold transition-all ${tab === k ? "bg-cama text-white" : "text-muted hover:text-ink"}`}>{l}</button>
              ))}
            </div>

            {tab === "questions" ? (
              <div className="bg-white border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-black text-ink uppercase tracking-widest">Questions</h3>
                  <button onClick={openNewQuestion} className="text-[11px] font-bold text-cama hover:underline flex items-center gap-1"><PlusCircle className="w-3 h-3" /> Ajouter</button>
                </div>
                {(questionsByExam[selExam.id] ?? []).length === 0 ? (
                  <p className="text-xs text-muted italic">Aucune question. Ajoutez-en avant d&apos;ouvrir l&apos;évaluation.</p>
                ) : (
                  <div className="space-y-2">
                    {(questionsByExam[selExam.id] ?? []).map((qq, i) => (
                      <div key={qq.id} className="border border-border p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-subtle w-5 h-5 bg-surface flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm text-ink">{qq.text} <span className="text-[10px] text-muted">({qq.points} pt{qq.points > 1 ? "s" : ""} · {qq.type})</span></p>
                            {qq.type === "qcm" && (
                              <ul className="mt-1 space-y-0.5">
                                {qq.options.map((o, oi) => (
                                  <li key={oi} className={`text-[11px] flex items-center gap-1.5 ${oi === qq.correct_index ? "text-green-600 font-bold" : "text-muted"}`}>
                                    {oi === qq.correct_index ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 border border-border inline-block" />}
                                    {o}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEditQuestion(qq)} className="text-subtle hover:text-cama" title="Modifier"><EditIcon className="w-3.5 h-3.5" /></button>
                            <button onClick={() => onDelQuestion(qq.id)} className="text-subtle hover:text-red-500" title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TP : lien vers les machines */}
                {isTP(selExam) && (
                  <div className="mt-3 p-3 bg-cama-50 border border-cama/20">
                    <p className="text-xs font-bold text-cama flex items-center gap-1.5 mb-1"><Terminal className="w-3.5 h-3.5" /> Machines de TP</p>
                    <p className="text-[11px] text-muted mb-2">Accédez aux machines distantes des étudiants pour observer leur travail en temps réel.</p>
                    <Link href="/tp" className="text-[10px] font-bold text-cama hover:underline">Ouvrir le gestionnaire de machines →</Link>
                  </div>
                )}
              </div>
            ) : (
              /* Copies / correction */
              <div className="bg-white border border-border p-4">
                <h3 className="text-[11px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-cama" /> Copies soumises</h3>
                {(attemptsByExam[selExam.id] ?? []).length === 0 ? (
                  <p className="text-xs text-muted italic">Aucune copie soumise pour le moment.</p>
                ) : (
                  <div className="space-y-3">
                    {(attemptsByExam[selExam.id] ?? []).map((a) => (
                      <AttemptCard key={a.id} attempt={a} questions={questionsByExam[selExam.id] ?? []} users={users} onGraded={reload} isTP={isTP(selExam)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal ajout question */}
      {qOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(ev) => { if (ev.target === ev.currentTarget) setQOpen(false); }}>
          <div className="bg-white shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-ink">{editingQ ? "Modifier la question" : "Nouvelle question"}</h2>
              <button onClick={() => { setQOpen(false); setEditingQ(null); }} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {(["qcm", "ouverte"] as const).map((t) => (
                  <button key={t} onClick={() => setQ((x) => ({ ...x, type: t }))}
                    className={`px-3 py-1.5 text-xs font-bold border-2 ${q.type === t ? "border-cama bg-cama text-white" : "border-border text-muted"}`}>
                    {t === "qcm" ? "QCM" : "Question ouverte"}
                  </button>
                ))}
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  <input type="number" min={1} value={q.points ?? 1} onChange={(e) => setQ((x) => ({ ...x, points: parseInt(e.target.value) || 1 }))}
                    className="w-14 border border-border px-2 py-1.5 text-xs text-center outline-none focus:border-cama" />
                  <span className="text-[11px] text-muted">pts</span>
                </div>
              </div>
              <textarea value={q.text ?? ""} onChange={(e) => setQ((x) => ({ ...x, text: e.target.value }))} rows={2}
                placeholder="Énoncé de la question..." className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-cama resize-y" />
              {q.type === "qcm" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-ink">Options (cochez la bonne réponse)</p>
                  {(q.options ?? []).map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" checked={q.correct_index === i} onChange={() => setQ((x) => ({ ...x, correct_index: i }))} className="accent-cama" />
                      <input value={o} onChange={(e) => setQ((x) => { const opts = [...(x.options ?? [])]; opts[i] = e.target.value; return { ...x, options: opts }; })}
                        placeholder={`Option ${i + 1}`} className="flex-1 border border-border px-3 py-1.5 text-sm outline-none focus:border-cama" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setQOpen(false); setEditingQ(null); }} className="flex-1 border border-border py-2.5 text-sm font-semibold text-muted">Annuler</button>
              <button onClick={onSaveQuestion} className="flex-1 bg-cama text-white py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-cama-700">
                <Check className="w-4 h-4" /> {editingQ ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherShell>
  );
}

function AttemptCard({
  attempt: a, questions, users, onGraded, isTP,
}: {
  attempt: DBExamAttempt;
  questions: DBExamQuestion[];
  users: Map<string, DBUser>;
  onGraded: () => void | Promise<void>;
  isTP?: boolean;
}) {
  const [note, setNote] = useState("");
  const [fb, setFb] = useState("");
  const name = studentName(a.student_id, users);
  const openQs = questions.filter((q) => q.type === "ouverte");
  const qcmQs = questions.filter((q) => q.type === "qcm");
  const hasOpen = openQs.length > 0;

  // Calcul note QCM auto
  let qcmScore = 0, qcmMax = 0;
  qcmQs.forEach((q) => {
    qcmMax += q.points;
    if (a.answers[q.id] !== undefined && Number(a.answers[q.id]) === q.correct_index) qcmScore += q.points;
  });

  const grade = async () => {
    const n = parseFloat(note);
    if (isNaN(n)) return;
    await gradeAttempt(a.id, Math.min(20, Math.max(0, n)), fb);
    await onGraded();
  };

  return (
    <div className="bg-white border border-border p-4">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <div className="w-8 h-8 bg-cama-50 text-cama flex items-center justify-center text-xs font-bold flex-shrink-0">
          {name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
        </div>
        <p className="text-sm font-bold text-ink flex-1">{name}</p>
        {a.alerts.length > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/10 text-gold-dark text-[10px] font-bold"><AlertTriangle className="w-3 h-3" /> {a.alerts.length} signalement(s)</span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold"><Check className="w-3 h-3" /> Aucun incident</span>
        )}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold ${a.status === "corrige" ? "bg-green-50 text-green-600" : "bg-cama-50 text-cama"}`}>
          {a.status === "corrige" ? `Corrigé · ${a.score}/20` : hasOpen ? "QCM auto + ouvertes à corriger" : `QCM auto : ${qcmScore}/${qcmMax} pts`}
        </span>
      </div>

      {/* Détail par type de question */}
      {hasOpen && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-surface p-2.5">
            <p className="text-[10px] text-muted">QCM ({qcmQs.length}q)</p>
            <p className="text-sm font-bold text-cama">{qcmScore}/{qcmMax} pts</p>
          </div>
          <div className="bg-surface p-2.5">
            <p className="text-[10px] text-muted">Ouvertes ({openQs.length}q)</p>
            <p className="text-sm font-bold text-gold-dark">{a.status === "corrige" ? "Corrigées" : "À corriger"}</p>
          </div>
        </div>
      )}

      {a.alerts.length > 0 && (
        <div className="bg-gold/5 border border-gold/20 p-3 mb-3 space-y-1">
          {a.alerts.slice(0, 5).map((al, i) => (
            <p key={i} className="text-[11px] text-gold-dark">⚠ {al.time.slice(11, 16)} — {al.detail}</p>
          ))}
          {a.alerts.length > 5 && <p className="text-[10px] text-muted">... et {a.alerts.length - 5} autre(s)</p>}
          <p className="text-[10px] text-muted italic">L&apos;IA signale, vous décidez — l&apos;étudiant dispose d&apos;un droit d&apos;appel.</p>
        </div>
      )}

      {/* Réponses ouvertes */}
      {openQs.map((qq) => (
        <div key={qq.id} className="mb-3">
          <p className="text-xs font-semibold text-ink mb-1">{qq.text} <span className="text-[10px] text-muted">({qq.points} pts)</span></p>
          <p className="text-xs text-muted bg-surface p-3 leading-relaxed">
            {(a.answers[qq.id] as string) || <em className="text-subtle">Pas de réponse</em>}
          </p>
        </div>
      ))}

      {/* TP : lien observation machine */}
      {isTP && (
        <div className="bg-cama-50 border border-cama/20 p-2.5 mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cama flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] font-bold text-cama">Machine distante</p>
            <p className="text-[10px] text-muted">Observez le travail de l&apos;étudiant en temps réel.</p>
          </div>
          <Link href="/tp" className="text-[10px] font-bold text-white bg-cama px-2.5 py-1 hover:bg-cama-700">Voir</Link>
        </div>
      )}

      {a.status !== "corrige" && (
        <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-border">
          <input value={note} onChange={(e) => setNote(e.target.value)} type="number" min="0" max="20" placeholder="Note /20"
            className="w-24 text-xs border border-border px-3 py-2 outline-none focus:border-cama" />
          <input value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Feedback formatif..."
            className="flex-1 min-w-[180px] text-xs border border-border px-3 py-2 outline-none focus:border-cama" />
          <button onClick={grade} className="bg-cama text-white text-xs font-bold px-4 py-2 hover:bg-cama-700 transition-colors flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Corriger</button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ÉTUDIANTS (suivi + analytics décrochage)
════════════════════════════════════════════════════════════ */
function StudentsTab() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [examCourse, setExamCourse] = useState<Map<string, string>>(new Map());
  const [users, setUsers] = useState<Map<string, DBUser>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const cs = await fetchTeacherCourses(user.id);
      const exams = await fetchExamsForCourses(cs.map((c) => c.id));
      const atts = (await Promise.all(exams.map((e) => fetchAttemptsForExam(e.id)))).flat();
      const allUsers = await fetchUsers();
      if (cancelled) return;
      setCourses(cs);
      setAttempts(atts);
      setExamCourse(new Map(exams.map((e) => [e.id, e.program_course_id])));
      setUsers(new Map(allUsers.map((u) => [u.id, u])));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const chapterCounts: Record<string, number> = {};
  const articles = buildArticles(courses, chapterCounts);

  /* Étudiants distincts ayant une tentative sur les examens de l'enseignant. */
  const byStudent = new Map<string, DBExamAttempt[]>();
  for (const a of attempts) {
    const arr = byStudent.get(a.student_id) ?? [];
    arr.push(a);
    byStudent.set(a.student_id, arr);
  }

  const computed = Array.from(byStudent.entries()).map(([id, atts]) => {
    const u = users.get(id);
    const name = studentName(id, users);
    const courseId = examCourse.get(atts[0].exam_id);
    const ueCode = courseId ? (courseById.get(courseId)?.code ?? "—") : "—";
    const done = atts.filter((x) => x.status === "corrige").length;
    const total = atts.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { id, name, level: u?.level ?? "—", ue: ueCode, done, total, pct, risk: pct < 25 };
  });

  const atRisk = computed.filter((s) => s.risk).length;
  const avg = computed.length ? Math.round(computed.reduce((a, s) => a + s.pct, 0) / computed.length) : 0;

  const right = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {[
            { value: `${avg}%`, label: "progression moy.", color: "text-cama" },
            { value: String(atRisk), label: "à risque", color: "text-red-500" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-2.5 text-center">
              <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">Répartition</h2>
        <div className="space-y-2.5">
          {[
            { label: "En progression", value: computed.filter((s) => s.pct >= 50).length, color: "bg-green-500" },
            { label: "À surveiller", value: computed.filter((s) => s.pct >= 25 && s.pct < 50).length, color: "bg-amber-400" },
            { label: "Décrochage", value: atRisk, color: "bg-red-400" },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted">{r.label}</span>
                <span className="font-bold text-ink">{r.value}</span>
              </div>
              <div className="h-1.5 bg-surface overflow-hidden">
                <div className={`h-full ${r.color}`} style={{ width: `${computed.length ? (r.value / computed.length) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <GradientNote icon={Target} title="Analytics prédictif"
        body="L'alerte décrochage repose sur la consultation horodatée des chapitres. Contactez tôt un étudiant inactif pour maximiser sa réussite." />
    </>
  );

  return (
    <TeacherShell right={right} articles={articles}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Users className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Suivi des étudiants</h1>
      </div>

      <div className="border border-border divide-y divide-border bg-white">
        {loaded && computed.length === 0 && (
          <p className="text-sm text-muted text-center py-6">Aucun étudiant n&apos;a encore passé vos examens.</p>
        )}
        {computed.map((s) => (
          <div key={s.id} className="flex items-center gap-3 p-3">
            <div className="w-9 h-9 rounded-full bg-cama-50 text-cama flex items-center justify-center text-xs font-bold flex-shrink-0">
              {s.name.split(" ").map((x) => x[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{s.name} <span className="text-[10px] text-subtle">· {s.level} · {s.ue}</span></p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-1.5 bg-surface overflow-hidden">
                  <div className={`h-full ${s.risk ? "bg-red-400" : "bg-cama"}`} style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-[10px] text-muted">{s.pct}%</span>
              </div>
            </div>
            {s.risk ? (
              <span className="badge bg-red-50 text-red-500 text-[10px]"><AlertTriangle className="w-3 h-3" /> Décrochage</span>
            ) : (
              <span className="badge bg-green-50 text-green-600 text-[10px]"><TrendingUp className="w-3 h-3" /> En progression</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-subtle mt-3 flex items-center gap-1.5">
        <ChevronRight className="w-3 h-3" /> Données issues de la consultation horodatée des chapitres — analytics prédictif anti-décrochage.
      </p>
    </TeacherShell>
  );
}
