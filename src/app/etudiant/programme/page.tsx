"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, GraduationCap, CheckCircle2, Circle, BookOpen,
  CalendarClock, TrendingUp, ChevronDown, ChevronRight, Bot,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { DBProgramCourse, DBChapter, DBSession, DBChapterProgress, CycleMode } from "@/lib/supabase";
import {
  fetchStudentProgram, fetchProgress, markChapter, fetchChapters, fetchSessions,
} from "@/lib/program";
import { degreeProgress, fetchLedger, type DBEctsEntry } from "@/lib/academic";

const JOUR_ORDER = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function StudentProgramPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses]     = useState<DBProgramCourse[]>([]);
  const [progress, setProgress]   = useState<DBChapterProgress[]>([]);
  const [sessions, setSessions]   = useState<DBSession[]>([]);
  const [chaptersByCourse, setCh] = useState<Record<string, DBChapter[]>>({});
  const [fetching, setFetching]   = useState(true);
  const [open, setOpen]           = useState<Record<string, boolean>>({});
  const [degree, setDegree]       = useState<{ earned: number; target: number; pct: number } | null>(null);
  const [ledger, setLedger]       = useState<DBEctsEntry[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    degreeProgress(user.id).then(setDegree).catch(() => {});
    fetchLedger(user.id).then(setLedger).catch(() => {});
    const slug = user.dossier?.parcoursSlug;
    if (!slug) { setFetching(false); return; }
    (async () => {
      const [cs, prog] = await Promise.all([fetchStudentProgram(slug, user.dossier?.level), fetchProgress(user.id)]);
      setCourses(cs);
      setProgress(prog);
      setSessions(await fetchSessions(cs.map((c) => c.id)));
      // Charge les chapitres de chaque matière
      const map: Record<string, DBChapter[]> = {};
      await Promise.all(cs.map(async (c) => { map[c.id] = await fetchChapters(c.id); }));
      setCh(map);
      setFetching(false);
    })();
  }, [user]);

  const doneIds = useMemo(() => new Set(progress.map((p) => p.chapter_id)), [progress]);

  const toggleChapter = async (chapterId: string) => {
    if (!user) return;
    const done = !doneIds.has(chapterId);
    setProgress((p) => done
      ? [...p, { student_id: user.id, chapter_id: chapterId, done_at: new Date().toISOString() }]
      : p.filter((x) => x.chapter_id !== chapterId));
    await markChapter(user.id, chapterId, done);
  };

  // Stats globales
  const allChapters = useMemo(() => Object.values(chaptersByCourse).flat(), [chaptersByCourse]);
  const pct = allChapters.length ? Math.round((doneIds.size / allChapters.length) * 100) : 0;

  // Groupe par semestre
  const bySem = useMemo(() => {
    const m: Record<string, DBProgramCourse[]> = {};
    courses.forEach((c) => { (m[c.semestre] ??= []).push(c); });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b));
  }, [courses]);

  // Mode d'inscription de l'étudiant (présentiel / hybride / en ligne)
  const studentMode = (user?.dossier?.mode ?? "hybride") as CycleMode;

  // Cours de la semaine — séances validées qui concernent le mode de l'étudiant
  const weekSessions = useMemo(() => {
    const courseById = new Map(courses.map((c) => [c.id, c]));
    return sessions
      .filter((s) => s.status === "valide" && (s.modes?.includes(studentMode) ?? false))
      .map((s) => ({ ...s, course: courseById.get(s.program_course_id) }))
      .sort((a, b) => JOUR_ORDER.indexOf(a.day ?? "") - JOUR_ORDER.indexOf(b.day ?? ""));
  }, [sessions, courses, studentMode]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const d = user.dossier;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-cama" /> Mon programme
          </span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5">

        {!d ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center">
            <GraduationCap className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink mb-1">Aucun dossier d&apos;inscription</p>
            <p className="text-xs text-muted">Votre programme apparaîtra ici une fois votre inscription enregistrée.</p>
          </div>
        ) : (
          <>
            {/* Jauge crédits ECTS vers le diplôme */}
            {degree && (
              <div className="bg-white border border-border rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <p className="text-[11px] font-black text-ink uppercase tracking-widest">
                    Crédits ECTS : {degree.earned} / {degree.target}
                  </p>
                  <span className="text-xs font-bold text-cama">{degree.pct}% du diplôme</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-cama transition-all" style={{ width: `${degree.pct}%` }} />
                </div>
                {ledger.some((e) => e.obtained && e.semester != null) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(
                      ledger.filter((e) => e.obtained && e.semester != null)
                        .reduce<Record<string, number>>((m, e) => {
                          const k = `S${e.semester}${e.academic_year ? ` · ${e.academic_year}` : ""}`;
                          m[k] = (m[k] ?? 0) + e.ects;
                          return m;
                        }, {}),
                    ).map(([k, v]) => (
                      <span key={k} className="text-[10px] font-bold text-muted border border-border px-1.5 py-0.5">
                        {k} : {v} ECTS
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bandeau filière + progression */}
            <div className="bg-white border border-border rounded-xl p-4 mb-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="text-base font-bold text-ink">{d.cycleType} {d.parcoursTitle}</p>
                <p className="text-[11px] text-muted">{d.school} · {d.level} · mode {d.modeLabel} · {d.academicYear} · S{d.semester}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-black text-cama leading-none">{pct}%</p>
                  <p className="text-[10px] text-muted mt-1">{doneIds.size}/{allChapters.length} chapitres</p>
                </div>
                <TrendingUp className="w-6 h-6 text-cama" />
              </div>
            </div>

            {fetching ? (
              <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
            ) : (
              <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

                {/* Programme par semestre */}
                <div className="space-y-5">
                  {bySem.length === 0 ? (
                    <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">
                      Aucun cours publié pour votre filière pour le moment.
                    </div>
                  ) : bySem.map(([sem, list]) => (
                    <section key={sem}>
                      <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2">
                        {sem} — Semestre {sem.replace("S", "")}
                      </h2>
                      <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
                        {list.map((c) => {
                          const chs = chaptersByCourse[c.id] ?? [];
                          const done = chs.filter((ch) => doneIds.has(ch.id)).length;
                          const cpct = chs.length ? Math.round((done / chs.length) * 100) : 0;
                          return (
                            <div key={c.id}>
                              <button onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}
                                className="w-full flex items-center gap-3 p-3 hover:bg-surface/60 transition-colors text-left">
                                {open[c.id] ? <ChevronDown className="w-4 h-4 text-subtle" /> : <ChevronRight className="w-4 h-4 text-subtle" />}
                                <div className="w-8 h-8 bg-cama-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <BookOpen className="w-4 h-4 text-cama" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                                    {c.code} · {c.title}
                                    {c.prof_ia && <Bot className="w-3.5 h-3.5 text-cama" />}
                                  </p>
                                  <p className="text-[11px] text-muted">{c.ects} ECTS · {c.hours}h · {done}/{chs.length} chapitres</p>
                                </div>
                                <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden flex-shrink-0">
                                  <div className="h-full bg-cama" style={{ width: `${cpct}%` }} />
                                </div>
                                <span className="text-xs font-bold text-cama w-9 text-right">{cpct}%</span>
                              </button>

                              {open[c.id] && (
                                <div className="px-10 pb-3 bg-surface/30 border-t border-border">
                                  {c.description && <p className="text-[11px] text-muted py-2">{c.description}</p>}
                                  {chs.length === 0 ? (
                                    <p className="text-[11px] text-muted italic py-2">Pas encore de chapitres publiés.</p>
                                  ) : (
                                    <div className="space-y-1 py-2">
                                      {chs.map((ch, i) => {
                                        const isDone = doneIds.has(ch.id);
                                        return (
                                          <button key={ch.id} onClick={() => toggleChapter(ch.id)}
                                            className="w-full flex items-center gap-2.5 text-left p-2 rounded-lg hover:bg-white transition-colors group">
                                            {isDone
                                              ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                              : <Circle className="w-4 h-4 text-subtle group-hover:text-cama flex-shrink-0" />}
                                            <span className="text-[10px] font-bold text-subtle w-4">{i + 1}</span>
                                            <span className={`text-xs flex-1 ${isDone ? "text-muted line-through" : "text-ink"}`}>{ch.title}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>

                {/* Cette semaine */}
                <aside className="bg-white border border-border rounded-xl p-4 lg:sticky lg:top-16">
                  <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-cama" /> Cette semaine
                  </h2>
                  <p className="text-[10px] text-muted mb-3">Séances de votre mode <span className="font-bold text-cama">{d.modeLabel}</span></p>
                  {weekSessions.length === 0 ? (
                    <p className="text-[11px] text-muted italic">Aucune séance planifiée pour le mode {d.modeLabel.toLowerCase()}.</p>
                  ) : (
                    <div className="space-y-2">
                      {weekSessions.map((s) => (
                        <div key={s.id} className="flex items-start gap-2">
                          <div className="w-1 h-full min-h-[36px] rounded-full bg-cama flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-ink">{s.course?.code ?? "Cours"} · {s.day}</p>
                            <p className="text-[10px] text-muted">{s.start_time}–{s.end_time} · {s.kind}{s.room && ` · ${s.room}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </aside>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
