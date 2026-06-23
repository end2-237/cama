"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Info } from "lucide-react";

const messages = [
  "Bienvenue sur CAMA — la plateforme académique de l'Institut JFN.",
  "Utilisez les onglets ci-dessous pour naviguer entre vos fonctionnalités.",
];

export default function Banner() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] flex items-center justify-between px-6 py-3 text-white text-sm"
      style={{ background: "linear-gradient(90deg, #1E1B4B 0%, #4F46E5 50%, #2D2A6E 100%)" }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p className="text-white/80 truncate">{messages[idx]}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        {messages.length > 1 && (
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
        )}
        <button onClick={() => setVisible(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
