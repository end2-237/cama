"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/* Page fusionnée : la gestion des examens vit désormais dans le tableau de
   bord enseignant, onglet « Évaluations ». On y redirige. */
export default function TeacherExamsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard?tab=" + encodeURIComponent("Évaluations"));
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 className="w-6 h-6 animate-spin text-cama" />
    </div>
  );
}
