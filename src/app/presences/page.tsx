"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, ClipboardCheck, Check, X, Users, TrendingUp, Filter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchProgram, fetchTeacherCourses } from "@/lib/program";
import {
  fetchCourseStudents, fetchAttendance, markAttendance, attendanceRates,
  type CourseStudent, type AttendanceWithUser,
} from "@/lib/attendance";
import type { DBProgramCourse, CycleMode } from "@/lib/supabase";

const MODE_LABEL: Record<CycleMode, string> = { online: "En ligne", hybride: "Hybride", presentiel: "Présentiel" };
const MODE_COLOR: Record<CycleMode, string> = { online: "#4F46E5", hybride: "#D97706", presentiel: "#16a34a" };

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AttendancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<DBProgramCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<AttendanceWithUser[]>([]);
  const [cycleFilter, setCycleFilter] = useState("Tous");
  const [modeFilter, setModeFilter] = useState<"Tous" | CycleMode>("Tous");
  const [fetching, setFetching] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!loading && (!user || (user.role !== "admin" && user.role !== "enseignant"))) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const list = isAdmin ? await fetchProgram() : await fetchTeacherCourses(user.id);
      setCourses(list);
      if (list.length) setCourseId((id) => id || list[0].id);
      setFetching(false);
    })();
  }, [user, isAdmin]);

  const course = courses.find((c) => c.id === courseId);

  const loadAttendance = useCallback(async () => {
    if (!course) return;
    const [studs, hist] = await Promise.all([
      fetchCourseStudents(course.parcours_slug, course.annee_niveau),
      fetchAttendance(course.id),
    ]);
    setStudents(studs);
    setHistory(hist);
    // Pré-remplit l'état du jour
    const dayRows = hist.filter((h) => h.session_date === date);
    const init: Record<string, boolean> = {};
    dayRows.forEach((r) => { init[r.student_id] = r.present; });
    setPresent(init);
  }, [course, date]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const filteredStudents = useMemo(() => students.filter((s) =>
    (cycleFilter === "Tous" || s.level === cycleFilter) &&
    (modeFilter === "Tous" || s.mode === modeFilter)
  ), [students, cycleFilter, modeFilter]);

  const cycles = useMemo(() => Array.from(new Set(students.map((s) => s.level))).sort(), [students]);

  const toggle = (id: string) => setPresent((p) => ({ ...p, [id]: !p[id] }));

  const saveDay = async () => {
    if (!course) return;
    await Promise.all(filteredStudents.map((s) =>
      markAttendance({
        program_course_id: course.id, student_id: s.user_id, session_date: date,
        present: !!present[s.user_id], cycle: s.level, mode: s.mode, marked_by: user?.id ?? null,
      })
    ));
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
    loadAttendance();
  };

  const rates = useMemo(() => attendanceRates(history), [history]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-cama" /> Liste de présence
          </span>
          <span className="text-[10px] text-subtle hidden sm:block">· {isAdmin ? "toutes filières" : "vos matières"}</span>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5">
        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : courses.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">Aucune matière disponible.</div>
        ) : (
          <>
            {/* Sélecteurs */}
            <div className="bg-white border border-border rounded-xl p-4 mb-4 grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Matière</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white outline-none focus:border-cama">
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.title} ({c.annee_niveau})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Date de séance</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-cama" />
              </div>
              <button onClick={saveDay} className="btn-primary py-2 px-5 text-sm gap-2 h-[38px]">
                <Check className="w-4 h-4" /> Enregistrer {savedMsg && <span className="text-green-200">✓</span>}
              </button>
            </div>

            {/* Taux agrégés par cycle / mode */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="text-[11px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-cama" /> Taux de présence par cycle</p>
                {Object.keys(rates.byCycle).length === 0 ? <p className="text-xs text-muted">Aucune donnée enregistrée.</p> : (
                  <div className="space-y-2.5">
                    {Object.entries(rates.byCycle).map(([cycle, r]) => {
                      const pct = r.total ? Math.round((r.present / r.total) * 100) : 0;
                      return (
                        <div key={cycle}>
                          <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted font-semibold">{cycle}</span><span className="font-bold text-ink">{pct}% <span className="text-subtle font-normal">({r.present}/{r.total})</span></span></div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-cama" style={{ width: `${pct}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="bg-white border border-border rounded-xl p-4">
                <p className="text-[11px] font-black text-ink uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-cama" /> Taux par type de cycle</p>
                {Object.keys(rates.byMode).length === 0 ? <p className="text-xs text-muted">Aucune donnée enregistrée.</p> : (
                  <div className="space-y-2.5">
                    {Object.entries(rates.byMode).map(([mode, r]) => {
                      const pct = r.total ? Math.round((r.present / r.total) * 100) : 0;
                      const color = MODE_COLOR[mode as CycleMode] ?? "#4F46E5";
                      return (
                        <div key={mode}>
                          <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted font-semibold">{MODE_LABEL[mode as CycleMode] ?? mode}</span><span className="font-bold text-ink">{pct}% <span className="text-subtle font-normal">({r.present}/{r.total})</span></span></div>
                          <div className="h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full" style={{ width: `${pct}%`, background: color }} /></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Filtres + feuille de présence */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
                <h3 className="text-[11px] font-black text-ink uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-cama" /> Feuille du {new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</h3>
                <div className="flex-1" />
                <Filter className="w-3.5 h-3.5 text-subtle" />
                <select value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="text-[11px] border border-border rounded px-2 py-1 bg-white outline-none">
                  <option>Tous</option>{cycles.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as typeof modeFilter)} className="text-[11px] border border-border rounded px-2 py-1 bg-white outline-none">
                  <option value="Tous">Tous modes</option>
                  {(["presentiel", "hybride", "online"] as CycleMode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
                </select>
              </div>
              {filteredStudents.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">Aucun étudiant inscrit validé pour cette matière / ce filtre.</p>
              ) : (
                <div className="divide-y divide-border">
                  {filteredStudents.map((s) => {
                    const isPresent = !!present[s.user_id];
                    return (
                      <div key={s.user_id} className="px-4 py-2.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cama-50 text-cama flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {(s.first_name.charAt(0) + s.last_name.charAt(0)).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">{s.first_name} {s.last_name}</p>
                          <p className="text-[10px] text-subtle">{s.email}</p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-surface text-muted">{s.level}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: MODE_COLOR[s.mode] }}>{MODE_LABEL[s.mode]}</span>
                        <button onClick={() => toggle(s.user_id)}
                          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                            isPresent ? "border-green-500 bg-green-50 text-green-600" : "border-border text-muted hover:border-red-300"}`}>
                          {isPresent ? <><Check className="w-3.5 h-3.5" /> Présent</> : <><X className="w-3.5 h-3.5" /> Absent</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
