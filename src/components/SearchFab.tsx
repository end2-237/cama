"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/* Bouton d'action flottant — raccourci vers CAMA Search.
   Posé en bas à gauche (la droite est occupée par l'assistant IA
   et le dock discussions). Ctrl+K ouvre aussi le moteur. */
export default function SearchFab() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/recherche");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <button
      onClick={() => router.push("/recherche")}
      title="Ouvrir CAMA Search (Ctrl+K)"
      className="fixed bottom-5 left-5 z-50 group/fab flex items-center h-14 rounded-full
                 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95
                 pl-[18px] pr-[18px] hover:pr-5 overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg, #4F46E5 0%, #312E81 100%)" }}
    >
      {/* halo animé */}
      <span className="absolute inset-0 rounded-full animate-pulse-ring pointer-events-none" />

      <Search className="w-5 h-5 flex-shrink-0" />

      {/* label qui se déploie au survol */}
      <span className="max-w-0 opacity-0 group-hover/fab:max-w-[180px] group-hover/fab:opacity-100 group-hover/fab:ml-2.5
                       overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-bold">
        CAMA <span className="text-gold">Search</span>
      </span>
      <kbd className="max-w-0 opacity-0 group-hover/fab:max-w-[60px] group-hover/fab:opacity-100 group-hover/fab:ml-2
                      overflow-hidden whitespace-nowrap transition-all duration-300
                      text-[9px] font-mono bg-white/15 border border-white/25 px-1.5 py-0.5 rounded">
        Ctrl K
      </kbd>
    </button>
  );
}
