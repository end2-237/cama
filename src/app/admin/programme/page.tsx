"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, RefreshCw, Loader2, GraduationCap, CheckCircle2,
  AlertCircle, UserCheck, Plus, X, Save, ChevronDown, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { DBProgramCourse } from "@/lib/supabase";
import { PARCOURS } from "@/lib/parcours";
import { fetchProgram, syncProgram, assignTeacher, updateHours } from "@/lib/program";

interface Teacher { id: string; first_name: string; last_name: string; }

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];
const MODALITES = ["video", "pdf", "plateforme", "live"];

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
  const [busy, setBusy]           = useState(false);
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
    setCourses(await fetchProgram(s));
    setFetching(false);
  };

  useEffect(() => { if (slug) reload(slug); }, [slug]);

  // Groupes : niveau → semestre → matières
  const bySem = useMemo(() => {
    const filtered = courses.filter((c) => c.annee_niveau === niveau);
    const m: Record<string, DBProgramCourse[]> = {};
    filtered.forEach((c) => { (m[c.semestre] ??= []).push(c); });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b));
  }, [courses, niveau]);

  const stats = useMemo(() => {
    const inNiveau = courses.filter((c) => c.annee_niveau === niveau);
    return {
      total: inNiveau.length,
      assigned: inNiveau.filter((c) => c.teacher_id).length,
      ects: inNiveau.reduce((a, c) => a + c.ects, 0),
      hours: inNiveau.reduce((a, c) => a + c.hours, 0),
    };
  }, [courses, niveau]);

  const handleSync = async () => {
    setBusy(true); setMsg(null);
    const { count, error } = await syncProgram();
    setBusy(false);
    if (error) setMsg({ ok: false, text: `Erreur : ${error}` });
    else { setMsg({ ok: true, text: `${count} matières synchronisées depuis le catalogue.` }); reload(slug); }
  };

  const onAssign = async (courseId: string, teacherId: string) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, teacher_id: teacherId || null } : c));
    await assignTeacher(courseId, teacherId || null);
  };

  const onHours = async (courseId: string, hours: number) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, hours } : c));
    await updateHours(courseId, hours);
  };

  const onEcts = async (courseId: string, ects: number) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, ects } : c));
    await supabase.from("program_courses").update({ ects }).eq("id", courseId);
  };

  const toggleExpand = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handleAdd = async () => {
    if (!newCourse.code || !newCourse.title) {
      setMsg({ ok: false, text: "Code et titre obligatoires." }); return;
    }
    setSaving(true);
    const row = {
      ...newCourse,
      parcours_slug: slug,
      parcours_title: parcours?.title ?? slug,
    };
    const { error } = await supabase.from("program_courses").insert(row);
    setSaving(false);
    if (error) setMsg({ ok: false, text: error.message });
    else {
      setMsg({ ok: true, text: `Matière ${newCourse.code} ajoutée.` });
      setAddOpen(false);
      setNewCourse(EMPTY_COURSE);
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
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-cama" /> Programme académique
          </span>
          <div className="flex-1" />
          <button onClick={() => { setAddOpen(true); setMsg(null); }}
            className="flex items-center gap-1.5 text-xs font-bold border border-cama text-cama px-3 py-1.5 rounded-lg hover:bg-cama hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Ajouter une matière
          </button>
          <button onClick={handleSync} disabled={busy}
            className="flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-3 py-1.5 rounded-lg hover:bg-cama-700 disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sync catalogue
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5">

        {msg && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4 ${
            msg.ok ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
            {msg.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* Sélecteur filière */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={slug} onChange={(e) => { setSlug(e.target.value); setNiveau("L1"); }}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-cama font-semibold">
            {PARCOURS.map((p) => <option key={p.slug} value={p.slug}>{p.title} — {p.school}</option>)}
          </select>
          <div className="text-xs text-muted flex items-center gap-3">
            <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-cama" /> {stats.assigned}/{stats.total} assignées</span>
            <span>{stats.ects} ECTS</span>
            <span>{stats.hours}h</span>
          </div>
        </div>

        {/* Onglets niveau */}
        <div className="flex gap-0.5 mb-5 bg-white border border-border rounded-xl p-1 w-fit">
          {NIVEAUX.map((n) => {
            const count = courses.filter((c) => c.annee_niveau === n).length;
            return (
              <button key={n} onClick={() => setNiveau(n)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  niveau === n
                    ? "bg-cama text-white shadow-sm"
                    : "text-muted hover:text-ink"
                }`}>
                {n} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Contenu */}
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : courses.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center">
            <GraduationCap className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink mb-1">Programme vide</p>
            <p className="text-xs text-muted mb-4">Cliquez sur <strong>Sync catalogue</strong> pour importer toutes les matières de cette filière, ou ajoutez-les manuellement.</p>
            <button onClick={handleSync} disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-4 py-2 rounded-lg hover:bg-cama-700 transition-colors">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Synchroniser depuis le catalogue
            </button>
          </div>
        ) : bySem.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-6 text-center text-sm text-muted">
            Aucune matière pour le niveau {niveau} dans cette filière.
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
                  {list.map((c) => (
                    <div key={c.id}>
                      {/* Ligne principale */}
                      <div className="flex flex-wrap items-center gap-3 p-3 hover:bg-surface/60 transition-colors">
                        <button onClick={() => toggleExpand(c.id)} className="flex-shrink-0 text-subtle hover:text-cama transition-colors">
                          {expanded[c.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {/* Infos matière */}
                        <div className="flex-1 min-w-[180px]">
                          <p className="text-sm font-bold text-ink">{c.code} · {c.title}</p>
                          <p className="text-[11px] text-muted">{c.modalites.join(", ")} · {c.evaluation ?? "—"}</p>
                        </div>

                        {/* ECTS */}
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} max={30} value={c.ects}
                            onChange={(e) => onEcts(c.id, parseInt(e.target.value) || 0)}
                            className="w-12 border border-border rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-cama" />
                          <span className="text-[11px] text-muted">ECTS</span>
                        </div>

                        {/* Heures */}
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} value={c.hours}
                            onChange={(e) => onHours(c.id, parseInt(e.target.value) || 0)}
                            className="w-14 border border-border rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-cama" />
                          <span className="text-[11px] text-muted">h</span>
                        </div>

                        {/* Assignation enseignant */}
                        <select value={c.teacher_id ?? ""} onChange={(e) => onAssign(c.id, e.target.value)}
                          className={`border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-cama min-w-[160px] ${
                            c.teacher_id ? "border-green-300 text-green-700" : "border-border text-muted"}`}>
                          <option value="">— Affecter un enseignant —</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Panneau déroulant — détails */}
                      {expanded[c.id] && (
                        <div className="px-10 pb-4 pt-1 bg-surface/40 text-xs text-muted space-y-1 border-t border-border">
                          <p><span className="font-semibold text-ink">Modalités :</span> {c.modalites.join(", ")}</p>
                          <p><span className="font-semibold text-ink">Évaluation :</span> {c.evaluation ?? "—"}</p>
                          <p><span className="font-semibold text-ink">Contenu :</span> {c.published ? "Publié" : "Non publié"} · {c.description ? "Description renseignée" : "Pas encore de description (enseignant)"}</p>
                          {c.teacher_id && (
                            <p><span className="font-semibold text-ink">Enseignant :</span> {
                              (() => { const t = teachers.find((x) => x.id === c.teacher_id); return t ? `${t.first_name} ${t.last_name}` : c.teacher_id; })()
                            }</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Modal — Ajouter une matière */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-ink">Ajouter une matière</h2>
              <button onClick={() => setAddOpen(false)} className="text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

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
    </div>
  );
}
