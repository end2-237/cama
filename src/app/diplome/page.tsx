"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, GraduationCap, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchDeliberations, type DelibWithMeta } from "@/lib/exams";
import QrSvg from "@/components/QrSvg";

export default function DiplomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<DelibWithMeta[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const all = await fetchDeliberations();
      setResults(all.filter((r) => r.student_id === user.id && r.status === "valide"));
      setFetching(false);
    })();
  }, [user]);

  if (loading || !user) return null;

  const credits = results.reduce((a, r) => a + (r.credits ?? 0), 0);
  const code = `CAMA-${user.id.slice(0, 8).toUpperCase()}-2025`;

  return (
    <div className="min-h-screen bg-surface py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <button className="btn-primary py-2 px-4 text-xs gap-1.5"><Download className="w-3.5 h-3.5" /> Télécharger le PDF</button>
        </div>

        {fetching ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
        ) : (
          <>
        {/* ── Document ── */}
        <div className="bg-white rounded-3xl border-2 border-cama/20 overflow-hidden shadow-xl">
          {/* Bande haute */}
          <div className="h-2 bg-gradient-to-r from-cama via-gold to-cama" />
          <div className="p-10 relative">
            {/* Filigrane */}
            <div className="absolute inset-0 kente-pattern opacity-[0.04] pointer-events-none" />

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-cama to-gold" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">République du Cameroun · Institut JFN</p>
                  <p className="text-xl font-bold text-ink">CA<span className="text-cama">MA</span> · Relevé certifié</p>
                </div>
              </div>
              <p className="text-xs text-subtle uppercase tracking-[0.3em]">Relevé de notes & attestation de crédits</p>
            </div>

            <div className="text-center mb-8">
              <p className="text-sm text-muted mb-1">Délivré à</p>
              <p className="text-3xl font-light text-ink">{user.name}</p>
              <p className="text-sm text-muted mt-1">{user.school} · Niveau {user.level || "—"} · Année 2024–2025</p>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-cama/20">
                  <th className="text-left text-[10px] font-bold text-muted uppercase tracking-widest py-2">Unité d&apos;enseignement</th>
                  <th className="text-right text-[10px] font-bold text-muted uppercase tracking-widest py-2">Note</th>
                  <th className="text-right text-[10px] font-bold text-muted uppercase tracking-widest py-2">Crédits</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="py-2.5 text-sm text-ink">{r.course?.code} — {r.course?.title}</td>
                    <td className="py-2.5 text-sm font-bold text-right text-ink">{r.note}/20</td>
                    <td className="py-2.5 text-sm text-right text-ink">{r.credits ?? 0} ECTS</td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-sm text-muted">Aucune délibération validée pour le moment.</td></tr>
                )}
                <tr>
                  <td className="py-3 text-sm font-bold text-ink">Total validé par le jury</td>
                  <td />
                  <td className="py-3 text-sm font-bold text-right text-cama">{credits} ECTS</td>
                </tr>
              </tbody>
            </table>

            {/* QR + signature */}
            <div className="flex items-end justify-between flex-wrap gap-6">
              <div>
                <p className="text-[10px] text-subtle mb-2">Vérifiable en un scan — traçabilité complète du parcours</p>
                <div className="flex items-center gap-3">
                  <div className="border-2 border-ink rounded-lg p-1.5 bg-white">
                    <QrSvg data={code} size={88} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted">{code}</p>
                    <Link href={`/verifier/${code}`} className="text-xs text-cama font-bold hover:underline">
                      cama.jfn.cm/verifier
                    </Link>
                    <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3 h-3" /> Authentifié Safe-CAMA
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <GraduationCap className="w-8 h-8 text-gold mx-auto mb-1" />
                <p className="text-xs font-bold text-ink">Le Jury de l&apos;Institut JFN</p>
                <p className="text-[10px] text-subtle italic">Délibération du {new Date().toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gradient-to-r from-gold via-cama to-gold" />
        </div>

        <p className="text-center text-[11px] text-subtle mt-4">
          Ce document est rattaché à la traçabilité complète du parcours (actions horodatées) — Confiance par la preuve.
        </p>
          </>
        )}
      </div>
    </div>
  );
}
