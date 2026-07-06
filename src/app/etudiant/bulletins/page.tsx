"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, FileText, Printer, CheckCircle2, XCircle, Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTranscriptsForStudent, fetchTranscriptLines, DECISION_LABEL,
  type DBTranscript, type DBTranscriptLine,
} from "@/lib/bulletins";

const DECISION_BADGE: Record<string, string> = {
  admis:      "bg-green-50 text-green-700 border-green-200",
  rattrapage: "bg-gold/10 text-gold-dark border-gold/40",
  ajourne:    "bg-red-50 text-red-600 border-red-200",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function BulletinsEtudiantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [transcripts, setTranscripts] = useState<DBTranscript[]>([]);
  const [selected, setSelected] = useState<DBTranscript | null>(null);
  const [lines, setLines] = useState<DBTranscriptLine[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);

  // Garde étudiant
  useEffect(() => {
    if (!loading && (!user || user.role !== "etudiant")) router.replace("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "etudiant") return;
    (async () => {
      const trs = await fetchTranscriptsForStudent(user.id);
      setTranscripts(trs);
      if (trs.length) setSelected(trs[0]);
      setFetching(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!selected) { setLines([]); return; }
    let alive = true;
    setLoadingLines(true);
    fetchTranscriptLines(selected.id).then((ls) => {
      if (alive) { setLines(ls); setLoadingLines(false); }
    });
    return () => { alive = false; };
  }, [selected]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 border-4 border-cama border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface print:bg-white">
      {/* Top header (masqué à l'impression) */}
      <header className="bg-white border-b border-border sticky top-0 z-40 print:hidden">
        <div className="max-w-[1000px] mx-auto px-4 flex items-center gap-3 h-12">
          <Link href="/dashboard" className="flex items-center gap-2 text-[11px] text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="w-px h-5 bg-border" />
          <span className="text-[11px] font-black uppercase tracking-widest text-ink flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cama" /> Mes bulletins
          </span>
          {selected && (
            <button
              onClick={() => window.print()}
              className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-cama text-white px-3 py-1.5 hover:bg-cama-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimer
            </button>
          )}
        </div>
      </header>

      {fetching ? (
        <div className="py-32 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
      ) : transcripts.length === 0 ? (
        <div className="max-w-[1000px] mx-auto px-4 py-20 text-center">
          <FileText className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-bold text-ink">Aucun bulletin disponible</p>
          <p className="text-xs text-muted mt-1">Vos relevés semestriels apparaîtront ici dès leur génération par l&apos;administration.</p>
        </div>
      ) : (
        <div className="max-w-[1000px] mx-auto px-4 py-4 grid md:grid-cols-[260px_1fr] gap-4 items-start print:block print:max-w-none print:px-0 print:py-0">
          {/* Liste des semestres */}
          <div className="bg-white border border-border print:hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-ink">Mes relevés</p>
            </div>
            <div className="divide-y divide-border">
              {transcripts.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`w-full text-left px-4 py-3 transition-colors ${selected?.id === t.id ? "bg-cama-50" : "hover:bg-surface"}`}
                >
                  <p className="text-[11px] font-bold text-ink">{t.academic_year} — Semestre {t.semester}</p>
                  <p className="text-[10px] text-muted mt-0.5">
                    Moyenne {t.average != null ? `${t.average}/20` : "—"} · {t.ects_earned}/{t.ects_total} ECTS
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Détail du relevé (document imprimable) */}
          {selected && (
            <article className="bg-white border border-border print:border-0">
              {/* En-tête institutionnel */}
              <header className="border-b-2 border-cama px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="leading-tight">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-muted">Institut JFN</span>
                    <span className="block text-lg font-bold leading-none text-ink tracking-tight">
                      CA<span className="text-cama">MA</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black uppercase tracking-widest text-ink">
                      INSTITUT JFN — RELEVÉ DE NOTES SEMESTRIEL
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      {selected.academic_year} · Semestre {selected.semester}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Étudiant</p>
                    <p className="text-xs font-bold text-ink">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Année</p>
                    <p className="text-xs font-bold text-ink">{selected.academic_year}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Semestre</p>
                    <p className="text-xs font-bold text-ink">S{selected.semester}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Généré le</p>
                    <p className="text-xs font-bold text-ink">{fmtDate(selected.generated_at)}</p>
                  </div>
                </div>
              </header>

              <div className="px-6 py-5">
                {loadingLines ? (
                  <div className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin text-cama mx-auto" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] font-black uppercase tracking-widest text-muted border-b-2 border-border">
                          <th className="py-2 pr-3">Code</th>
                          <th className="py-2 pr-3">Unité d&apos;enseignement</th>
                          <th className="py-2 pr-3 text-center">ECTS</th>
                          <th className="py-2 pr-3 text-center">Note /20</th>
                          <th className="py-2 pl-3 text-center">Crédit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l) => (
                          <tr key={l.id} className="border-b border-border/60">
                            <td className="py-2 pr-3 font-mono text-xs text-muted">{l.code ?? "—"}</td>
                            <td className="py-2 pr-3 text-ink">{l.course_title ?? "—"}</td>
                            <td className="py-2 pr-3 text-center tabular-nums">{l.ects}</td>
                            <td className="py-2 pr-3 text-center tabular-nums">{l.note != null ? l.note : "—"}</td>
                            <td className="py-2 pl-3 text-center">
                              {l.credit_obtenu
                                ? <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                                : <XCircle className="w-4 h-4 text-red-500 inline" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-cama/30 font-bold text-ink">
                          <td className="py-2 pr-3" colSpan={2}>Total</td>
                          <td className="py-2 pr-3 text-center tabular-nums">{selected.ects_earned}/{selected.ects_total}</td>
                          <td className="py-2 pr-3 text-center tabular-nums">{selected.average != null ? selected.average : "—"}</td>
                          <td className="py-2 pl-3" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Synthèse */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="border border-border bg-surface/60 p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Moyenne générale</p>
                    <p className="text-lg font-black text-cama tabular-nums mt-1">
                      {selected.average != null ? `${selected.average}/20` : "—"}
                    </p>
                  </div>
                  <div className="border border-border bg-surface/60 p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Mention</p>
                    <p className="text-lg font-black text-ink mt-1 flex items-center justify-center gap-1.5">
                      {selected.mention ? <><Award className="w-4 h-4 text-gold-dark" /> {selected.mention}</> : "—"}
                    </p>
                  </div>
                  <div className="border border-border bg-surface/60 p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Décision</p>
                    <p className="mt-1.5">
                      <span className={`inline-block border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${DECISION_BADGE[selected.decision ?? ""] ?? "bg-surface text-muted border-border"}`}>
                        {DECISION_LABEL[selected.decision ?? ""] ?? "—"}
                      </span>
                    </p>
                  </div>
                </div>

                <footer className="mt-8 pt-3 border-t border-border text-center text-[10px] text-muted">
                  Document généré le {fmtDate(selected.generated_at)} · CAMA — Institut JFN · Relevé officiel semestriel
                </footer>
              </div>
            </article>
          )}
        </div>
      )}

      {/* Styles d'impression A4 */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
