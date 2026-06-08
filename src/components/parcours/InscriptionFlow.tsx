"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Building2, Laptop, Blend,
  ChevronRight, GraduationCap, Sparkles,
} from "lucide-react";
import {
  Parcours, CYCLES, CycleId, priceForCycle, formatFcfa,
} from "@/lib/parcours";

const CYCLE_ICON: Record<CycleId, typeof Building2> = {
  presentiel: Building2,
  hybride:    Blend,
  online:     Laptop,
};

export default function InscriptionFlow({ parcours: p }: { parcours: Parcours }) {
  const router = useRouter();
  const [step,  setStep]  = useState<1 | 2>(1);
  const [cycle, setCycle] = useState<CycleId | null>(null);

  const goPricing = () => {
    if (cycle) router.push(`/parcours/${p.slug}/pricing?cycle=${cycle}`);
  };

  return (
    <div className="min-h-screen bg-surface">

      {/* Top bar */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href={`/parcours/${p.slug}`} className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au parcours
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-1.5 h-7 rounded-full bg-gradient-to-b from-cama to-gold" />
            <span className="font-bold text-ink">CA<span className="text-cama">MA</span></span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Stepper */}
        <div className="flex items-center gap-3 mb-10 max-w-md">
          {[
            { n: 1, label: "Choix du cycle" },
            { n: 2, label: "Confirmation" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                step > s.n ? "bg-green-500 text-white"
                : step === s.n ? "bg-cama text-white animate-pulse-ring"
                : "bg-border text-subtle"
              }`}>
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-xs font-medium ${step >= s.n ? "text-cama" : "text-subtle"}`}>{s.label}</span>
              {i === 0 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Bandeau parcours */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-white rounded-2xl border border-border">
          <div className="w-11 h-11 rounded-xl bg-cama-50 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-cama" />
          </div>
          <div>
            <p className="text-xs text-muted">{p.school} · {p.cycleType}</p>
            <p className="font-bold text-ink">{p.title}</p>
          </div>
        </div>

        {step === 1 ? (
          <div className="animate-scale-in">
            <h1 className="text-3xl font-light text-ink mb-2">Choisissez votre cycle</h1>
            <p className="text-muted mb-8">Sélectionnez la modalité qui correspond le mieux à votre situation.</p>

            <div className="space-y-4">
              {CYCLES.map((c) => {
                const Icon = CYCLE_ICON[c.id];
                const selected = cycle === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCycle(c.id)}
                    className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
                      selected ? "border-cama bg-cama-50 shadow-md shadow-cama/10"
                      : "border-border bg-white hover:border-cama/30"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? "bg-cama text-white" : "bg-cama-50 text-cama"
                      }`}>
                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={`font-bold ${selected ? "text-cama" : "text-ink"}`}>{c.label}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-ink">{formatFcfa(priceForCycle(p, c.id))}</p>
                            <span className="text-[10px] text-subtle">/an</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted mb-3">{c.tagline}</p>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {c.highlights.map((h) => (
                            <p key={h} className="text-xs text-ink flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-cama mt-0.5 flex-shrink-0" /> {h}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected ? "border-cama bg-cama" : "border-border"
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => cycle && setStep(2)}
                disabled={!cycle}
                className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-scale-in">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm text-muted hover:text-ink mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Modifier le cycle
            </button>

            <h1 className="text-3xl font-light text-ink mb-2">Récapitulatif</h1>
            <p className="text-muted mb-8">Vérifiez vos choix avant de passer aux tarifs détaillés.</p>

            {(() => {
              const c = CYCLES.find((x) => x.id === cycle)!;
              const Icon = CYCLE_ICON[c.id];
              const price = priceForCycle(p, c.id);
              return (
                <div className="bg-white rounded-2xl border border-border overflow-hidden mb-8">
                  <div className="p-5 border-b border-border flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cama flex items-center justify-center text-white flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-muted">Cycle sélectionné</p>
                      <p className="font-bold text-ink text-lg">{c.label}</p>
                      <p className="text-sm text-muted">{c.tagline}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-muted">Frais de scolarité (annuel)</span>
                      <span className="font-bold text-ink">{formatFcfa(price)}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-muted">Frais de dossier</span>
                      <span className="font-bold text-ink">{formatFcfa(p.fraisDossier)}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4 bg-cama-50">
                      <span className="text-sm font-bold text-ink">Total première année</span>
                      <span className="font-bold text-cama text-lg">{formatFcfa(price + p.fraisDossier)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Onboarding info selon cycle */}
            {cycle !== "online" && (
              <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5 mb-8 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-gold-dark flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-ink mb-1">Cycle sur le campus</p>
                  <p className="text-sm text-muted leading-relaxed">
                    Ce cycle inclut des cours sur le campus de Yaoundé. Consultez les{" "}
                    <Link href={`/parcours/${p.slug}/campus`} className="text-cama font-semibold hover:underline">détails du campus</Link>{" "}
                    et le{" "}
                    <Link href={`/parcours/${p.slug}/reglement`} className="text-cama font-semibold hover:underline">règlement intérieur</Link>{" "}
                    avant de finaliser.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-end">
              <Link href={`/parcours/${p.slug}/pricing?cycle=${cycle}`} className="btn-outline gap-2">
                Voir les tarifs détaillés
              </Link>
              <button onClick={goPricing} className="btn-primary gap-2">
                Continuer vers le paiement <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
