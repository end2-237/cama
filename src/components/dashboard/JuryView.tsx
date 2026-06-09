"use client";

import { useState } from "react";
import {
  Scale, CheckCircle2, AlertTriangle, Check, X, Gavel,
  FileText, Clock,
} from "lucide-react";
import { useDB } from "@/hooks/useDB";

const NAMES: Record<string, string> = {
  u1: "Jean-Paul Mbarga",
  u9: "Nadia Mbeki",
};

export default function JuryView({ tab }: { tab: string }) {
  if (tab === "Cas d'intégrité") return <IntegrityTab />;
  return <DeliberationTab />;
}

/* ════ DÉLIBÉRATIONS ════ */
function DeliberationTab() {
  const { db, mutate } = useDB();
  if (!db) return null;
  const pending = db.results.filter((r) => !r.validatedByJury);
  const done    = db.results.filter((r) => r.validatedByJury);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Scale className="w-7 h-7 text-ink" strokeWidth={1.5} />
        <h1 className="text-3xl font-light text-ink">Délibérations</h1>
      </div>

      <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">En attente de validation ({pending.length})</h2>
      <div className="space-y-3 mb-8">
        {pending.length === 0 && (
          <p className="bg-white border border-border rounded-2xl p-6 text-center text-sm text-muted">Aucun résultat en attente.</p>
        )}
        {pending.map((r) => {
          const ue = db.ues.find((u) => u.id === r.ueId);
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-bold text-ink">{NAMES[r.studentId] || r.studentId}</p>
                <p className="text-[11px] text-muted">{ue?.code} — {ue?.title} · {r.credits} ECTS</p>
              </div>
              <span className={`text-lg font-bold ${r.note >= 10 ? "text-green-600" : "text-red-500"}`}>{r.note}/20</span>
              <button
                onClick={() => mutate((d) => { const x = d.results.find((y) => y.id === r.id); if (x) x.validatedByJury = true; })}
                className="btn-primary py-2 px-4 text-xs gap-1.5">
                <Gavel className="w-3.5 h-3.5" /> Valider (décision humaine)
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">Validés ({done.length})</h2>
      <div className="bg-white rounded-2xl border border-border divide-y divide-border">
        {done.map((r) => {
          const ue = db.ues.find((u) => u.id === r.ueId);
          return (
            <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-ink flex-1">{NAMES[r.studentId] || r.studentId} — {ue?.code}</p>
              <span className="text-sm font-bold text-ink">{r.note}/20</span>
              <span className="badge bg-green-50 text-green-600 text-[10px]">Certifiable</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════ CAS D'INTÉGRITÉ ════ */
function IntegrityTab() {
  const { db } = useDB();
  const [decided, setDecided] = useState<Record<string, "ok" | "sanction">>({});
  if (!db) return null;
  const flagged = db.attempts.filter((a) => a.alerts.length > 0);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle className="w-7 h-7 text-ink" strokeWidth={1.5} />
        <h1 className="text-3xl font-light text-ink">Cas d&apos;intégrité</h1>
      </div>
      <p className="text-sm text-muted mb-6">
        Politique « human-in-the-loop » : l&apos;IA signale, le jury décide. L&apos;étudiant dispose d&apos;un droit d&apos;appel.
      </p>

      {flagged.length === 0 && (
        <p className="bg-white border border-border rounded-2xl p-6 text-center text-sm text-muted">Aucun cas signalé.</p>
      )}
      <div className="space-y-4">
        {flagged.map((a) => {
          const exam = db.exams.find((e) => e.id === a.examId);
          const verdict = decided[a.id];
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gold-dark" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-bold text-ink">{NAMES[a.studentId] || a.studentId}</p>
                  <p className="text-[11px] text-muted">{exam?.title}</p>
                </div>
                {a.score !== undefined && <span className="text-sm font-bold text-ink">{a.score}/20</span>}
              </div>

              <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 mb-4 space-y-1">
                {a.alerts.map((al, i) => (
                  <p key={i} className="text-[11px] text-gold-dark flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {al.time} — {al.detail}
                    <span className="text-[9px] bg-gold/15 px-1.5 rounded-full ml-auto uppercase">{al.type}</span>
                  </p>
                ))}
                <p className="text-[10px] text-muted italic pt-1">
                  Alerte texte uniquement — aucune image n&apos;a quitté l&apos;appareil de l&apos;étudiant (proctoring embarqué).
                </p>
              </div>

              {verdict ? (
                <p className={`text-sm font-bold flex items-center gap-2 ${verdict === "ok" ? "text-green-600" : "text-red-500"}`}>
                  {verdict === "ok"
                    ? <><CheckCircle2 className="w-4 h-4" /> Copie validée — signaux jugés non probants</>
                    : <><X className="w-4 h-4" /> Convocation disciplinaire — l&apos;étudiant peut faire appel</>}
                </p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setDecided((d) => ({ ...d, [a.id]: "ok" }))}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 text-xs font-bold text-green-600 border-2 border-green-200 rounded-xl py-2.5 hover:bg-green-50 transition-colors">
                    <Check className="w-4 h-4" /> Valider la copie
                  </button>
                  <button
                    onClick={() => setDecided((d) => ({ ...d, [a.id]: "sanction" }))}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 text-xs font-bold text-red-500 border-2 border-red-200 rounded-xl py-2.5 hover:bg-red-50 transition-colors">
                    <Gavel className="w-4 h-4" /> Convoquer l&apos;étudiant
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
