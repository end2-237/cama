"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const messages = [
  "Rappel : vérifiez votre nom de profil avant la fin de session. Il apparaîtra sur votre certificat.",
  "Nouveauté : les examens de la session 2024-2025 sont maintenant disponibles — Bonne chance !",
  "Mise à jour : le module INF302 a été mis à jour. Rechargez vos cours pour voir les changements.",
];

export default function Banner() {
  const [idx,     setIdx]     = useState(0);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] flex items-center justify-between px-6 py-3 text-white text-sm"
      style={{ background: "linear-gradient(90deg, #1E1B4B 0%, #4F46E5 50%, #2D2A6E 100%)" }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="font-bold flex-shrink-0">Annonces</span>
        <p className="text-white/80 truncate">{messages[idx]}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <button className="border border-white/40 rounded-full px-3 py-1 text-xs font-semibold hover:bg-white/10 transition-colors">
          Lire plus
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setIdx((idx - 1 + messages.length) % messages.length)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-white/60 w-8 text-center">{idx + 1}/{messages.length}</span>
          <button onClick={() => setIdx((idx + 1) % messages.length)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="w-px h-5 bg-white/20" />
        <button onClick={() => setVisible(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
