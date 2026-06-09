"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Users, PlusCircle, Edit3, ChevronDown,
  Radio, Bot, FileText, Video, MonitorPlay, ShieldCheck,
  AlertTriangle, Check, Eye, EyeOff, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDB } from "@/hooks/useDB";
import { uid } from "@/lib/db";

export default function TeacherView({ tab }: { tab: string }) {
  if (tab === "Évaluations") return <EvalTab />;
  if (tab === "Étudiants")   return <StudentsTab />;
  return <CoursesTab />;
}

/* ════ MES COURS (création + diffusion) ════ */
function CoursesTab() {
  const { db, mutate } = useDB();
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [ueId, setUeId] = useState("");
  if (!db || !user) return null;

  const myCourses = db.courses.filter((c) => c.teacherId === user.id || true);
  const liveNow = db.lives.find((l) => l.status === "encours");

  const create = () => {
    if (!title.trim() || !ueId) return;
    mutate((d) => {
      d.courses.push({ id: uid("c"), ueId, title: title.trim(), teacherId: user.id,
        published: false, profIA: false, description: "" });
    });
    setTitle(""); setShowNew(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-ink" strokeWidth={1.5} />
          <h1 className="text-3xl font-light text-ink">Mes Cours</h1>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary gap-2 py-2.5 px-5 text-sm rounded-xl">
          <PlusCircle className="w-4 h-4" /> Nouveau cours
        </button>
      </div>

      {liveNow && (
        <Link href={`/live/${liveNow.id}`}
          className="flex items-center gap-4 rounded-2xl p-4 mb-6 text-white"
          style={{ background: "linear-gradient(90deg, #7f1d1d, #dc2626)" }}>
          <Radio className="w-5 h-5 animate-pulse flex-shrink-0" />
          <p className="font-bold flex-1 truncate">Votre live « {liveNow.title} » est en cours</p>
          <span className="bg-white text-red-600 font-bold text-xs px-4 py-2 rounded-full flex-shrink-0">Entrer dans la salle</span>
        </Link>
      )}

      {showNew && (
        <div className="bg-white rounded-2xl border-2 border-cama/30 p-5 mb-6 animate-scale-in">
          <p className="text-sm font-bold text-ink mb-3">Créer un cours rattaché à une UE</p>
          <div className="flex gap-2 flex-wrap">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du cours…"
              className="flex-1 min-w-[200px] text-sm border border-border rounded-xl px-4 py-2.5 outline-none focus:border-cama" />
            <select value={ueId} onChange={(e) => setUeId(e.target.value)}
              className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none focus:border-cama bg-white">
              <option value="">Choisir l&apos;UE…</option>
              {db.ues.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.title}</option>)}
            </select>
            <button onClick={create} className="btn-primary py-2.5 px-5 text-sm">Créer</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {myCourses.map((c) => {
          const ue = db.ues.find((u) => u.id === c.ueId);
          const chs = db.chapters.filter((x) => x.courseId === c.id);
          const nStudents = 47;
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 flex-wrap hover:shadow-md hover:border-cama/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cama-50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-cama" />
              </div>
              <div className="flex-1 min-w-[220px]">
                <p className="text-[10px] text-subtle">{ue?.code} · {chs.length} chapitres</p>
                <p className="font-bold text-ink text-sm">{c.title}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {chs.some((m) => m.pdf) && <FileText className="w-3.5 h-3.5 text-gold-dark" />}
                  {chs.some((m) => m.video) && <Video className="w-3.5 h-3.5 text-cama" />}
                  {chs.some((m) => m.natif) && <MonitorPlay className="w-3.5 h-3.5 text-cama" />}
                  {chs.some((m) => m.liveId) && <Radio className="w-3.5 h-3.5 text-red-400" />}
                  {c.profIA && <Bot className="w-3.5 h-3.5 text-cama" />}
                  <span className="text-[10px] text-subtle ml-1 flex items-center gap-1"><Users className="w-3 h-3" /> {nStudents} étudiants</span>
                </div>
              </div>
              <span className={`badge text-[10px] ${c.published ? "bg-green-50 text-green-600" : "bg-surface text-muted"}`}>
                {c.published ? <><Eye className="w-3 h-3" /> Publié</> : <><EyeOff className="w-3 h-3" /> Brouillon</>}
              </span>
              <Link href={`/enseignant/cours/${c.id}`} className="btn-primary py-2 px-4 text-xs gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Gérer & diffuser
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════ ÉVALUATIONS (création + correction) ════ */
function EvalTab() {
  const { db, mutate } = useDB();
  const [open, setOpen] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [ueId, setUeId] = useState("");
  const [dur, setDur] = useState("45");
  if (!db) return null;

  const createExam = () => {
    if (!title.trim() || !ueId) return;
    mutate((d) => {
      d.exams.push({ id: uid("e"), ueId, title: title.trim(), date: new Date().toISOString(),
        durationMin: parseInt(dur) || 45, status: "planifie", questions: [] });
    });
    setTitle(""); setShowNew(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-ink" strokeWidth={1.5} />
          <h1 className="text-3xl font-light text-ink">Évaluations</h1>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary gap-2 py-2.5 px-5 text-sm rounded-xl">
          <PlusCircle className="w-4 h-4" /> Nouvel examen
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl border-2 border-cama/30 p-5 mb-6 animate-scale-in flex gap-2 flex-wrap">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'examen…"
            className="flex-1 min-w-[200px] text-sm border border-border rounded-xl px-4 py-2.5 outline-none focus:border-cama" />
          <select value={ueId} onChange={(e) => setUeId(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2.5 outline-none bg-white">
            <option value="">UE…</option>
            {db.ues.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
          </select>
          <input value={dur} onChange={(e) => setDur(e.target.value)} type="number" min="5" placeholder="Durée"
            className="w-24 text-sm border border-border rounded-xl px-3 py-2.5 outline-none" />
          <button onClick={createExam} className="btn-primary py-2.5 px-5 text-sm">Créer</button>
        </div>
      )}

      <div className="space-y-4">
        {db.exams.map((e) => {
          const ue = db.ues.find((u) => u.id === e.ueId);
          const attempts = db.attempts.filter((a) => a.examId === e.id);
          return (
            <div key={e.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="p-5 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[10px] text-subtle">{ue?.code} · {e.durationMin} min · {e.questions.length} questions</p>
                  <p className="font-bold text-ink text-sm">{e.title}</p>
                </div>
                <select
                  value={e.status}
                  onChange={(ev) => mutate((d) => { const x = d.exams.find((y) => y.id === e.id); if (x) x.status = ev.target.value as typeof e.status; })}
                  className={`text-xs font-bold rounded-full px-3 py-1.5 border-2 outline-none ${
                    e.status === "ouvert" ? "border-green-500 text-green-600 bg-green-50" : "border-border text-muted bg-white"}`}>
                  <option value="planifie">Planifié</option>
                  <option value="ouvert">Ouvert</option>
                  <option value="termine">Terminé</option>
                </select>
                <button onClick={() => setOpen(open === e.id ? null : e.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-cama border-2 border-cama/30 rounded-full px-3 py-1.5 hover:bg-cama-50 transition-colors">
                  {attempts.length} copie(s) <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open === e.id ? "rotate-180" : ""}`} />
                </button>
              </div>
              {open === e.id && (
                <div className="border-t border-border bg-surface p-5 space-y-3 animate-fade-up">
                  {attempts.length === 0 && <p className="text-sm text-muted text-center py-3">Aucune copie soumise pour le moment.</p>}
                  {attempts.map((a) => <AttemptCard key={a.id} attemptId={a.id} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttemptCard({ attemptId }: { attemptId: string }) {
  const { db, mutate } = useDB();
  const [note, setNote] = useState("");
  const [fb, setFb] = useState("");
  const a = db?.attempts.find((x) => x.id === attemptId);
  if (!db || !a) return null;
  const exam = db.exams.find((e) => e.id === a.examId);
  const studentName = a.studentId === "u1" ? "Jean-Paul Mbarga" : "Étudiant " + a.studentId;
  const open = exam?.questions.filter((q) => q.type === "ouverte") || [];

  const grade = () => {
    const n = parseFloat(note);
    if (isNaN(n)) return;
    mutate((d) => {
      const x = d.attempts.find((y) => y.id === attemptId);
      if (x) { x.status = "corrige"; x.score = Math.min(20, Math.max(0, n)); x.feedback = fb; }
      /* Pousse le résultat vers le jury */
      if (exam && !d.results.some((r) => r.studentId === a.studentId && r.ueId === exam.ueId)) {
        const ue = d.ues.find((u) => u.id === exam.ueId);
        d.results.push({ id: `r_${attemptId}`, studentId: a.studentId, ueId: exam.ueId,
          note: Math.min(20, Math.max(0, n)), credits: ue?.ects || 0, validatedByJury: false });
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <p className="text-sm font-bold text-ink flex-1">{studentName}</p>
        {a.alerts.length > 0 ? (
          <span className="badge bg-gold/10 text-gold-dark text-[10px]"><AlertTriangle className="w-3 h-3" /> {a.alerts.length} signalement(s)</span>
        ) : (
          <span className="badge bg-green-50 text-green-600 text-[10px]"><Check className="w-3 h-3" /> Aucun incident</span>
        )}
        <span className={`badge text-[10px] ${a.status === "corrige" ? "bg-green-50 text-green-600" : "bg-cama-50 text-cama"}`}>
          {a.status === "corrige" ? `Corrigé · ${a.score}/20` : `QCM auto : ${a.score ?? "—"}/20`}
        </span>
      </div>

      {a.alerts.length > 0 && (
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 mb-3 space-y-1">
          {a.alerts.map((al, i) => (
            <p key={i} className="text-[11px] text-gold-dark">⚠ {al.time} — {al.detail}</p>
          ))}
          <p className="text-[10px] text-muted italic">L&apos;IA signale, vous décidez — l&apos;étudiant dispose d&apos;un droit d&apos;appel.</p>
        </div>
      )}

      {open.map((q) => (
        <div key={q.id} className="mb-3">
          <p className="text-xs font-semibold text-ink mb-1">{q.text}</p>
          <p className="text-xs text-muted bg-surface rounded-lg p-3 leading-relaxed">
            {(a.answers[q.id] as string) || <em className="text-subtle">Pas de réponse</em>}
          </p>
        </div>
      ))}

      {a.status !== "corrige" && (
        <div className="flex gap-2 flex-wrap items-center pt-2 border-t border-border">
          <input value={note} onChange={(e) => setNote(e.target.value)} type="number" min="0" max="20" placeholder="Note /20"
            className="w-24 text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
          <input value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Feedback formatif (assisté IA hors examen)…"
            className="flex-1 min-w-[180px] text-xs border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
          <button onClick={grade} className="btn-primary py-2 px-4 text-xs gap-1"><Check className="w-3.5 h-3.5" /> Corriger & transmettre au jury</button>
        </div>
      )}
    </div>
  );
}

/* ════ ÉTUDIANTS ════ */
function StudentsTab() {
  const { db } = useDB();
  if (!db) return null;
  const students = [
    { id: "u1", name: "Jean-Paul Mbarga", level: "L2" },
    { id: "u9", name: "Nadia Mbeki",      level: "L2" },
    { id: "u10", name: "Oumarou Moussa",  level: "L2" },
  ];
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-7 h-7 text-ink" strokeWidth={1.5} />
        <h1 className="text-3xl font-light text-ink">Suivi des étudiants</h1>
      </div>
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {students.map((s) => {
          const done = db.progress.filter((p) => p.studentId === s.id).length;
          const total = db.chapters.length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const risk = pct < 20;
          return (
            <div key={s.id} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
              <div className="w-9 h-9 rounded-full bg-cama-50 text-cama flex items-center justify-center text-xs font-bold flex-shrink-0">
                {s.name.split(" ").map((x) => x[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{s.name} <span className="text-[10px] text-subtle">· {s.level}</span></p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${risk ? "bg-red-400" : "bg-cama"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted">{done}/{total} chapitres · {pct}%</span>
                </div>
              </div>
              {risk ? (
                <span className="badge bg-red-50 text-red-500 text-[10px]"><AlertTriangle className="w-3 h-3" /> Risque de décrochage</span>
              ) : (
                <span className="badge bg-green-50 text-green-600 text-[10px]"><TrendingUp className="w-3 h-3" /> En progression</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-subtle mt-3">Alerte décrochage : analytics prédictif basé sur la consultation horodatée des chapitres.</p>
    </div>
  );
}
