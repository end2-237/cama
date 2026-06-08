"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, BookOpen } from "lucide-react";

const courses = [
  {
    img:   "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500&q=80",
    level: "L1",
    title: "Introduction à l'Algorithmique",
    school:"École d'Informatique · JFN",
    type:  "Cours · Présentiel & En ligne",
    hours: "45h",
    color: "bg-cama text-white",
  },
  {
    img:   "https://images.unsplash.com/photo-1620912189865-1e8a33da5a43?w=500&q=80",
    level: "L2",
    title: "Réseaux Informatiques Fondamentaux",
    school:"École d'Informatique · JFN",
    type:  "Cours · En ligne",
    hours: "60h",
    color: "bg-cama text-white",
  },
  {
    img:   "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&q=80",
    level: "L3",
    title: "Bases de Données Avancées",
    school:"École d'Informatique · JFN",
    type:  "Cours · Présentiel",
    hours: "50h",
    color: "bg-cama-700 text-white",
  },
  {
    img:   "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80",
    level: "M1",
    title: "Business Intelligence & Data Science",
    school:"École de Gestion · JFN",
    type:  "Cours · En ligne",
    hours: "80h",
    color: "bg-gold text-white",
  },
  {
    img:   "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&q=80",
    level: "M2",
    title: "Intelligence Artificielle Appliquée",
    school:"École d'Informatique · JFN",
    type:  "Cours · En ligne",
    hours: "90h",
    color: "bg-cama-900 text-white",
  },
];

export default function CoursesCarousel() {
  const [idx, setIdx] = useState(0);
  const max = courses.length - 4;

  return (
    <section id="modules" className="section-surface py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="badge bg-cama-50 text-cama mb-3">Catalogue</span>
            <h2 className="text-4xl font-light text-ink">
              Cours{" "}
              <span className="cama-underline font-semibold">populaires</span>
              {" "}cette session
            </h2>
            <p className="text-muted mt-3 max-w-lg">Les UE les plus suivies par les étudiants JFN — accessibles en mode bas-débit.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIdx(Math.max(0, idx - 1))}
              disabled={idx === 0}
              className="w-11 h-11 rounded-full border-2 border-cama text-cama flex items-center justify-center disabled:opacity-30 hover:bg-cama-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIdx(Math.min(max, idx + 1))}
              disabled={idx >= max}
              className="w-11 h-11 rounded-full border-2 border-cama text-cama flex items-center justify-center disabled:opacity-30 hover:bg-cama-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="overflow-hidden">
          <div
            className="flex gap-5 transition-transform duration-400 ease-in-out"
            style={{ transform: `translateX(calc(-${idx * 25}% - ${idx * 5}px))` }}
          >
            {courses.map((c, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[calc(25%-15px)] min-w-[260px] bg-white border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
              >
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img src={c.img} alt={c.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${c.color}`}>
                    {c.level}
                  </span>
                  {/* Share icon */}
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-ink" strokeWidth={2}>
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Barre colorée en haut de la card — originalité */}
                  <div className="h-0.5 w-8 bg-gradient-to-r from-cama to-gold rounded-full mb-3" />

                  <p className="text-xs text-muted mb-1">{c.school}</p>
                  <p className="text-xs text-subtle mb-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {c.type}
                  </p>
                  <h3 className="text-sm font-bold text-ink mb-3 leading-snug group-hover:text-cama transition-colors">{c.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted border-t border-border pt-3">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.hours}</span>
                    <span className="flex items-center gap-1 ml-auto text-cama font-semibold">Inscrit ✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <a href="/auth/register" className="btn-outline text-sm">Voir tous les cours disponibles</a>
        </div>
      </div>
    </section>
  );
}
