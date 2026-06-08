import Link from "next/link";
import { Flame } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 min-h-[88vh] items-center">

          {/* Left — text */}
          <div className="py-16 lg:py-24 pr-0 lg:pr-16">

            {/* Announcement banner */}
            <div className="inline-flex items-start gap-3 bg-surface border border-border rounded-2xl px-5 py-4 mb-10 max-w-md">
              <Flame className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-ink">La rentrée 2024-2025 est ouverte !</p>
                <p className="text-sm text-muted mt-0.5">
                  Accédez à vos cours dès maintenant sur la{" "}
                  <a href="#features" className="text-green underline font-medium">
                    plateforme CAMA
                  </a>
                </p>
              </div>
            </div>

            {/* Heading — NetAcad thin style */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-ink leading-[1.05] mb-6 tracking-tight">
              Construisez
              <br />
              votre{" "}
              <span className="green-underline font-light">avenir.</span>
              <br />
              Ici, à JFN.
            </h1>

            <p className="text-lg text-muted leading-relaxed mb-10 max-w-lg">
              Cours en ligne, examens sécurisés et suivi académique complet —
              conçu pour les réalités du Cameroun. De la Licence au Master,
              tout votre parcours en un seul endroit.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register" className="btn-green text-base px-8 py-4">
                Commencer maintenant
              </Link>
              <Link href="#filieres" className="btn-outline-green text-base px-8 py-4">
                Explorer les filières
              </Link>
            </div>
          </div>

          {/* Right — photo collage NetAcad style */}
          <div className="hidden lg:block relative h-full min-h-[600px]">
            {/* Main large photo */}
            <div className="absolute top-12 left-0 right-0 bottom-0">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&q=80"
                alt="Étudiants JFN"
                className="w-full h-[480px] object-cover rounded-l-[2.5rem]"
              />
            </div>
            {/* Top-right smaller photo */}
            <div className="absolute top-0 right-0 w-48 h-40 z-10">
              <img
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=80"
                alt="Cours en ligne"
                className="w-full h-full object-cover rounded-2xl shadow-lg"
              />
            </div>
            {/* Bottom-right smaller photo */}
            <div className="absolute bottom-8 right-4 w-44 h-36 z-10">
              <img
                src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80"
                alt="Étudiant avec laptop"
                className="w-full h-full object-cover rounded-2xl shadow-lg"
              />
            </div>
            {/* Dot grid decoration */}
            <div
              className="absolute bottom-24 left-[-20px] w-32 h-32 opacity-30 z-0"
              style={{
                backgroundImage: "radial-gradient(circle, #49A942 1.5px, transparent 1.5px)",
                backgroundSize: "12px 12px",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
