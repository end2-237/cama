"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote: "Avec CAMA, je peux suivre mes cours même quand ma connexion est mauvaise. Le mode texte change vraiment la donne pour nous à Yaoundé.",
    name: "Fatima N.",
    role: "Étudiante L2 Informatique, École JFN",
  },
  {
    quote: "Les statistiques de progression me permettent enfin de voir quel chapitre pose problème à mes étudiants avant même l'examen. C'est révolutionnaire.",
    name: "Dr. Pierre T.",
    role: "Enseignant, École d'Informatique JFN",
  },
  {
    quote: "La certification PDF avec QR Code donne enfin une vraie crédibilité à nos diplômes. Les employeurs peuvent vérifier instantanément.",
    name: "M. Emmanuel B.",
    role: "Directeur Académique, Institut JFN",
  },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const t = testimonials[idx];

  return (
    <section className="section-gray py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Big green quote marks */}
        <div className="flex justify-center mb-8">
          <svg width="52" height="44" viewBox="0 0 52 44" fill="none">
            <path
              d="M0 44V26C0 11.7 9.1 3.6 27.3 0l3.3 5.5C20.3 7.7 16.2 12.8 15.1 19.8h8.8V44H0zm27.9 0V26C27.9 11.7 37 3.6 55.2 0l3.3 5.5C48.2 7.7 44.1 12.8 43 19.8h8.8V44H27.9z"
              fill="#49A942"
            />
          </svg>
        </div>

        {/* Quote text */}
        <p className="text-2xl md:text-3xl font-light text-ink italic leading-relaxed mb-8 transition-opacity duration-300">
          &ldquo;{t.quote}&rdquo;
        </p>

        {/* Author */}
        <p className="text-base font-bold text-ink mb-1">{t.name}</p>
        <p className="text-sm text-muted">{t.role}</p>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={() => setIdx((idx - 1 + testimonials.length) % testimonials.length)}
            className="w-10 h-10 flex items-center justify-center text-green hover:text-green-dark transition-colors"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === idx ? "w-6 h-2 bg-green" : "w-2 h-2 bg-border"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setIdx((idx + 1) % testimonials.length)}
            className="w-10 h-10 flex items-center justify-center text-green hover:text-green-dark transition-colors"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </div>
    </section>
  );
}
