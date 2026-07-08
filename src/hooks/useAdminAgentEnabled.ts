"use client";

import { useEffect, useState } from "react";

/* Flag d'activation de l'Agent d'administration (par appareil, admin).
   Persistant dans localStorage et synchronisé entre onglets/composants
   via un évènement personnalisé. */
const KEY = "cama.admin.agent";
const EVT = "cama:admin-agent-toggle";

export function useAdminAgentEnabled(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try { setEnabled(localStorage.getItem(KEY) === "1"); } catch { /* ignore */ }
    const onChange = () => {
      try { setEnabled(localStorage.getItem(KEY) === "1"); } catch { /* ignore */ }
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const set = (v: boolean) => {
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
    setEnabled(v);
    try { window.dispatchEvent(new Event(EVT)); } catch { /* ignore */ }
  };

  return [enabled, set];
}
