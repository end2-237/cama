import {
  Monitor, Network, Database, Code2,
  BarChart3, Microscope, BookOpen, Briefcase,
  Calculator, Globe, Cpu, FlaskConical,
} from "lucide-react";
import Link from "next/link";

const filieres = [
  { icon: Monitor,      label: "Informatique",           school: "École Informatique" },
  { icon: Network,      label: "Réseaux & Télécom",       school: "École Informatique" },
  { icon: Database,     label: "Bases de Données",        school: "École Informatique" },
  { icon: Code2,        label: "Génie Logiciel",          school: "École Informatique" },
  { icon: BarChart3,    label: "Gestion & Finance",       school: "École Gestion" },
  { icon: Microscope,   label: "Sciences Biologiques",    school: "École Sciences" },
  { icon: BookOpen,     label: "Lettres & SHS",           school: "École Sciences" },
  { icon: Briefcase,    label: "Management",              school: "École Gestion" },
  { icon: Calculator,   label: "Mathématiques",           school: "École Sciences" },
  { icon: Globe,        label: "Relations Internationales", school: "École Gestion" },
  { icon: Cpu,          label: "Intelligence Artificielle", school: "École Informatique" },
  { icon: FlaskConical, label: "Chimie & Sciences",       school: "École Sciences" },
];

export default function Filieres() {
  return (
    <section id="filieres" className="bg-white py-24 overflow-hidden relative">

      {/* ── Cercle décoratif indigo en arrière-plan ── */}
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cama-50/60 blur-3xl -z-10" />
      <div className="absolute -right-20 bottom-0 w-64 h-64 rounded-full bg-gold/8 blur-2xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section témoignage centré — guillemets or (originalité vs NetAcad vert) ── */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <svg width="52" height="44" viewBox="0 0 52 44" fill="none">
              <path d="M0 44V26C0 11.7 9.1 3.6 27.3 0l3.3 5.5C20.3 7.7 16.2 12.8 15.1 19.8h8.8V44H0zm27.9 0V26C27.9 11.7 37 3.6 55.2 0l3.3 5.5C48.2 7.7 44.1 12.8 43 19.8h8.8V44H27.9z"
                fill="#F59E0B"/>
            </svg>
          </div>
          <p className="text-3xl md:text-4xl font-light text-ink leading-relaxed mb-5">
            Plus de{" "}
            <span className="text-gradient font-semibold">500 étudiants camerounais</span>{" "}
            accèdent chaque jour à leurs cours, passent leurs examens et consultent leurs résultats sur CAMA.
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-cama to-gold mx-auto mt-6 mb-5 rounded-full" />
          <p className="text-sm text-muted">Parcourez les domaines de formation disponibles à JFN.</p>
        </div>

        {/* ── Titre section ── */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-ink">Domaines de formation</h2>
          {/* Légende écoles — originalité */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted">
            {["École Informatique", "École Gestion", "École Sciences"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cama/40" />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── Grid filières — avec hover indigo (plus notre couleur) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
          {filieres.map(({ icon: Icon, label, school }) => (
            <a
              key={label}
              href="/auth/register"
              className="feature-card flex items-center gap-4 group border-l-4 border-transparent hover:border-cama"
            >
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-cama-50 group-hover:bg-cama group-hover:text-white transition-all duration-200">
                <Icon className="w-5 h-5 text-cama group-hover:text-white transition-colors" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink group-hover:text-cama transition-colors leading-snug">{label}</p>
                <p className="text-[10px] text-subtle truncate">{school}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center">
          <Link href="/auth/register" className="btn-outline text-sm">
            Voir le catalogue complet
          </Link>
        </div>
      </div>

      {/* Vague bas */}
      <div className="relative h-14 mt-10 -mb-1">
        <svg viewBox="0 0 1440 56" className="absolute bottom-0 w-full" preserveAspectRatio="none">
          <path d="M0,28 C360,56 1080,0 1440,28 L1440,56 L0,56 Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
}
