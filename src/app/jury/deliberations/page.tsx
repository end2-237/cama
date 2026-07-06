"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Gavel, CheckCircle2, XCircle, Award, Search, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { DelibStatus } from "@/lib/supabase";
import { fetchDeliberations, setDelibStatus, upsertDeliberation, type DelibWithMeta } from "@/lib/exams";
import { creditStudent, currentYear, currentSemester } from "@/lib/academic";

const BADGE: Record<DelibStatus, { label: string; cls: string }> = {
  en_delib: { label: "En délibération", cls: "bg-gold/10 text-gold-dark" },
  valide:   { label: "Validé",          cls: "bg-green-50 text-green-600" },
  rejete:   { label: "Rejeté",          cls: "bg-red-50 text-red-500" },
};

export default function DeliberationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [delibs, setDelibs] = useState<DelibWithMeta[]>([]);
  const [fetching, setFetching] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!loading && (!user || (user.role !== "jury" && user.role !== "admin"))) router.replace("/dashboard");
  }, [loading, user, router]);

  const reload = async () => { setFetching(true); setDelibs(await fetchDeliberations()); setFetching(false); };
  useEffect(() => { reload(); }, []);

  const onNote = async (d: DelibWithMeta, note: number) => {
    setDelibs((ds) => ds.map((x) => x.id === d.id ? { ...x, note } : x));
    await upsertDeliberation({ program_course_id: d.program_course_id, student_id: d.student_id, note });
  };

  const decide = async (d: DelibWithMeta, status: DelibStatus) => {
    if (!user) return;
    const credits = d.course?.ects ?? 0;
    setDelibs((ds) => ds.map((x) => x.id === d.id ? { ...x, status, credits: status === "valide" ? credits : 0 } : x));
    const { error } = await setDelibStatus(d.id, status, user.id, credits);
    // Alimente le ledger ECTS quand le jury valide la matière
    if (!error && status === "valide" && d.program_course_id) {
      try {
        const [y, s] = await Promise.all([currentYear(), currentSemester()]);
        await creditStudent(
          d.student_id, d.program_course_id, credits, true, "deliberation",
          user.id, y?.label ?? null, s?.number ?? null,
        );
      } catch { /* le ledger ne doit pas bloquer la délibération */ }
    }
  };

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return delibs.filter((d) =>
      `${d.student?.first_name ?? ""} ${d.student?.last_name ?? ""} ${d.course?.code ?? ""} ${d.course?.title ?? ""}`
        .toLowerCase().includes(s));
  }, [delibs, q]);

  const stats = useMemo(() => ({
    total: delibs.length,
    pending: delibs.filter((d) => d.status === "en_delib").length,
    validated: delibs.filter((d) => d.status === "valide").length,
    ects: delibs.filter((d) => d.status === "valide").reduce((a, d) => a + d.credits, 0),
  }), [delibs]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-sm font-bold text-ink flex items-center gap-1.5">
            <Gavel className="w-4 h-4 text-cama" /> Délibérations du jury
          </span>
          <div className="flex-1" />
          <Link href="/jury/sessions" className="text-sm text-cama font-semibold hover:underline">Sessions de jury →</Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden mb-5">
          {[
            { label: "Dossiers", value: stats.total, color: "text-ink" },
            { label: "En délibération", value: stats.pending, color: "text-gold-dark" },
            { label: "Validés", value: stats.validated, color: "text-green-600" },
            { label: "ECTS attribués", value: stats.ects, color: "text-cama" },
          ].map((k) => (
            <div key={k.label} className="bg-white p-3 text-center">
              <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-muted mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5 mb-4 max-w-xs focus-within:border-cama">
          <Search className="w-3.5 h-3.5 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher étudiant / matière…"
            className="bg-transparent text-xs outline-none w-full" />
        </div>

        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">
            Aucun dossier en délibération. Les copies envoyées par les enseignants apparaissent ici.
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
            {filtered.map((d) => {
              const b = BADGE[d.status];
              return (
                <div key={d.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-bold text-ink">
                      {d.student ? `${d.student.first_name} ${d.student.last_name}` : d.student_id.slice(0, 8)}
                    </p>
                    <p className="text-[11px] text-muted">
                      {d.course ? `${d.course.code} · ${d.course.title} · ${d.course.ects} ECTS` : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input type="number" min={0} max={20} step={0.5} value={d.note ?? 0}
                      onChange={(e) => onNote(d, parseFloat(e.target.value) || 0)}
                      disabled={d.status !== "en_delib"}
                      className="w-16 border border-border rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-cama disabled:bg-surface" />
                    <span className="text-[11px] text-muted">/20</span>
                  </div>
                  {d.credits > 0 && <span className="flex items-center gap-1 text-[11px] font-bold text-cama"><Award className="w-3.5 h-3.5" /> {d.credits} ECTS</span>}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => decide(d, "valide")} disabled={d.status === "valide"}
                      className="flex items-center gap-1 text-[11px] font-bold text-green-600 border border-green-200 rounded-lg px-2.5 py-1.5 hover:bg-green-50 disabled:opacity-40">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valider
                    </button>
                    <button onClick={() => decide(d, "rejete")} disabled={d.status === "rejete"}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 disabled:opacity-40">
                      <XCircle className="w-3.5 h-3.5" /> Rejeter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-muted mt-4 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gold-dark" />
          Politique human-in-the-loop : l&apos;IA signale les alertes d&apos;intégrité, le jury décide. La validation attribue les ECTS de la matière.
        </p>
      </main>
    </div>
  );
}
