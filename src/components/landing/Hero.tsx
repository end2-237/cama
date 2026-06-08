import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="bg-white overflow-hidden relative"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* ── Motif global fond blanc gauche — lignes angulaires kente ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10" aria-hidden>
        <defs>
          {/* Motif 1 : vagues angulaires kente */}
          <pattern id="kenteWave" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
            <polyline
              points="0,20 10,10 20,20 30,10 40,20 50,10 60,20 70,10 80,20"
              fill="none" stroke="#4F46E5" strokeWidth="0.8" opacity="0.07"
            />
            <polyline
              points="0,35 10,25 20,35 30,25 40,35 50,25 60,35 70,25 80,35"
              fill="none" stroke="#F59E0B" strokeWidth="0.6" opacity="0.05"
            />
          </pattern>

          {/* Motif 2 : grille de losanges Adinkra */}
          <pattern id="adinkraDiamond" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect x="20" y="2" width="12" height="12" fill="none"
              stroke="#4F46E5" strokeWidth="0.7" opacity="0.08" transform="rotate(45 26 8)" />
          </pattern>

          {/* Motif 3 : grille de points rythmiques */}
          <pattern id="dotGrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#4F46E5" opacity="0.07" />
          </pattern>

          {/* Motif 4 : cercles concentriques Adinkra — coin top-right */}
          <pattern id="concentric" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="10" fill="none" stroke="#F59E0B" strokeWidth="0.6" opacity="0.08"/>
            <circle cx="30" cy="30" r="20" fill="none" stroke="#F59E0B" strokeWidth="0.4" opacity="0.05"/>
            <circle cx="30" cy="30" r="28" fill="none" stroke="#4F46E5" strokeWidth="0.4" opacity="0.04"/>
          </pattern>

          {/* Motif 5 : chevrons — tissu wax */}
          <pattern id="waxChevron" x="0" y="0" width="32" height="16" patternUnits="userSpaceOnUse">
            <polyline points="0,8 8,0 16,8 24,0 32,8" fill="none" stroke="#4F46E5" strokeWidth="0.7" opacity="0.06"/>
            <polyline points="0,16 8,8 16,16 24,8 32,16" fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.04"/>
          </pattern>
        </defs>

        {/* Fond gauche : vagues kente sur toute la hauteur */}
        <rect x="0" y="0" width="55%" height="100%" fill="url(#kenteWave)" />

        {/* Fond gauche : grille de points en superposition */}
        <rect x="0" y="0" width="55%" height="100%" fill="url(#dotGrid)" />

        {/* Coin bas-gauche : cercles concentriques Adinkra */}
        <g opacity="0.6">
          <circle cx="0"   cy="100%" r="120" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.06"/>
          <circle cx="0"   cy="100%" r="80"  fill="none" stroke="#F59E0B" strokeWidth="0.8" opacity="0.08"/>
          <circle cx="0"   cy="100%" r="40"  fill="none" stroke="#4F46E5" strokeWidth="0.8" opacity="0.1"/>
        </g>

        {/* Coin top-left : arc Adinkra Gye Nyame */}
        <g opacity="0.5">
          <circle cx="0" cy="0" r="160" fill="none" stroke="#4F46E5" strokeWidth="0.8" opacity="0.05"/>
          <circle cx="0" cy="0" r="100" fill="none" stroke="#4F46E5" strokeWidth="0.6" opacity="0.06"/>
          <circle cx="0" cy="0" r="50"  fill="none" stroke="#F59E0B" strokeWidth="0.6" opacity="0.07"/>
        </g>
      </svg>

      {/* Bloc diagonal droit */}
      <div className="absolute top-0 right-0 w-[52%] h-full bg-cama-50 -z-10"
        style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)" }} />

      {/* Motifs sur le bloc diagonal droit */}
      <svg
        className="absolute top-0 right-0 w-[52%] h-full pointer-events-none -z-10"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
        style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)" }}
      >
        <defs>
          <pattern id="waxRight" x="0" y="0" width="32" height="16" patternUnits="userSpaceOnUse">
            <polyline points="0,8 8,0 16,8 24,0 32,8"   fill="none" stroke="#4F46E5" strokeWidth="1" opacity="0.10"/>
            <polyline points="0,16 8,8 16,16 24,8 32,16" fill="none" stroke="#F59E0B" strokeWidth="0.7" opacity="0.07"/>
          </pattern>
          <pattern id="diamondRight" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <rect x="14" y="2" width="10" height="10" fill="none"
              stroke="#4F46E5" strokeWidth="0.8" opacity="0.12" transform="rotate(45 19 7)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#waxRight)" />
        <rect width="100%" height="100%" fill="url(#diamondRight)" />

        {/* Grand arc coin bas-droite */}
        <circle cx="100%" cy="100%" r="260" fill="none" stroke="#4F46E5" strokeWidth="1" opacity="0.08"/>
        <circle cx="100%" cy="100%" r="180" fill="none" stroke="#F59E0B" strokeWidth="0.8" opacity="0.1"/>
        <circle cx="100%" cy="100%" r="100" fill="none" stroke="#4F46E5" strokeWidth="0.7" opacity="0.12"/>

        {/* Ligne diagonale signature Adinkra top-right */}
        <line x1="60%" y1="0" x2="100%" y2="40%" stroke="#F59E0B" strokeWidth="1" opacity="0.1" strokeDasharray="6 10"/>
        <line x1="75%" y1="0" x2="100%" y2="25%" stroke="#4F46E5" strokeWidth="0.8" opacity="0.08" strokeDasharray="4 12"/>
      </svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="grid lg:grid-cols-2 gap-0 h-full">

          {/* Texte gauche */}
          <div className="flex flex-col justify-center pr-0 lg:pr-10 relative z-10 gap-3">

            {/* Annonce */}
            <div className="inline-flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2 max-w-xs shadow-sm self-start">
              <Flame className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <p className="text-xs text-ink leading-snug">
                <strong>Rentrée 2024–2025</strong> —{" "}
                <a href="#features" className="text-cama underline">Accéder à CAMA</a>
              </p>
            </div>

            {/* H1 */}
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

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register" className="btn-primary gap-2 text-sm px-6 py-3">
                Commencer maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#filieres" className="btn-outline text-sm px-6 py-3">
                Explorer les filières
              </Link>
            </div>

            {/* Pilules */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "3 Écoles",        c: "bg-cama-50 text-cama border-cama/20" },
                { label: "Licence · Master", c: "bg-gold/10 text-gold-dark border-gold/20" },
                { label: "Proctoring IA",    c: "bg-cama-50 text-cama border-cama/20" },
                { label: "Bas-débit natif",  c: "bg-gold/10 text-gold-dark border-gold/20" },
              ].map(({ label, c }) => (
                <span key={label} className={`text-xs font-semibold px-3 py-1 rounded-full border ${c}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Photos droite */}
          <div className="hidden lg:flex flex-col gap-2 pl-5 h-full justify-center relative z-10 py-4">

            {/* Grande photo */}
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

            {/* Deux petites */}
            <div className="grid grid-cols-2 gap-2 flex-shrink-0" style={{ height: "32%" }}>
              <div className="rounded-xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80"
                  alt="Étudiants collaborant"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden shadow-lg relative">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80"
                  alt="Groupe d'étudiants"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  LMD ✓
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Vague bas */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none">
        <svg viewBox="0 0 1440 28" className="w-full" preserveAspectRatio="none">
          <path d="M0,14 C240,28 480,0 720,14 C960,28 1200,0 1440,14 L1440,28 L0,28 Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
}
