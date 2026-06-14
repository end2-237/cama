"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Loader2, GraduationCap, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { DBProgramCourse } from "@/lib/supabase";
import { PARCOURS } from "@/lib/parcours";
import { fetchProgram, syncProgram, assignTeacher, updateHours } from "@/lib/program";

interface Teacher { id: string; first_name: string; last_name: string; }

export default function AdminProgrammePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [slug, setSlug]         = useState(PARCOURS[0]?.slug ?? "");
  const [courses, setCourses]   = useState<DBProgramCourse[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [fetching, setFetching] = useState(true);

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

  const handleSync = async () => {
    setBusy(true); setMsg(null);
    const { count, error } = await syncProgram();
    setBusy(false);
    if (error) setMsg({ ok: false, text: `Erreur de synchronisation : ${error}` });
    else { setMsg({ ok: true, text: `Programme synchronisé — ${count} matières.` }); reload(slug); }
  };

  const onAssign = async (courseId: string, teacherId: string) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, teacher_id: teacherId || null } : c));
    await assignTeacher(courseId, teacherId || null);
  };

  const onHours = async (courseId: string, hours: number) => {
    setCourses((cs) => cs.map((c) => c.id === courseId ? { ...c, hours } : c));
    await updateHours(courseId, hours);
  };

  // Regroupe par semestre
  const bySem = useMemo(() => {
    const m: Record<string, DBProgramCourse[]> = {};
    courses.forEach((c) => { (m[c.semestre] ??= []).push(c); });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b));
  }, [courses]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>;
  }

  const assignedCount = courses.filter((c) => c.teacher_id).length;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-cama" /> Programme & affectations
          </span>
          <div className="flex-1" />
          <button onClick={handleSync} disabled={busy}
            className="flex items-center gap-1.5 text-xs font-bold bg-cama text-white px-3 py-1.5 rounded-lg hover:bg-cama-700 disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Synchroniser le programme
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        {msg && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4 ${
            msg.ok ? "bg-green-50 border border-green-100 text-green-700" : "bg-red-50 border border-red-100 text-red-600"}`}>
            {msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        {/* Sélecteur filière + stats */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select value={slug} onChange={(e) => setSlug(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-cama">
            {PARCOURS.map((p) => <option key={p.slug} value={p.slug}>{p.title} — {p.school}</option>)}
          </select>
          <span className="text-xs text-muted flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cama" />
            {assignedCount}/{courses.length} matières affectées
          </span>
        </div>

        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : courses.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">
            Aucune matière. Clique sur <strong>Synchroniser le programme</strong> pour importer le curriculum.
          </div>
        ) : (
          <div className="space-y-6">
            {bySem.map(([sem, list]) => (
              <section key={sem}>
                <h2 className="text-[11px] font-black text-ink uppercase tracking-widest mb-2">
                  Semestre {sem.replace("S", "")} · {list.length} matières · {list.reduce((a, c) => a + c.ects, 0)} ECTS
                </h2>
                <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {list.map((c) => (
                    <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm font-bold text-ink">{c.code} · {c.title}</p>
                        <p className="text-[11px] text-muted">{c.annee_niveau} · {c.ects} ECTS · {c.modalites.join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input type="number" min={0} value={c.hours}
                          onChange={(e) => onHours(c.id, parseInt(e.target.value) || 0)}
                          className="w-16 border border-border rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-cama" />
                        <span className="text-[11px] text-muted">h</span>
                      </div>
                      <select value={c.teacher_id ?? ""} onChange={(e) => onAssign(c.id, e.target.value)}
                        className={`border rounded-lg px-2 py-1.5 text-xs bg-white outline-none focus:border-cama min-w-[160px] ${
                          c.teacher_id ? "border-green-300 text-green-700" : "border-border text-muted"}`}>
                        <option value="">Non assigné</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
