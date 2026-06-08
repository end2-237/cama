import {
  Wifi,
  ShieldCheck,
  BookOpen,
  BarChart3,
  Brain,
  FileText,
  Bell,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Wifi,
    title: "Natif Bas-Débit",
    description:
      "Mode texte sans images, lazy loading, affichage du poids des fichiers avant téléchargement. Conçu pour les connexions instables du Cameroun.",
    tag: "Performance",
    tagColor: "bg-primary-100 text-primary-700",
    iconColor: "text-primary-600",
    iconBg: "bg-primary-50",
  },
  {
    icon: ShieldCheck,
    title: "Proctoring IA",
    description:
      "Surveillance automatisée via webcam : détection d'absence, tierce personne, smartphone. Modèle YOLOv8 nano pour la rapidité sur faible CPU.",
    tag: "Sécurité",
    tagColor: "bg-danger/10 text-danger",
    iconColor: "text-danger",
    iconBg: "bg-danger/5",
  },
  {
    icon: Brain,
    title: "Anti-IA & Anti-Copy",
    description:
      "Analyse de latence de frappe. Un collage massif de texte déclenche une alerte Suspicion IA. Copy-paste système désactivé en mode examen.",
    tag: "Intégrité",
    tagColor: "bg-warning/10 text-warning",
    iconColor: "text-warning",
    iconBg: "bg-warning/5",
  },
  {
    icon: BookOpen,
    title: "LMS Complet",
    description:
      "Cours organisés par chapitres avec checkpoints. Upload PDF, vidéos, liens. Progression validée avant accès au chapitre suivant.",
    tag: "Apprentissage",
    tagColor: "bg-accent/10 text-accent",
    iconColor: "text-accent",
    iconBg: "bg-accent/5",
  },
  {
    icon: BarChart3,
    title: "Suivi & Statistiques",
    description:
      "Tableaux de bord enseignant avec courbes de décrochage par chapitre. Historique de consultation et taux de progression par promotion.",
    tag: "Analytics",
    tagColor: "bg-primary-100 text-primary-700",
    iconColor: "text-primary-600",
    iconBg: "bg-primary-50",
  },
  {
    icon: FileText,
    title: "Certification PDF",
    description:
      "Génération automatique de diplômes et relevés de notes au format PDF avec QR Code d'authentification sécurisé vérifiable en ligne.",
    tag: "Certification",
    tagColor: "bg-accent/10 text-accent",
    iconColor: "text-accent",
    iconBg: "bg-accent/5",
  },
  {
    icon: Bell,
    title: "Communication",
    description:
      "Forums par UE, annonces avec accusé de réception numérique, notifications push. Hub de communication centralisé par matière.",
    tag: "Collaboration",
    tagColor: "bg-warning/10 text-warning",
    iconColor: "text-warning",
    iconBg: "bg-warning/5",
  },
  {
    icon: Lock,
    title: "RBAC & 2FA",
    description:
      "5 rôles distincts (Super-Admin, Admin, Enseignant, Étudiant, Jury). Double authentification par email ou OTP. Sessions JWT sécurisées.",
    tag: "Accès",
    tagColor: "bg-danger/10 text-danger",
    iconColor: "text-danger",
    iconBg: "bg-danger/5",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-4">
            Fonctionnalités
          </span>
          <h2 className="section-title mb-4">
            Tout ce dont JFN a besoin,
            <br />
            dans une seule plateforme
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            CAMA combine LMS, gestion académique et outils d&apos;intégrité dans une
            interface optimisée pour les contraintes réelles du terrain camerounais.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="card p-6 group cursor-default"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl ${feat.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <feat.icon className={`w-6 h-6 ${feat.iconColor}`} />
              </div>

              {/* Tag */}
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${feat.tagColor} mb-3`}>
                {feat.tag}
              </span>

              <h3 className="text-base font-bold text-primary-900 mb-2">
                {feat.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
