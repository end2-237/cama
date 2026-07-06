"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, GraduationCap, CheckCircle2, AlertCircle,
  Plus, X, Save, ChevronDown, ChevronRight, Trash2,
  CalendarClock, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import { supabase } from "@/lib/supabase";
import type { DBProgramCourse, DBSession, CycleMode } from "@/lib/supabase";
import { PARCOURS } from "@/lib/parcours";
import {
  fetchProgram, assignTeacher, updateHours, fetchAnalytics, fetchSessions,
  upsertSession, deleteSession, type ProgramAnalytics,
} from "@/lib/program";

interface Teacher { id: string; first_name: string; last_name: string; }

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];
const MODALITES = ["video", "pdf", "plateforme", "live"];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const EMPTY_COURSE: Partial<DBProgramCourse> = {
  code: "", title: "", ects: 3, hours: 30,
  modalites: ["video"], evaluation: "", annee_niveau: "L1", semestre: "S1",
};

export default function AdminProgrammePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [slug, setSlug]           = useState(PARCOURS[0]?.slug ?? "");
  const [niveau, setNiveau]       = useState("L1");
  const [courses, setCourses]     = useState<DBProgramCourse[]>([]);
  const [teachers, setTeachers]   = useState<Teacher[]>([]);
  const [sessions, setSessions]   = useState<DBSession[]>([]);
  const [analytics, setAnalytics] = useState<ProgramAnalytics | null>(null);
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);
  const [fetching, setFetching]   = useState(true);
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen]     = useState(false);
  const [newCourse, setNewCourse] = useState<Partial<DBProgramCourse>>(EMPTY_COURSE);
  const [saving, setSaving]       = useState(false);

  const parcours = PARCOURS.find((p) => p.slug === slug);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    supabase.from("users").select("id,first_name,last_name").eq("role", "enseignant")
      .then(({ data }) => setTeachers((data as Teacher[]) ?? []));
  }, []);

  const reload = async (s: string) => {
    setFetching(true);
    const cs = await fetchProgram(s);
    setCourses(cs);
    setSessions(await fetchSessions(cs.map((c) => c.id)));
    setAnalytics(await fetchAnalytics(s));
    setFetching(false);
  };

  useEffect(() => { if (slug) reload(slug); /* eslint-disable-next-line */ }, [slug]);

  const bySem = useMemo(() => {
    const filtered = courses.filter((c) => c.annee_niveau === niveau);
    const m: Record<string, DBProgramCourse[]> = {};
    filtered.forEach((c) => { (m[c.semestre] ??= []).push(c); });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b));
  }, [courses, niveau]);

  const onAssign = async (courseId: string, teacherId: string) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, teacher_id: teacherId || null } : c));
    await assignTeacher(courseId, teacherId || null);
    setAnalytics(await fetchAnalytics(slug));
  };

  const onHours = async (courseId: string, hours: number) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, hours } : c));
    await updateHours(courseId, hours);
  };

  const onEcts = async (courseId: string, ects: number) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, ects } : c));
    await supabase.from("program_courses").update({ ects }).eq("id", courseId);
  };

  const onPublish = async (courseId: string, published: boolean) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, published } : c));
    await supabase.from("program_courses").update({ published }).eq("id", courseId);
    setAnalytics(await fetchAnalytics(slug));
  };

  // Modes d'un créneau (présentiel / hybride / en ligne) — détermine quels
  // étudiants voient la séance dans leur emploi du temps selon leur cycle.
  const toggleSessionMode = async (s: DBSession, mode: CycleMode) => {
    const modes = s.modes?.includes(mode)
      ? s.modes.filter((m) => m !== mode)
      : [...(s.modes ?? []), mode];
    await patchSession(s, { modes });
  };

  const onDeleteCourse = async (courseId: string) => {
    if (!confirm("Supprimer cette matière et tout son contenu ?")) return;
    await supabase.from("program_courses").delete().eq("id", courseId);
    setMsg({ ok: true, text: "Matière supprimée." });
    reload(slug);
  };

  const toggleExpand = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  // ── Horaires ──
  const sessionsFor = (courseId: string) => sessions.filter((s) => s.program_course_id === courseId);

  const addSession = async (courseId: string) => {
    const { error } = await upsertSession({
      program_course_id: courseId,
      title: "Séance",
      day: "Lundi", start_time: "08h00", end_time: "10h00",
      kind: "campus", modes: ["presentiel", "hybride", "online"], status: "valide",
      academic_year: parcours ? `${new Date().getFullYear() - 1}–${new Date().getFullYear()}` : null,
      proposed_by: user?.id ?? null,
    });
    if (error) setMsg({ ok: false, text: error.message });
    else setSessions(await fetchSessions(courses.map((c) => c.id)));
  };

  const patchSession = async (s: DBSession, patch: Partial<DBSession>) => {
    setSessions((ss) => ss.map((x) => x.id === s.id ? { ...x, ...patch } : x));
    await upsertSession({ id: s.id, ...patch });
  };

  const removeSession = async (id: string) => {
    setSessions((ss) => ss.filter((x) => x.id !== id));
    await deleteSession(id);
  };

  const handleAdd = async () => {
    if (!newCourse.code || !newCourse.title) {
      setMsg({ ok: false, text: "Code et titre obligatoires." }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("program_courses").insert({
      ...newCourse,
      parcours_slug: slug,
      parcours_title: parcours?.title ?? slug,
    });
    setSaving(false);
    if (error) setMsg({ ok: false, text: error.message });
    else {
      setMsg({ ok: true, text: `Matière ${newCourse.code} ajoutée.` });
      setAddOpen(false);
      setNewCourse({ ...EMPTY_COURSE, annee_niveau: niveau });
      reload(slug);
    }
  };

  const toggleModalite = (m: string) => {
    setNewCourse((c) => {
      const cur = c.modalites ?? [];
      return { ...c, modalites: cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m] };
    });
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  return (
    <PageShell
      title="Programme académique"
      subtitle="Matières, affectations, horaires et publication par filière et niveau."
      icon={GraduationCap}
      breadcrumb="Programme académique"
      maxWidth="max-w-[1200px]"
      actions={
        <button onClick={() => { setAddOpen(true); setNewCourse({ ...EMPTY_COURSE, annee_niveau: niveau }); setMsg(null); }}
          className="flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-3 py-1.5 rounded-lg hover:bg-cama-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Ajouter une matière
        </button>
      }
      stats={analytics ? [
        { label: "Étudiants",       value: analytics.students,                             accent: "cama" },
        { label: "Matières",        value: analytics.matieres,                             accent: "ink" },
        { label: "Affectées",       value: `${analytics.assigned}/${analytics.matieres}`,  accent: "green" },
        { label: "Volume total",    value: `${analytics.totalHours}h`,                     accent: "gold" },
        { label: "Taux complétion", value: `${analytics.avgCompletion}%`,                  accent: "ink" },
      ] : undefined}
    >

        {msg && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4 ${
            msg.ok ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
            {msg.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* Sélecteur filière */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-[11px] font-black text-subtle uppercase tracking-widest">Filière</span>
          <select value={slug} onChange={(e) => { setSlug(e.target.value); setNiveau("L1"); }}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-cama font-semibold">
            {PARCOURS.map((p) => <option key={p.slug} value={p.slug}>{p.title} — {p.school}</option>)}
          </select>
        </div>

        {/* Onglets niveau */}
        <div className="flex gap-0.5 mb-5 bg-white border border-border rounded-xl p-1 w-fit">
          {NIVEAUX.map((n) => {
            const count = courses.filter((c) => c.annee_niveau === n).length;
            return (
              <button key={n} onClick={() => setNiveau(n)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  niveau === n ? "bg-cama text-white shadow-sm" : "text-muted hover:text-ink"}`}>
                {n} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Contenu */}
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : bySem.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center">
            <GraduationCap className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink mb-1">Aucune matière en {niveau}</p>
            <p className="text-xs text-muted mb-4">Ajoutez les matières de ce niveau, semestre par semestre.</p>
            <button onClick={() => { setAddOpen(true); setNewCourse({ ...EMPTY_COURSE, annee_niveau: niveau }); }}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-4 py-2 rounded-lg hover:bg-cama-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Ajouter une matière
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bySem.map(([sem, list]) => (
              <section key={sem}>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-[11px] font-black text-ink uppercase tracking-widest">
                    {sem} — Semestre {sem.replace("S", "")}
                  </h2>
                  <span className="text-[10px] text-muted">{list.length} matières · {list.reduce((a, c) => a + c.ects, 0)} ECTS · {list.reduce((a, c) => a + c.hours, 0)}h</span>
                </div>
                <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {list.map((c) => {
                    const stat = analytics?.perCourse[c.id];
                    const horaires = sessionsFor(c.id);
                    return (
                      <div key={c.id}>
                        {/* Ligne principale */}
                        <div className="flex flex-wrap items-center gap-3 p-3 hover:bg-surface/60 transition-colors">
                          <button onClick={() => toggleExpand(c.id)} className="flex-shrink-0 text-subtle hover:text-cama transition-colors">
                            {expanded[c.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div className="flex-1 min-w-[180px]">
                            <p className="text-sm font-bold text-ink">{c.code} · {c.title}</p>
                            <p className="text-[11px] text-muted">
                              {c.modalites.join(", ")} · {stat?.chapters ?? 0} chapitres
                              {horaires.length > 0 && <> · {horaires.length} séance(s)</>}
                              {stat && stat.chapters > 0 && <> · {stat.completion}% complété</>}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} max={30} value={c.ects}
                              onChange={(e) => onEcts(c.id, parseInt(e.target.value) || 0)}
                              className="w-12 border border-border rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-cama" />
                            <span className="text-[11px] text-muted">ECTS</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="number" min={0} value={c.hours}
                              onChange={(e) => onHours(c.id, parseInt(e.target.value) || 0)}
                              className="w-14 border border-border rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-cama" />
                            <span className="text-[11px] text-muted">h</span>
                          </div>
                          <select value={c.teacher_id ?? ""} onChange={(e) => onAssign(c.id, e.target.value)}
                            className={`border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-cama min-w-[160px] ${
                              c.teacher_id ? "border-green-300 text-green-700" : "border-border text-muted"}`}>
                            <option value="">— Affecter un enseignant —</option>
                            {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                          </select>
                          <button onClick={() => onPublish(c.id, !c.published)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors ${
                              c.published ? "border-green-300 bg-green-50 text-green-700" : "border-border text-muted hover:border-cama/40"}`}
                            title={c.published ? "Publié — visible par les étudiants de ce cycle" : "Brouillon — masqué aux étudiants"}>
                            {c.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {c.published ? "Publié" : "Brouillon"}
                          </button>
                          <button onClick={() => onDeleteCourse(c.id)} className="text-subtle hover:text-red-500 transition-colors p-1" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Panneau déroulant — horaires */}
                        {expanded[c.id] && (
                          <div className="px-10 pb-4 pt-2 bg-surface/40 border-t border-border">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-black text-ink uppercase tracking-widest flex items-center gap-1.5">
                                <CalendarClock className="w-3.5 h-3.5 text-cama" /> Horaires de la matière
                              </p>
                              <button onClick={() => addSession(c.id)}
                                className="text-[11px] font-bold text-cama hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Ajouter un créneau
                              </button>
                            </div>
                            {horaires.length === 0 ? (
                              <p className="text-[11px] text-muted italic">Aucun créneau défini. L&apos;enseignant pourra proposer un horaire si non pré-rempli.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {horaires.map((h) => (
                                  <div key={h.id} className="flex flex-wrap items-center gap-2 bg-white border border-border rounded-lg p-2">
                                    <select value={h.day ?? "Lundi"} onChange={(e) => patchSession(h, { day: e.target.value })}
                                      className="border border-border rounded px-2 py-1 text-xs outline-none focus:border-cama">
                                      {JOURS.map((j) => <option key={j}>{j}</option>)}
                                    </select>
                                    <input value={h.start_time ?? ""} onChange={(e) => patchSession(h, { start_time: e.target.value })}
                                      placeholder="08h00" className="w-16 border border-border rounded px-2 py-1 text-xs text-center outline-none focus:border-cama" />
                                    <span className="text-xs text-muted">→</span>
                                    <input value={h.end_time ?? ""} onChange={(e) => patchSession(h, { end_time: e.target.value })}
                                      placeholder="10h00" className="w-16 border border-border rounded px-2 py-1 text-xs text-center outline-none focus:border-cama" />
                                    <select value={h.kind} onChange={(e) => patchSession(h, { kind: e.target.value as DBSession["kind"] })}
                                      className="border border-border rounded px-2 py-1 text-xs outline-none focus:border-cama">
                                      <option value="campus">Campus</option>
                                      <option value="live">Live</option>
                                      <option value="async">Asynchrone</option>
                                      <option value="examen">Examen</option>
                                    </select>
                                    <input value={h.room ?? ""} onChange={(e) => patchSession(h, { room: e.target.value })}
                                      placeholder="Salle" className="w-24 border border-border rounded px-2 py-1 text-xs outline-none focus:border-cama" />
                                    <div className="flex items-center gap-1">
                                      {([["presentiel", "Prés."], ["hybride", "Hyb."], ["online", "Ligne"]] as const).map(([m, lbl]) => (
                                        <button key={m} onClick={() => toggleSessionMode(h, m)}
                                          title={`Visible en mode ${lbl}`}
                                          className={`text-[10px] font-bold px-1.5 py-1 rounded border transition-colors ${
                                            h.modes?.includes(m) ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/40"}`}>
                                          {lbl}
                                        </button>
                                      ))}
                                    </div>
                                    <button onClick={() => removeSession(h.id)} className="text-subtle hover:text-red-500 transition-colors ml-auto">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

      {/* Modal — Ajouter une matière */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-ink">Ajouter une matière</h2>
              <button onClick={() => setAddOpen(false)} className="text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-muted mb-4">Filière : <strong>{parcours?.title}</strong></p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Code *</label>
                  <input value={newCourse.code ?? ""} onChange={(e) => setNewCourse((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
                    placeholder="INF101" className="input-auth text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">ECTS</label>
                  <input type="number" min={0} value={newCourse.ects ?? 3}
                    onChange={(e) => setNewCourse((c) => ({ ...c, ects: parseInt(e.target.value) || 0 }))}
                    className="input-auth text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Intitulé *</label>
                <input value={newCourse.title ?? ""} onChange={(e) => setNewCourse((c) => ({ ...c, title: e.target.value }))}
                  placeholder="Algorithmique & Programmation" className="input-auth text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Niveau</label>
                  <select value={newCourse.annee_niveau ?? "L1"} onChange={(e) => setNewCourse((c) => ({ ...c, annee_niveau: e.target.value }))}
                    className="input-auth text-sm bg-white">
                    {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Semestre</label>
                  <select value={newCourse.semestre ?? "S1"} onChange={(e) => setNewCourse((c) => ({ ...c, semestre: e.target.value }))}
                    className="input-auth text-sm bg-white">
                    {["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Volume horaire (h)</label>
                <input type="number" min={0} value={newCourse.hours ?? 30}
                  onChange={(e) => setNewCourse((c) => ({ ...c, hours: parseInt(e.target.value) || 0 }))}
                  className="input-auth text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Modalités pédagogiques</label>
                <div className="flex flex-wrap gap-2">
                  {MODALITES.map((m) => {
                    const on = (newCourse.modalites ?? []).includes(m);
                    return (
                      <button key={m} type="button" onClick={() => toggleModalite(m)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${
                          on ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/50"}`}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Évaluation</label>
                <input value={newCourse.evaluation ?? ""} onChange={(e) => setNewCourse((c) => ({ ...c, evaluation: e.target.value }))}
                  placeholder="TP notés + examen final" className="input-auth text-sm" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setAddOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold text-muted hover:border-cama/30 transition-colors">
                Annuler
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 bg-cama text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-cama-700 disabled:opacity-60 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
