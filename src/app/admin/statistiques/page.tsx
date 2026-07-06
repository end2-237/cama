"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, BarChart3, Users, GraduationCap, BookOpen,
  ClipboardList, Radio, FlaskConical, UserCheck, Layers, Bot, Clock,
  Star, CheckCircle2, XCircle, AlertTriangle, TrendingUp, FileCheck,
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

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setFetching(true);
      // 1er niveau : tout ce qui ne dépend que du catalogue
      const [users, inscriptions, stats, courses, feedback] = await Promise.all([
        fetchUsers(), fetchInscriptions(), fetchAdminStats(), fetchProgram(), fetchAllFeedback(),
      ]);
      const courseIds = courses.map((c) => c.id);

      // 2e niveau : dépend des ids de cours
      const [chapterLists, exams, delibs, lives, tps] = await Promise.all([
        Promise.all(courses.map((c) => fetchChapters(c.id))),
        fetchExamsForCourses(courseIds),
        fetchDeliberations(),
        fetchLivesForCourses(courseIds),
        fetchTpsForCourses(courseIds),
      ]);
      const chapterCount = chapterLists.reduce((a, l) => a + l.length, 0);

      // 3e niveau : dépend des examens / lives / tp
      const [attemptLists, attendance, tpProgressLists] = await Promise.all([
        Promise.all(exams.map((e) => fetchAttemptsForExam(e.id))),
        fetchAttendanceForLives(lives.map((l) => l.id)),
        Promise.all(tps.map((t) => fetchTpProgress(t.id))),
      ]);
      const attempts = attemptLists.flat();
      const tpProgress = tpProgressLists.flat();

      if (!alive) return;
      setData({
        users, inscriptions, stats, courses, chapterCount,
        exams, attempts, delibs, lives, attendance, feedback, tps, tpProgress,
      });
      setFetching(false);
    })();
    return () => { alive = false; };
  }, []);

  const m = useMemo(() => (data ? computeMetrics(data) : null), [data]);

  if (loading || !user) return <Spinner />;

  return (
    <PageShell
      title="Statistiques de la plateforme"
      subtitle="Indicateurs de population, pédagogie, évaluations, assiduité et qualité perçue."
      icon={BarChart3}
      breadcrumb="Statistiques"
      context={`au ${FR_DATE.format(new Date())}`}
      maxWidth="max-w-[1200px]"
      stats={m ? [
        { label: "Étudiants",    value: m.students,      accent: "cama" },
        { label: "Enseignants",  value: m.teachers,      accent: "ink" },
        { label: "Filières",     value: m.filieres,      accent: "gold" },
        { label: "Cours",        value: m.courses,       accent: "ink" },
        { label: "Inscriptions", value: m.inscriptions,  accent: "ink" },
        { label: "Examens",      value: m.exams,         accent: "cama" },
      ] : undefined}
    >
      <div>
        {fetching || !m ? (
          <div className="py-24 text-center"><Loader2 className="w-7 h-7 animate-spin text-cama mx-auto" /></div>
        ) : (
          <div className="space-y-8">

            {/* 1 — Vue d'ensemble */}
            <Section title="Vue d'ensemble">
              <KpiGrid cols={4} items={[
                { icon: Users, label: "Étudiants", value: m.students, color: "text-cama" },
                { icon: UserCheck, label: "Enseignants", value: m.teachers, color: "text-ink" },
                { icon: GraduationCap, label: "Filières", value: m.filieres, color: "text-gold-dark" },
                { icon: BookOpen, label: "Cours", value: m.courses, color: "text-ink" },
                { icon: ClipboardList, label: "Inscriptions", value: m.inscriptions, color: "text-ink",
                  sub: `${m.insValidated} validées · ${m.insPending} en attente · ${m.insRejected} rejetées` },
                { icon: FileCheck, label: "Examens", value: m.exams, color: "text-cama" },
                { icon: Radio, label: "Lives tenus", value: m.livesHeld, color: "text-ink", sub: `${m.livesTotal} au total` },
                { icon: FlaskConical, label: "TP programmés", value: m.tps, color: "text-gold-dark" },
              ]} />
            </Section>

            {/* 2 — Population */}
            <Section title="Population étudiante">
              <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
                <BarCard title="Par filière" rows={m.byFiliere} accent="bg-cama" />
                <BarCard title="Par niveau" rows={m.byNiveau} accent="bg-gold" />
                <BarCard title="Par mode de cycle" rows={m.byMode} accent="bg-ink" />
              </div>
            </Section>

            {/* 3 — Pédagogie */}
            <Section title="Pédagogie & contenus">
              <KpiGrid cols={5} items={[
                { icon: CheckCircle2, label: "Cours publiés", value: m.published, color: "text-green-600" },
                { icon: XCircle, label: "Brouillons", value: m.drafts, color: "text-muted" },
                { icon: Layers, label: "Chapitres", value: m.chapterCount, color: "text-ink" },
                { icon: Bot, label: "Cours avec Prof IA", value: m.profIa, color: "text-purple-600" },
                { icon: Clock, label: "Volume horaire moyen", value: `${m.avgHours}h`, color: "text-gold-dark" },
              ]} />
            </Section>

            {/* 4 — Évaluations */}
            <Section title="Évaluations">
              <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
                <BarCard title="Examens par statut" rows={m.examsByStatus} accent="bg-cama" />
                <div className="bg-white p-4 grid grid-cols-2 gap-4">
                  <MiniStat label="Copies soumises" value={m.copiesSubmitted} color="text-ink" />
                  <MiniStat label="Copies corrigées" value={m.copiesGraded} color="text-green-600" />
                  <MiniStat label="Note moyenne /20" value={m.avgNote20.toFixed(1)} color="text-cama" />
                  <MiniStat label="Taux de réussite" value={`${m.successRate}%`} color="text-gold-dark" icon={TrendingUp} />
                </div>
              </div>
            </Section>

            {/* 5 — Assiduité */}
            <Section title="Assiduité (cours live)">
              <KpiGrid cols={4} items={[
                { icon: UserCheck, label: "Présence moyenne", value: `${m.avgPresence}%`, color: "text-green-600" },
                { icon: AlertTriangle, label: "Absences auto", value: m.autoAbsences, color: "text-red-500" },
                { icon: Radio, label: "Lives sans enseignant", value: m.livesNoTeacher, color: "text-gold-dark" },
                { icon: Users, label: "Connexions enregistrées", value: m.attendanceRows, color: "text-ink" },
              ]} />
            </Section>

            {/* 6 — Qualité */}
            <Section title="Qualité perçue (retours étudiants)">
              <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
                <div className="bg-white p-4 flex flex-col items-center justify-center">
                  <Star className="w-5 h-5 text-gold-dark mb-1" />
                  <p className="text-3xl font-bold text-ink leading-none">{m.avgCourseRating.toFixed(1)}<span className="text-base text-muted">/5</span></p>
                  <p className="text-[10px] text-muted mt-1.5 text-center">Note moyenne des cours · {m.feedbackCount} avis</p>
                </div>
                <RatingList title="Top 5 des cours" rows={m.topCourses} good />
                <RatingList title="5 cours à améliorer" rows={m.bottomCourses} good={false} />
              </div>
            </Section>

            {/* 7 — Inscriptions récentes */}
            <Section title="Inscriptions récentes">
              <div className="bg-white border border-border overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-subtle border-b border-border">
                      <th className="text-left px-3 py-2">Étudiant</th>
                      <th className="text-left px-3 py-2">Filière</th>
                      <th className="text-left px-3 py-2">Niveau</th>
                      <th className="text-left px-3 py-2">Mode</th>
                      <th className="text-left px-3 py-2">Statut</th>
                      <th className="text-left px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {m.recent.map((i) => (
                      <tr key={i.id} className="hover:bg-surface/60 transition-colors">
                        <td className="px-3 py-2 font-semibold text-ink">
                          {i.user ? `${i.user.first_name} ${i.user.last_name}` : i.matricule}
                        </td>
                        <td className="px-3 py-2 text-muted">{i.parcours_title}</td>
                        <td className="px-3 py-2 text-muted">{i.level}</td>
                        <td className="px-3 py-2 text-muted capitalize">{i.mode}</td>
                        <td className="px-3 py-2"><StatusBadge status={i.status} /></td>
                        <td className="px-3 py-2 text-subtle text-xs">
                          {new Date(i.enrolled_at).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                    {m.recent.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-muted text-xs">Aucune inscription.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            <p className="text-[11px] text-subtle pt-2">Données arrêtées au {FR_DATE.format(new Date())}.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════
// Calcul des métriques
// ════════════════════════════════════════════════════════════
interface BarRow { label: string; value: number; }
interface RatingRow { label: string; value: number; count: number; }

function computeMetrics(d: Data) {
  const students = d.users.filter((u) => u.role === "etudiant").length;
  const teachers = d.users.filter((u) => u.role === "enseignant").length;
  const filieres = new Set(d.courses.map((c) => c.parcours_slug)).size;

  const validated = d.inscriptions.filter((i) => i.status === "validee");
  const insPending = d.inscriptions.filter((i) => i.status === "en_attente").length;
  const insRejected = d.inscriptions.filter((i) => i.status === "rejetee").length;

  // ── Population (basée sur inscriptions validées) ──
  const byFiliere = topBars(countBy(validated, (i) => i.parcours_title));
  const byNiveau: BarRow[] = NIVEAUX
    .map((n) => ({ label: n, value: validated.filter((i) => i.level === n).length }))
    .filter((r) => r.value > 0);
  const byMode: BarRow[] = MODES
    .map((mo) => ({ label: mo.label, value: validated.filter((i) => i.mode === mo.key).length }))
    .filter((r) => r.value > 0);

  // ── Pédagogie ──
  const published = d.courses.filter((c) => c.published).length;
  const drafts = d.courses.length - published;
  const profIa = d.courses.filter((c) => c.prof_ia).length;
  const avgHours = d.courses.length
    ? Math.round(d.courses.reduce((a, c) => a + c.hours, 0) / d.courses.length)
    : 0;

  // ── Évaluations ──
  const examsByStatus: BarRow[] = ([["planifie", "Planifiés"], ["ouvert", "Ouverts"], ["termine", "Terminés"]] as const)
    .map(([k, lbl]) => ({ label: lbl, value: d.exams.filter((e) => e.status === k).length }))
    .filter((r) => r.value > 0);
  const submitted = d.attempts.filter((a) => a.status === "soumis" || a.status === "corrige");
  const copiesSubmitted = submitted.length;
  const copiesGraded = d.attempts.filter((a) => a.status === "corrige").length;
  const graded = d.attempts.filter((a) => a.score != null && a.score_max != null && a.score_max > 0);
  const notes20 = graded.map((a) => (a.score! / a.score_max!) * 20);
  const avgNote20 = notes20.length ? notes20.reduce((x, y) => x + y, 0) / notes20.length : 0;
  const successRate = notes20.length
    ? Math.round((notes20.filter((n) => n >= 10).length / notes20.length) * 100)
    : 0;

  // ── Assiduité ──
  const courseById = new Map(d.courses.map((c) => [c.id, c]));
  const rowsByLive = new Map<string, DBLiveAttendance[]>();
  d.attendance.forEach((r) => {
    const arr = rowsByLive.get(r.live_id) ?? [];
    arr.push(r);
    rowsByLive.set(r.live_id, arr);
  });
  const heldLives = d.lives.filter((l) => l.started_at);
  let presentCount = 0, expectedCount = 0, autoAbsences = 0;
  for (const l of heldLives) {
    const course = l.program_course_id ? courseById.get(l.program_course_id) : undefined;
    if (!course) continue;
    const rows = rowsByLive.get(l.id) ?? [];
    // Étudiants attendus = ceux qui ont une ligne de connexion (rôle étudiant)
    const studentRows = rows.filter((r) => r.role === "etudiant");
    for (const r of studentRows) {
      expectedCount++;
      const st = autoStatus(l, course, r);
      if (st === "present" || st === "retard") presentCount++;
      else autoAbsences++;
    }
  }
  const avgPresence = expectedCount ? Math.round((presentCount / expectedCount) * 100) : 0;
  const livesNoTeacher = d.lives.filter((l) => !l.created_by).length;

  // ── Qualité ──
  const avgCourseRating = averageRating(d.feedback);
  const fbByCourse = new Map<string, DBCourseFeedback[]>();
  d.feedback.forEach((f) => {
    const arr = fbByCourse.get(f.program_course_id) ?? [];
    arr.push(f);
    fbByCourse.set(f.program_course_id, arr);
  });
  const rated: RatingRow[] = [];
  fbByCourse.forEach((rows, courseId) => {
    const c = courseById.get(courseId);
    if (!c) return;
    rated.push({ label: `${c.code} · ${c.title}`, value: averageRating(rows), count: rows.length });
  });
  const sorted = [...rated].sort((a, b) => b.value - a.value);
  const topCourses = sorted.slice(0, 5);
  const bottomCourses = [...sorted].reverse().slice(0, 5);

  return {
    students, teachers, filieres, courses: d.courses.length,
    inscriptions: d.inscriptions.length, insValidated: validated.length, insPending, insRejected,
    exams: d.exams.length, livesHeld: heldLives.length, livesTotal: d.lives.length, tps: d.tps.length,
    byFiliere, byNiveau, byMode,
    published, drafts, chapterCount: d.chapterCount, profIa, avgHours,
    examsByStatus, copiesSubmitted, copiesGraded, avgNote20, successRate,
    avgPresence, autoAbsences, livesNoTeacher, attendanceRows: d.attendance.length,
    avgCourseRating, feedbackCount: d.feedback.length, topCourses, bottomCourses,
    recent: d.inscriptions.slice(0, 10),
    tpProgressCount: d.tpProgress.length,
  };
}

function countBy<T>(rows: T[], key: (r: T) => string): Record<string, number> {
  const m: Record<string, number> = {};
  rows.forEach((r) => { const k = key(r); m[k] = (m[k] ?? 0) + 1; });
  return m;
}
function topBars(counts: Record<string, number>): BarRow[] {
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

// ════════════════════════════════════════════════════════════
// Présentation
// ════════════════════════════════════════════════════════════
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[10px] font-black uppercase tracking-widest text-subtle mb-2">{title}</h2>
      {children}
    </section>
  );
}

interface KpiItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: React.ReactNode; color: string; sub?: string;
}
function KpiGrid({ items, cols }: { items: KpiItem[]; cols: number }) {
  return (
    <div className={`grid grid-cols-2 ${cols === 5 ? "md:grid-cols-5" : "md:grid-cols-4"} gap-px bg-border border border-border`}>
      {items.map((k) => (
        <div key={k.label} className="bg-white p-3">
          <k.icon className={`w-4 h-4 mb-1.5 ${k.color}`} />
          <p className={`text-2xl font-bold leading-none ${k.color}`}>{k.value}</p>
          <p className="text-[11px] text-muted mt-1 font-semibold">{k.label}</p>
          {k.sub && <p className="text-[10px] text-subtle mt-0.5">{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function BarCard({ title, rows, accent }: { title: string; rows: BarRow[]; accent: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted italic">Aucune donnée.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold text-ink truncate pr-2">{r.label}</span>
                <span className="text-[11px] font-bold text-muted flex-shrink-0">{r.value}</span>
              </div>
              <div className="h-2 bg-surface overflow-hidden">
                <div className={`h-full ${accent}`} style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color, icon: Icon }: {
  label: string; value: React.ReactNode; color: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      {Icon && <Icon className={`w-4 h-4 mb-1 ${color}`} />}
      <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
      <p className="text-[11px] text-muted mt-1 font-semibold">{label}</p>
    </div>
  );
}

function RatingList({ title, rows, good }: { title: string; rows: RatingRow[]; good: boolean }) {
  return (
    <div className="bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-subtle mb-3">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted italic">Aucun avis.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-ink truncate">{r.label}</span>
              <span className={`text-[11px] font-bold flex items-center gap-0.5 flex-shrink-0 ${good ? "text-green-600" : "text-gold-dark"}`}>
                <Star className="w-3 h-3" /> {r.value.toFixed(1)}
                <span className="text-subtle font-normal ml-1">({r.count})</span>
              </span>
            </div>
          ))}
        </div>
      )}
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
  return <span className={`text-[10px] font-bold px-2 py-0.5 border ${s.cls}`}>{s.label}</span>;
}
