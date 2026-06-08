"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 3,    suffix: "",   label: "Écoles de l'Institut JFN" },
  { value: 500,  suffix: "+",  label: "Étudiants inscrits sur CAMA" },
  { value: 12,   suffix: "",   label: "Filières disponibles" },
  { value: 100,  suffix: "%",  label: "Examens surveillés par IA" },
  { value: 97,   suffix: "%",  label: "Taux de satisfaction déclaré" },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref     = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
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
      },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function StatsBar() {
  return (
    <section className="section-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-border rounded-2xl shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border">
            {stats.map(({ value, suffix, label }, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center px-6 py-8 first:rounded-l-2xl last:rounded-r-2xl"
              >
                <p className="text-4xl font-light text-ink mb-2 tabular-nums">
                  <Counter target={value} suffix={suffix} />
                </p>
                <p className="text-sm text-muted leading-snug">{label}</p>
              </div>
            ))}
          </div>
          <div className="text-center py-2 border-t border-border">
            <span className="text-xs text-subtle italic">Données au lancement de la plateforme · Année académique 2024-2025</span>
          </div>
        </div>
      </div>
    </section>
  );
}
