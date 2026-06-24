"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Sparkles, Plus, Trash2, Eye, EyeOff, Users,
  TrendingUp, Star, CalendarClock, MapPin, Check, GraduationCap, Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  EXTRA_CATEGORIES, MODE_LABEL, fetchExtraCourses, createExtraCourse, updateExtraCourse,
  deleteExtraCourse, fetchEnrollments, enrollmentStats, updateEnrollment,
  type ExtraEnrollmentWithUser,
} from "@/lib/extra";
import type { DBExtraCourse, CycleMode } from "@/lib/supabase";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MODES: CycleMode[] = ["presentiel", "hybride", "online"];
const ACCENTS = ["#7C3AED", "#0EA5E9", "#16A34A", "#D97706", "#DB2777", "#4F46E5"];

export default function AdminExtraCoursesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<DBExtraCourse[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<DBExtraCourse | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = useCallback(async () => {
    const list = await fetchExtraCourses();
    setCourses(list);
    setFetching(false);
    setSelected((s) => (s ? list.find((c) => c.id === s.id) ?? null : null));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cama" /> Cours hors-cursus
          </span>
          <div className="flex-1" />
          <button onClick={() => { setShowForm(true); setSelected(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cama text-white text-xs font-bold rounded-lg hover:bg-cama-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nouveau cours
          </button>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-4 sm:px-6 py-5 grid lg:grid-cols-[380px_1fr] gap-5 items-start">

        {/* Liste */}
        <div>
          <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2">Programmes ({courses.length})</h2>
          {fetching ? (
            <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
          ) : courses.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-6 text-center text-xs text-muted">
              Aucun cours hors-cursus. Créez le premier programme extra-curriculaire (soft skills, langues, entrepreneuriat…).
            </div>
          ) : (
            <div className="space-y-2">
              {courses.map((c) => (
                <button key={c.id} onClick={() => { setSelected(c); setShowForm(false); }}
                  className={`w-full text-left bg-white border rounded-xl p-3 hover:border-cama/40 transition-all flex items-center gap-3 ${
                    selected?.id === c.id ? "border-cama shadow-sm" : "border-border"}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}1a` }}>
                    <Sparkles className="w-5 h-5" style={{ color: c.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{c.title}</p>
                    <p className="text-[11px] text-muted">{c.category} · {MODE_LABEL[c.mode]}{c.day ? ` · ${c.day}` : ""}</p>
                  </div>
                  {c.published
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full">Publié</span>
                    : <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gold/10 text-gold-dark rounded-full">Brouillon</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détail / formulaire */}
        {showForm ? (
          <ExtraForm onCreated={(c) => { reload(); setSelected(c); setShowForm(false); }} createdBy={user.id} />
        ) : selected ? (
          <ExtraDetail course={selected} onChange={reload} />
        ) : (
          <div className="bg-white border border-border rounded-xl p-10 text-center">
            <Layers className="w-9 h-9 text-subtle mx-auto mb-3" />
            <p className="text-sm font-bold text-ink mb-1">Gestion des cours hors-cursus</p>
            <p className="text-xs text-muted max-w-md mx-auto">Sélectionnez un programme pour suivre ses participants, leur progression et leur satisfaction — ou créez-en un nouveau. Les cours publiés apparaissent dans le calendrier personnel des étudiants inscrits.</p>
          </div>
        )}
      </main>
    </div>
  );
}

/* ════ Formulaire de création ════ */
function ExtraForm({ onCreated, createdBy }: { onCreated: (c: DBExtraCourse) => void; createdBy: string }) {
  const [f, setF] = useState({
    title: "", code: "", category: EXTRA_CATEGORIES[0] as string, description: "",
    instructor_name: "", mode: "hybride" as CycleMode, capacity: 30,
    day: "Mercredi", start_time: "18h00", end_time: "20h00", room: "", sessions_count: 8,
    color: ACCENTS[0],
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!f.title.trim()) return;
    setSaving(true);
    const created = await createExtraCourse({ ...f, title: f.title.trim(), created_by: createdBy });
    setSaving(false);
    if (created) onCreated(created);
  };

  const field = "w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-cama";
  const lbl = "text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block";

  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-cama" /> Nouveau cours hors-cursus</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><label className={lbl}>Intitulé</label>
          <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex: Leadership & prise de parole" className={field} /></div>
        <div><label className={lbl}>Code</label><input value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="SOFT-01" className={field} /></div>
        <div><label className={lbl}>Catégorie</label>
          <select value={f.category} onChange={(e) => set("category", e.target.value)} className={`${field} bg-white`}>
            {EXTRA_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select></div>
        <div className="sm:col-span-2"><label className={lbl}>Description</label>
          <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Objectifs, public, déroulé…" className={field} /></div>
        <div><label className={lbl}>Intervenant</label><input value={f.instructor_name} onChange={(e) => set("instructor_name", e.target.value)} placeholder="Nom de l'intervenant" className={field} /></div>
        <div><label className={lbl}>Mode</label>
          <select value={f.mode} onChange={(e) => set("mode", e.target.value as CycleMode)} className={`${field} bg-white`}>
            {MODES.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
          </select></div>
        <div><label className={lbl}>Jour</label>
          <select value={f.day} onChange={(e) => set("day", e.target.value)} className={`${field} bg-white`}>
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lbl}>Début</label><input value={f.start_time} onChange={(e) => set("start_time", e.target.value)} className={field} /></div>
          <div><label className={lbl}>Fin</label><input value={f.end_time} onChange={(e) => set("end_time", e.target.value)} className={field} /></div>
        </div>
        <div><label className={lbl}>Salle / lien</label><input value={f.room} onChange={(e) => set("room", e.target.value)} placeholder="Salle B12 ou lien visio" className={field} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lbl}>Capacité</label><input type="number" min="1" value={f.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className={field} /></div>
          <div><label className={lbl}>Séances</label><input type="number" min="1" value={f.sessions_count} onChange={(e) => set("sessions_count", Number(e.target.value))} className={field} /></div>
        </div>
        <div className="sm:col-span-2"><label className={lbl}>Couleur d&apos;accent</label>
          <div className="flex gap-2">
            {ACCENTS.map((c) => (
              <button key={c} onClick={() => set("color", c)} className={`w-7 h-7 rounded-full transition-transform ${f.color === c ? "ring-2 ring-offset-2 ring-ink scale-110" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <button onClick={submit} disabled={saving || !f.title.trim()}
        className="btn-primary py-2.5 px-6 text-sm gap-2 mt-4 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Créer le programme
      </button>
    </div>
  );
}

/* ════ Détail + participants ════ */
function ExtraDetail({ course, onChange }: { course: DBExtraCourse; onChange: () => void }) {
  const [enrollments, setEnrollments] = useState<ExtraEnrollmentWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setEnrollments(await fetchEnrollments(course.id));
    setLoading(false);
  }, [course.id]);
  useEffect(() => { setLoading(true); reload(); }, [reload]);

  const stats = enrollmentStats(enrollments);

  const togglePublish = async () => { await updateExtraCourse(course.id, { published: !course.published }); onChange(); };
  const remove = async () => { if (confirm("Supprimer ce cours hors-cursus ?")) { await deleteExtraCourse(course.id); onChange(); } };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="rounded-xl overflow-hidden border border-border">
        <div className="p-5 text-white" style={{ background: `linear-gradient(120deg, ${course.color}, #1E1B4B)` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {course.code && <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5">{course.code}</span>}
                <span className="text-[10px] font-bold text-white/70">{course.category}</span>
              </div>
              <h2 className="text-xl font-bold leading-tight">{course.title}</h2>
              <p className="text-xs text-white/70 mt-1 flex items-center gap-2 flex-wrap">
                {course.instructor_name && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {course.instructor_name}</span>}
                <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {course.day} {course.start_time}–{course.end_time}</span>
                {course.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {course.room}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={togglePublish}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full transition-all ${course.published ? "bg-green-500 text-white" : "bg-white/15 text-white hover:bg-white/25"}`}>
                {course.published ? <><Eye className="w-3.5 h-3.5" /> Publié</> : <><EyeOff className="w-3.5 h-3.5" /> Publier</>}
              </button>
              <button onClick={remove} className="w-9 h-9 bg-white/10 hover:bg-red-500 border border-white/20 rounded-full flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        {course.description && <p className="px-5 py-3 text-sm text-muted bg-white">{course.description}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Users, label: "Inscrits", value: `${stats.n}/${course.capacity}`, c: "text-cama" },
          { icon: TrendingUp, label: "Progression moy.", value: `${stats.avgProgress}%`, c: "text-green-600" },
          { icon: Star, label: "Satisfaction", value: stats.avgSatisfaction ? `${stats.avgSatisfaction}/5` : "—", c: "text-gold-dark" },
          { icon: Check, label: "Terminés", value: String(stats.completed), c: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-3">
            <s.icon className={`w-4 h-4 mb-1.5 ${s.c}`} />
            <p className={`text-lg font-bold leading-none ${s.c}`}>{s.value}</p>
            <p className="text-[11px] text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Participants */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-[11px] font-black text-ink uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-cama" /> Participants & suivi</h3>
        </div>
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
        ) : enrollments.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">Aucun participant inscrit pour le moment.</p>
        ) : (
          <div className="divide-y divide-border">
            {enrollments.map((e) => (
              <ParticipantRow key={e.id} e={e} onSaved={reload} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantRow({ e, onSaved }: { e: ExtraEnrollmentWithUser; onSaved: () => void }) {
  const [progress, setProgress] = useState(e.progress);
  const [satisfaction, setSatisfaction] = useState(e.satisfaction ?? 0);
  const [status, setStatus] = useState(e.status);
  const name = `${e.student?.first_name ?? ""} ${e.student?.last_name ?? ""}`.trim() || e.student?.email || "Étudiant";
  const initials = `${(e.student?.first_name ?? "?").charAt(0)}${(e.student?.last_name ?? "").charAt(0)}`.toUpperCase();

  const save = async () => {
    await updateEnrollment(e.id, { progress, satisfaction: satisfaction || null, status });
    onSaved();
  };

  return (
    <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
      <div className="w-9 h-9 rounded-full bg-cama-50 text-cama flex items-center justify-center text-[11px] font-bold flex-shrink-0">{initials}</div>
      <div className="flex-1 min-w-[140px]">
        <p className="text-sm font-semibold text-ink truncate">{name}</p>
        <p className="text-[10px] text-subtle">{e.student?.level ?? "—"} · {e.student?.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[10px] text-subtle">Prog.</label>
        <input type="number" min="0" max="100" value={progress} onChange={(ev) => setProgress(Number(ev.target.value))}
          className="w-16 text-xs border border-border rounded px-2 py-1 outline-none focus:border-cama" />
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setSatisfaction(s)} className={s <= satisfaction ? "text-gold" : "text-border"}>
            <Star className="w-3.5 h-3.5 fill-current" />
          </button>
        ))}
      </div>
      <select value={status} onChange={(ev) => setStatus(ev.target.value as typeof status)}
        className="text-[11px] border border-border rounded px-2 py-1 bg-white outline-none focus:border-cama">
        <option value="inscrit">Inscrit</option><option value="en_cours">En cours</option>
        <option value="termine">Terminé</option><option value="abandon">Abandon</option>
      </select>
      <button onClick={save} className="text-[11px] font-bold text-white bg-cama px-3 py-1.5 rounded hover:bg-cama-700 transition-colors flex items-center gap-1">
        <Check className="w-3 h-3" /> OK
      </button>
    </div>
  );
}
