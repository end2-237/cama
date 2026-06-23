"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Scale, Gavel, Loader2, ChevronRight, Award, CheckCircle2,
} from "lucide-react";
import { fetchDeliberations, type DelibWithMeta } from "@/lib/exams";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function JuryView({ tab }: { tab: string }) {
  return <DeliberationTab />;
}

function DeliberationTab() {
  const [delibs, setDelibs] = useState<DelibWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setDelibs(await fetchDeliberations());
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-cama mx-auto" /></div>
  );

  const pending = delibs.filter((d) => d.status === "en_delib");
  const validated = delibs.filter((d) => d.status === "valide");
  const totalEcts = validated.reduce((a, d) => a + d.credits, 0);

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Scale className="w-5 h-5 text-ink" strokeWidth={1.5} />
        <h1 className="text-xl font-light text-ink">Tableau de bord du jury</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden mb-5">
        {[
          { label: "Dossiers", value: delibs.length, color: "text-ink" },
          { label: "En délibération", value: pending.length, color: "text-gold-dark" },
          { label: "Validés", value: validated.length, color: "text-green-600" },
          { label: "ECTS attribués", value: totalEcts, color: "text-cama" },
        ].map((k) => (
          <div key={k.label} className="bg-white p-4 text-center">
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[11px] text-muted mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Accès page complète */}
      <Link href="/jury/deliberations"
        className="flex items-center gap-3 p-4 bg-white border border-border rounded-xl hover:border-cama/40 transition-all mb-5">
        <Gavel className="w-5 h-5 text-cama" />
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">Ouvrir le tableau des délibérations</p>
          <p className="text-[11px] text-muted">Valider/rejeter les dossiers, éditer les notes, attribuer les ECTS</p>
        </div>
        <ChevronRight className="w-4 h-4 text-subtle" />
      </Link>

      {/* Aperçu dossiers en attente */}
      {pending.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-ink uppercase tracking-widest mb-2">
            En attente de délibération ({pending.length})
          </h2>
          <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden mb-5">
            {pending.slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">
                    {d.student ? `${d.student.first_name} ${d.student.last_name}` : d.student_id.slice(0, 8)}
                  </p>
                  <p className="text-[11px] text-muted">
                    {d.course ? `${d.course.code} · ${d.course.title} · ${d.course.ects} ECTS` : "—"}
                  </p>
                </div>
                <span className="text-sm font-bold text-ink">{d.note ?? "—"}/20</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/10 text-gold-dark">En délibération</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Validés récents */}
      {validated.length > 0 && (
        <>
          <h2 className="text-xs font-bold text-ink uppercase tracking-widest mb-2">
            Récemment validés ({validated.length})
          </h2>
          <div className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden">
            {validated.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink">
                    {d.student ? `${d.student.first_name} ${d.student.last_name}` : d.student_id.slice(0, 8)}
                    {" · "}{d.course?.code ?? "—"}
                  </p>
                </div>
                <span className="text-sm font-bold text-ink">{d.note}/20</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-cama">
                  <Award className="w-3.5 h-3.5" /> {d.credits} ECTS
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {delibs.length === 0 && (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <Gavel className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink mb-1">Aucun dossier</p>
          <p className="text-xs text-muted">Les copies envoyées en délibération par les enseignants apparaîtront ici.</p>
        </div>
      )}
    </div>
  );
}
