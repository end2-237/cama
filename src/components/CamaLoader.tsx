"use client";

/* ════════════════════════════════════════════════════════════
   LOADER CAMA — animation « Mirage » (ldrs) aux couleurs de la marque.

   Usage volontairement ciblé sur les points STRATÉGIQUES :
   • chargement d'une page (auth / route protégée),
   • chargement du tableau de bord,
   • opérations asynchrones lourdes qui bloquent l'écran.

   Deux formes :
   • <CamaLoader />            — inline, à placer où l'on veut.
   • <CamaScreenLoader />      — plein écran, centré, pour les pages.
════════════════════════════════════════════════════════════ */
import { Mirage } from "ldrs/react";
import "ldrs/react/Mirage.css";

/* Indigo CAMA — contrôlé, sobre. */
const CAMA_COLOR = "#4F46E5";

type Props = {
  /** Taille de l'animation en px (défaut 66). */
  size?: number;
  /** Texte épuré affiché sous le loader. */
  label?: string;
  /** Retire le texte si false. */
  showLabel?: boolean;
  className?: string;
};

/** Loader inline (animation + libellé stylé dessous). */
export function CamaLoader({
  size = 66,
  label = "Chargement…",
  showLabel = true,
  className = "",
}: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Mirage size={String(size)} speed="2.5" color={CAMA_COLOR} />
      {showLabel && (
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-subtle select-none">
          {label}
        </p>
      )}
    </div>
  );
}

/** Loader plein écran — pour le rendu d'attente d'une page/route. */
export function CamaScreenLoader({
  label = "Chargement…",
  size = 66,
}: Pick<Props, "label" | "size">) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB]">
      <CamaLoader size={size} label={label} />
    </div>
  );
}

export default CamaLoader;
