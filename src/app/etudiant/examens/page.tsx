"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, FileQuestion, Clock, CheckCircle2, Play, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { DBProgramCourse, DBExam, DBExamAttempt } from "@/lib/supabase";
import { fetchStudentProgram } from "@/lib/program";
import { fetchOpenExams, fetchAttemptsForStudent } from "@/lib/exams";

export default function StudentExamsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState<DBExam[]>([]);
  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const slug = user.dossier?.parcoursSlug;
    if (!slug) { setFetching(false); return; }
    (async () => {
      const cs = await fetchStudentProgram(slug, user.dossier?.level);
      setCourses(cs);
      setExams(await fetchOpenExams(cs.map((c) => c.id)));
      setAttempts(await fetchAttemptsForStudent(user.id));
      setFetching(false);
    })();
  }, [user]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const attemptByExam = new Map(attempts.map((a) => [a.exam_id, a]));

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <FileQuestion className="w-4 h-4 text-cama" /> Mes examens
          </span>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-5">
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : exams.length === 0 ? (
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
                <div key={e.id} className="bg-white border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cama-50 flex items-center justify-center flex-shrink-0">
                    <FileQuestion className="w-5 h-5 text-cama" />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-bold text-ink">{e.title}</p>
                    <p className="text-[11px] text-muted flex items-center gap-1.5">
                      {c && <>{c.code} · {c.title} · </>}<Clock className="w-3 h-3" /> {e.duration_min} min
                    </p>
                  </div>
                  {done ? (
                    <div className="flex items-center gap-2">
                      {note !== null && att?.status === "corrige" ? (
                        <span className="flex items-center gap-1 text-sm font-bold text-green-600"><Award className="w-4 h-4" /> {note}/20</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-gold-dark"><CheckCircle2 className="w-4 h-4" /> Soumis</span>
                      )}
                    </div>
                  ) : (
                    <Link href={`/examen/${e.id}`}
                      className="flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-4 py-2 rounded-lg hover:bg-cama-700 transition-colors">
                      <Play className="w-3.5 h-3.5" /> {att ? "Reprendre" : "Passer l'examen"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
