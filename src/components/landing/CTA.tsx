import Link from "next/link";

export default function CTA() {
  return (
    <section className="section-white py-0 overflow-hidden">
      <div className="grid lg:grid-cols-2 items-stretch">
        {/* Text left */}
        <div className="flex items-center px-12 lg:px-24 py-24 max-w-3xl">
          <div>
            <h2 className="text-5xl font-light text-ink leading-tight mb-6">
              L&apos;académique numérique,
              <br />
              <span className="green-underline">rendu réel.</span>
            </h2>
            <p className="text-muted text-lg leading-relaxed mb-5">
              Grâce à l&apos;expertise pédagogique de JFN et un écosystème numérique
              pensé pour le Cameroun, CAMA transforme chaque contrainte en
              opportunité depuis 2024.
            </p>
            <p className="text-muted text-lg leading-relaxed mb-10">
              Transformez votre potentiel en expertise certifiée.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register" className="btn-green text-base px-8 py-4">
                Commencer maintenant
              </Link>
              <Link href="#features" className="btn-outline-green text-base px-8 py-4">
                En savoir plus
              </Link>
            </div>
          </div>
        </div>

        {/* Photo right */}
        <div className="hidden lg:block min-h-[500px]">
          <img
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=80"
            alt="Étudiants en salle informatique"
            className="w-full h-full object-cover"
            style={{ borderBottomLeftRadius: "8rem" }}
          />
        </div>
      </div>
    </section>
  );
}
