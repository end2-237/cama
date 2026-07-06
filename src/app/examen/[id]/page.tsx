"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck, Clock, AlertTriangle, Lock, Save, CheckCircle2,
  Maximize, Award, Loader2, ChevronLeft, ChevronRight, FileText, Hourglass,
  BookOpen, Layers, ListChecks, Eye, Camera, CameraOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { DBExam, DBExamQuestion, DBExamAttempt } from "@/lib/supabase";
import {
  fetchExam, fetchQuestions, fetchMyAttempts, startAttempt, pushAlert, submitAttempt,
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

  // ── Rattrapage (session 2) ──
  const [session, setSession] = useState(1);        // session à composer / composée
  const [resitAvailable, setResitAvailable] = useState(false); // session 1 finie + rattrapage ouvert

  // ── Caméra / proctoring ──
  const [cameraOk, setCameraOk] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [requestingCam, setRequestingCam] = useState(false);
  const [physical, setPhysical] = useState(false);
  const [locked, setLocked] = useState(false); // overlay bloquant (onglet quitté)
  const streamRef = useRef<MediaStream | null>(null);
  const readyVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const proctoringRef = useRef<{ time: string; type: string }[]>([]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const requestCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Caméra non disponible sur cet appareil.");
      return;
    }
    setRequestingCam(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOk(true);
      setPhysical(false);
      if (readyVideoRef.current) {
        readyVideoRef.current.srcObject = stream;
        readyVideoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraOk(false);
      setCameraError("Accès à la caméra refusé ou indisponible. Autorisez la caméra puis réessayez.");
    } finally {
      setRequestingCam(false);
    }
  }, []);

  // Nettoyage de la caméra au démontage
  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);

  // Chargement
  useEffect(() => {
    if (!user) return;
    (async () => {
      const e = await fetchExam(id);
      if (!e) { setPhase("blocked"); return; }
      setExam(e);
      const atts = await fetchMyAttempts(id, user.id);
      const s1 = atts.find((a) => (a.session ?? 1) === 1) ?? null;
      const s2 = atts.find((a) => a.session === 2) ?? null;
      // Tentative « active » : la session 2 prime si elle existe
      const att = s2 ?? s1;
      // Rattrapage proposable : session 1 terminée, rattrapage ouvert, pas encore de session 2
      setResitAvailable(!!s1 && s1.status !== "encours" && !!e.resit_open && !s2);
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
        setSession(att.session ?? 1);
        setResult({
          score: Number(att.score ?? 0), max: Number(att.score_max ?? 0),
          note: att.score_max ? Math.round((Number(att.score) / Number(att.score_max)) * 20 * 10) / 10 : 0,
          hasOpen, qcmScore, qcmMax, answeredCount, totalCount: qs.length,
          alertCount: att.alerts?.length ?? 0, durationMin,
        });
        setPhase("done");
        return;
      }
      // Reprise possible : examen ouvert, ou rattrapage ouvert pour une session 2 en cours
      const canResume = !!att && (e.status === "ouvert" || (att.session === 2 && !!e.resit_open));
      if (!att && e.status !== "ouvert") { setPhase("blocked"); return; }
      if (att && !canResume) { setPhase("blocked"); return; }
      const qs = await fetchQuestions(id);
      setQuestions(e.shuffle ? shuffle(qs, id + user.id) : qs);
      if (att) { setAttempt(att); setSession(att.session ?? 1); setAnswers(att.answers ?? {}); setPhase("running"); }
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
    const onVis = () => {
      if (document.hidden) { logAlert("onglet", "Changement d'onglet / fenêtre détecté"); setLocked(true); }
    };
    const onBlur = () => { logAlert("focus", "Perte de focus de la fenêtre"); setLocked(true); };
    const onFsChange = () => { if (!document.fullscreenElement) { logAlert("pleinecran", "Sortie du plein écran"); setLocked(true); } };
    const onCopy = () => logAlert("copier", "Tentative de copie");
    const onPaste = () => logAlert("coller", "Tentative de collage");
    const onCtx = (e: Event) => { e.preventDefault(); logAlert("saisie", "Clic droit / menu contextuel"); };
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onCtx);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onCtx);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [phase, logAlert]);

  // Rebranche le flux caméra sur le PiP en cours d'examen + horodatages toutes les 30s
  useEffect(() => {
    if (phase !== "running" || physical || !cameraOk) return;
    if (pipVideoRef.current && streamRef.current) {
      pipVideoRef.current.srcObject = streamRef.current;
      pipVideoRef.current.play().catch(() => {});
    }
    proctoringRef.current.push({ time: new Date().toISOString(), type: "start" });
    const t = setInterval(() => {
      proctoringRef.current.push({ time: new Date().toISOString(), type: "tick" });
    }, 30000);
    return () => clearInterval(t);
  }, [phase, physical, cameraOk]);

  // Revenir en plein écran depuis l'overlay bloquant
  const resumeExam = () => {
    document.documentElement.requestFullscreen?.().then(() => setLocked(false)).catch(() => setLocked(false));
  };

  // Passe à l'écran de consignes pour composer la session 2 (rattrapage)
  const startResit = () => {
    if (!exam || !user) return;
    setSession(2);
    setResult(null);
    setAttempt(null);
    setAnswers({});
    setIdx(0);
    setQuestions((qs) => (exam.shuffle ? shuffle(qs, id + user.id + "s2") : qs));
    setPhase("ready");
  };

  const begin = async (asPhysical = false) => {
    if (!user) return;
    const att = await startAttempt(id, user.id, session);
    if (!att) return;
    // Persiste le mode de composition sur la tentative
    await supabase.from("exam_attempts")
      .update({ physical: asPhysical, camera_ok: !asPhysical && cameraOk })
      .eq("id", att.id);
    setPhysical(asPhysical);
    if (asPhysical) stopCamera();
    setAttempt(att);
    setAnswers(att.answers ?? {});
    setPhase("running");
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Composer en présentiel (caméra endommagée)
  const beginPhysical = () => { setCameraError(null); begin(true); };

  const doSubmit = async () => {
    if (submitting.current || !attempt) return;
    submitting.current = true;
    await submitAttempt(attempt.id, answers, questions);
    // Sauvegarde des horodatages de surveillance + coupe la caméra
    if (proctoringRef.current.length > 0) {
      await supabase.from("exam_attempts")
        .update({ proctoring: proctoringRef.current })
        .eq("id", attempt.id);
    }
    stopCamera();
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
            {attempt?.is_resit && (
              <span className="inline-block text-[10px] font-black uppercase tracking-widest text-gold-dark bg-gold/10 border border-gold/30 px-2 py-0.5 mb-2">
                Session 2 · Rattrapage
              </span>
            )}
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

          {/* Rattrapage disponible */}
          {resitAvailable && (
            <div className="bg-white border border-gold/40 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gold-dark mb-1">Rattrapage ouvert</p>
              <p className="text-xs text-muted mb-3">
                Une session de rattrapage est ouverte pour cet examen.
                {exam?.resit_scheduled_at && <> Prévue le {new Date(exam.resit_scheduled_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}.</>}
              </p>
              <button onClick={startResit}
                className="inline-block text-xs font-bold bg-gold-dark text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                Composer en rattrapage (session 2)
              </button>
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
        {session === 2 && (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-gold-dark bg-gold/10 border border-gold/30 px-2 py-0.5 mb-3">
            Session 2 · Rattrapage
          </span>
        )}
        <p className="text-sm text-muted mb-4">Environnement surveillé <strong>Safe-CAMA</strong>. En commençant, vous acceptez les règles d&apos;intégrité.</p>
        <ul className="space-y-2 text-xs text-ink mb-5">
          <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-cama" /> Durée : <strong>{exam?.duration_min} minutes</strong> (chrono non interruptible)</li>
          <li className="flex items-center gap-2"><Maximize className="w-4 h-4 text-cama" /> Plein écran activé automatiquement</li>
          <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-gold-dark" /> Changements d&apos;onglet, copier/coller : <strong>signalés au jury</strong></li>
          {exam?.require_camera && (
            <li className="flex items-center gap-2"><Camera className="w-4 h-4 text-cama" /> Caméra <strong>obligatoire</strong> pendant toute l&apos;épreuve</li>
          )}
        </ul>

        {/* Vérification caméra (si imposée) */}
        {exam?.require_camera && (
          <div className="mb-5">
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-2">
              <video ref={readyVideoRef} muted playsInline className="w-full h-full object-cover" />
              {!cameraOk && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
                  <CameraOff className="w-8 h-8" />
                  <p className="text-xs">{requestingCam ? "Activation de la caméra…" : "Caméra non activée"}</p>
                </div>
              )}
              {cameraOk && (
                <span className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Caméra active
                </span>
              )}
            </div>
            {!cameraOk && (
              <button onClick={requestCamera} disabled={requestingCam}
                className="w-full border-2 border-cama text-cama rounded-xl py-2.5 text-sm font-bold hover:bg-cama-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" /> Activer ma caméra
              </button>
            )}
            {cameraError && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2.5">
                <p className="text-[11px] text-red-600 mb-2">{cameraError}</p>
                <button onClick={beginPhysical}
                  className="w-full text-[11px] font-bold text-gold-dark border border-gold/40 rounded-lg py-2 hover:bg-gold/10 transition-colors">
                  Ma caméra est endommagée — composer en présentiel (physique)
                </button>
              </div>
            )}
          </div>
        )}

        <button onClick={() => begin(false)}
          disabled={!!exam?.require_camera && !cameraOk}
          className="w-full bg-cama text-white rounded-xl py-3 text-sm font-bold hover:bg-cama-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Commencer l&apos;examen
        </button>
        {exam?.require_camera && !cameraOk && !cameraError && (
          <p className="text-[10px] text-subtle text-center mt-2">Activez la caméra pour pouvoir composer.</p>
        )}
      </div>
    </div>
  );

  // ── Examen en cours ──
  const q = questions[idx];
  const mm = remaining !== null ? String(Math.floor(remaining / 60)).padStart(2, "0") : "--";
  const ss = remaining !== null ? String(remaining % 60).padStart(2, "0") : "--";
  const lowTime = remaining !== null && remaining < 60;

  const totalPoints = questions.reduce((s, qq) => s + qq.points, 0);
  const progressPct = questions.length ? (answered / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-surface select-none">
      {/* Caméra de surveillance (PiP) */}
      {!physical && cameraOk && (
        <div className="fixed bottom-3 right-3 z-50 w-32 rounded-lg overflow-hidden border-2 border-ink shadow-lg bg-black">
          <video ref={pipVideoRef} muted playsInline className="w-full h-24 object-cover" />
          <div className="absolute top-1 left-1 flex items-center gap-1 text-[8px] font-bold bg-red-600 text-white px-1 rounded">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> REC
          </div>
        </div>
      )}

      {/* Overlay bloquant : l'étudiant a quitté l'onglet / le plein écran */}
      {locked && (
        <div className="fixed inset-0 z-[60] bg-red-950/95 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="text-lg font-black text-white mb-1">Revenez à l&apos;épreuve</p>
            <p className="text-sm text-red-200 mb-5">Quitter l&apos;onglet ou le plein écran est enregistré et signalé au jury. Reprenez pour continuer à composer.</p>
            <button onClick={resumeExam} className="bg-white text-red-700 font-bold px-5 py-2.5 rounded-xl hover:bg-red-50 transition-colors">
              Reprendre en plein écran
            </button>
          </div>
        </div>
      )}

      {/* Barre surveillée */}
      <header className="bg-ink text-white sticky top-0 z-40 border-b border-white/10">
        <div className="px-4 sm:px-6 flex items-center gap-3 h-12">
          <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Safe-CAMA</span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="hidden sm:inline text-xs font-bold truncate">{exam?.title}</span>
          {session === 2 && (
            <span className="text-[10px] font-bold text-gold-dark bg-gold/20 px-2 py-0.5 rounded-full">Rattrapage</span>
          )}
          {physical ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-gold-dark bg-gold/20 px-2 py-0.5 rounded-full"><CameraOff className="w-3 h-3" /> Mode physique</span>
          ) : cameraOk ? (
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-green-300"><Camera className="w-3 h-3" /> Caméra</span>
          ) : null}
          <div className="flex-1" />
          {alerts > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-300 bg-red-500/15 px-2 py-1 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" /> {alerts} alerte{alerts > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Environnement surveillé
            </span>
          )}
          <span className={`flex items-center gap-1.5 font-mono text-sm font-bold px-2 py-1 rounded-lg ${lowTime ? "text-red-300 bg-red-500/15 animate-pulse" : "text-white bg-white/10"}`}>
            <Clock className="w-4 h-4" /> {mm}:{ss}
          </span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr]">
        {/* ── RAIL GAUCHE ── */}
        <aside className="hidden lg:flex flex-col bg-white border-r border-border lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] overflow-y-auto">
          {/* Infos examen */}
          <div className="p-4 border-b border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Examen</p>
            <p className="text-sm font-bold text-ink leading-snug mb-3">{exam?.title}</p>
            <div className="space-y-1.5 text-[11px]">
              <p className="flex items-center gap-1.5 text-muted"><BookOpen className="w-3.5 h-3.5 text-cama" /> {exam?.shuffle ? "Questions melangees" : "Ordre fixe"}</p>
              <p className="flex items-center gap-1.5 text-muted"><ListChecks className="w-3.5 h-3.5 text-cama" /> {questions.length} question{questions.length > 1 ? "s" : ""}</p>
              <p className="flex items-center gap-1.5 text-muted"><Layers className="w-3.5 h-3.5 text-cama" /> {totalPoints} point{totalPoints > 1 ? "s" : ""}</p>
              <p className="flex items-center gap-1.5 text-muted"><Clock className="w-3.5 h-3.5 text-cama" /> {exam?.duration_min} min</p>
            </div>
          </div>

          {/* Progression */}
          <div className="p-4 border-b border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Progression</p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-2xl font-black text-ink">{answered}</span>
              <span className="text-sm text-muted">/ {questions.length} répondues</span>
            </div>
            <div className="h-1.5 bg-surface border border-border overflow-hidden">
              <div className="h-full bg-cama transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Navigateur de questions */}
          <div className="p-4 border-b border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2.5">Navigateur</p>
            <div className="grid grid-cols-6 gap-1.5">
              {questions.map((qq, i) => (
                <button key={qq.id} onClick={() => setIdx(i)}
                  className={`aspect-square text-[11px] font-bold border transition-all ${
                    i === idx ? "bg-cama text-white border-cama" :
                    answers[qq.id] !== undefined ? "bg-cama-50 text-cama border-cama/30" :
                    "bg-white text-muted border-border hover:border-cama/40"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5 mt-3 text-[10px] text-muted">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-cama-50 border border-cama/30 inline-block" /> Répondue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-cama border border-cama inline-block" /> En cours</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-white border border-border inline-block" /> Vide</span>
            </div>
          </div>

          {/* Intégrité Safe-CAMA */}
          <div className="p-4 mt-auto">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Intégrité</p>
            <div className={`border p-3 ${alerts > 0 ? "border-red-200 bg-red-50" : "border-border bg-surface"}`}>
              <div className="flex items-center gap-2 mb-1">
                {alerts > 0 ? (
                  <><AlertTriangle className="w-3.5 h-3.5 text-red-500" /><span className="text-xs font-bold text-red-600">{alerts} alerte{alerts > 1 ? "s" : ""}</span></>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs font-bold text-ink">Aucune alerte</span></>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-[10px] text-muted">
                <Eye className="w-3 h-3" /> Environnement surveillé
              </p>
            </div>
          </div>
        </aside>

        {/* ── ZONE PRINCIPALE ── */}
        <main className="px-4 sm:px-8 py-6 max-w-[820px] w-full">
          {/* Barre de progression mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-muted whitespace-nowrap">{idx + 1}/{questions.length}</span>
            <div className="flex-1 h-1.5 bg-white border border-border overflow-hidden">
              <div className="h-full bg-cama" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
            </div>
            <span className="text-xs text-muted whitespace-nowrap">{answered} ok</span>
          </div>

          {q && (
            <div className="bg-white border border-border p-6 sm:p-8 mb-4">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-ink text-white text-xs font-black flex items-center justify-center">{idx + 1}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">Question {idx + 1} / {questions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${q.type === "qcm" ? "bg-cama-50 text-cama" : "bg-gold/10 text-gold-dark"}`}>
                    {q.type === "qcm" ? "Choix unique" : "Réponse libre"}
                  </span>
                  <span className="text-[11px] font-bold text-gold-dark">{q.points} pt{q.points > 1 ? "s" : ""}</span>
                </div>
              </div>

              <p className="text-base sm:text-lg text-ink font-medium mb-6 leading-relaxed">{q.text}</p>

              {q.type === "qcm" ? (
                <div className="space-y-2">
                  {q.options.map((o, oi) => (
                    <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={`w-full text-left flex items-center gap-3 p-3 border-2 transition-all ${
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
                  rows={7} placeholder="Votre réponse…"
                  className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-cama resize-y" />
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-border pt-4">
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
        </main>
      </div>
    </div>
  );
}
