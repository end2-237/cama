import Link from "next/link";

export default function AuthPanel() {
  return (
    <div
      className="relative flex flex-col justify-between h-full p-10 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1E1B4B 0%, #2D2A6E 50%, #1a1640 100%)" }}
    >
      {/* Kente pattern */}
      <div className="absolute inset-0 kente-pattern opacity-20" />

      {/* SVG décoratif */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 500 800"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Ligne animée 1 */}
        <path
          className="animate-wave-line"
          d="M-20 200 C 60 160, 120 260, 200 200 S 320 140, 400 200 S 480 280, 560 200"
          stroke="url(#lineGrad)"
          strokeWidth="3"
          fill="none"
          opacity="0.7"
          strokeDasharray="120"
        />
        {/* Ligne animée 2 — décalée */}
        <path
          className="animate-wave-line"
          style={{ animationDuration: "9s", animationDelay: "-3s" }}
          d="M-20 320 C 80 280, 140 380, 220 320 S 340 260, 420 320 S 500 400, 580 320"
          stroke="url(#lineGrad2)"
          strokeWidth="2"
          fill="none"
          opacity="0.4"
          strokeDasharray="80"
        />

        {/* Losange Adinkra — flottant */}
        <g className="animate-float-med" style={{ transformOrigin: "380px 80px" }}>
          <rect x="352" y="52" width="56" height="56" fill="#F59E0B" opacity="0.85" rx="4" transform="rotate(45 380 80)" />
          <rect x="362" y="62" width="36" height="36" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.5" rx="2" transform="rotate(45 380 80)" />
        </g>

        {/* Cercle indigo — flottant */}
        <g className="animate-float-slow" style={{ transformOrigin: "60px 120px", animationDelay: "1s" }}>
          <circle cx="60" cy="120" r="18" fill="#818CF8" opacity="0.8" />
          <circle cx="60" cy="120" r="28" fill="none" stroke="#818CF8" strokeWidth="1.5" opacity="0.3" />
        </g>

        {/* Triangle africain — flottant */}
        <g className="animate-float-fast" style={{ transformOrigin: "70px 415px", animationDelay: "0.5s" }}>
          <polygon points="30,450 70,380 110,450" fill="#F59E0B" opacity="0.6" />
          <polygon points="30,450 70,380 110,450" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.4" />
        </g>

        {/* Hexagone — drift lent */}
        <g className="animate-drift" style={{ transformOrigin: "90px 677px", animationDelay: "2s" }}>
          <path d="M60 660 L90 643 L120 660 L120 694 L90 711 L60 694 Z" fill="#F59E0B" opacity="0.75" />
          <path d="M60 660 L90 643 L120 660 L120 694 L90 711 L60 694 Z" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </g>

        {/* Petit carré bas-center — flottant */}
        <g className="animate-float-fast" style={{ transformOrigin: "212px 712px", animationDelay: "1.5s" }}>
          <rect x="200" y="700" width="24" height="24" rx="4" fill="#A5B4FC" opacity="0.6" />
        </g>

        {/* Croix Adinkra mid-right — drift */}
        <g className="animate-drift" transform="translate(430, 480)" opacity="0.5" style={{ animationDelay: "3s" }}>
          <rect x="-4" y="-22" width="8" height="44" rx="4" fill="white" />
          <rect x="-22" y="-4" width="44" height="8" rx="4" fill="white" />
          <circle cx="0" cy="0" r="6" fill="#F59E0B" />
        </g>

        {/* Silhouette Cameroun watermark */}
        <g transform="translate(160, 380) scale(0.6)" opacity="0.06">
          <path
            d="M120,20 L160,10 L200,30 L220,70 L240,120 L230,180 L210,220 L200,280 L180,320 L160,360 L140,340 L120,300 L100,260 L80,220 L60,200 L40,180 L30,140 L50,100 L70,60 Z"
            fill="white"
          />
        </g>

        {/* Dégradés */}
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0" />
            <stop offset="30%" stopColor="#818CF8" stopOpacity="1" />
            <stop offset="70%" stopColor="#F59E0B" stopOpacity="1" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Contenu ── */}

      {/* Logo — slide depuis la gauche */}
      <div className="relative z-10 animate-slide-right">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cama-300 to-gold" />
          <div>
            <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">Institut</p>
            <p className="text-white font-bold text-xl leading-none">
              JFN · <span className="text-cama-300">CAMA</span>
            </p>
          </div>
        </Link>
      </div>

      {/* Tagline — fade up */}
      <div className="relative z-10 animate-fade-up delay-200">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
          Plateforme Académique
        </p>
        <h2 className="text-4xl font-light text-white leading-tight mb-4">
          Construisez votre
          <br />
          <span className="text-gold font-semibold">avenir académique</span>
          <br />
          au Cameroun.
        </h2>
        <p className="text-white/60 text-sm leading-relaxed max-w-xs">
          Cours, examens sécurisés, suivi de progression — conçu pour les réalités du terrain.
        </p>
      </div>

      {/* Proverbe — fade up plus tard */}
      <div className="relative z-10 animate-fade-up delay-400">
        <div className="border-l-2 border-gold pl-4">
          <p className="text-white/70 text-sm italic leading-relaxed">
            &ldquo;Si tu veux aller vite, marche seul. Si tu veux aller loin, marche ensemble.&rdquo;
          </p>
          <p className="text-gold text-xs font-semibold mt-1">— Proverbe africain</p>
        </div>
      </div>
    </div>
  );
}
