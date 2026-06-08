"use client";

import { useEffect, useRef, useState } from "react";
import { Users, BookOpen, ShieldCheck, Award } from "lucide-react";

const stats = [
  { icon: Users,       value: 3,    suffix: " Écoles",    label: "Gérées sur la plateforme", color: "text-primary-600" },
  { icon: BookOpen,    value: 500,  suffix: "+",           label: "Étudiants inscrits",        color: "text-accent" },
  { icon: ShieldCheck, value: 100,  suffix: "%",           label: "Examens sécurisés par IA",  color: "text-warning" },
  { icon: Award,       value: 12,   suffix: " Filières",   label: "Diplômes générés PDF",      color: "text-danger" },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const step = target / (duration / 16);
          let cur = 0;
          const tick = () => {
            cur = Math.min(cur + step, target);
            setCount(Math.round(cur));
            if (cur < target) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <section id="stats" className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ icon: Icon, value, suffix, label, color }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <p className={`text-4xl font-bold ${color} leading-none mb-1`}>
                <Counter target={value} suffix={suffix} />
              </p>
              <p className="text-slate-500 text-sm leading-snug max-w-[120px]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
