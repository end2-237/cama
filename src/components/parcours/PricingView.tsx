"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Check, Building2, Laptop, Blend, CreditCard,
  Smartphone, Landmark, ShieldCheck, Info,
} from "lucide-react";
import {
  Parcours, CYCLES, CycleId, priceForCycle, formatFcfa,
} from "@/lib/parcours";

const CYCLE_ICON: Record<CycleId, typeof Building2> = {
  presentiel: Building2,
  hybride:    Blend,
  online:     Laptop,
};

export default function PricingView({ parcours: p }: { parcours: Parcours }) {
  const params = useSearchParams();
  const initial = (params.get("cycle") as CycleId) || "presentiel";
  const [cycle, setCycle] = useState<CycleId>(
    CYCLES.some((c) => c.id === initial) ? initial : "presentiel"
  );
  const [plan, setPlan] = useState<"annuel" | "semestriel" | "mensuel">("annuel");

  const scolarite = priceForCycle(p, cycle);

  const plans = {
    annuel:      { label: "Paiement annuel",     n: 1,  remise: 0.05, sub: "−5% de remise" },
    semestriel:  { label: "Paiement semestriel", n: 2,  remise: 0,    sub: "En 2 versements" },
    mensuel:     { label: "Paiement mensuel",    n: 9,  remise: 0,    sub: "Sur 9 mois" },
  };
  const cur = plans[plan];
  const scolariteRemise = Math.round((scolarite * (1 - cur.remise)) / 1000) * 1000;
  const totalAvecRemise = scolariteRemise + p.fraisDossier;
  const parVersement = Math.round((scolariteRemise / cur.n) / 1000) * 1000;

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href={`/parcours/${p.slug}/inscription`} className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" /> Inscription
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-1.5 h-7 rounded-full bg-gradient-to-b from-cama to-gold" />
            <span className="font-bold text-ink">CA<span className="text-cama">MA</span></span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <span className="badge bg-cama-50 text-cama mb-3">Tarifs · {p.title}</span>
          <h1 className="text-3xl font-light text-ink mb-2">Frais de scolarité</h1>
          <p className="text-muted">Tarifs en francs CFA, adaptés au standard de la formation et à votre cycle.</p>
        </div>

        {/* Sélecteur cycle */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {CYCLES.map((c) => {
            const Icon = CYCLE_ICON[c.id];
            const selected = cycle === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCycle(c.id)}
                className={`rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                  selected ? "border-cama bg-cama-50 shadow-md shadow-cama/10" : "border-border bg-white hover:border-cama/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? "bg-cama text-white" : "bg-cama-50 text-cama"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {selected && <Check className="w-4 h-4 text-cama" />}
                </div>
                <p className={`font-bold text-sm ${selected ? "text-cama" : "text-ink"}`}>{c.label}</p>
                <p className="text-sm font-bold text-ink mt-1">{formatFcfa(priceForCycle(p, c.id))}<span className="text-xs text-subtle font-normal">/an</span></p>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── Modalités de paiement ── */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-ink mb-1">Modalité de paiement</h2>
            <p className="text-sm text-muted mb-5">Choisissez l&apos;échéancier qui vous convient.</p>

            <div className="space-y-3 mb-6">
              {(Object.keys(plans) as (keyof typeof plans)[]).map((k) => {
                const selected = plan === k;
                return (
                  <button
                    key={k}
                    onClick={() => setPlan(k)}
                    className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                      selected ? "border-cama bg-cama-50" : "border-border hover:border-cama/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? "border-cama bg-cama" : "border-border"}`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-ink">{plans[k].label}</p>
                        <p className="text-xs text-muted">{plans[k].sub}</p>
                      </div>
                    </div>
                    {plans[k].remise > 0 && (
                      <span className="badge bg-green-50 text-green-600 text-[10px]">Économie</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Moyens de paiement */}
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Moyens de paiement acceptés</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Smartphone, label: "Mobile Money", sub: "MTN · Orange" },
                { icon: Landmark,   label: "Virement",      sub: "Banque" },
                { icon: CreditCard, label: "Carte",         sub: "Visa · MC" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="border border-border rounded-xl p-3 text-center">
                  <Icon className="w-5 h-5 text-cama mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-ink">{label}</p>
                  <p className="text-[10px] text-subtle">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Récapitulatif ── */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden sticky top-24">
            <div className="px-5 py-4 border-b border-border" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)" }}>
              <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Récapitulatif</p>
              <p className="text-white font-bold">{CYCLES.find((c) => c.id === cycle)!.label} · {p.cycleType}</p>
            </div>
            <div className="divide-y divide-border">
              <Row label="Scolarité annuelle" value={formatFcfa(scolarite)} />
              {cur.remise > 0 && (
                <Row label={`Remise (−${cur.remise * 100}%)`} value={`− ${formatFcfa(scolarite - scolariteRemise)}`} green />
              )}
              <Row label="Frais de dossier" value={formatFcfa(p.fraisDossier)} />
              <div className="flex items-center justify-between px-5 py-4 bg-cama-50">
                <span className="text-sm font-bold text-ink">Total année</span>
                <span className="font-bold text-cama text-lg">{formatFcfa(totalAvecRemise)}</span>
              </div>
              {cur.n > 1 && (
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-muted">Soit {cur.n} × </span>
                  <span className="text-sm font-bold text-ink">{formatFcfa(parVersement)}</span>
                </div>
              )}
            </div>
            <div className="p-5">
              <button className="w-full btn-primary justify-center mb-3">
                Procéder au paiement
              </button>
              <p className="text-[11px] text-subtle flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-3.5 h-3.5" /> Paiement sécurisé · Reçu officiel JFN
              </p>
            </div>
          </div>
        </div>

        {/* Note bourses */}
        <div className="mt-6 bg-gold/5 border border-gold/20 rounded-2xl p-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-gold-dark flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted leading-relaxed">
            <span className="font-bold text-ink">Bourses & facilités :</span> JFN propose des bourses au mérite et des
            facilités de paiement pour les étudiants en difficulté. Contactez la scolarité pour étudier votre dossier.
          </p>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-semibold ${green ? "text-green-600" : "text-ink"}`}>{value}</span>
    </div>
  );
}
