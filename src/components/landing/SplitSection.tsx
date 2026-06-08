import Link from "next/link";

export default function SplitSection() {
  return (
    <>
      {/* Split 1 — image left, text right */}
      <section className="section-white py-0 overflow-hidden">
        <div className="grid lg:grid-cols-2 items-stretch">
          {/* Photo left — circle crop bottom-right corner */}
          <div className="relative min-h-[480px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
              alt="Étudiants qui collaborent"
              className="w-full h-full object-cover"
              style={{ borderBottomRightRadius: "8rem" }}
            />
          </div>

          {/* Text right */}
          <div className="flex items-center px-12 lg:px-20 py-20">
            <div>
              <h2 className="text-5xl font-light text-ink leading-tight mb-6">
                Préparez et réussissez
                <br />
                <span className="green-underline">vos examens</span>
              </h2>
              <p className="text-muted text-lg leading-relaxed mb-5">
                Le moteur Safe-CAMA offre un environnement d'examen sécurisé :
                timer intégré, soumission automatique et sauvegarde locale
                toutes les 15 secondes.
              </p>
              <p className="text-muted text-lg leading-relaxed mb-10">
                En cas de coupure de courant ou d'interruption réseau, vos
                réponses sont préservées. Zéro perte, zéro stress.
              </p>
              <Link href="/auth/register" className="btn-outline-green text-sm px-8 py-4">
                Explorer les examens
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Split 2 — text left, image right */}
      <section className="section-white py-0 overflow-hidden">
        <div className="grid lg:grid-cols-2 items-stretch">
          {/* Text left */}
          <div className="flex items-center px-12 lg:px-20 py-20 max-w-3xl">
            <div>
              <h2 className="text-5xl font-light text-ink leading-tight mb-6">
                Votre parcours,
                <br />
                <span className="green-underline">tracé précisément</span>
              </h2>
              <p className="text-muted text-lg leading-relaxed mb-5">
                Tableaux de bord personnalisés pour chaque acteur : progression
                par chapitre, détection de décrochage, historique de consultation.
              </p>
              <p className="text-muted text-lg leading-relaxed mb-10">
                Les enseignants voient en temps réel quels chapitres posent
                problème, et les étudiants savent exactement où ils en sont.
              </p>
              <Link href="/auth/register" className="btn-outline-green text-sm px-8 py-4">
                Voir les tableaux de bord
              </Link>
            </div>
          </div>

          {/* Photo right */}
          <div className="relative min-h-[480px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80"
              alt="Tableau de bord académique"
              className="w-full h-full object-cover"
              style={{ borderBottomLeftRadius: "8rem" }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
