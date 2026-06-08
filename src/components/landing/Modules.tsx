"use client";

import { useState } from "react";
import {
  BookOpen, Upload, MessageSquare, BarChart3,
  ClipboardList, Brain, Award, ShieldCheck,
  ChevronRight,
} from "lucide-react";

const modules = [
  {
    id: "A",
    label: "Module A",
    title: "Plateforme & LMS",
    subtitle: "Infrastructure & Apprentissage",
    color: "primary",
    gradient: "from-primary-700 to-primary-600",
    features: [
      {
        icon: BookOpen,
        name: "Gestion académique",
        desc: "Hiérarchie complète : Écoles → Cycles → Filières → Niveaux → UE avec crédits ECTS et coefficients",
      },
      {
        icon: Upload,
        name: "Cours & Ressources",
        desc: "Organisation par chapitres, upload PDF/vidéos/liens, checkpoints de lecture, mode bas-débit natif",
      },
      {
        icon: MessageSquare,
        name: "Communication",
        desc: "Forums par UE, annonces avec accusé de réception, notifications en temps réel",
      },
      {
        icon: BarChart3,
        name: "Suivi académique",
        desc: "Progression par cours, historique de consultation, statistiques enseignant avec détection de décrochage",
      },
    ],
  },
  {
    id: "B",
    label: "Module B",
    title: "Évaluations & Certification",
    subtitle: "Intelligence & Intégrité",
    color: "accent",
    gradient: "from-emerald-700 to-accent",
    features: [
      {
        icon: ClipboardList,
        name: "Moteur d'examens Safe-CAMA",
        desc: "QCM, questions ouvertes, timer, soumission automatique, sauvegarde locale toutes les 15 secondes",
      },
      {
        icon: Brain,
        name: "Analyse Anti-IA",
        desc: "Mesure de latence de frappe, détection de collage massif, blocage copy-paste système en mode examen",
      },
      {
        icon: ShieldCheck,
        name: "Proctoring IA (OpenCV)",
        desc: "Microservice Python/Flask : captures aléatoires, détection visage absent, tierce personne, smartphone via YOLOv8",
      },
      {
        icon: Award,
        name: "Résultats & Certification",
        desc: "Calcul LMD automatique, moyennes pondérées, validation jury, génération PDF avec QR Code sécurisé",
      },
    ],
  },
];

export default function Modules() {
  const [active, setActive] = useState("A");
  const mod = modules.find((m) => m.id === active)!;

  return (
    <section id="modules" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-4">
            Architecture
          </span>
          <h2 className="section-title mb-4">Deux modules, une vision</h2>
          <p className="section-subtitle max-w-xl mx-auto">
            CAMA est structurée en deux modules complémentaires couvrant
            l&apos;intégralité du parcours académique numérique.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-2xl p-1.5 bg-slate-100 gap-1">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active === m.id
                    ? "bg-white text-primary-700 shadow-md"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m.label} — {m.title}
              </button>
            ))}
          </div>
        </div>

        {/* Module content */}
        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          {/* Left — module hero card */}
          <div className={`lg:col-span-2 rounded-3xl bg-gradient-to-br ${mod.gradient} p-8 flex flex-col justify-between text-white`}>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-widest uppercase mb-6">
                Module {mod.id}
              </span>
              <h3 className="text-3xl font-bold leading-tight mb-2">{mod.title}</h3>
              <p className="text-white/70 text-sm">{mod.subtitle}</p>
            </div>

            <div className="mt-8">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Fonctionnalités", value: "4 blocs" },
                  { label: "Rôles couverts", value: mod.id === "A" ? "4 rôles" : "5 rôles" },
                  { label: "Semaines", value: mod.id === "A" ? "S1 → S8" : "S1 → S8" },
                  { label: "Stack", value: mod.id === "A" ? "Next.js" : "Python + IA" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 rounded-xl p-3">
                    <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                    <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — feature list */}
          <div className="lg:col-span-3 space-y-4">
            {mod.features.map(({ icon: Icon, name, desc }) => (
              <div
                key={name}
                className="card p-5 flex gap-4 group hover:border-primary-200 cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-primary-900">{name}</h4>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
