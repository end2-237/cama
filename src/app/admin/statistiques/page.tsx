"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, BarChart3, GraduationCap, BookOpen, Radio, FlaskConical,
  Layers, FileCheck, Star, TrendingUp, TrendingDown, UserCheck, Bot,
  AlertTriangle, ClipboardList, PenLine,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import type {
  DBUser, DBProgramCourse, DBExam, DBExamAttempt, DBDeliberation, DBLiveAttendance,
} from "@/lib/supabase";
import { fetchUsers, fetchInscriptions, fetchAdminStats, type InscriptionWithUser, type AdminStats } from "@/lib/admin";
import { fetchProgram, fetchChapters } from "@/lib/program";
import { fetchExamsForCourses, fetchAttemptsForExam, fetchDeliberations } from "@/lib/exams";
import { fetchLivesForCourses, fetchAttendanceForLives, autoStatus, type DBLive } from "@/lib/lives";
import { fetchAllFeedback, averageRating, type DBCourseFeedback } from "@/lib/tracking";
import { fetchTpsForCourses, fetchTpProgress, type DBCourseTp, type DBTpProgress } from "@/lib/tp";

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];
const MODES: { key: string; label: string }[] = [
  { key: "online", label: "En ligne" },
  { key: "hybride", label: "Hybride" },
  { key: "presentiel", label: "Présentiel" },
];

interface Data {
  users: DBUser[];
  inscriptions: InscriptionWithUser[];
  stats: AdminStats;
  courses: DBProgramCourse[];
  chapterCount: number;
  exams: DBExam[];
  attempts: DBExamAttempt[];
  delibs: DBDeliberation[];
  lives: DBLive[];
  attendance: DBLiveAttendance[];
  feedback: DBCourseFeedback[];
  tps: DBCourseTp[];
  tpProgress: DBTpProgress[];
}

const FR_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function AdminStatistiquesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Data | null>(null);
  const [fetching, setFetching] = useState(true);
  const [run, setRun] = useState(false); // déclenche les animations

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setFetching(true);
      const [users, inscriptions, stats, courses, feedback] = await Promise.all([
        fetchUsers(), fetchInscriptions(), fetchAdminStats(), fetchProgram(), fetchAllFeedback(),
      ]);
      const courseIds = courses.map((c) => c.id);
      const [chapterLists, exams, delibs, lives, tps] = await Promise.all([
        Promise.all(courses.map((c) => fetchChapters(c.id))),
        fetchExamsForCourses(courseIds),
        fetchDeliberations(),
        fetchLivesForCourses(courseIds),
        fetchTpsForCourses(courseIds),
      ]);
      const chapterCount = chapterLists.reduce((a, l) => a + l.length, 0);
      const [attemptLists, attendance, tpProgressLists] = await Promise.all([
        Promise.all(exams.map((e) => fetchAttemptsForExam(e.id))),
        fetchAttendanceForLives(lives.map((l) => l.id)),
        Promise.all(tps.map((t) => fetchTpProgress(t.id))),
      ]);
      if (!alive) return;
      setData({
        users, inscriptions, stats, courses, chapterCount,
        exams, attempts: attemptLists.flat(), delibs, lives, attendance, feedback,
        tps, tpProgress: tpProgressLists.flat(),
      });
      setFetching(false);
    })();
    return () => { alive = false; };
  }, []);

  // Lance les animations une fois les données rendues.
  useEffect(() => {
    if (fetching) { setRun(false); return; }
    const t = setTimeout(() => setRun(true), 60);
    return () => clearTimeout(t);
  }, [fetching]);

  const m = useMemo(() => (data ? computeMetrics(data) : null), [data]);

  if (loading || !user) return <Spinner />;

  return (
    <PageShell
      title="Statistiques de la plateforme"
      subtitle="Population, pédagogie, évaluations, assiduité et qualité — en un coup d'œil."
      icon={BarChart3}
      breadcrumb="Statistiques"
      context={`au ${FR_DATE.format(new Date())}`}
      maxWidth="max-w-[1320px]"
    >
      {fetching || !m ? (
        <div className="py-24 text-center"><Loader2 className="w-7 h-7 animate-spin text-cama mx-auto" /></div>
      ) : (
        <div className="grid xl:grid-cols-[1fr_330px] gap-3 items-start">

          {/* ══════════ COLONNE PRINCIPALE ══════════ */}
          <div className="space-y-3 min-w-0">

            {/* HÉRO + pilules */}
            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-3">
              <Fade className="bg-white border border-border p-5">
                <p className="text-[11px] font-black uppercase tracking-widest text-subtle">Population étudiante</p>
                <div className="flex items-end gap-3 mt-1.5">
                  <span className="text-5xl font-black text-ink leading-none tabular-nums"><Count value={m.students} run={run} /></span>
                  <TrendBadge value={m.insTrend} />
                </div>
                <p className="text-xs text-muted mt-2">
                  {m.insValidated} validées · {m.insPending} en attente · {m.insRejected} rejetées
                </p>
                <SegmentBar rows={m.filiereBoard} total={m.insValidated} run={run} />
              </Fade>

              <div className="grid grid-cols-2 gap-3">
                <Fade delay={40}><Pill label="Réussite" value={<><Count value={m.successRate} run={run} />%</>} sub="examens notés" accent="cama" icon={TrendingUp} /></Fade>
                <Fade delay={80}><DarkPill label="Note cours" value={`${m.avgCourseRating.toFixed(1)}/5`} sub={`${m.feedbackCount} avis`} icon={Star} /></Fade>
                <Fade delay={120}><Pill label="Présence live" value={<><Count value={m.avgPresence} run={run} />%</>} sub="assiduité" accent="gold" icon={UserCheck} /></Fade>
                <Fade delay={160}><Pill label="Note moyenne" value={`${m.avgNote20.toFixed(1)}/20`} sub="copies" accent="ink" icon={FileCheck} /></Fade>
              </div>
            </div>

            {/* Bandeau compteurs */}
            <Fade delay={80}>
              <StripKPIs run={run} items={[
                { icon: UserCheck, label: "Enseignants", value: m.teachers },
                { icon: GraduationCap, label: "Filières", value: m.filieres },
                { icon: BookOpen, label: "Cours publiés", value: m.published, suffix: `/${m.courses}` },
                { icon: Layers, label: "Chapitres", value: m.chapterCount },
                { icon: FileCheck, label: "Examens", value: m.exams },
                { icon: Radio, label: "Lives tenus", value: m.livesHeld, suffix: `/${m.livesTotal}` },
                { icon: FlaskConical, label: "TP", value: m.tps },
              ]} />
            </Fade>

            {/* Classement filières + répartitions */}
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-3">
              <Fade delay={100}><FiliereBoard rows={m.filiereBoard} run={run} /></Fade>
              <div className="grid grid-rows-2 gap-3">
                <Fade delay={140}><ProgressCard title="Par niveau" rows={m.byNiveau} accent="bg-cama" run={run} /></Fade>
                <Fade delay={180}><ProgressCard title="Par mode de cycle" rows={m.byMode} accent="bg-gold" run={run} /></Fade>
              </div>
            </div>

            {/* Dynamique + qualité */}
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-3">
              <Fade delay={120} className="bg-white border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-subtle">Dynamique des inscriptions</p>
                  <span className="text-[11px] text-muted">8 derniers mois</span>
                </div>
                <AreaChart data={m.monthly} run={run} />
              </Fade>

              <Fade delay={160} className="bg-ink text-white p-5 flex flex-col">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/50">Qualité perçue</p>
                <div className="flex items-end gap-2 mt-1.5">
                  <span className="text-4xl font-black leading-none">{m.avgCourseRating.toFixed(1)}</span>
                  <span className="text-white/50 mb-1 text-sm">/5</span>
                  <Star className="w-5 h-5 text-gold mb-1 ml-auto" />
                </div>
                <p className="text-[11px] text-white/50 mt-1">{m.feedbackCount} avis étudiants</p>
                <div className="mt-3 pt-3 border-t border-white/10 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Mieux notés</p>
                  <div className="space-y-1.5">
                    {m.topCourses.slice(0, 3).map((c) => (
                      <div key={c.label} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-white/80 truncate">{c.label}</span>
                        <span className="text-xs font-bold text-gold flex items-center gap-0.5 flex-shrink-0"><Star className="w-3 h-3" /> {c.value.toFixed(1)}</span>
                      </div>
                    ))}
                    {m.topCourses.length === 0 && <p className="text-xs text-white/40 italic">Aucun avis.</p>}
                  </div>
                </div>
              </Fade>
            </div>

            {/* Inscriptions récentes */}
            <Fade delay={140} className="bg-white border border-border">
              <p className="text-[11px] font-black uppercase tracking-widest text-subtle px-4 pt-4 pb-2">Inscriptions récentes</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-subtle border-y border-border bg-surface/50">
                      <th className="text-left px-4 py-2">Étudiant</th>
                      <th className="text-left px-4 py-2">Filière</th>
                      <th className="text-left px-4 py-2">Niveau</th>
                      <th className="text-left px-4 py-2">Statut</th>
                      <th className="text-left px-4 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {m.recent.map((i) => (
                      <tr key={i.id} className="hover:bg-surface/60 transition-colors">
                        <td className="px-4 py-2 font-semibold text-ink flex items-center gap-2">
                          <Avatar name={i.user ? `${i.user.first_name} ${i.user.last_name}` : i.matricule} />
                          <span className="truncate">{i.user ? `${i.user.first_name} ${i.user.last_name}` : i.matricule}</span>
                        </td>
                        <td className="px-4 py-2 text-muted truncate max-w-[150px]">{i.parcours_title}</td>
                        <td className="px-4 py-2 text-muted">{i.level}</td>
                        <td className="px-4 py-2"><StatusBadge status={i.status} /></td>
                        <td className="px-4 py-2 text-subtle text-xs">{new Date(i.enrolled_at).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    ))}
                    {m.recent.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-muted text-xs">Aucune inscription.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Fade>
          </div>

          {/* ══════════ SIDEBAR DROITE ══════════ */}
          <aside className="space-y-3 xl:sticky xl:top-4">
            {/* Aperçu (donuts) */}
            <Fade delay={60} className="bg-white border border-border p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-subtle mb-3">Aperçu</p>
              <div className="grid grid-cols-2 gap-2">
                <Donut label="Cours publiés" value={m.published} total={m.courses} run={run} color="#4F46E5" />
                <Donut label="Réussite" value={m.successRate} total={100} run={run} color="#D97706" suffix="%" />
                <Donut label="Présence" value={m.avgPresence} total={100} run={run} color="#111827" suffix="%" />
                <Donut label="Prof IA" value={m.profIa} total={m.courses} run={run} color="#7C3AED" />
              </div>
            </Fade>

            {/* Alertes */}
            <Fade delay={100} className="bg-white border border-border p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-subtle mb-3">Points d&apos;attention</p>
              <div className="space-y-1.5">
                <AlertRow icon={ClipboardList} label="Dossiers en attente" value={m.insPending} tone={m.insPending ? "warn" : "ok"} />
                <AlertRow icon={PenLine} label="Copies à corriger" value={m.toCorrect} tone={m.toCorrect ? "warn" : "ok"} />
                <AlertRow icon={AlertTriangle} label="Cours en brouillon" value={m.drafts} tone={m.drafts ? "warn" : "ok"} />
                <AlertRow icon={FileCheck} label="Inscriptions rejetées" value={m.insRejected} tone={m.insRejected ? "bad" : "ok"} />
              </div>
            </Fade>

            {/* Top enseignants */}
            <Fade delay={140} className="bg-white border border-border p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-subtle mb-3">Charge des enseignants</p>
              {m.teacherBoard.length === 0 ? (
                <p className="text-xs text-muted italic">Aucune affectation.</p>
              ) : (
                <div className="space-y-2.5">
                  {m.teacherBoard.map((t, i) => {
                    const max = Math.max(1, ...m.teacherBoard.map((x) => x.courses));
                    return (
                      <div key={t.name + i} className="flex items-center gap-2">
                        <Avatar name={t.name} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-ink truncate">{t.name}</span>
                            <span className="text-xs font-bold text-muted flex-shrink-0">{t.courses}</span>
                          </div>
                          <div className="h-1.5 bg-surface mt-1 overflow-hidden rounded-full">
                            <div className="h-full bg-cama transition-[width] duration-700 ease-out" style={{ width: run ? `${(t.courses / max) * 100}%` : "0%" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Fade>

            {/* Adoption Prof IA */}
            <Fade delay={180} className="bg-cama-50 border border-cama/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-cama" />
                <p className="text-[11px] font-black uppercase tracking-widest text-cama">Adoption Prof IA</p>
              </div>
              <p className="text-2xl font-black text-ink leading-none">
                <Count value={m.courses ? Math.round((m.profIa / m.courses) * 100) : 0} run={run} />%
              </p>
              <p className="text-[11px] text-muted mt-1">{m.profIa} cours sur {m.courses} avec assistant IA</p>
              <div className="h-2 bg-white mt-2 overflow-hidden rounded-full border border-cama/10">
                <div className="h-full bg-cama transition-[width] duration-700 ease-out" style={{ width: run ? `${m.courses ? (m.profIa / m.courses) * 100 : 0}%` : "0%" }} />
              </div>
            </Fade>

            <p className="text-[10px] text-subtle px-1">Arrêté au {FR_DATE.format(new Date())}.</p>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════
// Métriques
// ════════════════════════════════════════════════════════════
interface BarRow { label: string; value: number; }
interface RatingRow { label: string; value: number; count: number; }
interface FiliereRow { title: string; students: number; courses: number; pct: number; }
interface TeacherRow { name: string; courses: number; }

function computeMetrics(d: Data) {
  const students = d.users.filter((u) => u.role === "etudiant").length;
  const teachers = d.users.filter((u) => u.role === "enseignant").length;
  const filieres = new Set(d.courses.map((c) => c.parcours_slug)).size;

  const validated = d.inscriptions.filter((i) => i.status === "validee");
  const insPending = d.inscriptions.filter((i) => i.status === "en_attente").length;
  const insRejected = d.inscriptions.filter((i) => i.status === "rejetee").length;

  const byFiliere = topBars(countBy(validated, (i) => i.parcours_title));
  const byNiveau: BarRow[] = NIVEAUX
    .map((n) => ({ label: n, value: validated.filter((i) => i.level === n).length }))
    .filter((r) => r.value > 0);
  const byMode: BarRow[] = MODES
    .map((mo) => ({ label: mo.label, value: validated.filter((i) => i.mode === mo.key).length }))
    .filter((r) => r.value > 0);

  const published = d.courses.filter((c) => c.published).length;
  const drafts = d.courses.length - published;
  const profIa = d.courses.filter((c) => c.prof_ia).length;
  const avgHours = d.courses.length ? Math.round(d.courses.reduce((a, c) => a + c.hours, 0) / d.courses.length) : 0;

  const copiesSubmitted = d.attempts.filter((a) => a.status === "soumis" || a.status === "corrige").length;
  const copiesGraded = d.attempts.filter((a) => a.status === "corrige").length;
  const toCorrect = Math.max(0, copiesSubmitted - copiesGraded);
  const graded = d.attempts.filter((a) => a.score != null && a.score_max != null && a.score_max > 0);
  const notes20 = graded.map((a) => (a.score! / a.score_max!) * 20);
  const avgNote20 = notes20.length ? notes20.reduce((x, y) => x + y, 0) / notes20.length : 0;
  const successRate = notes20.length ? Math.round((notes20.filter((n) => n >= 10).length / notes20.length) * 100) : 0;

  const courseById = new Map(d.courses.map((c) => [c.id, c]));
  const rowsByLive = new Map<string, DBLiveAttendance[]>();
  d.attendance.forEach((r) => { const arr = rowsByLive.get(r.live_id) ?? []; arr.push(r); rowsByLive.set(r.live_id, arr); });
  const heldLives = d.lives.filter((l) => l.started_at);
  let presentCount = 0, expectedCount = 0;
  for (const l of heldLives) {
    const course = l.program_course_id ? courseById.get(l.program_course_id) : undefined;
    if (!course) continue;
    for (const r of (rowsByLive.get(l.id) ?? []).filter((x) => x.role === "etudiant")) {
      expectedCount++;
      const st = autoStatus(l, course, r);
      if (st === "present" || st === "retard") presentCount++;
    }
  }
  const avgPresence = expectedCount ? Math.round((presentCount / expectedCount) * 100) : 0;

  const avgCourseRating = averageRating(d.feedback);
  const fbByCourse = new Map<string, DBCourseFeedback[]>();
  d.feedback.forEach((f) => { const arr = fbByCourse.get(f.program_course_id) ?? []; arr.push(f); fbByCourse.set(f.program_course_id, arr); });
  const rated: RatingRow[] = [];
  fbByCourse.forEach((rows, courseId) => {
    const c = courseById.get(courseId);
    if (c) rated.push({ label: `${c.code} · ${c.title}`, value: averageRating(rows), count: rows.length });
  });
  const sorted = [...rated].sort((a, b) => b.value - a.value);
  const topCourses = sorted.slice(0, 5);
  const bottomCourses = [...sorted].reverse().slice(0, 5);

  const ref = new Date();
  const monthKeys: { key: string; label: string }[] = [];
  for (let i = 7; i >= 0; i--) {
    const dt = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    monthKeys.push({ key: `${dt.getFullYear()}-${dt.getMonth()}`, label: dt.toLocaleDateString("fr-FR", { month: "short" }) });
  }
  const monthCount: Record<string, number> = {};
  d.inscriptions.forEach((i) => { const dt = new Date(i.enrolled_at); const k = `${dt.getFullYear()}-${dt.getMonth()}`; monthCount[k] = (monthCount[k] ?? 0) + 1; });
  const monthly = monthKeys.map((mo) => ({ label: mo.label, value: monthCount[mo.key] ?? 0 }));
  const lastM = monthly[monthly.length - 1]?.value ?? 0;
  const prevM = monthly[monthly.length - 2]?.value ?? 0;
  const insTrend = prevM > 0 ? Math.round(((lastM - prevM) / prevM) * 100) : (lastM > 0 ? 100 : 0);

  const coursesByFil: Record<string, number> = {};
  d.courses.forEach((c) => { coursesByFil[c.parcours_title] = (coursesByFil[c.parcours_title] ?? 0) + 1; });
  const totalVal = validated.length || 1;
  const filiereBoard: FiliereRow[] = byFiliere.slice(0, 8).map((f) => ({
    title: f.label, students: f.value, courses: coursesByFil[f.label] ?? 0, pct: Math.round((f.value / totalVal) * 100),
  }));

  const teacherName = new Map(d.users.filter((u) => u.role === "enseignant").map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]));
  const coursesByTeacher: Record<string, number> = {};
  d.courses.forEach((c) => { if (c.teacher_id) coursesByTeacher[c.teacher_id] = (coursesByTeacher[c.teacher_id] ?? 0) + 1; });
  const teacherBoard: TeacherRow[] = Object.entries(coursesByTeacher)
    .map(([id, n]) => ({ name: teacherName.get(id) || "Enseignant", courses: n }))
    .sort((a, b) => b.courses - a.courses).slice(0, 6);

  return {
    students, teachers, filieres, courses: d.courses.length,
    insValidated: validated.length, insPending, insRejected,
    exams: d.exams.length, livesHeld: heldLives.length, livesTotal: d.lives.length, tps: d.tps.length,
    byNiveau, byMode, published, drafts, chapterCount: d.chapterCount, profIa, avgHours,
    copiesSubmitted, copiesGraded, toCorrect, avgNote20, successRate, avgPresence,
    avgCourseRating, feedbackCount: d.feedback.length, topCourses, bottomCourses,
    recent: d.inscriptions.slice(0, 8), monthly, insTrend, filiereBoard, teacherBoard,
  };
}

function countBy<T>(rows: T[], key: (r: T) => string): Record<string, number> {
  const acc: Record<string, number> = {};
  rows.forEach((r) => { const k = key(r); acc[k] = (acc[k] ?? 0) + 1; });
  return acc;
}
function topBars(counts: Record<string, number>): BarRow[] {
  return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

// ════════════════════════════════════════════════════════════
// Présentation
// ════════════════════════════════════════════════════════════
function Spinner() {
  return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" /></div>;
}

/** Compteur animé (0 → valeur). */
function useCountUp(target: number, run: boolean, ms = 850) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!run) { setV(0); return; }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, run, ms]);
  return v;
}
function Count({ value, run }: { value: number; run: boolean }) {
  return <>{useCountUp(value, run).toLocaleString("fr-FR")}</>;
}

/** Conteneur avec entrée en fondu échelonnée. */
function Fade({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return <div className={`animate-fade-up ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`mb-1 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
      {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {up ? "+" : ""}{value}% <span className="font-normal text-[10px] opacity-70">/ mois</span>
    </span>
  );
}

const SEG = ["bg-cama", "bg-gold", "bg-ink", "bg-cama-300", "bg-gold-dark", "bg-purple-500", "bg-teal-500", "bg-rose-400"];

function SegmentBar({ rows, total, run }: { rows: FiliereRow[]; total: number; run: boolean }) {
  if (!rows.length) return <p className="text-xs text-muted italic mt-5">Aucune inscription validée.</p>;
  return (
    <div className="mt-5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
        {rows.map((r, i) => (
          <div key={r.title} className={`${SEG[i % SEG.length]} transition-[width] duration-700 ease-out`}
            style={{ width: run ? `${(r.students / (total || 1)) * 100}%` : "0%" }} title={`${r.title} : ${r.students}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {rows.slice(0, 5).map((r, i) => (
          <span key={r.title} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className={`w-2 h-2 rounded-full ${SEG[i % SEG.length]}`} />{r.title} <b className="text-ink">{r.pct}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function Pill({ label, value, sub, accent, icon: Icon }: {
  label: string; value: React.ReactNode; sub?: string; accent: "cama" | "gold" | "ink"; icon: React.ComponentType<{ className?: string }>;
}) {
  const color = accent === "cama" ? "text-cama" : accent === "gold" ? "text-gold-dark" : "text-ink";
  return (
    <div className="bg-white border border-border p-4 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-subtle">{label}</p>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-3xl font-black leading-none mt-3 ${color} tabular-nums`}>{value}</p>
      {sub && <p className="text-[10px] text-muted mt-1">{sub}</p>}
    </div>
  );
}
function DarkPill({ label, value, sub, icon: Icon }: { label: string; value: React.ReactNode; sub?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-ink text-white p-4 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{label}</p>
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <p className="text-3xl font-black leading-none mt-3 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-white/50 mt-1">{sub}</p>}
    </div>
  );
}

function StripKPIs({ items, run }: { items: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; suffix?: string }[]; run: boolean }) {
  return (
    <div className="bg-white border border-border grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y lg:divide-y-0 divide-border">
      {items.map((k) => (
        <div key={k.label} className="p-3.5">
          <k.icon className="w-4 h-4 text-muted mb-2" />
          <p className="text-xl font-black text-ink leading-none tabular-nums"><Count value={k.value} run={run} />{k.suffix}</p>
          <p className="text-[10px] text-muted mt-1 font-semibold">{k.label}</p>
        </div>
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return <span className="w-7 h-7 rounded-full bg-cama-50 text-cama text-[10px] font-black flex items-center justify-center flex-shrink-0">{initials || "?"}</span>;
}

function FiliereBoard({ rows, run }: { rows: FiliereRow[]; run: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.students));
  return (
    <div className="bg-white border border-border h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-subtle">Classement des filières</p>
        <span className="text-[11px] text-muted">{rows.length}</span>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted">Aucune donnée.</p>}
        {rows.map((r, i) => (
          <div key={r.title} className="px-4 py-2.5 flex items-center gap-3">
            <span className="w-5 text-center text-sm font-black text-subtle">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink truncate">{r.title}</span>
                <span className="text-xs text-muted flex-shrink-0">{r.courses} cours</span>
              </div>
              <div className="h-1.5 bg-surface mt-1.5 overflow-hidden rounded-full">
                <div className={`${SEG[i % SEG.length]} h-full transition-[width] duration-700 ease-out`} style={{ width: run ? `${(r.students / max) * 100}%` : "0%" }} />
              </div>
            </div>
            <div className="text-right flex-shrink-0 w-12">
              <p className="text-sm font-black text-ink tabular-nums">{r.students}</p>
              <p className="text-[10px] text-muted">{r.pct}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressCard({ title, rows, accent, run }: { title: string; rows: BarRow[]; accent: string; run: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bg-white border border-border p-4 h-full">
      <p className="text-[11px] font-black uppercase tracking-widest text-subtle mb-3">{title}</p>
      {rows.length === 0 ? <p className="text-xs text-muted italic">Aucune donnée.</p> : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink">{r.label}</span>
                <span className="text-xs font-bold text-muted tabular-nums">{r.value}</span>
              </div>
              <div className="h-2 bg-surface overflow-hidden rounded-full">
                <div className={`${accent} h-full transition-[width] duration-700 ease-out`} style={{ width: run ? `${(r.value / max) * 100}%` : "0%" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AreaChart({ data, run }: { data: BarRow[]; run: boolean }) {
  const W = 100, H = 42;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? W / (data.length - 1) : W;
  const pts = data.map((d, i) => [i * step, H - (d.value / max) * (H - 6) - 3] as const);
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${H} ${line} ${W},${H}`;
  return (
    <div>
      <div className="relative w-full" style={{ aspectRatio: "100 / 42" }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="camaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#camaFill)" style={{ opacity: run ? 1 : 0, transition: "opacity .9s ease .3s" }} />
          <polyline points={line} fill="none" stroke="#4F46E5" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"
            vectorEffect="non-scaling-stroke" pathLength={100} strokeDasharray={100}
            style={{ strokeDashoffset: run ? 0 : 100, transition: "stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1)" }} />
          {pts.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="1.4" fill="#4F46E5" vectorEffect="non-scaling-stroke"
              style={{ opacity: run ? 1 : 0, transition: `opacity .3s ease ${0.6 + i * 0.06}s` }} />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-2">
        {data.map((d) => <span key={d.label} className="text-[10px] text-subtle capitalize">{d.label}</span>)}
      </div>
    </div>
  );
}

function Donut({ label, value, total, run, color, suffix }: { label: string; value: number; total: number; run: boolean; color: string; suffix?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const R = 15.9155, C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center text-center p-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r={R} fill="none" stroke="#F3F4F6" strokeWidth="4" />
          <circle cx="20" cy="20" r={R} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={C} style={{ strokeDashoffset: run ? C * (1 - pct / 100) : C, transition: "stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1)" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black text-ink tabular-nums"><Count value={suffix === "%" ? value : pct} run={run} />{suffix ?? "%"}</span>
        </div>
      </div>
      <p className="text-[10px] text-muted mt-1 leading-tight">{label}</p>
    </div>
  );
}

function AlertRow({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: "ok" | "warn" | "bad" }) {
  const dot = tone === "bad" ? "bg-red-500" : tone === "warn" ? "bg-gold" : "bg-green-500";
  const badge = tone === "bad" ? "bg-red-50 text-red-600" : tone === "warn" ? "bg-gold/10 text-gold-dark" : "bg-green-50 text-green-700";
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <Icon className="w-4 h-4 text-muted" />
      <span className="text-xs text-ink flex-1 truncate">{label}</span>
      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${badge}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: InscriptionWithUser["status"] }) {
  const map: Record<string, { cls: string; label: string }> = {
    validee: { cls: "bg-green-50 text-green-700 border-green-200", label: "Validée" },
    en_attente: { cls: "bg-gold/10 text-gold-dark border-gold/30", label: "En attente" },
    rejetee: { cls: "bg-red-50 text-red-600 border-red-200", label: "Rejetée" },
  };
  const s = map[status] ?? { cls: "bg-surface text-muted border-border", label: status };
  return <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${s.cls}`}>{s.label}</span>;
}
