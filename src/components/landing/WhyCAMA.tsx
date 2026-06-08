import Link from "next/link";

const stats = [
  {
    value: "98%",
    label: "des étudiants estiment que CAMA a facilité leur accès aux cours à distance.",
    sub: "Source : enquête de satisfaction S1 2024",
  },
  {
    value: "3×",
    label: "plus rapide qu'un système papier pour la publication des résultats de session.",
    sub: "Comparatif interne JFN 2024",
  },
  {
    value: "0 doc",
    label: "perdu grâce à la certification PDF avec QR Code vérifiable en ligne.",
    sub: "Depuis le lancement de la plateforme",
  },
];

export default function WhyCAMA() {
  return (
    <section id="features" className="py-28 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 60%, #4F46E5 100%)" }}>

      {/* ── Motif kente sur fond navy ── */}
      <div className="absolute inset-0 kente-pattern opacity-20" />

      {/* ── Cercle or décoratif ── */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full border-2 border-gold/10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full border border-white/5 -translate-x-1/2 translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Badge or */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-sm font-semibold mb-6">
          Pourquoi CAMA ?
        </span>

        <h2 className="text-4xl md:text-5xl font-light text-white mb-4 leading-tight">
          Des chiffres qui parlent
          <br />
          <span className="text-gold font-semibold">d'eux-mêmes</span>
        </h2>
        <p className="text-white/60 text-lg mb-16 max-w-2xl mx-auto">
          Issus des premières semaines d'utilisation à l'Institut JFN, Cameroun.
        </p>

        {/* ── Stats 3 colonnes ── */}
        <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/15 mb-16">
          {stats.map(({ value, label, sub }) => (
            <div key={value} className="px-10 py-8 md:py-0 text-center group">
              {/* Chiffre en dégradé gold — originalité vs NetAcad */}
              <p className="text-7xl font-light mb-5 bg-gradient-to-br from-gold via-yellow-300 to-gold-dark bg-clip-text text-transparent">
                {value}
              </p>
              <p className="text-white/80 text-base leading-relaxed max-w-xs mx-auto mb-2">{label}</p>
              <p className="text-white/35 text-xs italic">{sub}</p>
            </div>
          ))}
        </div>

        <Link href="/auth/register" className="btn-gold text-base px-10 py-4">
          Accéder à la plateforme
        </Link>
      </div>

      {/* Vague de sortie */}
      <div className="relative h-16 mt-10 -mb-1">
        <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path d="M0,32 C360,0 1080,64 1440,32 L1440,64 L0,64 Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
