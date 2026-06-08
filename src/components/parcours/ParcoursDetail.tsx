"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, Clock, Award, GraduationCap, Layers,
  Video, FileText, MonitorPlay, Radio, Check,
  Globe2, Briefcase, Sparkles, MapPin, BookOpen,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  Parcours, COURSE_TYPES, COURS_INTERMEDIAIRES,
  formatFcfa,
} from "@/lib/parcours";

const TYPE_ICON = {
  video:      Video,
  pdf:        FileText,
  plateforme: MonitorPlay,
  live:       Radio,
} as const;

const TYPE_COLOR = {
  video:      "text-cama bg-cama-50",
  pdf:        "text-gold-dark bg-gold/10",
  plateforme: "text-cama bg-cama-50",
  live:       "text-red-500 bg-red-50",
} as const;

export default function ParcoursDetail({ parcours: p }: { parcours: Parcours }) {
  const [year, setYear] = useState(0);

  return (
    <>
      <Navbar />
      <main className="pt-16 bg-white">

        {/* ══ HERO ══ */}
        <section className="relative overflow-hidden bg-white">
          {/* Bloc diagonal + motif */}
          <div className="absolute top-0 right-0 w-[48%] h-full bg-cama-50 -z-0"
            style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)" }} />
          <svg className="absolute top-0 right-0 w-[48%] h-full -z-0 pointer-events-none"
            style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)" }} aria-hidden>
            <defs>
              <pattern id="ptri" x="0" y="0" width="48" height="28" patternUnits="userSpaceOnUse">
                <polyline points="0,28 24,0 48,28" fill="none" stroke="#4F46E5" strokeWidth="1.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ptri)" opacity="0.10"/>
            <circle cx="100%" cy="100%" r="180" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.14"/>
          </svg>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
            {/* Fil d'ariane */}
            <Link href="/#filieres" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Tous les parcours
            </Link>

            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Texte */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge bg-cama-50 text-cama">{p.school}</span>
                  <span className="badge bg-gold/10 text-gold-dark">{p.cycleType}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-light text-ink leading-tight mb-4">
                  {p.title.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="gold-underline font-semibold">{p.title.split(" ").slice(-1)}</span>
                </h1>
                <p className="text-lg text-muted leading-relaxed mb-6 max-w-xl">{p.tagline}</p>

                <div className="flex flex-wrap gap-3">
                  <Link href={`/parcours/${p.slug}/inscription`} className="btn-primary gap-2">
                    S&apos;inscrire à ce parcours <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href={`/parcours/${p.slug}/pricing`} className="btn-outline">
                    Voir les tarifs
                  </Link>
                </div>
              </div>

              {/* Image */}
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl"
                  style={{ borderBottomRightRadius: "6rem" }}>
                  <img src={p.image} alt={p.title} className="w-full h-80 object-cover" />
                </div>
                {/* Carte flottante diplôme */}
                <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl border border-border p-4 max-w-[230px] hidden sm:block">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-cama" />
                    <p className="text-xs font-bold text-ink">Diplôme délivré</p>
                  </div>
                  <p className="text-[11px] text-muted leading-snug">{p.diplome}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STATS BAR ══ */}
        <section className="border-y border-border bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {[
                { icon: Clock,        label: "Durée",       value: p.duration },
                { icon: Layers,       label: "Crédits",     value: `${p.totalEcts} ECTS` },
                { icon: GraduationCap,label: "Niveau",      value: p.level },
                { icon: Award,        label: "Cycles",      value: "3 modalités" },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} className="py-6 px-4 flex items-center gap-3 justify-center">
                  <Icon className="w-5 h-5 text-cama flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-bold text-ink leading-none">{value}</p>
                    <p className="text-[11px] text-muted mt-1">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ À PROPOS ══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <span className="badge bg-cama-50 text-cama mb-4">Le parcours</span>
              <h2 className="text-3xl font-light text-ink mb-5">À propos de la formation</h2>
              <p className="text-muted text-lg leading-relaxed">{p.description}</p>
            </div>
            {/* Débouchés */}
            <div className="bg-cama-50/50 rounded-2xl border border-cama/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-cama" />
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Débouchés</h3>
              </div>
              <ul className="space-y-2.5">
                {p.debouches.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-ink">
                    <Check className="w-4 h-4 text-cama mt-0.5 flex-shrink-0" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ══ TYPES DE COURS ══ */}
        <section className="bg-surface border-y border-border py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="badge bg-gold/10 text-gold-dark mb-4">Modalités pédagogiques</span>
              <h2 className="text-3xl font-light text-ink mb-3">Comment vous apprenez</h2>
              <p className="text-muted">Quatre formats complémentaires, pensés pour le contexte bas-débit camerounais.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COURSE_TYPES.map((t) => {
                const Icon = TYPE_ICON[t.id];
                return (
                  <div key={t.id} className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg hover:border-cama/20 transition-all group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${TYPE_COLOR[t.id]} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-ink mb-2">{t.label}</h3>
                    <p className="text-sm text-muted leading-relaxed">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ PROGRAMME PAR ANNÉE ══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <span className="badge bg-cama-50 text-cama mb-4">Cursus complet</span>
            <h2 className="text-3xl font-light text-ink mb-2">Programme académique</h2>
            <p className="text-muted">Les unités d&apos;enseignement, leurs modalités et leurs évaluations, année par année.</p>
          </div>

          {/* Tabs années */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {p.annees.map((a, i) => (
              <button
                key={a.niveau}
                onClick={() => setYear(i)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                  year === i
                    ? "border-cama bg-cama text-white shadow-md shadow-cama/25"
                    : "border-border text-muted hover:border-cama/40 hover:text-cama"
                }`}
              >
                {a.niveau}
              </button>
            ))}
          </div>

          {/* Contenu année */}
          <div className="animate-fade-up" key={year}>
            <p className="text-lg font-semibold text-ink mb-6">{p.annees[year].titre}</p>
            <div className="grid md:grid-cols-2 gap-6">
              {p.annees[year].semestres.map((s) => (
                <div key={s.nom} className="bg-white rounded-2xl border border-border overflow-hidden">
                  <div className="px-5 py-3 bg-cama-50 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-bold text-cama">{s.nom}</p>
                    <p className="text-xs text-muted">{s.ues.reduce((a, u) => a + u.ects, 0)} ECTS</p>
                  </div>
                  <div className="divide-y divide-border">
                    {s.ues.map((ue) => (
                      <div key={ue.code} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-[10px] font-bold text-subtle">{ue.code}</p>
                            <p className="text-sm font-semibold text-ink leading-snug">{ue.title}</p>
                          </div>
                          <span className="text-xs font-bold text-cama bg-cama-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            {ue.ects} ECTS
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {ue.type.map((t) => {
                            const Icon = TYPE_ICON[t];
                            return (
                              <span key={t} className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLOR[t]}`}>
                                <Icon className="w-3 h-3" /> {COURSE_TYPES.find((c) => c.id === t)?.label}
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-subtle mt-2 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Évaluation : {ue.devoirs}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ OPPORTUNITÉS À L'ÉTRANGER ══ */}
        <section className="relative py-16 overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 60%, #4F46E5 100%)" }}>
          <div className="absolute inset-0 kente-pattern opacity-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="badge bg-white/15 text-gold mb-4">
                <Globe2 className="w-3.5 h-3.5" /> Mobilité internationale
              </span>
              <h2 className="text-3xl font-light mb-3">Vos opportunités à l&apos;étranger</h2>
              <p className="text-white/60">Poursuivez vos études ou réalisez un échange grâce à nos universités partenaires.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {p.opportunites.map((o) => (
                <div key={o.pays} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition-all">
                  <div className="text-3xl mb-3">{o.flag}</div>
                  <p className="font-bold mb-1">{o.pays}</p>
                  <p className="text-gold text-xs font-semibold mb-2">{o.partenaire}</p>
                  <p className="text-white/60 text-sm leading-relaxed">{o.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ COURS INTERMÉDIAIRES ══ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <span className="badge bg-gold/10 text-gold-dark mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Hors parcours
              </span>
              <h2 className="text-3xl font-light text-ink mb-2">Cours intermédiaires</h2>
              <p className="text-muted max-w-xl">Enrichissez votre profil avec des cours complémentaires — gratuits ou payants — en plus de votre cycle.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COURS_INTERMEDIAIRES.map((c) => (
              <div key={c.slug} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md hover:border-cama/20 transition-all flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{c.emoji}</div>
                  {c.gratuit ? (
                    <span className="badge bg-green-50 text-green-600 text-[10px]">Gratuit</span>
                  ) : (
                    <span className="badge bg-gold/10 text-gold-dark text-[10px]">{formatFcfa(c.prix!)}</span>
                  )}
                </div>
                <h3 className="font-bold text-ink mb-1">{c.title}</h3>
                <p className="text-sm text-muted leading-relaxed mb-3 flex-1">{c.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-subtle flex items-center gap-1"><Clock className="w-3 h-3" /> {c.duree}</span>
                  <button className="text-xs font-bold text-cama hover:underline">S&apos;inscrire →</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ CTA FINAL ══ */}
        <section className="bg-surface border-t border-border py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-light text-ink mb-4">
              Prêt à rejoindre le parcours{" "}
              <span className="text-gradient font-semibold">{p.title}</span> ?
            </h2>
            <p className="text-muted mb-8 max-w-xl mx-auto">
              Choisissez votre cycle — présentiel, hybride ou 100% en ligne — et découvrez les tarifs adaptés.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={`/parcours/${p.slug}/inscription`} className="btn-primary gap-2">
                Démarrer mon inscription <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={`/parcours/${p.slug}/campus`} className="btn-outline gap-2">
                <MapPin className="w-4 h-4" /> Découvrir le campus
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
