"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* Chemins publics accessibles sans dossier validé.
   Tout étudiant non validé accédant ailleurs est renvoyé vers /onboarding. */
const PUBLIC_PREFIXES = [
  "/onboarding",
  "/auth",
  "/maintenance",
  "/verifier",
  "/parcours",
  "/guide",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Redirige tout étudiant dont le dossier n'est pas « validee » vers /onboarding. */
export default function StudentGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "etudiant") return;                 // n'impacte pas admin/enseignant/jury
    if (user.dossier?.status === "validee") return;        // étudiant validé : accès normal
    if (isPublicPath(pathname)) return;                    // déjà sur un chemin public / onboarding
    router.replace("/onboarding");
  }, [loading, user, pathname, router]);

  return null;
}
