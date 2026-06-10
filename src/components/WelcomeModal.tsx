"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bot, ChevronRight, BookOpen, Cpu, ShieldCheck, Award } from "lucide-react";

const MESSAGES = [
  "Bienvenue sur CAMA, la plateforme académique de l'Institut JFN ! 🎓",
  "Je suis votre assistant personnel. Je suis là pour vous guider à chaque étape.",
  "Dans l'onglet **Mes Cours**, retrouvez tous vos cours — PDF, vidéo, interactif, live…",
  "Dans **Examens**, passez vos évaluations dans l'environnement sécurisé Safe-CAMA.",
  "Dans **Résultats**, consultez vos notes validées et téléchargez votre relevé certifié.",
  "Le bouton chat en bas à droite ? C'est moi ! Disponible 24h/24 pour vos questions. 💬",
];

const KEY = "cama_welcomed";

export default function WelcomeModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.role === "etudiant" && !localStorage.getItem(KEY)) {
      setVisible(true);
    }
  }, [user]);

  /* Typewriter effect for current message */
  useEffect(() => {
    if (!visible) return;
    const target = MESSAGES[msgIndex].replace(/\*\*/g, "");
    setDisplayed("");
    setTyping(true);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(iv);
        setTyping(false);
      }
    }, 28);
    return () => clearInterval(iv);
  }, [msgIndex, visible]);

  function next() {
    if (msgIndex < MESSAGES.length - 1) {
      setMsgIndex((i) => i + 1);
    } else {
      setDone(true);
    }
  }

  function finish() {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const isLast = msgIndex === MESSAGES.length - 1;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md animate-scale-in">
        {/* Avatar + speech bubble */}
        <div className="flex flex-col items-center">
          {/* CAMA Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cama to-indigo-700 flex items-center justify-center shadow-2xl">
              <Bot className="w-12 h-12 text-white" />
            </div>
            {typing && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-cama/30 animate-pulse-ring" />
          </div>

          <p className="text-white font-bold text-sm mb-1">Assistant CAMA</p>
          <p className="text-white/50 text-xs mb-6">Institut JFN · IA pédagogique</p>

          {/* Speech bubble */}
          <div className="bg-white rounded-3xl rounded-tl-sm p-6 shadow-xl w-full relative">
            <div className="absolute -top-2 left-8 w-4 h-4 bg-white rotate-45" />
            <p className="text-sm text-ink leading-relaxed min-h-[48px]">
              {displayed.split("**").map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
              {typing && <span className="inline-block w-0.5 h-4 bg-cama animate-pulse ml-0.5 align-middle" />}
            </p>

            {/* Progress dots */}
            <div className="flex gap-1.5 mt-4 mb-2">
              {MESSAGES.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === msgIndex ? "w-5 bg-cama" : i < msgIndex ? "w-2 bg-cama/30" : "w-2 bg-slate-200"}`} />
              ))}
            </div>
          </div>

          {/* Actions */}
          {!done ? (
            <button
              onClick={next}
              disabled={typing}
              className="mt-4 btn-primary py-3 px-8 text-sm disabled:opacity-60 w-full">
              {isLast ? "C'est parti !" : "Suivant"} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="mt-4 w-full space-y-2">
              <button onClick={finish} className="btn-primary py-3 px-8 text-sm w-full">
                Accéder à mes cours <BookOpen className="w-4 h-4" />
              </button>
              <button onClick={finish} className="text-xs text-white/50 hover:text-white/80 w-full py-2 transition-colors">
                Explorer par moi-même
              </button>
            </div>
          )}

          {/* Quick feature icons */}
          {!typing && msgIndex === 0 && (
            <div className="flex gap-3 mt-5">
              {[
                { icon: BookOpen, label: "5 modes", color: "bg-purple-100 text-purple-600" },
                { icon: Cpu, label: "Prof IA", color: "bg-amber-100 text-amber-600" },
                { icon: ShieldCheck, label: "Safe exam", color: "bg-green-100 text-green-600" },
                { icon: Award, label: "Diplôme QR", color: "bg-blue-100 text-blue-600" },
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-center gap-1 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
