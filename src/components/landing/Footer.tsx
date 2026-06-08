import Link from "next/link";
import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";

const links = {
  Plateforme: [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Modules LMS", href: "#modules" },
    { label: "Sécurité", href: "#features" },
    { label: "Performance", href: "#features" },
  ],
  Acteurs: [
    { label: "Administrateurs", href: "#roles" },
    { label: "Enseignants", href: "#roles" },
    { label: "Étudiants", href: "#roles" },
    { label: "Jury", href: "#roles" },
  ],
  Accès: [
    { label: "Connexion", href: "/auth/login" },
    { label: "Inscription", href: "/auth/register" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-lg">CAMA</span>
                <span className="text-primary-400 text-xs block tracking-widest uppercase">JFN Platform</span>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
              Plateforme LMS sécurisée et optimisée bas-débit pour la gestion
              complète du parcours académique de l&apos;Institut JFN, Cameroun.
            </p>
            <div className="space-y-2">
              {[
                { icon: MapPin, text: "Yaoundé, Cameroun" },
                { icon: Mail,   text: "contact@jfn.cm" },
                { icon: Phone,  text: "+237 6XX XXX XXX" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/40 text-sm">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-white/40 text-sm hover:text-white transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} CAMA — Institut JFN. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-white/20 text-sm">Stack :</span>
            {["Next.js 14", "TypeScript", "Prisma", "Tailwind"].map((tech) => (
              <span key={tech} className="text-white/30 text-xs bg-white/5 px-2 py-1 rounded">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
