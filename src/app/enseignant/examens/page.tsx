"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, FileQuestion, Plus, Trash2, Save, X,
  CheckCircle2, Play, Square, Users, Send, AlertTriangle, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { DBProgramCourse, DBExam, DBExamQuestion, DBExamAttempt } from "@/lib/supabase";
import { fetchTeacherCourses } from "@/lib/program";
import {
  fetchExamsForCourses, createExam, setExamStatus, deleteExam,
  fetchQuestions, addQuestion, deleteQuestion,
  fetchAttemptsForExam, gradeAttempt, upsertDeliberation,
} from "@/lib/exams";

export default function TeacherExamsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [exams, setExams] = useState<DBExam[]>([]);
  const [selExam, setSelExam] = useState<DBExam | null>(null);
  const [questions, setQuestions] = useState<DBExamQuestion[]>([]);
  const [attempts, setAttempts] = useState<DBExamAttempt[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState<"questions" | "copies">("questions");

  // formulaires
  const [newExamTitle, setNewExamTitle] = useState("");
  const [qOpen, setQOpen] = useState(false);
  const [q, setQ] = useState<Partial<DBExamQuestion>>({ type: "qcm", text: "", options: ["", "", "", ""], correct_index: 0, points: 1 });

  useEffect(() => {
    if (!loading && (!user || (user.role !== "enseignant" && user.role !== "admin"))) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetchTeacherCourses(user.id).then((cs) => {
      setCourses(cs);
      if (cs[0]) setCourseId(cs[0].id);
      setFetching(false);
    });
  }, [user]);

  useEffect(() => {
    if (!courseId) return;
    fetchExamsForCourses([courseId]).then(setExams);
    setSelExam(null);
  }, [courseId]);

  const openExam = async (e: DBExam) => {
    setSelExam(e);
    setTab("questions");
    setQuestions(await fetchQuestions(e.id));
    setAttempts(await fetchAttemptsForExam(e.id));
  };

  const onCreateExam = async () => {
    if (!newExamTitle.trim() || !courseId) return;
    const { data } = await createExam({
      program_course_id: courseId, title: newExamTitle.trim(),
      duration_min: 60, status: "planifie", created_by: user?.id ?? null,
    });
    setNewExamTitle("");
    const list = await fetchExamsForCourses([courseId]);
    setExams(list);
    if (data) openExam(data as DBExam);
  };

  const onStatus = async (e: DBExam, status: DBExam["status"]) => {
    await setExamStatus(e.id, status);
    setExams((xs) => xs.map((x) => x.id === e.id ? { ...x, status } : x));
    if (selExam?.id === e.id) setSelExam({ ...e, status });
  };

  const onDelExam = async (id: string) => {
    if (!confirm("Supprimer cet examen ?")) return;
    await deleteExam(id);
    setExams((xs) => xs.filter((x) => x.id !== id));
    if (selExam?.id === id) setSelExam(null);
  };

  const onAddQuestion = async () => {
    if (!selExam || !q.text?.trim()) return;
    await addQuestion({
      exam_id: selExam.id, ordre: questions.length, type: q.type,
      text: q.text, points: q.points ?? 1,
      options: q.type === "qcm" ? (q.options ?? []).filter(Boolean) : [],
      correct_index: q.type === "qcm" ? q.correct_index : null,
    });
    setQuestions(await fetchQuestions(selExam.id));
    setQOpen(false);
    setQ({ type: "qcm", text: "", options: ["", "", "", ""], correct_index: 0, points: 1 });
  };

  const onDelQuestion = async (id: string) => {
    await deleteQuestion(id);
    setQuestions((qs) => qs.filter((x) => x.id !== id));
  };

  const onGrade = async (a: DBExamAttempt, score: number, feedback: string) => {
    await gradeAttempt(a.id, score, feedback);
    setAttempts((as) => as.map((x) => x.id === a.id ? { ...x, score, feedback, status: "corrige" } : x));
  };

  const sendToDelib = async (a: DBExamAttempt) => {
    if (!selExam) return;
    const note = a.score_max ? Math.round((Number(a.score) / Number(a.score_max)) * 20 * 10) / 10 : 0;
    const course = courses.find((c) => c.id === selExam.program_course_id);
    await upsertDeliberation({
      program_course_id: selExam.program_course_id, student_id: a.student_id,
      attempt_id: a.id, note, credits: course?.ects ?? 0, status: "en_delib",
    });
    alert(`Envoyé en délibération : note ${note}/20`);
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const STATUS_BADGE: Record<DBExam["status"], { label: string; cls: string }> = {
    planifie: { label: "Planifié", cls: "bg-gold/10 text-gold-dark" },
    ouvert:   { label: "Ouvert",   cls: "bg-green-50 text-green-600" },
    termine:  { label: "Terminé",  cls: "bg-surface text-muted" },
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <FileQuestion className="w-4 h-4 text-cama" /> Examens
          </span>
          <div className="flex-1" />
          {courses.length > 0 && (
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
              className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-cama">
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title}</option>)}
            </select>
          )}
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 grid lg:grid-cols-[340px_1fr] gap-5 items-start">

        {/* Liste examens */}
        <div>
          <div className="flex gap-2 mb-3">
            <input value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onCreateExam()}
              placeholder="Titre du nouvel examen…"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-cama" />
            <button onClick={onCreateExam} className="bg-cama text-white px-3 py-2 rounded-lg hover:bg-cama-700 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {fetching ? (
            <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
          ) : courses.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-6 text-center text-xs text-muted">
              Aucune matière assignée. L&apos;administration doit vous affecter une matière.
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-6 text-center text-xs text-muted">Aucun examen. Créez-en un ci-dessus.</div>
          ) : (
            <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
              {exams.map((e) => (
                <button key={e.id} onClick={() => openExam(e)}
                  className={`w-full text-left p-3 hover:bg-cama-50/40 transition-colors flex items-center gap-2 ${selExam?.id === e.id ? "bg-cama-50/60" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{e.title}</p>
                    <p className="text-[11px] text-muted">{e.duration_min} min</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[e.status].cls}`}>{STATUS_BADGE[e.status].label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-subtle" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détail examen */}
        {!selExam ? (
          <div className="bg-white border border-border rounded-xl p-10 text-center text-sm text-muted">
            Sélectionnez ou créez un examen.
          </div>
        ) : (
          <div className="space-y-4">
            {/* En-tête + statut */}
            <div className="bg-white border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[160px]">
                <h2 className="text-base font-bold text-ink">{selExam.title}</h2>
                <p className="text-[11px] text-muted">{questions.length} questions · {questions.reduce((a, x) => a + x.points, 0)} pts · {selExam.duration_min} min</p>
              </div>
              <div className="flex items-center gap-1.5">
                {selExam.status !== "ouvert" && (
                  <button onClick={() => onStatus(selExam, "ouvert")} disabled={questions.length === 0}
                    className="flex items-center gap-1 text-[11px] font-bold text-green-600 border border-green-200 rounded-lg px-2.5 py-1.5 hover:bg-green-50 disabled:opacity-40">
                    <Play className="w-3.5 h-3.5" /> Ouvrir
                  </button>
                )}
                {selExam.status === "ouvert" && (
                  <button onClick={() => onStatus(selExam, "termine")}
                    className="flex items-center gap-1 text-[11px] font-bold text-ink border border-border rounded-lg px-2.5 py-1.5 hover:bg-surface">
                    <Square className="w-3.5 h-3.5" /> Clôturer
                  </button>
                )}
                <button onClick={() => onDelExam(selExam.id)} className="text-subtle hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-0.5 bg-white border border-border rounded-xl p-1 w-fit">
              {([["questions", "Questions"], ["copies", `Copies (${attempts.length})`]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === k ? "bg-cama text-white" : "text-muted hover:text-ink"}`}>{l}</button>
              ))}
            </div>

            {tab === "questions" ? (
              <div className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-black text-ink uppercase tracking-widest">Questions</h3>
                  <button onClick={() => setQOpen(true)} className="text-[11px] font-bold text-cama hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter</button>
                </div>
                {questions.length === 0 ? (
                  <p className="text-xs text-muted italic">Aucune question. Ajoutez-en avant d&apos;ouvrir l&apos;examen.</p>
                ) : (
                  <div className="space-y-2">
                    {questions.map((qq, i) => (
                      <div key={qq.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-subtle">{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm text-ink">{qq.text} <span className="text-[10px] text-muted">({qq.points} pt{qq.points > 1 ? "s" : ""} · {qq.type})</span></p>
                            {qq.type === "qcm" && (
                              <ul className="mt-1 space-y-0.5">
                                {qq.options.map((o, oi) => (
                                  <li key={oi} className={`text-[11px] flex items-center gap-1.5 ${oi === qq.correct_index ? "text-green-600 font-bold" : "text-muted"}`}>
                                    {oi === qq.correct_index ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-border inline-block" />}
                                    {o}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <button onClick={() => onDelQuestion(qq.id)} className="text-subtle hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Copies / correction */
              <div className="bg-white border border-border rounded-xl p-4">
                <h3 className="text-[11px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-cama" /> Copies soumises</h3>
                {attempts.length === 0 ? (
                  <p className="text-xs text-muted italic">Aucune copie pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {attempts.map((a) => <AttemptRow key={a.id} a={a} questions={questions} onGrade={onGrade} onSend={sendToDelib} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal ajout question */}
      {qOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-ink">Nouvelle question</h2>
              <button onClick={() => setQOpen(false)} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {(["qcm", "ouverte"] as const).map((t) => (
                  <button key={t} onClick={() => setQ((x) => ({ ...x, type: t }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${q.type === t ? "border-cama bg-cama text-white" : "border-border text-muted"}`}>
                    {t === "qcm" ? "QCM" : "Question ouverte"}
                  </button>
                ))}
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  <input type="number" min={1} value={q.points ?? 1} onChange={(e) => setQ((x) => ({ ...x, points: parseInt(e.target.value) || 1 }))}
                    className="w-14 border border-border rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-cama" />
                  <span className="text-[11px] text-muted">pts</span>
                </div>
              </div>
              <textarea value={q.text ?? ""} onChange={(e) => setQ((x) => ({ ...x, text: e.target.value }))} rows={2}
                placeholder="Énoncé de la question…" className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-cama resize-y" />
              {q.type === "qcm" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-ink">Options (cochez la bonne réponse)</p>
                  {(q.options ?? []).map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" checked={q.correct_index === i} onChange={() => setQ((x) => ({ ...x, correct_index: i }))} className="accent-cama" />
                      <input value={o} onChange={(e) => setQ((x) => { const opts = [...(x.options ?? [])]; opts[i] = e.target.value; return { ...x, options: opts }; })}
                        placeholder={`Option ${i + 1}`} className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-cama" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setQOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold text-muted">Annuler</button>
              <button onClick={onAddQuestion} className="flex-1 bg-cama text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-cama-700">
                <Save className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Ligne de copie avec correction des ouvertes */
function AttemptRow({ a, questions, onGrade, onSend }: {
  a: DBExamAttempt; questions: DBExamQuestion[];
  onGrade: (a: DBExamAttempt, score: number, fb: string) => void;
  onSend: (a: DBExamAttempt) => void;
}) {
  const [score, setScore] = useState(a.score ?? 0);
  const [fb, setFb] = useState(a.feedback ?? "");
  const hasOpen = questions.some((q) => q.type === "ouverte");
  const note = a.score_max ? Math.round((Number(score) / Number(a.score_max)) * 20 * 10) / 10 : 0;

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-muted">{a.student_id.slice(0, 8)}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.status === "corrige" ? "bg-green-50 text-green-600" : "bg-gold/10 text-gold-dark"}`}>
          {a.status === "corrige" ? "Corrigé" : "À corriger"}
        </span>
        {a.alerts.length > 0 && (
          <span className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {a.alerts.length} alerte(s)</span>
        )}
        <div className="flex-1" />
        <span className="text-xs text-muted">{score}/{a.score_max ?? "?"} → <strong className="text-cama">{note}/20</strong></span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {hasOpen && (
          <>
            <input type="number" min={0} max={a.score_max ?? 100} value={score} onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
              className="w-20 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cama" />
            <input value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Feedback…"
              className="flex-1 border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-cama" />
            <button onClick={() => onGrade(a, score, fb)} className="text-[11px] font-bold text-cama border border-cama/30 rounded-lg px-2.5 py-1.5 hover:bg-cama-50">Noter</button>
          </>
        )}
        <button onClick={() => onSend(a)} className="flex items-center gap-1 text-[11px] font-bold text-white bg-cama rounded-lg px-2.5 py-1.5 hover:bg-cama-700">
          <Send className="w-3 h-3" /> En délibération
        </button>
      </div>
    </div>
  );
}
