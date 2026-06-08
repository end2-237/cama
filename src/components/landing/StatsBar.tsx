"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 3,   suffix: "",    label: "Écoles de l'Institut JFN",         color: "text-cama" },
  { value: 500, suffix: "+",   label: "Étudiants inscrits",                color: "text-gold" },
  { value: 12,  suffix: "",    label: "Filières disponibles",              color: "text-cama" },
  { value: 100, suffix: "%",   label: "Examens surveillés par IA",         color: "text-gold" },
  { value: 97,  suffix: "%",   label: "Taux de satisfaction étudiant",     color: "text-cama" },
];

function Counter({ target, suffix, color }: { target: number; suffix: string; color: string }) {
  const [count,   setCount]   = useState(0);
  const ref     = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const step = target / (1600 / 16);
        let cur = 0;
        const tick = () => {
          cur = Math.min(cur + step, target);
          setCount(Math.round(cur));
          if (cur < target) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref} className={`text-4xl font-bold tabular-nums ${color}`}>{count}{suffix}</span>;
}

export default function StatsBar() {
  return (
    <section className="section-surface py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Card avec bordure top colorée — originalité ── */}
        <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
          {/* Barre indigo→or en haut */}
          <div className="h-1 w-full bg-gradient-to-r from-cama via-cama-400 to-gold" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border">
            {stats.map(({ value, suffix, label, color }, i) => (
              <div key={i} className="flex flex-col items-center text-center px-6 py-8">
                <Counter target={value} suffix={suffix} color={color} />
                <p className="text-sm text-muted mt-2 leading-snug max-w-[110px]">{label}</p>
              </div>
            ))}
          </div>

          <div className="text-center py-2.5 border-t border-border bg-surface/50">
            <span className="text-xs text-subtle italic">Données · Année académique 2024–2025 · Institut JFN Cameroun</span>
          </div>
        </div>
      </div>
    </section>
  );
}
