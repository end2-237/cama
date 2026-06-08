import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="bg-white overflow-hidden relative"
      style={{ height: "100vh", minHeight: "600px" }}
    >
      {/* Bloc diagonal */}
      <div className="absolute top-0 right-0 w-[52%] h-full bg-cama-50 -z-10"
        style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)" }} />
      <div className="absolute top-0 right-0 w-[52%] h-full kente-pattern -z-10"
        style={{ clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-start" style={{ paddingTop: "80px" }}>
        <div className="grid lg:grid-cols-2 gap-0 w-full items-start" style={{ height: "calc(100% - 80px)" }}>

          {/* Texte gauche */}
          <div className="flex flex-col justify-start h-full pr-0 lg:pr-10 relative z-10 pt-4 pb-4">

            {/* Annonce */}
            <div className="inline-flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2 mb-3 max-w-xs shadow-sm self-start">
              <Flame className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <p className="text-xs text-ink">
                <strong>Rentrée 2024–2025</strong> —{" "}
                <a href="#features" className="text-cama underline">Accéder à CAMA</a>
              </p>
            </div>

            {/* H1 — réduit pour tenir dans le viewport */}
            <h1 className="font-light text-ink leading-[1.05] mb-3 tracking-tight"
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)" }}>
              Construisez
              <br />
              votre{" "}
              <span className="gold-underline font-semibold">avenir.</span>
              <br />
              Ici, à JFN.
            </h1>

            <p className="text-sm text-muted leading-relaxed mb-4 max-w-sm">
              Cours en ligne, examens sécurisés par IA et suivi académique
              complet — conçu pour les réalités du Cameroun.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-4">
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
          <div className="hidden lg:flex flex-col gap-2.5 pl-6 h-full justify-start relative z-10 pt-4 pb-4">

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
            <div className="grid grid-cols-2 gap-2.5 flex-shrink-0 h-36">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80"
                  alt="Étudiants collaborant"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg relative">
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
        <svg viewBox="0 0 1440 32" className="w-full" preserveAspectRatio="none">
          <path d="M0,16 C240,32 480,0 720,16 C960,32 1200,0 1440,16 L1440,32 L0,32 Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
}
