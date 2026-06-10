import Link from "next/link";
import { Play, Share2, AtSign, Link2, X } from "lucide-react";

const links = [
  ["Guide CAMA",               "/guide"],
  ["Catalogue des cours",     "/auth/register"],
  ["Trouver une filière",      "#filieres"],
  ["Ressources étudiants",    "/auth/register"],
  ["Enseigner avec CAMA",     "/auth/register"],
  ["Devenir partenaire",      "/auth/register"],
  ["Support technique",       "/auth/register"],
  ["À propos de JFN",         "/auth/register"],
];

const socials = [
  { icon: Play,   label: "YouTube" },
  { icon: Share2, label: "Facebook" },
  { icon: AtSign, label: "Instagram" },
  { icon: Link2,  label: "LinkedIn" },
  { icon: X,      label: "X" },
];

const legal = [
  "Conditions d'utilisation",
  "Confidentialité",
  "Cookies",
  "Protection des données",
  "Accessibilité",
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white relative overflow-hidden">

      {/* ── Motif kente subtil en fond ── */}
      <div className="absolute inset-0 kente-pattern opacity-30" />

      {/* ── Barre indigo→or en haut ── */}
      <div className="h-1 w-full bg-gradient-to-r from-cama via-cama-400 to-gold relative z-10" />

      {/* Notes de bas de page */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 border-b border-white/10">
        <ol className="list-decimal list-inside space-y-1">
          {[
            "Basé sur les retours des étudiants inscrits sur CAMA, année académique 2024–2025.",
            "Données issues du suivi de progression sur la plateforme entre septembre et décembre 2024.",
          ].map((note, i) => (
            <li key={i} className="text-xs text-white/35 italic">{note}</li>
          ))}
        </ol>
      </div>

      {/* Main footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          {/* Brand + barre */}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-cama to-gold" />
            <div>
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">Institut</p>
              <p className="text-white font-bold text-xl leading-none">
                JFN · <span className="text-cama-300">CAMA</span>
              </p>
            </div>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-10 h-10 rounded-full border border-white/25 flex items-center justify-center text-white/50 hover:text-white hover:border-white hover:bg-cama/20 transition-all"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 mb-8" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {links.map(([label, href]) => (
            <Link key={label} href={href} className="text-sm text-white/45 hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Barre légale */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} Institut JFN · CAMA. Tous droits réservés. Yaoundé, Cameroun.
          </p>
          <div className="flex flex-wrap gap-4">
            {legal.map((l) => (
              <a key={l} href="#" className="text-xs font-bold text-white/35 hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
