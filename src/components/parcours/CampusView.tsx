"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, MapPin, Clock, Wifi, BookOpen, Coffee, FlaskConical,
  Users, Building2, Laptop, Blend, CalendarDays, ScrollText, ChevronRight,
  GraduationCap, Bus, Dumbbell,
} from "lucide-react";
import { Parcours, CycleId, CYCLES } from "@/lib/parcours";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const repartition: Record<CycleId, { jour: string; mode: string }[]> = {
  presentiel: [
    { jour: "Lundi",    mode: "Campus · Cours magistraux" },
    { jour: "Mardi",    mode: "Campus · Travaux dirigés" },
    { jour: "Mercredi", mode: "Campus · Travaux pratiques" },
    { jour: "Jeudi",    mode: "Campus · Cours magistraux" },
    { jour: "Vendredi", mode: "Campus · TP & projets" },
  ],
  hybride: [
    { jour: "Lundi",    mode: "En ligne · Cours vidéo & lives" },
    { jour: "Mardi",    mode: "Campus · Travaux pratiques" },
    { jour: "Mercredi", mode: "En ligne · Cours plateforme" },
    { jour: "Jeudi",    mode: "Campus · TD & encadrement" },
    { jour: "Vendredi", mode: "En ligne · Travail autonome" },
  ],
  online: [
    { jour: "Lundi",    mode: "Cours vidéo (asynchrone)" },
    { jour: "Mardi",    mode: "Live enseignant · 18h" },
    { jour: "Mercredi", mode: "Quiz & exercices plateforme" },
    { jour: "Jeudi",    mode: "Live enseignant · 18h" },
    { jour: "Vendredi", mode: "Travail autonome & forum" },
  ],
};

export default function CampusView({ parcours: p }: { parcours: Parcours }) {
  const params = useSearchParams();
  const cycle = (params.get("cycle") as CycleId) || "presentiel";
  const isOnline = cycle === "online";
  const cycleLabel = CYCLES.find((c) => c.id === cycle)?.label || "Présentiel";

  return (
    <>
      <Navbar />
      <main className="pt-16 bg-white">

        {/* HERO */}
        <section className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 70%, #4F46E5 100%)" }}>
          <div className="absolute inset-0 kente-pattern opacity-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 text-white">
            <Link href={`/parcours/${p.slug}/inscription`} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour à l&apos;inscription
            </Link>
            <span className="badge bg-white/15 text-gold mb-4">
              {isOnline ? <Laptop className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
              Cycle {cycleLabel}
            </span>
            <h1 className="text-4xl md:text-5xl font-light mb-4">
              {isOnline ? "Votre campus numérique" : "Campus JFN Yaoundé"}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl">
              {isOnline
                ? "Tout votre parcours accessible en ligne, où que vous soyez, optimisé pour le bas-débit."
                : "Un cadre d'apprentissage moderne au cœur de Yaoundé, pensé pour la réussite académique."}
            </p>
          </div>
        </section>

        {isOnline ? (
          /* ════ MODE 100% ONLINE ════ */
          <>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Laptop,     title: "Plateforme CAMA",   desc: "Accès 24/7 à tous vos cours vidéo, PDF et modules interactifs." },
                  { icon: Wifi,       title: "Bas-débit natif",   desc: "Contenus compressés, téléchargeables pour étudier hors-ligne." },
                  { icon: Users,      title: "Lives hebdo",        desc: "Sessions en direct avec les enseignants, replays disponibles." },
                  { icon: GraduationCap, title: "Examens proctorés", desc: "Surveillance IA anti-fraude, passez vos examens de chez vous." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-cama-50 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-cama" />
                    </div>
                    <h3 className="font-bold text-ink mb-2">{title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* ════ MODE PRÉSENTIEL / HYBRIDE ════ */
          <>
            {/* Infos campus */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="rounded-3xl overflow-hidden shadow-xl" style={{ borderBottomLeftRadius: "5rem" }}>
                  <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=900&q=80" alt="Campus JFN" className="w-full h-80 object-cover" />
                </div>
                <div>
                  <span className="badge bg-cama-50 text-cama mb-4"><MapPin className="w-3.5 h-3.5" /> Localisation</span>
                  <h2 className="text-3xl font-light text-ink mb-4">Institut JFN — Yaoundé</h2>
                  <p className="text-muted leading-relaxed mb-6">
                    Situé au quartier Bastos, le campus offre amphithéâtres modernes, laboratoires équipés,
                    espaces de coworking et une bibliothèque numérique. Un environnement propice à l&apos;excellence.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: FlaskConical, label: "Laboratoires équipés" },
                      { icon: BookOpen,     label: "Bibliothèque & médiathèque" },
                      { icon: Wifi,         label: "Wifi haut-débit campus" },
                      { icon: Coffee,       label: "Cafétéria & espaces détente" },
                      { icon: Bus,          label: "Navette & accès transport" },
                      { icon: Dumbbell,     label: "Activités sportives" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2 text-sm text-ink">
                        <Icon className="w-4 h-4 text-cama flex-shrink-0" /> {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Horaires de présence */}
            <section className="bg-surface border-y border-border py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div>
                    <span className="badge bg-gold/10 text-gold-dark mb-4"><Clock className="w-3.5 h-3.5" /> Horaires</span>
                    <h2 className="text-2xl font-light text-ink mb-4">Heures de présence</h2>
                    <p className="text-muted leading-relaxed mb-4">
                      Les cours se déroulent du lundi au vendredi. La présence est{" "}
                      {cycle === "hybride" ? "requise les jours en présentiel uniquement" : "obligatoire pour valider le contrôle continu"}.
                    </p>
                    <div className="bg-white rounded-xl border border-border p-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted">Matin</span><span className="font-semibold text-ink">08h00 – 12h00</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted">Après-midi</span><span className="font-semibold text-ink">13h30 – 17h00</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted">Présence min.</span><span className="font-semibold text-cama">75% requise</span></div>
                    </div>
                  </div>

                  {/* Répartition semaine */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarDays className="w-5 h-5 text-cama" />
                      <h3 className="font-bold text-ink">Répartition hebdomadaire — {cycleLabel}</h3>
                    </div>
                    <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
                      {repartition[cycle].map((r) => {
                        const onCampus = r.mode.includes("Campus");
                        return (
                          <div key={r.jour} className="flex items-center gap-4 px-5 py-3.5">
                            <span className="text-sm font-bold text-ink w-20 flex-shrink-0">{r.jour}</span>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${onCampus ? "bg-cama-50 text-cama" : "bg-gold/10 text-gold-dark"}`}>
                              {onCampus ? <Building2 className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-sm text-muted">{r.mode}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Diplôme + lien règlement */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-cama-50/50 rounded-2xl border border-cama/10 p-8">
              <GraduationCap className="w-8 h-8 text-cama mb-4" />
              <h3 className="text-xl font-bold text-ink mb-2">Diplôme délivré</h3>
              <p className="text-muted leading-relaxed mb-4">{p.diplome}</p>
              <div className="flex items-center gap-2 text-sm text-cama font-semibold">
                <Blend className="w-4 h-4" /> Valable en présentiel, hybride et en ligne
              </div>
            </div>
            <Link href={`/parcours/${p.slug}/reglement`} className="group bg-white rounded-2xl border border-border p-8 hover:shadow-lg hover:border-cama/20 transition-all flex flex-col">
              <ScrollText className="w-8 h-8 text-gold-dark mb-4" />
              <h3 className="text-xl font-bold text-ink mb-2">Règlement intérieur</h3>
              <p className="text-muted leading-relaxed flex-1">
                Consultez les règles de vie, l&apos;assiduité, la discipline et les modalités d&apos;évaluation de JFN.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-cama font-bold text-sm group-hover:gap-2 transition-all">
                Lire le règlement <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>

          <div className="text-center mt-10">
            <Link href={`/parcours/${p.slug}/pricing?cycle=${cycle}`} className="btn-primary gap-2">
              Continuer vers les tarifs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
