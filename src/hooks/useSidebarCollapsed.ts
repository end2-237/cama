"use client";

import { useEffect, useState } from "react";

/* État rétracté/déplié d'une colonne latérale du dashboard, mémorisé en
   localStorage (par clé). Par défaut déplié ; le choix de l'utilisateur
   est conservé entre les visites. */
export function useSidebarCollapsed(storageKey: string): [boolean, () => void, (v: boolean) => void] {
  const key = `cama.sidebar.${storageKey}`;
  const [collapsed, setCollapsed] = useState(false);

  // Restaure l'état au montage (évite le mismatch d'hydratation en lisant après montage).
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key);
      if (v != null) setCollapsed(v === "1");
    } catch { /* stockage indisponible */ }
  }, [key]);

  const set = (v: boolean) => {
    setCollapsed(v);
    try { window.localStorage.setItem(key, v ? "1" : "0"); } catch { /* ignore */ }
  };
  const toggle = () => set(!collapsed);

  return [collapsed, toggle, set];
}
