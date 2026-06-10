"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useDragOffset } from "@/hooks/useDragOffset";

/* Bouton d'action flottant — raccourci vers CAMA Search.
   Petit, or mat discret, icône centrée au repos, label au survol.
   Déplaçable sur l'écran (position mémorisée). Ctrl+K ouvre aussi le moteur. */
export default function SearchFab() {
  const router = useRouter();
  const { style, bind } = useDragOffset();

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
      {...bind}
      style={style}
      onClick={() => router.push("/recherche")}
      title="CAMA Search (Ctrl+K) — glisser pour déplacer"
      className="fixed bottom-5 left-5 z-50 group/fab flex items-center justify-center h-10 min-w-[40px]
                 rounded-full bg-[#C9A227]/85 hover:bg-[#B8901F] text-white/95 shadow-md hover:shadow-lg
                 transition-[background-color,box-shadow,max-width] duration-300 active:scale-95
                 overflow-hidden px-0 hover:px-3 max-w-[40px] hover:max-w-[200px] touch-none cursor-grab active:cursor-grabbing"
    >
      <Search className="w-[17px] h-[17px] flex-shrink-0" />
      <span className="max-w-0 opacity-0 group-hover/fab:max-w-[130px] group-hover/fab:opacity-100 group-hover/fab:ml-2
                       overflow-hidden whitespace-nowrap transition-all duration-300 text-xs font-bold">
        CAMA Search
      </span>
      <kbd className="max-w-0 opacity-0 group-hover/fab:max-w-[50px] group-hover/fab:opacity-100 group-hover/fab:ml-1.5
                      overflow-hidden whitespace-nowrap transition-all duration-300
                      text-[8px] font-mono bg-white/20 px-1 py-0.5 rounded">
        Ctrl K
      </kbd>
    </button>
  );
}
