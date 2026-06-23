"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Clock, ChevronRight, Play, ShieldCheck,
  CheckCircle2, TrendingUp, Star, Award, GraduationCap,
  Loader2, FileQuestion, Terminal,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchStudentProgram, fetchProgress, fetchChapters } from "@/lib/program";
import { fetchOpenExams, fetchAttemptsForStudent } from "@/lib/exams";
import type { DBProgramCourse, DBExam, DBExamAttempt, DBChapterProgress } from "@/lib/supabase";

export default function StudentView({ tab }: { tab: string }) {
  if (tab === "Examens") return <ExamsTab />;
  if (tab === "Résultats") return <ResultsTab />;
  return <CoursesTab />;
}

function CoursesTab() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [progress, setProgress] = useState<DBChapterProgress[]>([]);
  const [chapCounts, setChapCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const slug = user.dossier?.parcoursSlug;
    if (!slug) { setLoading(false); return; }
    (async () => {
      const cs = await fetchStudentProgram(slug);
      setCourses(cs);
      setProgress(await fetchProgress(user.id));
      const counts: Record<string, number> = {};
      for (const c of cs) {
        const chs = await fetchChapters(c.id);
        counts[c.id] = chs.length;
      }
      setChapCounts(counts);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
  );

  const totalChapters = Object.values(chapCounts).reduce((a, n) => a + n, 0);
  const doneChapters = progress.length;
  const avgPct = totalChapters ? Math.round((doneChapters / totalChapters) * 100) : 0;

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <BookOpen className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Mon tableau de bord</h1>
        <div className="flex-1" />
        <Link href="/tp"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white text-[11px] font-bold hover:bg-cama transition-colors rounded-lg">
          <Terminal className="w-3.5 h-3.5" /> TP &amp; Machines
        </Link>
      </div>

      {/* Dossier */}
      {user?.dossier && (
        <div className="bg-white border border-border rounded-xl p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cama flex items-center justify-center text-white font-bold">
              {user.initials}
            </div>
            <div>
              <p className="text-sm font-bold text-ink">{user.name}</p>
              <p className="text-[11px] text-muted">
                {user.dossier.parcoursTitle} · {user.dossier.level} · {user.dossier.matricule}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden mb-5">
        {[
          { icon: TrendingUp, label: "Progression", value: `${avgPct}%`, color: "text-cama" },
          { icon: CheckCircle2, label: "Chapitres validés", value: `${doneChapters}/${totalChapters}`, color: "text-green-600" },
          { icon: Star, label: "Cours actifs", value: courses.length, color: "text-gold-dark" },
        ].map((k) => (
          <div key={k.label} className="bg-white p-4 text-center">
            <k.icon className={`w-5 h-5 mx-auto mb-1 ${k.color}`} />
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-muted mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="grid lg:grid-cols-3 gap-3 mb-5">
        <Link href="/etudiant/programme"
          className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl hover:border-cama/40 transition-all">
          <BookOpen className="w-5 h-5 text-cama" />
          <span className="text-sm font-medium text-ink flex-1">Mon programme</span>
          <ChevronRight className="w-4 h-4 text-subtle" />
        </Link>
        <Link href="/etudiant/examens"
          className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl hover:border-cama/40 transition-all">
          <ShieldCheck className="w-5 h-5 text-gold-dark" />
          <span className="text-sm font-medium text-ink flex-1">Mes examens</span>
          <ChevronRight className="w-4 h-4 text-subtle" />
        </Link>
        <Link href="/tp"
          className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl hover:border-cama/40 transition-all">
          <Terminal className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-ink flex-1">TP &amp; Sandbox</span>
          <ChevronRight className="w-4 h-4 text-subtle" />
        </Link>
      </div>

      {/* Mes cours */}
      <h2 className="text-xs font-bold text-ink uppercase tracking-widest mb-2">Mes cours ({courses.length})</h2>
      {courses.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <BookOpen className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink mb-1">Aucun cours disponible</p>
          <p className="text-xs text-muted">Les cours publiés par vos enseignants apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
          {courses.map((c) => {
            const total = chapCounts[c.id] ?? 0;
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 hover:bg-cama-50/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cama-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-cama" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{c.title}</p>
                  <p className="text-[11px] text-muted">{c.code} · {c.ects} ECTS · {total} chapitre(s)</p>
                </div>
                <Link href="/etudiant/programme"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-cama text-white text-[10px] font-bold rounded-lg hover:bg-cama-700 transition-colors">
                  <Play className="w-3 h-3" /> Ouvrir
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExamsTab() {
  const { user } = useAuth();
  const [exams, setExams] = useState<DBExam[]>([]);
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const slug = user.dossier?.parcoursSlug;
    if (!slug) { setLoading(false); return; }
    (async () => {
      const cs = await fetchStudentProgram(slug);
      setCourses(cs);
      setExams(await fetchOpenExams(cs.map((c) => c.id)));
      setAttempts(await fetchAttemptsForStudent(user.id));
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
  );

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const attemptByExam = new Map(attempts.map((a) => [a.exam_id, a]));

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <ShieldCheck className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Mes Examens</h1>
        <div className="flex-1" />
        <Link href="/etudiant/examens" className="text-[11px] font-bold text-cama hover:underline">
          Page complète →
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <FileQuestion className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink mb-1">Aucun examen ouvert</p>
          <p className="text-xs text-muted">Les examens ouverts par vos enseignants apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => {
            const c = courseById.get(e.program_course_id);
            const att = attemptByExam.get(e.id);
            const done = att && att.status !== "encours";
            const note = att && att.score_max ? Math.round((Number(att.score) / Number(att.score_max)) * 20 * 10) / 10 : null;
            return (
              <div key={e.id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cama-50 flex items-center justify-center flex-shrink-0">
                  <FileQuestion className="w-5 h-5 text-cama" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{e.title}</p>
                  <p className="text-[11px] text-muted flex items-center gap-1.5">
                    {c && <>{c.code} · {c.title} · </>}<Clock className="w-3 h-3" /> {e.duration_min} min
                  </p>
                </div>
                {done ? (
                  note !== null && att?.status === "corrige" ? (
                    <span className="flex items-center gap-1 text-sm font-bold text-green-600"><Award className="w-4 h-4" /> {note}/20</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-gold-dark"><CheckCircle2 className="w-4 h-4" /> Soumis</span>
                  )
                ) : (
                  <Link href={`/examen/${e.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-4 py-2 rounded-lg hover:bg-cama-700 transition-colors">
                    <Play className="w-3.5 h-3.5" /> {att ? "Reprendre" : "Passer"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultsTab() {
  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Award className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Mes Résultats</h1>
      </div>

      <div className="bg-white border border-border rounded-xl p-8 text-center">
        <GraduationCap className="w-8 h-8 text-muted mx-auto mb-3" />
        <p className="text-sm font-semibold text-ink mb-1">Résultats &amp; ECTS</p>
        <p className="text-xs text-muted mb-4">
          Les résultats validés par le jury apparaissent ici après les délibérations.
        </p>
        <Link href="/jury/deliberations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cama hover:underline">
          Voir les délibérations <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <p className="text-[11px] text-muted mt-4 text-center">
        Human-in-the-loop : l&apos;IA signale, le jury décide. Aucune sanction automatique — vous disposez toujours d&apos;un droit d&apos;appel.
      </p>
    </div>
  );
}
