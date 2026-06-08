import {
  Monitor, Network, Database, Code2,
  BarChart3, Microscope, BookOpen, Briefcase,
  Calculator, Globe, Cpu, FlaskConical,
} from "lucide-react";
import Link from "next/link";

const filieres = [
  { icon: Monitor,     label: "Informatique" },
  { icon: Network,     label: "Réseaux & Télécom" },
  { icon: Database,    label: "Bases de Données" },
  { icon: Code2,       label: "Génie Logiciel" },
  { icon: BarChart3,   label: "Gestion & Finance" },
  { icon: Microscope,  label: "Sciences Biologiques" },
  { icon: BookOpen,    label: "Lettres & Sciences Humaines" },
  { icon: Briefcase,   label: "Management" },
  { icon: Calculator,  label: "Mathématiques" },
  { icon: Globe,       label: "Relations Internationales" },
  { icon: Cpu,         label: "Intelligence Artificielle" },
  { icon: FlaskConical,"label": "Chimie & Sciences" },
];

export default function Filieres() {
  return (
    <section id="filieres" className="section-gray py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Quote-style intro — NetAcad pattern */}
        <div className="text-center mb-16">
          {/* Big green quote marks */}
          <div className="flex justify-center mb-6">
            <svg width="48" height="40" viewBox="0 0 48 40" fill="none">
              <path d="M0 40V24C0 10.7 8.3 3.3 25 0l3 5C18.7 7 15 11.7 14 18h8V40H0zm26 0V24C26 10.7 34.3 3.3 51 0l3 5C44.7 7 41 11.7 40 18h8V40H26z" fill="#49A942"/>
            </svg>
          </div>
          <p className="text-3xl md:text-4xl font-light text-ink max-w-3xl mx-auto leading-relaxed mb-4">
            Plus de 500 étudiants utilisent CAMA chaque jour
            pour accéder à leurs cours, passer leurs examens
            et consulter leurs résultats.
          </p>
          <div className="w-16 h-1 bg-green mx-auto mt-6 mb-4" />
          <p className="text-sm text-muted">Parcourez les filières ci-dessous pour commencer votre parcours.</p>
        </div>

        {/* Filières grid — NetAcad subject areas style */}
        <div className="mb-8">
          <h2 className="text-2xl font-light text-ink text-center mb-8">Domaines de formation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filieres.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="/auth/register"
                className="feature-card flex items-center gap-4 group hover:border-green/40"
              >
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-green" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-bold text-ink group-hover:text-green transition-colors leading-snug">
                  {label}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/auth/register" className="btn-outline-green text-sm">
            Voir le catalogue complet
          </Link>
        </div>
      </div>
    </section>
  );
}
