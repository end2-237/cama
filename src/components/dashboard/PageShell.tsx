"use client";

import { type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import DashNav from "@/components/dashboard/DashNav";

/* Libellés des groupes (1er segment de l'URL) pour le fil d'Ariane */
const GROUP_LABELS: Record<string, string> = {
  admin:      "Administration",
  etudiant:   "Espace étudiant",
  enseignant: "Espace enseignant",
  jury:       "Jury",
};

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
  const pathname = usePathname() ?? "";
  const seg = pathname.split("/").filter(Boolean);
  const groupLabel = GROUP_LABELS[seg[0] ?? ""];
  // Fil d'Ariane : Dashboard › [Groupe] › Page courante (façon explorateur)
  const trail: { label: ReactNode; href?: string }[] = [{ label: "Dashboard", href: "/dashboard" }];
  if (groupLabel) trail.push({ label: groupLabel });
  trail.push({ label: breadcrumb ?? title });

  return (
    <>
      {/* Bandeau supérieur fin — fil d'Ariane cliquable + contexte */}
      <div className="fixed top-0 inset-x-0 h-12 z-50 text-white"
        style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #3730A3 55%, #4F46E5 100%)" }}>
        <div className={`${maxWidth} mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between`}>
          <nav className="flex items-center gap-1 text-[11px] font-semibold min-w-0" aria-label="Fil d'Ariane">
            {trail.map((c, i) => {
              const last = i === trail.length - 1;
              return (
                <span key={i} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-white/40 flex-shrink-0" />}
                  {c.href && !last ? (
                    <Link href={c.href} className="flex items-center gap-1 text-white/70 hover:text-white hover:underline transition-colors flex-shrink-0">
                      {i === 0 && <LayoutDashboard className="w-3.5 h-3.5" />}
                      {c.label}
                    </Link>
                  ) : (
                    <span className={`truncate ${last ? "text-white font-bold" : "text-white/70"}`}>{c.label}</span>
                  )}
                </span>
              );
            })}
          </nav>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60 flex-shrink-0 ml-3">
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
