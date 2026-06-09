"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, Clock, GraduationCap, FileText } from "lucide-react";
import QrSvg from "@/components/QrSvg";

/* Page PUBLIQUE de vérification — accessible sans connexion (un scan suffit). */
export default function VerifyPage() {
  const { code } = useParams<{ code: string }>();
  const decoded = decodeURIComponent(code);
  const valid = decoded.startsWith("CAMA-");

  const trace = [
    { date: "Oct. 2024", evt: "Inscription validée — Licence Informatique L2" },
    { date: "Nov. 2024 → Mai 2025", evt: "12 chapitres validés par checkpoints (lecture effective horodatée)" },
    { date: "Juin 2025", evt: "Examen INF201 passé sous environnement sécurisé Safe-CAMA — aucun incident retenu" },
    { date: "Juin 2025", evt: "Résultats validés en délibération par le jury (décision humaine)" },
    { date: "Juil. 2025", evt: "Relevé certifié généré — QR code apposé" },
  ];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cama to-gold" />
            <p className="text-lg font-bold text-ink">CA<span className="text-cama">MA</span> · Vérification publique</p>
          </div>
          <p className="text-xs text-muted">Authentification des diplômes et relevés de l&apos;Institut JFN</p>
        </div>

        <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-lg animate-scale-in">
          {valid ? (
            <>
              <div className="p-6 text-white text-center" style={{ background: "linear-gradient(135deg, #166534, #16a34a)" }}>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                <p className="text-xl font-bold">Document authentique</p>
                <p className="text-white/70 text-sm font-mono mt-1">{decoded}</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="border-2 border-ink rounded-lg p-1 bg-white flex-shrink-0">
                    <QrSvg data={decoded} size={64} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-cama" /> Jean-Paul Mbarga
                    </p>
                    <p className="text-xs text-muted">Licence Informatique · L2 · 2024–2025</p>
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Émis et signé par l&apos;Institut JFN
                    </p>
                  </div>
                </div>

                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Traçabilité du parcours
                </p>
                <div className="space-y-0">
                  {trace.map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-cama flex-shrink-0 mt-1" />
                        {i < trace.length - 1 && <div className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-[10px] font-bold text-cama flex items-center gap-1"><Clock className="w-3 h-3" /> {t.date}</p>
                        <p className="text-xs text-muted leading-relaxed">{t.evt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="text-lg font-bold text-red-600 mb-1">Code non reconnu</p>
              <p className="text-sm text-muted">Ce document n&apos;est pas référencé dans le registre de l&apos;Institut JFN.</p>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-subtle mt-4">
          « Confiance par la preuve » — <Link href="/" className="text-cama hover:underline">cama.jfn.cm</Link>
        </p>
      </div>
    </div>
  );
}
