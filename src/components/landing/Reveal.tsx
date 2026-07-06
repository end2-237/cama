"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Révèle son contenu quand il entre dans le viewport (une seule fois).
    Variantes : up (défaut) · left · right · zoom · fade. */
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  variant?: "up" | "left" | "right" | "zoom" | "fade";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const v = variant === "fade" ? "" : `reveal-${variant}`;
  return (
    <div ref={ref} className={`reveal ${v} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
