import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="bg-white overflow-hidden relative"
      style={{ height: "calc(100vh - 64px)" }}
    >

      {/* ══════════════════════════════════════════
          MOTIFS DE FOND — Afrique Académique
          Inspiré NetAcad mais univers CAMA/JFN
      ══════════════════════════════════════════ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden
      >
        <defs>

          {/* ── Vagues kente angulaires ── */}
          <pattern id="kw" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
            <polyline
              points="0,20 10,10 20,20 30,10 40,20 50,10 60,20 70,10 80,20"
              fill="none" stroke="#4F46E5" strokeWidth="1.2"
            />
            <polyline
              points="0,36 10,26 20,36 30,26 40,36 50,26 60,36 70,26 80,36"
              fill="none" stroke="#F59E0B" strokeWidth="0.9"
            />
          </pattern>

          {/* ── Chevrons wax (tissu africain imprimé) ── */}
          <pattern id="wax" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
            <polyline points="0,10 10,0 20,10 30,0 40,10" fill="none" stroke="#4F46E5" strokeWidth="1.1"/>
            <polyline points="0,20 10,10 20,20 30,10 40,20" fill="none" stroke="#F59E0B" strokeWidth="0.8"/>
          </pattern>

          {/* ── Losanges Adinkra ── */}
          <pattern id="dia" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <rect x="8" y="8" width="20" height="20" fill="none"
              stroke="#4F46E5" strokeWidth="1" transform="rotate(45 18 18)"/>
            <circle cx="18" cy="18" r="2" fill="#F59E0B"/>
          </pattern>

          {/* ── Points bogolan ── */}
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#4F46E5"/>
          </pattern>

          {/* ── Croix Adinkra (Nyame Dua) ── */}
          <pattern id="cross" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <line x1="24" y1="10" x2="24" y2="38" stroke="#F59E0B" strokeWidth="1.2"/>
            <line x1="10" y1="24" x2="38" y2="24" stroke="#F59E0B" strokeWidth="1.2"/>
            <circle cx="24" cy="24" r="3" fill="none" stroke="#4F46E5" strokeWidth="1"/>
          </pattern>

        </defs>

        {/* ── Zone gauche : vagues kente en fond léger ── */}
        <rect x="0" y="0" width="54%" height="100%" fill="url(#kw)" opacity="0.09"/>

        {/* ── Zone gauche : points bogolan superposés ── */}
        <rect x="0" y="0" width="54%" height="100%" fill="url(#dots)" opacity="0.07"/>

        {/* ── Arcs concentriques coin top-left — Gye Nyame ── */}
        <g opacity="1">
          <circle cx="-20" cy="-20" r="180" fill="none" stroke="#4F46E5" strokeWidth="1.5" opacity="0.07"/>
          <circle cx="-20" cy="-20" r="120" fill="none" stroke="#4F46E5" strokeWidth="1.2" opacity="0.10"/>
          <circle cx="-20" cy="-20" r="70"  fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.12"/>
          <circle cx="-20" cy="-20" r="30"  fill="none" stroke="#F59E0B" strokeWidth="1"   opacity="0.14"/>
        </g>

        {/* ── Arcs concentriques coin bas-gauche ── */}
        <g opacity="1">
          <circle cx="-10" cy="110%" r="220" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.06"/>
          <circle cx="-10" cy="110%" r="150" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.09"/>
          <circle cx="-10" cy="110%" r="90"  fill="none" stroke="#4F46E5" strokeWidth="1"   opacity="0.10"/>
        </g>

        {/* ── Ligne ondulée longue centre-haut — respiration ── */}
        <path
          d="M 0 80 C 120 40, 240 130, 360 80 S 600 30, 720 80 S 960 130, 1100 80"
          fill="none" stroke="#4F46E5" strokeWidth="1.5" opacity="0.08" strokeDasharray="8 14"
        />
        <path
          d="M 0 140 C 100 100, 200 180, 340 140 S 560 90, 700 140 S 950 190, 1100 140"
          fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.07" strokeDasharray="5 18"
        />
      </svg>

      {/* ══════════════════════════════════════════
          BLOC DIAGONAL DROIT
      ══════════════════════════════════════════ */}
      <div
        className="absolute top-0 right-0 w-[52%] h-full bg-cama-50"
        style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)", zIndex: 0 }}
      />

      {/* Motifs sur bloc diagonal */}
      <svg
        className="absolute top-0 right-0 w-[52%] h-full pointer-events-none"
        style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)", zIndex: 0 }}
        aria-hidden
      >
        <defs>
          <pattern id="waxR" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
            <polyline points="0,10 10,0 20,10 30,0 40,10" fill="none" stroke="#4F46E5" strokeWidth="1.3"/>
            <polyline points="0,20 10,10 20,20 30,10 40,20" fill="none" stroke="#F59E0B" strokeWidth="1"/>
          </pattern>
          <pattern id="diaR" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect x="10" y="10" width="20" height="20" fill="none"
              stroke="#4F46E5" strokeWidth="1.2" transform="rotate(45 20 20)"/>
          </pattern>
        </defs>

        {/* Chevrons wax */}
        <rect width="100%" height="100%" fill="url(#waxR)" opacity="0.13"/>
        {/* Losanges Adinkra */}
        <rect width="100%" height="100%" fill="url(#diaR)" opacity="0.10"/>

        {/* Grand arc coin bas-droit */}
        <circle cx="100%" cy="100%" r="320" fill="none" stroke="#4F46E5" strokeWidth="2" opacity="0.10"/>
        <circle cx="100%" cy="100%" r="220" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.12"/>
        <circle cx="100%" cy="100%" r="130" fill="none" stroke="#4F46E5" strokeWidth="1.2" opacity="0.15"/>
        <circle cx="100%" cy="100%" r="60"  fill="none" stroke="#F59E0B" strokeWidth="1"   opacity="0.18"/>

        {/* Lignes diagonales tiretées JFN */}
        <line x1="50%" y1="0" x2="100%" y2="50%"
          stroke="#F59E0B" strokeWidth="1.2" opacity="0.15" strokeDasharray="8 16"/>
        <line x1="70%" y1="0" x2="100%" y2="30%"
          stroke="#4F46E5" strokeWidth="1" opacity="0.12" strokeDasharray="5 20"/>
        <line x1="30%" y1="0" x2="100%" y2="70%"
          stroke="#4F46E5" strokeWidth="0.8" opacity="0.08" strokeDasharray="10 20"/>
      </svg>

      {/* ══════════════════════════════════════════
          CONTENU
      ══════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full" style={{ position: "relative", zIndex: 10 }}>
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
      <div className="absolute bottom-0 inset-x-0 pointer-events-none" style={{ zIndex: 10 }}>
        <svg viewBox="0 0 1440 28" className="w-full" preserveAspectRatio="none">
          <path d="M0,14 C240,28 480,0 720,14 C960,28 1200,0 1440,14 L1440,28 L0,28 Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
}
