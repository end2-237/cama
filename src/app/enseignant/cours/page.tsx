"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, BookOpen, CheckCircle2, Plus, Trash2, Save,
  Bot, FileText, Clock, ChevronRight, CalendarClock, AlertTriangle, ArrowUpDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import { supabase } from "@/lib/supabase";
import type { DBProgramCourse, DBChapter, DBSession } from "@/lib/supabase";
import {
  fetchTeacherCourses, updateCourseContent, fetchChapters, addChapter,
  deleteChapter, fetchSessions, upsertSession,
} from "@/lib/program";

type SortKey = "filiere" | "semestre" | "recent";

export default function TeacherCoursesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses]   = useState<DBProgramCourse[]>([]);
  const [fetching, setFetching] = useState(true);
  const [sort, setSort]         = useState<SortKey>("filiere");
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<DBProgramCourse | null>(null);
  const [chapters, setChapters] = useState<DBChapter[]>([]);
  const [sessions, setSessions] = useState<DBSession[]>([]);
  const [newChapter, setNewChapter] = useState("");
  const [saving, setSaving]     = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Champs édition contenu
  const [desc, setDesc]       = useState("");
  const [objectives, setObj]  = useState("");
  const [difficulte, setDiff] = useState("");
  const [profIa, setProfIa]   = useState(false);
  const [published, setPub]   = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "enseignant" && user.role !== "admin"))) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const c = await fetchTeacherCourses(user.id);
      setCourses(c);
      setFetching(false);
      // Compte des chapitres par matière (pour les alertes "à compléter")
      if (c.length) {
        const { data } = await supabase.from("course_chapters")
          .select("program_course_id").in("program_course_id", c.map((x) => x.id));
        const counts: Record<string, number> = {};
        (data as { program_course_id: string }[] | null)?.forEach((r) => {
          counts[r.program_course_id] = (counts[r.program_course_id] ?? 0) + 1;
        });
        setChapterCounts(counts);
      }
    })();
  }, [user]);

  // Tri + alertes
  const sortedCourses = [...courses].sort((a, b) => {
    if (sort === "filiere") return a.parcours_title.localeCompare(b.parcours_title) || a.semestre.localeCompare(b.semestre);
    if (sort === "semestre") return a.semestre.localeCompare(b.semestre) || a.ordre - b.ordre;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const courseAlert = (c: DBProgramCourse): string | null => {
    if ((chapterCounts[c.id] ?? 0) === 0) return "Aucun chapitre — à compléter";
    if (!c.published) return "Brouillon — non visible des étudiants";
    return null;
  };
  const alertCount = courses.filter((c) => courseAlert(c)).length;

  const openCourse = async (c: DBProgramCourse) => {
    setSelected(c);
    setDesc(c.description ?? "");
    setObj((c.objectives ?? []).join("\n"));
    setDiff(c.difficulte ?? "");
    setProfIa(c.prof_ia);
    setPub(c.published);
    setChapters(await fetchChapters(c.id));
    setSessions(await fetchSessions([c.id]));
  };

  const saveContent = async () => {
    if (!selected) return;
    setSaving(true);
    const patch = {
      description: desc,
      objectives: objectives.split("\n").map((s) => s.trim()).filter(Boolean),
      difficulte: difficulte || null,
      prof_ia: profIa,
      published,
    };
    await updateCourseContent(selected.id, patch);
    setCourses((cs) => cs.map((c) => c.id === selected.id ? { ...c, ...patch } as DBProgramCourse : c));
    setSelected((s) => s ? { ...s, ...patch } as DBProgramCourse : s);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const onAddChapter = async () => {
    if (!selected || !newChapter.trim()) return;
    await addChapter(selected.id, newChapter.trim(), chapters.length);
    setNewChapter("");
    setChapters(await fetchChapters(selected.id));
  };

  const onDelChapter = async (id: string) => {
    await deleteChapter(id);
    setChapters((cs) => cs.filter((c) => c.id !== id));
  };

  const proposeSession = async () => {
    if (!selected) return;
    await upsertSession({
      program_course_id: selected.id, title: "Créneau proposé",
      day: "Lundi", start_time: "08h00", end_time: "10h00",
      kind: "campus", modes: [], status: "propose", proposed_by: user?.id ?? null,
    });
    setSessions(await fetchSessions([selected.id]));
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const publishedCount = courses.filter((c) => c.published).length;

  return (
    <PageShell
      title="Mes matières"
      subtitle="Rédigez le contenu, les chapitres et les horaires des matières qui vous sont assignées."
      icon={BookOpen}
      breadcrumb="Mes matières"
      maxWidth="max-w-[1200px]"
      stats={[
        { label: "Matières", value: courses.length, accent: "cama" },
        { label: "Publiées", value: publishedCount, accent: "green" },
        { label: "Brouillons", value: courses.length - publishedCount, accent: "gold" },
        { label: "À traiter", value: alertCount, accent: alertCount ? "gold" : "green" },
      ]}
    >
      <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">

        {/* Liste matières assignées */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-black text-ink uppercase tracking-widest">Matières assignées ({courses.length})</h2>
            {alertCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" /> {alertCount} à traiter
              </span>
            )}
          </div>

          {/* Tri */}
          <div className="flex items-center gap-1 mb-2 bg-white border border-border rounded-lg p-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-subtle ml-1.5 flex-shrink-0" />
            {([["filiere", "Filière"], ["semestre", "Semestre"], ["recent", "Récent"]] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => setSort(k)}
                className={`flex-1 text-[11px] font-bold py-1 rounded transition-colors ${sort === k ? "bg-cama text-white" : "text-muted hover:text-ink"}`}>
                {lbl}
              </button>
            ))}
          </div>

          {fetching ? (
            <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
          ) : courses.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-6 text-center text-xs text-muted">
              Aucune matière ne vous est encore assignée. L&apos;administration affecte les matières depuis le programme.
            </div>
          ) : (
            <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
              {sortedCourses.map((c) => {
                const alert = courseAlert(c);
                return (
                <button key={c.id} onClick={() => openCourse(c)}
                  className={`w-full text-left p-3 hover:bg-cama-50/40 transition-colors flex items-center gap-2 ${
                    selected?.id === c.id ? "bg-cama-50/60" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink">{c.code} · {c.title}</p>
                    <p className="text-[11px] text-muted">{c.parcours_title} · {c.annee_niveau} · {c.semestre} · {chapterCounts[c.id] ?? 0} chap.</p>
                    {alert && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3 flex-shrink-0" /> {alert}</p>
                    )}
                  </div>
                  {c.published
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full">Publié</span>
                    : <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark rounded-full">Brouillon</span>}
                  <ChevronRight className="w-3.5 h-3.5 text-subtle" />
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Éditeur de contenu */}
        {!selected ? (
          <div className="bg-white border border-border rounded-xl p-10 text-center text-sm text-muted">
            Sélectionnez une matière pour créer son contenu.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-ink">{selected.code} · {selected.title}</h2>
                  <p className="text-[11px] text-muted">{selected.ects} ECTS · {selected.hours}h · {selected.modalites.join(", ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {savedMsg && <span className="text-[11px] text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Enregistré</span>}
                  <button onClick={saveContent} disabled={saving}
                    className="flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-3 py-1.5 rounded-lg hover:bg-cama-700 disabled:opacity-60 transition-colors">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Enregistrer
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Description du cours</label>
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                    placeholder="Présentez le contenu, l'approche, le déroulé du cours…"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-cama resize-y" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Objectifs pédagogiques (1 par ligne)</label>
                  <textarea value={objectives} onChange={(e) => setObj(e.target.value)} rows={3}
                    placeholder={"Comprendre les structures de données\nMaîtriser la complexité algorithmique"}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-cama resize-y" />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-ink">Difficulté</label>
                    <select value={difficulte} onChange={(e) => setDiff(e.target.value)}
                      className="border border-border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-cama">
                      <option value="">—</option>
                      <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                    <input type="checkbox" checked={profIa} onChange={(e) => setProfIa(e.target.checked)} className="accent-cama" />
                    <Bot className="w-3.5 h-3.5 text-cama" /> Prof IA activé
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                    <input type="checkbox" checked={published} onChange={(e) => setPub(e.target.checked)} className="accent-cama" />
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Publier (visible étudiants)
                  </label>
                </div>
              </div>
            </div>

            {/* Chapitres */}
            <div className="bg-white border border-border rounded-xl p-4">
              <h3 className="text-[11px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cama" /> Chapitres ({chapters.length})
              </h3>
              <div className="flex gap-2 mb-3">
                <input value={newChapter} onChange={(e) => setNewChapter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onAddChapter()}
                  placeholder="Titre du nouveau chapitre…"
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-cama" />
                <button onClick={onAddChapter}
                  className="flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-3 py-2 rounded-lg hover:bg-cama-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
              {chapters.length === 0 ? (
                <p className="text-xs text-muted italic">Aucun chapitre. Ajoutez le premier chapitre du cours.</p>
              ) : (
                <div className="border border-border rounded-lg divide-y divide-border">
                  {chapters.map((ch, i) => (
                    <div key={ch.id} className="flex items-center gap-3 p-2.5">
                      <span className="text-[10px] font-bold text-subtle w-5">{i + 1}</span>
                      <p className="flex-1 text-sm text-ink">{ch.title}</p>
                      <button onClick={() => onDelChapter(ch.id)} className="text-subtle hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Horaires */}
            <div className="bg-white border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-black text-ink uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-cama" /> Horaires ({sessions.length})
                </h3>
                <button onClick={proposeSession} className="text-[11px] font-bold text-cama hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Proposer un créneau
                </button>
              </div>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted italic">Aucun horaire. L&apos;administration le pré-remplit, ou proposez-en un.</p>
              ) : (
                <div className="space-y-1.5">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs bg-surface/60 border border-border rounded-lg p-2">
                      <Clock className="w-3.5 h-3.5 text-cama" />
                      <span className="font-semibold text-ink">{s.day} {s.start_time}–{s.end_time}</span>
                      <span className="text-muted">· {s.kind}{s.room && ` · ${s.room}`}</span>
                      <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        s.status === "valide" ? "bg-green-50 text-green-600" :
                        s.status === "rejete" ? "bg-red-50 text-red-500" : "bg-gold/10 text-gold-dark"}`}>
                        {s.status === "valide" ? "Validé" : s.status === "rejete" ? "Rejeté" : "Proposé"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
