import Link from "next/link";
import { Play, Share2, AtSign, Link2, X } from "lucide-react";

const links = [
  ["Catalogue des cours",  "/auth/register"],
  ["Trouver une filière",   "#filieres"],
  ["Ressources étudiants", "/auth/register"],
  ["Enseigner avec CAMA",  "/auth/register"],
  ["Devenir partenaire",   "/auth/register"],
  ["Support technique",    "/auth/register"],
  ["À propos de JFN",      "/auth/register"],
];

const socials = [
  { icon: Play,   href: "#", label: "YouTube" },
  { icon: Share2, href: "#", label: "Facebook" },
  { icon: AtSign, href: "#", label: "Instagram" },
  { icon: Link2,  href: "#", label: "LinkedIn" },
  { icon: X,      href: "#", label: "X (Twitter)" },
];

const legal = [
  "Conditions d'utilisation",
  "Politique de confidentialité",
  "Cookies",
  "Protection des données",
  "Accessibilité",
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#2C2C2C" }} className="text-white">
      {/* Footnotes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 border-b border-white/10">
        <ol className="list-decimal list-inside space-y-1">
          {[
            "Basé sur les retours des étudiants inscrits sur CAMA, année académique 2024-2025.",
            "Données issues du suivi de progression sur la plateforme entre septembre et décembre 2024.",
          ].map((note, i) => (
            <li key={i} className="text-xs text-white/40 italic">{note}</li>
          ))}
        </ol>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
          {/* Brand */}
          <div>
            <p className="text-white font-light text-sm">Institut</p>
            <p className="text-white font-bold text-lg">JFN · <span style={{ color: "#49A942" }}>CAMA</span></p>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition-all"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-8" />

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Institut JFN · CAMA. Tous droits réservés.
          </p>
          <div className="flex flex-wrap gap-4">
            {legal.map((l) => (
              <a key={l} href="#" className="text-xs font-bold text-white/40 hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
