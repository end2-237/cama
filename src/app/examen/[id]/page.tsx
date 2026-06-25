"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck, Clock, AlertTriangle, Lock, Save, CheckCircle2,
  Maximize, Award, Loader2, ChevronLeft, ChevronRight, FileText, Hourglass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { DBExam, DBExamQuestion, DBExamAttempt } from "@/lib/supabase";
import {
  fetchExam, fetchQuestions, fetchAttempt, startAttempt, pushAlert, submitAttempt,
} from "@/lib/exams";

function shuffle<T>(arr: T[], seed: string): T[] {
  // mélange déterministe par étudiant+examen (stable au refresh)
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967295; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [exam, setExam] = useState<DBExam | null>(null);
  const [questions, setQuestions] = useState<DBExamQuestion[]>([]);
  const [attempt, setAttempt] = useState<DBExamAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [alerts, setAlerts] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "running" | "done" | "blocked">("loading");
  const [result, setResult] = useState<{
    score: number; max: number; note: number;
    hasOpen: boolean; qcmScore: number; qcmMax: number;
    answeredCount: number; totalCount: number;
    alertCount: number; durationMin: number;
  } | null>(null);
  const submitting = useRef(false);

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);

  // Chargement
  useEffect(() => {
    if (!user) return;
    (async () => {
      const e = await fetchExam(id);
      if (!e) { setPhase("blocked"); return; }
      setExam(e);
      const att = await fetchAttempt(id, user.id);
      if (att && att.status !== "encours") {
        const qs = await fetchQuestions(id);
        const hasOpen = qs.some((q) => q.type === "ouverte");
        let qcmScore = 0, qcmMax = 0;
        qs.forEach((q) => {
          if (q.type === "qcm") {
            qcmMax += q.points;
            if (att.answers && Number(att.answers[q.id]) === q.correct_index) qcmScore += q.points;
          }
        });
        const startMs = new Date(att.started_at).getTime();
        const endMs = att.submitted_at ? new Date(att.submitted_at).getTime() : startMs;
        const durationMin = Math.round((endMs - startMs) / 60000);
        const answeredCount = att.answers ? Object.keys(att.answers).length : 0;
        setQuestions(qs);
        setAttempt(att);
        setResult({
          score: Number(att.score ?? 0), max: Number(att.score_max ?? 0),
          note: att.score_max ? Math.round((Number(att.score) / Number(att.score_max)) * 20 * 10) / 10 : 0,
          hasOpen, qcmScore, qcmMax, answeredCount, totalCount: qs.length,
          alertCount: att.alerts?.length ?? 0, durationMin,
        });
        setPhase("done");
        return;
      }
      if (e.status !== "ouvert") { setPhase("blocked"); return; }
      const qs = await fetchQuestions(id);
      setQuestions(e.shuffle ? shuffle(qs, id + user.id) : qs);
      if (att) { setAttempt(att); setAnswers(att.answers ?? {}); setPhase("running"); }
      else setPhase("ready");
    })();
  }, [user, id]);

  // Timer basé sur started_at (résiste au refresh)
  useEffect(() => {
    if (phase !== "running" || !attempt || !exam) return;
    const start = new Date(attempt.started_at).getTime();
    const end = start + exam.duration_min * 60 * 1000;
    const tick = () => {
      const r = Math.max(0, Math.round((end - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) doSubmit();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attempt, exam]);

  // Anti-triche
  const logAlert = useCallback((type: string, detail: string) => {
    if (!attempt) return;
    setAlerts((a) => a + 1);
    pushAlert(attempt.id, { type, detail });
  }, [attempt]);

  useEffect(() => {
    if (phase !== "running") return;
    const onVis = () => { if (document.hidden) logAlert("onglet", "Changement d'onglet / fenêtre détecté"); };
    const onCopy = () => logAlert("copier", "Tentative de copie");
    const onPaste = () => logAlert("coller", "Tentative de collage");
    const onCtx = (e: Event) => { e.preventDefault(); logAlert("saisie", "Clic droit / menu contextuel"); };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onCtx);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onCtx);
    };
  }, [phase, logAlert]);

  const begin = async () => {
    if (!user) return;
    const att = await startAttempt(id, user.id);
    if (!att) return;
    setAttempt(att);
    setAnswers(att.answers ?? {});
    setPhase("running");
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const doSubmit = async () => {
    if (submitting.current || !attempt) return;
    submitting.current = true;
    await submitAttempt(attempt.id, answers, questions);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    let score = 0, max = 0, qcmScore = 0, qcmMax = 0;
    const hasOpen = questions.some((q) => q.type === "ouverte");
    questions.forEach((q) => {
      max += q.points;
      if (q.type === "qcm") {
        qcmMax += q.points;
        if (Number(answers[q.id]) === q.correct_index) { score += q.points; qcmScore += q.points; }
      }
    });
    const startMs = attempt ? new Date(attempt.started_at).getTime() : Date.now();
    const durationMin = Math.round((Date.now() - startMs) / 60000);
    setResult({
      score, max, note: max ? Math.round((score / max) * 20 * 10) / 10 : 0,
      hasOpen, qcmScore, qcmMax,
      answeredCount: Object.keys(answers).length, totalCount: questions.length,
      alertCount: alerts, durationMin,
    });
    setPhase("done");
  };

  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  if (loading || phase === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="w-8 h-8 animate-spin text-cama" />
    </div>
  );

  // ── Blocage ──
  if (phase === "blocked") return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="bg-white border border-border rounded-2xl p-8 text-center max-w-sm">
        <Lock className="w-10 h-10 text-muted mx-auto mb-3" />
        <p className="text-sm font-bold text-ink mb-1">Examen indisponible</p>
        <p className="text-xs text-muted mb-4">Cet examen n&apos;est pas ouvert ou n&apos;existe pas.</p>
        <Link href="/etudiant/examens" className="text-xs font-bold text-cama hover:underline">← Mes examens</Link>
      </div>
    </div>
  );

  // ── Résultat ──
  if (phase === "done" && result) {
    const isPending = result.hasOpen;
    const qcmNote = result.qcmMax ? Math.round((result.qcmScore / result.qcmMax) * 20 * 10) / 10 : 0;
    const openQuestions = questions.filter((q) => q.type === "ouverte");
    const qcmQuestions = questions.filter((q) => q.type === "qcm");

    return (
      <div className="min-h-screen bg-surface p-4">
        <div className="max-w-lg mx-auto pt-8 space-y-4">
          {/* En-tête */}
          <div className="bg-white border border-border rounded-2xl p-6 text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isPending ? "bg-gold/10" : result.note >= 10 ? "bg-green-50" : "bg-gold/10"
            }`}>
              <Award className={`w-8 h-8 ${isPending ? "text-gold-dark" : result.note >= 10 ? "text-green-600" : "text-gold-dark"}`} />
            </div>
            <h1 className="text-lg font-bold text-ink mb-1">{exam?.title}</h1>
            <p className="text-xs text-muted mb-4">
              {isPending ? "Correction en attente" : "Note finale"}
            </p>

            {!isPending ? (
              <>
                <p className="text-4xl font-black text-ink mb-1">{result.note}<span className="text-lg text-muted">/20</span></p>
                <p className="text-xs text-muted">{result.score}/{result.max} points</p>
              </>
            ) : (
              <>
                <p className="text-4xl font-black text-gold-dark mb-1">{qcmNote}<span className="text-lg text-muted">/20</span></p>
                <p className="text-xs text-muted mb-3">Note provisoire (QCM uniquement)</p>
              </>
            )}
          </div>

          {/* Messages pour examen mixte */}
          {isPending && (
            <div className="bg-gold/10 border border-gold-dark/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Hourglass className="w-4 h-4 text-gold-dark mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gold-dark space-y-1.5">
                  <p>Vos réponses QCM ont été corrigées automatiquement : <strong>{result.qcmScore}/{result.qcmMax} points</strong></p>
                  <p>Vos questions ouvertes ont été soumises à l&apos;enseignant pour correction.</p>
                  <p className="font-semibold">Vous recevrez votre note finale après correction complète.</p>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques */}
          <div className="bg-white border border-border rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted mb-0.5">Durée</p>
                <p className="text-sm font-bold text-ink">{result.durationMin} min</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Répondues</p>
                <p className="text-sm font-bold text-ink">{result.answeredCount}/{result.totalCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Alertes</p>
                <p className={`text-sm font-bold ${result.alertCount > 0 ? "text-red-500" : "text-ink"}`}>
                  {result.alertCount > 0 && <AlertTriangle className="w-3.5 h-3.5 inline mr-0.5 -mt-0.5" />}
                  {result.alertCount}
                </p>
              </div>
            </div>
          </div>

          {/* Alertes warning */}
          {result.alertCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{result.alertCount} alerte(s) de surveillance enregistrée(s). Le jury en sera informé.</p>
            </div>
          )}

          {/* Récapitulatif des questions */}
          {questions.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-4">
              <p className="text-xs font-bold text-ink mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cama" /> Récapitulatif
              </p>
              <div className="space-y-1.5">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-2 text-xs">
                    <span className="w-6 h-6 rounded-lg bg-surface flex items-center justify-center text-muted font-bold flex-shrink-0">{i + 1}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      q.type === "qcm" ? "bg-cama-50 text-cama" : "bg-gold/10 text-gold-dark"
                    }`}>{q.type === "qcm" ? "QCM" : "Ouverte"}</span>
                    <span className="text-muted truncate flex-1">{q.text}</span>
                    <span className="text-muted flex-shrink-0">{q.points} pt{q.points > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
              {questions.length > 0 && (
                <div className="flex justify-between text-xs font-bold text-ink mt-3 pt-2 border-t border-border">
                  <span>{qcmQuestions.length} QCM · {openQuestions.length} ouverte(s)</span>
                  <span>{result.max} points total</span>
                </div>
              )}
            </div>
          )}

          <div className="text-center pt-2 pb-8">
            <Link href="/etudiant/examens" className="inline-block text-xs font-bold bg-cama text-white px-5 py-2.5 rounded-lg hover:bg-cama-700">← Mes examens</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Salle d'attente (consignes) ──
  if (phase === "ready") return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="bg-white border border-border rounded-2xl p-8 max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-6 h-6 text-cama" />
          <h1 className="text-lg font-bold text-ink">{exam?.title}</h1>
        </div>
        <p className="text-sm text-muted mb-4">Environnement surveillé <strong>Safe-CAMA</strong>. En commençant, vous acceptez les règles d&apos;intégrité.</p>
        <ul className="space-y-2 text-xs text-ink mb-5">
          <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-cama" /> Durée : <strong>{exam?.duration_min} minutes</strong> (chrono non interruptible)</li>
          <li className="flex items-center gap-2"><Maximize className="w-4 h-4 text-cama" /> Plein écran activé automatiquement</li>
          <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-gold-dark" /> Changements d&apos;onglet, copier/coller : <strong>signalés au jury</strong></li>
        </ul>
        <button onClick={begin} className="w-full bg-cama text-white rounded-xl py-3 text-sm font-bold hover:bg-cama-700 transition-colors">
          Commencer l&apos;examen
        </button>
      </div>
    </div>
  );

  // ── Examen en cours ──
  const q = questions[idx];
  const mm = remaining !== null ? String(Math.floor(remaining / 60)).padStart(2, "0") : "--";
  const ss = remaining !== null ? String(remaining % 60).padStart(2, "0") : "--";
  const lowTime = remaining !== null && remaining < 60;

  return (
    <div className="min-h-screen bg-surface select-none">
      {/* Barre surveillée */}
      <header className="bg-ink text-white sticky top-0 z-40">
        <div className="max-w-[800px] mx-auto px-4 flex items-center gap-3 h-12">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold">Safe-CAMA · {exam?.title}</span>
          <div className="flex-1" />
          {alerts > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-red-300"><AlertTriangle className="w-3.5 h-3.5" /> {alerts} alerte(s)</span>
          )}
          <span className={`flex items-center gap-1.5 font-mono text-sm font-bold ${lowTime ? "text-red-400 animate-pulse" : "text-white"}`}>
            <Clock className="w-4 h-4" /> {mm}:{ss}
          </span>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-4 py-6">
        {/* Progression */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-muted">Question {idx + 1}/{questions.length}</span>
          <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden border border-border">
            <div className="h-full bg-cama" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="text-xs text-muted">{answered} répondues</span>
        </div>

        {q && (
          <div className="bg-white border border-border rounded-2xl p-6 mb-4">
            <p className="text-[11px] font-bold text-cama uppercase tracking-wider mb-2">{q.points} point{q.points > 1 ? "s" : ""} · {q.type === "qcm" ? "Choix unique" : "Réponse libre"}</p>
            <p className="text-base text-ink font-medium mb-5">{q.text}</p>

            {q.type === "qcm" ? (
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      answers[q.id] === oi ? "border-cama bg-cama-50" : "border-border hover:border-cama/40"}`}>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      answers[q.id] === oi ? "border-cama bg-cama" : "border-border"}`}>
                      {answers[q.id] === oi && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </span>
                    <span className="text-sm text-ink">{o}</span>
                  </button>
                ))}
              </div>
            ) : (
              <textarea value={(answers[q.id] as string) ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                rows={6} placeholder="Votre réponse…"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-cama resize-y" />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
            className="flex items-center gap-1 text-sm font-semibold text-muted disabled:opacity-40 hover:text-ink transition-colors">
            <ChevronLeft className="w-4 h-4" /> Précédent
          </button>
          {idx < questions.length - 1 ? (
            <button onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
              className="flex items-center gap-1 text-sm font-bold bg-cama text-white px-4 py-2 rounded-lg hover:bg-cama-700 transition-colors">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={doSubmit}
              className="flex items-center gap-1.5 text-sm font-bold bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors">
              <Save className="w-4 h-4" /> Terminer & soumettre
            </button>
          )}
        </div>

        {/* Grille de navigation rapide */}
        <div className="flex flex-wrap gap-1.5 mt-6">
          {questions.map((qq, i) => (
            <button key={qq.id} onClick={() => setIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === idx ? "bg-cama text-white" :
                answers[qq.id] !== undefined ? "bg-cama-50 text-cama border border-cama/30" :
                "bg-white text-muted border border-border"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
