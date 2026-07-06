"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, FileQuestion, Clock, CheckCircle2, Play, Award,
  BookOpen, Shield, AlertTriangle, Calendar, Timer, BarChart3,
  ChevronRight, Filter, Target, TrendingUp, Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import type { DBProgramCourse, DBExam, DBExamAttempt } from "@/lib/supabase";
import { fetchStudentProgram } from "@/lib/program";
import { fetchExamsForCourses, fetchAttemptsForStudent, fetchQuestions, effectiveScore } from "@/lib/exams";

type FilterMode = "all" | "open" | "done";

export default function StudentExamsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [allExams, setAllExams] = useState<DBExam[]>([]);
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, { total: number; hasOpen: boolean }>>({});
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const slug = user.dossier?.parcoursSlug;
    if (!slug) { setFetching(false); return; }
    (async () => {
      const cs = await fetchStudentProgram(slug, user.dossier?.level);
      setCourses(cs);
      const [exams, atts] = await Promise.all([
        fetchExamsForCourses(cs.map((c) => c.id)),
        fetchAttemptsForStudent(user.id),
      ]);
      setAllExams(exams);
      setAttempts(atts);
      // Fetch question counts for all exams
      const qMap: Record<string, { total: number; hasOpen: boolean }> = {};
      await Promise.all(
        exams.map(async (e) => {
          const qs = await fetchQuestions(e.id);
          qMap[e.id] = { total: qs.length, hasOpen: qs.some((q) => q.type === "ouverte") };
        })
      );
      setQuestionCounts(qMap);
      setFetching(false);
    })();
  }, [user]);

  // ── Derived data ──
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  // Toutes les tentatives par examen (session 1 + rattrapage éventuel)
  const attemptsByExam = useMemo(() => {
    const m = new Map<string, DBExamAttempt[]>();
    attempts.forEach((a) => {
      const arr = m.get(a.exam_id) ?? [];
      arr.push(a);
      m.set(a.exam_id, arr.sort((x, y) => (x.session ?? 1) - (y.session ?? 1)));
    });
    return m;
  }, [attempts]);
  // Tentative « active » d'un examen = la plus récente (rattrapage prioritaire)
  const attemptByExam = useMemo(() => {
    const m = new Map<string, DBExamAttempt>();
    attemptsByExam.forEach((arr, examId) => { m.set(examId, arr[arr.length - 1]); });
    return m;
  }, [attemptsByExam]);

  const openExams = useMemo(() => allExams.filter((e) => e.status === "ouvert"), [allExams]);
  const completedAttempts = useMemo(() => attempts.filter((a) => a.status === "soumis" || a.status === "corrige"), [attempts]);
  const gradedAttempts = useMemo(() => attempts.filter((a) => a.status === "corrige"), [attempts]);
  const inProgressAttempts = useMemo(() => attempts.filter((a) => a.status === "encours"), [attempts]);

  const totalAlerts = useMemo(() => attempts.reduce((s, a) => s + (a.alerts?.length ?? 0), 0), [attempts]);

  const avgScore = useMemo(() => {
    const scored = gradedAttempts.filter((a) => a.score !== null && a.score_max);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, a) => s + (Number(a.score) / Number(a.score_max)) * 20, 0) / scored.length * 10) / 10;
  }, [gradedAttempts]);

  const bestScore = useMemo(() => {
    const scored = gradedAttempts.filter((a) => a.score !== null && a.score_max);
    if (!scored.length) return null;
    return Math.round(Math.max(...scored.map((a) => (Number(a.score) / Number(a.score_max)) * 20)) * 10) / 10;
  }, [gradedAttempts]);

  // Score distribution for chart
  const scoreDistribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // 0-4, 4-8, 8-12, 12-16, 16-20
    gradedAttempts.forEach((a) => {
      if (a.score === null || !a.score_max) return;
      const n20 = (Number(a.score) / Number(a.score_max)) * 20;
      const idx = Math.min(Math.floor(n20 / 4), 4);
      buckets[idx]++;
    });
    return buckets;
  }, [gradedAttempts]);
  const maxBucket = Math.max(...scoreDistribution, 1);

  // Course exam counts
  const courseExamCounts = useMemo(() => {
    const m: Record<string, number> = {};
    allExams.forEach((e) => { m[e.program_course_id] = (m[e.program_course_id] ?? 0) + 1; });
    return m;
  }, [allExams]);

  // Next scheduled exam
  const nextExam = useMemo(() => {
    const now = Date.now();
    return allExams
      .filter((e) => e.scheduled_at && new Date(e.scheduled_at).getTime() > now && e.status !== "termine")
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0] ?? null;
  }, [allExams]);

  // Filtered exams for history
  const filteredExams = useMemo(() => {
    if (filter === "open") return allExams.filter((e) => e.status === "ouvert");
    if (filter === "done") return allExams.filter((e) => {
      const att = attemptByExam.get(e.id);
      return att && att.status !== "encours";
    });
    return allExams;
  }, [allExams, filter, attemptByExam]);

  // Recent results (last 5 completed)
  const recentResults = useMemo(() => {
    return completedAttempts
      .sort((a, b) => new Date(b.submitted_at ?? b.started_at).getTime() - new Date(a.submitted_at ?? a.started_at).getTime())
      .slice(0, 5);
  }, [completedAttempts]);

  // ── Helpers ──
  const note20 = (a: DBExamAttempt) =>
    a.score !== null && a.score_max ? Math.round((Number(a.score) / Number(a.score_max)) * 20 * 10) / 10 : null;

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDateTime = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const countdown = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    if (diff <= 0) return "Maintenant";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}j ${hours}h`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}min`;
  };

  const statusLabel = (att: DBExamAttempt, examId: string) => {
    const n = note20(att);
    const qInfo = questionCounts[examId];
    if (att.status === "corrige") {
      if (qInfo?.hasOpen) return `Note : ${n ?? "—"}/20`;
      return `Note finale : ${n ?? "—"}/20`;
    }
    if (att.status === "soumis") {
      const parts = [`Copie soumise`];
      if (n !== null) parts.push(`note QCM : ${n}/20`);
      if (qInfo?.hasOpen) parts.push("questions ouvertes en correction par l'enseignant");
      return parts.join(" — ");
    }
    return "En cours — reprendre";
  };

  // ── Loading ──
  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  return (
    <PageShell
      title="Mes évaluations"
      subtitle="Passez vos examens, suivez vos notes et gardez un dossier Safe-CAMA propre."
      icon={FileQuestion}
      breadcrumb="Mes évaluations"
      stats={[
        { label: "Examens", value: allExams.length, accent: "ink" },
        { label: "Ouverts", value: openExams.length, accent: "cama" },
        { label: "Notes", value: gradedAttempts.length, accent: "green" },
        { label: "Moyenne /20", value: avgScore ?? "—", accent: "gold" },
        { label: "Meilleure /20", value: bestScore ?? "—", accent: "gold" },
        { label: "Alertes", value: totalAlerts, accent: totalAlerts ? "ink" : "green" },
      ]}
    >
      {fetching ? (
        <div className="py-32 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
      ) : (
        <div className="flex gap-4">
          {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
          <aside className="w-[280px] flex-shrink-0 space-y-3 sticky top-16 self-start hidden lg:block">
            {/* Stats card */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3">Statistiques examens</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface border border-border p-2.5">
                  <p className="text-[18px] font-black text-ink">{allExams.length}</p>
                  <p className="text-[9px] text-muted uppercase tracking-wide">Total examens</p>
                </div>
                <div className="bg-surface border border-border p-2.5">
                  <p className="text-[18px] font-black text-green-700">{gradedAttempts.length}</p>
                  <p className="text-[9px] text-muted uppercase tracking-wide">Notes</p>
                </div>
                <div className="bg-surface border border-border p-2.5">
                  <p className="text-[18px] font-black text-cama">{avgScore ?? "—"}</p>
                  <p className="text-[9px] text-muted uppercase tracking-wide">Moyenne /20</p>
                </div>
                <div className="bg-surface border border-border p-2.5">
                  <p className="text-[18px] font-black text-gold-dark">{bestScore ?? "—"}</p>
                  <p className="text-[9px] text-muted uppercase tracking-wide">Meilleure</p>
                </div>
              </div>
            </div>

            {/* Course list */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3">Mes matieres</p>
              <div className="space-y-1">
                {courses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 px-2 bg-surface border border-border">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-ink truncate">{c.code}</p>
                      <p className="text-[9px] text-muted truncate">{c.title}</p>
                    </div>
                    <span className="text-[9px] font-bold text-cama bg-cama-50 px-1.5 py-0.5 flex-shrink-0">
                      {courseExamCounts[c.id] ?? 0}
                    </span>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-[10px] text-muted italic">Aucune matiere inscrite</p>
                )}
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filtrer
              </p>
              <div className="flex flex-col gap-1">
                {([["all", "Tous les examens"], ["open", "Ouverts uniquement"], ["done", "Termines"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setFilter(key)}
                    className={`text-left text-[10px] px-2 py-1.5 border transition-colors ${filter === key ? "bg-cama text-white border-cama font-bold" : "bg-surface border-border text-ink hover:bg-cama-50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Safe-CAMA badge */}
            <div className={`border p-4 ${totalAlerts === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`w-4 h-4 ${totalAlerts === 0 ? "text-green-700" : "text-amber-700"}`} />
                <p className="text-[9px] font-black uppercase tracking-widest text-ink">Safe-CAMA</p>
              </div>
              {totalAlerts === 0 ? (
                <p className="text-[10px] text-green-800">Integrite exemplaire — 0 alerte enregistree. Dossier propre.</p>
              ) : (
                <p className="text-[10px] text-amber-800">{totalAlerts} alerte{totalAlerts > 1 ? "s" : ""} enregistree{totalAlerts > 1 ? "s" : ""}. Consultez vos resultats pour plus de details.</p>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2">Acces rapide</p>
              <div className="space-y-1">
                <Link href="/dashboard" className="flex items-center gap-2 text-[10px] text-cama hover:underline py-1">
                  <ChevronRight className="w-3 h-3" /> Tableau de bord
                </Link>
                <Link href="/etudiant/programme" className="flex items-center gap-2 text-[10px] text-cama hover:underline py-1">
                  <ChevronRight className="w-3 h-3" /> Mon programme
                </Link>
              </div>
            </div>
          </aside>

          {/* ═══════════════ MAIN CONTENT ═══════════════ */}
          <main className="flex-1 min-w-0 space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-cama-50 flex items-center justify-center"><Target className="w-3.5 h-3.5 text-cama" /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">Ouverts</p>
                </div>
                <p className="text-[22px] font-black text-cama">{openExams.length}</p>
                <p className="text-[9px] text-muted">examens disponibles</p>
              </div>
              <div className="bg-white border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-green-50 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-green-700" /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">Notes</p>
                </div>
                <p className="text-[22px] font-black text-green-700">{gradedAttempts.length}</p>
                <p className="text-[9px] text-muted">examens corriges</p>
              </div>
              <div className="bg-white border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-cama-50 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-cama" /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">Moyenne</p>
                </div>
                <p className="text-[22px] font-black text-ink">{avgScore ?? "—"}<span className="text-[11px] text-muted font-normal">/20</span></p>
                <p className="text-[9px] text-muted">score moyen</p>
              </div>
              <div className="bg-white border border-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-amber-50 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-amber-700" /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">En attente</p>
                </div>
                <p className="text-[22px] font-black text-amber-700">{completedAttempts.filter((a) => a.status === "soumis").length + inProgressAttempts.length}</p>
                <p className="text-[9px] text-muted">soumis ou en cours</p>
              </div>
            </div>

            {/* ── Examens ouverts ── */}
            <section className="bg-white border border-border">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-cama" /> Examens ouverts
                </p>
                <span className="text-[9px] font-bold text-white bg-cama px-2 py-0.5">{openExams.length}</span>
              </div>
              {openExams.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <FileQuestion className="w-6 h-6 text-muted mx-auto mb-2" />
                  <p className="text-[11px] font-bold text-ink">Aucun examen ouvert</p>
                  <p className="text-[10px] text-muted">Les examens ouverts par vos enseignants apparaitront ici.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {openExams.map((e) => {
                    const c = courseById.get(e.program_course_id);
                    const atts = attemptsByExam.get(e.id) ?? [];
                    const s1 = atts.find((a) => (a.session ?? 1) === 1);
                    const s2 = atts.find((a) => (a.session ?? 1) === 2);
                    const att = s2 ?? s1;
                    const qInfo = questionCounts[e.id];
                    const done = att && att.status !== "encours";
                    const n = att ? note20(att) : null;
                    const canResit = e.resit_open && s1 && s1.status !== "encours" && !s2;
                    return (
                      <div key={e.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-cama-50 flex items-center justify-center flex-shrink-0">
                          <FileQuestion className="w-5 h-5 text-cama" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-ink truncate">{e.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                            {c && <span className="font-bold text-cama">{c.code}</span>}
                            {c && <span className="truncate">{c.title}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[9px] text-subtle">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.duration_min} min</span>
                            {qInfo && <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> {qInfo.total} question{qInfo.total > 1 ? "s" : ""}</span>}
                            {e.scheduled_at && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateTime(e.scheduled_at)}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {done ? (
                            <div className="text-right space-y-1">
                              {att.status === "corrige" && n !== null ? (
                                <span className="flex items-center gap-1 text-sm font-black text-green-700"><Award className="w-4 h-4" />{n}/20{s2 && <span className="text-[9px] font-bold text-gold-dark ml-1">S2</span>}</span>
                              ) : att.status === "soumis" ? (
                                <span className="text-[10px] font-bold text-gold-dark bg-gold/10 px-2 py-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Soumis{s2 ? " · S2" : ""}</span>
                              ) : null}
                              {canResit && (
                                <Link href={`/examen/${e.id}`}
                                  className="flex items-center gap-1.5 text-[10px] font-black bg-gold text-white px-3 py-1.5 hover:bg-gold-dark transition-colors uppercase tracking-wider">
                                  <Play className="w-3 h-3" /> Rattrapage
                                </Link>
                              )}
                            </div>
                          ) : (
                            <Link href={`/examen/${e.id}`}
                              className="flex items-center gap-1.5 text-[10px] font-black bg-cama text-white px-4 py-2 hover:bg-cama-700 transition-colors uppercase tracking-wider">
                              <Play className="w-3 h-3" /> {att ? "Reprendre" : "Passer l'examen"}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Resultats recents ── */}
            {recentResults.length > 0 && (
              <section className="bg-white border border-border">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-[9px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-gold-dark" /> Resultats recents
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {recentResults.map((att) => {
                    const exam = allExams.find((e) => e.id === att.exam_id);
                    const c = exam ? courseById.get(exam.program_course_id) : null;
                    const n = note20(att);
                    return (
                      <div key={att.id} className="px-4 py-3 flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${att.status === "corrige" ? "bg-green-50" : "bg-amber-50"}`}>
                          {att.status === "corrige" ? <Award className="w-4 h-4 text-green-700" /> : <Clock className="w-4 h-4 text-amber-700" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-ink truncate">{exam?.title ?? "Examen"}</p>
                          <p className="text-[9px] text-muted">{c?.code} — {att.submitted_at ? formatDate(att.submitted_at) : "—"}</p>
                          <p className="text-[9px] text-subtle mt-0.5">{statusLabel(att, att.exam_id)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {n !== null && (
                            <p className={`text-sm font-black ${n >= 10 ? "text-green-700" : "text-red-700"}`}>{n}/20</p>
                          )}
                          {att.alerts && att.alerts.length > 0 && (
                            <p className="text-[9px] text-amber-700 flex items-center gap-0.5 justify-end mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> {att.alerts.length} alerte{att.alerts.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Historique complet ── */}
            <section className="bg-white border border-border">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-muted" /> Historique complet
                </p>
                <span className="text-[9px] text-muted">{filteredExams.length} examen{filteredExams.length > 1 ? "s" : ""}</span>
              </div>
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_60px_60px_120px_100px] px-4 py-2 border-b border-border bg-surface text-[9px] font-black uppercase tracking-widest text-muted">
                <span>Examen</span>
                <span>Matiere</span>
                <span>Duree</span>
                <span>Quest.</span>
                <span>Statut</span>
                <span className="text-right">Note</span>
              </div>
              {filteredExams.length === 0 ? (
                <div className="px-4 py-6 text-center text-[10px] text-muted">Aucun examen dans cette categorie.</div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredExams.map((e) => {
                    const c = courseById.get(e.program_course_id);
                    const atts = attemptsByExam.get(e.id) ?? [];
                    const att = attemptByExam.get(e.id);
                    const n = att ? note20(att) : null;
                    const qInfo = questionCounts[e.id];
                    const noted = atts.filter((a) => note20(a) !== null);
                    const retained = noted.length > 1 ? effectiveScore(atts, e.resit_rule ?? "best") : null;
                    return (
                      <div key={e.id} className="px-4 py-2.5 sm:grid sm:grid-cols-[1fr_80px_60px_60px_120px_100px] sm:items-center flex flex-col gap-1">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-ink truncate">{e.title}</p>
                          <p className="text-[9px] text-muted sm:hidden">{c?.code} — {e.duration_min}min — {qInfo?.total ?? "?"} q.</p>
                        </div>
                        <span className="text-[10px] font-bold text-cama hidden sm:block">{c?.code ?? "—"}</span>
                        <span className="text-[10px] text-ink hidden sm:block">{e.duration_min}min</span>
                        <span className="text-[10px] text-ink hidden sm:block">{qInfo?.total ?? "—"}</span>
                        <div>
                          {e.status === "ouvert" && !att && (
                            <span className="text-[9px] font-bold text-white bg-cama px-1.5 py-0.5 inline-block">OUVERT</span>
                          )}
                          {e.status === "ouvert" && att?.status === "encours" && (
                            <Link href={`/examen/${e.id}`} className="text-[9px] font-bold text-cama hover:underline">En cours — reprendre</Link>
                          )}
                          {e.status === "planifie" && (
                            <span className="text-[9px] text-muted">Planifie{e.scheduled_at ? ` — ${formatDate(e.scheduled_at)}` : ""}</span>
                          )}
                          {e.status === "termine" && !att && (
                            <span className="text-[9px] text-muted">Termine — non passe</span>
                          )}
                          {att?.status === "soumis" && (
                            <span className="text-[9px] font-bold text-gold-dark">Soumis</span>
                          )}
                          {att?.status === "corrige" && (
                            <span className="text-[9px] font-bold text-green-700">Corrige</span>
                          )}
                        </div>
                        <div className="text-right">
                          {retained !== null && retained !== undefined ? (
                            <div>
                              <span className={`text-xs font-black ${retained >= 10 ? "text-green-700" : "text-red-700"}`}>{retained}/20</span>
                              <p className="text-[8px] text-muted">retenue · S1 {note20(atts[0]) ?? "—"} / S2 {note20(atts[1]) ?? "—"}</p>
                            </div>
                          ) : n !== null ? (
                            <span className={`text-xs font-black ${n >= 10 ? "text-green-700" : "text-red-700"}`}>{n}/20{(att?.session ?? 1) > 1 ? <span className="text-[8px] text-gold-dark ml-1">S2</span> : null}</span>
                          ) : att?.status === "soumis" ? (
                            <span className="text-[9px] text-muted italic">En correction</span>
                          ) : (
                            <span className="text-[9px] text-muted">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>

          {/* ═══════════════ RIGHT SIDEBAR ═══════════════ */}
          <aside className="w-[250px] flex-shrink-0 space-y-3 sticky top-16 self-start hidden xl:block">
            {/* Prochain examen */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1">
                <Timer className="w-3 h-3" /> Prochain examen
              </p>
              {nextExam ? (
                <div>
                  <p className="text-xs font-bold text-ink">{nextExam.title}</p>
                  <p className="text-[10px] text-muted mt-1">{courseById.get(nextExam.program_course_id)?.code}</p>
                  <p className="text-[10px] text-muted">{formatDateTime(nextExam.scheduled_at!)}</p>
                  <div className="mt-2 bg-cama-50 border border-cama/20 p-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-cama">Compte a rebours</p>
                    <p className="text-lg font-black text-cama">{countdown(nextExam.scheduled_at!)}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-surface border border-border p-3 text-center">
                  <Calendar className="w-5 h-5 text-muted mx-auto mb-1" />
                  <p className="text-[10px] text-muted">Aucun examen planifie</p>
                </div>
              )}
            </div>

            {/* Timeline / Calendar */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Calendrier
              </p>
              <div className="space-y-1.5">
                {allExams
                  .filter((e) => e.scheduled_at)
                  .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
                  .slice(0, 6)
                  .map((e) => {
                    const c = courseById.get(e.program_course_id);
                    const isPast = new Date(e.scheduled_at!).getTime() < Date.now();
                    return (
                      <div key={e.id} className={`flex items-start gap-2 py-1 ${isPast ? "opacity-50" : ""}`}>
                        <div className={`w-1.5 h-1.5 mt-1 flex-shrink-0 ${e.status === "ouvert" ? "bg-cama" : e.status === "termine" ? "bg-muted" : "bg-amber-500"}`} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-ink truncate">{e.title}</p>
                          <p className="text-[9px] text-muted">{c?.code} — {formatDate(e.scheduled_at!)}</p>
                        </div>
                      </div>
                    );
                  })}
                {allExams.filter((e) => e.scheduled_at).length === 0 && (
                  <p className="text-[10px] text-muted italic">Aucune date programmee</p>
                )}
              </div>
            </div>

            {/* Grade distribution */}
            {gradedAttempts.length > 0 && (
              <div className="bg-white border border-border p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Distribution des notes
                </p>
                <div className="flex items-end gap-1 h-16">
                  {scoreDistribution.map((count, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className={`w-full ${i < 2 ? "bg-red-400" : i === 2 ? "bg-amber-400" : "bg-green-500"}`}
                        style={{ height: `${(count / maxBucket) * 100}%`, minHeight: count > 0 ? 4 : 1 }}
                      />
                      <span className="text-[8px] text-muted">{i * 4}-{(i + 1) * 4}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] text-muted text-center mt-1">/20</p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-white border border-border p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Regles Safe-CAMA
              </p>
              <ul className="space-y-1.5 text-[10px] text-ink leading-tight">
                <li className="flex items-start gap-1.5">
                  <Shield className="w-3 h-3 text-cama flex-shrink-0 mt-0.5" />
                  Restez sur l'onglet de l'examen pendant toute la duree.
                </li>
                <li className="flex items-start gap-1.5">
                  <Shield className="w-3 h-3 text-cama flex-shrink-0 mt-0.5" />
                  Tout changement d'onglet est enregistre comme alerte.
                </li>
                <li className="flex items-start gap-1.5">
                  <Shield className="w-3 h-3 text-cama flex-shrink-0 mt-0.5" />
                  Le copier-coller est desactive pendant l'examen.
                </li>
                <li className="flex items-start gap-1.5">
                  <Shield className="w-3 h-3 text-cama flex-shrink-0 mt-0.5" />
                  Soumettez avant la fin du temps imparti.
                </li>
              </ul>
            </div>

            {/* Exam tips */}
            <div className="bg-cama-50 border border-cama/20 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-cama mb-2">Conseils</p>
              <ul className="space-y-1 text-[10px] text-ink leading-tight">
                <li>Lisez toutes les questions avant de commencer.</li>
                <li>Gerez votre temps : n'y passez pas trop sur une question.</li>
                <li>Relisez vos reponses avant de soumettre.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </PageShell>
  );
}
