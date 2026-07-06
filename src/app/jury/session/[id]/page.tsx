"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2, Gavel, Calculator, Save, Lock, Printer, Scale, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageShell from "@/components/dashboard/PageShell";
import { logAudit } from "@/lib/governance";
import {
  fetchJurySession, closeJurySession, fetchJuryMembers, fetchDecisions,
  recordDecision, computeSemesterResults, fetchParcoursStudents,
  type DBJurySession, type JuryMemberWithUser, type JuryDecisionKind,
} from "@/lib/jury";

const DECISIONS: { value: JuryDecisionKind; label: string; cls: string }[] = [
  { value: "admis",      label: "Admis",      cls: "bg-green-50 text-green-600" },
  { value: "rattrapage", label: "Rattrapage", cls: "bg-gold/10 text-gold-dark" },
  { value: "ajourne",    label: "Ajourné",    cls: "bg-red-50 text-red-500" },
];

const ROLE_LABEL: Record<string, string> = {
  president: "Président", membre: "Membre", secretaire: "Secrétaire",
};

interface Row {
  student_id: string;
  matricule: string;
  name: string;
  average: number | null;
  ects_earned: number;
  decision: JuryDecisionKind | null;
  compensation_applied: boolean;
  comment: string;
}

export default function JurySessionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params.id;

  const [session, setSession] = useState<DBJurySession | null>(null);
  const [members, setMembers] = useState<JuryMemberWithUser[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(true);
  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== "jury" && user.role !== "admin"))) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    (async () => {
      setFetching(true);
      const s = await fetchJurySession(sessionId);
      setSession(s);
      if (s) {
        const [mems, decs, students] = await Promise.all([
          fetchJuryMembers(sessionId),
          fetchDecisions(sessionId),
          s.parcours_slug ? fetchParcoursStudents(s.parcours_slug) : Promise.resolve([]),
        ]);
        setMembers(mems);
        const matByStudent = new Map(students.map((st) => [st.user_id, st]));
        setRows(decs.map((d) => {
          const st = matByStudent.get(d.student_id);
          return {
            student_id: d.student_id,
            matricule: st?.matricule ?? "—",
            name: d.student ? `${d.student.first_name} ${d.student.last_name}`
              : st ? `${st.first_name} ${st.last_name}` : d.student_id.slice(0, 8),
            average: d.average !== null ? Number(d.average) : null,
            ects_earned: d.ects_earned ?? 0,
            decision: d.decision,
            compensation_applied: d.compensation_applied,
            comment: d.comment ?? "",
          };
        }).sort((a, b) => a.name.localeCompare(b.name)));
      }
      setFetching(false);
    })();
  }, [sessionId]);

  const closed = session?.status !== "ouvert";

  const compute = async () => {
    setComputing(true);
    const results = await computeSemesterResults(sessionId);
    setRows((prev) => {
      const byId = new Map(prev.map((r) => [r.student_id, r]));
      return results.map((r) => ({
        student_id: r.student_id,
        matricule: r.matricule,
        name: `${r.first_name} ${r.last_name}`.trim() || r.student_id.slice(0, 8),
        average: r.average,
        ects_earned: r.ects_earned,
        decision: r.decision,
        compensation_applied: r.compensation_applied,
        comment: byId.get(r.student_id)?.comment ?? "",
      }));
    });
    setComputing(false);
  };

  const save = async () => {
    setSaving(true); setSaved(false);
    for (const r of rows) {
      await recordDecision(sessionId, r.student_id, {
        average: r.average, ects_earned: r.ects_earned, decision: r.decision,
        compensation_applied: r.compensation_applied, comment: r.comment || null,
      });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const closeJury = async () => {
    if (!user || !session) return;
    if (!confirm("Clôturer le jury ? Les décisions deviendront définitives (lecture seule).")) return;
    await save();
    await closeJurySession(sessionId);
    await logAudit({
      actorId: user.id,
      actorName: `${user.firstName} ${user.lastName}`,
      action: "jury.close",
      entity: `jury_sessions:${sessionId}`,
      detail: `Clôture du jury ${session.academic_year ?? ""} S${session.semester ?? ""} — ${session.parcours_slug ?? ""} (${rows.length} étudiants)`,
      severity: "warn",
    });
    setSession({ ...session, status: "cloture", closed_at: new Date().toISOString() });
  };

  const patch = (studentId: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.student_id === studentId ? { ...r, ...p } : r)));

  const stats = useMemo(() => ({
    total: rows.length,
    admis: rows.filter((r) => r.decision === "admis").length,
    rattrapage: rows.filter((r) => r.decision === "rattrapage").length,
    compense: rows.filter((r) => r.compensation_applied).length,
  }), [rows]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  const titre = session
    ? `${session.academic_year ?? "—"} · Semestre ${session.semester ?? "—"} · ${session.parcours_slug ?? "—"}`
    : "";

  const actions = session && !fetching ? (
    <>
      {!closed && (
        <button onClick={compute} disabled={computing}
          className="flex items-center gap-1.5 text-[12px] font-bold text-cama border border-cama/30 rounded-lg px-3 py-2 hover:bg-cama/5 disabled:opacity-50">
          {computing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
          Calculer les résultats
        </button>
      )}
      {!closed && (
        <button onClick={save} disabled={saving || rows.length === 0}
          className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-cama rounded-lg px-3 py-2 hover:opacity-90 disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Enregistré" : "Enregistrer"}
        </button>
      )}
      {!closed && (
        <button onClick={closeJury} disabled={rows.length === 0}
          className="flex items-center gap-1.5 text-[12px] font-bold text-red-500 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 disabled:opacity-50">
          <Lock className="w-3.5 h-3.5" /> Clôturer le jury
        </button>
      )}
      <button onClick={() => window.print()} disabled={rows.length === 0}
        className="flex items-center gap-1.5 text-[12px] font-bold text-ink border border-border rounded-lg px-3 py-2 hover:bg-surface disabled:opacity-50">
        <Printer className="w-3.5 h-3.5" /> Imprimer le PV
      </button>
    </>
  ) : undefined;

  return (
    <>
      {/* ── Écran ── */}
      <div className="print:hidden">
        <PageShell
          title="Jury de semestre"
          subtitle={session ? `${titre} · ${members.length} membre${members.length > 1 ? "s" : ""} · tenu le ${new Date(session.held_at).toLocaleDateString("fr-FR")}` : undefined}
          icon={Gavel}
          breadcrumb="Jury de semestre"
          context={session ? (closed ? "Jury clôturé" : "Jury ouvert") : undefined}
          maxWidth="max-w-[1200px]"
          actions={actions}
          stats={session && !fetching ? [
            { label: "Étudiants",     value: stats.total,      accent: "ink" },
            { label: "Admis",         value: stats.admis,      accent: "green" },
            { label: "Rattrapage",    value: stats.rattrapage, accent: "gold" },
            { label: "Compensations", value: stats.compense,   accent: "cama" },
          ] : undefined}
        >
          {fetching ? (
            <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
          ) : !session ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">Session introuvable.</div>
          ) : (
            <>
              {rows.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-muted">
                  Aucun résultat. Cliquez sur « Calculer les résultats » pour agréger les notes du semestre.
                </div>
              ) : (
                <div className="bg-white border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-[10px] uppercase text-muted">
                        <th className="px-3 py-2.5">Matricule</th>
                        <th className="px-3 py-2.5">Étudiant</th>
                        <th className="px-3 py-2.5 text-center">Moyenne /20</th>
                        <th className="px-3 py-2.5 text-center">ECTS</th>
                        <th className="px-3 py-2.5">Décision</th>
                        <th className="px-3 py-2.5">Compensation</th>
                        <th className="px-3 py-2.5">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((r) => {
                        const badge = DECISIONS.find((d) => d.value === r.decision);
                        return (
                          <tr key={r.student_id}>
                            <td className="px-3 py-2 font-mono text-[11px] text-muted">{r.matricule}</td>
                            <td className="px-3 py-2 font-bold text-ink">{r.name}</td>
                            <td className="px-3 py-2 text-center font-bold text-ink">
                              {r.average !== null ? r.average.toFixed(2) : "—"}
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-cama">{r.ects_earned}</td>
                            <td className="px-3 py-2">
                              {closed ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge?.cls ?? "bg-surface text-muted"}`}>
                                  {badge?.label ?? "—"}
                                </span>
                              ) : (
                                <select value={r.decision ?? ""}
                                  onChange={(e) => patch(r.student_id, { decision: (e.target.value || null) as JuryDecisionKind | null })}
                                  className="border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-cama bg-white">
                                  <option value="">—</option>
                                  {DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {r.compensation_applied && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cama/10 text-cama">
                                  <Scale className="w-3 h-3" /> Compensée
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input value={r.comment} disabled={closed}
                                onChange={(e) => patch(r.student_id, { comment: e.target.value })}
                                placeholder="—"
                                className="w-full min-w-[140px] border border-border rounded-lg px-2 py-1 text-xs outline-none focus:border-cama disabled:bg-surface disabled:border-transparent" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-[11px] text-muted mt-4">
                Règle de compensation : moyenne générale pondérée ECTS ≥ 10 → admis (compensation si des matières &lt; 10) ·
                moyenne ≥ 8 → rattrapage · sinon ajourné.
              </p>
            </>
          )}
        </PageShell>
      </div>

      {/* ── Procès-verbal (impression A4) ── */}
      {session && (
        <div className="hidden print:block bg-white text-black p-8" style={{ fontFamily: "Georgia, serif" }}>
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <p className="text-lg font-bold tracking-wide">INSTITUT JFN — PROCÈS-VERBAL DE DÉLIBÉRATION</p>
            <p className="text-sm mt-2">
              Année académique {session.academic_year ?? "—"} · Semestre {session.semester ?? "—"} · Parcours {session.parcours_slug ?? "—"}
            </p>
            <p className="text-xs mt-1">
              Session tenue le {new Date(session.held_at).toLocaleDateString("fr-FR")}
              {session.closed_at ? ` — clôturée le ${new Date(session.closed_at).toLocaleDateString("fr-FR")}` : " — en cours"}
            </p>
          </div>

          <table className="w-full text-[11px] border-collapse mb-8">
            <thead>
              <tr>
                {["Matricule", "Nom et prénom", "Moyenne /20", "ECTS", "Décision", "Compensation", "Observation"].map((h) => (
                  <th key={h} className="border border-black px-2 py-1 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student_id}>
                  <td className="border border-black px-2 py-1">{r.matricule}</td>
                  <td className="border border-black px-2 py-1">{r.name}</td>
                  <td className="border border-black px-2 py-1 text-center">{r.average !== null ? r.average.toFixed(2) : "—"}</td>
                  <td className="border border-black px-2 py-1 text-center">{r.ects_earned}</td>
                  <td className="border border-black px-2 py-1">{DECISIONS.find((d) => d.value === r.decision)?.label ?? "—"}</td>
                  <td className="border border-black px-2 py-1 text-center">{r.compensation_applied ? "Oui" : ""}</td>
                  <td className="border border-black px-2 py-1">{r.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-sm font-bold mb-3">Membres du jury :</p>
          <div className="grid grid-cols-2 gap-x-10 gap-y-8">
            {members.map((m) => (
              <div key={m.id}>
                <p className="text-xs">
                  {m.user ? `${m.user.first_name} ${m.user.last_name}` : m.user_id?.slice(0, 8)} — {ROLE_LABEL[m.role_in_jury] ?? m.role_in_jury}
                </p>
                <div className="border-b border-black mt-10" />
                <p className="text-[10px] mt-1">Signature</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
