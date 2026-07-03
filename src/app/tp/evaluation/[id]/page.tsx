"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Monitor, Users, Clock, Award, X, Check, XCircle,
  ExternalLink, Star, Loader2, FileText, LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTp, fetchTpSessions, fetchTpProgress, fetchTpGrades, saveTpGrade, fetchMachines,
  type DBCourseTp, type DBTpSession, type DBTpProgress, type DBTpGrade,
} from "@/lib/tp";
import { fetchUsers } from "@/lib/admin";
import type { DBRemoteMachine, DBUser } from "@/lib/supabase";

const MAX_SCREENS = 4;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function duration(s: DBTpSession): string {
  if (!s.ended_at) return "en cours";
  const min = Math.max(1, Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000));
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

export default function TpEvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [tp, setTp] = useState<DBCourseTp | null>(null);
  const [machine, setMachine] = useState<DBRemoteMachine | null>(null);
  const [sessions, setSessions] = useState<DBTpSession[]>([]);
  const [progress, setProgress] = useState<DBTpProgress[]>([]);
  const [grades, setGrades] = useState<DBTpGrade[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [ready, setReady] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [appreciation, setAppreciation] = useState("");
  const [saving, setSaving] = useState(false);

  // Auth : enseignants et admins uniquement
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (user.role !== "enseignant" && user.role !== "admin") router.replace("/dashboard");
  }, [loading, user, router]);

  const loadGrades = useCallback(async () => setGrades(await fetchTpGrades(id)), [id]);

  useEffect(() => {
    if (!user || (user.role !== "enseignant" && user.role !== "admin")) return;
    (async () => {
      const [t, s, p, g, u] = await Promise.all([
        fetchTp(id), fetchTpSessions(id), fetchTpProgress(id), fetchTpGrades(id), fetchUsers(),
      ]);
      setTp(t); setSessions(s); setProgress(p); setGrades(g); setUsers(u);
      if (t?.machine_id) {
        const machines = await fetchMachines();
        setMachine(machines.find((m) => m.id === t.machine_id) ?? null);
      }
      setReady(true);
    })();
  }, [id, user]);

  // Roster : union des étudiants ayant progression ou sessions
  const studentIds = useMemo(() => {
    const set = new Set<string>();
    progress.forEach((p) => set.add(p.student_id));
    sessions.forEach((s) => set.add(s.student_id));
    return Array.from(set);
  }, [progress, sessions]);

  const nameOf = useCallback((sid: string) => {
    const u = users.find((x) => x.id === sid);
    return u ? `${u.first_name} ${u.last_name}` : "Étudiant inconnu";
  }, [users]);

  const nAct = tp?.activities.length ?? 0;
  const progressOf = (sid: string) => progress.find((p) => p.student_id === sid);
  const sessionsOf = (sid: string) => sessions.filter((s) => s.student_id === sid);
  const gradeOf = (sid: string) => grades.find((g) => g.student_id === sid && g.note !== null);

  const roster = useMemo(
    () => studentIds
      .map((sid) => ({ sid, name: nameOf(sid) }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [studentIds, nameOf],
  );

  const gradedCount = studentIds.filter((sid) => gradeOf(sid)).length;

  function toggle(sid: string) {
    setSelected((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid)
      : prev.length >= MAX_SCREENS ? prev : [...prev, sid]);
  }

  function openGrading(sid: string) {
    const g = grades.find((x) => x.student_id === sid);
    setNote(g?.note != null ? String(g.note) : "");
    setAppreciation(g?.appreciation ?? "");
    setGradingId(sid);
  }

  async function handleSave() {
    if (!user || !gradingId) return;
    const n = Number(note.replace(",", "."));
    if (Number.isNaN(n) || n < 0 || n > 20) return;
    setSaving(true);
    await saveTpGrade(id, gradingId, n, appreciation, user.id);
    await loadGrades();
    setSaving(false);
    setGradingId(null);
  }

  if (loading || !user || (user.role !== "enseignant" && user.role !== "admin") || !ready) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cama animate-spin" />
      </div>
    );
  }

  if (!tp) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <p className="text-muted font-medium">TP introuvable.</p>
        <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-ink text-white text-sm font-bold">
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  const gradingProgress = gradingId ? progressOf(gradingId) : undefined;
  const gradingSessions = gradingId ? sessionsOf(gradingId) : [];
  const gradingPct = nAct > 0 && gradingProgress ? Math.round((gradingProgress.done.length / nAct) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* En-tête sombre — salle de contrôle */}
      <header className="bg-ink text-white sticky top-0 z-40 border-b border-white/10">
        <div className="px-4 sm:px-6 flex items-center gap-3 h-14">
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : router.push("/dashboard"))}
            className="flex items-center gap-1 text-xs font-bold text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>
          <span className="text-white/20">|</span>
          <LayoutGrid className="w-4 h-4 text-gold flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-black truncate">{tp.title}</p>
            {machine && (
              <p className="text-[10px] text-white/50 flex items-center gap-1 truncate">
                <Monitor className="w-3 h-3" /> {machine.name}
              </p>
            )}
          </div>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-white/10 px-2.5 py-1">
              <Users className="w-3.5 h-3.5 text-cama-300" /> {studentIds.length} étudiant{studentIds.length > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-white/10 px-2.5 py-1">
              <Clock className="w-3.5 h-3.5 text-gold" /> {sessions.length} session{sessions.length > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold bg-white/10 px-2.5 py-1">
              <Award className="w-3.5 h-3.5 text-green-400" /> {gradedCount} noté{gradedCount > 1 ? "s" : ""}
            </span>
          </div>
          <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest text-gold">
            Fenêtre d&apos;évaluation multi-écran
          </span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Rail gauche — roster */}
        <aside className="w-[280px] flex-shrink-0 bg-white border-r border-border overflow-y-auto">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Étudiants</p>
            <p className="text-[11px] text-subtle mt-0.5">
              {selected.length}/{MAX_SCREENS} écran{selected.length > 1 ? "s" : ""} affiché{selected.length > 1 ? "s" : ""}
            </p>
          </div>
          {roster.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted">Aucun étudiant n&apos;a encore travaillé sur ce TP.</p>
          ) : (
            roster.map(({ sid, name }) => {
              const p = progressOf(sid);
              const done = p?.done.length ?? 0;
              const g = gradeOf(sid);
              const nSess = sessionsOf(sid).length;
              const checked = selected.includes(sid);
              const disabled = !checked && selected.length >= MAX_SCREENS;
              return (
                <div key={sid} className={`px-4 py-3 border-b border-border ${checked ? "bg-cama-50" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink truncate">{name}</p>
                    {g ? (
                      <span className="text-[10px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 flex-shrink-0">
                        {g.note}/20
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-gold-dark bg-gold-light px-1.5 py-0.5 flex-shrink-0">
                        À évaluer
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-border">
                      <div className="h-full bg-cama" style={{ width: nAct ? `${(done / nAct) * 100}%` : "0%" }} />
                    </div>
                    <span className="text-[10px] font-bold text-muted">{done}/{nAct}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-subtle">{nSess} session{nSess > 1 ? "s" : ""}</span>
                    <label className={`flex items-center gap-1 text-[10px] font-bold ${disabled ? "text-subtle cursor-not-allowed" : "text-cama cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(sid)}
                        className="accent-cama"
                      />
                      afficher
                    </label>
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Zone multi-écran */}
        <main className="flex-1 p-4 overflow-y-auto">
          {roster.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
              <Users className="w-10 h-10 text-subtle" />
              <p className="font-bold text-ink">Aucun travail étudiant pour l&apos;instant</p>
              <p className="text-sm text-muted max-w-sm">
                Dès qu&apos;un étudiant coche des activités ou ouvre une session sur la machine, il apparaîtra ici.
              </p>
            </div>
          ) : selected.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
              <LayoutGrid className="w-10 h-10 text-subtle" />
              <p className="font-bold text-ink">Multi-écran vide</p>
              <p className="text-sm text-muted max-w-sm">
                Cochez «&nbsp;afficher&nbsp;» sur un étudiant dans la liste de gauche pour ouvrir son écran de travail
                (jusqu&apos;à {MAX_SCREENS} en simultané).
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${selected.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
              {selected.map((sid) => {
                const p = progressOf(sid);
                const done = p?.done ?? [];
                const sess = sessionsOf(sid);
                return (
                  <div key={sid} className="bg-white border border-border flex flex-col">
                    {/* En-tête panneau */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-charcoal text-white">
                      <p className="text-sm font-black truncate">{nameOf(sid)}</p>
                      <span className="text-[10px] font-bold text-white/60">{done.length}/{nAct} activités</span>
                      <div className="flex-1" />
                      <button onClick={() => toggle(sid)} className="text-white/60 hover:text-white" aria-label="Fermer l'écran">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 space-y-4 flex-1">
                      {/* Activités */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Activités</p>
                        {nAct === 0 ? (
                          <p className="text-xs text-subtle">Aucune activité définie pour ce TP.</p>
                        ) : (
                          <ul className="space-y-1">
                            {tp.activities.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                {done.includes(i) ? (
                                  <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-subtle flex-shrink-0 mt-0.5" />
                                )}
                                <span className={done.includes(i) ? "text-ink" : "text-muted"}>{a}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Sessions */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">
                          Sessions ({sess.length})
                        </p>
                        {sess.length === 0 ? (
                          <p className="text-xs text-subtle">Aucune session sur la machine.</p>
                        ) : (
                          <div className="space-y-2">
                            {sess.map((s) => (
                              <div key={s.id} className="border border-border p-2.5">
                                <div className="flex items-center gap-2 text-[11px] text-muted">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-bold">{fmtDate(s.started_at)}</span>
                                  <span>·</span>
                                  <span>{duration(s)}</span>
                                </div>
                                {s.report && (
                                  <div className="mt-1.5 max-h-32 overflow-y-auto bg-surface p-2 text-xs text-ink whitespace-pre-wrap">
                                    <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-muted mb-1">
                                      <FileText className="w-3 h-3" /> Compte-rendu
                                    </p>
                                    {s.report}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 border-t border-border flex items-center gap-2">
                      {machine?.web_url && (
                        <a
                          href={machine.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border text-ink hover:bg-surface transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Visiter la machine
                        </a>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => openGrading(sid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-gold text-white hover:bg-gold-dark transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" /> Apprécier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Tiroir d'appréciation */}
      {gradingId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/50" onClick={() => !saving && setGradingId(null)}>
          <div className="w-full max-w-md bg-white h-full overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 bg-ink text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gold">Appréciation</p>
                <p className="text-sm font-black">{nameOf(gradingId)}</p>
              </div>
              <button onClick={() => setGradingId(null)} className="text-white/60 hover:text-white" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Récapitulatif */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-border p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">Activités</p>
                  <p className="text-xl font-black text-ink mt-1">{gradingPct}%</p>
                  <p className="text-[11px] text-subtle">{gradingProgress?.done.length ?? 0}/{nAct} réalisées</p>
                </div>
                <div className="border border-border p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">Sessions</p>
                  <p className="text-xl font-black text-ink mt-1">{gradingSessions.length}</p>
                  <p className="text-[11px] text-subtle">sur la machine</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-muted mb-1.5">Note / 20</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-32 border border-border px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:border-cama"
                  placeholder="ex. 15"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wide text-muted mb-1.5">Appréciation</label>
                <textarea
                  value={appreciation}
                  onChange={(e) => setAppreciation(e.target.value)}
                  rows={6}
                  className="w-full border border-border px-3 py-2 text-sm text-ink focus:outline-none focus:border-cama resize-y"
                  placeholder="Commentaire sur le travail de l'étudiant…"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">
              <button
                onClick={() => setGradingId(null)}
                disabled={saving}
                className="px-4 py-2 text-sm font-bold text-muted hover:text-ink transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || note.trim() === "" || Number.isNaN(Number(note.replace(",", "."))) || Number(note.replace(",", ".")) < 0 || Number(note.replace(",", ".")) > 20}
                className="flex items-center gap-2 px-4 py-2 text-sm font-black bg-gold text-white hover:bg-gold-dark transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Enregistrer la note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
