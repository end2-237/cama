/* Écran d'attente affiché par Next.js pendant le chargement d'une route
   (Suspense de segment). Loader CAMA « Mirage » — cohérent partout. */
import { CamaScreenLoader } from "@/components/CamaLoader";

export default function Loading() {
  return <CamaScreenLoader label="Chargement de la page" />;
}
