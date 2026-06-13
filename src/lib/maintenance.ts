/* ════════════════════════════════════════════════════════════
   CAMA — État du mode maintenance (persisté en localStorage)
   Piloté par l'admin (Paramètres → Système → Mode maintenance).
════════════════════════════════════════════════════════════ */

export interface MaintenanceState {
  on: boolean;
  since?: number;   // timestamp d'activation
  until?: number;   // retour estimé
}

const KEY = "cama_maintenance";
const WINDOW_MIN = 90; // fenêtre estimée par défaut

export function getMaintenance(): MaintenanceState {
  if (typeof window === "undefined") return { on: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as MaintenanceState;
  } catch { /* ignore */ }
  return { on: false };
}

export function setMaintenance(on: boolean) {
  const state: MaintenanceState = on
    ? { on: true, since: Date.now(), until: Date.now() + WINDOW_MIN * 60_000 }
    : { on: false };
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("cama-maintenance"));
}
