import {
  Cog,
  Users,
  GraduationCap,
  UserCheck,
  Scale,
  ChevronRight,
} from "lucide-react";

const roles = [
  {
    icon: Cog,
    role: "Super Administrateur",
    badge: "Niveau 1",
    badgeColor: "bg-danger/10 text-danger",
    description: "Configuration globale de la plateforme, gestion des administrateurs, supervision système et logs d'activité.",
    permissions: ["Config. système", "Gestion admins", "Supervision logs", "Paramètres RBAC"],
    color: "border-danger/20 hover:border-danger/40",
    iconBg: "bg-danger/5",
    iconColor: "text-danger",
  },
  {
    icon: Users,
    role: "Administrateur",
    badge: "Niveau 2",
    badgeColor: "bg-primary-100 text-primary-700",
    description: "Rôle central académique : gestion des 3 écoles, cycles, filières, niveaux, promotions et affectation des enseignants aux UE.",
    permissions: ["Gestion écoles", "Cycles & filières", "Affectation UE", "Suivi global"],
    color: "border-primary-200 hover:border-primary-400",
    iconBg: "bg-primary-50",
    iconColor: "text-primary-600",
  },
  {
    icon: GraduationCap,
    role: "Enseignant",
    badge: "Niveau 3",
    badgeColor: "bg-accent/10 text-accent",
    description: "Création des cours, dépôt des ressources pédagogiques, élaboration des évaluations et suivi de la progression des étudiants.",
    permissions: ["Créer cours", "Déposer ressources", "Créer examens", "Suivi étudiants"],
    color: "border-accent/20 hover:border-accent/40",
    iconBg: "bg-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: UserCheck,
    role: "Étudiant",
    badge: "Niveau 4",
    badgeColor: "bg-warning/10 text-warning",
    description: "Accès aux cours et ressources, passage des examens sécurisés, consultation des résultats et téléchargement des certifications.",
    permissions: ["Accès cours", "Passer examens", "Voir résultats", "Télécharger cert."],
    color: "border-warning/20 hover:border-warning/40",
    iconBg: "bg-warning/5",
    iconColor: "text-warning",
  },
  {
    icon: Scale,
    role: "Jury",
    badge: "Niveau 5",
    badgeColor: "bg-slate-100 text-slate-600",
    description: "Validation des résultats académiques, présidence des délibérations et signature numérique des procès-verbaux de session.",
    permissions: ["Valider résultats", "Délibérations", "Signer PV", "Arrêter notes"],
    color: "border-slate-200 hover:border-slate-400",
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
  },
];

export default function Roles() {
  return (
    <section id="roles" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-4">
            Acteurs du système
          </span>
          <h2 className="section-title mb-4">5 rôles, 1 écosystème cohérent</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Chaque acteur dispose d&apos;une interface et de permissions adaptées à ses
            responsabilités, gérées par un système RBAC strict.
          </p>
        </div>

        {/* Roles grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((r) => (
            <div
              key={r.role}
              className={`card p-6 border-2 transition-all duration-200 group cursor-default ${r.color}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${r.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <r.icon className={`w-6 h-6 ${r.iconColor}`} />
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${r.badgeColor}`}>
                  {r.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-primary-900 mb-2">{r.role}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">{r.description}</p>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Permissions clés</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {r.permissions.map((perm) => (
                    <div key={perm} className="flex items-center gap-1.5">
                      <ChevronRight className={`w-3 h-3 ${r.iconColor} flex-shrink-0`} />
                      <span className="text-xs text-slate-600">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Hierarchy visual card */}
          <div className="card p-6 bg-gradient-to-br from-primary-800 to-primary-900 border-primary-700 sm:col-span-2 lg:col-span-1">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Hiérarchie JFN</p>
            <div className="font-mono text-sm text-white/90 space-y-1 leading-relaxed">
              <p className="text-accent font-bold">JFN</p>
              <p className="pl-3 text-white/70">├── École d&apos;Informatique</p>
              <p className="pl-6 text-white/60">│   ├── Licence (L1→L3)</p>
              <p className="pl-9 text-white/50">│   │   └── INF, RSX, SIO</p>
              <p className="pl-6 text-white/60">│   └── Master (M1→M2)</p>
              <p className="pl-3 text-white/70">├── École de Gestion</p>
              <p className="pl-6 text-white/50">│   └── ...</p>
              <p className="pl-3 text-white/70">└── École des Sciences</p>
              <p className="pl-6 text-white/50">    └── ...</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/40 text-xs">Structure complète gérée par l&apos;Administrateur académique</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
