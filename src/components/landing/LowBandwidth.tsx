import { Wifi, FileText, Download, CheckCircle2, Zap } from "lucide-react";

const optimizations = [
  {
    icon: FileText,
    title: "Version Texte",
    desc: "Mode lecture sans images activable en 1 clic pour les zones à débit critique.",
    metric: "−90% données",
  },
  {
    icon: Download,
    title: "Data Budgeting",
    desc: "Affichage du poids exact de chaque fichier avant téléchargement. Décidez en connaissance de cause.",
    metric: "0 surprise",
  },
  {
    icon: Zap,
    title: "Lazy Loading",
    desc: "Les médias se chargent uniquement lorsque l'étudiant fait défiler jusqu'à eux.",
    metric: "Chargement ×3",
  },
  {
    icon: CheckCircle2,
    title: "Sauvegarde Auto",
    desc: "Les réponses d'examen sont sauvegardées localement toutes les 15 secondes. Aucune perte en cas de coupure.",
    metric: "15s interval",
  },
];

export default function LowBandwidth() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-warning/10 text-warning text-sm font-semibold mb-6">
              <Wifi className="w-4 h-4" />
              Optimisation Bas-Débit
            </span>
            <h2 className="section-title mb-4">
              Conçu pour la réalité
              <br />
              <span className="text-gradient">camerounaise</span>
            </h2>
            <p className="section-subtitle mb-10">
              CAMA n&apos;ignore pas les contraintes réseau — elle les intègre nativement.
              Chaque fonctionnalité est pensée pour fonctionner même avec une
              connexion 3G instable.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {optimizations.map(({ icon: Icon, title, desc, metric }) => (
                <div key={title} className="group p-4 rounded-2xl border-2 border-slate-100 hover:border-warning/30 hover:bg-warning/5 transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-primary-900">{title}</h4>
                        <span className="text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                          {metric}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mockup file viewer */}
          <div className="relative">
            {/* File browser mockup */}
            <div className="rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden">
              {/* Titlebar */}
              <div className="bg-primary-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger/70" />
                  <div className="w-3 h-3 rounded-full bg-warning/70" />
                  <div className="w-3 h-3 rounded-full bg-accent/70" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/10 rounded-lg px-3 py-1 text-center">
                    <span className="text-white/60 text-xs">cama.jfn.cm/cours/inf301/chapitre-3</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-warning" />
                  <span className="text-warning text-[10px] font-medium">3G</span>
                </div>
              </div>

              {/* Content */}
              <div className="bg-slate-50 p-5">
                {/* Mode toggle */}
                <div className="flex items-center justify-between mb-4 p-3 bg-warning/10 rounded-xl border border-warning/20">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-warning" />
                    <span className="text-warning text-xs font-semibold">Mode économique activé</span>
                  </div>
                  <button className="text-xs text-slate-500 underline">Désactiver</button>
                </div>

                {/* Chapter list */}
                <div className="space-y-2 mb-4">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Ressources — Chap. 3</p>
                  {[
                    { name: "Cours_Recursivite.pdf", size: "1.2 Mo", type: "PDF", available: true },
                    { name: "Exercices_S3.pdf", size: "340 Ko", type: "PDF", available: true },
                    { name: "Demo_Fibonacci.mp4", size: "48 Mo", type: "Vidéo", available: false },
                  ].map((file) => (
                    <div key={file.name} className={`flex items-center justify-between p-3 rounded-xl border ${file.available ? "bg-white border-slate-200" : "bg-slate-100 border-slate-200 opacity-60"}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${file.type === "PDF" ? "bg-danger/10 text-danger" : "bg-primary-100 text-primary-600"}`}>
                          {file.type}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{file.size} · {file.available ? "Disponible" : "Trop lourd (mode économique)"}</p>
                        </div>
                      </div>
                      {file.available && (
                        <button className="text-primary-600 hover:text-primary-700">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-700">Progression Chapitre 3</span>
                    <span className="text-xs font-bold text-accent">60%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-[60%] bg-accent rounded-full" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Lire jusqu&apos;à la fin pour valider le checkpoint</p>
                </div>
              </div>
            </div>

            {/* Decorative */}
            <div className="absolute -z-10 -bottom-8 -right-8 w-48 h-48 bg-warning/10 rounded-full blur-2xl" />
            <div className="absolute -z-10 -top-8 -left-8 w-32 h-32 bg-primary-100/50 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
