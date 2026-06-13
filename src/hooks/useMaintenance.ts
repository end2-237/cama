"use client";

import { useEffect, useState } from "react";
import { getMaintenance, MaintenanceState } from "@/lib/maintenance";

/* Hook réactif : suit l'état du mode maintenance (même onglet + cross-tab). */
export function useMaintenance(): MaintenanceState {
  const [state, setState] = useState<MaintenanceState>({ on: false });

  useEffect(() => {
    const sync = () => setState(getMaintenance());
    sync();
    window.addEventListener("cama-maintenance", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cama-maintenance", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}
