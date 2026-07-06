"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CalendarRange, Plus, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchYears, fetchSemesters, createYear, createSemester,
  setCurrentYear, setCurrentSemester,
  type DBAcademicYear, type DBSemester,
} from "@/lib/academic";
import { logAudit } from "@/lib/governance";

export default function AdminAnneesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [years, setYears] = useState<DBAcademicYear[]>([]);
  const [semesters, setSemesters] = useState<DBSemester[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulaire nouvelle année
  const [label, setLabel] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  // Formulaire nouveau semestre (par année)
  const [semNumber, setSemNumber] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => {
    const [ys, ss] = await Promise.all([fetchYears(), fetchSemesters()]);
    setYears(ys);
    setSemesters(ss);
    setFetching(false);
  };
  useEffect(() => { if (user) reload(); }, [user]);

  const addYear = async () => {
    if (!label.trim() || saving) return;
    setSaving(true);
    await createYear(label, startsOn || null, endsOn || null);
    setLabel(""); setStartsOn(""); setEndsOn("");
    await reload();
    setSaving(false);
  };

  const addSemester = async (y: DBAcademicYear) => {
    const n = parseInt(semNumber[y.id] ?? "", 10);
    if (!n || saving) return;
    setSaving(true);
    await createSemester(y.id, n);
    setSemNumber((m) => ({ ...m, [y.id]: "" }));
    await reload();
    setSaving(false);
  };

  const makeCurrentYear = async (y: DBAcademicYear) => {
    if (saving || y.is_current) return;
    setSaving(true);
    await setCurrentYear(y.id);
    await logAudit({ actorId: user!.id, actorName: user!.name, action: "academic.set_current",
      entity: `academic_year:${y.id}`, detail: `Année courante → ${y.label}`, severity: "warn" });
    await reload();
    setSaving(false);
  };

  const makeCurrentSemester = async (s: DBSemester, y: DBAcademicYear) => {
    if (saving || s.is_current) return;
    setSaving(true);
    await setCurrentSemester(s.id);
    await logAudit({ actorId: user!.id, actorName: user!.name, action: "academic.set_current",
      entity: `semester:${s.id}`, detail: `Semestre courant → ${s.label ?? `Semestre ${s.number}`} (${y.label})`, severity: "warn" });
    await reload();
    setSaving(false);
  };

  if (loading || fetching || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-6 h-6 animate-spin text-cama" /></div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-[11px] text-muted hover:text-ink"><ArrowLeft className="w-3.5 h-3.5" /> Dashboard</Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-[11px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
            <CalendarRange className="w-3.5 h-3.5 text-cama" /> Années &amp; semestres
          </span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 py-5 space-y-4">
        {/* Nouvelle année */}
        <div className="bg-white border border-border p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Nouvelle année académique</p>
          <div className="flex flex-wrap items-center gap-2">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. 2025-2026"
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama w-36" />
            <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            <input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)}
              className="text-xs px-2 py-2 border border-border bg-white outline-none focus:border-cama" />
            <button onClick={addYear} disabled={!label.trim() || saving}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white bg-cama px-3 py-2 disabled:opacity-50">
              <Plus className="w-3 h-3" /> Créer
            </button>
          </div>
        </div>

        {/* Liste des années */}
        {years.length === 0 && (
          <div className="bg-white border border-border p-6 text-center text-xs text-muted">Aucune année académique.</div>
        )}
        {years.map((y) => {
          const sems = semesters.filter((s) => s.academic_year_id === y.id);
          return (
            <div key={y.id} className="bg-white border border-border p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                    {y.label}
                    {y.is_current && <span className="text-[9px] font-black uppercase tracking-widest text-cama border border-cama px-1.5 py-0.5">Courante</span>}
                  </p>
                  <p className="text-[10px] text-muted">{y.starts_on ?? "—"} → {y.ends_on ?? "—"}</p>
                </div>
                <button onClick={() => makeCurrentYear(y)} disabled={saving || y.is_current}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 border-2 transition-colors disabled:opacity-50 ${
                    y.is_current ? "border-cama bg-cama-50 text-cama" : "border-border text-muted hover:border-cama/40"}`}>
                  <Star className="w-3 h-3" /> Marquer courante
                </button>
              </div>

              {/* Semestres */}
              <div className="mt-3 pl-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1.5">Semestres</p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {sems.map((s) => (
                    <button key={s.id} onClick={() => makeCurrentSemester(s, y)} disabled={saving || s.is_current}
                      className={`text-[10px] font-bold px-2 py-1 border transition-colors disabled:opacity-60 ${
                        s.is_current ? "border-cama bg-cama text-white" : "border-border text-muted hover:border-cama/40"}`}>
                      {s.label ?? `Semestre ${s.number}`}{s.is_current ? " · courant" : ""}
                    </button>
                  ))}
                  {sems.length === 0 && <span className="text-[10px] text-subtle">Aucun semestre.</span>}
                  <input value={semNumber[y.id] ?? ""} onChange={(e) => setSemNumber((m) => ({ ...m, [y.id]: e.target.value }))}
                    type="number" min={1} placeholder="N°"
                    className="text-[10px] px-2 py-1 border border-border bg-white outline-none focus:border-cama w-14" />
                  <button onClick={() => addSemester(y)} disabled={saving || !(semNumber[y.id] ?? "").trim()}
                    className="flex items-center gap-1 text-[10px] font-bold text-cama border border-cama px-2 py-1 disabled:opacity-50">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <p className="text-[10px] text-subtle">Chaque changement d&apos;année ou de semestre courant est tracé dans le journal d&apos;audit.</p>
      </main>
    </div>
  );
}
