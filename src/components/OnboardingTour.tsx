"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, BookOpen, GraduationCap, ShieldCheck, Award, MessageCircle } from "lucide-react";

interface Step {
  icon: React.FC<{ className?: string }>;
  title: string;
  desc: string;
  detail: string;
  color: string;
  bg: string;
}

const STEPS: Step[] = [
  {
    icon: GraduationCap,
    title: "Bienvenue dans CAMA",
    desc: "Votre plateforme académique nouvelle génération",
    detail: "CAMA est le LMS de l'Institut JFN, conçu spécifiquement pour l'Afrique. Optimisé bas-débit, sécurisé et traçable — du premier cours au diplôme certifié.",
    color: "text-cama",
    bg: "bg-cama/10",
  },
  {
    icon: BookOpen,
    title: "5 modes d'apprentissage",
    desc: "Apprenez comme vous voulez, où que vous soyez",
    detail: "PDF, Vidéo, Cours natif interactif, Classe virtuelle Live et Prof IA — chaque chapitre combine les modes selon vos besoins et votre connexion.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: ShieldCheck,
    title: "Examens Safe-CAMA",
    desc: "Un environnement d'examen sécurisé et équitable",
    detail: "Safe-CAMA plein écran, détecte les comportements suspects et sauvegarde toutes les 15 secondes. Le jury humain prend toutes les décisions finales.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Award,
    title: "Certification vérifiable",
    desc: "Votre diplôme, une preuve incontestable",
    detail: "Chaque résultat est validé par le jury, horodaté et certifié. Votre relevé final inclut un QR code vérifiable publiquement par n'importe quel recruteur.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: MessageCircle,
    title: "Vous n'êtes jamais seul",
    desc: "L'assistant CAMA est toujours là",
    detail: "Le bouton chat en bas à droite ouvre l'assistant IA CAMA à tout moment. Prof IA dans chaque cours. Forum UE pour discuter avec vos camarades.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

const KEY = "cama_tour_done";

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  function finish() {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-cama to-indigo-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center mb-6 mx-auto`}>
            <s.icon className={`w-8 h-8 ${s.color}`} />
          </div>

          {/* Steps indicator */}
          <div className="flex justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-cama" : "w-1.5 bg-slate-200"}`}
              />
            ))}
          </div>

          <h2 className="text-2xl font-bold text-ink text-center mb-2">{s.title}</h2>
          <p className={`text-sm font-bold text-center mb-4 ${s.color}`}>{s.desc}</p>
          <p className="text-sm text-muted text-center leading-relaxed">{s.detail}</p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={finish}
            className="text-xs text-muted hover:text-ink transition-colors">
            Passer <X className="w-3 h-3 inline ml-0.5" />
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-slate-50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-muted" />
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep((s) => s + 1)}
              className="btn-primary py-2.5 px-6 text-sm">
              {isLast ? "Commencer !" : "Suivant"} {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
