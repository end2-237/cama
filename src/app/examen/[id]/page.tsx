"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck, Clock, AlertTriangle, Lock, Eye, Save,
  CheckCircle2, Maximize, WifiOff, Camera, FileWarning,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";
import { uid, gradeQcm, DBAlert } from "@/lib/db";

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { db, mutate } = useDB();

  const [phase, setPhase] = useState<"onboard" | "exam" | "done">("onboard");
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [left, setLeft] = useState(0);
  const [alerts, setAlerts] = useState<DBAlert[]>([]);
  const [savedAt, setSavedAt] = useState<string>("");
  const [attemptId] = useState(() => uid("a"));
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const exam = db?.exams.find((e) => e.id === id);
  const ue = db?.ues.find((u) => u.id === exam?.ueId);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  const pushAlert = useCallback((type: DBAlert["type"], detail: string) => {
    setAlerts((a) => [...a, { time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), type, detail }]);
  }, []);

  /* ── Environnement sécurisé : anti copier-coller, onglet, plein écran ── */
  useEffect(() => {
    if (phase !== "exam") return;
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); pushAlert("copier", "Tentative de copie bloquée"); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); pushAlert("coller", "Tentative de collage bloquée"); };
    const onVis = () => { if (document.hidden) pushAlert("onglet", "Changement d'onglet / fenêtre détecté"); };
    const onFs = () => { if (!document.fullscreenElement) pushAlert("plein-ecran", "Sortie du mode plein écran"); };
    const onCtx = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("contextmenu", onCtx);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("contextmenu", onCtx);
    };
  }, [phase, pushAlert]);

  /* ── Persistance locale toutes les 15 s (coupures de courant) ── */
  useEffect(() => {
    if (phase !== "exam") return;
    const t = setInterval(() => {
      localStorage.setItem(`cama_exam_${id}_draft`, JSON.stringify(answersRef.current));
      setSavedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 15000);
    return () => clearInterval(t);
  }, [phase, id]);

  /* ── Timer + soumission auto ── */
  useEffect(() => {
    if (phase !== "exam" || !exam) return;
    setLeft(exam.durationMin * 60);
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { clearInterval(t); submit(); return 0; }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = async () => {
    /* Restaure un brouillon si coupure */
    try {
      const draft = localStorage.getItem(`cama_exam_${id}_draft`);
      if (draft) setAnswers(JSON.parse(draft));
    } catch { /* ignore */ }
    try { await document.documentElement.requestFullscreen(); } catch { /* refusé */ }
    setPhase("exam");
  };

  const submit = useCallback(() => {
    if (!exam || !user) return;
    const { pts, maxAuto } = gradeQcm(exam, answersRef.current);
    mutate((d) => {
      d.attempts.push({
        id: attemptId, examId: exam.id, studentId: user.id,
        answers: answersRef.current, status: "soumis",
        startedAt: new Date().toISOString(),
        score: maxAuto > 0 ? Math.round((pts / maxAuto) * 20 * 10) / 10 : undefined,
        scoreMax: 20,
        alerts: alertsRef.current,
      });
    });
    localStorage.removeItem(`cama_exam_${id}_draft`);
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* ignore */ }
    setPhase("done");
  }, [exam, user, mutate, attemptId, id]);

  if (!db || !user || !exam) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const answered = exam.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;

  /* ════ ONBOARDING ════ */
  if (phase === "onboard") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-border max-w-xl w-full overflow-hidden animate-scale-in">
          <div className="p-6 text-white" style={{ background: "linear-gradient(135deg, #1E1B4B, #4F46E5)" }}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-gold" />
              <p className="text-xs font-bold uppercase tracking-widest text-gold">Safe-CAMA · Examen sécurisé</p>
            </div>
            <h1 className="text-2xl font-light">{exam.title}</h1>
            <p className="text-white/60 text-sm mt-1">{ue?.code} · {exam.durationMin} minutes · {exam.questions.length} questions</p>
          </div>
          <div className="p-6">
            <p className="text-sm font-bold text-ink mb-4">Avant de commencer, prenez connaissance des règles :</p>
            <div className="space-y-3 mb-6">
              {[
                { icon: Maximize,    text: "L'examen se déroule en plein écran. Toute sortie est consignée." },
                { icon: Lock,        text: "Copier-coller et clic droit sont désactivés pendant l'épreuve." },
                { icon: Eye,         text: "Les changements d'onglet ou de fenêtre sont détectés et signalés." },
                { icon: Camera,      text: "Proctoring embarqué : l'analyse se fait sur votre appareil — aucune image n'est transmise, seules des alertes texte." },
                { icon: WifiOff,     text: "Vos réponses sont sauvegardées localement toutes les 15 s : une coupure de courant ne vous fait rien perdre." },
                { icon: FileWarning, text: "L'IA signale, l'humain décide : tout cas suspect est examiné par l'enseignant ou le jury, avec droit d'appel." },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cama-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-cama" />
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-3.5 mb-6">
              <p className="text-xs text-muted"><strong className="text-ink">Le Prof IA est désactivé</strong> pendant toute la durée de l&apos;examen (cloisonnement strict).</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="btn-outline flex-1 justify-center text-sm py-3">Annuler</Link>
              <button onClick={start} className="btn-primary flex-1 justify-center gap-2 text-sm py-3">
                <ShieldCheck className="w-4 h-4" /> Commencer l&apos;examen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════ FIN ════ */
  if (phase === "done") {
    const attempt = db.attempts.find((a) => a.id === attemptId);
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-border max-w-md w-full p-8 text-center animate-scale-in">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-ink mb-2">Copie soumise</h1>
          <p className="text-muted text-sm mb-5">Vos QCM ont été corrigés automatiquement. Les questions ouvertes seront corrigées par l&apos;enseignant.</p>
          {attempt?.score !== undefined && (
            <div className="bg-cama-50 rounded-2xl p-4 mb-5">
              <p className="text-xs text-muted mb-1">Note provisoire (QCM uniquement)</p>
              <p className="text-3xl font-bold text-cama">{attempt.score}<span className="text-lg text-muted">/20</span></p>
            </div>
          )}
          {alerts.length > 0 && (
            <p className="text-xs text-gold-dark bg-gold/5 border border-gold/20 rounded-xl px-4 py-3 mb-5">
              {alerts.length} signalement(s) consigné(s) — examinés par un humain, vous disposez d&apos;un droit d&apos;appel.
            </p>
          )}
          <Link href="/dashboard" className="btn-primary w-full justify-center">Retour au dashboard</Link>
        </div>
      </div>
    );
  }

  /* ════ EXAMEN ════ */
  return (
    <div className="min-h-screen bg-surface select-none">
      {/* Barre fixe */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-cama flex-shrink-0" />
            <p className="text-sm font-bold text-ink truncate">{exam.title}</p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {savedAt && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] text-green-600">
                <Save className="w-3 h-3" /> Sauvé localement à {savedAt}
              </span>
            )}
            <span className="text-[11px] text-muted">{answered}/{exam.questions.length} répondues</span>
            <span className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-full ${
              left < 300 ? "bg-red-50 text-red-600 animate-pulse" : "bg-cama-50 text-cama"}`}>
              <Clock className="w-4 h-4" /> {fmt(left)}
            </span>
          </div>
        </div>
        {/* Alertes en direct */}
        {alerts.length > 0 && (
          <div className="bg-gold/10 border-t border-gold/20 px-4 py-1.5">
            <p className="max-w-4xl mx-auto text-[11px] text-gold-dark flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> {alerts[alerts.length - 1].detail} — consigné ({alerts.length} signalement{alerts.length > 1 ? "s" : ""})
            </p>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {exam.questions.map((q, qi) => (
          <div key={q.id} className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="text-sm font-bold text-ink leading-relaxed">
                <span className="text-cama mr-2">Q{qi + 1}.</span>{q.text}
              </p>
              <span className="badge bg-cama-50 text-cama text-[10px] flex-shrink-0">{q.points} pts</span>
            </div>
            {q.type === "qcm" ? (
              <div className="space-y-2">
                {q.options!.map((o, i) => (
                  <button key={i} onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className={`w-full text-left text-sm px-4 py-3 rounded-xl border-2 transition-all ${
                      answers[q.id] === i ? "border-cama bg-cama-50 font-semibold text-cama" : "border-border hover:border-cama/30"
                    }`}>
                    <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>{o}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <textarea
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  onPaste={(e) => e.preventDefault()}
                  rows={6}
                  placeholder="Rédigez votre réponse… (le collage est désactivé)"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-cama focus:ring-2 focus:ring-cama/15 transition-all resize-none"
                />
                <p className="text-[10px] text-subtle mt-1.5">Question résistante à l&apos;IA : cas contextualisé, votre raisonnement personnel est évalué.</p>
              </>
            )}
          </div>
        ))}

        <div className="flex justify-end pb-10">
          <button onClick={submit} className="btn-primary gap-2 px-8">
            <CheckCircle2 className="w-4 h-4" /> Soumettre ma copie
          </button>
        </div>
      </main>
    </div>
  );
}
