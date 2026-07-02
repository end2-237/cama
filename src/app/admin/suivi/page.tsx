"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, ClipboardCheck, Star, Users, AlertTriangle,
  TrendingUp, Radio, UserX, GraduationCap, Save, BookOpen, Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { DBUser, DBChapter, DBLiveAttendance, DBCahierEntry, DBProgramCourse } from "@/lib/supabase";
import {
  fetchAllFeedback, fetchTeacherReviews, addTeacherReview, averageRating,
  teacherName, computeStudentProgression,
  type DBCourseFeedback, type DBTeacherReview, type DBNativeProgress, type CycleMode,
} from "@/lib/tracking";
import { fetchCahierForCourses, computeProgress } from "@/lib/cahier";
import { fetchLivesForCourses, fetchAttendanceForLives, autoStatus, type DBLive } from "@/lib/lives";
import { fetchUsers, fetchInscriptions, type InscriptionWithUser } from "@/lib/admin";
import { fetchProgram } from "@/lib/program";

const MODE_BADGE: Record<CycleMode, string> = {
  online:     "bg-indigo-50 text-indigo-700 border-indigo-200",
  hybride:    "bg-amber-50 text-amber-700 border-amber-200",
  presentiel: "bg-green-50 text-green-700 border-green-200",
};
const MODE_LABEL: Record<CycleMode, string> = {
  online: "En ligne", hybride: "Hybride", presentiel: "Présentiel",
};

const barColor = (pct: number) =>
  pct < 50 ? "bg-red-500" : pct < 80 ? "bg-amber-500" : "bg-green-500";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(value) ? "text-gold-dark fill-current" : "text-border"}`} />
      ))}
    </span>
  );
}

export default function AdminSuiviPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [fetching, setFetching]         = useState(true);
  const [users, setUsers]               = useState<DBUser[]>([]);
  const [courses, setCourses]           = useState<DBProgramCourse[]>([]);
  const [chapters, setChapters]         = useState<DBChapter[]>([]);
  const [cahier, setCahier]             = useState<DBCahierEntry[]>([]);
  const [lives, setLives]               = useState<DBLive[]>([]);
  const [attendance, setAttendance]     = useState<DBLiveAttendance[]>([]);
  const [feedback, setFeedback]         = useState<DBCourseFeedback[]>([]);
  const [reviews, setReviews]           = useState<DBTeacherReview[]>([]);
  const [inscriptions, setInscriptions] = useState<InscriptionWithUser[]>([]);
  const [natifRows, setNatifRows]       = useState<DBNativeProgress[]>([]);
  const [reviewDraft, setReviewDraft]   = useState<Record<string, { score: number; comment: string }>>({});
  const [savingReview, setSavingReview] = useState<string | null>(null);
  const [studentLimit, setStudentLimit] = useState(50);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    setFetching(true);
    const [us, cs, fb, rv, ins, natif] = await Promise.all([
      fetchUsers(),
      fetchProgram(),
      fetchAllFeedback(),
      fetchTeacherReviews(),
      fetchInscriptions(),
      supabase.from("native_progress").select("*").then(({ data }) => (data as DBNativeProgress[]) ?? []),
    ]);
    const ids = cs.map((c) => c.id);
    const [chs, ce, lv] = await Promise.all([
      ids.length
        ? supabase.from("course_chapters").select("*").in("program_course_id", ids)
            .then(({ data }) => (data as DBChapter[]) ?? [])
        : Promise.resolve([] as DBChapter[]),
      fetchCahierForCourses(ids),
      fetchLivesForCourses(ids),
    ]);
    const att = await fetchAttendanceForLives(lv.map((l) => l.id));
    setUsers(us); setCourses(cs); setFeedback(fb); setReviews(rv);
    setInscriptions(ins); setNatifRows(natif);
    setChapters(chs); setCahier(ce); setLives(lv); setAttendance(att);
    setFetching(false);
  }, []);

  useEffect(() => { if (user?.role === "admin") load(); }, [user, load]);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  // ── 1. Progression enseignants ──
  const teacherProgressRows = useMemo(() => {
    return courses
      .filter((c) => c.teacher_id)
      .map((c) => {
        const entries = cahier.filter((e) => e.program_course_id === c.id);
        const chs = chapters.filter((x) => x.program_course_id === c.id);
        const prog = computeProgress(c, entries, chs);
        const held = lives.filter((l) => l.program_course_id === c.id && l.started_at).length;
        return { course: c, prog, held };
      })
      .sort((a, b) => a.prog.pctHours - b.prog.pctHours);
  }, [courses, cahier, chapters, lives]);

  const teacherKpis = useMemo(() => {
    const trackedTeachers = new Set(courses.filter((c) => c.teacher_id).map((c) => c.teacher_id)).size;
    const late = teacherProgressRows.filter((r) => r.prog.pctHours < 50).length;
    const avg = teacherProgressRows.length
      ? Math.round(teacherProgressRows.reduce((a, r) => a + r.prog.pctHours, 0) / teacherProgressRows.length)
      : 0;
    return { trackedTeachers, late, avg };
  }, [courses, teacherProgressRows]);

  // ── 2. Qualité des enseignants ──
  const teacherIds = useMemo(
    () => Array.from(new Set(courses.map((c) => c.teacher_id).filter((t): t is string => !!t))),
    [courses],
  );

  const qualityByTeacher = useMemo(() => {
    return teacherIds.map((tid) => {
      const admin = reviews.filter((r) => r.teacher_id === tid);
      const teacherCourseIds = new Set(courses.filter((c) => c.teacher_id === tid).map((c) => c.id));
      const stud = feedback.filter((f) => teacherCourseIds.has(f.program_course_id));
      return {
        tid,
        adminAvg: averageRating(admin.map((r) => ({ rating: r.score }))),
        adminCount: admin.length,
        studAvg: averageRating(stud),
        studCount: stud.length,
        last: admin.slice(0, 3),
      };
    }).sort((a, b) => a.adminAvg - b.adminAvg);
  }, [teacherIds, reviews, courses, feedback]);

  const saveReview = async (tid: string) => {
    if (!user) return;
    const d = reviewDraft[tid] ?? { score: 3, comment: "" };
    setSavingReview(tid);
    await addTeacherReview({ teacher_id: tid, score: d.score, comment: d.comment.trim() || null, created_by: user.id });
    setReviews(await fetchTeacherReviews());
    setReviewDraft((r) => ({ ...r, [tid]: { score: 3, comment: "" } }));
    setSavingReview(null);
  };

  // ── 3. Présences automatiques ──
  const attendanceStats = useMemo(() => {
    const held = lives.filter((l) => l.started_at);
    const byLive = new Map<string, DBLiveAttendance[]>();
    attendance.forEach((a) => {
      const arr = byLive.get(a.live_id) ?? [];
      arr.push(a); byLive.set(a.live_id, arr);
    });
    const students = users.filter((u) => u.role === "etudiant");
    let presenceSum = 0; let presenceN = 0; let teacherAbsences = 0;
    const perLive = held.map((l) => {
      const course = l.program_course_id ? courseById.get(l.program_course_id) : undefined;
      const rows = byLive.get(l.id) ?? [];
      const rowByUser = new Map(rows.map((r) => [r.user_id, r]));
      if (!rows.some((r) => r.role === "enseignant" || r.role === "admin")) teacherAbsences++;
      let present = 0; let absent = 0;
      if (course) {
        students.forEach((s) => {
          const st = autoStatus(l, course, rowByUser.get(s.id));
          if (st === "absent") absent++; else present++;
        });
        if (students.length) { presenceSum += present / students.length; presenceN++; }
      }
      return { live: l, absent };
    });
    const top = [...perLive].sort((a, b) => b.absent - a.absent).slice(0, 5);
    return {
      held: held.length,
      avgPresence: presenceN ? Math.round((presenceSum / presenceN) * 100) : 0,
      teacherAbsences,
      top,
    };
  }, [lives, attendance, users, courseById]);

  // ── 4. Évolution des étudiants ──
  const studentRows = useMemo(() => {
    const natifByStudent = new Map<string, DBNativeProgress[]>();
    natifRows.forEach((r) => {
      const arr = natifByStudent.get(r.student_id) ?? [];
      arr.push(r); natifByStudent.set(r.student_id, arr);
    });
    const attByUser = new Map<string, DBLiveAttendance[]>();
    attendance.forEach((a) => {
      const arr = attByUser.get(a.user_id) ?? [];
      arr.push(a); attByUser.set(a.user_id, arr);
    });
    return inscriptions.map((ins) => {
      const u = userMap.get(ins.user_id);
      const name = ins.user ? `${ins.user.first_name} ${ins.user.last_name}` : (u ? `${u.first_name} ${u.last_name}` : "—");
      const myCourses = courses.filter((c) => c.parcours_slug === ins.parcours_slug && c.annee_niveau === ins.level);
      const myCourseIds = new Set(myCourses.map((c) => c.id));
      const myChapters = chapters.filter((ch) => myCourseIds.has(ch.program_course_id) && ch.natif);
      const chapterIds = new Set(myChapters.map((ch) => ch.id));
      const myNatif = (natifByStudent.get(ins.user_id) ?? []).filter((r) => chapterIds.has(r.chapter_id));
      const myLives = lives.filter((l) => l.program_course_id && myCourseIds.has(l.program_course_id));
      const prog = computeStudentProgression(
        ins.mode, myNatif, myChapters.length, myLives,
        attByUser.get(ins.user_id) ?? [], courseById,
      );
      return { ins, name, prog };
    });
  }, [inscriptions, userMap, courses, chapters, natifRows, lives, attendance, courseById]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const KPIS = [
    { icon: Users,        label: "Enseignants suivis",    value: teacherKpis.trackedTeachers, color: "text-cama" },
    { icon: AlertTriangle,label: "Cours en retard (<50%)",value: teacherKpis.late,            color: "text-red-500" },
    { icon: TrendingUp,   label: "Moyenne d'avancement",  value: `${teacherKpis.avg}%`,       color: "text-green-600" },
    { icon: Radio,        label: "Lives tenus",           value: attendanceStats.held,        color: "text-purple-600" },
    { icon: GraduationCap,label: "Étudiants inscrits",    value: inscriptions.length,         color: "text-gold-dark" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-cama" /> Suivi &amp; Qualité
          </span>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5">
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : (
        <div className="space-y-8">

          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {KPIS.map((k) => (
              <div key={k.label} className="bg-white p-3 text-center">
                <k.icon className={`w-4 h-4 mx-auto mb-1 ${k.color}`} />
                <p className={`text-lg font-bold leading-none ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-muted mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* 1 — Progression des enseignants */}
          <section>
            <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cama" /> Progression des enseignants dans le programme
            </h2>
            {teacherProgressRows.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-6 text-center text-xs text-muted">
                Aucune matière affectée à un enseignant.
              </div>
            ) : (
              <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
                {teacherProgressRows.map(({ course: c, prog, held }) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-sm font-bold text-ink">{c.code} · {c.title}</p>
                      <p className="text-[11px] text-muted">
                        {teacherName(c.teacher_id, userMap)} · {prog.entries} séance(s) consignée(s) ·
                        {" "}{prog.chaptersWithContent}/{prog.chaptersTotal} chapitre(s) avec contenu · {held} live(s) tenu(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 min-w-[220px]">
                      <div className="flex-1 h-2 rounded-full bg-surface border border-border overflow-hidden">
                        <div className={`h-full ${barColor(prog.pctHours)}`} style={{ width: `${prog.pctHours}%` }} />
                      </div>
                      <span className="text-xs font-bold text-ink w-20 text-right">
                        {prog.hoursDone}h / {prog.hoursPlanned}h
                      </span>
                      <span className={`text-xs font-black w-10 text-right ${
                        prog.pctHours < 50 ? "text-red-500" : prog.pctHours < 80 ? "text-amber-600" : "text-green-600"}`}>
                        {prog.pctHours}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 2 — Qualité des enseignants */}
          <section>
            <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-gold-dark" /> Qualité des enseignants
            </h2>
            {qualityByTeacher.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-6 text-center text-xs text-muted">
                Aucun enseignant affecté à une matière.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {qualityByTeacher.map((q) => {
                  const draft = reviewDraft[q.tid] ?? { score: 3, comment: "" };
                  return (
                    <div key={q.tid} className="bg-white border border-border rounded-xl p-4">
                      <p className="text-sm font-bold text-ink mb-2">{teacherName(q.tid, userMap)}</p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="border border-border rounded-lg p-2">
                          <p className="text-[10px] text-muted mb-1">Évaluation admin</p>
                          <div className="flex items-center gap-1.5">
                            <Stars value={q.adminAvg} />
                            <span className="text-xs font-bold text-ink">{q.adminAvg || "—"}</span>
                            <span className="text-[10px] text-muted">({q.adminCount})</span>
                          </div>
                        </div>
                        <div className="border border-border rounded-lg p-2">
                          <p className="text-[10px] text-muted mb-1">Retours étudiants</p>
                          <div className="flex items-center gap-1.5">
                            <Stars value={q.studAvg} />
                            <span className="text-xs font-bold text-ink">{q.studAvg || "—"}</span>
                            <span className="text-[10px] text-muted">({q.studCount})</span>
                          </div>
                        </div>
                      </div>
                      {q.last.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {q.last.map((r) => (
                            <p key={r.id} className="text-[11px] text-muted">
                              <span className="font-bold text-ink">{r.score}/5</span>
                              {" "}· {new Date(r.created_at).toLocaleDateString("fr-FR")}
                              {r.comment && <> — {r.comment}</>}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <select value={draft.score}
                          onChange={(e) => setReviewDraft((d) => ({ ...d, [q.tid]: { ...draft, score: parseInt(e.target.value) } }))}
                          className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-cama">
                          {[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s}/5</option>)}
                        </select>
                        <input value={draft.comment}
                          onChange={(e) => setReviewDraft((d) => ({ ...d, [q.tid]: { ...draft, comment: e.target.value } }))}
                          placeholder="Commentaire…"
                          className="flex-1 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cama" />
                        <button onClick={() => saveReview(q.tid)} disabled={savingReview === q.tid}
                          className="flex items-center gap-1 text-xs font-bold bg-cama text-white px-3 py-1.5 rounded-lg hover:bg-cama-700 disabled:opacity-60 transition-colors">
                          {savingReview === q.tid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Évaluer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3 — Présences automatiques */}
          <section>
            <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-600" /> Présences automatiques (vue générale)
            </h2>
            <div className="grid grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden mb-3">
              <div className="bg-white p-3 text-center">
                <p className="text-lg font-bold text-ink leading-none">{attendanceStats.held}</p>
                <p className="text-[10px] text-muted mt-1">Lives tenus</p>
              </div>
              <div className="bg-white p-3 text-center">
                <p className="text-lg font-bold text-green-600 leading-none">{attendanceStats.avgPresence}%</p>
                <p className="text-[10px] text-muted mt-1">Présence moyenne étudiante</p>
              </div>
              <div className="bg-white p-3 text-center">
                <p className={`text-lg font-bold leading-none ${attendanceStats.teacherAbsences ? "text-red-500" : "text-ink"}`}>
                  {attendanceStats.teacherAbsences}
                </p>
                <p className="text-[10px] text-muted mt-1">Absences enseignant</p>
              </div>
            </div>
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <p className="text-[10px] font-black text-subtle uppercase tracking-widest px-3 pt-3 pb-1 flex items-center gap-1.5">
                <UserX className="w-3 h-3" /> Top 5 des lives avec le plus d&apos;absents
              </p>
              {attendanceStats.top.length === 0 ? (
                <p className="text-xs text-muted italic px-3 pb-3">Aucun live tenu pour le moment.</p>
              ) : (
                <div className="divide-y divide-border">
                  {attendanceStats.top.map(({ live, absent }) => (
                    <div key={live.id} className="flex items-center gap-3 px-3 py-2">
                      <p className="flex-1 text-xs font-semibold text-ink truncate">{live.title}</p>
                      <p className="text-[11px] text-muted">
                        {live.started_at ? new Date(live.started_at).toLocaleDateString("fr-FR") : "—"}
                      </p>
                      <span className="text-xs font-bold text-red-500">{absent} absent(s)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 4 — Évolution des étudiants */}
          <section>
            <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-cama" /> Évolution des étudiants (par cycle)
            </h2>
            <div className="bg-white border border-border rounded-xl p-3 mb-3 text-[11px] text-muted space-y-1">
              <p><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" /><strong>Présentiel</strong> : non suivi sur la plateforme — consultation libre uniquement.</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1.5" /><strong>En ligne</strong> : progression = 100 % ancrage réel du cours natif (les scrolls rapides ne comptent pas).</p>
              <p><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" /><strong>Hybride</strong> : progression = 70 % présence aux cours live + 30 % ancrage du cours natif.</p>
            </div>
            {studentRows.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-6 text-center text-xs text-muted">
                Aucune inscription enregistrée.
              </div>
            ) : (
              <>
                <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {studentRows.slice(0, studentLimit).map(({ ins, name, prog }) => (
                    <div key={ins.id} className="flex flex-wrap items-center gap-3 p-3">
                      <div className="flex-1 min-w-[180px]">
                        <p className="text-sm font-bold text-ink">{name}</p>
                        <p className="text-[11px] text-muted">{ins.parcours_title} · {ins.level}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${MODE_BADGE[ins.mode]}`}>
                        {MODE_LABEL[ins.mode]}
                      </span>
                      {!prog.tracked ? (
                        <span className="flex items-center gap-1 text-[11px] text-muted italic">
                          <Eye className="w-3.5 h-3.5" /> Non suivi — consultation libre
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 min-w-[260px]">
                          <div className="flex-1 h-2 rounded-full bg-surface border border-border overflow-hidden">
                            <div className={`h-full ${barColor(prog.pct)}`} style={{ width: `${prog.pct}%` }} />
                          </div>
                          <span className="text-xs font-black text-ink w-9 text-right">{prog.pct}%</span>
                          <span className="text-[10px] text-muted whitespace-nowrap">
                            natif {prog.natifPct}%{ins.mode === "hybride" && <> · lives {prog.livePct}%</>}
                          </span>
                          {prog.fastScrolls > 10 && (
                            <span title="Lecture superficielle détectée (scrolls rapides)">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {studentRows.length > studentLimit && (
                  <button onClick={() => setStudentLimit((n) => n + 50)}
                    className="mt-3 mx-auto block text-xs font-bold text-cama hover:underline">
                    Afficher plus ({studentRows.length - studentLimit} restants)
                  </button>
                )}
              </>
            )}
          </section>
        </div>
        )}
      </main>
    </div>
  );
}
