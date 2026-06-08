"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Lock } from "lucide-react";

const courses = [
  {
    img:   "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=500&q=70",
    level: "L1",
    title: "Introduction à l'Algorithmique",
    school:"École d'Informatique JFN",
    type:  "Cours · Présentiel & En ligne",
    hours: "45h",
    access:"Inscrit",
  },
  {
    img:   "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&q=70",
    level: "L2",
    title: "Réseaux Informatiques Fondamentaux",
    school:"École d'Informatique JFN",
    type:  "Cours · En ligne",
    hours: "60h",
    access:"Inscrit",
  },
  {
    img:   "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=500&q=70",
    level: "L3",
    title: "Bases de Données Avancées",
    school:"École d'Informatique JFN",
    type:  "Cours · Présentiel",
    hours: "50h",
    access:"Inscrit",
  },
  {
    img:   "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=70",
    level: "M1",
    title: "Business Intelligence & Data Science",
    school:"École de Gestion JFN",
    type:  "Cours · En ligne",
    hours: "80h",
    access:"Inscrit",
  },
  {
    img:   "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&q=70",
    level: "M2",
    title: "Intelligence Artificielle Appliquée",
    school:"École d'Informatique JFN",
    type:  "Cours · En ligne",
    hours: "90h",
    access:"Inscrit",
  },
];

const VISIBLE = 4;

const levelColor: Record<string, string> = {
  L1: "bg-green text-white",
  L2: "bg-green text-white",
  L3: "bg-green text-white",
  M1: "bg-navy text-white",
  M2: "bg-navy text-white",
};

export default function CoursesCarousel() {
  const [idx, setIdx] = useState(0);
  const maxIdx = courses.length - VISIBLE;

  return (
    <section className="section-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl font-light text-ink">
              Cours <span className="green-underline">populaires</span> de la plateforme
            </h2>
            <p className="text-muted mt-3">Les UE les plus suivies par les étudiants JFN cette session.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIdx(Math.max(0, idx - 1))}
              disabled={idx === 0}
              className="w-10 h-10 rounded-full border-2 border-green text-green flex items-center justify-center disabled:opacity-30 hover:bg-green-light transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIdx(Math.min(maxIdx, idx + 1))}
              disabled={idx >= maxIdx}
              className="w-10 h-10 rounded-full border-2 border-green text-green flex items-center justify-center disabled:opacity-30 hover:bg-green-light transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="overflow-hidden">
          <div
            className="flex gap-5 transition-transform duration-300"
            style={{ transform: `translateX(calc(-${idx * (100 / VISIBLE)}% - ${idx * 20 / VISIBLE}px))` }}
          >
            {courses.map((c) => (
              <div
                key={c.title}
                className="flex-shrink-0 w-[calc(25%-15px)] min-w-[260px] bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative">
                  <img src={c.img} alt={c.title} className="w-full h-44 object-cover" />
                  <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${levelColor[c.level] ?? "bg-green text-white"}`}>
                    {c.level}
                  </span>
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-ink" strokeWidth={2}>
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-muted mb-1">{c.school}</p>
                  <p className="text-xs text-subtle mb-2">
                    <BookIcon /> {c.type}
                  </p>
                  <h3 className="text-sm font-bold text-ink mb-3 leading-snug">{c.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted border-t border-border pt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {c.hours}
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> {c.access}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <a href="/auth/register" className="btn-outline-green text-sm">
            Voir tous les cours disponibles
          </a>
        </div>
      </div>
    </section>
  );
}

function BookIcon() {
  return (
    <svg className="inline w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  );
}
