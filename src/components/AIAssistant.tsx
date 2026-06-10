"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Minimize2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useDragOffset } from "@/hooks/useDragOffset";

interface Msg { role: "user" | "bot"; text: string; }

const SUGGESTIONS = [
  "Comment démarrer un cours ?",
  "Comment fonctionne Safe-CAMA ?",
  "Où voir mes résultats ?",
  "Comment rejoindre un live ?",
];

const KNOWLEDGE: Array<{ kw: string[]; ans: string }> = [
  { kw: ["cours", "démarrer", "commencer", "accéder"], ans: "Pour accéder à un cours, rendez-vous dans **Mes Cours** depuis votre dashboard. Cliquez sur un cours pour l'ouvrir — vous trouverez les chapitres dans la barre latérale. Chaque chapitre propose jusqu'à 5 modes : PDF, Vidéo, Natif, Live et Prof IA." },
  { kw: ["safe", "examen", "exam", "sécurisé", "passer"], ans: "**Safe-CAMA** est notre moteur d'examen sécurisé. Il active le plein écran, désactive copier-coller et détecte les onglets. Il sauvegarde toutes les 15 secondes. Pour passer un examen : allez dans l'onglet **Examens** de votre dashboard et cliquez sur un examen disponible." },
  { kw: ["résultat", "note", "délibération", "jury"], ans: "Vos résultats sont dans l'onglet **Résultats** de votre dashboard. Les notes sont d'abord transmises au jury pour validation humaine, puis vous pouvez télécharger votre relevé certifié avec QR code." },
  { kw: ["live", "classe", "virtuel", "rejoindre"], ans: "Quand un live est en cours, une **bannière orange** apparaît en haut de votre dashboard. Cliquez sur **Rejoindre** ! Vous pouvez aussi y accéder depuis votre cours, dans l'onglet Live d'un chapitre. Le replay est disponible après la session." },
  { kw: ["pdf", "video", "mode", "apprentissage"], ans: "CAMA propose **5 modes d'apprentissage** : PDF (lecture page à page), Vidéo (qualité adaptive, audio-only disponible), Natif (interactif avec quiz), Live (classe virtuelle) et Prof IA (assistant ancré sur le cours). Votre enseignant choisit les modes disponibles par chapitre." },
  { kw: ["diplôme", "certificat", "qr", "vérifier"], ans: "Votre diplôme est dans l'onglet **Résultats** → bouton **Relevé certifié**. Il contient un QR code vérifiable publiquement sur cama.jfn.cm/verifier. Chaque document est traçable depuis votre inscription jusqu'à la délibération." },
  { kw: ["prof", "ia", "assistant", "aide", "question"], ans: "Le **Prof IA** est disponible dans chaque chapitre (icône cerveau). Il répond uniquement aux questions relatives au contenu du cours — jamais hors sujet. Pour des questions générales sur CAMA, c'est moi qui suis là ! 😊" },
  { kw: ["mot de passe", "connexion", "login", "compte"], ans: "Pour vous connecter, utilisez votre email institutionnel et le mot de passe fourni par l'administration de l'Institut JFN. En cas de problème, contactez support@jfn.cm." },
  { kw: ["guide", "documentation", "aide", "comment"], ans: "Notre **Guide CAMA complet** est disponible à tout moment. Il couvre les 5 modes d'apprentissage, Safe-CAMA, la certification et plus encore." },
];

function getAnswer(q: string): string {
  const lower = q.toLowerCase();
  for (const entry of KNOWLEDGE) {
    if (entry.kw.some((k) => lower.includes(k))) return entry.ans;
  }
  return "Je ne suis pas sûr de pouvoir répondre à ça précisément. Consultez le **Guide CAMA** pour une documentation complète, ou contactez notre support à support@jfn.cm.";
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Bonjour ! Je suis l'assistant CAMA. Comment puis-je vous aider ?" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { style: dragStyle, bind } = useDragOffset("cama.fab.assistant");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "bot", text: getAnswer(q) }]);
    }, 900 + Math.random() * 600);
  }

  return (
    <>
      {/* MINI CHAT */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[340px] bg-white rounded-3xl shadow-2xl border border-border overflow-hidden animate-scale-in flex flex-col" style={{ maxHeight: "480px", ...dragStyle }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-cama to-indigo-700 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-bold leading-none">Assistant CAMA</p>
              <p className="text-white/60 text-[10px] mt-0.5">Toujours disponible · Basé sur le contenu CAMA</p>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/guide" className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors" title="Guide complet">
                <ExternalLink className="w-3.5 h-3.5 text-white/70" />
              </Link>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors">
                <Minimize2 className="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9FAFB]" style={{ minHeight: 0 }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-cama flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-cama text-white rounded-tr-sm"
                    : "bg-white text-ink border border-border rounded-tl-sm"
                }`}>
                  {m.text.split("**").map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-cama flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map((k) => (
                    <span key={k} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${k * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {msgs.length <= 1 && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-white border-t border-border">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-[10px] bg-cama/8 text-cama border border-cama/20 rounded-full px-2.5 py-1 hover:bg-cama/15 transition-colors font-medium">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-border flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Posez une question…"
              className="flex-1 text-xs bg-[#F9FAFB] border border-border rounded-xl px-3 py-2.5 outline-none focus:border-cama transition-colors"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-cama hover:bg-cama-700 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        {...bind}
        style={dragStyle}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-cama hover:bg-cama-700 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
        aria-label="Ouvrir l'assistant CAMA"
        title="Assistant CAMA — glisser pour déplacer">
        <div className="absolute inset-0 rounded-full bg-cama animate-ping opacity-30" />
        {open
          ? <X className="w-6 h-6 text-white relative z-10" />
          : <MessageCircle className="w-6 h-6 text-white relative z-10" />}
      </button>
    </>
  );
}
