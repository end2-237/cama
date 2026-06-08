import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-16 bg-white overflow-hidden relative">

      {/* ── Bloc diagonal indigo en haut à droite (originalité) ── */}
      <div
        className="absolute top-0 right-0 w-[55%] h-full bg-cama-50 -z-10"
        style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)" }}
      />

      {/* ── Motif kente en fond du bloc diagonal ── */}
      <div
        className="absolute top-0 right-0 w-[55%] h-full opacity-100 -z-10 kente-pattern"
        style={{ clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 min-h-[90vh] items-center">

          {/* ── Texte gauche ── */}
          <div className="py-20 lg:py-28 pr-0 lg:pr-16 relative z-10">

            {/* Annonce */}
            <div className="inline-flex items-start gap-3 bg-white border border-border rounded-2xl px-5 py-3.5 mb-10 max-w-md shadow-sm">
              <Flame className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-ink">Rentrée 2024–2025 ouverte !</p>
                <p className="text-sm text-muted mt-0.5">
                  Accédez à vos cours dès maintenant sur{" "}
                  <a href="#features" className="text-cama underline font-medium">la plateforme CAMA</a>
                </p>
              </div>
            </div>

            {/* H1 — typo fine, mot souligné or */}
            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-light text-ink leading-[1.05] mb-6 tracking-tight">
              Construisez
              <br />
              votre{" "}
              <span className="gold-underline font-semibold">avenir.</span>
              <br />
              Ici, à JFN.
            </h1>

            <p className="text-lg text-muted leading-relaxed mb-10 max-w-lg">
              Cours en ligne, examens sécurisés par IA et suivi académique complet —
              conçu pour les réalités du Cameroun. De la Licence au Master,
              tout votre parcours en un seul endroit.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-14">
              <Link href="/auth/register" className="btn-primary text-base px-8 py-4 gap-2">
                Commencer maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#filieres" className="btn-outline text-base px-8 py-4">
                Explorer les filières
              </Link>
            </div>

            {/* ── Ligne d'indicateurs — originalité : pilules colorées ── */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "3 Écoles",      color: "bg-cama-50 text-cama border-cama/20" },
                { label: "Licence · Master", color: "bg-gold/10 text-gold-dark border-gold/20" },
                { label: "Proctoring IA", color: "bg-cama-50 text-cama border-cama/20" },
                { label: "Bas-débit natif",color: "bg-gold/10 text-gold-dark border-gold/20" },
              ].map(({ label, color }) => (
                <span key={label} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Photos droite — étudiants africains ── */}
          <div className="hidden lg:flex flex-col gap-4 py-16 pl-8 relative z-10">
            {/* Grande photo principale */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl h-72">
              <img
                src="https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=700&q=80"
                alt="Étudiants africains avec laptops"
                className="w-full h-full object-cover"
              />
              {/* Badge flottant — originalité */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-cama animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-ink">Examen en cours</p>
                  <p className="text-[10px] text-muted">INF302 · 47 participants</p>
                </div>
              </div>
            </div>

            {/* Deux petites photos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden shadow-lg h-44">
                <img
                  src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=400&q=80"
                  alt="Étudiante africaine qui étudie"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg h-44 relative">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80"
                  alt="Groupe d'étudiants africains"
                  className="w-full h-full object-cover"
                />
                {/* Badge or flottant */}
                <div className="absolute top-3 right-3 bg-gold text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                  LMD ✓
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vague de transition vers la section suivante */}
      <div className="relative h-16 -mb-1">
        <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path d="M0,32 C240,64 480,0 720,32 C960,64 1200,0 1440,32 L1440,64 L0,64 Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
}
