"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen, Users, PlusCircle, Edit3, ChevronDown, ChevronRight, Info,
  Radio, Bot, FileText, Video, MonitorPlay, ShieldCheck,
  AlertTriangle, Check, Eye, EyeOff, TrendingUp, Terminal,
  Newspaper, BookMarked, ExternalLink, Play, Sparkles, Inbox, Target,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchTeacherCourses, fetchChapters } from "@/lib/program";
import {
  fetchExamsForCourses, fetchAttemptsForExam, fetchQuestions,
  createExam, setExamStatus, gradeAttempt,
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
   ÉVALUATIONS (création + correction)
════════════════════════════════════════════════════════════ */
function EvalTab() {
  const { user } = useAuth();
  const [open, setOpen] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [ueId, setUeId] = useState("");
  const [dur, setDur] = useState("45");

  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [exams, setExams] = useState<DBExam[]>([]);
  const [attemptsByExam, setAttemptsByExam] = useState<Record<string, DBExamAttempt[]>>({});
  const [questionsByExam, setQuestionsByExam] = useState<Record<string, DBExamQuestion[]>>({});
  const [users, setUsers] = useState<Map<string, DBUser>>(new Map());

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
  const flagged = allAttempts.filter((a) => a.alerts.length > 0).length;

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const chapterCounts: Record<string, number> = {};
  const articles = buildArticles(courses, chapterCounts);

  const doCreateExam = async () => {
    if (!title.trim() || !ueId) return;
    await createExam({
      program_course_id: ueId,
      title: title.trim(),
      duration_min: parseInt(dur) || 45,
      status: "planifie",
      created_by: user.id,
    });
    setTitle(""); setShowNew(false);
    await reload();
  };

  const onStatusChange = async (id: string, status: ExamStatus) => {
    await setExamStatus(id, status);
    await reload();
  };

  const right = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-[10px] font-black text-ink uppercase tracking-widest mb-2">File de correction</h2>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {[
            { value: String(pending), label: "à corriger", color: "text-gold-dark" },
            { value: String(flagged), label: "signalées", color: "text-red-500" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-2.5 text-center">
              <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted mt-1">{s.label}</p>
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
    </>
  );

  return (
    <TeacherShell right={right} articles={articles}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <ShieldCheck className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Évaluations</h1>
        <div className="flex-1" />
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1.5 px-3 py-1.5 bg-cama text-white text-[11px] font-bold hover:bg-cama-700 transition-colors">
          <PlusCircle className="w-3.5 h-3.5" /> Nouvel examen
        </button>
      </div>

      {showNew && (
        <div className="bg-white border-2 border-cama/30 p-4 mb-2 animate-scale-in flex gap-2 flex-wrap">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'examen…"
            className="flex-1 min-w-[200px] text-sm border border-border px-4 py-2.5 outline-none focus:border-cama" />
          <select value={ueId} onChange={(e) => setUeId(e.target.value)}
            className="text-sm border border-border px-3 py-2.5 outline-none bg-white">
            <option value="">UE…</option>
            {courses.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
          </select>
          <input value={dur} onChange={(e) => setDur(e.target.value)} type="number" min="5" placeholder="Durée"
            className="w-24 text-sm border border-border px-3 py-2.5 outline-none" />
          <button onClick={doCreateExam} className="bg-cama text-white text-sm font-bold px-5 hover:bg-cama-700 transition-colors">Créer</button>
        </div>
      )}

      <div className="space-y-2">
        {exams.map((e) => {
          const ue = courseById.get(e.program_course_id);
          const attempts = attemptsByExam[e.id] ?? [];
          const questions = questionsByExam[e.id] ?? [];
          return (
            <div key={e.id} className="bg-white border border-border overflow-hidden">
              <div className="p-3 flex items-center gap-3 flex-wrap">
                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${e.status === "ouvert" ? "bg-cama-50" : "bg-surface"}`}>
                  <ShieldCheck className={`w-4 h-4 ${e.status === "ouvert" ? "text-cama" : "text-subtle"}`} />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-[10px] text-subtle">{ue?.code} · {e.duration_min} min · {questions.length} questions</p>
                  <p className="font-bold text-ink text-sm">{e.title}</p>
                </div>
                <select
                  value={e.status}
                  onChange={(ev) => onStatusChange(e.id, ev.target.value as ExamStatus)}
                  className={`text-xs font-bold px-3 py-1.5 border-2 outline-none ${
                    e.status === "ouvert" ? "border-green-500 text-green-600 bg-green-50" : "border-border text-muted bg-white"}`}>
                  <option value="planifie">Planifié</option>
                  <option value="ouvert">Ouvert</option>
                  <option value="termine">Terminé</option>
                </select>
                <button onClick={() => setOpen(open === e.id ? null : e.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-cama border-2 border-cama/30 px-3 py-1.5 hover:bg-cama-50 transition-colors">
                  {attempts.length} copie(s) <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open === e.id ? "rotate-180" : ""}`} />
                </button>
              </div>
              {open === e.id && (
                <div className="border-t border-border bg-surface p-3 space-y-3 animate-fade-up">
                  {attempts.length === 0 && <p className="text-sm text-muted text-center py-3">Aucune copie soumise pour le moment.</p>}
                  {attempts.map((a) => (
                    <AttemptCard key={a.id} attempt={a} questions={questions} users={users} onGraded={reload} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TeacherShell>
  );
}

function AttemptCard({
  attempt: a, questions, users, onGraded,
}: {
  attempt: DBExamAttempt;
  questions: DBExamQuestion[];
  users: Map<string, DBUser>;
  onGraded: () => void | Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [fb, setFb] = useState("");
  const name = studentName(a.student_id, users);
  const open = questions.filter((q) => q.type === "ouverte");

  const grade = async () => {
    const n = parseFloat(note);
    if (isNaN(n)) return;
    await gradeAttempt(a.id, Math.min(20, Math.max(0, n)), fb);
    await onGraded();
  };

  return (
    <div className="bg-white border border-border p-4">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <p className="text-sm font-bold text-ink flex-1">{name}</p>
        {a.alerts.length > 0 ? (
          <span className="badge bg-gold/10 text-gold-dark text-[10px]"><AlertTriangle className="w-3 h-3" /> {a.alerts.length} signalement(s)</span>
        ) : (
          <span className="badge bg-green-50 text-green-600 text-[10px]"><Check className="w-3 h-3" /> Aucun incident</span>
        )}
        <span className={`badge text-[10px] ${a.status === "corrige" ? "bg-green-50 text-green-600" : "bg-cama-50 text-cama"}`}>
          {a.status === "corrige" ? `Corrigé · ${a.score}/20` : `QCM auto : ${a.score ?? "—"}/20`}
        </span>
      </div>

      {a.alerts.length > 0 && (
        <div className="bg-gold/5 border border-gold/20 p-3 mb-3 space-y-1">
          {a.alerts.map((al, i) => (
            <p key={i} className="text-[11px] text-gold-dark">⚠ {al.time} — {al.detail}</p>
          ))}
          <p className="text-[10px] text-muted italic">L&apos;IA signale, vous décidez — l&apos;étudiant dispose d&apos;un droit d&apos;appel.</p>
        </div>
      )}

      {open.map((q) => (
        <div key={q.id} className="mb-3">
          <p className="text-xs font-semibold text-ink mb-1">{q.text}</p>
          <p className="text-xs text-muted bg-surface p-3 leading-relaxed">
            {(a.answers[q.id] as string) || <em className="text-subtle">Pas de réponse</em>}
          </p>
        </div>
      ))}

      {a.status !== "corrige" && (
        <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-border">
          <input value={note} onChange={(e) => setNote(e.target.value)} type="number" min="0" max="20" placeholder="Note /20"
            className="w-24 text-xs border border-border px-3 py-2 outline-none focus:border-cama" />
          <input value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Feedback formatif (assisté IA hors examen)…"
            className="flex-1 min-w-[180px] text-xs border border-border px-3 py-2 outline-none focus:border-cama" />
          <button onClick={grade} className="bg-cama text-white text-xs font-bold px-4 py-2 hover:bg-cama-700 transition-colors flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Corriger &amp; transmettre</button>
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
