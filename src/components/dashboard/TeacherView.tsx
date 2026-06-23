"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Users, ChevronRight, Loader2, ShieldCheck, Terminal,
  FileQuestion, Inbox, Edit3, Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchTeacherCourses, fetchChapters } from "@/lib/program";
import { fetchExamsForCourses, fetchAttemptsForExam } from "@/lib/exams";
import type { DBProgramCourse, DBExam, DBExamAttempt } from "@/lib/supabase";

export default function TeacherView({ tab }: { tab: string }) {
  if (tab === "Étudiants") return <PlaceholderTab title="Suivi des étudiants" desc="Le suivi détaillé des étudiants est disponible dans chaque matière." link="/enseignant/cours" />;
  return <CoursesTab />;
}

function PlaceholderTab({ title, desc, link }: { title: string; desc: string; link: string }) {
  return (
    <div className="max-w-[900px] mx-auto py-8 text-center">
      <Users className="w-8 h-8 text-muted mx-auto mb-3" />
      <h1 className="text-xl font-light text-ink mb-2">{title}</h1>
      <p className="text-sm text-muted mb-4">{desc}</p>
      <Link href={link} className="inline-flex items-center gap-1.5 text-sm font-bold text-cama hover:underline">
        Ouvrir <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function CoursesTab() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [exams, setExams] = useState<DBExam[]>([]);
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [chapCounts, setChapCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const cs = await fetchTeacherCourses(user.id);
      setCourses(cs);

      const ids = cs.map((c) => c.id);
      if (ids.length > 0) {
        const ex = await fetchExamsForCourses(ids);
        setExams(ex);

        const allAtts: DBExamAttempt[] = [];
        for (const e of ex) {
          allAtts.push(...(await fetchAttemptsForExam(e.id)));
        }
        setAttempts(allAtts);

        const counts: Record<string, number> = {};
        for (const c of cs) {
          const chs = await fetchChapters(c.id);
          counts[c.id] = chs.length;
        }
        setChapCounts(counts);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) return (
    <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
  );

  const published = courses.filter((c) => c.published).length;
  const pendingCopies = attempts.filter((a) => a.status === "soumis").length;

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <BookOpen className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Tableau de bord enseignant</h1>
        <div className="flex-1" />
        <Link href="/tp"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white text-[11px] font-bold hover:bg-cama transition-colors rounded-lg">
          <Terminal className="w-3.5 h-3.5" /> TP &amp; VM
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden mb-5">
        {[
          { icon: BookOpen, label: "Matières assignées", value: courses.length, color: "text-cama" },
          { icon: Eye, label: "Publiées", value: published, color: "text-green-600" },
          { icon: FileQuestion, label: "Examens créés", value: exams.length, color: "text-gold-dark" },
          { icon: Inbox, label: "Copies à corriger", value: pendingCopies, color: "text-purple-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white p-4 text-center">
            <k.icon className={`w-5 h-5 mx-auto mb-1 ${k.color}`} />
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-muted mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <Link href="/enseignant/cours"
          className="flex items-center gap-3 p-4 bg-white border border-border rounded-xl hover:border-cama/40 transition-all">
          <BookOpen className="w-5 h-5 text-cama" />
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Gérer mes matières &amp; chapitres</p>
            <p className="text-[11px] text-muted">Éditer le contenu, publier, ajouter des chapitres</p>
          </div>
          <ChevronRight className="w-4 h-4 text-subtle" />
        </Link>
        <Link href="/enseignant/examens"
          className="flex items-center gap-3 p-4 bg-white border border-border rounded-xl hover:border-cama/40 transition-all">
          <ShieldCheck className="w-5 h-5 text-gold-dark" />
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Gérer les examens &amp; corrections</p>
            <p className="text-[11px] text-muted">Créer des QCM, corriger les copies, envoyer au jury</p>
          </div>
          <ChevronRight className="w-4 h-4 text-subtle" />
        </Link>
      </div>

      {/* Mes matières */}
      <h2 className="text-xs font-bold text-ink uppercase tracking-widest mb-2">Mes matières ({courses.length})</h2>
      {courses.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <BookOpen className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink mb-1">Aucune matière assignée</p>
          <p className="text-xs text-muted">L&apos;administration vous assignera des matières depuis le programme.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
          {courses.map((c) => {
            const chCount = chapCounts[c.id] ?? 0;
            const courseExams = exams.filter((e) => e.program_course_id === c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 hover:bg-cama-50/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cama-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-cama" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{c.title}</p>
                  <p className="text-[11px] text-muted">
                    {c.code} · {c.ects} ECTS · {chCount} chapitre(s) · {courseExams.length} examen(s)
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  c.published ? "bg-green-50 text-green-600" : "bg-surface text-muted"
                }`}>
                  {c.published ? "Publié" : "Brouillon"}
                </span>
                <Link href="/enseignant/cours"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-cama text-white text-[10px] font-bold rounded-lg hover:bg-cama-700 transition-colors">
                  <Edit3 className="w-3 h-3" /> Gérer
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Examens récents */}
      {exams.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-ink uppercase tracking-widest mb-2 mt-5">Examens récents</h2>
          <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
            {exams.slice(0, 5).map((e) => {
              const course = courses.find((c) => c.id === e.program_course_id);
              const examAtts = attempts.filter((a) => a.exam_id === e.id);
              return (
                <div key={e.id} className="flex items-center gap-3 p-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    e.status === "ouvert" ? "bg-green-50" : "bg-surface"
                  }`}>
                    <FileQuestion className={`w-5 h-5 ${e.status === "ouvert" ? "text-green-600" : "text-subtle"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink">{e.title}</p>
                    <p className="text-[11px] text-muted">
                      {course?.code} · {e.duration_min} min · {examAtts.length} copie(s)
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    e.status === "ouvert" ? "bg-green-50 text-green-600" :
                    e.status === "termine" ? "bg-surface text-muted" :
                    "bg-gold/10 text-gold-dark"
                  }`}>
                    {e.status === "ouvert" ? "Ouvert" : e.status === "termine" ? "Terminé" : "Planifié"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
