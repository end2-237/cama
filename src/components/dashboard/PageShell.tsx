"use client";

import { type ComponentType, type ReactNode } from "react";
import DashNav from "@/components/dashboard/DashNav";

/* ────────────────────────────────────────────────────────────
   PageShell — coquille commune à toutes les pages du dashboard.
   • Bandeau supérieur fin (48px) : breadcrumb + contexte (remplit
     l'espace, cohérent avec le dashboard).
   • La MÊME barre de navigation (DashNav) que le dashboard.
   • Un en-tête de page riche : icône, titre, sous-titre, actions
     et bandeau de statistiques optionnel — pour éviter les navs vides.
──────────────────────────────────────────────────────────── */

export interface PageStat {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "cama" | "gold" | "green" | "ink";
}

const ACCENT: Record<NonNullable<PageStat["accent"]>, string> = {
  cama:  "text-cama",
  gold:  "text-gold-dark",
  green: "text-green-700",
  ink:   "text-ink",
};

export default function PageShell({
  title,
  subtitle,
  icon: Icon,
  breadcrumb,
  context,
  actions,
  stats,
  children,
  maxWidth = "max-w-[1400px]",
}: {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  breadcrumb?: ReactNode;
  context?: ReactNode;
  actions?: ReactNode;
  stats?: PageStat[];
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <>
      {/* Bandeau supérieur fin — breadcrumb + contexte */}
      <div className="fixed top-0 inset-x-0 h-12 z-50 text-white"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 55%, #4F46E5 100%)" }}>
        <div className={`${maxWidth} mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between`}>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-white/85 truncate">
            <span className="font-black tracking-tight">CA<span className="text-gold">MA</span></span>
            <span className="text-white/40">/</span>
            <span className="truncate">{breadcrumb ?? title}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
            {context ?? "Institut JFN · Cameroun"}
          </div>
        </div>
      </div>

      {/* La barre de navigation commune */}
      <DashNav tabs={[]} activeTab="" onTab={() => {}} />

      <div className="pt-[112px] min-h-screen bg-surface">
        {/* En-tête de page riche */}
        <div className="bg-white border-b border-border">
          <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4 flex-wrap`}>
            {Icon && (
              <div className="w-11 h-11 bg-cama-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-cama" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-black text-ink tracking-tight leading-tight">{title}</h1>
              {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex-1" />
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          </div>

          {/* Bandeau de statistiques */}
          {stats && stats.length > 0 && (
            <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 pb-4`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 border border-border divide-x divide-border bg-white">
                {stats.map((s, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className={`text-[22px] font-black leading-none tabular-nums ${ACCENT[s.accent ?? "ink"]}`}>{s.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1.5">{s.label}</p>
                    {s.hint && <p className="text-[10px] text-subtle mt-0.5">{s.hint}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>{children}</div>
      </div>
    </>
  );
}
