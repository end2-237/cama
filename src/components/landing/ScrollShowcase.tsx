"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorPlay, ShieldCheck, Terminal } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Section vidéo pilotée par le scroll : la vidéo passe de
   cadrée → plein écran pendant le défilement, et trois
   chapitres (Cours / Examens / TP) se succèdent en légende.
──────────────────────────────────────────────────────────── */

const CHAPTERS = [
  {
    icon: MonitorPlay,
    kicker: "01 · Apprendre",
    title: "Des cours qui tiennent dans votre connexion",
    text: "Lecture native optimisée bas-débit, PDF hors-ligne, classes virtuelles enregistrées et progression suivie chapitre par chapitre.",
  },
  {
    icon: ShieldCheck,
    kicker: "02 · Composer",
    title: "Des examens surveillés, où que vous soyez",
    text: "Caméra obligatoire, verrouillage plein écran et sauvegarde automatique toutes les 15 secondes — même en cas de coupure.",
  },
  {
    icon: Terminal,
    kicker: "03 · Pratiquer",
    title: "De vrais terminaux Linux, pas des simulations",
    text: "Chaque étudiant reçoit sa machine personnelle dans le navigateur ; l'enseignant rejoint la même machine pour évaluer le travail réel.",
  },
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function ScrollShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);          // progression 0 → 1 dans la section
  const [reduced, setReduced] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setReduced(true); setP(0.5); return; }
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setP(clamp(-rect.top / Math.max(total, 1), 0, 1));
    };
    const onScroll = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // Zoom : 0 → 40% du parcours ; chapitres répartis sur le reste
  const zoom  = clamp(p / 0.4, 0, 1);
  const scale = reduced ? 1 : 0.62 + zoom * 0.38;
  const active = p < 0.45 ? 0 : p < 0.75 ? 1 : 2;

  return (
    <section className="bg-ink">
      {/* Piste haute : 260vh de scroll pour l'effet */}
      <div ref={wrapRef} style={{ height: reduced ? "auto" : "260vh" }}>
        <div className={`${reduced ? "" : "sticky top-0"} h-screen overflow-hidden flex items-center justify-center`}>

          {/* Cadre vidéo qui s'agrandit */}
          <div
            className="relative overflow-hidden will-change-transform"
            style={{
              width: "100vw", height: "100vh",
              transform: `scale(${scale})`,
              transition: reduced ? undefined : "transform 60ms linear",
            }}
          >
            <video
              className="w-full h-full object-cover"
              src="https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_30fps.mp4"
              poster="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=1600&q=70"
              autoPlay muted loop playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/20" />

            {/* Sur-titre fixe */}
            <p className="absolute top-8 left-1/2 -translate-x-1/2 text-[11px] font-black uppercase tracking-[0.32em] text-white/45 whitespace-nowrap">
              La plateforme en action
            </p>

            {/* Légendes chapitres */}
            <div className="absolute inset-x-0 bottom-0 px-6 sm:px-12 pb-12">
              <div className="max-w-3xl">
                {CHAPTERS.map(({ icon: Icon, kicker, title, text }, i) => (
                  <div
                    key={kicker}
                    className="transition-all duration-500"
                    style={{
                      opacity: active === i ? 1 : 0,
                      transform: active === i ? "translateY(0)" : "translateY(18px)",
                      position: active === i ? "relative" : "absolute",
                      pointerEvents: active === i ? "auto" : "none",
                    }}
                  >
                    <p className="flex items-center gap-2.5 text-gold text-[11px] font-black uppercase tracking-[0.28em] mb-3">
                      <Icon className="w-4 h-4" /> {kicker}
                    </p>
                    <h3 className="text-white font-extrabold tracking-tight leading-tight mb-3"
                      style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)" }}>
                      {title}
                    </h3>
                    <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-xl">{text}</p>
                  </div>
                ))}

                {/* Progression chapitres */}
                <div className="flex gap-2 mt-7">
                  {CHAPTERS.map((_, i) => (
                    <span key={i} className="h-[3px] w-12 bg-white/15 overflow-hidden">
                      <span className="block h-full bg-gold transition-transform duration-300 origin-left"
                        style={{ transform: `scaleX(${active >= i ? 1 : 0})` }} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
