import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="bg-white overflow-hidden relative"
      style={{ height: "calc(100vh - 64px)" }}
    >

      {/* ── Motifs fond — 2 éléments, aérés ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden>

        {/* 1. Arcs concentriques coin top-left — Gye Nyame */}
        <circle cx="-30" cy="-30" r="200" fill="none" stroke="#4F46E5" strokeWidth="1.5" opacity="0.10"/>
        <circle cx="-30" cy="-30" r="130" fill="none" stroke="#4F46E5" strokeWidth="1.2" opacity="0.13"/>
        <circle cx="-30" cy="-30" r="75"  fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.15"/>
        <circle cx="-30" cy="-30" r="32"  fill="none" stroke="#F59E0B" strokeWidth="1"   opacity="0.18"/>

        {/* 2. Grande ligne ondulée traversante — respiration */}
        <path
          d="M -60 65% C 200 55%, 420 75%, 660 62% S 980 52%, 1200 65% S 1500 75%, 1600 62%"
          fill="none" stroke="#4F46E5" strokeWidth="1.8" opacity="0.07" strokeDasharray="12 20"
        />
      </svg>

      {/* ── Bloc diagonal droit ── */}
      <div
        className="absolute top-0 right-0 w-[52%] h-full bg-cama-50"
        style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)", zIndex: 0 }}
      />

      {/* Motif diagonal droit — triangles wax, un seul pattern */}
      <svg
        className="absolute top-0 right-0 w-[52%] h-full pointer-events-none"
        style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)", zIndex: 0 }}
        aria-hidden
      >
        <defs>
          <pattern id="tri" x="0" y="0" width="48" height="28" patternUnits="userSpaceOnUse">
            <polyline points="0,28 24,0 48,28" fill="none" stroke="#4F46E5" strokeWidth="1.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tri)" opacity="0.11"/>

        {/* Arc rayonnant coin bas-droit */}
        <circle cx="100%" cy="100%" r="260" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.13"/>
        <circle cx="100%" cy="100%" r="160" fill="none" stroke="#4F46E5" strokeWidth="1.2" opacity="0.15"/>
        <circle cx="100%" cy="100%" r="80"  fill="none" stroke="#F59E0B" strokeWidth="1"   opacity="0.18"/>
      </svg>

      {/* ── Contenu ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full" style={{ position: "relative", zIndex: 10 }}>
        <div className="grid lg:grid-cols-2 gap-0 h-full">

          {/* Texte gauche */}
          <div className="flex flex-col justify-center pr-0 lg:pr-10 relative z-10 gap-3">

            <div className="inline-flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2 max-w-xs shadow-sm self-start">
              <Flame className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <p className="text-xs text-ink leading-snug">
                <strong>Rentrée 2024–2025</strong> —{" "}
                <a href="#features" className="text-cama underline">Accéder à CAMA</a>
              </p>
            </div>

            <h1 className="font-light text-ink leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)" }}>
              Construisez
              <br />
              votre{" "}
              <span className="gold-underline font-semibold">avenir.</span>
              <br />
              Ici, à JFN.
            </h1>

            <p className="text-sm text-muted leading-relaxed max-w-sm">
              Cours en ligne, examens sécurisés par IA et suivi académique
              complet — conçu pour les réalités du Cameroun.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register" className="btn-primary gap-2 text-sm px-6 py-3">
                Commencer maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#filieres" className="btn-outline text-sm px-6 py-3">
                Explorer les filières
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "3 Écoles",         c: "bg-cama-50 text-cama border-cama/20" },
                { label: "Licence · Master",  c: "bg-gold/10 text-gold-dark border-gold/20" },
                { label: "Proctoring IA",     c: "bg-cama-50 text-cama border-cama/20" },
                { label: "Bas-débit natif",   c: "bg-gold/10 text-gold-dark border-gold/20" },
              ].map(({ label, c }) => (
                <span key={label} className={`text-xs font-semibold px-3 py-1 rounded-full border ${c}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Photos droite */}
          <div className="hidden lg:flex flex-col gap-2 pl-5 h-full justify-center relative z-10 py-4">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ flex: "1 1 0", minHeight: 0 }}>
              <img
                src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=700&q=80"
                alt="Étudiants africains en cours"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cama animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-ink leading-none">Examen en cours</p>
                  <p className="text-[10px] text-muted">INF302 · 47 participants</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-shrink-0" style={{ height: "32%" }}>
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80"
                  alt="Étudiants collaborant" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg relative">
                <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80"
                  alt="Groupe d'étudiants" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  LMD ✓
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Vague bas */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none" style={{ zIndex: 10 }}>
        <svg viewBox="0 0 1440 28" className="w-full" preserveAspectRatio="none">
          <path d="M0,14 C240,28 480,0 720,14 C960,28 1200,0 1440,14 L1440,28 L0,28 Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
}
