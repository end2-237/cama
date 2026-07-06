"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/landing/Reveal";

const stats = [
  { value: 3,   suffix: "",  label: "Écoles de l'Institut JFN",      color: "text-cama" },
  { value: 500, suffix: "+", label: "Étudiants inscrits",             color: "text-gold-dark" },
  { value: 12,  suffix: "",  label: "Filières disponibles",           color: "text-cama" },
  { value: 100, suffix: "%", label: "Examens surveillés par IA",      color: "text-gold-dark" },
  { value: 97,  suffix: "%", label: "Taux de satisfaction étudiant",  color: "text-cama" },
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

  return (
    <span ref={ref} className={`text-[2.6rem] leading-none font-extrabold tracking-tight tabular-nums ${color}`}>
      {count}{suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <section className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        <Reveal variant="up">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-muted">
              L&apos;Institut en chiffres
            </p>
            <p className="text-[11px] text-subtle">Année académique 2024–2025 · Cameroun</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-border">
          {stats.map(({ value, suffix, label, color }, i) => (
            <Reveal key={label} variant="up" delay={i * 90}
              className="border-b sm:border-b-0 border-r border-border last:border-r-0 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r lg:[&:nth-child(5n)]:border-r-0">
              <div className="pt-7 pb-4 pr-6">
                <Counter target={value} suffix={suffix} color={color} />
                <p className="text-[12px] text-muted mt-2.5 leading-snug">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
