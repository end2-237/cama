"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, GraduationCap, Loader2, Ban, HelpCircle } from "lucide-react";
import QrSvg from "@/components/QrSvg";
import { supabase } from "@/lib/supabase";
import { verifyDiploma, DIPLOMA_KIND_LABEL, type VerifyStatus, type DBDiploma } from "@/lib/diplomas";

/* Page PUBLIQUE de vérification — accessible sans connexion (un scan suffit). */
export default function VerifyPage() {
  const { code } = useParams<{ code: string }>();
  const decoded = decodeURIComponent(code);

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<VerifyStatus>("introuvable");
  const [diploma, setDiploma] = useState<DBDiploma | undefined>();
  const [studentName, setStudentName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await verifyDiploma(decoded);
      if (!alive) return;
      setStatus(res.status);
      setDiploma(res.diploma);
      if (res.diploma) {
        const { data } = await supabase
          .from("users")
          .select("first_name,last_name")
          .eq("id", res.diploma.student_id)
          .maybeSingle();
        if (!alive) return;
        if (data) setStudentName(`${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [decoded]);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

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
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 text-cama animate-spin mx-auto" />
              <p className="text-sm text-muted mt-4">Vérification du code <span className="font-mono">{decoded}</span>…</p>
            </div>
          ) : status === "valide" && diploma ? (
            <>
              <div className="p-6 text-white text-center" style={{ background: "linear-gradient(135deg, #166534, #16a34a)" }}>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                <p className="text-xl font-bold">Document authentique</p>
                <p className="text-white/70 text-sm font-mono mt-1">{diploma.code}</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="border-2 border-ink rounded-lg p-1 bg-white flex-shrink-0">
                    <QrSvg data={diploma.code} size={64} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-cama" /> {studentName ?? "Étudiant de l'Institut JFN"}
                    </p>
                    <p className="text-xs text-muted">
                      {DIPLOMA_KIND_LABEL[diploma.kind]}
                    </p>
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Émis et signé par l&apos;Institut JFN
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {diploma.parcours_title && <VField label="Filière" value={diploma.parcours_title} />}
                  {diploma.level && <VField label="Niveau" value={diploma.level} />}
                  {diploma.academic_year && <VField label="Année académique" value={diploma.academic_year} />}
                  {diploma.average != null && <VField label="Moyenne" value={`${diploma.average}/20`} />}
                  {diploma.mention && <VField label="Mention" value={diploma.mention} />}
                  <VField label="Date d'émission" value={fmtDate(diploma.issued_at)} />
                </dl>
              </div>
            </>
          ) : status === "revoque" && diploma ? (
            <>
              <div className="p-6 text-white text-center" style={{ background: "linear-gradient(135deg, #991b1b, #dc2626)" }}>
                <Ban className="w-12 h-12 mx-auto mb-2" />
                <p className="text-xl font-bold">Document révoqué</p>
                <p className="text-white/70 text-sm font-mono mt-1">{diploma.code}</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-sm text-muted">
                  Ce document a été <span className="font-bold text-red-600">révoqué</span> par l&apos;Institut JFN
                  {diploma.revoked_at ? ` le ${fmtDate(diploma.revoked_at)}` : ""} et n&apos;est plus valable.
                </p>
              </div>
            </>
          ) : (
            <div className="p-10 text-center">
              <HelpCircle className="w-12 h-12 text-subtle mx-auto mb-3" />
              <p className="text-lg font-bold text-ink mb-1">Code introuvable</p>
              <p className="text-sm text-muted">
                Le code <span className="font-mono">{decoded}</span> n&apos;est pas référencé dans le registre de l&apos;Institut JFN.
              </p>
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

function VField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{label}</dt>
      <dd className="text-sm text-ink mt-0.5">{value}</dd>
    </div>
  );
}
