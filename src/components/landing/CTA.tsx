import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="bg-white py-0 overflow-hidden">
      <div className="grid lg:grid-cols-2 items-stretch">

        {/* Texte gauche */}
        <div className="flex items-center px-10 lg:px-24 py-24">
          <div>
            <span className="badge bg-cama-50 text-cama mb-5">Rejoindre JFN</span>
            <h2 className="text-5xl font-light text-ink leading-tight mb-6">
              L&apos;académique numérique,
              <br />
              <span className="gold-underline font-semibold">rendu réel.</span>
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-5">
              Grâce à l&apos;expertise pédagogique de JFN et une plateforme pensée
              pour les réalités africaines, CAMA transforme chaque contrainte
              en opportunité d&apos;apprentissage depuis 2024.
            </p>
            <p className="text-muted text-lg leading-relaxed mb-10">
              Transformez votre potentiel en expertise certifiée.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register" className="btn-primary text-base px-8 py-4 gap-2">
                Commencer maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#features" className="btn-outline text-base px-8 py-4">
                En savoir plus
              </Link>
            </div>
          </div>
        </div>

        {/* Photo droite — étudiants africains en salle info */}
        <div className="hidden lg:block min-h-[520px] relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=900&q=80"
            alt="Étudiants africains en cours"
            className="w-full h-full object-cover"
            style={{ borderBottomLeftRadius: "8rem" }}
          />
          {/* Overlay badge CAMA */}
          <div className="absolute inset-0 bg-gradient-to-t from-cama-900/40 to-transparent" />
          <div className="absolute bottom-10 left-8 text-white">
            <p className="text-3xl font-bold">JFN · CAMA</p>
            <p className="text-white/70 text-sm">Institut, Cameroun · Depuis 2024</p>
          </div>
        </div>
      </div>
    </section>
  );
}
