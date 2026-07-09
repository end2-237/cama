"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote: "Avec CAMA, je peux suivre mes cours même quand ma connexion est mauvaise. Le mode texte change vraiment la donne pour nous à Douala.",
    name:  "Fatima N.",
    role:  "Étudiante L2 Informatique",
    school:"École d'Informatique · JFN",
    avatar:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=80",
  },
  {
    quote: "Les statistiques de progression me permettent enfin de voir quel chapitre pose problème à mes étudiants avant même l'examen. C'est révolutionnaire pour l'enseignement.",
    name:  "Dr. Pierre T.",
    role:  "Enseignant, Réseaux & Télécom",
    school:"École d'Informatique · JFN",
    avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
  },
  {
    quote: "La certification PDF avec QR Code donne enfin une vraie crédibilité à nos diplômes. Les employeurs camerounais peuvent vérifier instantanément l'authenticité.",
    name:  "M. Emmanuel B.",
    role:  "Directeur Académique",
    school:"Institut JFN",
    avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
  },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const t = testimonials[idx];

  return (
    <section className="section-surface py-24 overflow-hidden relative" id="roles">

      {/* Décoration cercle indigo léger */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-cama-50 blur-3xl -z-0" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">

        {/* Guillemets — or (originalité) */}
        <div className="flex justify-center mb-8">
          <svg width="52" height="44" viewBox="0 0 52 44" fill="none">
            <path d="M0 44V26C0 11.7 9.1 3.6 27.3 0l3.3 5.5C20.3 7.7 16.2 12.8 15.1 19.8h8.8V44H0zm27.9 0V26C27.9 11.7 37 3.6 55.2 0l3.3 5.5C48.2 7.7 44.1 12.8 43 19.8h8.8V44H27.9z"
              fill="#F59E0B"/>
          </svg>
        </div>

        {/* Quote */}
        <p className="text-2xl md:text-3xl font-light text-ink italic leading-relaxed mb-10 transition-opacity duration-300">
          &ldquo;{t.quote}&rdquo;
        </p>

        {/* Avatar + auteur — originalité vs NetAcad (pas d'avatar chez eux) */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <img
            src={t.avatar}
            alt={t.name}
            className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div className="text-left">
            <p className="text-base font-bold text-ink">{t.name}</p>
            <p className="text-sm text-muted">{t.role}</p>
            <p className="text-xs text-cama font-medium">{t.school}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setIdx((idx - 1 + testimonials.length) % testimonials.length)}
            className="w-10 h-10 flex items-center justify-center text-cama hover:text-cama-700 transition-colors"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === idx
                    ? "w-7 h-2.5 bg-gradient-to-r from-cama to-gold"
                    : "w-2.5 h-2.5 bg-border"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setIdx((idx + 1) % testimonials.length)}
            className="w-10 h-10 flex items-center justify-center text-cama hover:text-cama-700 transition-colors"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </div>
    </section>
  );
}
