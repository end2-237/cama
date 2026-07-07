"use client";

import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

/* Colonne latérale rétractable du dashboard.
   • Sur mobile (< lg) : une barre d'en-tête permet de replier/déplier la
     colonne ; l'état est mémorisé (localStorage) par `storageKey`.
   • Sur desktop (≥ lg) : la colonne est toujours affichée, l'en-tête de
     repli est masqué — la mise en page desktop reste inchangée. */
export default function CollapsibleAside({
  storageKey,
  title,
  children,
}: {
  storageKey: string;
  title: string;
  children: ReactNode;
}) {
  const [collapsed, toggle] = useSidebarCollapsed(storageKey);

  return (
    <div>
      {/* En-tête de repli — mobile uniquement */}
      <button
        onClick={toggle}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 border-b border-border bg-white sticky top-[112px] z-30"
        aria-expanded={!collapsed}>
        <span className="text-[11px] font-black uppercase tracking-widest text-ink">{title}</span>
        <ChevronDown className={`w-4 h-4 text-cama transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {/* Contenu : masqué sur mobile si replié ; toujours visible sur desktop */}
      <div className={collapsed ? "hidden lg:block" : "block"}>
        {children}
      </div>
    </div>
  );
}
