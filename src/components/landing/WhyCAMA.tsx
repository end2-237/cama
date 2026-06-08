import Link from "next/link";

const stats = [
  { value: "98%",  label: "des étudiants estiment que CAMA a facilité leur accès aux cours à distance." },
  { value: "3×",   label: "plus rapide qu'un système papier pour la publication des résultats de session." },
  { value: "0 doc",label: "perdu grâce à la certification PDF avec QR Code vérifiable en ligne." },
];

export default function WhyCAMA() {
  return (
    <section id="features" className="section-navy py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
          Pourquoi choisir CAMA ?
        </h2>
        <p className="text-white/60 text-lg mb-16 max-w-2xl mx-auto">
          Des chiffres qui parlent d'eux-mêmes, issus des premières semaines d'utilisation.
        </p>

        {/* 3-col stats with vertical dividers */}
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/20 mb-16">
          {stats.map(({ value, label }) => (
            <div key={value} className="px-8 py-6 md:py-0 text-center">
              <p className="text-6xl font-light text-green mb-4">{value}</p>
              <p className="text-white/70 text-base leading-relaxed max-w-xs mx-auto">{label}</p>
            </div>
          ))}
        </div>

        <Link href="/auth/register" className="btn-green text-base px-10 py-4">
          Accéder à la plateforme
        </Link>
      </div>
    </section>
  );
}
